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

    // 🎯 LIMPEZA EXTREMA: OCR costuma colocar ruídos em linhas vazias
    // Aumentamos a sensibilidade para capturar linhas mais curtas que podem ser nomes
    const linhas = textoLivre.split('\n')
        .map(l => l.trim())
        .filter(linha => linha.length > 2);

    const prestadoresEncontrados: PrestadorExtraido[] = [];
    let falhas = 0;

    // 🎯 REGEX HARDENED: Suporta diversos formatos de documento
    const docRegex = /([0-9]{1,3}[\.\, \-]?)([0-9]{3}[\.\, \-]?)([0-9]{3}[\.\, \-]?)([0-9X]{1,2})/gi;

    linhas.forEach(linha => {
        // Ignorar linhas puramente ruidosas (muito curtas e sem números)
        if (linha.length < 5 && !/\d/.test(linha)) {
            falhas++;
            return;
        }

        let linhaLimpa = linha.replace(/[—–]/g, '-');
        const matchesDoc = [...linhaLimpa.matchAll(docRegex)];

        if (matchesDoc && matchesDoc.length > 0) {
            // Pegar o match que parece mais um RG/CPF (geralmente o primeiro longo)
            // Filtramos matches curtos demais para serem documentos reais
            const matchValido = matchesDoc.find(m => m[0].replace(/\D/g, '').length >= 6) || matchesDoc[0];
            const docTexto = matchValido[0];
            const docLimpo = docTexto.replace(/[^0-9X]/gi, '');

            const partes = linhaLimpa.split(docTexto);
            let nome = "";
            let empresa = "";

            if (partes.length >= 1) {
                let antes = partes[0].trim();
                let depois = partes.slice(1).join(docTexto).trim();

                // Limpeza agressiva de prefixos
                antes = antes.replace(/^[0-9\.\-\s\(\)\*]+/, ''); 
                antes = antes.replace(/(RG|CPF|Doc|Documento|IDENTIDADE|NOME|PRESTADOR)[\s]*\:?/gi, '');
                antes = antes.replace(/^[-:/|.,\s]+|[-:/|.,\s]+$/g, '');

                // Limpeza agressiva de sufixos na empresa
                depois = depois.replace(/^[-:/|.,\s]+/, '');
                depois = depois.replace(/[-:/|.,\s]+$/g, '');
                depois = depois.replace(/^(EMPRESA|CIA|CORP)[\s]*\:?/gi, '');

                // Lógica de separação nome/empresa baseada em contexto
                const separadores = /[,|;]|\s{3,}/; 
                const partesEsquerda = antes.split(separadores).map(p => p.trim()).filter(p => p.length > 0);

                if (partesEsquerda.length >= 2) {
                    nome = partesEsquerda[0];
                    empresa = partesEsquerda.slice(1).join(' ') + (depois ? ' ' + depois : '');
                } else if (antes.length > 0) {
                    nome = antes;
                    empresa = depois;
                } else {
                    // Se o nome vier depois do documento
                    const partesDireita = depois.split(separadores).map(p => p.trim()).filter(p => p.length > 0);
                    if (partesDireita.length >= 1) {
                        nome = partesDireita[0];
                        empresa = partesDireita.slice(1).join(' ');
                    }
                }

                // 🎯 FORMATADOR DE TEXTO (CAPITALIZAÇÃO INTELIGENTE)
                const formatarIniciais = (texto: string) => {
                    const deDaDos = ['de', 'da', 'do', 'das', 'dos', 'e'];
                    return (texto || "").toLowerCase().split(' ').map(palavra => {
                        if (deDaDos.includes(palavra)) return palavra;
                        return palavra.charAt(0).toUpperCase() + palavra.slice(1);
                    }).join(' ').trim();
                };

                // 🎯 VALIDAÇÃO FINAL (Relaxada para garantir captura)
                if (nome.length >= 2 && nome.length < 100 && docLimpo.length >= 6) {
                    prestadoresEncontrados.push({
                        nome: formatarIniciais(nome),
                        doc1: docLimpo,
                        doc2: matchesDoc.length > 1 && matchesDoc[1][0] !== docTexto 
                               ? matchesDoc[1][0].replace(/[^0-9X]/gi, '') 
                               : undefined,
                        empresa: formatarIniciais(empresa)
                    });
                    return;
                }
            }
        }
        falhas++;
    });

    if (prestadoresEncontrados.length > 0) {
        return {
            sucesso: true,
            erro: falhas > 10 ? "Nota: Algumas linhas ruidosas na imagem foram ignoradas." : "",
            totalProcessados: prestadoresEncontrados.length,
            prestadores: prestadoresEncontrados,
        };
    }

    return {
        sucesso: false,
        erro: "Não conseguimos ler os nomes e documentos nesta imagem. Tente uma foto mais nítida ou aproximada.",
        totalProcessados: 0,
        prestadores: [],
    };
}
