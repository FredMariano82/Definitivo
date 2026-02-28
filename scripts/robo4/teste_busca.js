const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env.local') });

async function testarBuscaIDControl() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; // Bypass SSL
    const ID_CONTROL_URL = "https://192.168.100.20:30443";
    const nomeParaBuscar = "Pedro Cabral";

    console.log(`[TESTE] Buscando "${nomeParaBuscar}" exatamente como a interface web do C# faz...`);

    // 1. Pegar o Token (Mesmo codigo base)
    const loginRes = await fetch(`${ID_CONTROL_URL}/api/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "mariano", password: "123456789" })
    });
    const tokenData = await loginRes.json();
    const token = (tokenData.accessToken || tokenData.token).trim();

    // 2. Montar a requisição de busca monstruosa (MUITO IGUAL AO F12)
    // Cópia 1:1 do Payload de Network que o usuario enviou.
    console.log(`[TESTE] Disparando query gigante POST...`);
    const searchUrl = `${ID_CONTROL_URL}/api/user/list?idType=0&deleted=false&draw=9&columns%5B0%5D%5Bdata%5D=&columns%5B0%5D%5Bname%5D=&columns%5B0%5D%5Bsearchable%5D=true&columns%5B0%5D%5Borderable%5D=false&columns%5B0%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B0%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B1%5D%5Bdata%5D=idDevice&columns%5B1%5D%5Bname%5D=&columns%5B1%5D%5Bsearchable%5D=true&columns%5B1%5D%5Borderable%5D=true&columns%5B1%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B1%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B2%5D%5Bdata%5D=name&columns%5B2%5D%5Bname%5D=&columns%5B2%5D%5Bsearchable%5D=true&columns%5B2%5D%5Borderable%5D=true&columns%5B2%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B2%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B3%5D%5Bdata%5D=registration&columns%5B3%5D%5Bname%5D=&columns%5B3%5D%5Bsearchable%5D=true&columns%5B3%5D%5Borderable%5D=true&columns%5B3%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B3%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B4%5D%5Bdata%5D=rg&columns%5B4%5D%5Bname%5D=&columns%5B4%5D%5Bsearchable%5D=true&columns%5B4%5D%5Borderable%5D=true&columns%5B4%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B4%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B5%5D%5Bdata%5D=cpf&columns%5B5%5D%5Bname%5D=&columns%5B5%5D%5Bsearchable%5D=true&columns%5B5%5D%5Borderable%5D=true&columns%5B5%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B5%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B6%5D%5Bdata%5D=phone&columns%5B6%5D%5Bname%5D=&columns%5B6%5D%5Bsearchable%5D=true&columns%5B6%5D%5Borderable%5D=true&columns%5B6%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B6%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B7%5D%5Bdata%5D=cargo&columns%5B7%5D%5Bname%5D=&columns%5B7%5D%5Bsearchable%5D=true&columns%5B7%5D%5Borderable%5D=true&columns%5B7%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B7%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B8%5D%5Bdata%5D=inativo&columns%5B8%5D%5Bname%5D=&columns%5B8%5D%5Bsearchable%5D=true&columns%5B8%5D%5Borderable%5D=true&columns%5B8%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B8%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B9%5D%5Bdata%5D=blackList&columns%5B9%5D%5Bname%5D=&columns%5B9%5D%5Bsearchable%5D=true&columns%5B9%5D%5Borderable%5D=true&columns%5B9%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B9%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B10%5D%5Bdata%5D=&columns%5B10%5D%5Bname%5D=&columns%5B10%5D%5Bsearchable%5D=true&columns%5B10%5D%5Borderable%5D=false&columns%5B10%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B10%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B11%5D%5Bdata%5D=&columns%5B11%5D%5Bname%5D=&columns%5B11%5D%5Bsearchable%5D=true&columns%5B11%5D%5Borderable%5D=false&columns%5B11%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B11%5D%5Bsearch%5D%5Bregex%5D=false&order%5B0%5D%5Bcolumn%5D=2&order%5B0%5D%5Bdir%5D=asc&start=0&length=10&search%5Bvalue%5D=${encodeURIComponent(nomeParaBuscar)}&search%5Bregex%5D=false&inactive=0&blacklist=0&filterCol=name`;

    const searchRes = await fetch(searchUrl, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json;charset=utf-8",
            "accept": "application/json, text/plain, */*"
        },
        body: null // De acordo com seu F12: "body": null
    });

    console.log(`\n[RESPOSTA CÓDIGO HTTP]:`, searchRes.status);
    if (!searchRes.ok) {
        console.log(`[ERRO HTML]:`, await searchRes.text());
        return;
    }

    const jsonData = await searchRes.json();
    const list = jsonData.data || jsonData.content || jsonData;
    console.log(`[TOTAL ENCONTRADOS]:`, list.length);

    if (list.length > 0) {
        // ID Control returns an array of objects
        const firstHit = list[0];
        console.log(`\n[PRIMEIRO RESULTADO]:`);
        console.log(`   -> Nome: ${firstHit.name}`);
        console.log(`   -> RG: ${firstHit.rg}`);
        console.log(`   -> ID Oculto no Banco: ${firstHit.id || firstHit.idUser}`);
    } else {
        console.log(`\nNinguém encontrado com esse nome.`);
    }
}

testarBuscaIDControl();
