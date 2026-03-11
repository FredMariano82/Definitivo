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

                    // Limpa traços colados ao lado do nome (ex: "Joãozinho -")
                    parteEsquerda = parteEsquerda.replace(/(RG|CPF|Doc|Documento)[\s]*\:?/gi, '');
                    parteEsquerda = parteEsquerda.replace(/^[-:/|.,\s]+|[-:/|.,\s]+$/g, '');

                    // NOVA REGRA (OCR Limpeza Extrema Frontal): 
                    // Lê o começo da frase e apaga TUDO (símbolos de bullet point, asteriscos, números, espaços)
                    // até bater de frente com a PRIMEIRA LETRA (incluindo letras acentuadas).
                    parteEsquerda = parteEsquerda.replace(/^[^a-zA-ZÀ-ÿ]+/g, '');

                    const nomeProvavel = parteEsquerda.trim();
                    const nomeLcase = nomeProvavel.toLowerCase();
                    const palavrasProibidas = ['solicita', 'segue', 'obrigado', 'favor', 'verifiquem', 'incluir', 'bom ', 'boa ', 'olá', 'boa tarde'];
                    const temPalavraProibida = palavrasProibidas.some(palavra => nomeLcase.includes(palavra));

                    if (nomeProvavel.length > 2 && !temPalavraProibida) {
                        prestadoresEncontrados.push({
                            nome: nomeProvavel,
                            doc1: docPrincipal,
                            doc2: matchesDoc.length > 1 ? (matchesDoc[1][1] || matchesDoc[1][0]).replace(/[^0-9X]/gi, '') : undefined,
                            empresa: ""
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
