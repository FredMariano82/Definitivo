import { NextResponse } from 'next/server';
import { AirtableService } from '@/services/airtable';

export async function GET() {
    try {
        const service = new AirtableService();
        const records = await service.getRecords();
        return NextResponse.json({ records });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch data from Airtable' },
            { status: 500 }
        );
    }
}
