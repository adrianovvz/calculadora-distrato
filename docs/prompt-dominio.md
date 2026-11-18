# Prompt: ligar calculadora.imovelregular.online (agente do Chrome)

Decisão de 18/11/2026: a calculadora fica em **calculadora.imovelregular.online**. O domínio principal (imovelregular.online) já tem o site do escritório e não pode ser mexido.

Ordem importa: primeiro o DNS na Hostinger, depois o GitHub. Se o GitHub for configurado antes, o link atual redireciona para um endereço que ainda não existe e a página fica fora do ar.

```text
Objetivo: fazer a calculadora da Imóvel Regular abrir em https://calculadora.imovelregular.online sem mexer no site principal imovelregular.online.

REGRAS
- Nunca digite senha nem código. Se pedir login, pare e me chame para eu entrar.
- NÃO apague nem altere nenhum registro DNS que já existe (o site principal depende deles). Só ADICIONE o registro pedido.
- Não mexa em nada além do que está aqui.

PASSO 1 — DNS na Hostinger
1. Abra https://hpanel.hostinger.com/domain/imovelregular.online/dns (se pedir login, me chame).
2. Em "Gerenciar registros DNS", adicione um registro novo:
   Tipo: CNAME
   Nome: calculadora
   Aponta para / Destino: adrianovvz.github.io
   TTL: deixe o padrão
   Clique em Adicionar registro.
3. Se já existir um registro com o nome "calculadora", não crie outro: me mostre o que existe e espere.
4. Espere 5 minutos e abra https://dnschecker.org/#CNAME/calculadora.imovelregular.online — confira que aparece adrianovvz.github.io na maioria dos locais. Se ainda não aparecer, espere mais 10 minutos e confira de novo.

PASSO 2 — Domínio no GitHub (só depois do passo 1 ok)
1. Abra https://github.com/adrianovvz/calculadora-distrato/settings/pages
2. Em "Custom domain", escreva calculadora.imovelregular.online e clique em Save.
3. Espere aparecer "DNS check successful".
4. Marque "Enforce HTTPS". Se a caixa estiver cinza, o certificado ainda está sendo gerado: espere 15 minutos, recarregue a página e tente de novo (pode levar até algumas horas).

PASSO 3 — Teste
1. Abra https://calculadora.imovelregular.online em uma janela anônima: tem que abrir a calculadora com cadeado de site seguro.
2. Abra https://adrianovvz.github.io/calculadora-distrato/ e confira que ele leva para o endereço novo.
3. Abra https://imovelregular.online e confira que o site principal continua igual.

RESUMO FINAL
Me diga o resultado de cada passo (ok ou o erro, com print).
```

Depois de pronto: usar `https://calculadora.imovelregular.online` nos anúncios do Meta (com os mesmos parâmetros de URL).
