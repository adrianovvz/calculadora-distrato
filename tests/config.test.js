// Garante que o Pixel da Meta da Imóvel Regular continua ligado.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

test('config.js tem o ID do Pixel da Meta (AdvocaciaIMOB)', () => {
  const ctx = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'config.js'), 'utf8'), ctx);
  assert.equal(ctx.window.IR_CONFIG.metaPixelId, '2946037295795542');
});
