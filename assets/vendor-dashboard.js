/* HireScore AI vendor jobs command center. Loaded after app.js to replace the legacy vendor dashboard. */
vendorDashboard=async function(){
  try{
    const [summary,requirements,submissions]=await Promise.all([api('/dashboard'),api('/requirements/mine'),api('/vendor/submissions')]);
    const active=requirements.filter(r=>r.status==='active');
    const scores=submissions.map(a=>Number(a.evaluation?.final_score)).filter(Number.isFinite);
    const topScore=scores.length?Math.max(...scores):0;
    const averageScore=scores.length?scores.reduce((total,score)=>total+score,0)/scores.length:0;
    const perJob=requirements.map(requirement=>{
      const applicants=submissions.filter(a=>a.requirement.id===requirement.id);
      const jobScores=applicants.map(a=>Number(a.evaluation?.final_score)).filter(Number.isFinite);
      return {requirement,applicants,top:jobScores.length?Math.max(...jobScores):0};
    }).sort((a,b)=>b.applicants.length-a.applicants.length);
    const sourceLabels={linkedin:'LinkedIn',whatsapp:'WhatsApp',naukri:'Naukri',sourcing_partner:'Recruiter Network',direct:'Direct',candidate:'Career Page',candidate_self:'Career Page',resume_folder:'Resume Folder',referral:'Referral',website:'Website',unknown:'Unknown'};
    const sourceCodes={linkedin:'IN',whatsapp:'WA',naukri:'NK',referral:'RF',website:'WB',direct:'DR',resume_folder:'FL',candidate_self:'CP',sourcing_partner:'RN',unknown:'UN'};
    const sourceCounts=submissions.reduce((all,item)=>{const key=item.submission_source||'direct';all[key]=(all[key]||0)+1;return all},{});
    const trackedSources=['linkedin','whatsapp','naukri','referral','website','direct','resume_folder','candidate_self'];
    const sourceRows=[...trackedSources.map(source=>[source,sourceCounts[source]||0]),...Object.entries(sourceCounts).filter(([source])=>!trackedSources.includes(source))];
    const rankedSources=sourceRows.slice().sort((a,b)=>b[1]-a[1]);
    const leading=perJob[0];
    const companies=[...new Set(requirements.map(r=>r.company).filter(Boolean))];
    const userInitials=session.user.name.split(' ').map(part=>part[0]).slice(0,2).join('').toUpperCase();
    const jobRows=perJob.map(({requirement,applicants,top})=>`<article class="vendor-job-row" data-company="${requirement.company||''}"><div class="vendor-job-name"><input type="checkbox" aria-label="Select ${requirement.title}"><span>JD</span><div><b>${requirement.title}</b><small>${requirement.company||'Your company'}</small></div></div><strong class="vendor-count-pill">${applicants.length}</strong><strong class="vendor-score-pill">${top?top.toFixed(2).replace(/0+$/,'').replace(/\.$/,''):'—'}</strong><i class="vendor-status ${requirement.status}">${requirement.status}</i><div class="vendor-row-actions"><button data-vendor-route="/vendor/jobs/${requirement.id}/candidates">View</button><button data-vendor-route="/vendor/jobs/${requirement.id}/candidates?top=1">Top Candidate</button><button data-vendor-route="/vendor/jobs/${requirement.id}/posts">Posts</button><button data-vendor-route="/vendor/jobs/${requirement.id}/candidates">Folder</button><button class="danger" data-job-status="${requirement.id}" data-next-status="${requirement.status==='active'?'paused':'active'}">${requirement.status==='active'?'Deactivate':'Activate'}</button></div></article>`).join('');
    const content=`<div class="vendor-command-center">
      <section class="vendor-hero"><div><span>ENTERPRISE AI RECRUITING WORKSPACE</span><h1>HireScore AI</h1><p>Review jobs, rank candidates, shortlist profiles, and manage communication from one recruiter dashboard.</p></div><div class="vendor-user-card"><i>${userInitials}</i><span><small>Recruiter</small><b>${session.user.name}</b></span></div></section>
      <section class="vendor-title-card"><div><span>JOBS DASHBOARD</span><h2>Hiring Command Center</h2><p>Track active roles, candidate volume, AI scores, and recruiter actions from one focused workspace.</p></div><div><button class="vendor-primary-action" data-vendor-route="/vendor/jobs/new">Create Job</button><button data-vendor-route="/vendor/jobs/apply-pages">Apply Pages</button></div></section>
      <section class="vendor-stat-grid">
        <article><span>JB</span><small>ACTIVE JOBS</small><b>${active.length}</b><em>Open roles</em></article>
        <article><span>AP</span><small>TOTAL APPLICANTS</small><b>${submissions.length}</b><em>Across all jobs</em></article>
        <article><span>TS</span><small>TOP SCORE</small><b>${topScore?topScore.toFixed(1):'—'}</b><em>Best AI fit</em></article>
        <article><span>AV</span><small>AVG SCORE</small><b>${averageScore?averageScore.toFixed(1):'—'}</b><em>Pipeline quality</em></article>
      </section>
      <section class="vendor-analytics-grid">
        <article class="vendor-dashboard-card vendor-applications"><header><div><h3>Applications per Job</h3><p>Candidate volume across active roles.</p></div><span>Live</span></header>${leading?`<div class="vendor-leading"><div><small>TOTAL APPLICANTS</small><b>${submissions.length}</b></div><span><small>LEADING ROLE</small><b>${leading.requirement.title}</b><em>${leading.requirement.company||'Your company'} · ${leading.applicants.length} applicant${leading.applicants.length===1?'':'s'} · top score ${leading.top?leading.top.toFixed(1):'—'}</em></span></div><div class="vendor-role-bars">${perJob.slice(0,6).map(({requirement,applicants,top})=>`<button data-vendor-route="/vendor/requirements/${requirement.id}/submissions"><span><b>${requirement.title}</b><small>${requirement.company||'Your company'} · Top score ${top?top.toFixed(1):'—'}</small></span><i style="--bar:${submissions.length?Math.max(3,applicants.length/Math.max(...perJob.map(x=>x.applicants.length),1)*100):3}%"></i><strong>${applicants.length}</strong></button>`).join('')}</div>`:`<div class="vendor-empty"><b>No jobs yet</b><p>Create your first job to start the hiring workflow.</p></div>`}</article>
        <article class="vendor-dashboard-card vendor-sources"><header><div><h3>Applications by Source</h3><p>Candidate volume from tracked sourcing links.</p></div><span>Sources</span></header>${submissions.length?`<div class="vendor-source-total"><b>${submissions.length}</b><span><small>TOP SOURCE</small><strong>${sourceLabels[rankedSources[0]?.[0]]||cleanStatus(rankedSources[0]?.[0])}</strong><em>${rankedSources[0]?.[1]} applicant${rankedSources[0]?.[1]===1?'':'s'} · ${Math.round(rankedSources[0]?.[1]/submissions.length*100)}%</em></span></div><div class="vendor-source-list">${sourceRows.map(([source,count])=>`<div><i>${sourceCodes[source]||(sourceLabels[source]||source).slice(0,2).toUpperCase()}</i><span><b>${sourceLabels[source]||cleanStatus(source)}</b><em><u style="width:${count/submissions.length*100}%"></u></em></span><strong>${Math.round(count/submissions.length*100)}% <small>${count}</small></strong></div>`).join('')}</div>`:`<div class="vendor-empty"><b>No source data yet</b><p>Application sources will appear here automatically.</p></div>`}</article>
      </section>
      <section class="vendor-dashboard-card vendor-operations"><header><div><h3>Job Operations</h3><p>Fast access for recruiter workflow.</p></div></header><div class="vendor-operation-grid"><button data-vendor-route="/vendor/jobs/new"><span>CJ</span><div><b>Create Job</b><small>Publish a new JD and start screening.</small></div><i>Go</i></button><button data-vendor-route="/vendor/jobs/manage"><span>EJ</span><div><b>Edit Job</b><small>Update role details, status, or JD.</small></div><i>Go</i></button><button data-vendor-route="/vendor/jobs/apply-pages"><span>AP</span><div><b>Apply Pages</b><small>Open candidate application links.</small></div><i>Go</i></button><button class="danger" data-vendor-route="/vendor/jobs/manage?mode=archive"><span>DJ</span><div><b>Delete Job</b><small>Close inactive or duplicate roles.</small></div><i>Go</i></button></div><div class="vendor-workflow"><span><b>WORKFLOW</b><small>Create JD → share apply link → review candidates</small></span><i>Ready</i></div></section>
      <section class="vendor-dashboard-card vendor-management"><header><div><h3>Job Management</h3><p>Open candidate results, review top matches, and manage active job status.</p></div>${companies.length>1?`<label><small>COMPANY</small><select id="vendor-company-filter"><option value="">All companies</option>${companies.map(company=>`<option value="${company}">${company}</option>`).join('')}</select></label>`:''}</header><div class="vendor-job-head"><span>JOB</span><span>APPLICANTS</span><span>TOP SCORE</span><span>STATUS</span><span>ACTION</span></div><div id="vendor-job-list">${jobRows||`<div class="vendor-empty"><b>No jobs to manage</b><p>Create a job and it will appear in this table.</p></div>`}</div></section>
    </div>`;
    layout(content,'Jobs Dashboard');
    const sidebar=$('.sidebar'),sideNav=sidebar?.querySelector('.nav'),verification=sidebar?.querySelector('.partner-verification'),footer=sidebar?.querySelector('.sidebar-footer');
    if(sideNav){sideNav.insertAdjacentHTML('beforebegin','<span class="vendor-nav-label">WORKSPACE</span>');}
    sidebar?.querySelector('a[href="/vendor/profile"]')?.remove();
    if(verification)verification.remove();
    if(sidebar&&footer)footer.insertAdjacentHTML('beforebegin',`<section class="vendor-side-agent"><header><span>AI</span><b>HireScore AI Agent</b></header><p>Need help with your jobs? I can review attention, applicants, active roles, or create a new job.</p><button id="vendor-open-agent">Open AI Agent <i>→</i></button></section>`);
    const logout=$('#logout');if(logout){logout.textContent='Logout';logout.title='Logout'}
    document.querySelectorAll('[data-vendor-route]').forEach(button=>button.onclick=()=>route(button.dataset.vendorRoute));
    document.querySelectorAll('[data-job-status]').forEach(button=>button.onclick=async()=>{try{await api(`/requirements/${button.dataset.jobStatus}/status`,{method:'PATCH',body:JSON.stringify({status:button.dataset.nextStatus})});toast(`Job ${button.dataset.nextStatus==='active'?'activated':'deactivated'}`);vendorDashboard()}catch(error){toast(error.message,true)}});
    const openAgent=$('#vendor-open-agent');if(openAgent)openAgent.onclick=()=>route('/vendor/ask');
    const companyFilter=$('#vendor-company-filter');if(companyFilter)companyFilter.onchange=()=>document.querySelectorAll('.vendor-job-row').forEach(row=>row.hidden=Boolean(companyFilter.value&&row.dataset.company!==companyFilter.value));
    return summary;
  }catch(error){toast(error.message,true)}
};
