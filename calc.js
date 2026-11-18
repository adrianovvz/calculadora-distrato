/*
 * Regras da estimativa de distrato — Imóvel Regular Advocacia.
 * Sem tela: recebe as respostas e devolve cenário, faixa de valores e "temperatura" do lead.
 * Usado pelo app (navegador) e pelos testes (node). Explicação completa em docs/calculadora-distrato.md
 */
(function (root) {
  'use strict';

  var REGRAS = {
    valorMinimo: 5000,   // valor pago (ou diferença) abaixo disso: lead frio
    valorQuente: 15000,  // valor estimado (ou diferença) a partir disso: lead quente
    // meses de atraso que contam para indenização, já descontados os 6 meses de tolerância
    mesesIndenizaveis: { '7-12': 3, '13-24': 12, '25+': 24 }
  };

  function arred(v) { return Math.round(v / 100) * 100; }

  function faixaDesistencia(r) {
    var P = r.valorPago, V = r.valorContrato;
    var antiga = r.assinatura === 'ate2018';
    // Contrato até 2018 e lote: muitas decisões limitam a retenção a 10%–25% do valor pago.
    // Imóvel na planta depois de 2018: Lei 4.591/64, art. 67-A (até 25%, ou 50% com patrimônio de afetação).
    var min = (antiga || r.tipo === 'lote') ? 0.75 : 0.50;
    var max = 0.90;
    var f = { pctMin: min, pctMax: max, min: arred(P * min), max: arred(P * max) };
    if (r.tipo === 'lote' && !antiga) {
      // Pior caso pelo contrato: multa de até 10% do valor do contrato (Lei 6.766/79, art. 32-A)
      var pior = Math.max(P - 0.10 * V, 0);
      if (pior < f.min) f.piorCaso = arred(pior);
    }
    return f;
  }

  function faixaIndenizacao(r, regras) {
    var m = regras.mesesIndenizaveis[r.mesesAtraso] || regras.mesesIndenizaveis['7-12'];
    var a = 0.01 * r.valorPago * m;      // 1% do valor pago por mês (art. 43-A, §2º)
    var b = 0.005 * r.valorContrato * m; // 0,5% do valor do imóvel por mês (aluguel presumido, STJ)
    return { min: arred(Math.min(a, b)), max: arred(Math.max(a, b)), meses: m };
  }

  function definirCenario(r) {
    var comChaves = r.chaves === 'sim';
    var atraso = r.tipo === 'pronto' ? 'nao' : r.atraso;
    if (atraso === 'mais6' && !comChaves) return 'CULPA';
    if (atraso === 'mais6' && comChaves) return 'INDENIZACAO';
    if (!comChaves && r.pagamento === 'banco') return 'BANCO';
    if (comChaves && (r.pagamento === 'banco' || r.pagamento === 'quitado')) return 'SEM_BASE';
    if (comChaves) return 'DESISTENCIA_POSSE';
    return 'DESISTENCIA';
  }

  function analisar(r, regrasExtra) {
    var regras = Object.assign({}, REGRAS, regrasExtra || {});
    var P = Number(r.valorPago), V = Number(r.valorContrato);
    if (!(P > 0) || !(V > 0)) throw new Error('Valores inválidos');

    var cenario = definirCenario(r);
    var res = {
      cenario: cenario,
      temperatura: 'morno',
      tipoValor: null,      // 'devolucao' | 'indenizacao' | null
      faixa: null,          // { min, max, pctMin, pctMax }
      adicional: null,      // indenização somada à devolução (cenário CULPA)
      comparacao: null,     // { oferta, diferencaMin, diferencaMax }
      motivoFrio: null      // 'valor' | 'sem_base'
    };

    if (cenario === 'CULPA') {
      res.tipoValor = 'devolucao';
      res.faixa = { pctMin: 1, pctMax: 1, min: arred(P), max: arred(P) };
      res.adicional = faixaIndenizacao(r, regras);
    } else if (cenario === 'INDENIZACAO') {
      res.tipoValor = 'indenizacao';
      res.faixa = faixaIndenizacao(r, regras);
    } else if (cenario === 'DESISTENCIA' || cenario === 'DESISTENCIA_POSSE') {
      res.tipoValor = 'devolucao';
      res.faixa = faixaDesistencia(r);
    }

    // Comparação com a proposta da construtora (acordo recebido ou distrato já assinado)
    var oferta = Number(r.oferta);
    if ((r.motivo === 'acordo' || r.motivo === 'assinado') && oferta > 0 && res.tipoValor === 'devolucao') {
      res.comparacao = {
        oferta: oferta,
        diferencaMin: Math.max(res.faixa.min - oferta, 0),
        diferencaMax: Math.max(res.faixa.max - oferta, 0)
      };
    }

    // Temperatura (filtro do lead)
    var t;
    if (cenario === 'BANCO' || cenario === 'SEM_BASE') {
      t = r.motivo === 'acordo' ? 'morno' : 'frio';
      if (t === 'frio') res.motivoFrio = 'sem_base';
    } else if (P < regras.valorMinimo) {
      t = 'frio';
      res.motivoFrio = 'valor';
    } else if (res.comparacao) {
      var d = res.comparacao.diferencaMax;
      if (r.motivo === 'assinado') {
        t = d >= 2 * regras.valorQuente ? 'quente' : d >= regras.valorMinimo ? 'morno' : 'frio';
        if (t === 'frio') res.motivoFrio = 'valor';
      } else {
        t = d >= regras.valorQuente ? 'quente' : 'morno';
      }
    } else if (cenario === 'CULPA') {
      t = 'quente';
    } else if (cenario === 'DESISTENCIA_POSSE') {
      t = 'morno';
    } else if (r.motivo === 'assinado') {
      t = 'morno';
    } else {
      t = res.faixa.max >= regras.valorQuente ? 'quente'
        : res.faixa.max >= regras.valorMinimo ? 'morno' : 'frio';
      if (t === 'frio') res.motivoFrio = 'valor';
    }
    // Parcelas atrasadas ou nome sujo = urgência: quem estava morno sobe para quente
    res.urgente = r.parcelas === 'atrasadas' || r.parcelas === 'negativado';
    if (res.urgente && t === 'morno' && (cenario === 'DESISTENCIA' || cenario === 'CULPA')) t = 'quente';
    res.temperatura = t;
    res.codigo = t.charAt(0).toUpperCase() + '-' + cenario;
    return res;
  }

  var api = { REGRAS: REGRAS, analisar: analisar, definirCenario: definirCenario };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.IRCalc = api;
})(this);
