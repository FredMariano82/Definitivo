const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const sourceDir = 'c:\\Users\\central_seguranca\\.gemini\\antigravity\\scratch\\Definitivo';
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
// Just use a fixed name for simplicity
const backupPath = `c:\\Users\\central_seguranca\\Desktop\\BACKUP_DEFINITIVO.zip`;

console.log(`Iniciando backup de ${sourceDir} para ${backupPath}...`);

try {
    // Usar tar do Windows que é mais confiável com exclusão
    // --exclude node_modules --exclude .next
    const cmd = `tar -cvzf "${backupPath}" --exclude="node_modules" --exclude=".next" --exclude="*.log" -C "${sourceDir}" .`;
    execSync(cmd, { stdio: 'inherit' });
    console.log('✅ Backup concluído com sucesso!');
} catch (error) {
    console.error('❌ Erro no backup:', error.message);
}
