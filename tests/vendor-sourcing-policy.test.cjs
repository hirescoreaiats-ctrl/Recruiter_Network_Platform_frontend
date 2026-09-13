const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('vendor requirement form keeps third-party sourcing opt-in', () => {
  const source = fs.readFileSync('assets/app.js', 'utf8');
  assert.match(source, /name="external_sourcing_approved"/);
  assert.match(source, /candidate portal, internal database and resume object storage first/i);
  assert.match(source, /payload\.external_sourcing_approved=form\.get/);
});

test('vendor requirement detail exposes the staged sourcing controls', () => {
  const source = fs.readFileSync('assets/app.js', 'utf8');
  assert.match(source, /Candidate job portal/);
  assert.match(source, /Internal candidate database/);
  assert.match(source, /Resume object storage/);
  assert.match(source, /sourcing-plan\/external/);
  assert.match(source, /Approve external sourcing/);
});

test('registration onboarding does not render the login marketing panel', () => {
  const source = fs.readFileSync('assets/account-onboarding.js', 'utf8');
  assert.match(source, /kind === 'register' \? accountOnboardingShell : authShell/);
  assert.match(source, /accountOnboardingShell\('<button type="button" id="account-back" class="text-link">← Account type/);
  assert.match(source, /account-onboarding-shell/);
});
