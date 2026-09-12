const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('candidate matches renders a profile-ranked vendor job feed and detail route', () => {
  const source = fs.readFileSync('assets/candidate-matches-saas.js', 'utf8');
  assert.match(source, /api\('\/candidate\/matching-status'\)/);
  assert.match(source, /data-job-id=/);
  assert.match(source, /candidateJobDetailPage/);
  assert.match(source, /api\(`\/requirements\/\$\{requirementId\}`\)/);
  assert.match(source, /location\.pathname\.match/);
});

test('candidate detail supports explicit interest signals', () => {
  const source = fs.readFileSync('assets/candidate-matches-saas.js', 'utf8');
  assert.match(source, /data-interest="interested"/);
  assert.match(source, /data-interest="need_more_details"/);
  assert.match(source, /method: 'PUT'/);
});
