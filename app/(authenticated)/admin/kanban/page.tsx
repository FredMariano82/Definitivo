"use client"

import { KanbanBoard } from "@/components/admin/kanban-board"

export default function KanbanBoardPage() {
  return (
    <div className="h-[calc(100vh-4rem)]">
      <KanbanBoard />
    </div>
  )
}
