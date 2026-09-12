/* Candidate job discovery powered by live, profile-ranked vendor requirements. */
const candidateJobList = value => Array.isArray(value) ? value : [];

function candidateJobMoney(job) {
  const minimum = job.compensation_min == null ? NaN : Number(job.compensation_min), maximum = job.compensation_max == null ? NaN : Number(job.compensation_max);
  if (!Number.isFinite(minimum) && !Number.isFinite(maximum)) return 'Salary not disclosed';
  const format = value => Number(value).toLocaleString('en-IN', {maximumFractionDigits: 0});
  const range = Number.isFinite(minimum) && Number.isFinite(maximum) ? `${format(minimum)} – ${format(maximum)}` : format(Number.isFinite(minimum) ? minimum : maximum);
  return `${portalText(job.currency || 'INR')} ${range}${job.compensation_type ? ` / ${portalText(job.compensation_type.replaceAll('_', ' '))}` : ''}`;
}

function candidateJobAge(value) {
  const created = new Date(value);
  if (Number.isNaN(created.getTime())) return 'Recently posted';
  const days = Math.max(0, Math.floor((Date.now() - created.getTime()) / 86400000));
  return days === 0 ? 'Posted today' : days === 1 ? 'Posted yesterday' : `Posted ${days} days ago`;
}

function candidateJobLocation(job) {
  return [job.city, job.state_region, countryConfig[job.country]?.name || job.country].filter(Boolean).map(portalText).join(', ');
}

function candidateFeedCard(job, index) {
  const score = Math.round(Number(job.match_score || 0));
  const skills = candidateJobList(job.required_skills).slice(0, 6);
  const reasons = candidateJobList(job.match_reasons).slice(0, 3);
  return `<article class="cjf-card ${index === 0 ? 'top-match' : ''}" data-job-id="${job.id}" role="link" tabindex="0" aria-label="View ${portalText(job.title)} at ${portalText(job.company || 'verified employer')}">
    <div class="cjf-card-top"><span class="cjf-company-logo">${portalText((job.company || 'H').slice(0, 1).toUpperCase())}</span><div class="cjf-role-heading"><div class="cjf-title-row"><h2>${portalText(job.title)}</h2>${index === 0 ? '<span class="cjf-top-label">Top match</span>' : ''}</div><p>${portalText(job.company || 'Verified employer')} <span>✓ Verified</span></p></div><div class="cjf-fit"><strong>${score}%</strong><small>Profile match</small></div></div>
    <div class="cjf-meta"><span>⌖ ${candidateJobLocation(job) || 'Location flexible'}</span><span>▣ ${portalText(job.work_mode || 'Flexible')}</span><span>◷ ${job.min_experience ?? 0}–${job.max_experience ?? 0} years</span><span>◈ ${portalText(job.employment_type || 'Full time')}</span></div>
    <p class="cjf-summary">${portalText(job.description || 'Open this role to review the complete job description and hiring requirements.')}</p>
    <div class="cjf-skills">${skills.map(skill => `<span>${portalText(skill)}</span>`).join('')}</div>
    ${reasons.length ? `<div class="cjf-reasons"><b>✦ Why it matches:</b> ${reasons.map(portalText).join(' · ')}</div>` : ''}
    <footer><div><strong>${candidateJobMoney(job)}</strong><span>${job.openings || 1} opening${Number(job.openings || 1) === 1 ? '' : 's'}</span><span>${candidateJobAge(job.created_at)}</span></div><button type="button" data-view-job="${job.id}">View job details →</button></footer>
  </article>`;
}

candidateMatchesPage = async function () {
  try {
    const [status, profile, applications] = await Promise.all([api('/candidate/matching-status'), api('/candidate/profile'), api('/candidate/applications')]);
    const matches = candidateJobList(status.matches), selections = candidateJobList(applications), checks = status.profile_checks || {};
    const completed = Object.values(checks).filter(Boolean).length;
    const locations = [...new Set(matches.map(job => job.city).filter(Boolean))].sort();
    const modes = [...new Set(matches.map(job => job.work_mode).filter(Boolean))].sort();
    const profileSkills = candidateJobList(profile.skills).slice(0, 8);
    const scanTime = status.last_scan_at ? new Date(status.last_scan_at).toLocaleString('en-IN', {day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'}) : 'Waiting for first scan';
    layout(`<div class="candidate-job-portal cjf-page">
      <section class="cjf-header"><div><span class="cjf-eyebrow">PERSONALISED JOB FEED</span><h1>Jobs matched to your profile</h1><p>Live roles created by verified employers and ranked using your skills, experience, title, location and career preferences.</p></div><div class="cjf-header-stat"><span>✦ Live matching</span><strong>${matches.length}</strong><small>relevant role${matches.length === 1 ? '' : 's'} found</small></div></section>
      <section class="cjf-toolbar"><label class="cjf-search"><span>⌕</span><input id="cjf-search" placeholder="Search job title, company or skill" aria-label="Search matched jobs"></label><select id="cjf-location" aria-label="Filter by location"><option value="">All locations</option>${locations.map(value => `<option>${portalText(value)}</option>`).join('')}</select><select id="cjf-mode" aria-label="Filter by work mode"><option value="">All work modes</option>${modes.map(value => `<option>${portalText(value)}</option>`).join('')}</select><select id="cjf-sort" aria-label="Sort jobs"><option value="match">Best match</option><option value="newest">Newest first</option></select></section>
      <div class="cjf-layout"><main><div class="cjf-results-head"><div><b><span id="cjf-count">${matches.length}</span> recommended jobs</b><small>Based on your current candidate profile</small></div><span>Last updated ${portalText(scanTime)}</span></div><div id="cjf-list" class="cjf-list"></div></main>
        <aside><section class="cjf-side-card cjf-profile-signal"><header><span>PROFILE MATCH SIGNAL</span><b>${completed}/3 ready</b></header><h2>${portalText(profile.current_title || 'Your career profile')}</h2><p>${portalText(profile.city || 'Location not added')} · ${Number(profile.total_experience || 0)} years experience</p><div class="cjf-profile-skills">${profileSkills.map(skill => `<span>${portalText(skill)}</span>`).join('') || '<small>Add skills to improve recommendations</small>'}</div><button data-cjf-route="/candidate/profile">Update matching profile →</button></section>
        <section class="cjf-side-card cjf-how"><span>BUILT AROUND YOUR CAREER</span><ol><li><b>Opportunities tailored for you</b><small>Discover roles aligned with your skills and goals.</small></li><li><b>Clear role information</b><small>Review the important details before showing interest.</small></li><li><b>You stay in control</b><small>Choose which opportunities you want to explore.</small></li></ol></section>
        <section class="cjf-side-card cjf-progress"><span>YOUR ACTIVITY</span><div><b>${selections.length}</b><small>selection workflow${selections.length === 1 ? '' : 's'}</small></div><button data-cjf-route="/candidate/applications">View application progress →</button></section></aside>
      </div></div>`, 'My Matches');
    const search = document.querySelector('#cjf-search'), locationFilter = document.querySelector('#cjf-location'), modeFilter = document.querySelector('#cjf-mode'), sort = document.querySelector('#cjf-sort'), list = document.querySelector('#cjf-list'), count = document.querySelector('#cjf-count');
    const draw = () => {
      const query = search.value.trim().toLowerCase(), location = locationFilter.value, mode = modeFilter.value;
      const filtered = matches.filter(job => {
        const haystack = [job.title, job.company, job.description, ...candidateJobList(job.required_skills), ...candidateJobList(job.preferred_skills)].join(' ').toLowerCase();
        return (!query || haystack.includes(query)) && (!location || job.city === location) && (!mode || job.work_mode === mode);
      }).sort((a, b) => sort.value === 'newest' ? new Date(b.created_at) - new Date(a.created_at) : Number(b.match_score || 0) - Number(a.match_score || 0));
      count.textContent = filtered.length;
      list.innerHTML = filtered.length ? filtered.map(candidateFeedCard).join('') : `<div class="cjf-empty"><span>⌕</span><h2>${matches.length ? 'No jobs match these filters' : completed === 3 ? 'We are scanning new vendor roles' : 'Complete your profile to unlock matches'}</h2><p>${matches.length ? 'Try a different keyword, location or work mode.' : completed === 3 ? `Your profile is monitoring ${status.active_requirements_monitored || 0} active requirement${status.active_requirements_monitored === 1 ? '' : 's'}. Relevant roles will appear automatically.` : 'Your profile, resume and availability must be ready before personalised jobs can be ranked.'}</p><button data-cjf-route="/candidate/profile">Review your profile</button></div>`;
      document.querySelectorAll('[data-job-id]').forEach(card => { const open = () => route(`/candidate/jobs/${card.dataset.jobId}`); card.onclick = open; card.onkeydown = event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(); } }; });
      document.querySelectorAll('[data-view-job]').forEach(button => button.onclick = event => { event.stopPropagation(); route(`/candidate/jobs/${button.dataset.viewJob}`); });
      document.querySelectorAll('[data-cjf-route]').forEach(button => button.onclick = () => route(button.dataset.cjfRoute));
    };
    [search, locationFilter, modeFilter, sort].forEach(control => control.addEventListener(control === search ? 'input' : 'change', draw));
    draw();
  } catch (error) { toast(error.message, true); }
};

async function candidateJobDetailPage(requirementId) {
  try {
    const [job, status] = await Promise.all([api(`/requirements/${requirementId}`), api('/candidate/matching-status')]);
    const match = candidateJobList(status.matches).find(item => Number(item.id) === Number(requirementId)) || job;
    const score = Math.round(Number(match.match_score || 0)), reasons = candidateJobList(match.match_reasons), required = candidateJobList(job.required_skills), preferred = candidateJobList(job.preferred_skills);
    layout(`<div class="candidate-job-portal cjd-page"><button class="cjd-back" data-cjf-route="/candidate/matches">← Back to matched jobs</button>
      <section class="cjd-hero"><div class="cjd-logo">${portalText((job.company || 'H').slice(0, 1).toUpperCase())}</div><div><span>${portalText(job.company || 'Verified employer')} · Verified employer</span><h1>${portalText(job.title)}</h1><p>${candidateJobLocation(job)} <i>•</i> ${portalText(job.work_mode)} <i>•</i> ${portalText(job.employment_type)} <i>•</i> ${job.min_experience}–${job.max_experience} years</p></div><div class="cjd-score"><strong>${score}%</strong><small>Profile match</small></div></section>
      <div class="cjd-layout"><main><section class="cjd-card"><header><h2>Job description</h2><span>${candidateJobAge(job.created_at)}</span></header><p class="cjd-description">${portalText(job.description)}</p></section>
      <section class="cjd-card"><header><h2>Skills required</h2></header><h3>Must-have skills</h3><div class="cjd-skills">${required.map(skill => `<span>${portalText(skill)}</span>`).join('') || '<p>Skills will be discussed with the employer.</p>'}</div>${preferred.length ? `<h3>Preferred skills</h3><div class="cjd-skills secondary">${preferred.map(skill => `<span>${portalText(skill)}</span>`).join('')}</div>` : ''}</section>
      <section class="cjd-card"><header><h2>Role details</h2></header><div class="cjd-detail-grid">${[['Employment type',job.employment_type],['Work mode',job.work_mode],['Experience',`${job.min_experience}–${job.max_experience} years`],['Openings',job.openings || 1],['Location',candidateJobLocation(job)],['Compensation',candidateJobMoney(job)],['Application deadline',job.application_deadline ? new Date(job.application_deadline).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}) : 'Open until filled'],['Posted on',new Date(job.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})]].map(([label, value]) => `<div><small>${portalText(label)}</small><b>${portalText(value)}</b></div>`).join('')}</div></section></main>
      <aside><section class="cjd-card cjd-match-card"><span>WHY THIS JOB FITS YOU</span><div class="cjd-match-ring" style="--fit:${score * 3.6}deg"><div><b>${score}%</b><small>match</small></div></div><ul>${(reasons.length ? reasons : ['Profile relevance']).map(reason => `<li>✓ ${portalText(reason)}</li>`).join('')}</ul></section>
      <section class="cjd-card cjd-interest"><h2>Interested in this role?</h2><p>Confirm your interest so the hiring workflow can use an explicit candidate signal.</p><button class="primary" data-interest="interested">I’m interested</button><button data-interest="need_more_details">I need more details</button><button class="quiet" data-interest="not_interested">Not interested</button><small>Your profile is never submitted without a confirmed workflow.</small></section>
      <section class="cjd-card cjd-company"><span>ABOUT THE EMPLOYER</span><div><i>${portalText((job.company || 'H').slice(0, 1).toUpperCase())}</i><p><b>${portalText(job.company || 'Verified employer')}</b><small>Verified hiring organisation</small></p></div></section></aside></div></div>`, 'Job Details');
    document.querySelectorAll('[data-cjf-route]').forEach(button => button.onclick = () => route(button.dataset.cjfRoute));
    document.querySelectorAll('[data-interest]').forEach(button => button.onclick = async () => {
      const buttons = [...document.querySelectorAll('[data-interest]')]; buttons.forEach(item => item.disabled = true);
      try { await api(`/candidate/jobs/${requirementId}/interest`, {method: 'PUT', body: JSON.stringify({status: button.dataset.interest, notes: null})}); buttons.forEach(item => item.classList.toggle('selected', item === button)); toast(button.dataset.interest === 'interested' ? 'Interest confirmed for this role' : button.dataset.interest === 'need_more_details' ? 'Request for more details saved' : 'Job removed from your interested roles'); }
      catch (error) { toast(error.message, true); } finally { buttons.forEach(item => item.disabled = false); }
    });
  } catch (error) { toast(error.message, true); }
}

const candidateMatchesBaseRender = render;
render = function () {
  const detail = location.pathname.match(/^\/candidate\/jobs\/(\d+)$/);
  if (session?.user.role === 'candidate' && detail) return candidateJobDetailPage(detail[1]);
  return candidateMatchesBaseRender();
};
if (session?.user.role === 'candidate') render();
