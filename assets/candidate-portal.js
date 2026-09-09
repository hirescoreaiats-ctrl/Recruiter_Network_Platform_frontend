/* Candidate talent profile. AI matching is passive: candidates do not browse or apply to jobs here. */
const portalText = value => candidateEscape(value ?? '');
const portalList = value => Array.isArray(value) ? value : [];
const portalDate = value => value ? new Date(value).toLocaleDateString('en-GB', {day: 'numeric', month: 'short', year: 'numeric'}) : '—';
const portalStatus = value => String(value || 'in_review').replaceAll('_', ' ').replace(/\b\w/g, letter => letter.toUpperCase());

function candidateProfileStrength(profile) {
  const checks = [profile.full_name, profile.email, profile.phone, profile.current_title,
    profile.total_experience !== null && profile.total_experience !== undefined, profile.city, profile.country,
    portalList(profile.skills).length, profile.linkedin_url, profile.current_employer, profile.resume_file_id,
    Object.values(profile.country_specific_data || {}).filter(Boolean).length >= 2];
  return Math.round(checks.filter(Boolean).length / checks.length * 100);
}

function candidateMatchMeta(requirement) {
  const location = [requirement.city, countryConfig[requirement.country]?.name || requirement.country].filter(Boolean).join(', ');
  return [location, requirement.work_mode, requirement.employment_type].filter(Boolean).map(portalText).join(' <i>•</i> ');
}

function candidateMatchCard(match) {
  const requirement = match.requirement || match.job || match;
  const reasons = portalList(match.match_reasons || match.reasons).slice(0, 3);
  const skills = portalList(requirement.required_skills || requirement.skills).slice(0, 4);
  const rawScore = match.match_score ?? match.score;
  const score = rawScore === undefined || rawScore === null ? '' : `<span class="jp-match-score">${Math.round(Number(rawScore))}% profile fit</span>`;
  return `<article class="jp-match-card"><span class="jp-company-mark">${portalText((requirement.company || 'C').slice(0, 1).toUpperCase())}</span><div class="jp-match-copy"><div class="jp-match-heading"><div><small>${portalText(requirement.company || 'Verified recruiter')}</small><h3>${portalText(requirement.title || 'Matching opportunity')}</h3></div>${score}</div><p class="jp-match-meta">${candidateMatchMeta(requirement) || 'Details will be shared when the recruiter proceeds'}</p>${(reasons.length || skills.length) ? `<div class="jp-skill-row">${(reasons.length ? reasons : skills).map(item => `<span>${portalText(item)}</span>`).join('')}</div>` : ''}<p class="jp-match-note">${candidateIcon('spark')} HireScoreAI found this from your profile. No application is required.</p></div><span class="jp-passive-status">Profile matched</span></article>`;
}

function candidateSelectionCard(application) {
  const requirement = application.requirement || {};
  return `<article class="jp-selection-card"><span class="jp-company-mark">${portalText((requirement.company || 'C').slice(0, 1).toUpperCase())}</span><div><small>${portalText(requirement.company || 'Recruitment team')}</small><h3>${portalText(requirement.title || 'Opportunity')}</h3><p>${candidateMatchMeta(requirement) || `Added ${portalDate(application.submitted_at || application.created_at)}`}</p></div><span class="jp-status ${portalText(application.status)}">${portalStatus(application.status)}</span></article>`;
}

function wireCandidatePortalRoutes() {
  document.querySelectorAll('[data-portal-route]').forEach(button => button.onclick = () => route(button.dataset.portalRoute));
}

candidateDashboard = async function () {
  try {
    const [status, profile, applications] = await Promise.all([api('/candidate/matching-status'), api('/candidate/profile'), api('/candidate/applications')]);
    const matches = portalList(status.matches);
    const selections = portalList(applications);
    const checks = status.profile_checks || {};
    const profileReady = checks.profile === true;
    const resumeReady = checks.resume === true;
    const availabilityReady = checks.availability === true;
    const readyCount = [profileReady, resumeReady, availabilityReady].filter(Boolean).length;
    const strength = Math.round(readyCount / 3 * 100);
    const isActive = readyCount === 3 && status.availability?.status !== 'not_looking';
    const initials = portalText(candidateInitials(profile.full_name));
    layout(`<div class="candidate-job-portal jp-dashboard"><section class="jp-passive-hero"><div><span class="jp-eyebrow">YOUR AI TALENT PROFILE</span><h1>Build your profile once.<br>Let the right opportunity find you.</h1><p>There is no job feed to search. HireScoreAI continuously compares your skills, experience and preferences with verified recruiter requirements, then surfaces only genuine matches.</p><div class="jp-hero-actions"><button data-portal-route="/candidate/profile">Strengthen my profile</button><button class="secondary" data-portal-route="/candidate/matches">View AI matches</button></div></div><div class="jp-ai-orbit"><span>${candidateIcon('spark')}</span><b>${isActive ? 'AI matching is active' : 'Complete your setup'}</b><small>${isActive ? `${status.active_requirements_monitored || 0} recruiter requirements monitored` : `${readyCount} of 3 essentials ready`}</small></div></section><section class="jp-dashboard-grid"><main>
      <section class="jp-section jp-readiness"><header><div><span class="jp-eyebrow">PROFILE READINESS</span><h2>Give the matching engine a complete picture</h2><p>These three signals decide when and where your profile can be considered.</p></div><strong>${readyCount}/3 ready</strong></header><div class="jp-setup-grid"><article class="${profileReady ? 'complete' : ''}"><span>${candidateIcon(profileReady ? 'check' : 'profile')}</span><div><small>01</small><h3>Professional profile</h3><p>Skills, experience, location and preferences</p></div><button data-portal-route="/candidate/profile">${profileReady ? 'Review' : 'Complete'} →</button></article><article class="${resumeReady ? 'complete' : ''}"><span>${candidateIcon(resumeReady ? 'check' : 'file')}</span><div><small>02</small><h3>Current resume</h3><p>Evidence of your experience and achievements</p></div><button data-portal-route="/candidate/resume">${resumeReady ? 'Manage' : 'Upload'} →</button></article><article class="${availabilityReady ? 'complete' : ''}"><span>${candidateIcon(availabilityReady ? 'check' : 'clock')}</span><div><small>03</small><h3>Availability</h3><p>Your search status and possible start date</p></div><button data-portal-route="/candidate/availability">${availabilityReady ? 'Update' : 'Set status'} →</button></article></div></section>
      <section class="jp-section"><header><div><span class="jp-eyebrow">AI-MATCHED OPPORTUNITIES</span><h2>Strong fits detected for your profile</h2><p>Only opportunities selected by the matching engine appear here.</p></div><button data-portal-route="/candidate/matches">View all →</button></header><div class="jp-match-list">${matches.length ? matches.slice(0, 3).map(candidateMatchCard).join('') : `<div class="jp-empty"><span>${candidateIcon('spark')}</span><h3>${isActive ? 'Your profile is being monitored' : 'Finish your profile to start matching'}</h3><p>${isActive ? `HireScoreAI is checking ${status.active_requirements_monitored || 0} active recruiter requirements. We will show an opportunity only when your profile is a strong fit.` : 'Complete your profile, resume and availability. The AI matching engine will take it from there—no searching or applying needed.'}</p><button data-portal-route="${resumeReady ? '/candidate/profile' : '/candidate/resume'}">${isActive ? 'Review my profile' : 'Complete setup'}</button></div>`}</div></section>
      ${selections.length ? `<section class="jp-section"><header><div><span class="jp-eyebrow">SELECTION PROGRESS</span><h2>Recruiter activity</h2><p>Updates for opportunities where your profile has moved forward.</p></div><button data-portal-route="/candidate/matches">See progress →</button></header><div class="jp-selection-list">${selections.slice(0, 3).map(candidateSelectionCard).join('')}</div></section>` : ''}</main><aside class="jp-dashboard-aside"><section class="jp-profile-card"><div class="jp-profile-head"><span>${initials}</span><div><h2>${portalText(profile.full_name)}</h2><p>${portalText(profile.current_title)}</p><small>${portalText(profile.city)}, ${portalText(countryConfig[profile.country]?.name || profile.country)}</small></div></div><div class="jp-strength"><div><span>Setup progress</span><b>${strength}%</b></div><i><span style="width:${strength}%"></span></i><p>${strength < 100 ? `${3 - readyCount} required step${3 - readyCount === 1 ? '' : 's'} still incomplete.` : 'Your profile is ready for live matching.'}</p></div><button data-portal-route="/candidate/profile">Review profile</button></section><section class="jp-how-card"><span>${candidateIcon('spark')}</span><h3>How matching works</h3><ol><li><b>You stay ready</b><small>Keep your profile, resume and availability current.</small></li><li><b>AI checks requirements</b><small>Your evidence is compared with verified recruiter needs.</small></li><li><b>Strong fits move forward</b><small>Relevant matches and recruiter updates appear here.</small></li></ol></section><section class="jp-privacy-card">${candidateIcon('lock')}<div><b>No manual applications</b><p>Your profile is considered through the matching workflow. You never need to browse a public job feed.</p></div></section></aside></section></div>`, 'Home');
    wireCandidatePortalRoutes();
  } catch (error) { toast(error.message, true); }
};

async function candidateMatchesPage() {
  try {
    const [status, applications] = await Promise.all([api('/candidate/matching-status'), api('/candidate/applications')]);
    const matches = portalList(status.matches);
    const selections = portalList(applications);
    layout(`<div class="candidate-job-portal jp-matches-page"><header class="jp-page-head"><span>AI TALENT MATCHING</span><h1>My matches</h1><p>Opportunities appear only when your profile meaningfully fits a verified recruiter requirement. There is nothing to search or apply for.</p><div class="jp-monitor-strip"><span class="${status.agent_status === 'waiting_for_profile' ? 'waiting' : ''}"><i></i>${portalStatus(status.agent_status || 'Monitoring')}</span><b>${status.active_requirements_monitored || 0}</b><small>active recruiter requirements monitored</small>${status.last_scan_at ? `<em>Last checked ${portalDate(status.last_scan_at)}</em>` : ''}</div></header><section class="jp-section"><header><div><span class="jp-eyebrow">PROFILE FITS</span><h2>Opportunities selected by HireScoreAI</h2><p>Matching uses your structured profile, resume, availability and market preferences.</p></div><button data-portal-route="/candidate/profile">Update profile →</button></header><div class="jp-match-list">${matches.length ? matches.map(candidateMatchCard).join('') : `<div class="jp-empty"><span>${candidateIcon('spark')}</span><h3>No strong match yet</h3><p>This is normal. HireScoreAI will keep checking new recruiter requirements and will surface an opportunity only when the fit is meaningful.</p><button data-portal-route="/candidate/profile">Review matching details</button></div>`}</div></section><section class="jp-section"><header><div><span class="jp-eyebrow">SELECTION PROGRESS</span><h2>Profiles moved forward</h2><p>If a recruiter workflow advances your matched profile, its latest status appears here.</p></div></header><div class="jp-selection-list">${selections.length ? selections.map(candidateSelectionCard).join('') : `<div class="jp-empty compact"><p>Your profile has not entered a recruiter selection workflow yet. Matching continues automatically in the background.</p></div>`}</div></section></div>`, 'My Matches');
    wireCandidatePortalRoutes();
  } catch (error) { toast(error.message, true); }
}

const candidatePortalBaseProfile = profilePage;
profilePage = async function () {
  if (session.user.role !== 'candidate') return candidatePortalBaseProfile();
  try {
    const profile = await api('/candidate/profile');
    const countryName = countryConfig[profile.country]?.name || profile.country;
    const originalCountry = profile.country;
    const strength = candidateProfileStrength(profile);
    const initials = portalText(candidateInitials(profile.full_name));
    layout(`<div class="candidate-job-portal jp-profile-page"><header class="jp-profile-banner"><div class="jp-profile-avatar">${initials}</div><div><span>MY TALENT PROFILE</span><h1>${portalText(profile.full_name)}</h1><p>${portalText(profile.current_title)} · ${portalText(profile.city)}, ${portalText(countryName)}</p><small>${portalText(profile.email)}${profile.phone ? ` · ${portalText(profile.phone)}` : ''}</small></div><button type="button" data-portal-route="/candidate/matches">View AI matches</button></header><div class="jp-profile-layout"><main><form id="candidate-profile-form"><section class="jp-profile-section"><header><div><h2>Personal details</h2><p>Basic information recruiters use to identify and contact you.</p></div><span>Required</span></header><div class="jp-form-grid"><label><span>Full name *</span><input name="full_name" value="${portalText(profile.full_name)}" required></label><label><span>Email address *</span><input name="email" type="email" value="${portalText(profile.email)}" required></label><label><span>Phone number *</span><input name="phone" value="${portalText(profile.phone)}" required></label><label><span>LinkedIn profile</span><input name="linkedin_url" type="url" value="${portalText(profile.linkedin_url || '')}" placeholder="https://linkedin.com/in/your-profile"></label></div></section><section class="jp-profile-section"><header><div><h2>Professional details</h2><p>Core evidence used for skill, title and experience matching.</p></div></header><div class="jp-form-grid"><label><span>Current job title *</span><input name="current_title" value="${portalText(profile.current_title)}" required></label><label><span>Total experience (years) *</span><input name="total_experience" type="number" min="0" max="60" step=".5" value="${profile.total_experience}" required></label><label><span>Current employer</span><input name="current_employer" value="${portalText(profile.current_employer || '')}" placeholder="Company name"></label><label class="wide"><span>Key skills *</span><input name="skills" value="${portalText(portalList(profile.skills).join(', '))}" placeholder="JavaScript, React, SQL" required><small>Separate skills with commas</small></label></div></section><section class="jp-profile-section"><header><div><h2>Location and career preferences</h2><p>Helps AI identify requirements that fit your market and expectations.</p></div></header><div class="jp-form-grid"><label><span>Country *</span><select name="country" id="profile-country" required>${Object.entries(countryConfig).map(([code, config]) => `<option value="${code}" ${profile.country===code?'selected':''}>${portalText(config.name)}</option>`).join('')}</select></label><label><span>City / location *</span><input name="city" value="${portalText(profile.city)}" required></label></div><div class="jp-market-fields"><header><div><b id="country-fields-title">${portalText(countryName)} matching preferences</b><small>Country-aware details improve matching accuracy.</small></div><span>Market specific</span></header><div id="profile-country-fields" class="jp-form-grid">${profileCountryFields(profile.country, profile.country_specific_data)}</div></div></section><div class="jp-save-bar"><p><b>Keep your talent profile current</b><small>Accurate information helps AI make confident matches.</small></p><button type="submit">Save profile</button></div></form></main><aside><section class="jp-profile-completion"><div class="jp-completion-ring" style="--completion:${strength*3.6}deg"><span><b>${strength}%</b><small>complete</small></span></div><h3>Profile strength</h3><p>${strength < 80 ? 'Add missing details for more confident matching.' : 'Your profile gives the matching engine strong evidence.'}</p><ul><li class="done">✓ Contact details</li><li class="${portalList(profile.skills).length?'done':''}">✓ Skills and experience</li><li class="${profile.linkedin_url?'done':''}">✓ LinkedIn profile</li><li class="${profile.resume_file_id?'done':''}">✓ Resume uploaded</li></ul></section><section class="jp-profile-side"><span>${candidateIcon('file')}</span><div><h3>Resume</h3><p>${profile.resume_file_id ? 'Uploaded and available to the matching workflow.' : 'Upload a resume to support your profile.'}</p><button data-portal-route="/candidate/resume">${profile.resume_file_id ? 'Manage resume' : 'Upload resume'} →</button></div></section><section class="jp-profile-side"><span>${candidateIcon('clock')}</span><div><h3>Availability</h3><p>Tell the matching engine when you can start.</p><button data-portal-route="/candidate/availability">Update availability →</button></div></section></aside></div></div>`, 'My Profile');
    wireCandidatePortalRoutes();
    const country = document.querySelector('#profile-country');
    country.onchange = () => {
      const code = country.value;
      document.querySelector('#profile-country-fields').innerHTML = profileCountryFields(code, code === originalCountry ? profile.country_specific_data : {});
      document.querySelector('#country-fields-title').textContent = `${countryConfig[code]?.name || 'Selected market'} matching preferences`;
    };
    document.querySelector('#candidate-profile-form').onsubmit = async event => {
      event.preventDefault();
      const form = event.target;
      const button = form.querySelector('[type=submit]');
      const data = new FormData(form);
      const body = {full_name: data.get('full_name').trim(), email: data.get('email').trim(), phone: data.get('phone').trim(), country: data.get('country'), city: data.get('city').trim(), current_title: data.get('current_title').trim(), total_experience: Number(data.get('total_experience')), skills: data.get('skills').split(',').map(item => item.trim()).filter(Boolean), linkedin_url: data.get('linkedin_url') || null, current_employer: data.get('current_employer') || null, country_specific_data: {}};
      for (const [key, value] of data) if (key.startsWith('extra_')) body.country_specific_data[key.slice(6)] = value;
      button.disabled = true; button.textContent = 'Saving…';
      try { await api('/candidate/profile', {method: 'PUT', body: JSON.stringify(body)}); toast('Profile saved successfully'); await profilePage(); }
      catch (error) { button.disabled = false; button.textContent = 'Save profile'; toast(error.message, true); }
    };
  } catch (error) { toast(error.message, true); }
};

const candidatePortalBaseRender = render;
render = function () {
  if (session?.user.role === 'candidate') {
    if (location.pathname === '/candidate/matches') return candidateMatchesPage();
    if (location.pathname === '/candidate/jobs' || location.pathname === '/candidate/applications' || location.pathname.startsWith('/candidate/jobs/')) {
      history.replaceState({}, '', '/candidate/matches');
      return candidateMatchesPage();
    }
  }
  return candidatePortalBaseRender();
};

if (session?.user.role === 'candidate') render();
