const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('candidate avatar menu owns job-search status controls', () => {
  const source = fs.readFileSync('assets/candidate-workspace.js', 'utf8');
  assert.doesNotMatch(source, /\['Availability', '\/candidate\/availability'/);
  assert.match(source, /class="cw-profile-menu"/);
  assert.match(source, /data-quick-status=/);
  assert.match(source, /\/candidates\/\$\{profile\.id\}\/availability/);
  assert.match(source, /window\.candidateOpenProfileMenu = true/);
});
