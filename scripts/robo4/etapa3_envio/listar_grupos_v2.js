const https = require('https');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env.local') });

const agent = new https.Agent({ rejectUnauthorized: false });

async function request(url, options = {}) {
    return new Promise((resolve, reject) => {
        const req = https.request(url, { ...options, agent }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        });
        req.on('error', reject);
        if (options.body) req.write(options.body);
        req.end();
    });
}

async function run() {
    const ID_CONTROL_URL = 'https://192.168.100.20:30443';

    // Login
    const login = await request(ID_CONTROL_URL + '/api/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: "mariano", password: "123456789" })
    });
    const token = login.accessToken;

    // Get Groups
    const groups = await request(ID_CONTROL_URL + '/api/group/', {
        method: 'GET',
        headers: { 'Authorization': 'Bearer ' + token }
    });

    const target = groups.filter(g => g.name.includes('4 Irmãos') || g.name.includes('Segurança'));
    console.log(JSON.stringify(target, null, 2));
}

run();
