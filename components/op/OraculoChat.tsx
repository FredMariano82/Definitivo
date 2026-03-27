'use client'

import React, { useState, useRef, useEffect } from 'react'
import { 
    Send, 
    Bot, 
    User, 
    X, 
    Sparkles, 
    MessageSquare, 
    Loader2,
    HelpCircle,
    ChevronRight,
    Search,
    BookOpen
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useTheme } from '@/components/theme-provider'

interface Message {
    id: string
    role: 'assistant' | 'user'
    content: string
    timestamp: Date
}

const SUGGESTIONS = [
    "Quem pode ser sócio da Hebraica?",
    "Como funciona a eleição da diretoria?",
    "Quais as responsabilidades do conselho?",
    "Regras para dependentes e convidados."
]

export function OraculoChat() {
    const { isDarkMode } = useTheme()
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: 'Olá! Sou o Oráculo MVM. Estou aqui para te ajudar com dúvidas sobre o Estatuto Social e normas da empresa. Como posso te auxiliar hoje?',
            timestamp: new Date()
        }
    ])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const handleSendMessage = async (text?: string) => {
        const messageText = text || input
        if (!messageText.trim() || isLoading) return

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: messageText,
            timestamp: new Date()
        }

        setMessages(prev => [...prev, userMsg])
        setInput('')
        setIsLoading(true)

        try {
            const response = await fetch('/api/oraculo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: messageText })
            })

            const data = await response.json()
            
            const assistantMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.reply || "Desculpe, tive um problema ao processar sua pergunta.",
                timestamp: new Date()
            }

            setMessages(prev => [...prev, assistantMsg])
        } catch (error) {
            console.error("Erro no chat:", error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card className={`flex flex-col border-none shadow-2xl h-[650px] overflow-hidden rounded-[32px] ${isDarkMode ? 'bg-slate-900 shadow-blue-900/10' : 'bg-white shadow-slate-200/50'}`}>
            <CardHeader className={`p-6 border-b ${isDarkMode ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-white/50'}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shadow-lg transform transition-transform hover:scale-105 ${isDarkMode ? 'bg-blue-600 shadow-blue-900' : 'bg-blue-500 shadow-blue-200'}`}>
                            <Bot className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <CardTitle className={`text-xl font-black italic tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                                MVM ORÁCULO
                            </CardTitle>
                            <div className="flex items-center gap-2">
                                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                    Inteligência Operacional Ativa
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10 text-slate-400 hover:text-blue-500 transition-colors">
                            <BookOpen className="h-5 w-5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10 text-slate-400 hover:text-rose-500 transition-colors">
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="flex-grow p-0 overflow-hidden relative">
                <div 
                    ref={scrollRef} 
                    className="h-full overflow-y-auto p-6 space-y-6 custom-scrollbar"
                >
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                            <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm
                                    ${msg.role === 'user' 
                                        ? (isDarkMode ? 'bg-slate-700 text-blue-400' : 'bg-slate-100 text-blue-600')
                                        : (isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600')}`}>
                                    {msg.role === 'user' ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                                </div>
                                <div className={`p-4 rounded-3xl text-sm font-medium leading-relaxed shadow-sm
                                    ${msg.role === 'user'
                                        ? (isDarkMode ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-blue-600 text-white rounded-tr-none')
                                        : (isDarkMode ? 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700' : 'bg-slate-50 text-slate-700 rounded-tl-none border border-slate-100')}`}>
                                    {msg.content}
                                    <div className={`text-[9px] mt-2 font-black uppercase opacity-50 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start animate-in fade-in duration-300">
                            <div className="flex gap-3 max-w-[85%]">
                                <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600'}`}>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                </div>
                                <div className={`p-4 rounded-3xl rounded-tl-none border italic text-xs ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                                    O Oráculo está consultando os estatutos...
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Camada de Gradiente para o Scroll */}
                <div className={`absolute bottom-0 left-0 right-0 h-8 pointer-events-none ${isDarkMode ? 'bg-gradient-to-t from-slate-900' : 'bg-gradient-to-t from-white'}`} />
            </CardContent>

            <CardFooter className={`p-6 pb-8 block space-y-4 ${isDarkMode ? 'bg-slate-900' : 'bg-white'}`}>
                {messages.length < 3 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                        {SUGGESTIONS.map((s, i) => (
                            <button 
                                key={i}
                                onClick={() => handleSendMessage(s)}
                                className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-full border transition-all hover:scale-105
                                    ${isDarkMode 
                                        ? 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-white' 
                                        : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-blue-50 hover:text-blue-600'}`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                )}
                
                <div className="relative">
                    <Input 
                        placeholder="Faça uma pergunta ao Oráculo..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        className={`h-14 pl-6 pr-14 rounded-2xl border-none font-medium shadow-inner transition-all focus-visible:ring-blue-500
                            ${isDarkMode ? 'bg-slate-800 text-white placeholder:text-slate-600' : 'bg-slate-100 text-slate-900 placeholder:text-slate-400'}`}
                    />
                    <Button 
                        size="icon"
                        onClick={() => handleSendMessage()}
                        disabled={!input.trim() || isLoading}
                        className={`absolute right-2 top-2 h-10 w-10 rounded-xl transition-all shadow-lg ${isLoading ? 'bg-slate-400' : 'bg-blue-600 hover:bg-blue-700 hover:scale-105 active:scale-95'}`}
                    >
                        <Send className="h-5 w-5" />
                    </Button>
                </div>
                <p className="text-[9px] text-center font-bold text-slate-500 mt-4 uppercase tracking-[0.2em]">
                    Powered by MVM Intelligence & Google Gemini
                </p>
            </CardFooter>
        </Card>
    )
}
