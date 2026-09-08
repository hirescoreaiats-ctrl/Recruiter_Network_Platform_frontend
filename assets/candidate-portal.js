/* Candidate job portal. Reuses the existing API and leaves employer/partner workspaces untouched. */
const portalText = value => candidateEscape(value ?? '');
const portalList = value => Array.isArray(value) ? value : [];
const portalDate = value => value ? new Date(value).toLocaleDateString('en-GB', {day: 'numeric', month: 'short', year: 'numeric'}) : '—';
const portalStatus = value => String(value || 'submitted').replaceAll('_', ' ').replace(/\b\w/g, letter => letter.toUpperCase());

function candidateProfileStrength(profile) {
  const checks = [profile.full_name, profile.email, profile.phone, profile.current_title, profile.total_experience !== null && profile.total_experience !== undefined,
    profile.city, profile.country, portalList(profile.skills).length, profile.linkedin_url, profile.current_employer,
    profile.resume_file_id, Object.values(profile.country_specific_data || {}).filter(Boolean).length >= 2];
  return Math.round(checks.filter(Boolean).length / checks.length * 100);
}

function candidateJobMeta(job) {
  const location = [job.city, countryConfig[job.country]?.name || job.country].filter(Boolean).join(', ');
  return [location, job.work_mode, job.employment_type].filter(Boolean).map(portalText).join(' <i>•</i> ');
}

function candidateCompensation(job) {
  if (!job.compensation_min && !job.compensation_max) return 'Compensation not disclosed';
  const amount = [job.compensation_min, job.compensation_max].filter(value => value !== null && value !== undefined)
    .map(value => Number(value).toLocaleString()).join(' – ');
  return `${job.currency || ''} ${amount}${job.compensation_type ? ` / ${job.compensation_type}` : ''}`.trim();
}

function candidateJobCard(job, options = {}) {
  const skills = portalList(job.required_skills || job.skills).slice(0, 5);
  const score = job.match_score === undefined ? '' : `<span class="jp-match-score">${Math.round(job.match_score)}% match</span>`;
  const posted = job.created_at ? `Posted ${portalDate(job.created_at)}` : 'Open position';
  return `<article class="jp-job-card">
    <div class="jp-company-mark">${portalText((job.company || 'Company').slice(0, 1).toUpperCase())}</div>
    <div class="jp-job-main">
      <div class="jp-job-heading"><div><span>${portalText(job.company || 'Hiring company')}</span><h3>${portalText(job.title)}</h3></div>${score}</div>
      <p class="jp-job-meta">${candidateJobMeta(job)}</p>
      <p class="jp-job-summary">${portalText(job.description || 'View the role to see the complete job description and requirements.')}</p>
      <div class="jp-skill-row">${skills.map(skill => `<span>${portalText(skill)}</span>`).join('')}${skills.length ? '' : '<span>Skills listed in job details</span>'}</div>
      <div class="jp-job-footer"><span>${portalText(candidateCompensation(job))}</span><small>${posted}</small></div>
    </div>
    <div class="jp-job-actions"><button type="button" class="jp-secondary" data-view-job="${job.id}">View details</button><button type="button" class="jp-primary" data-apply-job="${job.id}">${options.applied ? 'Applied' : 'Apply now'}</button></div>
  </article>`;
}

function wireCandidateJobActions() {
  document.querySelectorAll('[data-view-job]').forEach(button => button.onclick = () => route(`/candidate/jobs/${button.dataset.viewJob}`));
  document.querySelectorAll('[data-apply-job]').forEach(button => button.onclick = async () => {
    if (button.disabled || button.textContent === 'Applied') return;
    button.disabled = true;
    button.textContent = 'Applying…';
    try {
      await api(`/candidate/jobs/${button.dataset.applyJob}/apply`, {method: 'POST'});
      button.textContent = 'Applied';
      toast('Application submitted successfully');
    } catch (error) {
      button.disabled = false;
      button.textContent = 'Apply now';
      toast(error.message, true);
    }
  });
}

candidateDashboard = async function () {
  try {
    const [summary, status, profile, applications, jobs] = await Promise.all([
      api('/dashboard'), api('/candidate/matching-status'), api('/candidate/profile'),
      api('/candidate/applications'), api('/requirements')
    ]);
    const appRows = portalList(applications);
    const allJobs = portalList(jobs);
    const matchedJobs = portalList(status.matches);
    const appliedIds = new Set(appRows.map(item => item.requirement?.id));
    const recommended = [...matchedJobs, ...allJobs.filter(job => !matchedJobs.some(match => match.id === job.id))].slice(0, 4);
    const strength = candidateProfileStrength(profile);
    const initials = portalText(profile.full_name.split(/\s+/).map(word => word[0]).slice(0, 2).join('').toUpperCase());
    const content = `<div class="candidate-job-portal jp-dashboard">
      <section class="jp-search-hero">
        <div class="jp-welcome"><span>Welcome back</span><h1>Find a job that fits your career</h1><p>Search verified opportunities, manage your profile and track every application from one place.</p></div>
        <form class="jp-search-form" id="portal-job-search"><label><span>Job title or skill</span><div>${candidateIcon('search')}<input id="job-search-keyword" name="keyword" placeholder="e.g. Data Analyst, Java, React"></div></label><label><span>Location</span><div>${candidateIcon('profile')}<input name="location" placeholder="City or remote"></div></label><button type="submit">Search jobs</button></form>
        <div class="jp-popular"><span>Quick search:</span>${['Remote','Data Analyst','Java Developer','React'].map(term => `<button type="button" data-quick-search="${term}">${term}</button>`).join('')}</div>
      </section>
      <section class="jp-dashboard-grid">
        <main>
          <div class="jp-stat-grid"><article><span class="jp-stat-icon purple">${candidateIcon('briefcase')}</span><div><small>Applications</small><b>${summary.applications || 0}</b><em>${summary.under_review || 0} under review</em></div></article><article><span class="jp-stat-icon blue">${candidateIcon('search')}</span><div><small>Open jobs</small><b>${allJobs.length || status.active_requirements_monitored || 0}</b><em>Available to explore</em></div></article><article><span class="jp-stat-icon green">${candidateIcon('spark')}</span><div><small>Profile matches</small><b>${matchedJobs.length}</b><em>Based on your profile</em></div></article></div>
          <section class="jp-section"><header><div><h2>Recommended jobs for you</h2><p>Roles selected from your skills, experience and preferences.</p></div><button data-portal-route="/candidate/jobs">View all jobs →</button></header><div class="jp-job-list">${recommended.length ? recommended.map(job => candidateJobCard(job, {applied: appliedIds.has(job.id)})).join('') : `<div class="jp-empty"><span>${candidateIcon('search')}</span><h3>No open jobs yet</h3><p>Your profile is ready. New recruiter opportunities will appear here as soon as they are published.</p><button data-portal-route="/candidate/profile">Keep profile updated</button></div>`}</div></section>
          <section class="jp-section jp-app-preview"><header><div><h2>Recent applications</h2><p>Track updates from employers and recruiters.</p></div><button data-portal-route="/candidate/applications">View all applications →</button></header>${appRows.length ? `<div class="jp-application-list">${appRows.slice(0, 3).map(application => `<article><span class="jp-company-mark">${portalText((application.requirement?.company || 'C')[0])}</span><div><b>${portalText(application.requirement?.title)}</b><small>${portalText(application.requirement?.company)} · Applied ${portalDate(application.submitted_at)}</small></div><span class="jp-status ${portalText(application.status)}">${portalStatus(application.status)}</span></article>`).join('')}</div>` : `<div class="jp-empty compact"><p>You have not applied to a job yet.</p><button data-portal-route="/candidate/jobs">Browse open jobs</button></div>`}</section>
        </main>
        <aside class="jp-dashboard-aside">
          <section class="jp-profile-card"><div class="jp-profile-head"><span>${initials}</span><div><h2>${portalText(profile.full_name)}</h2><p>${portalText(profile.current_title)}</p><small>${portalText(profile.city)}, ${portalText(countryConfig[profile.country]?.name || profile.country)}</small></div></div><div class="jp-strength"><div><span>Profile completion</span><b>${strength}%</b></div><i><span style="width:${strength}%"></span></i><p>${strength < 80 ? 'Complete your profile to improve job recommendations.' : 'Your profile is ready for recruiters.'}</p></div><button data-portal-route="/candidate/profile">${strength < 100 ? 'Complete profile' : 'View profile'}</button></section>
          <section class="jp-side-card"><header><span>${candidateIcon('file')}</span><div><h3>Resume</h3><p>${profile.resume_file_id ? 'Your resume is uploaded' : 'Add your latest resume'}</p></div></header><button data-portal-route="/candidate/resume">${profile.resume_file_id ? 'Manage resume' : 'Upload resume'} →</button></section>
          <section class="jp-side-card"><header><span>${candidateIcon('clock')}</span><div><h3>Job search status</h3><p>${portalStatus(status.availability?.status || 'Not set')}</p></div></header><button data-portal-route="/candidate/availability">Update availability →</button></section>
        </aside>
      </section>
    </div>`;
    layout(content, 'Home');
    document.querySelectorAll('[data-portal-route]').forEach(button => button.onclick = () => route(button.dataset.portalRoute));
    document.querySelectorAll('[data-quick-search]').forEach(button => button.onclick = () => route(`/candidate/jobs?keyword=${encodeURIComponent(button.dataset.quickSearch)}`));
    document.querySelector('#portal-job-search').onsubmit = event => {
      event.preventDefault();
      const params = new URLSearchParams(new FormData(event.target));
      [...params].forEach(([key, value]) => { if (!value.trim()) params.delete(key); });
      route(`/candidate/jobs${params.size ? `?${params}` : ''}`);
    };
    wireCandidateJobActions();
  } catch (error) { toast(error.message, true); }
};

async function candidateJobsPage() {
  try {
    const search = new URLSearchParams(location.search);
    const query = new URLSearchParams();
    for (const key of ['keyword','location','country','work_mode']) if (search.get(key)) query.set(key, search.get(key));
    const [jobs, applications] = await Promise.all([api(`/requirements${query.size ? `?${query}` : ''}`), api('/candidate/applications')]);
    const rows = portalList(jobs);
    const appliedIds = new Set(portalList(applications).map(item => item.requirement?.id));
    layout(`<div class="candidate-job-portal jp-jobs-page"><header class="jp-page-head"><span>JOB SEARCH</span><h1>Find your next opportunity</h1><p>Explore jobs from verified employers and recruitment partners.</p></header><form id="jobs-filter" class="jp-filter-bar"><label><span>Keywords</span><input name="keyword" value="${portalText(search.get('keyword') || '')}" placeholder="Job title, skill or company"></label><label><span>Location</span><input name="location" value="${portalText(search.get('location') || '')}" placeholder="City or remote"></label><label><span>Country</span><select name="country"><option value="">All countries</option>${Object.entries(countryConfig).map(([code, config]) => `<option value="${code}" ${search.get('country')===code?'selected':''}>${portalText(config.name)}</option>`).join('')}</select></label><label><span>Work mode</span><select name="work_mode"><option value="">Any mode</option>${['Remote','Hybrid','Onsite'].map(mode => `<option ${search.get('work_mode')===mode?'selected':''}>${mode}</option>`).join('')}</select></label><button type="submit">Search jobs</button></form><div class="jp-results-head"><div><h2>${rows.length} job${rows.length===1?'':'s'} found</h2><p>${query.size ? 'Results matching your search filters' : 'Latest opportunities across the network'}</p></div>${query.size ? '<button type="button" data-clear-filters>Clear filters</button>' : ''}</div><div class="jp-job-list">${rows.length ? rows.map(job => candidateJobCard(job, {applied: appliedIds.has(job.id)})).join('') : `<div class="jp-empty"><span>${candidateIcon('search')}</span><h3>No jobs match your search</h3><p>Try a broader keyword, another location or clear the filters.</p><button type="button" data-clear-filters>Clear filters</button></div>`}</div></div>`, 'Find Jobs');
    document.querySelector('#jobs-filter').onsubmit = event => {
      event.preventDefault();
      const params = new URLSearchParams(new FormData(event.target));
      [...params].forEach(([key, value]) => { if (!value.trim()) params.delete(key); });
      route(`/candidate/jobs${params.size ? `?${params}` : ''}`);
    };
    document.querySelectorAll('[data-clear-filters]').forEach(button => button.onclick = () => route('/candidate/jobs'));
    wireCandidateJobActions();
  } catch (error) { toast(error.message, true); }
}

async function candidateApplicationsPage() {
  try {
    const applications = portalList(await api('/candidate/applications'));
    const groups = {submitted: 0, under_review: 0, shortlisted: 0, interview: 0, selected: 0};
    applications.forEach(item => { if (groups[item.status] !== undefined) groups[item.status] += 1; });
    layout(`<div class="candidate-job-portal jp-applications-page"><header class="jp-page-head"><span>MY APPLICATIONS</span><h1>Track your job applications</h1><p>Follow every application from submission through the hiring process.</p></header><section class="jp-application-stats">${[['All applications',applications.length],['Under review',groups.under_review],['Shortlisted',groups.shortlisted],['Interviews',groups.interview]].map(([label, value]) => `<article><small>${label}</small><b>${value}</b></article>`).join('')}</section><section class="jp-section"><header><div><h2>Application history</h2><p>Latest status shared by the hiring team.</p></div><button data-portal-route="/candidate/jobs">Find more jobs →</button></header>${applications.length ? `<div class="jp-application-cards">${applications.map(application => { const job=application.requirement||{}; return `<article><span class="jp-company-mark">${portalText((job.company || 'C')[0])}</span><div class="jp-application-copy"><span>${portalText(job.company)}</span><h3>${portalText(job.title)}</h3><p>${candidateJobMeta(job)}</p><small>Applied on ${portalDate(application.submitted_at)}</small></div><div class="jp-application-state"><span class="jp-status ${portalText(application.status)}">${portalStatus(application.status)}</span><button data-view-job="${job.id}">View job</button></div></article>`; }).join('')}</div>` : `<div class="jp-empty"><span>${candidateIcon('briefcase')}</span><h3>No applications yet</h3><p>Explore open roles and apply when you find the right opportunity.</p><button data-portal-route="/candidate/jobs">Browse jobs</button></div>`}</section></div>`, 'My Applications');
    document.querySelectorAll('[data-portal-route]').forEach(button => button.onclick = () => route(button.dataset.portalRoute));
    document.querySelectorAll('[data-view-job]').forEach(button => button.onclick = () => route(`/candidate/jobs/${button.dataset.viewJob}`));
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
    const initials = portalText(profile.full_name.split(/\s+/).map(word => word[0]).slice(0, 2).join('').toUpperCase());
    layout(`<div class="candidate-job-portal jp-profile-page"><header class="jp-profile-banner"><div class="jp-profile-avatar">${initials}</div><div><span>MY PROFILE</span><h1>${portalText(profile.full_name)}</h1><p>${portalText(profile.current_title)} · ${portalText(profile.city)}, ${portalText(countryName)}</p><small>${portalText(profile.email)}${profile.phone ? ` · ${portalText(profile.phone)}` : ''}</small></div><button type="button" data-portal-route="/candidate/jobs">View matching jobs</button></header><div class="jp-profile-layout"><main><form id="candidate-profile-form"><section class="jp-profile-section"><header><div><h2>Personal details</h2><p>Basic information recruiters use to contact you.</p></div><span>Required</span></header><div class="jp-form-grid"><label><span>Full name *</span><input name="full_name" value="${portalText(profile.full_name)}" required></label><label><span>Email address *</span><input name="email" type="email" value="${portalText(profile.email)}" required></label><label><span>Phone number *</span><input name="phone" value="${portalText(profile.phone)}" required></label><label><span>LinkedIn profile</span><input name="linkedin_url" type="url" value="${portalText(profile.linkedin_url || '')}" placeholder="https://linkedin.com/in/your-profile"></label></div></section><section class="jp-profile-section"><header><div><h2>Professional details</h2><p>Help employers understand your experience and expertise.</p></div></header><div class="jp-form-grid"><label><span>Current job title *</span><input name="current_title" value="${portalText(profile.current_title)}" required></label><label><span>Total experience (years) *</span><input name="total_experience" type="number" min="0" max="60" step=".5" value="${profile.total_experience}" required></label><label><span>Current employer</span><input name="current_employer" value="${portalText(profile.current_employer || '')}" placeholder="Company name"></label><label class="wide"><span>Key skills *</span><input name="skills" value="${portalText(portalList(profile.skills).join(', '))}" placeholder="JavaScript, React, SQL" required><small>Separate skills with commas</small></label></div></section><section class="jp-profile-section"><header><div><h2>Location and job preferences</h2><p>Used to show relevant roles in your preferred market.</p></div></header><div class="jp-form-grid"><label><span>Country *</span><select name="country" id="profile-country" required>${Object.entries(countryConfig).map(([code, config]) => `<option value="${code}" ${profile.country===code?'selected':''}>${portalText(config.name)}</option>`).join('')}</select></label><label><span>City / location *</span><input name="city" value="${portalText(profile.city)}" required></label></div><div class="jp-market-fields"><header><div><b id="country-fields-title">${portalText(countryName)} job preferences</b><small>Complete these details for better job recommendations.</small></div><span>Market specific</span></header><div id="profile-country-fields" class="jp-form-grid">${profileCountryFields(profile.country, profile.country_specific_data)}</div></div></section><div class="jp-save-bar"><p><b>Keep your profile current</b><small>Updated information improves recruiter visibility and job recommendations.</small></p><button type="submit">Save profile</button></div></form></main><aside><section class="jp-profile-completion"><div class="jp-completion-ring" style="--completion:${strength*3.6}deg"><span><b>${strength}%</b><small>complete</small></span></div><h3>Profile strength</h3><p>${strength < 80 ? 'Add missing details to stand out to recruiters.' : 'Your profile gives recruiters a strong overview.'}</p><ul><li class="done">✓ Contact details</li><li class="${portalList(profile.skills).length?'done':''}">✓ Skills and experience</li><li class="${profile.linkedin_url?'done':''}">✓ LinkedIn profile</li><li class="${profile.resume_file_id?'done':''}">✓ Resume uploaded</li></ul></section><section class="jp-profile-side"><span>${candidateIcon('file')}</span><div><h3>Resume</h3><p>${profile.resume_file_id ? 'Uploaded and ready for applications.' : 'Upload a resume to complete your profile.'}</p><button data-portal-route="/candidate/resume">${profile.resume_file_id ? 'Manage resume' : 'Upload resume'} →</button></div></section><section class="jp-profile-side"><span>${candidateIcon('clock')}</span><div><h3>Availability</h3><p>Tell recruiters when you can start.</p><button data-portal-route="/candidate/availability">Update availability →</button></div></section></aside></div></div>`, 'My Profile');
    document.querySelectorAll('[data-portal-route]').forEach(button => button.onclick = () => route(button.dataset.portalRoute));
    const country = document.querySelector('#profile-country');
    country.onchange = () => {
      const code = country.value;
      document.querySelector('#profile-country-fields').innerHTML = profileCountryFields(code, code === originalCountry ? profile.country_specific_data : {});
      document.querySelector('#country-fields-title').textContent = `${countryConfig[code]?.name || 'Selected market'} job preferences`;
    };
    document.querySelector('#candidate-profile-form').onsubmit = async event => {
      event.preventDefault();
      const form = event.target;
      const button = form.querySelector('[type=submit]');
      const data = new FormData(form);
      const body = {full_name: data.get('full_name').trim(), email: data.get('email').trim(), phone: data.get('phone').trim(), country: data.get('country'), city: data.get('city').trim(), current_title: data.get('current_title').trim(), total_experience: Number(data.get('total_experience')), skills: data.get('skills').split(',').map(item => item.trim()).filter(Boolean), linkedin_url: data.get('linkedin_url') || null, current_employer: data.get('current_employer') || null, country_specific_data: {}};
      for (const [key, value] of data) if (key.startsWith('extra_')) body.country_specific_data[key.slice(6)] = value;
      button.disabled = true;
      button.textContent = 'Saving…';
      try {
        await api('/candidate/profile', {method: 'PUT', body: JSON.stringify(body)});
        toast('Profile saved successfully');
        await profilePage();
      } catch (error) {
        button.disabled = false;
        button.textContent = 'Save profile';
        toast(error.message, true);
      }
    };
  } catch (error) { toast(error.message, true); }
};

const candidatePortalBaseRender = render;
render = function () {
  if (session?.user.role === 'candidate') {
    if (location.pathname === '/candidate/jobs') return candidateJobsPage();
    if (location.pathname === '/candidate/applications') return candidateApplicationsPage();
  }
  return candidatePortalBaseRender();
};

if (session?.user.role === 'candidate') render();
