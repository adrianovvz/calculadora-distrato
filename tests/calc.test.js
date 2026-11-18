// Testes das regras da calculadora. Rodar: node --test tests/
const test = require('node:test');
const assert = require('node:assert/strict');
const { analisar } = require('../calc.js');

const base = { tipo: 'planta', motivo: 'sair', chaves: 'nao', atraso: 'nao', assinatura: 'depois2018', pagamento: 'direto', corretagem: 'sim', valorContrato: 400000, valorPago: 60000 };
const caso = (extra) => analisar(Object.assign({}, base, extra));

test('atraso de mais de 6 meses sem chaves: devolução integral + indenização, lead quente', () => {
  const r = caso({ atraso: 'mais6', mesesAtraso: '13-24', valorPago: 80000 });
  assert.equal(r.cenario, 'CULPA');
  assert.deepEqual([r.faixa.min, r.faixa.max], [80000, 80000]);
  assert.deepEqual([r.adicional.min, r.adicional.max], [9600, 24000]); // 1% x 80 mil x 12 | 0,5% x 400 mil x 12
  assert.equal(r.temperatura, 'quente');
  assert.equal(r.codigo, 'Q-CULPA');
});

test('chaves recebidas com atraso longo: indenização', () => {
  const r = caso({ chaves: 'sim', atraso: 'mais6', mesesAtraso: '7-12', valorContrato: 500000, valorPago: 100000 });
  assert.equal(r.cenario, 'INDENIZACAO');
  assert.deepEqual([r.faixa.min, r.faixa.max], [3000, 7500]);
  assert.equal(r.temperatura, 'morno');
});

test('desistência em contrato novo: 50% a 90% do pago', () => {
  const r = caso({});
  assert.equal(r.cenario, 'DESISTENCIA');
  assert.deepEqual([r.faixa.min, r.faixa.max], [30000, 54000]);
  assert.equal(r.temperatura, 'quente');
});

test('desistência em contrato até 2018: 75% a 90% do pago', () => {
  const r = caso({ assinatura: 'ate2018' });
  assert.deepEqual([r.faixa.min, r.faixa.max], [45000, 54000]);
});

test('lote: multa limitada a 10% do valor do contrato', () => {
  const r = caso({ tipo: 'lote', valorContrato: 100000, valorPago: 30000 });
  assert.deepEqual([r.faixa.min, r.faixa.max], [20000, 27000]);
});

test('lote com pouco pago: mínimo nunca fica negativo', () => {
  const r = caso({ tipo: 'lote', valorContrato: 100000, valorPago: 8000 });
  assert.equal(r.faixa.min, 0);
  assert.equal(r.faixa.max, 7200);
  assert.equal(r.temperatura, 'morno');
});

test('financiamento no banco, obra no prazo: lead frio (filtro)', () => {
  const r = caso({ pagamento: 'banco' });
  assert.equal(r.cenario, 'BANCO');
  assert.equal(r.temperatura, 'frio');
  assert.equal(r.faixa, null);
});

test('financiamento no banco mas com proposta de acordo: vira morno', () => {
  assert.equal(caso({ pagamento: 'banco', motivo: 'acordo' }).temperatura, 'morno');
});

test('chaves recebidas, sem atraso e já quitado: frio', () => {
  const r = caso({ chaves: 'sim', pagamento: 'quitado' });
  assert.equal(r.cenario, 'SEM_BASE');
  assert.equal(r.temperatura, 'frio');
});

test('chaves recebidas pagando direto: distrato com desconto de uso, morno', () => {
  const r = caso({ chaves: 'sim' });
  assert.equal(r.cenario, 'DESISTENCIA_POSSE');
  assert.equal(r.temperatura, 'morno');
});

test('valor pago muito baixo: frio por valor', () => {
  const r = caso({ valorPago: 3000 });
  assert.equal(r.temperatura, 'frio');
  assert.equal(r.motivoFrio, 'valor');
});

test('proposta de acordo abaixo da estimativa: mostra a diferença e é quente', () => {
  const r = caso({ motivo: 'acordo', valorPago: 100000, oferta: 40000 });
  assert.deepEqual(r.comparacao, { oferta: 40000, diferencaMin: 10000, diferencaMax: 50000 });
  assert.equal(r.temperatura, 'quente');
});

test('proposta de acordo acima da estimativa: sem diferença, morno', () => {
  const r = caso({ motivo: 'acordo', valorPago: 100000, oferta: 95000 });
  assert.equal(r.comparacao.diferencaMax, 0);
  assert.equal(r.temperatura, 'morno');
});

test('distrato já assinado com diferença média: morno', () => {
  const r = caso({ motivo: 'assinado', valorPago: 100000, oferta: 70000 });
  assert.equal(r.comparacao.diferencaMax, 20000);
  assert.equal(r.temperatura, 'morno');
});

test('imóvel pronto ignora pergunta de atraso de obra', () => {
  assert.equal(caso({ tipo: 'pronto', atraso: 'mais6' }).cenario, 'DESISTENCIA');
});

test('valores inválidos são recusados', () => {
  assert.throws(() => caso({ valorPago: 0 }));
  assert.throws(() => caso({ valorContrato: NaN }));
});

test('cortes do filtro podem ser ajustados pela configuração', () => {
  const r = analisar(Object.assign({}, base), { valorQuente: 100000 });
  assert.equal(r.temperatura, 'morno');
});
