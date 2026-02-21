"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PrestadoresService } from "../../services/prestadores-service"
import { supabase } from "@/lib/supabase"

export default function TesteSupabase() {
  const [documento, setDocumento] = useState("424946968")
  const [resultado, setResultado] = useState<any>(null)
  const [logs, setLogs] = useState<string[]>([])
  const [carregando, setCarregando] = useState(false)

  const adicionarLog = (mensagem: string) => {
    console.log(mensagem)
    setLogs((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${mensagem}`])
  }

  const testarConexaoSupabase = async () => {
    setCarregando(true)
    setLogs([])
    setResultado(null)

    try {
      adicionarLog("🔍 INICIANDO TESTE DE CONEXÃO SUPABASE")

      // 1. Testar conexão básica
      adicionarLog("📡 Testando conexão básica com Supabase...")
      const { data: testConnection, error: connectionError } = await supabase
        .from("prestadores")
        .select("count", { count: "exact" })
        .limit(1)

      if (connectionError) {
        adicionarLog(`❌ ERRO DE CONEXÃO: ${connectionError.message}`)
        return
      }

      adicionarLog(`✅ Conexão OK! Total de registros: ${testConnection?.length || 0}`)

      // 2. Testar busca direta no Supabase
      adicionarLog("🔍 Testando busca direta no Supabase...")
      const { data: prestadores, error: searchError } = await supabase.from("prestadores").select(`
          documento,
          documento2,
          nome,
          checagem_valida_ate,
          status,
          data_avaliacao
        `)

      if (searchError) {
        adicionarLog(`❌ ERRO NA BUSCA: ${searchError.message}`)
        return
      }

      adicionarLog(`✅ Busca OK! Total encontrado: ${prestadores?.length || 0}`)

      if (prestadores && prestadores.length > 0) {
        adicionarLog(`📊 Primeiros 3 registros:`)
        prestadores.slice(0, 3).forEach((p, i) => {
          adicionarLog(
            `   ${i + 1}. Nome: ${p.nome} | Doc1: ${p.documento} | Doc2: ${p.documento2 || "N/A"} | Status: ${p.status}`,
          )
        })
      }

      // 3. Buscar especificamente o documento 424946968
      adicionarLog(`🎯 Buscando especificamente documento: ${documento}`)
      const documentoLimpo = documento.replace(/\D/g, "")

      const prestadorEncontrado = prestadores?.find((p) => {
        const doc1Limpo = p.documento ? p.documento.replace(/\D/g, "") : ""
        const doc2Limpo = p.documento2 ? p.documento2.replace(/\D/g, "") : ""
        return doc1Limpo === documentoLimpo || doc2Limpo === documentoLimpo
      })

      if (prestadorEncontrado) {
        adicionarLog(`✅ PRESTADOR ENCONTRADO!`)
        adicionarLog(`   Nome: ${prestadorEncontrado.nome}`)
        adicionarLog(`   Doc1: ${prestadorEncontrado.documento}`)
        adicionarLog(`   Doc2: ${prestadorEncontrado.documento2 || "N/A"}`)
        adicionarLog(`   Status: ${prestadorEncontrado.status}`)
        setResultado(prestadorEncontrado)
      } else {
        adicionarLog(`❌ Prestador com documento ${documento} NÃO ENCONTRADO`)
      }

      // 4. Testar usando o serviço
      adicionarLog("🔧 Testando usando PrestadoresService...")
      const resultadoServico = await PrestadoresService.consultarPrestadorPorDocumento(documento)

      if (resultadoServico) {
        adicionarLog(`✅ SERVIÇO FUNCIONOU!`)
        adicionarLog(`   Nome: ${resultadoServico.nome}`)
        adicionarLog(`   Status: ${resultadoServico.status}`)
      } else {
        adicionarLog(`❌ SERVIÇO RETORNOU NULL`)
      }
    } catch (error) {
      adicionarLog(`💥 ERRO GERAL: ${error}`)
    } finally {
      setCarregando(false)
    }
  }

  const verificarVariaveisAmbiente = () => {
    setLogs([])
    adicionarLog("🔧 VERIFICANDO VARIÁVEIS DE AMBIENTE:")

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    adicionarLog(`SUPABASE_URL: ${supabaseUrl ? "✅ Definida" : "❌ NÃO DEFINIDA"}`)
    adicionarLog(`SUPABASE_ANON_KEY: ${supabaseKey ? "✅ Definida" : "❌ NÃO DEFINIDA"}`)

    if (supabaseUrl) {
      adicionarLog(`URL: ${supabaseUrl.substring(0, 30)}...`)
    }
    if (supabaseKey) {
      adicionarLog(`KEY: ${supabaseKey.substring(0, 20)}...`)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">🔍 TESTE DE CONEXÃO SUPABASE</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="documento">Documento para testar:</Label>
              <Input
                id="documento"
                value={documento}
                onChange={(e) => setDocumento(e.target.value)}
                placeholder="Digite o documento"
              />
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={testarConexaoSupabase} disabled={carregando} className="bg-blue-600 hover:bg-blue-700">
                {carregando ? "Testando..." : "🔍 Testar Supabase"}
              </Button>
              <Button onClick={verificarVariaveisAmbiente} variant="outline">
                🔧 Ver Variáveis
              </Button>
            </div>
          </div>

          {logs.length > 0 && (
            <Alert className="border-blue-200 bg-blue-50">
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-semibold text-blue-800">📋 LOGS DO TESTE:</p>
                  <div className="bg-white p-3 rounded border max-h-96 overflow-y-auto">
                    {logs.map((log, index) => (
                      <div key={index} className="text-sm font-mono text-slate-700">
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {resultado && (
            <Alert className="border-green-200 bg-green-50">
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-semibold text-green-800">✅ PRESTADOR ENCONTRADO:</p>
                  <div className="bg-white p-3 rounded border">
                    <p>
                      <strong>Nome:</strong> {resultado.nome}
                    </p>
                    <p>
                      <strong>Documento:</strong> {resultado.documento}
                    </p>
                    <p>
                      <strong>Documento2:</strong> {resultado.documento2 || "N/A"}
                    </p>
                    <p>
                      <strong>Status:</strong> {resultado.status}
                    </p>
                    <p>
                      <strong>Validade:</strong> {resultado.checagem_valida_ate || "N/A"}
                    </p>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
