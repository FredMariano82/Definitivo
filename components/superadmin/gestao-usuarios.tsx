"use client"

import { useState, useEffect } from "react"
import { Shield, Plus, Search, MoreVertical, Edit, Trash2, KeyRound } from "lucide-material"
import { ShieldAlert, UserCheck, UserX } from "lucide-react"
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
    const [usuarios, setUsuarios] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")

    // Formulário de Criação
    const [formData, setFormData] = useState({
        nome: "",
        email: "",
        departamento: "",
        perfil: "solicitante" as any,
        senhaProvisoria: ""
    })

    // Reset de Senha
    const [isResetModalOpen, setIsResetModalOpen] = useState(false)
    const [userToReset, setUserToReset] = useState<any | null>(null)
    const [novaSenhaReset, setNovaSenhaReset] = useState("")
    const [resetting, setResetting] = useState(false)

    // Edição de Usuário
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [userToEdit, setUserToEdit] = useState<any | null>(null)
    const [editFormData, setEditFormData] = useState({
        nome: "",
        email: "",
        departamento: "",
        perfil: "" as any
    })
    const [savingEdit, setSavingEdit] = useState(false)
    const [processingStatus, setProcessingStatus] = useState<string | null>(null)

    useEffect(() => {
        carregarUsuarios()
    }, [])

    const carregarUsuarios = async () => {
        setLoading(true)
        const data = await AuthService.listarUsuarios()
        setUsuarios(data)
        setLoading(false)
    }

    const handleResetSenha = async () => {
        if (!userToReset || !novaSenhaReset) return
        setResetting(true)
        try {
            const res = await AuthService.resetarSenha(userToReset.id, novaSenhaReset)
            if (res.sucesso) {
                alert(`Senha de ${userToReset.nome} resetada com sucesso!`)
                setIsResetModalOpen(false)
                setNovaSenhaReset("")
                setUserToReset(null)
            } else {
                alert("Erro ao resetar: " + res.erro)
            }
        } catch (error) {
            console.error(error)
            alert("Erro interno ao resetar senha.")
        } finally {
            setResetting(false)
        }
    }

    const handleEditClick = (user: any) => {
        setUserToEdit(user)
        setEditFormData({
            nome: user.nome,
            email: user.email,
            departamento: user.departamento || "",
            perfil: user.perfil
        })
        setIsEditModalOpen(true)
    }

    const handleEditSave = async () => {
        if (!userToEdit) return
        setSavingEdit(true)
        try {
            const res = await AuthService.atualizarUsuario(userToEdit.id, editFormData)
            if (res.sucesso) {
                alert("Usuário atualizado com sucesso!")
                setIsEditModalOpen(false)
                carregarUsuarios()
            } else {
                alert("Erro ao atualizar: " + res.erro)
            }
        } catch (error) {
            console.error(error)
            alert("Erro interno ao atualizar.")
        } finally {
            setSavingEdit(false)
        }
    }

    const handleToggleStatus = async (user: any) => {
        const novoStatus = !(user.ativo !== false)
        const acao = novoStatus ? "desbloquear" : "bloquear"
        
        if (!confirm(`Tem certeza que deseja ${acao} o acesso de ${user.nome}?`)) return

        setProcessingStatus(user.id)
        try {
            const res = await AuthService.alternarStatusUsuario(user.id, novoStatus)
            if (res.sucesso) {
                carregarUsuarios()
            } else {
                alert("Erro ao mudar status: " + res.erro)
            }
        } catch (error) {
            console.error(error)
            alert("Erro interno ao mudar status.")
        } finally {
            setProcessingStatus(null)
        }
    }

    const handleSalvar = async () => {
        if (!formData.nome || !formData.email || !formData.senhaProvisoria) {
            alert("Preencha todos os campos obrigatórios.")
            return
        }

        try {
            const res = await AuthService.criarUsuario({
                nome: formData.nome,
                email: formData.email,
                departamento: formData.departamento,
                perfil: formData.perfil,
                senha: formData.senhaProvisoria
            })

            if (res.sucesso) {
                alert("Usuário Criado com Sucesso!")
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
            case "operador": return "bg-indigo-500"
            default: return "bg-slate-500"
        }
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <ShieldAlert className="h-8 w-8 text-indigo-600" />
                        Gestão de Usuários
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Gerencie acessos, permissões e bloqueios de usuários.</p>
                </div>

                <Button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Usuário
                </Button>
            </div>

            <Card>
                <CardHeader className="pb-3 border-b">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <CardTitle className="text-lg text-slate-900 font-semibold">Usuários Cadastrados</CardTitle>
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
                                <TableHead>Nome / Email</TableHead>
                                <TableHead>Departamento</TableHead>
                                <TableHead>Perfil</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-10 text-slate-500 italic">
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
                                    <TableRow key={user.id} className={user.ativo === false ? "bg-slate-50 opacity-60" : ""}>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-slate-900">{user.nome}</span>
                                                    {user.ativo === false && (
                                                        <Badge variant="destructive" className="h-4 px-1.5 text-[9px] uppercase font-bold">BLOQUEADO</Badge>
                                                    )}
                                                </div>
                                                <span className="text-xs text-slate-500 font-medium">{user.email}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="font-medium bg-white text-slate-600 border-slate-200">
                                                {user.departamento || "N/A"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={`${getBadgeColor(user.perfil)} text-[10px] uppercase font-bold tracking-wider`}>
                                                {user.perfil}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-slate-100 round-full">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-[180px]">
                                                    <DropdownMenuLabel className="text-xs font-bold text-slate-500 uppercase tracking-tight">Gerenciamento</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => handleEditClick(user)} className="cursor-pointer">
                                                        <Edit className="mr-2 h-4 w-4 text-blue-600" />
                                                        Editar Dados
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => {
                                                        setUserToReset(user)
                                                        setIsResetModalOpen(true)
                                                    }} className="cursor-pointer">
                                                        <KeyRound className="mr-2 h-4 w-4 text-amber-600" />
                                                        Resetar Senha
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem 
                                                        onClick={() => handleToggleStatus(user)}
                                                        disabled={processingStatus === user.id}
                                                        className={`cursor-pointer font-medium ${user.ativo === false ? "text-emerald-600 focus:text-emerald-600" : "text-rose-600 focus:text-rose-600"}`}
                                                    >
                                                        {user.ativo === false ? (
                                                            <><UserCheck className="mr-2 h-4 w-4" /> Ativar Acesso</>
                                                        ) : (
                                                            <><UserX className="mr-2 h-4 w-4" /> Bloquear Acesso</>
                                                        )}
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
                <DialogContent className="sm:max-w-[425px] overflow-hidden rounded-xl border-none shadow-2xl">
                    <DialogHeader className="bg-indigo-600 text-white p-6 -m-6 mb-6">
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                           <Plus className="w-5 h-5" /> Liberar Novo Acesso
                        </DialogTitle>
                        <DialogDescription className="text-indigo-100 font-medium">
                            Configure o login inicial para um novo colaborador.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-5 py-4 px-1">
                        <div className="grid gap-1.5">
                            <Label htmlFor="nome" className="text-slate-700 font-semibold">Nome Completo</Label>
                            <Input id="nome" placeholder="Ex: João Silva" value={formData.nome} onChange={e => setFormData({ ...formData, nome: e.target.value })} className="border-slate-200 focus-visible:ring-indigo-500" />
                        </div>

                        <div className="grid gap-1.5">
                            <Label htmlFor="email" className="text-slate-700 font-semibold">E-mail Corporativo (Login)</Label>
                            <Input id="email" type="email" placeholder="nome@empresa.com.br" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="border-slate-200 focus-visible:ring-indigo-500" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-1.5">
                                <Label htmlFor="depto" className="text-slate-700 font-semibold">Departamento</Label>
                                <Select value={formData.departamento} onValueChange={(v: string) => setFormData({ ...formData, departamento: v })}>
                                    <SelectTrigger className="border-slate-200 focus:ring-indigo-500">
                                        <SelectValue placeholder="Selecione" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {DEPARTAMENTOS_LISTA.map((d) => (
                                            <SelectItem key={d} value={d}>{d}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="perfil" className="text-slate-700 font-semibold">Perfil</Label>
                                <Select value={formData.perfil} onValueChange={(v: any) => setFormData({ ...formData, perfil: v })}>
                                    <SelectTrigger className="border-slate-200 focus:ring-indigo-500">
                                        <SelectValue placeholder="Selecione" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="solicitante">Solicitante</SelectItem>
                                        <SelectItem value="aprovador">Aprovador</SelectItem>
                                        <SelectItem value="recepcao">Recepção</SelectItem>
                                        <SelectItem value="gestor">Gestor</SelectItem>
                                        <SelectItem value="operador">Operador (CFTV)</SelectItem>
                                        <SelectItem value="administrador">Administrador</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid gap-2 bg-amber-50 p-4 rounded-xl border border-amber-200">
                            <Label htmlFor="senha" className="text-amber-800 font-bold flex items-center gap-2"><KeyRound className="w-4 h-4 text-amber-600" /> Senha Inicial</Label>
                            <Input id="senha" type="text" placeholder="Senha provisória (ex: Mudar@123)" value={formData.senhaProvisoria} onChange={e => setFormData({ ...formData, senhaProvisoria: e.target.value })} className="bg-white border-amber-200 focus-visible:ring-amber-500" />
                            <p className="text-[10px] text-amber-700 leading-tight font-medium">A senha será criptografada automaticamente ao salvar.</p>
                        </div>
                    </div>
                    <DialogFooter className="pt-2">
                        <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="text-slate-500 font-semibold">Cancelar</Button>
                        <Button onClick={handleSalvar} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 shadow-md transition-all active:scale-95">Criar Conta</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal Editar Usuário */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="sm:max-w-[425px] overflow-hidden rounded-xl border-none shadow-2xl">
                    <DialogHeader className="bg-blue-600 text-white p-6 -m-6 mb-6">
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                           <Edit className="w-5 h-5" /> Editar Informações
                        </DialogTitle>
                        <DialogDescription className="text-blue-100 font-medium">
                            Atualize o cadastro do colaborador.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-5 py-4 px-1">
                        <div className="grid gap-1.5">
                            <Label htmlFor="edit-nome" className="text-slate-700 font-semibold">Nome Completo</Label>
                            <Input id="edit-nome" value={editFormData.nome} onChange={e => setEditFormData({ ...editFormData, nome: e.target.value })} className="border-slate-200 focus-visible:ring-blue-500" />
                        </div>

                        <div className="grid gap-1.5">
                            <Label htmlFor="edit-email" className="text-slate-700 font-semibold">E-mail</Label>
                            <Input id="edit-email" value={editFormData.email} onChange={e => setEditFormData({ ...editFormData, email: e.target.value })} className="border-slate-200 focus-visible:ring-blue-500" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-1.5">
                                <Label htmlFor="edit-depto" className="text-slate-700 font-semibold">Departamento</Label>
                                <Select value={editFormData.departamento} onValueChange={(v: string) => setEditFormData({ ...editFormData, departamento: v })}>
                                    <SelectTrigger className="border-slate-200 focus:ring-blue-500">
                                        <SelectValue placeholder="Selecione" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {DEPARTAMENTOS_LISTA.map((d) => (
                                            <SelectItem key={d} value={d}>{d}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="edit-perfil" className="text-slate-700 font-semibold">Perfil</Label>
                                <Select value={editFormData.perfil} onValueChange={(v: any) => setEditFormData({ ...editFormData, perfil: v })}>
                                    <SelectTrigger className="border-slate-200 focus:ring-blue-500">
                                        <SelectValue placeholder="Selecione" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="solicitante">Solicitante</SelectItem>
                                        <SelectItem value="aprovador">Aprovador</SelectItem>
                                        <SelectItem value="recepcao">Recepção</SelectItem>
                                        <SelectItem value="gestor">Gestor</SelectItem>
                                        <SelectItem value="operador">Operador (CFTV)</SelectItem>
                                        <SelectItem value="administrador">Administrador</SelectItem>
                                        <SelectItem value="superadmin">Superadmin</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="pt-2">
                        <Button variant="ghost" onClick={() => setIsEditModalOpen(false)} className="text-slate-500 font-semibold">Cancelar</Button>
                        <Button onClick={handleEditSave} disabled={savingEdit} className="bg-blue-600 hover:bg-blue-700 text-white px-8 shadow-md transition-all active:scale-95">
                            {savingEdit ? "Salvando..." : "Salvar Alterações"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal Resetar Senha */}
            <Dialog open={isResetModalOpen} onOpenChange={setIsResetModalOpen}>
                <DialogContent className="sm:max-w-[400px] overflow-hidden rounded-xl border-none shadow-2xl">
                    <DialogHeader className="bg-amber-500 text-white p-6 -m-6 mb-6">
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                           <KeyRound className="w-5 h-5" /> Resetar Senha
                        </DialogTitle>
                        <DialogDescription className="text-amber-100 font-medium">
                            A nova senha apagará a anterior permanentemente.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-6 px-1">
                        <div className="space-y-3">
                            <Label htmlFor="nova-senha" className="text-slate-700 font-semibold">Nova Senha Provisória para <strong>{userToReset?.nome}</strong></Label>
                            <Input 
                                id="nova-senha" 
                                type="text" 
                                placeholder="Reset@123" 
                                value={novaSenhaReset} 
                                onChange={e => setNovaSenhaReset(e.target.value)} 
                                className="border-slate-200 focus-visible:ring-amber-500"
                            />
                        </div>
                    </div>
                    <DialogFooter className="pt-2">
                        <Button variant="ghost" onClick={() => setIsResetModalOpen(false)} disabled={resetting} className="text-slate-500 font-semibold">
                            Cancelar
                        </Button>
                        <Button 
                            onClick={handleResetSenha} 
                            disabled={resetting || !novaSenhaReset}
                            className="bg-amber-500 hover:bg-amber-600 text-white px-8 shadow-md transition-all active:scale-95"
                        >
                            {resetting ? "Resetando..." : "Confirmar Reset"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
