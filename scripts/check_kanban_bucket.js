const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lwpqgyoownxwsrcowgke.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3cHFneW9vd254d3NyY293Z2tlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTY0NjA5NCwiZXhwIjoyMDg3MjIyMDk0fQ.NEFi7yGgnD4gs1PxZ7B7W_mQLkp5s3qqt5y7gL-SLHM';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBucket() {
    try {
        const { data: buckets, error } = await supabase.storage.listBuckets();
        if (error) {
            console.error('Erro ao listar buckets:', error);
            return;
        }
        
        const bucket = buckets.find(b => b.id === 'kanban-attachments');
        if (bucket) {
            console.log('✅ O bucket "kanban-attachments" existe.');
        } else {
            console.log('❌ O bucket "kanban-attachments" NÃO existe. Criando agora...');
            const { data, error: createError } = await supabase.storage.createBucket('kanban-attachments', {
                public: true,
                fileSizeLimit: 5242880, // 5MB
                allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp']
            });
            if (createError) console.error('Erro ao criar bucket:', createError);
            else console.log('✅ Bucket criado com sucesso!');
        }
    } catch (e) {
        console.error('Erro inesperado:', e);
    }
}

checkBucket();
