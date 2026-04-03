const https = require('https');
require('dotenv').config({ path: '.env.local' });

const ID_CONTROL_URL = "https://192.168.100.20:30443";
const ID_CONTROL_USER = "mariano";
const ID_CONTROL_PASS = "hebraica";

async function post(url, body, token) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(body);
        const options = {
            method: 'POST',
            rejectUnauthorized: false,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token.trim()}` : undefined
            }
        };
        const req = https.request(url, options, res => {
            let resData = '';
            res.on('data', chunk => resData += chunk);
            res.on('end', () => resolve(JSON.parse(resData)));
        });
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

async function get(url, token) {
    return new Promise((resolve, reject) => {
        const options = {
            method: 'GET',
            rejectUnauthorized: false,
            headers: {
                'Authorization': `Bearer ${token.trim()}`
            }
        };
        const req = https.request(url, options, res => {
            let resData = '';
            res.on('data', chunk => resData += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(resData));
                } catch (e) {
                    reject(new Error("Failed to parse JSON: " + resData.substring(0, 100)));
                }
            });
        });
        req.on('error', reject);
        req.end();
    });
}

async function scanPages() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    console.log("📡 Logging in...");
    const loginData = await post(`${ID_CONTROL_URL}/api/login/`, { username: ID_CONTROL_USER, password: ID_CONTROL_PASS });
    const token = loginData.accessToken || loginData.token;

    if (!token) throw new Error("Login failed, no token.");

    console.log("📡 Starting paginated scan (500 per page)...");

    let totalUsersFound = 0;
    for (let page = 0; page < 40; page++) {
        process.stdout.write(`   Scanning page ${page}... `);
        try {
            const data = await get(`${ID_CONTROL_URL}/api/users?page=${page}&size=500`, token);
            const list = Array.isArray(data) ? data : (data.content || []);

            if (list.length === 0) {
                console.log("End of records.");
                break;
            }

            totalUsersFound += list.length;
            const marcus = list.find(u => {
                const rg = String(u.rg || "").replace(/[^0-9]/g, "");
                return rg === "123456";
            });

            if (marcus) {
                console.log(`\n✅ FOUND! Name: ${marcus.name}, ID: ${marcus.id}, Page: ${page}`);
                return;
            } else {
                console.log(`Done (${list.length} users).`);
            }
        } catch (e) {
            console.log(`Error on page ${page}: ${e.message}`);
            break;
        }
    }

    console.log(`\n❌ Marcus (123456) NOT FOUND after scanning ${totalUsersFound} users.`);
}

scanPages().catch(console.error);
