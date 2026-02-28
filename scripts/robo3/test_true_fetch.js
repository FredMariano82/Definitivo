require('dotenv').config({ path: '.env.local' });
const https = require('https');

async function execTrueFetch() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

    const fetchRaw = await fetch("https://192.168.100.20:30443/api/user/", {
        "headers": {
            "accept": "application/json, text/plain, */*",
            "accept-language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
            "authorization": "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJjaWRVc2VyVHlwZSI6IjQiLCJjaWRVc2VyTmFtZSI6Ik1hcmlhbm8iLCJjaWRVc2VySWQiOiI0MyIsImlzcyI6IkdlcmVuY2lhZG9yIGlEQWNjZXNzIiwiZXhwIjoxNzcyMTU4NzQ2LCJuYmYiOjE3NzIwNzIzNDZ9.f5Yb0ZyR2pg3rTETQVa2gQRHxdSt9gjBwfs9Z5FsAsc",
            "content-type": "application/json;charset=utf-8",
            "priority": "u=1, i",
            "sec-ch-ua": "\"Not:A-Brand\";v=\"99\", \"Google Chrome\";v=\"145\", \"Chromium\";v=\"145\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "cookie": "_ga=GA1.1.1723055842.1746807528; _gid=GA1.1.1342514979.1772053203; _gat=1; _ga_LKR555MZDX=GS2.1.s1772071411$o210$g1$t1772076646$j60$l0$h0",
            "Referer": "https://192.168.100.20:30443/"
        },
        "body": "{\"Ativacao\":\"18/06/2025 00:00\",\"Validade\":\"18/06/2025 23:59\",\"admin\":false,\"admissao\":null,\"admissionDate\":\"\",\"allowParkingSpotCompany\":null,\"availableCompanies\":null,\"availableGroupsVisitorsList\":null,\"availableResponsibles\":null,\"bairro\":null,\"barras\":null,\"blackList\":false,\"bornDate\":\"\",\"canUseFacial\":true,\"cards\":[],\"cargo\":null,\"cep\":null,\"cidade\":null,\"comments\":\"Email da Thais\",\"contingency\":false,\"cpf\":null,\"dataLastLog\":null,\"dateLimit\":\"/Date(1750301999000-0300)/\",\"dateStartLimit\":\"/Date(1750215600000-0300)/\",\"deleted\":false,\"document\":\"RG: 372271649\",\"dtAdmissao\":\"\",\"dtNascimento\":\"\",\"email\":null,\"emailAcesso\":null,\"endereco\":null,\"estadoCivil\":null,\"expireOnDateLimit\":false,\"foto\":null,\"fotoDoc\":null,\"groups\":[2039,1104],\"groupsList\":[{\"contingency\":false,\"controlVisitors\":false,\"disableADE\":false,\"id\":2039,\"id2\":null,\"idType\":2,\"maxTimeInside\":null,\"maxVisitors\":0,\"nPeople\":72,\"nUsers\":73,\"nVisitors\":1,\"name\":\"Haganá\",\"qtyTotalSpots\":0,\"users\":null,\"usersList\":null,\"parkingSpots\":null,\"parkingSpotsList\":null},{\"contingency\":false,\"controlVisitors\":false,\"disableADE\":false,\"id\":1104,\"id2\":null,\"idType\":0,\"maxTimeInside\":null,\"maxVisitors\":0,\"nPeople\":105,\"nUsers\":105,\"nVisitors\":0,\"name\":\"Segurança\",\"qtyTotalSpots\":0,\"users\":null,\"usersList\":null,\"parkingSpots\":null,\"parkingSpotsList\":null}],\"id\":10023947,\"idArea\":0,\"idDevice\":10004135,\"idResponsavel\":null,\"idType\":0,\"inativo\":false,\"mae\":null,\"nacionalidade\":null,\"name\":\"Acilônio Pereira Tito Macedo\",\"nascimento\":null,\"naturalidade\":null,\"objectGuid\":null,\"pai\":null,\"password\":\"\",\"phone\":\"Lib. 18/06/2025\",\"photoDeleted\":null,\"photoIdFaceState\":null,\"photoTimestamp\":null,\"pis\":0,\"pisAnterior\":0,\"ramal\":null,\"registration\":\"\",\"responsavelNome\":null,\"rg\":\"372271649\",\"selectedGroupsVisitorsList\":null,\"selectedIdGroupsVisitorsList\":null,\"selectedIdResponsible\":null,\"selectedIdVisitedCompany\":null,\"selectedNameResponsible\":null,\"selectedResponsible\":null,\"selectedVisitedCompany\":null,\"senha\":0,\"sexo\":null,\"shelfLife\":\"18/06/2025 00:00\",\"shelfStartLife\":\"18/06/2025 00:00\",\"telefone\":null,\"templates\":[],\"templatesImages\":[],\"templatesList\":[],\"templatesPanic\":[],\"templatesPanicImages\":[],\"templatesPanicList\":[],\"timeOfRegistration\":\"/Date(1772074465000-0300)/\",\"userGroupsList\":[{\"id\":169872,\"idGroup\":1030,\"idUser\":10023947,\"isVisitor\":0},{\"id\":169873,\"idGroup\":2000,\"idUser\":10023947,\"isVisitor\":0}],\"veiculo_cor\":null,\"veiculo_marca\":null,\"veiculo_modelo\":null,\"veiculo_placa\":null,\"visitorCompany\":null,\"credits\":[],\"rulesList\":[],\"password_confirmation\":\"\",\"shelfLifeDate\":\"18/06/2025\",\"shelfStartLifeDate\":\"18/06/2025\",\"customFields\":{}}",
        "method": "PUT"
    });

    console.log(fetchRaw.status);
    console.log(await fetchRaw.text());
}

execTrueFetch();
