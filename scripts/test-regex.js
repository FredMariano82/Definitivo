const textoLivre = `Olá equipe,

Tudo bem? Estou enviando este e-mail para solicitar a criação de acessos no ambiente interno para alguns dos novos colaboradores que começaram nas últimas semanas. Precisamos garantir que todos já estejam devidamente cadastrados no sistema de solicitações de acesso até o final desta semana.

Segue a relação inicial dos solicitantes:

Mariana Oliveira Santos — CPF 428.935.667-01 — nova analista da área de Compliance.

Carlos Eduardo Figueira — CPF 317.604.928-12 — suporte técnico, precisa acesso à rede de VPN e ao painel de tickets.

Fernanda Lopes Antunes — RG 22.914.578-9 — analista de marketing, deverá acessar o drive de campanhas e relatório de leads.

Também gostaria de incluir dois consultores externos que atuarão por tempo limitado:

Rafael M. Gaspar — CPF 109.843.220-44 — consultoria de infraestrutura, acesso restrito apenas ao servidor das VMs.

Patrícia Gomes Duarte — CPF 554.992.887-20 — apoio administrativo, precisa apenas de permissão ao módulo de solicitações.

Por fim, peço que verifiquem se o colaborador André Souza Vieira — RG 45.771.239-1 já consta ativo. Caso contrário, favor reativar o login antigo, mantendo o mesmo perfil de acesso utilizado antes da integração mais recente.

Assim que concedidos todos os acessos, me confirmem por favor para registro no controle interno.
Agradeço pela agilidade e colaboração de sempre.`;

const linhas = textoLivre.split('\n').filter(linha => linha.trim().length > 5)

const prestadoresEncontrados = []
let falhas = 0

// Melhor regex para CPF/RG do Brasil (incluindo pontuação e formato de 11 a 14 dígitos)
const docRegex = /([0-9]{2,3}[\.]?[0-9]{3}[\.]?[0-9]{3}[\-]?[0-9X]{1,2})|(\d{7,14})/gi;

linhas.forEach(linha => {
    // Normalizar em-dashes estranhos usados no Word/Email (- e —)
    let linhaLimpa = linha.replace(/[—–]/g, '-').trim()

    const matchesDoc = [...linhaLimpa.matchAll(docRegex)]

    if (matchesDoc && matchesDoc.length > 0) {
        // Pega o documento cru que deu match
        let docMatchCompleto = matchesDoc[0][0]
        let docPrincipal = docMatchCompleto.replace(/[^0-9X]/gi, '')

        if (docPrincipal.length >= 5) {
            // Dividir a string no documento. A primeira parte geralmente é o nome.
            let partesPeloDocumento = linhaLimpa.split(docMatchCompleto)

            if (partesPeloDocumento.length > 0) {
                // Pegar o lado esquerdo do documento
                let parteEsquerda = partesPeloDocumento[0].trim()

                // Limpar traços e rótulos do lado esquerdo para sobrar só o nome
                parteEsquerda = parteEsquerda.replace(/(RG|CPF|Doc|Documento)[\s]*\:?/gi, '')
                parteEsquerda = parteEsquerda.replace(/^[-:/|.,\s]+|[-:/|.,\s]+$/g, '')

                const nomeProvavel = parteEsquerda.trim()

                // Se sobrou um nome de verdade na esquerda e não é uma frase de introdução
                // Vamos ignorar linhas que contém palavras de explicação padrão
                const nomeLcase = nomeProvavel.toLowerCase();
                const palavrasProibidas = ['solicita', 'segue', 'obrigado', 'favor', 'verifiquem', 'incluir'];
                const temPalavraProibida = palavrasProibidas.some(palavra => nomeLcase.includes(palavra));

                if (nomeProvavel.length > 2 && !temPalavraProibida) {
                    prestadoresEncontrados.push({
                        nome: nomeProvavel,
                        doc1: docPrincipal,
                    })
                    return; // Passa pra proxima linha com sucesso
                }
            }
        }
    }
    falhas++
})

console.log("ENCONTRADOS:");
console.dir(prestadoresEncontrados, { depth: null });
console.log("FALHAS:", falhas)
