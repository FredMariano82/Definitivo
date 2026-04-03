# Notas de Conhecimento Operacional - Painel Tático

Este documento consolida as regras de negócio e fluxos operacionais de "Giro dos Postos" e "Rendição" conforme o treinamento fornecido pelo gestor operacional.

---

## 🕒 Fluxo de Almoço e Café

### Primeiro Turno (Manhã)
*   **11:00 (Início do Almoço):** Os **Rendicionistas** chegam à base e iniciam o giro. Eles rendem primeiro o pessoal dos postos **41 (Bico)** e **42 (Angelina)** para o almoço.
*   **11:30 (Troca):** O pessoal dos postos que foi almoçar às 11:00 volta e assume outros postos ou apoia a rendição.
*   **12:00 (Segundo Turno de Almoço):** Rendição dos postos **56 (Raio X Estacionamento)** e **57 (Raio X Alceu)**.
*   **12:30 (Terceiro Turno e Fechamento):** O posto **51 (Chapeira)** fecha as atividades. O profissional que estava na 51 vai almoçar e, no retorno, ele é responsável por render o profissional do posto **44 (Funcionários)**.

### Pausas de Café
*   **Manhã (Início):** Alguns profissionais realizam a pausa para o café logo no início do turno, aproveitando que postos como a **51** ainda estão fechados.
*   **14:00 (Segundo Giro de Café):** Inicia-se um novo giro de pausas de café. Os primeiros a sair para o café são os que almoçaram às **11:00**.

---

## 🚀 Regras de Sistema Implementadas

1.  **Auto-Cura de Postos:** O sistema cria automaticamente o posto `RENDICIONISTA` caso ele não exista no banco, garantindo que o Giro de Postos nunca quebre por falta de ID.
2.  **Rendição Inteligente:** Ao arrastar um profissional para um posto ocupado, o sistema:
    *   Sugerere destinos para o profissional rendido (Café, Refeição, Janta, Ceia ou Reserva).
    *   Inicia automaticamente o cronômetro correspondente:
        *   **Café:** 15 minutos.
        *   **Refeição/Ceia:** 60 minutos.
        *   **Janta:** 30 minutos.
3.  **Filtragem Hierárquica:** O posto `RENDICIONISTA` é exibido em destaque no topo da Torre de Controle e filtrado da lista geral para evitar confusão visual.

---
> [!NOTE]
> Estas regras foram integradas ao `PainelTaticoV2.tsx` e são o coração da gestão operacional automatizada.
