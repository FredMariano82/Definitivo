require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const ID_CONTROL_URL = "https://192.168.100.20:30443";
const ID_CONTROL_USER = "mariano";
const ID_CONTROL_PASS = "123456789";

async function loginIdControl() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    const response = await fetch(`${ID_CONTROL_URL}/api/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: ID_CONTROL_USER, password: ID_CONTROL_PASS })
    });
    const data = await response.json();
    return data.accessToken || data.token;
}

async function run() {
    const { data } = await supabase.from('prestadores').select('*').order('id', { ascending: false }).limit(1);
    const p = data[0];
    console.log(`Supabase User: ${p.nome} | RG: ${p.doc1}`);

    const token = await loginIdControl();
    const nameSearch = p.nome.split(" ")[0] || p.nome;

    console.log("Searching ID Control by Name:", nameSearch);
    const nameRes = await fetch(`${ID_CONTROL_URL}/api/users?page=0&size=1000`, {
        headers: { "Authorization": `Bearer ${token}` }
    });

    if (nameRes.ok) {
        try {
            const nData = await nameRes.json();
            const nList = Array.isArray(nData) ? nData : (nData.content || (nData.id ? [nData] : []));

            if (nList.length > 0) {
                const m = nList.find(u => u.name === p.nome || u.name.includes(nameSearch)) || nList[0];
                console.log("FOUND SUMMARY:");
                console.log(JSON.stringify(m, null, 2));

                if (m && m.id) {
                    console.log(`\nFetching full details for ID ${m.id}...`);
                    const userRes = await fetch(`${ID_CONTROL_URL}/api/user/${m.id}`, { headers: { "Authorization": `Bearer ${token}` } });
                    if (userRes.ok) {
                        const uData = await userRes.json();
                        console.log("FULL API USER DETAILS:");
                        console.log(JSON.stringify(uData, null, 2));
                    } else {
                        console.log("Failed to fetch full user:", userRes.status);
                    }
                }
            } else {
                console.log("Not found by name.");
            }
        } catch (e) {
            console.log("Error parsing response:", e.message);
        }
    } else {
        console.log("Search by name failed:", nameRes.status);
    }
}

run();
