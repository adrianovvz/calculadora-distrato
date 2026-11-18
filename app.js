/*
 * Telas da calculadora de distrato — Imóvel Regular Advocacia.
 * A conta fica em calc.js; aqui ficam perguntas, navegação, resultado, WhatsApp, pixel e envio do lead.
 */
(function () {
  'use strict';

  var C = window.IR_CONFIG || {};
  var Calc = window.IRCalc;
  var app = document.getElementById('app');
  var CHAVE_SESSAO = 'ir_calc_v1';

  // ---------- Textos das opções ----------
  var ROTULOS = {
    tipo: { lote: 'Lote ou terreno em loteamento', planta: 'Apartamento ou casa na planta', pronto: 'Imóvel pronto, parcelado com a construtora' },
    motivo: {
      parcelas: 'As parcelas pesaram',
      sair: 'Mudei de planos e quero sair do contrato',
      atraso: 'As obras atrasaram ou a empresa não cumpriu o combinado',
      acordo: 'Recebi uma proposta de acordo ou distrato',
      assinado: 'Já assinei o distrato e acho que devolveram pouco',
      agio: 'Penso em vender no ágio'
    },
    parcelas: { emdia: 'Estou em dia', atrasadas: 'Tenho parcelas atrasadas', negativado: 'Já fui cobrado ou estou com o nome sujo' },
    chaves: { sim: 'Sim', nao: 'Não' },
    atraso: { nao: 'Não atrasou', ate6: 'Atrasou até 6 meses', mais6: 'Atrasou mais de 6 meses' },
    mesesAtraso: { '7-12': '7 a 12 meses', '13-24': '1 a 2 anos', '25+': 'Mais de 2 anos' },
    assinatura: { ate2018: 'Até 2018', depois2018: 'De 2019 em diante', naosei: 'Não lembro' },
    pagamento: { direto: 'Parcelas direto com a construtora ou loteadora', banco: 'Financiamento no banco já assinado', quitado: 'Já quitei' },
    corretagem: { sim: 'Sim', nao: 'Não', naosei: 'Não sei' },
    origem: { instagram: 'Instagram', facebook: 'Facebook', google: 'Google', youtube: 'YouTube', tiktok: 'TikTok', indicacao: 'Indicação', outro: 'Outro' }
  };

  function op(campo, valor, desc) { return { v: valor, l: ROTULOS[campo][valor], d: desc || '' }; }

  // ---------- Roteiro ----------
  var PASSOS = [
    {
      id: 'tipo', tipo: 'opcoes', campo: 'tipo',
      titulo: 'Que tipo de imóvel você comprou?',
      texto: 'Isso muda as regras do distrato.',
      opcoes: [
        op('tipo', 'lote', 'Comprado parcelado direto da loteadora'),
        op('tipo', 'planta', 'Comprado da construtora, em obra ou recém-entregue'),
        op('tipo', 'pronto', 'Já estava construído quando você comprou')
      ]
    },
    {
      id: 'motivo', tipo: 'opcoes', campo: 'motivo',
      titulo: 'O que está acontecendo com o seu contrato?',
      texto: 'Escolha a opção mais parecida com a sua situação.',
      opcoes: ['parcelas', 'sair', 'atraso', 'acordo', 'assinado', 'agio'].map(function (v) { return op('motivo', v); })
    },
    {
      id: 'parcelas', tipo: 'opcoes', campo: 'parcelas',
      titulo: 'Como estão as suas parcelas hoje?',
      texto: 'Isso ajuda a ver se é preciso agir rápido para proteger o seu nome.',
      opcoes: [op('parcelas', 'emdia'), op('parcelas', 'atrasadas'), op('parcelas', 'negativado')]
    },
    { id: 'valores', tipo: 'valores' },
    { id: 'oferta', tipo: 'oferta', mostrar: function (r) { return r.motivo === 'acordo' || r.motivo === 'assinado'; } },
    { id: 'entrega', tipo: 'duplo' },
    {
      id: 'meses', tipo: 'opcoes', campo: 'mesesAtraso',
      mostrar: function (r) { return r.tipo !== 'pronto' && r.atraso === 'mais6'; },
      titulo: 'Quanto tempo de atraso, mais ou menos?',
      texto: 'Conte a partir da data de entrega prometida no contrato.',
      opcoes: [op('mesesAtraso', '7-12'), op('mesesAtraso', '13-24'), op('mesesAtraso', '25+')]
    },
    { id: 'contrato', tipo: 'duplo' },
    {
      id: 'origem', tipo: 'opcoes', campo: 'origem', linha: true,
      titulo: 'Por onde você nos conheceu?',
      texto: 'Última pergunta antes do seu resultado.',
      opcoes: Object.keys(ROTULOS.origem).map(function (v) { return op('origem', v); })
    },
    { id: 'contato', tipo: 'form' }
  ];

  function gruposDuplo(id, r) {
    if (id === 'entrega') {
      var lote = r.tipo === 'lote';
      var g = [{
        campo: 'chaves',
        titulo: lote ? 'Você já construiu ou mora no lote?' : 'Você já recebeu as chaves?',
        opcoes: [op('chaves', 'sim'), op('chaves', 'nao')], linha: true
      }];
      if (r.tipo !== 'pronto') {
        g.push({
          campo: 'atraso',
          titulo: lote ? 'As obras do loteamento (asfalto, água, luz) atrasaram?' : 'A entrega da obra atrasou?',
          dica: 'Conte a partir da data prometida no contrato.',
          opcoes: [op('atraso', 'nao'), op('atraso', 'ate6'), op('atraso', 'mais6')]
        });
      }
      return { titulo: lote ? 'Sobre o lote e o loteamento' : 'Sobre a entrega do imóvel', grupos: g };
    }
    return {
      titulo: 'Sobre o seu contrato',
      grupos: [
        {
          campo: 'assinatura', titulo: 'Quando você assinou o contrato?', linha: true,
          opcoes: [op('assinatura', 'ate2018'), op('assinatura', 'depois2018'), op('assinatura', 'naosei')]
        },
        {
          campo: 'pagamento', titulo: 'Como você paga o imóvel?',
          opcoes: [op('pagamento', 'direto'), op('pagamento', 'banco', 'Caixa ou outro banco'), op('pagamento', 'quitado')]
        }
      ]
    };
  }

  // ---------- Estado ----------
  var estado = { r: {}, hist: [], atual: 'inicio', resultado: null, enviado: false };

  function salvar() {
    try { sessionStorage.setItem(CHAVE_SESSAO, JSON.stringify(estado)); } catch (e) { /* sem armazenamento */ }
  }
  function carregar() {
    try {
      var s = JSON.parse(sessionStorage.getItem(CHAVE_SESSAO) || 'null');
      if (s && s.r) {
        estado = s;
        if (estado.atual === 'carregando') estado.atual = estado.resultado ? 'resultado' : 'contato';
      }
    } catch (e) { /* ignora */ }
  }
  function recomecar() {
    estado = { r: {}, hist: [], atual: 'inicio', resultado: null, enviado: false };
    salvar();
    render();
  }

  // Origem do clique (UTM) fica guardada para ir junto com o lead
  var UTM = (function () {
    var chaves = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid'];
    var salvo = {};
    try { salvo = JSON.parse(sessionStorage.getItem('ir_utm') || '{}'); } catch (e) { salvo = {}; }
    var q = new URLSearchParams(location.search);
    chaves.forEach(function (k) { if (q.get(k)) salvo[k] = q.get(k); });
    try { sessionStorage.setItem('ir_utm', JSON.stringify(salvo)); } catch (e) { /* ignora */ }
    return salvo;
  })();

  function passosVisiveis() {
    return PASSOS.filter(function (p) { return !p.mostrar || p.mostrar(estado.r); });
  }
  function passoPorId(id) {
    for (var i = 0; i < PASSOS.length; i++) if (PASSOS[i].id === id) return PASSOS[i];
    return null;
  }
  function irPara(id) {
    if (estado.atual !== id) estado.hist.push(estado.atual);
    estado.atual = id;
    salvar();
    evento('etapa', { etapa: id });
    render();
  }
  function avancar() {
    var vis = passosVisiveis();
    if (estado.atual === 'inicio') return irPara(vis[0].id);
    var idx = -1;
    for (var i = 0; i < vis.length; i++) if (vis[i].id === estado.atual) idx = i;
    if (idx >= 0 && idx < vis.length - 1) irPara(vis[idx + 1].id);
  }
  function voltar() {
    var ant = estado.hist.pop();
    estado.atual = ant || 'inicio';
    salvar();
    render();
  }

  // ---------- Utilidades ----------
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function reais(v) {
    return 'R$ ' + Math.round(v || 0).toLocaleString('pt-BR');
  }
  function lerReais(s) {
    var d = String(s || '').split(',')[0].replace(/\D/g, '');
    return d ? Number(d) : 0;
  }
  function mascaraReais(el) {
    var n = lerReais(el.value);
    if (n > 999999999) n = 999999999;
    el.value = n ? reais(n) : '';
  }
  function mascaraFone(el) {
    var v = el.value.replace(/\D/g, '');
    if (v.indexOf('55') === 0 && v.length > 11) v = v.slice(2);
    v = v.slice(0, 11);
    if (v.length > 2) v = '(' + v.slice(0, 2) + ') ' + v.slice(2);
    if (v.length > 10) v = v.slice(0, 10) + '-' + v.slice(10);
    el.value = v;
  }
  // Em lote, quem vende é a loteadora
  function adaptar(html) {
    return estado.r.tipo === 'lote' ? html.replace(/construtora/g, 'loteadora') : html;
  }
  function primeiroNome(n) {
    var p = String(n || '').trim().split(/\s+/)[0] || '';
    return p ? p.charAt(0).toUpperCase() + p.slice(1).toLowerCase() : '';
  }
  function evento(nome, dados) {
    try {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push(Object.assign({ event: 'calc_' + nome }, dados || {}));
    } catch (e) { /* ignora */ }
  }
  function pixel(tipo, nome, dados) {
    if (typeof window.fbq === 'function') window.fbq(tipo, nome, dados || {});
  }

  var ICONE_ZAP = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M17.5 14.4c-.3-.1-1.8-.9-2-1s-.5-.1-.7.1-.8 1-.9 1.2-.3.2-.6.1a8.2 8.2 0 0 1-4-3.5c-.3-.5.3-.5.9-1.6.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6a1.2 1.2 0 0 0-.8.4 3.5 3.5 0 0 0-1.1 2.6 6 6 0 0 0 1.3 3.2 13.7 13.7 0 0 0 5.3 4.7c2 .8 2.7.9 3.7.8a3.1 3.1 0 0 0 2-1.4 2.5 2.5 0 0 0 .2-1.4c-.1-.2-.3-.3-.6-.4zM12 21.8a9.9 9.9 0 0 1-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4A9.8 9.8 0 1 1 12 21.8zm8.4-18.2A11.8 11.8 0 0 0 1.8 17.8L.1 24l6.4-1.7a11.8 11.8 0 0 0 5.6 1.4A11.8 11.8 0 0 0 20.4 3.6z"/></svg>';

  // ---------- Telas ----------
  function cabecalho() {
    var vis = passosVisiveis();
    var idx = 0;
    for (var i = 0; i < vis.length; i++) if (vis[i].id === estado.atual) idx = i;
    var pct = Math.round(((idx + 1) / vis.length) * 100);
    return '<div class="progresso-linha">' +
      '<button type="button" class="voltar" data-acao="voltar" aria-label="Voltar para a pergunta anterior">← Voltar</button>' +
      '<span class="etapa-num">Etapa ' + (idx + 1) + ' de ' + vis.length + '</span></div>' +
      '<div class="barra" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + pct + '"><i style="width:' + pct + '%"></i></div>';
  }

  function htmlOpcoes(campo, opcoes, linha) {
    var atual = estado.r[campo];
    return '<div class="opcoes' + (linha ? ' opcoes-linha' : '') + '" role="group">' + opcoes.map(function (o) {
      return '<button type="button" class="opcao" data-campo="' + campo + '" data-valor="' + esc(o.v) + '" aria-pressed="' + (atual === o.v) + '" aria-label="' + esc(o.l + (o.d ? '. ' + o.d : '')) + '">' +
        '<span class="txt"><span class="rot">' + esc(o.l) + '</span>' + (o.d ? '<span class="desc">' + esc(o.d) + '</span>' : '') + '</span>' +
        '<span class="marca" aria-hidden="true"></span></button>';
    }).join('') + '</div>';
  }

  function telaInicio() {
    return '<section class="tela">' +
      '<span class="sobretitulo">DISTRATO DE LOTE E TERRENO</span>' +
      '<h1 tabindex="-1">Quer desistir do seu lote? Veja quanto pode voltar para você.</h1>' +
      '<p class="sub">Rescindindo o contrato com a loteadora, você pode receber de volta <strong>até 90% do que pagou</strong>, corrigido, em parcela única e sem ficar com o nome sujo.</p>' +
      '<ul class="selos">' +
      '<li>Simulação gratuita em cerca de 2 minutos</li>' +
      '<li>Mostra quanto pode voltar e quanto a loteadora pode reter</li>' +
      '<li>Também vale para apartamento na planta</li>' +
      '</ul>' +
      '<button type="button" class="btn btn-primario" data-acao="comecar">Calcular minha devolução</button>' +
      '<p class="confianca">Baseada na Lei do Distrato (Lei 13.786/2018) e em decisões do STJ</p>' +
      '</section>';
  }

  function telaOpcoes(p) {
    return '<section class="tela">' + cabecalho() +
      '<h2 tabindex="-1">' + esc(p.titulo) + '</h2>' +
      (p.texto ? '<p class="sub">' + esc(p.texto) + '</p>' : '<div style="height:18px"></div>') +
      htmlOpcoes(p.campo, p.opcoes, p.linha) +
      '</section>';
  }

  function telaDuplo(p) {
    var d = gruposDuplo(p.id, estado.r);
    var html = '<section class="tela">' + cabecalho() + '<h2 tabindex="-1">' + esc(d.titulo) + '</h2><div style="height:18px"></div>';
    d.grupos.forEach(function (g) {
      html += '<div class="grupo"><p class="grupo-titulo">' + esc(g.titulo) + '</p>' + htmlOpcoes(g.campo, g.opcoes, g.linha) +
        (g.dica ? '<p class="dica">' + esc(g.dica) + '</p>' : '') + '</div>';
    });
    var completo = d.grupos.every(function (g) { return !!estado.r[g.campo]; });
    html += '<div style="height:22px"></div><button type="button" class="btn btn-primario" data-acao="avancar-duplo"' + (completo ? '' : ' disabled') + '>Avançar</button></section>';
    return html;
  }

  function telaValores() {
    var r = estado.r;
    var lote = r.tipo === 'lote';
    return '<section class="tela">' + cabecalho() +
      '<h2 tabindex="-1">Agora, os valores</h2>' +
      '<p class="sub">Não precisa ser exato. Um valor aproximado já ajuda.</p>' +
      '<label class="campo"><span class="campo-rot">Valor total do ' + (lote ? 'lote' : 'imóvel') + ' no contrato</span>' +
      '<input class="entrada entrada-dinheiro" id="valor-contrato" inputmode="numeric" autocomplete="off" placeholder="R$ 0" value="' + (r.valorContrato ? reais(r.valorContrato) : '') + '"></label>' +
      '<label class="campo"><span class="campo-rot">Quanto você já pagou até hoje <small>(entrada + parcelas)</small></span>' +
      '<input class="entrada entrada-dinheiro" id="valor-pago" inputmode="numeric" autocomplete="off" placeholder="R$ 0" value="' + (r.valorPago ? reais(r.valorPago) : '') + '"></label>' +
      '<p class="dica">Não conte o valor financiado pelo banco, só o que saiu do seu bolso.</p>' +
      '<p class="erro" id="erro" role="alert"></p>' +
      '<div style="height:18px"></div><button type="button" class="btn btn-primario" data-acao="salvar-valores">Avançar</button>' +
      '</section>';
  }

  function telaOferta() {
    var r = estado.r;
    var assinado = r.motivo === 'assinado';
    var html = '<section class="tela">' + cabecalho() +
      '<h2 tabindex="-1">' + (assinado ? 'Quanto a construtora devolveu (ou vai devolver)?' : 'Quanto a construtora ofereceu devolver?') + '</h2>' +
      '<p class="sub">Vamos comparar com a nossa estimativa para ver se ' + (assinado ? 'o valor foi justo.' : 'a proposta é justa.') + '</p>' +
      '<label class="campo"><span class="campo-rot">Valor ' + (assinado ? 'da devolução' : 'oferecido') + '</span>' +
      '<input class="entrada entrada-dinheiro" id="valor-oferta" inputmode="numeric" autocomplete="off" placeholder="R$ 0" value="' + (r.oferta ? reais(r.oferta) : '') + '"></label>' +
      '<p class="erro" id="erro" role="alert"></p>' +
      '<div style="height:8px"></div><button type="button" class="btn btn-primario" data-acao="salvar-oferta">Avançar</button>' +
      '<button type="button" class="btn-texto" data-acao="sem-oferta">Ainda não sei o valor</button>' +
      '</section>';
    return adaptar(html);
  }

  function telaForm() {
    var r = estado.r;
    return '<section class="tela">' + cabecalho() +
      '<h2 tabindex="-1">Seu resultado está pronto</h2>' +
      '<p class="sub">Informe seus dados para ver a estimativa do seu caso.</p>' +
      '<form id="form-lead" novalidate>' +
      '<label class="campo"><span class="campo-rot">Seu nome</span>' +
      '<input class="entrada" id="lead-nome" name="name" autocomplete="name" placeholder="Nome e sobrenome" value="' + esc(r.nome || '') + '"></label>' +
      '<label class="campo"><span class="campo-rot">Seu WhatsApp</span>' +
      '<input class="entrada" id="lead-zap" name="tel" type="tel" inputmode="tel" autocomplete="tel-national" placeholder="(00) 00000-0000" value="' + esc(r.whatsapp || '') + '"></label>' +
      '<label class="campo"><span class="campo-rot">Seu e-mail <small>(opcional)</small></span>' +
      '<input class="entrada" id="lead-email" name="email" type="email" inputmode="email" autocomplete="email" placeholder="voce@email.com" value="' + esc(r.email || '') + '"></label>' +
      '<p class="erro" id="erro" role="alert"></p>' +
      '<div style="height:6px"></div><button type="submit" class="btn btn-primario">Ver meu resultado</button>' +
      '<p class="aviso-dados">Seus dados ficam só com a Imóvel Regular Advocacia e são usados para falar sobre o seu caso.</p>' +
      '</form></section>';
  }

  function telaCarregando() {
    return '<section class="tela carregando">' +
      '<h2 tabindex="-1">Analisando o seu caso…</h2>' +
      '<ul class="passos-analise">' +
      '<li><i></i>Lendo as suas respostas</li>' +
      '<li><i></i>Aplicando a Lei do Distrato e o entendimento do STJ</li>' +
      '<li><i></i>Calculando a sua estimativa</li>' +
      '</ul></section>';
  }

  // ---------- Resultado ----------
  function textosResultado(r, res) {
    var t = { titulo: '', rotulo: '', fundamentos: [], extras: [], atencao: [], frio: [] };
    var lote = r.tipo === 'lote';
    var antiga = r.assinatura === 'ate2018';
    var corretagemPaga = r.corretagem === 'sim' || r.corretagem === 'naosei';

    switch (res.cenario) {
      case 'CULPA':
        t.titulo = 'o atraso pode ser responsabilidade da construtora';
        t.rotulo = 'Você pode ter direito à devolução de até';
        t.fundamentos.push('A lei aceita até 180 dias (6 meses) de tolerância na entrega. Passado esse prazo sem culpa sua, você pode pedir o fim do contrato. <small>Lei 4.591/64, art. 43-A, incluído pela Lei 13.786/2018</small>');
        t.fundamentos.push('Quando a culpa é da construtora, a devolução tende a ser integral, corrigida e de uma vez só. <small>Súmula 543 do STJ</small>');
        if (corretagemPaga) t.extras.push('A corretagem que você pagou também pode entrar na devolução.');
        if (r.pagamento === 'banco') t.extras.push('Os juros de obra pagos ao banco durante o atraso podem ser cobrados da construtora.');
        t.extras.push('Multa prevista no contrato pelo atraso, quando houver.');
        break;
      case 'INDENIZACAO':
        t.titulo = 'o atraso pode gerar indenização para você';
        t.rotulo = 'Indenização estimada pelo atraso';
        t.fundamentos.push('Passados os 6 meses de tolerância, cada mês de atraso pode gerar indenização, mesmo depois de receber as chaves. <small>Lei 4.591/64, art. 43-A, e entendimento do STJ</small>');
        t.fundamentos.push('A estimativa usa de 1% do valor pago a 0,5% do valor do imóvel por mês de atraso depois da tolerância (cerca de ' + res.faixa.meses + ' meses no seu caso).');
        if (r.pagamento === 'banco') t.extras.push('Os juros de obra pagos ao banco durante o atraso podem ser devolvidos.');
        t.extras.push('Multa prevista no contrato pelo atraso, quando houver.');
        break;
      case 'DESISTENCIA':
      case 'DESISTENCIA_POSSE':
        var posse = res.cenario === 'DESISTENCIA_POSSE';
        t.titulo = posse ? 'o distrato é possível, com desconto pelo tempo de uso' : 'você pode sair do contrato e receber parte do que pagou';
        t.rotulo = posse ? 'Estimativa de devolução, antes do desconto pelo uso' : 'Estimativa de devolução';
        if (antiga) {
          t.fundamentos.push('Para contratos assinados até 2018, a Justiça costuma limitar o desconto a algo entre 10% e 25% do valor pago. <small>Súmula 543 do STJ</small>');
        } else if (lote) {
          t.fundamentos.push('Em loteamentos, a lei limita a multa por desistência a 10% do valor do contrato, além de taxas. Muitas decisões, porém, limitam a retenção a algo entre 10% e 25% do que você pagou. <small>Lei 6.766/79, art. 32-A</small>');
          if (res.faixa.piorCaso !== undefined) {
            t.atencao.push('Se a loteadora aplicar a multa máxima do contrato, ' +
              (res.faixa.piorCaso < 1000 ? 'ela poderia ficar com quase tudo o que você pagou' : 'a devolução cairia para cerca de ' + reais(res.faixa.piorCaso)) +
              '. Esse desconto pode ser questionado na Justiça.');
          }
        } else {
          t.fundamentos.push('A Lei do Distrato permite reter até 25% do que você pagou, ou até 50% em empreendimentos com patrimônio de afetação. Descontos acima disso podem ser questionados. <small>Lei 4.591/64, art. 67-A</small>');
        }
        t.fundamentos.push('A construtora costuma querer devolver em várias parcelas. Na Justiça, é possível pedir a devolução corrigida e de uma vez só. <small>Súmula 543 do STJ</small>');
        if (r.assinatura === 'naosei') t.fundamentos.push('Como você não lembra a data do contrato, usamos a regra mais rigorosa. Se ele for de 2018 ou antes, o valor tende a ser maior.');
        if (posse) {
          t.atencao.push(lote
            ? 'Como você já usa o lote, a loteadora pode descontar uma taxa pelo tempo de uso (até 0,75% do valor do contrato por mês).'
            : 'Como você já recebeu as chaves, a construtora pode descontar uma taxa pelo tempo de uso (em regra, até 0,5% do valor do contrato por mês).');
        }
        if (r.atraso === 'ate6') t.extras.push('Se o atraso passar de 6 meses além do prazo, a devolução pode passar a ser integral.');
        if (corretagemPaga) t.extras.push('A corretagem pode ser descontada só se foi informada com clareza na compra. Se não foi, ela pode ser discutida.');
        if (r.motivo === 'parcelas') t.atencao.push('Parar de pagar sem orientação pode gerar multa, cobrança e até perda de valores. Converse com um advogado antes.');
        break;
      default:
        t.titulo = 'pelas suas respostas, o distrato tende a ser difícil';
        if (res.cenario === 'BANCO') {
          t.frio.push('Com o financiamento bancário já assinado e a obra dentro do prazo, o banco já entrou no negócio. Desfazer o contrato envolve regras do banco e costuma trazer custos altos e pouca vantagem.');
          t.frio.push('Se a obra atrasar mais de 6 meses além do prazo prometido, a situação muda. Vale refazer esta simulação.');
        } else {
          t.frio.push('Você já recebeu as chaves, não houve atraso relevante e o imóvel já foi pago (pelo banco ou à vista). A construtora cumpriu a parte dela, então não há base para desfazer o contrato por culpa dela.');
          t.frio.push('Se o seu objetivo é sair do imóvel, a venda costuma ser o caminho mais simples.');
        }
        if (res.temperatura !== 'frio') {
          t.atencao.push('Como você recebeu uma proposta da construtora, vale conferir as condições antes de assinar.');
        }
    }

    if (res.comparacao && res.comparacao.diferencaMax > 0) {
      t.titulo = r.motivo === 'assinado'
        ? 'o distrato que você assinou pode ter devolvido menos do que deveria'
        : 'a proposta da construtora pode estar abaixo do que você pode receber';
    }
    if (res.urgente && res.temperatura !== 'frio') {
      t.atencao.push('Com parcelas atrasadas, o nome pode ir para a lista de inadimplentes. Na ação de distrato, é comum pedir ao juiz que suspenda as parcelas e impeça a negativação enquanto o caso corre. Quanto antes, melhor.');
    }
    if (r.motivo === 'assinado') {
      t.atencao.push('Distrato já assinado pode ser revisto quando há desconto abusivo, mas é preciso analisar o documento e os prazos.');
    }
    if (r.motivo === 'agio' && res.tipoValor === 'devolucao') {
      t.extras.push('Vender no ágio pode render mais quando o imóvel valorizou, mas depende de achar comprador e da aprovação da construtora. Compare as duas saídas antes de decidir.');
    }
    if (res.temperatura === 'frio' && res.motivoFrio === 'valor') {
      t.titulo = 'o valor em jogo ainda é baixo para valer uma ação';
      t.frio.push('Com o valor envolvido até agora, os custos de uma ação podem ficar perto do que você recuperaria. Muitas vezes vale negociar direto com a construtora.');
    }
    return t;
  }

  function htmlValor(res, r) {
    if (!res.faixa) return '';
    var f = res.faixa;
    var html = '<div class="valor-box"><p class="valor-rot">' + esc(res._rotulo) + '</p><p class="valor-num">';
    if (f.min === f.max) html += '<span data-contar="' + f.max + '">' + reais(f.max) + '</span>';
    else html += '<span data-contar="' + f.min + '">' + reais(f.min) + '</span><span class="a">a</span><span data-contar="' + f.max + '">' + reais(f.max) + '</span>';
    html += '</p>';
    if (res.tipoValor === 'devolucao') {
      html += '<p class="valor-sub">dos ' + reais(r.valorPago) + ' que você pagou, com correção' + '</p>';
      var a = Math.round(f.pctMin * 100), b = Math.round(f.pctMax * 100);
      html += '<div class="divisao"><div class="divisao-barra" aria-hidden="true"><span class="seg-min" style="width:' + a + '%"></span><span class="seg-faixa" style="width:' + (b - a) + '%"></span></div>' +
        '<div class="divisao-legenda"><span>Pode voltar para você: <b>' + (a === b ? a + '%' : a + '% a ' + b + '%') + '</b></span>' +
        (b < 100 ? '<span>Pode ficar com a construtora: <b>' + (100 - b) + '%' + (a !== b ? ' a ' + (100 - a) + '%' : '') + '</b></span>' : '') + '</div></div>';
    } else {
      html += '<p class="valor-sub">pelo tempo de atraso informado</p>';
    }
    if (res.adicional) {
      html += '<p class="adicional">+ possível indenização pelo atraso: <b>' + reais(res.adicional.min) + ' a ' + reais(res.adicional.max) + '</b></p>';
    }
    return html + '</div>';
  }

  function htmlComparacao(res, r) {
    var c = res.comparacao;
    if (!c) return '';
    var assinado = r.motivo === 'assinado';
    var html = '<div class="comparar"><div><small>' + (assinado ? 'Devolução recebida' : 'Proposta da construtora') + '</small><strong>' + reais(c.oferta) + '</strong></div>' +
      '<div><small>Nossa estimativa</small><strong>' + reais(res.faixa.min) + '</strong>' +
      (res.faixa.min === res.faixa.max ? '' : '<small class="ate">a ' + reais(res.faixa.max) + '</small>') + '</div></div>';
    if (c.diferencaMax > 0) {
      html += '<p class="diferenca">Você pode estar deixando até <b>' + reais(c.diferencaMax) + '</b> com a construtora.' +
        (assinado ? '' : ' Não assine antes de entender a proposta.') + '</p>';
    } else {
      html += '<p class="diferenca ok">A proposta parece dentro do esperado. Mesmo assim, vale conferir as cláusulas antes de assinar.</p>';
    }
    return html;
  }

  function linkWhats(r, res) {
    var linhas = [
      'Olá! Fiz a simulação de distrato no site.',
      '',
      'Nome: ' + r.nome,
      'Imóvel: ' + ROTULOS.tipo[r.tipo],
      'Situação: ' + ROTULOS.motivo[r.motivo],
      'Valor do contrato: ' + reais(r.valorContrato),
      'Valor já pago: ' + reais(r.valorPago)
    ];
    if (r.oferta) linhas.push((r.motivo === 'assinado' ? 'Devolução recebida: ' : 'Proposta da construtora: ') + reais(r.oferta));
    linhas.push((r.tipo === 'lote' ? 'Construiu/mora no lote: ' : 'Recebeu as chaves: ') + ROTULOS.chaves[r.chaves]);
    if (r.tipo !== 'pronto') linhas.push('Atraso: ' + ROTULOS.atraso[r.atraso] + (r.mesesAtraso ? ' (' + ROTULOS.mesesAtraso[r.mesesAtraso] + ')' : ''));
    linhas.push('Contrato assinado: ' + ROTULOS.assinatura[r.assinatura]);
    linhas.push('Pagamento: ' + ROTULOS.pagamento[r.pagamento]);
    if (r.parcelas) linhas.push('Parcelas: ' + ROTULOS.parcelas[r.parcelas]);
    if (r.corretagem) linhas.push('Pagou corretagem: ' + ROTULOS.corretagem[r.corretagem]);
    if (res.faixa) linhas.push('Estimativa: ' + (res.faixa.min === res.faixa.max ? reais(res.faixa.max) : reais(res.faixa.min) + ' a ' + reais(res.faixa.max)));
    linhas.push('Código: ' + res.codigo);
    linhas.push('');
    linhas.push('Quero falar com um advogado sobre o meu caso.');
    var num = String(C.whatsapp || '').replace(/\D/g, '');
    return 'https://wa.me/' + num + '?text=' + encodeURIComponent(linhas.join('\n'));
  }

  function telaResultado() {
    var r = estado.r;
    var res = estado.resultado;
    var t = textosResultado(r, res);
    res._rotulo = t.rotulo;
    var nome = primeiroNome(r.nome);
    var chip = { quente: 'Caso com bom potencial', morno: 'Vale analisar o contrato', frio: 'Distrato pouco vantajoso' }[res.temperatura];
    var titulo = (nome ? esc(nome) + ', ' : '') + esc(t.titulo) + '.';
    var mostrarZap = res.temperatura !== 'frio' || C.contatoParaFrios;

    var html = '<section class="tela">' +
      '<span class="chip chip-' + res.temperatura + '">' + chip + '</span>' +
      '<h2 tabindex="-1">' + titulo.charAt(0).toUpperCase() + titulo.slice(1) + '</h2>' +
      htmlValor(res, r) + htmlComparacao(res, r);

    if (t.fundamentos.length) html += '<h3>Por que esse resultado</h3><ul class="lista">' + t.fundamentos.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>';
    var tituloExtras = (res.cenario === 'CULPA' || res.cenario === 'INDENIZACAO') ? 'Pode somar ainda' : 'Vale saber';
    if (t.extras.length) html += '<h3>' + tituloExtras + '</h3><ul class="lista lista-mais">' + t.extras.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>';
    if (t.atencao.length) html += '<h3>Fique atento</h3><ul class="lista lista-atencao">' + t.atencao.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>';
    if (t.frio.length) html += '<div class="frio-box">' + t.frio.map(function (x) { return '<p>' + esc(x) + '</p>'; }).join('') + '</div>';

    if (mostrarZap) {
      var docs = ['Contrato de compra e venda e aditivos', 'Comprovantes de pagamento ou extrato'];
      if (r.motivo === 'acordo' || r.motivo === 'assinado') docs.push('A proposta ou o termo de distrato');
      docs.push('Mensagens e notificações da ' + (r.tipo === 'lote' ? 'loteadora' : 'construtora'));
      html += '<div class="proximo"><h3>Próximo passo</h3>' +
        '<p>Um advogado da Imóvel Regular confere o seu contrato e mostra os caminhos possíveis. Tenha em mãos:</p>' +
        '<ul class="docs">' + docs.map(function (d) { return '<li>' + esc(d) + '</li>'; }).join('') + '</ul>' +
        '<a class="btn btn-zap" id="btn-zap" href="' + esc(linkWhats(r, res)) + '" target="_blank" rel="noopener">' + ICONE_ZAP + 'Falar com um advogado</a>' +
        '<p class="zap-nota">A mensagem já vai pronta com o resumo da sua simulação.</p></div>';
    } else {
      html += '<div class="frio-box"><p>Quer acompanhar conteúdos sobre contratos de imóveis? Siga <a class="link-insta" href="' + esc(C.instagram) + '" target="_blank" rel="noopener">' + esc(C.instagramUsuario) + '</a>.</p></div>';
    }

    html += '<button type="button" class="btn-texto" data-acao="recomecar">Fazer uma nova simulação</button>' +
      '<p class="nota-legal">Estimativa informativa, feita com base nas suas respostas, na Lei do Distrato (Lei 13.786/2018) e em entendimentos do STJ. Não é promessa de resultado: o valor real depende do contrato, dos documentos e da análise de um advogado.</p>' +
      '</section>';
    return adaptar(html);
  }

  // ---------- Render e eventos ----------
  function render() {
    var id = estado.atual;
    var html;
    if (id === 'inicio') html = telaInicio();
    else if (id === 'carregando') html = telaCarregando();
    else if (id === 'resultado') html = telaResultado();
    else {
      var p = passoPorId(id);
      if (!p) { estado.atual = 'inicio'; return render(); }
      if (p.tipo === 'opcoes') html = telaOpcoes(p);
      else if (p.tipo === 'duplo') html = telaDuplo(p);
      else if (p.tipo === 'valores') html = telaValores();
      else if (p.tipo === 'oferta') html = telaOferta();
      else if (p.tipo === 'form') html = telaForm();
    }
    app.innerHTML = html;
    var foco = app.querySelector('h1, h2');
    if (foco && estado.hist.length) foco.focus({ preventScroll: true });
    if (window.scrollY > 80) window.scrollTo({ top: 0, behavior: 'smooth' });
    ligar(id);
  }

  function mostrarErro(msg, campo) {
    var e = document.getElementById('erro');
    if (e) e.textContent = msg;
    app.querySelectorAll('.entrada').forEach(function (i) { i.removeAttribute('aria-invalid'); });
    if (campo) { campo.setAttribute('aria-invalid', 'true'); campo.focus(); }
  }

  function ligar(id) {
    app.querySelectorAll('[data-acao="voltar"]').forEach(function (b) { b.addEventListener('click', voltar); });
    app.querySelectorAll('[data-acao="recomecar"]').forEach(function (b) { b.addEventListener('click', recomecar); });

    if (id === 'inicio') {
      app.querySelector('[data-acao="comecar"]').addEventListener('click', function () {
        pixel('track', 'ViewContent', { content_name: 'calculadora_distrato' });
        evento('inicio');
        avancar();
      });
      return;
    }

    var p = passoPorId(id);

    if (p && p.tipo === 'opcoes') {
      app.querySelectorAll('.opcao').forEach(function (b) {
        b.addEventListener('click', function () {
          estado.r[p.campo] = b.getAttribute('data-valor');
          if (p.campo === 'motivo' && estado.r.motivo !== 'acordo' && estado.r.motivo !== 'assinado') delete estado.r.oferta;
          app.querySelectorAll('.opcao').forEach(function (o) { o.setAttribute('aria-pressed', String(o === b)); });
          salvar();
          setTimeout(avancar, 180);
        });
      });
    }

    if (p && p.tipo === 'duplo') {
      var d = gruposDuplo(p.id, estado.r);
      var btn = app.querySelector('[data-acao="avancar-duplo"]');
      app.querySelectorAll('.opcao').forEach(function (b) {
        b.addEventListener('click', function () {
          var campo = b.getAttribute('data-campo');
          estado.r[campo] = b.getAttribute('data-valor');
          app.querySelectorAll('.opcao[data-campo="' + campo + '"]').forEach(function (o) { o.setAttribute('aria-pressed', String(o === b)); });
          if (campo === 'atraso' && estado.r.atraso !== 'mais6') delete estado.r.mesesAtraso;
          salvar();
          btn.disabled = !d.grupos.every(function (g) { return !!estado.r[g.campo]; });
        });
      });
      btn.addEventListener('click', function () {
        if (estado.r.tipo === 'pronto') { estado.r.atraso = 'nao'; delete estado.r.mesesAtraso; }
        avancar();
      });
    }

    if (p && p.tipo === 'valores') {
      var vc = document.getElementById('valor-contrato');
      var vp = document.getElementById('valor-pago');
      [vc, vp].forEach(function (el) { el.addEventListener('input', function () { mascaraReais(el); }); });
      if (!estado.r.valorContrato) vc.focus({ preventScroll: true });
      var enviar = function () {
        var c = lerReais(vc.value), pg = lerReais(vp.value);
        if (c < 1000) return mostrarErro('Informe o valor total do contrato.', vc);
        if (pg < 100) return mostrarErro('Informe quanto você já pagou.', vp);
        if (pg > c * 1.5) return mostrarErro('O valor pago está bem maior que o valor do contrato. Confira os números.', vp);
        estado.r.valorContrato = c;
        estado.r.valorPago = pg;
        salvar();
        avancar();
      };
      app.querySelector('[data-acao="salvar-valores"]').addEventListener('click', enviar);
      [vc, vp].forEach(function (el) { el.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); el === vc ? vp.focus() : enviar(); } }); });
    }

    if (p && p.tipo === 'oferta') {
      var vo = document.getElementById('valor-oferta');
      vo.addEventListener('input', function () { mascaraReais(vo); });
      var enviarOferta = function () {
        var o = lerReais(vo.value);
        if (o < 100) return mostrarErro('Informe o valor ou toque em “Ainda não sei o valor”.', vo);
        estado.r.oferta = o;
        salvar();
        avancar();
      };
      app.querySelector('[data-acao="salvar-oferta"]').addEventListener('click', enviarOferta);
      vo.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); enviarOferta(); } });
      app.querySelector('[data-acao="sem-oferta"]').addEventListener('click', function () {
        delete estado.r.oferta;
        salvar();
        avancar();
      });
    }

    if (p && p.tipo === 'form') {
      pixel('track', 'InitiateCheckout', { content_name: 'calculadora_distrato' });
      var zap = document.getElementById('lead-zap');
      zap.addEventListener('input', function () { mascaraFone(zap); });
      document.getElementById('form-lead').addEventListener('submit', function (e) {
        e.preventDefault();
        var nome = document.getElementById('lead-nome');
        var email = document.getElementById('lead-email');
        var fone = zap.value.replace(/\D/g, '');
        if (nome.value.trim().length < 3) return mostrarErro('Digite o seu nome.', nome);
        if (fone.length < 10 || /^(\d)\1+$/.test(fone)) return mostrarErro('Digite um WhatsApp válido com DDD.', zap);
        if (email.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) return mostrarErro('Confira o e-mail ou deixe em branco.', email);
        estado.r.nome = nome.value.trim();
        estado.r.whatsapp = zap.value;
        estado.r.email = email.value.trim();
        concluir();
      });
    }

    if (id === 'resultado') {
      contarNumeros();
      var bz = document.getElementById('btn-zap');
      if (bz) bz.addEventListener('click', function () {
        pixel('track', 'Contact', { content_name: 'calculadora_distrato' });
        evento('whatsapp', { temperatura: estado.resultado.temperatura });
      });
    }
  }

  function concluir() {
    var res = Calc.analisar(estado.r, { valorMinimo: C.valorMinimo, valorQuente: C.valorQuente });
    estado.resultado = res;
    irPara('carregando');

    if (!estado.enviado) {
      estado.enviado = true;
      enviarLead(res);
      if (res.temperatura === 'frio') pixel('trackCustom', 'LeadFrio', { cenario: res.cenario });
      else pixel('track', 'Lead', { content_name: 'calculadora_distrato', content_category: res.temperatura, status: res.cenario });
      evento('lead', { temperatura: res.temperatura, cenario: res.cenario });
      salvar();
    }

    var itens = app.querySelectorAll('.passos-analise li');
    var reduz = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var passo = reduz ? 250 : 750;
    itens.forEach(function (li, i) {
      setTimeout(function () { li.classList.add('ativo'); }, i * passo);
      setTimeout(function () { li.classList.add('feito'); }, (i + 1) * passo);
    });
    setTimeout(function () {
      estado.hist = estado.hist.filter(function (h) { return h !== 'carregando'; });
      estado.atual = 'resultado';
      salvar();
      render();
    }, itens.length * passo + 300);
  }

  function enviarLead(res) {
    if (!C.webhookUrl) return;
    var r = estado.r;
    var dados = {
      data: new Date().toISOString(),
      nome: r.nome, whatsapp: r.whatsapp, email: r.email || '',
      temperatura: res.temperatura, cenario: res.cenario, codigo: res.codigo,
      estimativa_min: res.faixa ? res.faixa.min : null,
      estimativa_max: res.faixa ? res.faixa.max : null,
      indenizacao_min: res.adicional ? res.adicional.min : null,
      indenizacao_max: res.adicional ? res.adicional.max : null,
      diferenca_proposta: res.comparacao ? res.comparacao.diferencaMax : null,
      tipo: ROTULOS.tipo[r.tipo], motivo: ROTULOS.motivo[r.motivo],
      valor_contrato: r.valorContrato, valor_pago: r.valorPago, oferta: r.oferta || null,
      chaves: ROTULOS.chaves[r.chaves] || '', atraso: ROTULOS.atraso[r.atraso || 'nao'],
      meses_atraso: ROTULOS.mesesAtraso[r.mesesAtraso] || '',
      assinatura: ROTULOS.assinatura[r.assinatura] || '', pagamento: ROTULOS.pagamento[r.pagamento] || '',
      corretagem: ROTULOS.corretagem[r.corretagem] || '',
      origem: ROTULOS.origem[r.origem] || '',
      parcelas: ROTULOS.parcelas[r.parcelas] || '',
      utm: UTM, pagina: location.href.split('#')[0]
    };
    var corpo = JSON.stringify(dados);
    try {
      if (navigator.sendBeacon && navigator.sendBeacon(C.webhookUrl, new Blob([corpo], { type: 'text/plain;charset=UTF-8' }))) return;
    } catch (e) { /* tenta fetch */ }
    try {
      fetch(C.webhookUrl, { method: 'POST', mode: 'no-cors', keepalive: true, headers: { 'Content-Type': 'text/plain;charset=UTF-8' }, body: corpo }).catch(function () {});
    } catch (e) { /* sem rede */ }
  }

  function contarNumeros() {
    var els = app.querySelectorAll('[data-contar]');
    if (!els.length || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) return;
    var dur = 900, t0 = null;
    function quadro(ts) {
      if (!t0) t0 = ts;
      var k = Math.min((ts - t0) / dur, 1);
      var e = 1 - Math.pow(1 - k, 3);
      els.forEach(function (el) { el.textContent = reais(Number(el.getAttribute('data-contar')) * e); });
      if (k < 1) requestAnimationFrame(quadro);
    }
    requestAnimationFrame(quadro);
  }

  // ---------- Início ----------
  if (C.oab) document.getElementById('rodape-oab').textContent = ' · ' + C.oab;
  carregar();
  render();
})();
