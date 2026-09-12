const {chromium}=require('playwright');
const fs=require('node:fs');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try {
 const page=await browser.newPage();
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 const profile={id:1,user_id:1,full_name:'Test Candidate',email:'test@example.com',phone:'9999999999',country:'IN',city:'Delhi',current_title:'Developer',total_experience:2,current_employer:'Example',linkedin_url:'',skills:['Python','SQL','Git'],created_at:'2026-09-12',country_specific_data:{onboarding_step:'complete',career_stage:'experienced',highest_qualification:'Graduation',preferred_locations:['Delhi'],projects:[],profile_summary:''}};
 const requests=[];
 await page.addInitScript(()=>localStorage.setItem('tb_session',JSON.stringify({access_token:'test',user:{id:1,role:'candidate',name:'Test Candidate',phone_verified:true}})));
 await page.route('http://profile.test/**',r=>{
   const path=new URL(r.request().url()).pathname;
   if(path.startsWith('/api/')) {
     if(r.request().method()==='PATCH') {
       const patch=r.request().postDataJSON();requests.push(patch);
       profile.country_specific_data={...profile.country_specific_data,...patch.country_specific_data};
     }
     return r.fulfill({json:path==='/api/auth/me'?{id:1,role:'candidate',name:'Test Candidate',phone_verified:true}:path==='/api/candidate/profile'?profile:path.includes('matching-status')?{availability:{status:'open_to_right_opportunity'},profile_checks:{},matches:[]}:[]});
   }
   const file=path.startsWith('/assets/')?path.slice(1):'index.html';
   return r.fulfill({contentType:file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':'text/html',body:fs.readFileSync(file)});
 });
 await page.goto('http://profile.test/candidate/profile');
 await page.locator('#profile-projects .candidate-profile-add').click();
 await page.locator('#career-section-projects input[name$="_title"]').fill('New portfolio');
 assert.equal(await page.locator('[data-career-next]').isVisible(),false);
 assert.equal(await page.locator('[name=full_name]').isVisible(),false);
 await page.locator('[data-career-save]').click();
 await page.waitForURL('**/candidate/profile');
 await page.locator('#profile-projects').getByText('New portfolio').waitFor();
 assert.deepEqual(Object.keys(requests[0]),['country_specific_data']);
 assert.deepEqual(Object.keys(requests[0].country_specific_data),['projects']);
 await page.locator('#profile-summary .candidate-profile-add').click();
 await page.locator('[name=extra_profile_summary]').fill('Saved summary');
 await page.locator('[data-career-save]').click();
 await page.waitForURL('**/candidate/profile');
 await page.locator('#profile-summary').getByText('Saved summary').waitFor();
 assert.equal(await page.locator('.candidate-profile-promo').count(),0);
 assert.deepEqual(errors,[]);
 console.log('Full app scripts and CSS: add project, summary edit, PATCH, saved overview and promo removal passed.');
 } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exit(1)});
