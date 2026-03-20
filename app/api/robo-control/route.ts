import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const STATUS_FILE = path.resolve(process.cwd(), 'robo4_status.json');

export async function GET() {
  try {
    if (!fs.existsSync(STATUS_FILE)) {
      return NextResponse.json({ active: true });
    }
    const data = fs.readFileSync(STATUS_FILE, 'utf-8');
    return NextResponse.json(JSON.parse(data));
  } catch (error) {
    return NextResponse.json({ active: true, error: 'Erro ao ler status' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { active } = body;
    
    fs.writeFileSync(STATUS_FILE, JSON.stringify({ active }, null, 2));
    
    return NextResponse.json({ success: true, active });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Erro ao salvar status' }, { status: 500 });
  }
}
