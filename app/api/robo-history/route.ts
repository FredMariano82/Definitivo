import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const HISTORY_FILE = path.resolve(process.cwd(), 'robo4_history.json');

export async function GET() {
  try {
    if (!fs.existsSync(HISTORY_FILE)) {
      return NextResponse.json([]);
    }
    const data = fs.readFileSync(HISTORY_FILE, 'utf-8');
    // Retornar os últimos logs (já estão em ordem inversa no arquivo)
    return NextResponse.json(JSON.parse(data));
  } catch (error) {
    return NextResponse.json([], { status: 500 });
  }
}

export async function DELETE() {
  try {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify([], null, 2));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
