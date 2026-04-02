# 🚨 LEMBRETE: ROBÔ 10 (iDClass)

**Status**: Pronto para execução (Diagnóstico de Leitura).
**Objetivo**: Validar a integridade dos dados (Facial/Biometria) antes de atualizar datas de liberação.

### Passos para hoje à noite:
1.  **IP**: Pegar o IP do iDClass no clube.
2.  **Configurar**: Abrir `scripts/robo10/leitura_segura.js` e inserir o IP na linha 8.
3.  **Executar**: Rodar `node scripts/robo10/leitura_segura.js`.
4.  **Analisar**: Verificar se os campos `image` e `templates` aparecem no JSON de resposta.

**Cuidado**: Não rodar nenhum script de atualização (Robô 4 antigo) antes desse diagnóstico!
