# Prompt para o agente do navegador (Claude no Chrome)

Colar no Claude do Chrome, com o Chrome já logado no Meta (Business da Imóvel Regular), no GitHub (adrianovvz) e no Google (adrianovvz@adrianovvz.com.br).

```text
Você vai deixar pronta para tráfego pago a calculadora de distrato da Imóvel Regular Advocacia:
https://adrianovvz.github.io/calculadora-distrato/
Faça tudo sozinho, na ordem abaixo. No fim, me entregue um resumo com o que foi feito e o que ficou pendente.

REGRAS (valem o tempo todo)
- Nunca digite senha nem código de verificação. Se aparecer tela de login ou senha, pare e me peça para digitar.
- Telas de permissão do Google ou do Meta ("Permitir", "Continuar como...", "Autorizar"): pare e me peça para clicar.
- Não crie, publique nem edite anúncios ou campanhas. Não gaste dinheiro. Não mande mensagem no WhatsApp para ninguém.
- Não mude nada fora do que está pedido aqui.
- Antes de criar qualquer coisa nova (pixel, projeto), confira se já existe uma com o mesmo nome. Se existir, use a que já existe.

DADOS
- WhatsApp do escritório (com 55 + DDD, só números): [PREENCHER OU DEIXAR VAZIO]
- URL de entrada de leads do CRM (passada pelo programador): [PREENCHER OU DEIXAR VAZIO]
- Planilha de leads: https://docs.google.com/spreadsheets/d/1EyUV_hnXBotyXzlj__9xjgrGuHfFIYuAA_Ncc1Gl-Hw/edit (aba "Leads")
- Repositório da página: https://github.com/adrianovvz/calculadora-distrato

PASSO 1 — WhatsApp
Se o WhatsApp acima estiver vazio, abra https://www.instagram.com/imovelregular.advocacia/ e procure o número (botão WhatsApp, link da bio ou contato). Me mostre o número que achou e espere eu confirmar antes de usar. Formato final: só dígitos, começando com 55 (ex.: 5511999999999).

PASSO 2 — Pixel do Meta da Imóvel Regular
1. Abra https://business.facebook.com/events_manager2 e escolha o portfólio/conta da IMÓVEL REGULAR (não use nada do Grupo VVZ).
2. Em "Fontes de dados", veja se já existe um pixel/conjunto de dados da Imóvel Regular. Se existir, anote o ID (só números).
3. Se não existir, crie: Conectar fontes de dados > Web > nome "Pixel Imóvel Regular - Calculadora" > Criar. Se perguntar como instalar, escolha instalar o código manualmente e só copie o ID; não instale nada em outro site. Anote o ID.
4. Se não achar o portfólio da Imóvel Regular ou não tiver acesso, pare e me avise.

PASSO 3 — Receptor da planilha (Google Apps Script)
1. Abra https://script.google.com/u/1/home e confira que a conta no canto é adrianovvz@adrianovvz.com.br. Se for outra conta ou pedir senha, pare e me chame.
2. Clique em "Novo projeto". Renomeie o projeto para "Receptor Leads Calculadora IR".
3. No arquivo Código.gs, apague tudo e cole exatamente o código entre INÍCIO DO CÓDIGO e FIM DO CÓDIGO (sem essas duas marcas). Depois de colar, confira linha por linha: o editor às vezes duplica ) } ' ou ". O código tem que ficar idêntico.
----- INÍCIO DO CÓDIGO -----
var PLANILHA_ID = '1EyUV_hnXBotyXzlj__9xjgrGuHfFIYuAA_Ncc1Gl-Hw';

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);
  try {
    var d = JSON.parse(e.postData.contents);
    if (!d || !d.nome || !d.whatsapp) return ContentService.createTextOutput('ignorado');
    var u = d.utm || {};
    var aba = SpreadsheetApp.openById(PLANILHA_ID).getSheetByName('Leads');
    var linha = [
      new Date(), d.temperatura, d.codigo, d.nome, d.whatsapp, d.email, d.tipo, d.motivo,
      d.valor_contrato, d.valor_pago, d.oferta, d.estimativa_min, d.estimativa_max,
      d.indenizacao_min, d.indenizacao_max, d.diferenca_proposta, d.chaves, d.atraso,
      d.meses_atraso, d.assinatura, d.pagamento, d.corretagem, d.origem,
      u.utm_source, u.utm_medium, u.utm_campaign, u.utm_content, u.utm_term, u.fbclid, u.gclid,
      d.pagina, d.parcelas
    ].map(limpar);
    aba.appendRow(linha);
    return ContentService.createTextOutput('ok');
  } catch (err) {
    return ContentService.createTextOutput('erro');
  } finally {
    lock.releaseLock();
  }
}

function limpar(v) {
  if (v === null || v === undefined) return '';
  if (typeof v === 'number') return v;
  v = String(v).slice(0, 300);
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}
----- FIM DO CÓDIGO -----
4. Salve (Ctrl+S ou ícone de disquete).
5. Implantar > Nova implantação > engrenagem "Selecione o tipo" > App da Web.
   - Descrição: "Leads calculadora"
   - Executar como: Eu (adrianovvz@adrianovvz.com.br)
   - Quem pode acessar: Qualquer pessoa
   - Clique em Implantar.
6. Se pedir "Autorizar acesso", pare e me chame para clicar nas telas do Google (inclusive "Avançado" > "Acessar projeto" > "Permitir").
7. Copie a "URL do app da Web" (termina em /exec). Esse é o RECEPTOR.

PASSO 4 — Ligar tudo na página (GitHub)
1. Abra https://github.com/adrianovvz/calculadora-distrato/edit/main/config.js
2. Troque só os valores destas linhas, sem mexer no resto do arquivo:
   whatsapp: ''          ->  whatsapp: 'NUMERO_DO_PASSO_1'
   metaPixelId: ''       ->  metaPixelId: 'ID_DO_PASSO_2'
   webhookUrl: ''        ->  webhookUrl: 'URL_RECEPTOR_DO_PASSO_3'
   webhookUrls: []       ->  webhookUrls: ['URL_DO_CRM']   (só se a URL do CRM foi preenchida em DADOS; senão deixe [])
   Confira que cada valor ficou entre aspas simples, com a vírgula no fim da linha, e sem aspas duplicadas pelo editor.
3. "Commit changes..." > mensagem "Liga WhatsApp, pixel e receptor de leads" > "Commit directly to the main branch" > Commit.
4. Abra https://github.com/adrianovvz/calculadora-distrato/actions e espere a execução mais recente ficar verde (1 a 2 minutos). Se ficar vermelha, pare e me mostre o erro.

PASSO 5 — Teste de ponta a ponta
1. Em uma janela anônima nova (Ctrl+Shift+N), abra:
   https://adrianovvz.github.io/calculadora-distrato/?utm_source=teste&utm_campaign=validacao
2. Faça a simulação: Lote ou terreno > As parcelas pesaram > Tenho parcelas atrasadas > contrato R$ 120000, pago R$ 50000 > chaves: Não, atraso: Não atrasou > De 2019 em diante + Parcelas direto > Instagram > nome "TESTE IMOVEL REGULAR", WhatsApp (11) 90000-0000 > Ver meu resultado.
3. Confira no resultado: "Caso com bom potencial" e estimativa de R$ 37.500 a R$ 45.000.
4. Passe o mouse no botão "Falar com um advogado" (NÃO clique) e confira que o link começa com https://wa.me/ + o número do passo 1.
5. Abra a planilha (link em DADOS) e confira que apareceu uma linha nova com "TESTE IMOVEL REGULAR" e utm_source "teste". Pode levar até 1 minuto.
6. Se o CRM foi ligado, me avise para eu confirmar com o programador se o lead de teste chegou lá.
7. Pixel: no Gerenciador de Eventos, abra o pixel do passo 2 > "Testar eventos" > cole a URL da calculadora > abra pelo botão e refaça a simulação com o mesmo nome de teste. Confira que aparecem os eventos PageView, ViewContent, InitiateCheckout e Lead.

RESUMO FINAL
Me entregue: número de WhatsApp usado, ID do pixel, URL do receptor (/exec), se o CRM foi ligado, e o resultado de cada teste do passo 5 (ok ou o que deu errado, com print).
```
