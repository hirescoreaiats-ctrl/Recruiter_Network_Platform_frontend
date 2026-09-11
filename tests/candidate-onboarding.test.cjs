const assert = require('node:assert/strict');
const {test} = require('node:test');
const {readFileSync} = require('node:fs');
const vm = require('node:vm');
function setup(details = {}) {
  const profile = {full_name:'Test Candidate',email:'test@example.com',phone:'9999999999',country:'IN',city:'Delhi',skills:['Python','SQL','Git'],created_at:'2026-09-11',country_specific_data:details};
  const state = {html:'',routes:[],baseCalls:0};
  const context = vm.createContext({
    session:{user:{role:'candidate',phone_verified:true}}, location:{pathname:'/candidate/profile'},
    candidatePortalBaseProfile:async()=>{state.baseCalls++;}, profilePage:async()=>{}, render:()=>{state.rendered=true;},
    candidateEscape:value=>String(value??'').replaceAll('<','&lt;').replaceAll('>','&gt;'),
    countryConfig:{IN:{name:'India'}}, layout:html=>{state.html=html;}, wireDownloads:()=>{},
    document:{querySelectorAll:()=>[]}, window:{}, api:async()=>profile, route:path=>state.routes.push(path),toast:message=>{throw Error(message);}
  });
  vm.runInContext(readFileSync('assets/career-profile.js','utf8'),context);
  return {context,state,profile};
}
test('profile renders saved onboarding details instead of a form',async()=>{
  const {context,state}=setup({onboarding_step:'complete',education_history:[{course:'BTech',institution_name:'Test University'}],projects:[{title:'Portfolio'}],disability:'Prefer not to say'});
  await context.profilePage();
  assert.match(state.html,/Test University/); assert.match(state.html,/Portfolio/);
  assert.match(state.html,/Prefer not to say/); assert.doesNotMatch(state.html,/<form/);
  assert.equal(state.baseCalls,0);
});
test('incomplete candidates are routed into onboarding',async()=>{
  const {context,state}=setup(); context.location.pathname='/candidate/dashboard';
  await context.render(); assert.deepEqual(state.routes,['/candidate/onboarding']);
});
test('completed and legacy saved profiles can reach their dashboard',async()=>{
  for(const details of [{onboarding_step:'complete'},{_profile_completed:true}]) {
    const {context,state}=setup(details); context.location.pathname='/candidate/dashboard';
    await context.render(); assert.deepEqual(state.routes,[]); assert.equal(state.rendered,true);
  }
});
test('profile overview escapes saved text',async()=>{
  const {context,state,profile}=setup(); profile.full_name='<script>alert(1)</script>';
  await context.profilePage(); assert.doesNotMatch(state.html,/<script>/);
});
test('entry page loads the resumable five-step flow after registration overrides',()=>{
  const html=readFileSync('index.html','utf8');
  const onboarding=readFileSync('assets/career-profile.js','utf8');
  const registration=readFileSync('assets/account-onboarding.js','utf8');
  const apiClient=readFileSync('assets/app.js','utf8');
  assert.ok(html.indexOf('/assets/career-profile.js') > html.indexOf('/assets/account-onboarding.js'));
  assert.doesNotMatch(html,/src="\/assets\/candidate-profile-wizard.js/);
  assert.match(onboarding,/Complete these five guided steps/);
  assert.match(onboarding,/\/candidate\/onboarding\/draft/);
  assert.match(onboarding,/resumeStep - 1/);
  assert.match(onboarding,/localStorage\.setItem\(draftKey/);
  assert.match(onboarding,/Progress saved on this device/);
  assert.match(registration,/five guided steps/);
  assert.match(registration,/Profile setup pending/);
  assert.match(registration,/Mobile verification will be available after the server update/);
  assert.match(apiClient,/Request failed \(\$\{r\.status\}\)/);
});
