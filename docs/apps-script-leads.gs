// Recebe os leads da Calculadora de Distrato (Imóvel Regular) e grava na aba "Leads".
// Implantado como App da Web: executar como "Eu", acesso "Qualquer pessoa".
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
      d.pagina
    ].map(limpar);
    aba.appendRow(linha);
    return ContentService.createTextOutput('ok');
  } catch (err) {
    return ContentService.createTextOutput('erro');
  } finally {
    lock.releaseLock();
  }
}

// Evita fórmula injetada pelo formulário e corta textos gigantes
function limpar(v) {
  if (v === null || v === undefined) return '';
  if (typeof v === 'number') return v;
  v = String(v).slice(0, 300);
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}
