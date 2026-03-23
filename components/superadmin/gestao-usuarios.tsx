"use client"

import { useState, useEffect } from "react"
import { Shield, Plus, Search, MoreVertical, Edit, Trash2, KeyRound } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { AuthService } from "@/services/auth-service"
import type { Usuario } from "@/types"
import { useAuth } from "@/contexts/auth-context"

const DEPARTAMENTOS_LISTA = [
  "After School", "Agenda", "Atelie de Artes", "Banco Safra", "CHAVERIM",
  "CK", "Compras", "Comunicação", "Concessões", "Cultura Judaica", "Danças",
  "Daniel Whatsap", "Espaço Bebê", "Grandes Festas", "Esportivo",
  "Festival Carmel", "Hebraikeinu", "Hadventure", "Informatica",
  "Brinquedoteca", "Juventude", "Marketing", "Maternal", "Musica",
  "Depto.Médico", "Patrimônio", "Presidência", "RH", "Segurança",
  "Renovação", "Social", "60 Mais", "Teatro"
].sort()

export default function GestaoUsuarios() {
    const { usuario: currentUser } = useAuth()
    const [usuarios, setUsuarios] = useState<Usuario[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")

    // Formulário
    const [formData, setFormData] = useState<{
        nome: string
        email: string
        departamento: string
        perfil: "solicitante" | "aprovador" | "administrador" | "gestor" | "recepcao" | "suporte" | "superadmin"
        senhaProvisoria: string
    }>({
        nome: "",
        email: "",
        departamento: "",
        perfil: "solicitante",
        senhaProvisoria: ""
    })

    useEffect(() => {
        carregarUsuarios()
    }, [])

    const carregarUsuarios = async () => {
        setLoading(true)
        const data = await AuthService.listarUsuarios()
        setUsuarios(data)
        setLoading(false)
    }

    const handleSalvar = async () => {
        if (!formData.nome || !formData.email || !formData.senhaProvisoria) {
            alert("Preencha todos os campos obrigatórios (Nome, E-mail e Senha Provisória).")
            return
        }

        try {
            // Injetando senha no payload para o AuthService via gambiarra limpa para o MVP
            const payload: any = {
                nome: formData.nome,
                email: formData.email,
                departamento: formData.departamento,
                perfil: formData.perfil,
                senha: formData.senhaProvisoria // Apenas para a tabela, em prod real usa-se hash na API
            }

            const res = await AuthService.criarUsuario(payload)

            if (res.sucesso) {
                alert("Usuário Criado com Sucesso! Ele já pode logar no sistema.")
                setIsModalOpen(false)
                setFormData({ nome: "", email: "", departamento: "", perfil: "solicitante", senhaProvisoria: "" })
                carregarUsuarios()
            } else {
                alert("Erro: " + res.erro)
            }
        } catch (error) {
            console.error(error)
            alert("Erro ao criar usuário.")
        }
    }

    const filteredUsuarios = usuarios.filter(u =>
        u.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.departamento?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const getBadgeColor = (perfil: string) => {
        switch (perfil) {
            case "superadmin": return "bg-purple-500"
            case "administrador": return "bg-red-500"
            case "aprovador": return "bg-amber-500"
            case "recepcao": return "bg-emerald-500"
            case "gestor": return "bg-blue-500"
            default: return "bg-slate-500" // solicitante
        }
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Shield className="h-8 w-8 text-indigo-600" />
                        Gestão de Usuários
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Crie e gerencie os acessos de todos os departamentos (MVP).</p>
                </div>

                <Button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Usuário
                </Button>
            </div>

            <Card>
                <CardHeader className="pb-3 border-b">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <CardTitle className="text-lg">Usuários Cadastrados</CardTitle>
                        <div className="relative w-full sm:w-72">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                            <Input
                                type="search"
                                placeholder="Buscar por nome, email, depto..."
                                className="pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead>Nome</TableHead>
                                <TableHead>Departamento</TableHead>
                                <TableHead>Perfil de Acesso</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-10 text-slate-500">
                                        Carregando base de usuários...
                                    </TableCell>
                                </TableRow>
                            ) : filteredUsuarios.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-10 text-slate-500">
                                        Nenhum usuário encontrado.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredUsuarios.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell>
                                            <div className="font-medium text-slate-900">{user.nome}</div>
                                            <div className="text-xs text-slate-500">{user.email}</div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="font-normal border-slate-200">
                                                {user.departamento || "N/A"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={`${getBadgeColor(user.perfil)} hover:${getBadgeColor(user.perfil)} text-[10px] uppercase font-bold tracking-wider`}>
                                                {user.perfil}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Abrir menu</span>
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Ações (WIP)</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => alert("Em construção: Vai abrir modal para editar NOME ou DEPTO.")}>
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        Editar Dados
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => alert("Em construção: Vai forçar troca de senha no próximo login.")}>
                                                        <KeyRound className="mr-2 h-4 w-4" />
                                                        Resetar Senha
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50" onClick={() => alert("Em construção: Vai desativar o usuário logicamente.")}>
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Bloquear Acesso
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Modal Criar Novo Usuário */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Liberar Novo Acesso</DialogTitle>
                        <DialogDescription>
                            Crie o login para um departamento. Eles entrarão com este E-mail e Senha.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">

                        <div className="grid gap-2">
                            <Label htmlFor="nome">Nome Completo (Responsável)</Label>
                            <Input id="nome" placeholder="Ex: João Silva" value={formData.nome} onChange={e => setFormData({ ...formData, nome: e.target.value })} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="email">E-mail Corporativo (Login)</Label>
                            <Input id="email" type="email" placeholder="rh@empresa.com.br" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="depto">Setor / Departamento</Label>
                                <Select value={formData.departamento} onValueChange={(v: string) => setFormData({ ...formData, departamento: v })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione o Departamento" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {DEPARTAMENTOS_LISTA.map((d) => (
                                            <SelectItem key={d} value={d}>{d}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="perfil">Perfil no Sistema</Label>
                                <Select value={formData.perfil} onValueChange={(v: any) => setFormData({ ...formData, perfil: v })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="solicitante">Solicitante (Cria Pedidos)</SelectItem>
                                        <SelectItem value="aprovador">Aprovador (Aprova Pedidos)</SelectItem>
                                        <SelectItem value="recepcao">Portaria / Recepção</SelectItem>
                                        <SelectItem value="gestor">Gestor / Síndico</SelectItem>
                                        <SelectItem value="administrador">Administrador</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid gap-2 bg-amber-50 p-3 rounded-lg border border-amber-200 mt-2">
                            <Label htmlFor="senha" className="text-amber-800 flex items-center gap-2"><KeyRound className="w-4 h-4" /> Senha Provisória</Label>
                            <Input id="senha" type="text" placeholder="Crie uma senha inicial (ex: Mudar@123)" value={formData.senhaProvisoria} onChange={e => setFormData({ ...formData, senhaProvisoria: e.target.value })} className="bg-white" />
                            <p className="text-[10px] text-amber-700 leading-tight">Você deve informar esta senha ao usuário. Em futuras versões, ele poderá alterar logando na plataforma.</p>
                        </div>

                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSalvar} className="bg-indigo-600 hover:bg-indigo-700">Criar Conta</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
