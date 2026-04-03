require('dotenv').config({ path: '.env.local' });
const https = require('https');

async function searchUser(targetName) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

    const loginReq = await new Promise((resolve) => {
        const req = https.request({
            hostname: '192.168.100.20', port: 30443, path: '/api/login/', method: 'POST',
            headers: { 'Content-Type': 'application/json' }, rejectUnauthorized: false
        }, res => {
            let d = ''; res.on('data', c => d += c); res.on('end', () => resolve(JSON.parse(d)));
        });
        req.write(JSON.stringify({ username: "mariano", password: "123456789" }));
        req.end();
    });

    const token = loginReq.accessToken || loginReq.token;

    // Injetando o nome buscado exatamente onde a interface (F12) injeta
    const encodedName = encodeURIComponent(targetName).replace(/%20/g, '+');
    const searchUrl = `/api/user/list?idType=0&deleted=false&draw=14&columns%5B0%5D%5Bdata%5D=&columns%5B0%5D%5Bname%5D=&columns%5B0%5D%5Bsearchable%5D=true&columns%5B0%5D%5Borderable%5D=false&columns%5B0%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B0%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B1%5D%5Bdata%5D=idDevice&columns%5B1%5D%5Bname%5D=&columns%5B1%5D%5Bsearchable%5D=true&columns%5B1%5D%5Borderable%5D=true&columns%5B1%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B1%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B2%5D%5Bdata%5D=name&columns%5B2%5D%5Bname%5D=&columns%5B2%5D%5Bsearchable%5D=true&columns%5B2%5D%5Borderable%5D=true&columns%5B2%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B2%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B3%5D%5Bdata%5D=registration&columns%5B3%5D%5Bname%5D=&columns%5B3%5D%5Bsearchable%5D=true&columns%5B3%5D%5Borderable%5D=true&columns%5B3%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B3%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B4%5D%5Bdata%5D=rg&columns%5B4%5D%5Bname%5D=&columns%5B4%5D%5Bsearchable%5D=true&columns%5B4%5D%5Borderable%5D=true&columns%5B4%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B4%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B5%5D%5Bdata%5D=cpf&columns%5B5%5D%5Bname%5D=&columns%5B5%5D%5Bsearchable%5D=true&columns%5B5%5D%5Borderable%5D=true&columns%5B5%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B5%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B6%5D%5Bdata%5D=phone&columns%5B6%5D%5Bname%5D=&columns%5B6%5D%5Bsearchable%5D=true&columns%5B6%5D%5Borderable%5D=true&columns%5B6%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B6%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B7%5D%5Bdata%5D=cargo&columns%5B7%5D%5Bname%5D=&columns%5B7%5D%5Bsearchable%5D=true&columns%5B7%5D%5Borderable%5D=true&columns%5B7%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B7%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B8%5D%5Bdata%5D=inativo&columns%5B8%5D%5Bname%5D=&columns%5B8%5D%5Bsearchable%5D=true&columns%5B8%5D%5Borderable%5D=true&columns%5B8%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B8%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B9%5D%5Bdata%5D=blackList&columns%5B9%5D%5Bname%5D=&columns%5B9%5D%5Bsearchable%5D=true&columns%5B9%5D%5Borderable%5D=true&columns%5B9%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B9%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B10%5D%5Bdata%5D=&columns%5B10%5D%5Bname%5D=&columns%5B10%5D%5Bsearchable%5D=true&columns%5B10%5D%5Borderable%5D=false&columns%5B10%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B10%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B11%5D%5Bdata%5D=&columns%5B11%5D%5Bname%5D=&columns%5B11%5D%5Bsearchable%5D=true&columns%5B11%5D%5Borderable%5D=false&columns%5B11%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B11%5D%5Bsearch%5D%5Bregex%5D=false&order%5B0%5D%5Bcolumn%5D=2&order%5B0%5D%5Bdir%5D=asc&start=0&length=10&search%5Bvalue%5D=${encodedName}&search%5Bregex%5D=false&inactive=0&blacklist=0&filterCol=name`;

    const res = await fetch("https://192.168.100.20:30443" + searchUrl, {
        method: 'POST',
        headers: {
            "accept": "application/json, text/plain, */*",
            "authorization": `Bearer ${token}`,
            "content-type": "application/json;charset=utf-8"
        }
    });

    const data = await res.json();
    const usersList = data.data || data.content || [];

    console.log(`\n--- DADOS DE: ${targetName} ---`);
    if (usersList.length > 0) {
        const user = usersList[0]; // Pega o primeiro hit

        let dIni = user.shelfStartLife;
        let dFim = user.shelfLife || user.dateLimit;

        // Puxar as observacoes do perfil dele tambem
        const perfilRes = await fetch(`https://192.168.100.20:30443/api/user/${user.id}`, {
            headers: { "authorization": `Bearer ${token}` }
        });
        const perfilData = await perfilRes.json();

        // Agora sabemos todas as chaves onde as datas se escondem baseados no seu F12:
        const dIniStr = perfilData.Ativacao || perfilData.shelfStartLife || perfilData.shelfStartLifeDate || 'Vazia';
        const dFimStr = perfilData.Validade || perfilData.shelfLife || perfilData.shelfLifeDate || 'Vazia';

        const obs = perfilData.comments || 'Vazio';

        console.log(`✅ Registro encontrado no banco com ID: ${user.id}`);
        console.log(`[ NOME ]         : ${user.name}`);
        console.log(`[ ID ]           : ${user.id}`);
        console.log(`[ RG ]           : ${user.rg || 'Não tem'}`);
        console.log(`[ DATA INICIAL ] : ${dIniStr}  <-- (Extraída do Perfil Detalhado)`);
        console.log(`[ DATA FINAL ]   : ${dFimStr}  <-- (Extraída do Perfil Detalhado)`);
        console.log(`[ OBSERVAÇÃO ]   : ${obs}`);
    } else {
        console.log(`❌ Ninguém encontrado com a string exata "${targetName}" em toda a tela de Pessoas.`);
    }
}

searchUser("Acilônio Pereira Tito Macedo");
