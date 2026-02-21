
export interface AirtableRecord {
    id: string;
    fields: Record<string, any>;
    createdTime: string;
}

export class AirtableService {
    private apiKey: string;
    private baseId: string;
    private tableName: string;

    constructor() {
        this.apiKey = process.env.AIRTABLE_API_KEY || '';
        this.baseId = process.env.AIRTABLE_BASE_ID || '';
        this.tableName = process.env.AIRTABLE_TABLE_NAME || '';
    }

    async getRecords(): Promise<AirtableRecord[]> {
        if (!this.apiKey || !this.baseId || !this.tableName) {
            throw new Error('Airtable configuration is missing');
        }

        const allRecords: AirtableRecord[] = [];
        let offset: string | undefined;

        try {
            do {
                let url = `https://api.airtable.com/v0/${this.baseId}/${encodeURIComponent(this.tableName)}?pageSize=100`;
                if (offset) {
                    url += `&offset=${offset}`;
                }

                const response = await fetch(url, {
                    headers: {
                        Authorization: `Bearer ${this.apiKey}`,
                    },
                    cache: 'no-store',
                });

                if (!response.ok) {
                    const errorBody = await response.text();
                    throw new Error(`Failed to fetch records: ${response.statusText} - ${errorBody}`);
                }

                const data = await response.json();
                allRecords.push(...data.records);
                offset = data.offset;

            } while (offset);

            return allRecords;

        } catch (error) {
            console.error('Error fetching Airtable records:', error);
            throw error;
        }
    }
}
