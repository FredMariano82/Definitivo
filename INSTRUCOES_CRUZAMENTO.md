# Instruções: Cruzamento de Planilhas 📈🔄

Para realizar o cruzamento de dados entre o ADM e o ID Control com facilidade, siga estes passos:

### 1. Preparação dos Arquivos
Coloque estes dois arquivos na sua pasta de **Downloads** com estes nomes exatos:

*   **Planilha do ADM**: `CRUZAR ADM.xlsx`
*   **Planilha do ID Control**: `CRUZAR ID CONTROL.xlsx` (ou `.csv`)

### 2. Execução
Abra o terminal e rode o comando:
```powershell
node scripts/manual_merge_planilhas.js
```

### 3. Resultado
O arquivo final com os dados cruzados e vencimentos atualizados (soma de 6 meses) será gerado na mesma pasta com o nome:
*   **`RESULTADO CRUZAMENTO.xlsx`**

---
> [!TIP]
> Você pode apenas renomear os arquivos que baixou. Não precisa mais procurar pastas de sistema ou lidar com nomes complexos como "Pessoas_2025...".
