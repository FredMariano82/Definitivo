"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PlusIcon, TrashIcon } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { ImageUpload } from "@/components/ui/image-upload"

const kanbanSchema = z.object({
  titulo: z.string().min(3, "O título deve ter no mínimo 3 caracteres."),
  descricao: z.string().optional(),
  foto_url: z.string().optional(),
  categoria: z.enum(["imagem", "os", "ocorrencia", "autorizacao_chaves", "achados_perdidos", "eventos", "uniforme"], {
    required_error: "Selecione uma categoria.",
  }),
  // Campos dinâmicos (Imagem)
  data_hora_evento: z.string().optional(),
  cameras_solicitadas: z.string().optional(),
  solicitante: z.string().optional(),
  // Campos dinâmicos (OS)
  local_bloco: z.string().optional(),
  patrimonio: z.string().optional(),
  prioridade: z.string().optional(),
  // Campos dinâmicos (Autorização de Chaves)
  pessoas_autorizadas: z.array(z.string()).optional(),
  chaves_autorizadas: z.array(z.object({ nome: z.string(), tipo: z.enum(['amarela', 'prata']) })).optional(),
  // Campos dinâmicos (Achados e Perdidos)
  local_encontro: z.string().optional(),
  descricao_pertence: z.string().optional(),
  foto_pertence_url: z.string().optional(), // Will store URL later
  // Campos dinâmicos (Eventos)
  local_evento: z.string().optional(),
  vigilantes_escalados: z.array(z.string()).optional(),
  data_hora_inicio_montagem: z.string().optional(),
  data_hora_inicio_evento: z.string().optional(),
  data_hora_fim_evento: z.string().optional(),
  data_hora_desmontagem: z.string().optional(),
  publico_estimado: z.string().optional(),
  foto_evento_url: z.string().optional(),
  // Campos dinâmicos (Uniforme)
  tipo_acao_uniforme: z.enum(['retirada', 'troca', 'devolucao']).optional(),
  peca_uniforme: z.string().optional(),
  tamanho_atual: z.string().optional(),
  tamanho_novo: z.string().optional(),
})

type KanbanFormValues = z.infer<typeof kanbanSchema>

interface KanbanFormProps {
  onSuccess?: () => void;
  defaultValues?: Partial<KanbanFormValues>;
}

export function KanbanForm({ onSuccess, defaultValues }: KanbanFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { usuario } = useAuth()

  const form = useForm<KanbanFormValues>({
    resolver: zodResolver(kanbanSchema),
    defaultValues: {
      titulo: defaultValues?.titulo || "",
      descricao: defaultValues?.descricao || "",
      foto_url: defaultValues?.foto_url || "",
      categoria: defaultValues?.categoria || "ocorrencia",
      data_hora_evento: defaultValues?.data_hora_evento || "",
      cameras_solicitadas: defaultValues?.cameras_solicitadas || "",
      solicitante: defaultValues?.solicitante || "",
      local_bloco: defaultValues?.local_bloco || "",
      patrimonio: defaultValues?.patrimonio || "",
      prioridade: defaultValues?.prioridade || "",
      pessoas_autorizadas: defaultValues?.pessoas_autorizadas || [],
      chaves_autorizadas: defaultValues?.chaves_autorizadas || [],
      local_encontro: defaultValues?.local_encontro || "",
      descricao_pertence: defaultValues?.descricao_pertence || "",
      foto_pertence_url: defaultValues?.foto_pertence_url || "",
      local_evento: defaultValues?.local_evento || "",
      vigilantes_escalados: defaultValues?.vigilantes_escalados || [],
      data_hora_inicio_montagem: defaultValues?.data_hora_inicio_montagem || "",
      data_hora_inicio_evento: defaultValues?.data_hora_inicio_evento || "",
      data_hora_fim_evento: defaultValues?.data_hora_fim_evento || "",
      data_hora_desmontagem: defaultValues?.data_hora_desmontagem || "",
      publico_estimado: defaultValues?.publico_estimado || "",
      foto_evento_url: defaultValues?.foto_evento_url || "",
      tipo_acao_uniforme: defaultValues?.tipo_acao_uniforme || "retirada",
      peca_uniforme: defaultValues?.peca_uniforme || "",
      tamanho_atual: defaultValues?.tamanho_atual || "",
      tamanho_novo: defaultValues?.tamanho_novo || "",
    },
  })

  // Watch selected category to render dynamic fields
  const categoria = form.watch("categoria")

  async function onSubmit(data: KanbanFormValues) {
    setIsSubmitting(true)
    try {
      // Separando campos padrão dos dados específicos
      const { titulo, descricao, categoria, foto_url, ...rest } = data;
      
      let dados_especificos = {};
      
      if (categoria === 'imagem') {
        dados_especificos = {
          data_hora_evento: rest.data_hora_evento,
          cameras_solicitadas: rest.cameras_solicitadas,
          solicitante: rest.solicitante
        };
      } else if (categoria === 'os') {
        dados_especificos = {
          local_bloco: rest.local_bloco,
          patrimonio: rest.patrimonio,
          prioridade: rest.prioridade
        };
      } else if (categoria === 'autorizacao_chaves') {
        dados_especificos = {
          pessoas_autorizadas: rest.pessoas_autorizadas,
          chaves_autorizadas: rest.chaves_autorizadas
        };
      } else if (categoria === 'achados_perdidos') {
        dados_especificos = {
          local_encontro: rest.local_encontro,
          descricao_pertence: rest.descricao_pertence,
          foto_pertence_url: rest.foto_pertence_url
        };
      } else if (categoria === 'eventos') {
        dados_especificos = {
          local_evento: rest.local_evento,
          vigilantes_escalados: rest.vigilantes_escalados,
          data_hora_inicio_montagem: rest.data_hora_inicio_montagem,
          data_hora_inicio_evento: rest.data_hora_inicio_evento,
          data_hora_fim_evento: rest.data_hora_fim_evento,
          data_hora_desmontagem: rest.data_hora_desmontagem,
          publico_estimado: rest.publico_estimado,
          foto_evento_url: rest.foto_evento_url
        };
      } else if (categoria === 'uniforme') {
        dados_especificos = {
          tipo_acao_uniforme: rest.tipo_acao_uniforme,
          peca_uniforme: rest.peca_uniforme,
          ...(rest.tipo_acao_uniforme === 'troca' ? {
            tamanho_atual: rest.tamanho_atual,
            tamanho_novo: rest.tamanho_novo
          } : {})
        };
      }
      
      const { error } = await supabase
        .from('kanban_tarefas')
        .insert([
          {
            titulo,
            descricao,
            categoria,
            foto_url,
            status: 'entrada', // Status padrão na criação
            dados_especificos,
            created_by_name: usuario?.nome || 'Usuário Desconhecido',
            updated_by_name: usuario?.nome || 'Usuário Desconhecido'
          }
        ])

      if (error) throw error;

      toast.success("Tarefa criada com sucesso no Kanban!")
      form.reset()
      if (onSuccess) onSuccess()
      
    } catch (error: any) {
      console.error("Erro ao criar tarefa Kanban:", error)
      toast.error(error.message || "Ocorreu um erro ao criar a tarefa.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="foto_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Foto do Registro (Opcional)</FormLabel>
              <FormControl>
                <ImageUpload 
                  value={field.value} 
                  onChange={field.onChange} 
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="titulo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título da Tarefa</FormLabel>
              <FormControl>
                <Input placeholder="Resumo do que precisa ser feito..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="categoria"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoria</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="ocorrencia">Ocorrência Padrão</SelectItem>
                    <SelectItem value="imagem">Busca de Imagem / CFTV</SelectItem>
                    <SelectItem value="os">Ordem de Serviço (OS)</SelectItem>
                    <SelectItem value="autorizacao_chaves">Autorização de Chaves</SelectItem>
                    <SelectItem value="achados_perdidos">Achados e Perdidos</SelectItem>
                    <SelectItem value="eventos">Eventos</SelectItem>
                    <SelectItem value="uniforme">Uniforme</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Define os campos específicos que serão solicitados.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* --- CAMPOS CAMALEÃO: IMAGEM --- */}
        {categoria === "imagem" && (
          <div className="space-y-4 p-4 border rounded-md bg-muted/30">
            <h4 className="font-medium text-sm text-muted-foreground mb-4">Informações da Busca de Imagem</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="data_hora_evento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data e Hora do Evento Aproximada</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="solicitante"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Solicitante</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome de quem solicitou a imagem" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="cameras_solicitadas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Câmeras e Locais Específicos</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Quais câmeras focar? (Ex: Portaria Principal, Refeitório Vestiário)" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {/* --- CAMPOS CAMALEÃO: OS --- */}
        {categoria === "os" && (
          <div className="space-y-4 p-4 border rounded-md bg-muted/30">
            <h4 className="font-medium text-sm text-muted-foreground mb-4">Informações da Ordem de Serviço</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="local_bloco"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Local / Bloco / Unidade</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Bloco B, Térreo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="prioridade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prioridade</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="baixa">Baixa</SelectItem>
                        <SelectItem value="media">Média</SelectItem>
                        <SelectItem value="alta">Alta</SelectItem>
                        <SelectItem value="urgente">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="patrimonio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nº do Patrimônio ou Equipamento</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Câmera CAM-04, Catraca 2..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {/* --- CAMPOS CAMALEÃO: AUTORIZAÇÃO DE CHAVES --- */}
        {categoria === "autorizacao_chaves" && (
          <div className="space-y-4 p-4 border rounded-md bg-muted/30">
            <h4 className="font-medium text-sm text-muted-foreground mb-4">Autorização de Chaves</h4>
            
            <div className="space-y-2">
              <FormLabel>Pessoas Autorizadas</FormLabel>
              {form.watch("pessoas_autorizadas")?.map((_, index) => (
                <div key={index} className="flex gap-2">
                  <Input 
                    placeholder="Nome completo ou RG" 
                    value={form.watch(`pessoas_autorizadas.${index}`)}
                    onChange={(e) => {
                      const newPessoas = [...(form.watch("pessoas_autorizadas") || [])];
                      newPessoas[index] = e.target.value;
                      form.setValue("pessoas_autorizadas", newPessoas);
                    }}
                  />
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon"
                    onClick={() => {
                      const newPessoas = [...(form.watch("pessoas_autorizadas") || [])];
                      newPessoas.splice(index, 1);
                      form.setValue("pessoas_autorizadas", newPessoas);
                    }}
                  ><TrashIcon className="w-4 h-4 text-destructive" /></Button>
                </div>
              ))}
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                className="w-full mt-2"
                onClick={() => form.setValue("pessoas_autorizadas", [...(form.watch("pessoas_autorizadas") || []), ""])}
              >
                <PlusIcon className="w-4 h-4 mr-2" /> Adicionar Pessoa
              </Button>
            </div>

            <div className="space-y-2 mt-4">
              <FormLabel>Chaves Autorizadas</FormLabel>
              {form.watch("chaves_autorizadas")?.map((chave, index) => (
                <div key={index} className="flex gap-2">
                  <Input 
                    placeholder="Ex: Sala TI, Almoxarifado" 
                    value={chave.nome}
                    onChange={(e) => {
                      const newChaves = [...(form.watch("chaves_autorizadas") || [])];
                      newChaves[index] = { ...newChaves[index], nome: e.target.value };
                      form.setValue("chaves_autorizadas", newChaves);
                    }}
                    className="flex-1"
                  />
                  <Select 
                    value={chave.tipo}
                    onValueChange={(value: "amarela" | "prata") => {
                      const newChaves = [...(form.watch("chaves_autorizadas") || [])];
                      newChaves[index] = { ...newChaves[index], tipo: value };
                      form.setValue("chaves_autorizadas", newChaves);
                    }}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="amarela">Amarela</SelectItem>
                      <SelectItem value="prata">Prata</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon"
                    onClick={() => {
                      const newChaves = [...(form.watch("chaves_autorizadas") || [])];
                      newChaves.splice(index, 1);
                      form.setValue("chaves_autorizadas", newChaves);
                    }}
                  ><TrashIcon className="w-4 h-4 text-destructive" /></Button>
                </div>
              ))}
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                className="w-full mt-2"
                onClick={() => form.setValue("chaves_autorizadas", [...(form.watch("chaves_autorizadas") || []), { nome: "", tipo: "prata" }])}
              >
                <PlusIcon className="w-4 h-4 mr-2" /> Adicionar Chave
              </Button>
            </div>
          </div>
        )}

        {/* --- CAMPOS CAMALEÃO: ACHADOS E PERDIDOS --- */}
        {categoria === "achados_perdidos" && (
          <div className="space-y-4 p-4 border rounded-md bg-muted/30">
            <h4 className="font-medium text-sm text-muted-foreground mb-4">Achados e Perdidos</h4>
            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="local_encontro"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Local Exato Onde Foi Encontrado</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Cadeira 15 arquibancada sul" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="descricao_pertence"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição Detalhada do Pertence</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Marca, cor, itens dentro (se bolsa/carteira)..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* File Upload Placeholder */}
              <div className="border-2 border-dashed rounded-md p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors">
                <p className="text-sm text-muted-foreground">O envio de fotos será implementado em breve com o Storage Bucket.</p>
                <Button type="button" variant="secondary" size="sm" className="mt-2" disabled>Anexar Imagem (Em breve)</Button>
              </div>
            </div>
          </div>
        )}

        {/* --- CAMPOS CAMALEÃO: EVENTOS --- */}
        {categoria === "eventos" && (
          <div className="space-y-4 p-4 border rounded-md bg-muted/30">
            <h4 className="font-medium text-sm text-muted-foreground mb-4">Gestão de Evento</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="local_evento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Local do Evento</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="salao_principal">Salão Principal</SelectItem>
                        <SelectItem value="piscina">Área da Piscina</SelectItem>
                        <SelectItem value="quadras">Quadras</SelectItem>
                        <SelectItem value="outro">Outro (especificar na descrição)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="publico_estimado"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Público Estimado</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 500 pessoas" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <FormField control={form.control} name="data_hora_inicio_montagem" render={({ field }) => (
                <FormItem><FormLabel>Início da Montagem</FormLabel><FormControl><Input type="datetime-local" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField control={form.control} name="data_hora_inicio_evento" render={({ field }) => (
                <FormItem><FormLabel>Início do Evento</FormLabel><FormControl><Input type="datetime-local" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField control={form.control} name="data_hora_fim_evento" render={({ field }) => (
                <FormItem><FormLabel>Fim do Evento</FormLabel><FormControl><Input type="datetime-local" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField control={form.control} name="data_hora_desmontagem" render={({ field }) => (
                <FormItem><FormLabel>Fim da Desmontagem</FormLabel><FormControl><Input type="datetime-local" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
            </div>

            <div className="space-y-2 mt-4">
              <FormLabel>Vigilantes Escalados</FormLabel>
              {form.watch("vigilantes_escalados")?.map((_, index) => (
                <div key={index} className="flex gap-2">
                  <Input 
                    placeholder="Nome do Vigilante / Posto" 
                    value={form.watch(`vigilantes_escalados.${index}`)}
                    onChange={(e) => {
                      const newVigilantes = [...(form.watch("vigilantes_escalados") || [])];
                      newVigilantes[index] = e.target.value;
                      form.setValue("vigilantes_escalados", newVigilantes);
                    }}
                  />
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon"
                    onClick={() => {
                      const newVigilantes = [...(form.watch("vigilantes_escalados") || [])];
                      newVigilantes.splice(index, 1);
                      form.setValue("vigilantes_escalados", newVigilantes);
                    }}
                  ><TrashIcon className="w-4 h-4 text-destructive" /></Button>
                </div>
              ))}
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                className="w-full mt-2"
                onClick={() => form.setValue("vigilantes_escalados", [...(form.watch("vigilantes_escalados") || []), ""])}
              >
                <PlusIcon className="w-4 h-4 mr-2" /> Adicionar Vigilante
              </Button>
            </div>
            
            {/* File Upload Placeholder */}
            <div className="border-2 border-dashed rounded-md p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors mt-4">
              <p className="text-sm text-muted-foreground">O envio de anexos/plantas será implementado em breve com o Storage Bucket.</p>
              <Button type="button" variant="secondary" size="sm" className="mt-2" disabled>Anexar Mapa (Em breve)</Button>
            </div>
          </div>
        )}

        {/* --- CAMPOS CAMALEÃO: UNIFORME --- */}
        {categoria === "uniforme" && (
          <div className="space-y-4 p-4 border rounded-md bg-muted/30">
            <h4 className="font-medium text-sm text-muted-foreground mb-4">Controle de Uniforme</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tipo_acao_uniforme"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ação</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="retirada">Retirada</SelectItem>
                        <SelectItem value="troca">Troca</SelectItem>
                        <SelectItem value="devolucao">Devolução</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="peca_uniforme"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item / Peça</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Calça, Bota, Gandola..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Campos de tamanho aparecem APENAS se for TROCA */}
            {form.watch("tipo_acao_uniforme") === "troca" && (
              <div className="grid grid-cols-2 gap-4 mt-2 p-3 bg-primary/5 rounded-lg border border-primary/10">
                <FormField
                  control={form.control}
                  name="tamanho_atual"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tamanho Atual (Dando Baixa)</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: M" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tamanho_novo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tamanho Novo (Recebendo)</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: G" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </div>
        )}

        {/* DESCRIÇÃO GERAL SEMPRE APARECE */}
        <FormField
          control={form.control}
          name="descricao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição Detalhada</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Forneça mais contexto sobre a tarefa..." 
                  className="min-h-[100px]"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : "Criar Tarefa no Kanban"}
        </Button>
      </form>
    </Form>
  )
}
