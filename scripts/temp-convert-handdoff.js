import * as xlsx from 'xlsx';

function convertTeamToExcel() {
    const excelFilePath = 'C:\\Users\\fredm\\Downloads\\Quadro_Vigilantes_Postos.xlsx';

    const equipe = [
        { RE: "21338", Nome: "Aldo Cleiton", Funcao: "Vspp Inspetor", Escala: "12x36", "VSPP (Armado)": "Sim", "CNH (Motorista)": "Não" },
        { RE: "24290", Nome: "Cauã Mantovani", Funcao: "VSPP", Escala: "12x36", "VSPP (Armado)": "Sim", "CNH (Motorista)": "Não" },
        { RE: "24867", Nome: "Carlos Alberto da Silva", Funcao: "Vspp", Escala: "5x1", "VSPP (Armado)": "Sim", "CNH (Motorista)": "Não" },
        { RE: "21336", Nome: "Cláudio Tagavas de Souza", Funcao: "VSPP Coordenador", Escala: "12x36", "VSPP (Armado)": "Sim", "CNH (Motorista)": "Não" },
        { RE: "67980", Nome: "David Silva", Funcao: "Op. Monitoramento", Escala: "12x36", "VSPP (Armado)": "Não", "CNH (Motorista)": "Não" },
        { RE: "22348", Nome: "Diego Nascimento", Funcao: "Vigilante", Escala: "5x1", "VSPP (Armado)": "Não", "CNH (Motorista)": "Não" },
        { RE: "22099", Nome: "Diego Santos", Funcao: "Vigilante", Escala: "12x36", "VSPP (Armado)": "Não", "CNH (Motorista)": "Não" },
        { RE: "27307", Nome: "Diomisio Francisco do Amaral", Funcao: "Vigilante", Escala: "12x36", "VSPP (Armado)": "Não", "CNH (Motorista)": "Não" },
        { RE: "21339", Nome: "Edson Araújo", Funcao: "Vspp Inspetor", Escala: "12x36", "VSPP (Armado)": "Sim", "CNH (Motorista)": "Não" },
        { RE: "27128", Nome: "Edmar Viana", Funcao: "VSPP", Escala: "12x36", "VSPP (Armado)": "Sim", "CNH (Motorista)": "Não" },
        { RE: "165461", Nome: "Fábio Santos", Funcao: "Vigilante", Escala: "12x36", "VSPP (Armado)": "Não", "CNH (Motorista)": "Não" },
        { RE: "21638", Nome: "Francisco Clodoaldo de Oliveira", Funcao: "VSPP", Escala: "12x36", "VSPP (Armado)": "Sim", "CNH (Motorista)": "Não" },
        { RE: "22029", Nome: "Gean de Souza Silva", Funcao: "Vigilante", Escala: "12x36", "VSPP (Armado)": "Não", "CNH (Motorista)": "Não" },
        { RE: "21337", Nome: "Gilberto Lucas de Sales", Funcao: "VSPP Coordenador", Escala: "12x36", "VSPP (Armado)": "Sim", "CNH (Motorista)": "Não" },
        { RE: "22700", Nome: "Guilherme Silva", Funcao: "VSPP", Escala: "12x36", "VSPP (Armado)": "Sim", "CNH (Motorista)": "Não" },
        { RE: "21882", Nome: "Isabela Santana", Funcao: "Vigilante", Escala: "12x36", "VSPP (Armado)": "Não", "CNH (Motorista)": "Não" },
        { RE: "23710", Nome: "Icaro Santana da Conceição", Funcao: "Vigilante", Escala: "12x36", "VSPP (Armado)": "Não", "CNH (Motorista)": "Não" },
        { RE: "23843", Nome: "Jefferson Milanesi", Funcao: "Vigilante", Escala: "12x36", "VSPP (Armado)": "Não", "CNH (Motorista)": "Não" },
        { RE: "23204", Nome: "Joanes Santos", Funcao: "Vigilante", Escala: "12x36", "VSPP (Armado)": "Não", "CNH (Motorista)": "Não" },
        { RE: "27299", Nome: "José Alves", Funcao: "Vigilante", Escala: "12x36", "VSPP (Armado)": "Não", "CNH (Motorista)": "Não" },
        { RE: "21785", Nome: "Jonathan Santos", Funcao: "Vigilante", Escala: "12x36", "VSPP (Armado)": "Não", "CNH (Motorista)": "Não" },
        { RE: "22866", Nome: "Lindevaldo Martins da Silva", Funcao: "VSPP", Escala: "12x36", "VSPP (Armado)": "Sim", "CNH (Motorista)": "Não" },
        { RE: "68317", Nome: "Luiz Fernando Martins", Funcao: "Op. Monitoramento", Escala: "12x36", "VSPP (Armado)": "Não", "CNH (Motorista)": "Não" },
        { RE: "56996", Nome: "Marcus Vinícius Mariano", Funcao: "Op. Monitoramento", Escala: "12x36", "VSPP (Armado)": "Não", "CNH (Motorista)": "Não" },
        { RE: "50710", Nome: "Marcus Vinícius de Oliveira Silva", Funcao: "Técnico CFTV", Escala: "5x2", "VSPP (Armado)": "Não", "CNH (Motorista)": "Não" },
        { RE: "25552", Nome: "Marta Natalia Pessoa", Funcao: "Vigilante", Escala: "12x36", "VSPP (Armado)": "Não", "CNH (Motorista)": "Não" },
        { RE: "23788", Nome: "Marcio Moreira", Funcao: "Vigilante", Escala: "12x36", "VSPP (Armado)": "Não", "CNH (Motorista)": "Não" },
        { RE: "26583", Nome: "Nadja Edileusa de moras Candido", Funcao: "Vigilante", Escala: "12x36", "VSPP (Armado)": "Não", "CNH (Motorista)": "Não" },
        { RE: "25858", Nome: "Patrick Albuquerque", Funcao: "VSPP", Escala: "5x1", "VSPP (Armado)": "Sim", "CNH (Motorista)": "Não" },
        { RE: "23181", Nome: "Rodrigo Santos", Funcao: "Vigilante", Escala: "12x36", "VSPP (Armado)": "Não", "CNH (Motorista)": "Não" },
        { RE: "24231", Nome: "Rodrigo Santos Siqueira", Funcao: "VSPP", Escala: "12x36", "VSPP (Armado)": "Sim", "CNH (Motorista)": "Não" },
        { RE: "50723", Nome: "Ruth Perez Pereira Sioji", Funcao: "Assistente Administrativo", Escala: "12x36", "VSPP (Armado)": "Não", "CNH (Motorista)": "Não" },
        { RE: "50770", Nome: "Suelen Prado", Funcao: "Op. Monitoramento", Escala: "12x36", "VSPP (Armado)": "Não", "CNH (Motorista)": "Não" },
        { RE: "50729", Nome: "Tatiana Araujo Rocha", Funcao: "Assistente Administrativo", Escala: "12x36", "VSPP (Armado)": "Não", "CNH (Motorista)": "Não" },
        { RE: "25527", Nome: "Thais da Silva Leme", Funcao: "Vigilante", Escala: "12x36", "VSPP (Armado)": "Não", "CNH (Motorista)": "Não" },
        { RE: "21347", Nome: "Tiago de Lima Alexandre", Funcao: "Vspp Inspetor", Escala: "12x36", "VSPP (Armado)": "Sim", "CNH (Motorista)": "Não" },
        { RE: "21348", Nome: "Thiago Guimarães", Funcao: "Vspp Inspetor", Escala: "12x36", "VSPP (Armado)": "Sim", "CNH (Motorista)": "Não" },
        { RE: "16552", Nome: "Warlen Venturini Candido", Funcao: "Vigilante", Escala: "12x36", "VSPP (Armado)": "Não", "CNH (Motorista)": "Não" },
        { RE: "26157", Nome: "Willians Junior", Funcao: "Vigilante folguista 5x1", Escala: "5x1", "VSPP (Armado)": "Não", "CNH (Motorista)": "Não" }
    ];

    const postos = [
        { Nivel: "Crítico (Nível 1)", Posto: "25 - Entrada Principal", "Exige VSPP/Arma": "Sim", "Exige CNH": "Não" },
        { Nivel: "Crítico (Nível 1)", Posto: "41 - Entrada Veículos Sócios", "Exige VSPP/Arma": "Sim", "Exige CNH": "Não" },
        { Nivel: "Intermediário (Nível 2)", Posto: "42 - Entrada Colégio Alef", "Exige VSPP/Arma": "Não", "Exige CNH": "Não" },
        { Nivel: "Intermediário (Nível 2)", Posto: "43 - Entrada Hungria (Teatros)", "Exige VSPP/Arma": "Não", "Exige CNH": "Não" },
        { Nivel: "Intermediário (Nível 2)", Posto: "51 - Chapeira / Eclusa Mat.", "Exige VSPP/Arma": "Não", "Exige CNH": "Não" },
        { Nivel: "Intermediário (Nível 2)", Posto: "56 - Revista Eclusa Principal", "Exige VSPP/Arma": "Não", "Exige CNH": "Não" },
        { Nivel: "Intermediário (Nível 2)", Posto: "57 - Revista Eclusa Estac.", "Exige VSPP/Arma": "Não", "Exige CNH": "Não" },
        { Nivel: "Básico (Nível 3)", Posto: "44 - Entrada Func/Prestadores", "Exige VSPP/Arma": "Não", "Exige CNH": "Não" }
    ];

    try {
        const workbook = xlsx.utils.book_new();

        // Planilha de Equipe
        const equipeSheet = xlsx.utils.json_to_sheet(equipe);
        xlsx.utils.book_append_sheet(workbook, equipeSheet, "Equipe");

        // Planilha de Postos
        const postosSheet = xlsx.utils.json_to_sheet(postos);
        xlsx.utils.book_append_sheet(workbook, postosSheet, "Postos");

        console.log(`Gerando arquivo Excel de Equipe/Postos: ${excelFilePath}`);
        xlsx.writeFile(workbook, excelFilePath);

        console.log('Arquivo Excel do Handoff criado!');
    } catch (error) {
        console.error('Erro ao converter o arquivo:', error);
    }
}

convertTeamToExcel();
