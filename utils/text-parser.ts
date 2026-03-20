export interface PrestadorExtraido {
    nome: string;
    doc1: string;
    doc2?: string;
    empresa: string;
}

export function extrairPrestadoresDeTexto(textoLivre: string): {
    sucesso: boolean;
    erro: string;
    totalProcessados: number;
    prestadores: PrestadorExtraido[];
} {
    if (!textoLivre.trim()) {
        return { sucesso: false, erro: "Texto vazio", totalProcessados: 0, prestadores: [] };
    }

    const linhas = textoLivre.split('\n').filter(linha => linha.trim().length > 5);
    const prestadoresEncontrados: PrestadorExtraido[] = [];
    let falhas = 0;

    const docRegex = /([0-9]{2,3}[\.]?[0-9]{3}[\.]?[0-9]{3}[\-]?[0-9X]{1,2})|(\d{7,14})/gi;

    linhas.forEach(linha => {
        let linhaLimpa = linha.replace(/[—–]/g, '-').trim();
        const matchesDoc = [...linhaLimpa.matchAll(docRegex)];

        if (matchesDoc && matchesDoc.length > 0) {
            let docMatchCompleto = matchesDoc[0][0];
            let docPrincipal = docMatchCompleto.replace(/[^0-9X]/gi, '');

            if (docPrincipal.length >= 5) {
                let partesPeloDocumento = linhaLimpa.split(docMatchCompleto);

                if (partesPeloDocumento.length > 0) {
                    let parteEsquerda = partesPeloDocumento[0].trim();
                    // Captura o que estiver à direita do documento como empresa
                    let parteDireita = partesPeloDocumento.slice(1).join(docMatchCompleto).trim();

                    // Limpa traços colados ao lado do nome (ex: "Joãozinho -")
                    parteEsquerda = parteEsquerda.replace(/(RG|CPF|Doc|Documento)[\s]*\:?/gi, '');
                    parteEsquerda = parteEsquerda.replace(/^[-:/|.,\s]+|[-:/|.,\s]+$/g, '');

                    // NOVA REGRA (OCR Limpeza Extrema Frontal): 
                    // Lê o começo da frase e apaga TUDO (símbolos de bullet point, asteriscos, números, espaços)
                    // até bater de frente com a PRIMEIRA LETRA (incluindo letras acentuadas).
                    parteEsquerda = parteEsquerda.replace(/^[^a-zA-ZÀ-ÿ]+/g, '');

                    // NOVA LOGICA: Suporte para [NOME] [SEPARADOR] [EMPRESA] [SEPARADOR] [DOC]
                    // Se houver vírgula, traço, pipe ou separadores claros, tentamos separar Nome de Empresa
                    let nomeProvavel = parteEsquerda.trim();
                    let empresaExtraida = parteDireita.replace(/^[-:/|.,\s]+/, '').trim();

                    const separadores = /[,|;]|\s{3,}/; // Vírgula, pipe, ponto-e-vírgula ou 3+ espaços
                    // Nota: O traço (-) foi removido da regex principal de split para não quebrar nomes compostos 
                    // ou empresas com hífen, mas podemos usar se houver espaços ao redor.
                    const partesEsquerda = nomeProvavel.split(separadores).map(p => p.trim()).filter(p => p.length > 0);

                    if (partesEsquerda.length >= 2) {
                        // Se houver pelo menos 2 partes, a última (antes do documento) é provavelmente a empresa
                        // e o restante é o nome. 
                        // Ex: "João da Silva, Empresa ABC" -> Nome: João da Silva, Empresa: Empresa ABC
                        nomeProvavel = partesEsquerda.slice(0, -1).join(' ');
                        empresaExtraida = partesEsquerda[partesEsquerda.length - 1];
                    }

                    const nomeLcase = nomeProvavel.toLowerCase();
                    const palavrasProibidas = ['solicita', 'segue', 'obrigado', 'favor', 'verifiquem', 'incluir', 'bom ', 'boa ', 'olá', 'boa tarde'];
                    const temPalavraProibida = palavrasProibidas.some(palavra => nomeLcase.includes(palavra));

                    if (nomeProvavel.length > 2 && !temPalavraProibida) {
                        prestadoresEncontrados.push({
                            nome: nomeProvavel,
                            doc1: docPrincipal,
                            doc2: matchesDoc.length > 1 ? (matchesDoc[1][1] || matchesDoc[1][0]).replace(/[^0-9X]/gi, '') : undefined,
                            empresa: empresaExtraida || ""
                        });
                        return;
                    }
                }
            }
        }
        falhas++;
    });

    if (prestadoresEncontrados.length > 0) {
        return {
            sucesso: true,
            erro: falhas > 0 ? `${falhas} linhas ignoradas por não possuírem um documento ou nome válido.` : "",
            totalProcessados: prestadoresEncontrados.length,
            prestadores: prestadoresEncontrados,
        };
    }

    return {
        sucesso: false,
        erro: "Não conseguimos identificar nenhum par de (Nome + Número de Documento) no texto colado.",
        totalProcessados: 0,
        prestadores: [],
    };
}
