# Integração da Calculadora de Distrato com o CRM

**Para:** programador responsável pelo CRM
**De:** Grupo VVZ (calculadora da Imóvel Regular Advocacia)
**Página:** https://calculadora.imovelregular.online

## Como a página envia o lead

A calculadora é um site estático. No fim da simulação, **o navegador do visitante** envia o lead direto para o endereço que vocês passarem:

- Método: `POST`
- Corpo: JSON (exemplo abaixo)
- Cabeçalho: `Content-Type: text/plain;charset=UTF-8`. O corpo é JSON, mas vai como texto para o navegador não fazer a checagem CORS (preflight).
- Envio por `navigator.sendBeacon`, ou `fetch` com `mode: 'no-cors'` se o primeiro falhar. **A página não lê a resposta**: basta devolver qualquer 2xx.
- Um envio por lead, quando o visitante toca em "Ver meu resultado". Todos os leads vão, inclusive os frios (o campo `temperatura` diz qual é qual).

## O que precisamos de vocês

1. **Uma URL HTTPS que receba esse POST** (webhook de entrada de leads).
2. **Sem chave secreta na requisição.** A URL fica visível no código da página, então não pode depender de token secreto. Se puder, protejam com validação de campos e limite de requisições.
   - Se a API de vocês **exige token secreto**, tudo bem: colocamos um intermediário no servidor (Google Apps Script) que guarda o token e repassa para vocês com `Content-Type: application/json`. Nesse caso, mandem o token para o Adriano cadastrar no lugar certo. **Nunca por chat ou e-mail.**
3. **O mapeamento de campos**, se o CRM exigir nomes próprios (ex.: `name` em vez de `nome`). Dá para adaptar o envio.
4. Se houver, um **ambiente de teste** para validarmos antes de rodar a campanha.

## Exemplo do JSON enviado

```json
{
  "data": "2026-11-18T15:30:00.000Z",
  "nome": "Maria Silva",
  "whatsapp": "(11) 99999-0000",
  "email": "",
  "temperatura": "quente",
  "cenario": "DESISTENCIA",
  "codigo": "Q-DESISTENCIA",
  "estimativa_min": 37500,
  "estimativa_max": 45000,
  "indenizacao_min": null,
  "indenizacao_max": null,
  "diferenca_proposta": null,
  "tipo": "Lote ou terreno em loteamento",
  "motivo": "As parcelas pesaram",
  "parcelas": "Tenho parcelas atrasadas",
  "valor_contrato": 120000,
  "valor_pago": 50000,
  "oferta": null,
  "chaves": "Não",
  "atraso": "Não atrasou",
  "meses_atraso": "",
  "assinatura": "De 2019 em diante",
  "pagamento": "Parcelas direto com a construtora ou loteadora",
  "corretagem": "",
  "origem": "Instagram",
  "utm": {
    "utm_source": "meta",
    "utm_medium": "pago",
    "utm_campaign": "distrato-lote",
    "utm_content": "video-01",
    "fbclid": "IwAR..."
  },
  "pagina": "https://calculadora.imovelregular.online/"
}
```

## Dicionário dos campos

| Campo | Tipo | O que é |
|---|---|---|
| `data` | texto ISO 8601 (UTC) | Momento do envio |
| `nome`, `whatsapp`, `email` | texto | Dados do lead. WhatsApp no formato `(DD) 9XXXX-XXXX`; e-mail é opcional (pode vir vazio) |
| `temperatura` | `quente` \| `morno` \| `frio` | Qualificação automática. Sugestão: distribuir só quente e morno para o atendimento |
| `cenario` | `CULPA` \| `INDENIZACAO` \| `DESISTENCIA` \| `DESISTENCIA_POSSE` \| `BANCO` \| `SEM_BASE` | Situação jurídica estimada |
| `codigo` | texto | Temperatura + cenário (ex.: `Q-CULPA`). Vai também na mensagem de WhatsApp |
| `estimativa_min` / `estimativa_max` | número (R$) ou `null` | Faixa estimada de devolução ou de indenização |
| `indenizacao_min` / `indenizacao_max` | número ou `null` | Indenização extra por atraso (só no cenário `CULPA`) |
| `diferenca_proposta` | número ou `null` | Quanto a proposta da construtora/loteadora está abaixo da estimativa |
| `tipo`, `motivo`, `parcelas`, `chaves`, `atraso`, `meses_atraso`, `assinatura`, `pagamento`, `corretagem`, `origem` | texto | Respostas do visitante, já escritas por extenso |
| `valor_contrato`, `valor_pago`, `oferta` | número (R$) ou `null` | Valores informados |
| `utm` | objeto | `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `fbclid`, `gclid` (só os que vieram no link) |
| `pagina` | texto | Endereço da página que gerou o lead |

Sugestão para evitar duplicados: usar o `whatsapp` (só dígitos) como chave do contato.

## Teste

Assim que tivermos a URL, enviamos um lead com nome **"TESTE IMOVEL REGULAR"** e confirmamos com vocês que ele chegou.
