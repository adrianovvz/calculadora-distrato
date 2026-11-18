# Calculadora de Distrato — Imóvel Regular Advocacia

Página de captação que filtra leads de distrato imobiliário, com marca, regras e textos próprios da Imóvel Regular.

No ar: https://adrianovvz.github.io/calculadora-distrato/ (GitHub Pages, publicado a cada envio para `main`, só se os testes passarem).

## Arquivos

| Arquivo | Para que serve |
|---|---|
| `index.html` | Página (topo, cartão, rodapé, pixel do Meta) |
| `config.js` | **Único arquivo do dia a dia**: WhatsApp, pixel, webhook de leads, OAB, cortes do filtro |
| `calc.js` | Regras da estimativa (sem tela). Testado em `tests/calc.test.js` |
| `app.js` | Perguntas, navegação, resultado, mensagem de WhatsApp, eventos |
| `style.css` | Visual (azul-marinho da marca, fontes Manrope + DM Sans, como na proposta) |
| `assets/` | Logo IR, favicon e imagem de compartilhamento |

Testes: `node --test` (17 casos). Rodam também no GitHub a cada envio; se falharem, nada é publicado.

## Roteiro de perguntas

1. Tipo de imóvel: planta / lote / pronto parcelado com a construtora
2. O que está acontecendo: parcelas pesaram / quero sair / obra atrasou / recebi proposta de acordo / já assinei distrato / penso em vender no ágio
3. Valores: valor do contrato + quanto já pagou (do próprio bolso)
4. *(só para acordo ou distrato assinado)* quanto a construtora ofereceu/devolveu — botão "ainda não sei"
5. Entrega: recebeu as chaves (lote: construiu/mora)? + atrasou? (não / até 6 meses / mais de 6)
6. *(só se atraso > 6 meses)* quanto tempo: 7–12 meses / 1–2 anos / mais de 2 anos
7. Contrato: assinado até 2018 / de 2019 em diante / não lembro + como paga (direto / banco / quitado)
8. Por onde nos conheceu
9. Nome, WhatsApp, e-mail (opcional)

(Pergunta de parcelas — em dia / atrasadas / nome sujo — entra logo depois do item 2. A pergunta de corretagem saiu para encurtar o funil.)

## Cenários e conta

`P` = valor pago, `V` = valor do contrato.

| Cenário | Quando | Estimativa | Lead |
|---|---|---|---|
| `CULPA` | atraso > 6 meses e sem chaves | devolução de 100% de `P` + indenização de `min/max(1%·P·m ; 0,5%·V·m)` | quente |
| `INDENIZACAO` | atraso > 6 meses e já com chaves | indenização `min/max(1%·P·m ; 0,5%·V·m)` | quente se máx ≥ R$ 15 mil, senão morno |
| `DESISTENCIA` | sem chaves, sem atraso longo, pagando direto ou quitado | contrato até 2018 ou lote: 75%–90% de `P`; planta/pronto depois de 2018: 50%–90%. Lote mostra à parte o pior caso do contrato: `P − 10%·V` | quente se máx ≥ R$ 15 mil; morno se ≥ R$ 5 mil; senão frio |
| `DESISTENCIA_POSSE` | com chaves, pagando direto | mesma faixa, avisando o desconto pelo uso (0,5%·V/mês; lote 0,75%) | morno |
| `BANCO` | sem chaves, sem atraso longo, financiamento bancário assinado | sem valor | frio (morno se recebeu proposta de acordo) |
| `SEM_BASE` | com chaves, sem atraso longo, banco ou quitado | sem valor | frio (morno se recebeu proposta de acordo) |

`m` = meses indenizáveis já descontada a tolerância de 6 meses: 7–12 → 3; 1–2 anos → 12; mais de 2 anos → 24.

Regras extras:
- Oferta principal (18/11/2026): distrato de lote — "você pode receber de volta até 90% do que pagou, corrigido, em parcela única e sem ficar com o nome sujo". Lote é a primeira opção e a abertura fala de lote.
- Parcelas atrasadas ou nome sujo: morno de desistência/culpa vira quente (urgência) e o resultado explica o pedido de suspensão das parcelas e da negativação.
- Valor pago abaixo de R$ 5 mil → frio (custo da ação perto do que se recupera).
- Proposta de acordo: compara com a faixa. Diferença ≥ R$ 15 mil → quente; senão morno.
- Distrato já assinado: diferença ≥ R$ 30 mil → quente; ≥ R$ 5 mil → morno; senão frio.
- Imóvel pronto não pergunta atraso de obra.
- Contrato com data "não lembro" usa a regra mais rigorosa (pós-2018).

Base legal citada na tela: Lei 13.786/2018 (Lei do Distrato), Lei 4.591/64 arts. 43-A e 67-A, Lei 6.766/79 art. 32-A, Súmula 543 do STJ. Os percentuais são **estimativas** para triagem, não cálculo judicial.

## O filtro

- **Quente / morno**: veem o botão "Falar com um advogado" no WhatsApp, com a mensagem pronta (respostas + estimativa + código).
- **Frio**: recebe explicação honesta e convite para seguir o Instagram, **sem** botão de WhatsApp (o time não gasta tempo). Para mostrar o botão a todos: `contatoParaFrios: true`.
- **Código na mensagem** (ex.: `Q-CULPA`, `M-DESISTENCIA_POSSE`): a primeira letra diz a temperatura (Q quente, M morno, F frio) para o atendimento priorizar.
- **Pixel do Meta**: `Lead` só para quente/morno; frio vira `LeadFrio` (evento personalizado). Assim a campanha otimiza para lead bom.

## Diferenciais em relação às calculadoras comuns do mercado

1. Mostra **valor em reais** (faixa), não só percentual.
2. **Compara com a proposta da construtora** e mostra quanto pode estar ficando na mesa.
3. Cobre **lote**, **imóvel pronto**, **distrato já assinado** e **venda no ágio** (os 4 cenários da proposta comercial).
4. Botão **Voltar**, barra de progresso, erros na própria tela (sem pop-up), teclado numérico no celular.
5. Lead frio não chega no WhatsApp; o Meta aprende só com lead bom.
6. Captura **UTM / fbclid / gclid** e envia junto com o lead.
7. Resultado diz **quais documentos separar** antes da conversa.
8. Linguagem dentro do Provimento 205/2021 da OAB: estimativa, sem promessa de resultado.
9. Proteção contra código malicioso no nome digitado .
10. Não trava se o envio do lead falhar.

## Configurar

Editar `config.js`:
- `whatsapp`: número com 55 + DDD, só dígitos.
- `metaPixelId`: ID do pixel da conta de anúncios da Imóvel Regular.
- `webhookUrl` e `webhookUrls`: endereços que recebem o lead em JSON (CRM, planilha). Pode ter mais de um. Especificação para o programador do CRM: `docs/integracao-crm.md`. O envio usa `text/plain` para funcionar com Google Apps Script sem bloqueio de CORS.
- `oab`: registro exibido no rodapé.
- `valorMinimo` / `valorQuente`: cortes do filtro.

Depois de mudar, trocar `?v=N` em `index.html` para o navegador não usar a versão antiga guardada.

## Teste local

O servidor de pré-visualização do app não lê a pasta Downloads (bloqueio do macOS). Para testar: copiar a pasta para o scratchpad e servir de lá (ver `.claude/launch.json` na pasta do projeto).
