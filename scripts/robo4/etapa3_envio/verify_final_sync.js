const ID_CONTROL_URL = "https://192.168.100.20:30443";
require('dotenv').config({ path: '.env.local' });

async function checkFinal() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    const loginRes = await fetch(`${ID_CONTROL_URL}/api/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "mariano", password: "123456789" })
    });
    const { accessToken } = await loginRes.json();

    const userId = "10014415"; // O ID que foi atualizado no log anterior
    const res = await fetch(`${ID_CONTROL_URL}/api/user/${userId}`, {
        headers: { "Authorization": `Bearer ${accessToken}` }
    });
    const user = await res.json();
    console.log("=== VERIFICAÇÃO FINAL ID CONTROL ===");
    console.log("Nome:", user.name);
    console.log("Groups:", JSON.stringify(user.groups));
    console.log("UserGroupsList:", JSON.stringify(user.userGroupsList.map(g => g.idGroup)));
}
checkFinal();
