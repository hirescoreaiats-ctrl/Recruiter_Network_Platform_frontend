const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'assets', 'app.js'), 'utf8');
const vendor = fs.readFileSync(path.join(root, 'assets', 'vendor-workspace.js'), 'utf8');

assert.match(index, /vendor-workspace\.css/);
assert.match(index, /vendor-workspace\.js/);
assert.match(app, /requirement_vendor:\[\['Jobs','\/vendor\/dashboard'\]/);
assert.match(vendor, /session\?\.user\?\.role==='requirement_vendor'/);
assert.match(vendor, /if\(path==='\/vendor\/jobs\/new'/);
assert.match(vendor, /if\(path==='\/vendor\/pipeline'\)return hsInterviewPage\(\)/);
assert.doesNotMatch(vendor, /login\.html|Signup\.html|loginUser\(|signupUser\(/);

console.log('vendor ATS dashboard is mounted behind the existing vendor session without a second login');
