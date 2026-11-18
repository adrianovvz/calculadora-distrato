/*
 * Configuração da calculadora — único arquivo que precisa mudar no dia a dia.
 */
window.IR_CONFIG = {
  // WhatsApp do escritório, só números, com 55 + DDD. Ex.: '5511999999999'
  whatsapp: '5531953498526',

  // ID do Pixel do Meta (Facebook/Instagram). Vazio = pixel desligado.
  metaPixelId: '2946037295795542',

  // Endereço que recebe cada lead (planilha Google, CRM etc.). Vazio = só WhatsApp.
  webhookUrl: 'https://script.google.com/macros/s/AKfycbyOuAxJwVSTfvjl6FcbINEIPLBK8eyujtuSiYskr1_rD_TZRNtzQ0iwd7iDwy6R5Tfbrw/exec',
  // Destinos extras, se precisar mandar para mais de um (ex.: CRM e planilha)
  webhookUrls: [],

  instagram: 'https://www.instagram.com/imovelregular.advocacia/',
  instagramUsuario: '@imovelregular.advocacia',

  // Registro na OAB que aparece no rodapé. Ex.: 'OAB/SP 123.456'
  oab: '',

  // false = lead frio não vê botão de WhatsApp (filtro). true = todos veem.
  contatoParaFrios: false,

  // Corte do filtro (em reais)
  valorMinimo: 5000,
  valorQuente: 15000
};
