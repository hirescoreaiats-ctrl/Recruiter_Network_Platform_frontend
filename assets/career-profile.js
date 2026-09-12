function setupCareerSkillChips(form) {
  const value = form.querySelector('[name="skills"]');
  const skills = [];
  value.value.split(',').map(skill => skill.trim()).filter(Boolean).forEach(skill => {
    if (!skills.some(existing => existing.toLowerCase() === skill.toLowerCase())) skills.push(skill);
  });
  const box = document.createElement('div');
  box.className = 'career-skill-editor';
  const chips = document.createElement('div');
  chips.className = 'career-skill-chips';
  const input = document.createElement('input');
  input.type = 'text';
  input.id = value.id || 'career-skills';
  input.placeholder = 'Type a skill';
  input.setAttribute('aria-label', 'Add a skill');
  input.setAttribute('aria-describedby', 'career-skills-help');
  const add = document.createElement('button');
  add.type = 'button';
  add.className = 'btn btn-secondary';
  add.textContent = '+ Add';
  const help = document.createElement('small');
  help.id = 'career-skills-help';
  help.textContent = 'Press Enter or click Add for each skill. Add at least 3 different skills.';
  value.removeAttribute('id');
  value.required = false;
  value.type = 'hidden';
  value.after(box, help);
  box.append(chips, input, add);
  function render() {
    value.value = skills.join(',');
    chips.replaceChildren();
    skills.forEach((skill, index) => {
      const chip = document.createElement('span');
      chip.className = 'career-skill-chip';
      chip.append(document.createTextNode(skill));
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.textContent = '×';
      remove.setAttribute('aria-label', `Remove ${skill}`);
      remove.onclick = () => { skills.splice(index, 1); input.setCustomValidity(''); render(); input.focus(); };
      chip.append(remove);
      chips.append(chip);
    });
  }
  function commit() {
    input.value.split(',').map(skill => skill.trim()).filter(Boolean).forEach(skill => {
      if (!skills.some(existing => existing.toLowerCase() === skill.toLowerCase())) skills.push(skill);
    });
    input.value = '';
    input.setCustomValidity('');
    render();
  }
  add.onclick = () => { commit(); input.focus(); };
  input.onkeydown = event => {
    if (event.key === 'Enter' && !event.isComposing) { event.preventDefault(); commit(); }
  };
  input.onblur = commit;
  input.oninput = () => input.setCustomValidity('');
  render();
  return {input, commit, count: () => skills.length};
}

/* Only the current step is shown; all controls remain mounted to preserve edits. */
function setupCareerWizard(form, host, initialStep = 0, editSection = null) {
  form.noValidate = true;
  form.classList.add('career-wizard');
  const skillChips = setupCareerSkillChips(form);
  const base = [...form.children].filter(node => node.classList.contains('profile-form-card'));
  const section = key => host.querySelector(`#career-section-${key}`);
  const overview = section('career');
  base[1].append(...overview.querySelectorAll('.profile-form-grid'));
  overview.remove();
  const groups = [
    ['Identity & contact', [base[0]]],
    ['Career & skills', [base[1], section('it_skills')]],
    ['Education', [section('education_history')]],
    ['Employment & projects', [section('work_experiences'), section('projects')]],
    ['Preferences, resume & personal details', [base[2], section('preferences'), section('personal'), section('languages'), section('accomplishments')]]
  ];
  let steps = groups.map(([, cards]) => {
    const group = document.createElement('div');
    group.className = 'career-step'; group.append(...cards); host.append(group); return group;
  });
  if (editSection) {
    const selected = document.createElement('section');
    selected.className = 'profile-form-card';
    const labels = {contact:'Contact & work details', resume:'Resume', identity:'Basic details', headline:'Resume headline', skills:'Key skills', summary:'Profile summary', career:'Career profile', personal:'Personal details', diversity:'Diversity & inclusion'};
    selected.innerHTML = `<header><h2>${labels[editSection] || 'Edit profile'}</h2></header><div class="profile-form-grid"></div>`;
    const grid = selected.querySelector('.profile-form-grid');
    const moveFields = names => names.forEach(name => {
      const control = form.elements[name];
      if (control) grid.append(control.closest('.field'));
    });
    const groups = {employment:'work_experiences', education:'education_history', 'it-skills':'it_skills', projects:'projects', accomplishments:'accomplishments'};
    if (editSection === 'resume') grid.append(document.getElementById('onboarding-resume').closest('.field'));
    else if (groups[editSection]) selected.append(section(groups[editSection]));
    else if (editSection === 'career') {
      selected.append(section('preferences'));
      moveFields(['extra_expected_ctc', 'extra_expected_rate', 'extra_work_mode_preference']);
    } else if (editSection === 'personal') {
      selected.append(section('personal'), section('languages'));
    } else {
      const fields = {identity:['full_name','email','phone','linkedin_url','city','current_title','total_experience','current_employer','extra_current_ctc'], headline:['extra_resume_headline'], skills:['skills'], summary:['extra_profile_summary'], diversity:['extra_disability']};
      moveFields(fields[editSection] || fields.identity);
      if (['identity','contact'].includes(editSection)) grid.append(document.getElementById('career-picture').closest('.field'));
    }
    // Keep other controls mounted for existing handlers, but exclude them from validation and saving.
    steps.forEach(step => { if (!selected.contains(step)) step.hidden = true; });
    host.append(selected);
    selected.dataset.profileEditor = 'true';
    for (const control of form.querySelectorAll('input,select,textarea')) control.disabled = control.disabled || !selected.contains(control);
    steps = [selected];
    initialStep = 0;
    const hero = document.querySelector('.profile-hero');
    hero.querySelector('h1').textContent = 'Edit ' + (labels[editSection] || groups[editSection]?.replaceAll('_', ' ') || 'profile').toLowerCase();
    hero.querySelector('p').textContent = 'Save your changes to return to your profile.';
    document.querySelector('[data-profile-dashboard]').onclick = () => route('/candidate/profile');
  }
  const titles = editSection ? [steps[0].querySelector('h2').textContent] : groups.map(([title]) => title);
  const progress = document.createElement('div');
  progress.className = 'career-progress';
  progress.innerHTML = '<p data-step-status role="status" aria-live="polite"></p><progress aria-label="Profile setup progress"></progress><p data-step-help></p>';
  form.prepend(progress);
  progress.hidden = Boolean(editSection);
  const bar = form.querySelector('.profile-save-bar');
  bar.innerHTML = '<button type="button" class="btn btn-secondary" data-career-back>← Back</button><span class="career-save-note">Your progress is saved after every step.</span><button type="button" class="btn btn-primary" data-career-next>Save & continue →</button><button type="submit" class="btn btn-primary" data-career-save>Complete profile</button>';
  if (editSection) {
    bar.querySelector('.career-save-note').textContent = 'Save changes to return to your profile.';
    bar.querySelector('[data-career-save]').textContent = 'Save changes';
  }
  const back = bar.querySelector('[data-career-back]'), next = bar.querySelector('[data-career-next]'), save = bar.querySelector('[data-career-save]');
  let current = 0;
  function show(index, focus = true) {
    current = index;
    steps.forEach((step, i) => { step.hidden = i !== index; });
    progress.querySelector('[data-step-status]').textContent = `Step ${index + 1} of ${steps.length} · ${titles[index]}`;
    const meter = progress.querySelector('progress'); meter.max = steps.length; meter.value = index + 1;
    progress.querySelector('[data-step-help]').textContent = index === steps.length - 1 ? 'Last step. Add any optional details, then save your profile.' : 'Complete this section, then continue. You can go back to edit your answers.';
    back.disabled = !editSection && index === 0;
    if (editSection) back.textContent = 'Cancel';
    next.hidden = index === steps.length - 1;
    save.hidden = index !== steps.length - 1;
    if (focus) { const heading = steps[index].querySelector('h2'); heading.tabIndex = -1; heading.focus({preventScroll:true}); progress.scrollIntoView({block:'start',behavior:'smooth'}); }
  }
  function validate(index) {
    const step = steps[index];
    const inputs = [...step.querySelectorAll('input,select,textarea')];
    inputs.forEach(input => input.setCustomValidity(''));
    const skills = step.querySelector('[name="skills"]');
    if (skills) {
      skillChips.commit();
      if (skillChips.count() < 3) skillChips.input.setCustomValidity('Add at least 3 different skills.');
    }
    const records = step.querySelector('[data-records="education_history"]');
    if (records && !records.children.length) { show(index); toast('Add at least one education record.',true); return false; }
    if (step.contains(section('work_experiences')) && form.elements.extra_career_stage.value === 'experienced' && !form.elements.current_employer.value.trim() && !section('work_experiences').querySelector('.career-record')) { show(index); toast('Add your employment experience.',true); return false; }
    for (const row of step.querySelectorAll('.career-record')) {
      for (const [start, end] of [['start_date','end_date'],['start_year','end_year']]) {
        const from = row.querySelector(`[name$="_${start}"]`), to = row.querySelector(`[name$="_${end}"]`);
        if (from?.value && to?.value && (start === 'start_year' ? Number(to.value) < Number(from.value) : to.value < from.value)) to.setCustomValidity('End date must be after the start date.');
      }
    }
    const invalid = inputs.find(input => !input.checkValidity());
    if (invalid) { show(index); invalid.reportValidity(); return false; }
    return true;
  }
  let onAdvance = async () => true;
  const advance = async () => {
    if (!validate(current) || current >= steps.length - 1) return;
    next.disabled = true; next.textContent = 'Saving…';
    try { if (await onAdvance(current + 1)) show(current + 1); }
    finally { next.disabled = false; next.textContent = 'Save & continue →'; }
  };
  back.onclick = () => editSection ? route('/candidate/profile') : show(current - 1);
  next.onclick = advance;
  form.addEventListener('input', event => event.target.setCustomValidity?.(''));
  show(Math.min(Math.max(initialStep, 0), steps.length - 1), false);
  return {next:advance, current:()=>current, setOnAdvance:callback=>{onAdvance=callback;}, isLast:()=>current === steps.length - 1, validateAll:()=>steps.every((_,index)=>validate(index))};
}

/* Structured career evidence, saved with the existing candidate profile. */
const careerBaseProfilePage = candidatePortalBaseProfile;
function renderCandidateProfileOverview(profile) {
  const saved = profile.country_specific_data || {}, esc = candidateEscape;
  const work = Array.isArray(saved.work_experiences) ? saved.work_experiences : [];
  const education = Array.isArray(saved.education_history) ? saved.education_history : [];
  const itSkills = Array.isArray(saved.it_skills) ? saved.it_skills : [];
  const projects = Array.isArray(saved.projects) ? saved.projects : [];
  const accomplishments = Array.isArray(saved.accomplishments) ? saved.accomplishments : [];
  const languages = Array.isArray(saved.languages) ? saved.languages : [];
  const checks = [profile.full_name, profile.phone, profile.email, profile.city, profile.current_title, profile.resume_file_id,
    saved.resume_headline, profile.skills.length >= 3, work.length || saved.career_stage === 'fresher', education.length,
    saved.profile_summary, saved.preferred_locations?.length, saved.gender, saved.date_of_birth];
  const completion = Math.round(checks.filter(Boolean).length / checks.length * 100);
  const initials = profile.full_name.split(/\s+/).map(word=>word[0]).slice(0,2).join('').toUpperCase();
  const updated = new Date(profile.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'});
  const salary = value => value && Number.isFinite(Number(value)) ? Number(value).toLocaleString('en-IN') : value;
  const add = label => `<button class="candidate-profile-add" data-profile-edit>＋ ${label}</button>`;
  const edit = '<button class="candidate-profile-edit" data-profile-edit aria-label="Edit profile">✎</button>';
  const recordDetails = item => `<div class="candidate-profile-details">${Object.entries(item).filter(([key,value]) => value !== '' && value != null && key !== 'is_current').map(([key,value]) => `<div><small>${esc(key.replaceAll('_',' '))}</small><b>${esc(Array.isArray(value) ? value.join(', ') : value)}</b></div>`).join('')}</div>`;
  const listCards = (items, renderer, emptyLabel) => items.length ? items.map(item => `<article class="candidate-profile-record">${recordDetails(item)}</article>`).join('') : add(emptyLabel);
  const sections = [
    ['contact','Contact & work details',`<div class="candidate-profile-details">${[['Name',profile.full_name],['Email',profile.email],['Phone',profile.phone],['Location',profile.city],['Country',countryConfig[profile.country]?.name||profile.country],['Job title',profile.current_title],['Current employer',profile.current_employer],['Experience (years)',profile.total_experience],['LinkedIn',profile.linkedin_url],['Career stage',saved.career_stage],['Highest qualification',saved.highest_qualification]].map(([label,value])=>`<div><small>${esc(label)}</small><b>${esc(value ?? 'Not added')}</b></div>`).join('')}</div>`],
    ['resume','Resume',profile.resume_file?`<div class="candidate-resume-row"><span>▤</span><div><b>${esc(profile.resume_file.original_name)}</b><small>Uploaded on ${new Date(profile.resume_file.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</small></div><button data-resume="${profile.resume_file.id}">Download</button></div>`:add('Upload resume')],
    ['headline','Resume headline',saved.resume_headline?`<p>${esc(saved.resume_headline)}</p>`:add('Add resume headline')],
    ['skills','Key skills',profile.skills.length?`<div class="candidate-profile-chips">${profile.skills.map(skill=>`<span>${esc(skill)}</span>`).join('')}</div>`:add('Add key skills')],
    ['employment','Employment',listCards(work,item=>`<article class="candidate-profile-record"><b>${esc(item.job_title||'Job title')}</b><strong>${esc(item.company_name||'Company')}</strong><small>${esc(item.employment_type||'')} · ${esc(item.start_date||'')} to ${item.is_current?'Present':esc(item.end_date||'')}</small></article>`,'Add employment')],
    ['education','Education',listCards(education,item=>`<article class="candidate-profile-record"><b>${esc(item.course||item.qualification||'Qualification')} <span>${esc(item.specialization||'')}</span></b><strong>${esc(item.institution_name||'Institute')}</strong><small>${esc(item.start_year||'')} – ${esc(item.end_year||'')} · ${esc(item.course_type||'')}</small></article>`,'Add education')],
    ['it-skills','IT skills',itSkills.length?listCards(itSkills,null,'Add IT skills'):'<p class="candidate-profile-empty">Show your technical expertise by mentioning software and skills you know.</p>'+add('Add details')],
    ['projects','Projects',projects.length?listCards(projects,item=>`<article class="candidate-profile-record"><b>${esc(item.title)}</b><small>${esc(item.description||'')}</small></article>`,'Add project'):'<p class="candidate-profile-empty">Stand out by adding projects you have completed.</p>'+add('Add project')],
    ['summary','Profile summary',(saved.profile_summary || saved.professional_summary)?`<p>${esc(saved.profile_summary || saved.professional_summary)}</p>`:'<p class="candidate-profile-empty">Highlight your key career achievements and potential.</p>'+add('Add profile summary')],
    ['accomplishments','Accomplishments',accomplishments.length?listCards(accomplishments,item=>`<article class="candidate-profile-record"><b>${esc(item.title)}</b><small>${esc(item.type||'')}</small></article>`,'Add accomplishment'):`<div class="candidate-accomplishment-grid">${['Online profile','Work sample','Research publication','Presentation','Patent','Certification'].map(label=>`<button data-profile-edit><span>＋</span><b>${label}</b><small>Add relevant details</small></button>`).join('')}</div>`],
    ['career','Career profile',`<div class="candidate-profile-details">${[['Current industry',saved.industry],['Department',saved.department],['Role category',saved.role_category],['Job role',saved.desired_role],['Availability',saved.availability],['Notice period',saved.notice_period],['Current salary',saved.current_ctc],['Work mode',saved.work_mode_preference || saved.work_mode],['Preferred location',saved.preferred_location],['Opportunity status',saved.opportunity_status],['Available from',saved.available_from],['Expected rate',saved.expected_rate],['Rate type',saved.rate_type],['State',saved.state],['Target roles',saved.target_roles],['Preferred industries',saved.preferred_industries],['Work authorization',saved.work_authorization],['Preferred shift',saved.preferred_shift],['Relocation',saved.willing_to_relocate],['Salary currency',saved.salary_currency],['Desired job type',saved.job_type],['Desired employment type',saved.employment_type],['Preferred work location',(saved.preferred_locations||[]).join(', ')],['Preferred annual salary',saved.expected_ctc?`₹${salary(saved.expected_ctc)}`:'']].map(([label,value])=>`<div><small>${label}</small><b>${esc(value||'Add '+label.toLowerCase())}</b></div>`).join('')}</div>`],
    ['personal','Personal details',`<div class="candidate-profile-details">${[['Gender',saved.gender],['Date of birth',saved.date_of_birth],['Marital status',saved.marital_status],['Work permit',saved.work_permit],['Address',saved.address],['Languages',languages.map(item=>[item.language,item.proficiency,item.abilities].filter(Boolean).join(' · ')).join(', ')],['Postal code',saved.postal_code],['Career break',saved.career_break],['Portfolio',saved.portfolio_url]].map(([label,value])=>`<div><small>${label}</small><b>${esc(value||'Add '+label.toLowerCase())}</b></div>`).join('')}</div>`],
    ['diversity','Diversity & inclusion',saved.disability ? `<p>Disability status: ${esc(saved.disability)}</p>` : add('Add disability status')]
  ];
  layout(`<div class="candidate-profile-overview"><section class="candidate-profile-hero"><div class="candidate-profile-avatar">${initials}</div><div><span class="candidate-profile-completion">${completion}%</span><h1>${esc(profile.full_name)} ${edit}</h1><small>Profile last updated · ${updated}</small><div class="candidate-profile-meta"><span>⌖ ${esc(profile.city||'Add location')}, ${esc(countryConfig[profile.country]?.name || profile.country)}</span><span>◷ ${profile.total_experience?`${Math.floor(profile.total_experience)} Years ${Math.round(profile.total_experience%1*12)} Months`:'Add experience'}</span><span>₹ ${saved.current_ctc?salary(saved.current_ctc):'Add salary'}</span><span>☎ ${esc(profile.phone)}</span><span>✉ ${esc(profile.email)}</span></div></div><button class="btn btn-primary" data-profile-edit>Edit profile</button></section><div class="candidate-profile-columns"><aside><section class="candidate-quick-links"><h2>Quick links</h2>${sections.map(([id,title])=>`<a href="#profile-${id}">${title}</a>`).join('')}</section></aside><main>${sections.map(([id,title,body])=>`<section id="profile-${id}" class="candidate-profile-section"><header><h2>${title}</h2>${edit}</header>${body}</section>`).join('')}</main></div></div>`,'My Profile');
  document.querySelectorAll('[data-profile-edit]').forEach(button=>button.onclick=()=>{
    const section = button.closest('.candidate-profile-section')?.id.replace('profile-', '') || '';
    route('/candidate/profile/edit#' + (section || 'identity'));
  });
  wireDownloads();
}
profilePage = async function() {
  if (session?.user.role === 'candidate' && location.pathname === '/candidate/profile') {
    try {
      const overviewProfile = await api('/candidate/profile');
      return renderCandidateProfileOverview(overviewProfile);
    } catch (error) { toast(error.message,true); return; }
  }
  const editing = location.pathname === '/candidate/profile/edit';
  await careerBaseProfilePage();
  if (session?.user.role !== 'candidate') return;
  const form = document.querySelector('#candidate-profile-form');
  if (!form) return;
  try {
    const profile = await api('/candidate/profile');
    const stored = profile.country_specific_data || {};
    const draftKey = `candidate_onboarding_draft_${profile.user_id}`;
    let localDraft = {};
    try { localDraft = JSON.parse(localStorage.getItem(draftKey) || '{}'); } catch (_) { localStorage.removeItem(draftKey); }
    const serverStep = Number(stored.onboarding_step) || 0;
    const draft = editing ? {} : (Number(localDraft.step) >= serverStep ? localDraft : (stored._onboarding_draft || localDraft));
    const saved = {...stored, ...(draft.country_specific_data || {})};
    const matchingStatus = await api('/candidate/matching-status');
    const esc = candidateEscape;
    for (const [key, value] of Object.entries(draft.profile || {})) {
      const control = form.elements.namedItem(key);
      if (control && typeof value !== 'object') control.value = value ?? '';
    }
    for (const key of ['city', 'current_title']) if (form.elements[key]?.value === 'Profile setup pending') form.elements[key].value = '';
    if (form.elements.skills?.value === 'Profile setup pending') form.elements.skills.value = '';
    const field = ([key, label, type = 'text', required = false], value = '', prefix = 'extra_') => {
      const id = `career-${prefix}${key}`;
      const attrs = `id="${esc(id)}" name="${esc(prefix + key)}" ${required ? 'required' : ''}`;
      const control = Array.isArray(type) ? `<select ${attrs}><option value="">Select ${esc(label.toLowerCase())}</option>${[...new Set([...type, ...(value && !type.includes(value) ? [value] : [])])].map(x => `<option ${x === value ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select>` : type === 'textarea' ? `<textarea ${attrs} rows="3" maxlength="4000">${esc(value)}</textarea>` : `<input ${attrs} type="${type}" value="${esc(value)}" ${type === 'number' ? 'min="0" max="2100"' : ''} ${type === 'text' ? 'maxlength="500"' : ''}>`;
      return `<div class="field"><label for="${esc(id)}">${esc(label)}${required ? ' *' : ''}</label>${control}</div>`;
    };
    const sections = [
      ['career', 'Career overview', [['career_stage','Career stage',['fresher','experienced'],true],['highest_qualification','Highest qualification',['Doctorate / PhD','Post graduation','Graduation','Diploma','12th','10th','Below 10th'],true],['resume_headline','Resume headline'],['profile_summary','Profile summary','textarea']]],
      ['preferences','Desired career profile', [['industry','Industry',['IT Services & Consulting','Software Product','Banking','Financial Services','Healthcare','Education','Manufacturing','Retail','Telecom','Other']],['department','Department'],['role_category','Role category'],['desired_role','Desired job role'],['job_type','Job type',['Permanent','Contractual','Both']],['employment_type','Employment type',['Full time','Part time','Internship','Freelance']],['preferred_shift','Preferred shift',['Day','Night','Flexible']],['preferred_locations','Preferred locations (comma separated)'],['salary_currency','Salary currency',['INR','USD','GBP','EUR','AED','CAD','AUD']],['willing_to_relocate','Willing to relocate',['Yes','No','Depends on opportunity']]]],
      ['personal','Personal details (optional)', [['date_of_birth','Date of birth','date'],['gender','Gender',['Female','Male','Non-binary','Prefer to self-describe','Prefer not to say']],['marital_status','Marital status',['Single','Married','Other','Prefer not to say']],['address','Address','textarea'],['postal_code','Postal code'],['disability','Disability',['Yes','No','Prefer not to say']],['career_break','Career break details','textarea'],['work_permit','Work permit countries'],['portfolio_url','Portfolio website','url']]]
    ];
    const collections = [
      ['education_history','Education', [['qualification','Qualification','text',true],['institution_name','University / institute / school','text',true],['course','Course','text',true],['specialization','Specialization / stream','text',true],['course_type','Course type',['Full time','Part time','Correspondence / Distance']],['start_year','Starting year','number'],['end_year','Completion year','number',true],['grading_system','Grading system',['Percentage','CGPA out of 10','GPA out of 4','Pass / fail']],['grade','Marks / grade']]],
      ['work_experiences','Employment & internships', [['company_name','Company','text',true],['job_title','Job title','text',true],['employment_type','Employment type',['Full time','Part time','Internship','Contract','Freelance']],['start_date','Joining date','date',true],['end_date','Leaving date (blank for current job)','date'],['description','Job responsibilities','textarea'],['skills_used','Skills used']]],
      ['it_skills','IT skills', [['name','Skill / software','text',true],['version','Version'],['last_used','Last used year','number'],['experience_years','Experience in years','number']]],
      ['projects','Projects', [['title','Project title','text',true],['client','Client'],['status','Status',['In progress','Completed']],['start_date','Start date','date'],['end_date','End date','date'],['role','Your role'],['description','Project details','textarea'],['skills','Skills used'],['url','Project URL','url']]],
      ['accomplishments','Accomplishments', [['type','Type',['Certification','Online profile','Work sample','Publication / research paper','Presentation','Patent','Award'],true],['title','Title','text',true],['organization','Issuing organization'],['url','URL','url'],['issue_date','Issue date','date'],['expiry_date','Expiry date (optional)','date'],['description','Description','textarea']]],
      ['languages','Languages', [['language','Language','text',true],['proficiency','Proficiency',['Beginner','Proficient','Expert','Native']],['abilities','Can',['Read','Write','Speak','Read and write','Read and speak','Write and speak','Read, write and speak']]]]
    ];
    const block = (id, title, body) => `<section id="career-section-${id}" class="profile-form-card career-section"><header><div><h2>${title}</h2></div></header>${body}</section>`;
    const host = document.createElement('div');
    host.className = 'career-sections';
    host.innerHTML = sections.map(([id,title,fields]) => block(id,title,`<div class="profile-form-grid">${fields.map(f=>field(f,saved[f[0]] ?? (f[0] === 'profile_summary' ? saved.professional_summary || '' : ''))).join('')}</div>`)).join('') + collections.map(([id,title])=>block(id,title,`<div data-records="${id}"></div><button type="button" class="btn btn-secondary" data-add="${id}">+ Add ${title.toLowerCase()}</button>`)).join('');
    form.querySelector('.profile-save-bar').before(host);
    let serial = 0;
    const addRecord = (key, fields, record = {}) => {
      const row = document.createElement('fieldset');
      row.className = 'career-record';
      row.innerHTML = `<legend>${esc(collections.find(x=>x[0]===key)[1])} entry</legend><div class="profile-form-grid">${fields.map(f=>field(f,record[f[0]] ?? '',`record_${serial}_`)).join('')}</div><button type="button" class="btn btn-secondary career-remove">Remove entry</button>`;
      serial++;
      row.querySelector('.career-remove').onclick = () => row.remove();
      row.dataset.original = JSON.stringify(record);
      host.querySelector(`[data-records="${key}"]`).append(row);
    };
    collections.forEach(([key,,fields]) => {
      const records = Array.isArray(saved[key]) ? saved[key] : [];
      records.forEach(record=>addRecord(key,fields,record));
      if (key === 'education_history' && !records.length) addRecord(key,fields,{qualification:saved.highest_qualification, specialization:saved.education_specialization,end_year:saved.graduation_year});
      host.querySelector(`[data-add="${key}"]`).onclick = () => addRecord(key,fields);
    });
    const resumeField = document.createElement('div');
    resumeField.className = 'field';
    resumeField.innerHTML = `<label for="onboarding-resume">Resume (optional)</label><input id="onboarding-resume" type="file" accept=".pdf,.doc,.docx"><small>${esc(profile.resume_file?.original_name || 'Upload a resume to help recruiters review your profile.')} · PDF, DOC or DOCX, up to 5 MB</small>`;
    host.querySelector('#career-section-personal .profile-form-grid').append(resumeField);
    const pictureField = document.createElement('div'); pictureField.className = 'field';
    pictureField.innerHTML = '<label for="career-picture">Profile photo (optional)</label><input id="career-picture" type="file" accept="image/jpeg,image/png,image/webp"><small>JPG, PNG or WebP, up to 2 MB.</small>';
    form.querySelector('.profile-form-grid').append(pictureField);
    const availabilityField = document.createElement('div'); availabilityField.className = 'profile-form-grid';
    availabilityField.innerHTML = field(['opportunity_status','Opportunity status',['actively_looking','open_to_right_opportunity','not_looking']],matchingStatus.availability?.status || 'open_to_right_opportunity') + field(['available_from','Available from','date'],matchingStatus.availability?.available_from || '');
    host.querySelector('#career-section-personal').append(availabilityField);
    const stage = form.elements.extra_career_stage;
    if (!stage.value) stage.value = profile.total_experience > 0 ? 'experienced' : 'fresher';
    const updateStage = () => { form.elements.current_title.previousElementSibling.textContent = stage.value === 'fresher' ? 'Target job title *' : 'Current job title *'; const employer = form.elements.current_employer; employer.disabled = stage.value === 'fresher'; employer.closest('.field').hidden = employer.disabled; const input = form.elements.total_experience; input.readOnly = stage.value === 'fresher'; if (input.readOnly) input.value = '0'; };
    stage.onchange = updateStage; updateStage();
    const requestedSection = location.hash.replace('#', '') || 'identity';
    const resumeStep = Math.max(serverStep, Number(localDraft.step) || 0);
    const wizard = setupCareerWizard(form, host, Number.isInteger(resumeStep) ? resumeStep - 1 : 0, editing ? requestedSection : null);
    if (editing) {
      const editor = host.querySelector('[data-profile-editor]');
      for (const records of editor.querySelectorAll('[data-records]')) {
        if (!records.children.length && requestedSection !== 'personal') host.querySelector(`[data-add="${records.dataset.records}"]`).click();
      }
    }
    const builder = form.closest('.profile-builder');
    builder.classList.add('candidate-onboarding-builder');
    if (!editing) builder.querySelector('.profile-hero h1').textContent = 'Let’s build your profile';
    builder.querySelector('.profile-hero p').textContent = editing ? 'Save your changes to return to your profile.' : 'Complete these five guided steps. Your progress is saved automatically, so you can continue after your next login.';
    if (!editing) {
      const page = document.createElement('div'); page.className = 'candidate-register-page';
      page.innerHTML = '<header class="candidate-register-header"><a class="candidate-register-brand"><span>H</span>HireScoreAI</a><p>Candidate profile setup</p></header>';
      page.append(builder); app.replaceChildren(page);
    }
    const cancel = document.createElement('button'); cancel.type = 'button'; cancel.className = 'btn btn-secondary';
    cancel.textContent = editing ? 'Back to profile' : 'Sign out';
    cancel.onclick = () => { if (editing) route('/candidate/profile'); else { localStorage.removeItem('tb_session'); session = null; route('/auth/login'); } };
    builder.querySelector('.profile-hero').append(cancel);
    const collectDraft = () => {
      const values = new FormData(form), countryData = {...saved};
      delete countryData._onboarding_draft;
      for (const [key, value] of values) if (key.startsWith('extra_')) countryData[key.slice(6)] = String(value).trim();
      for (const [key,,fields] of collections) {
        countryData[key] = [...host.querySelector(`[data-records="${key}"]`).children].map(row => {
          const record = JSON.parse(row.dataset.original);
          fields.forEach(([name], index) => { record[name] = row.querySelectorAll('input,select,textarea')[index].value.trim(); });
          if (key === 'work_experiences') record.is_current = !record.end_date;
          return record;
        });
      }
      const profileData = {};
      ['full_name','email','phone','country','city','current_title','total_experience','skills','linkedin_url','current_employer'].forEach(key => {
        const value = values.get(key); if (value !== null) profileData[key] = String(value).trim();
      });
      return {profile:profileData, country_specific_data:countryData};
    };
    let serverDraftAvailable = true;
    const saveDraft = async destinationIndex => {
      if (editing) return true;
      const payload = {step:destinationIndex + 1, ...collectDraft()};
      localStorage.setItem(draftKey, JSON.stringify(payload));
      if (!serverDraftAvailable) return true;
      try {
        await api('/candidate/onboarding/draft', {method:'PUT', body:JSON.stringify(payload)});
        return true;
      } catch (error) {
        if (['Method Not Allowed', 'Not Found', 'Verify your mobile number before saving profile setup'].includes(error.message)) serverDraftAvailable = false;
        toast('Progress saved on this device. Server sync will resume when available.');
        return true;
      }
    };
    wizard.setOnAdvance(saveDraft);
    let autosaveTimer;
    const queueAutosave = () => {
      if (editing) return;
      clearTimeout(autosaveTimer);
      autosaveTimer = setTimeout(() => saveDraft(wizard.current()), 900);
    };
    form.addEventListener('input', queueAutosave);
    form.addEventListener('change', queueAutosave);
    form.onsubmit = async event => {
      event.preventDefault();
      if (!wizard.isLast()) { wizard.next(); return; }
      if (!wizard.validateAll()) return;
      const button = form.querySelector('[data-career-save]');
      if (button.disabled) return;
      const f = new FormData(form), data = {...saved};
      for (const [key,value] of f) if (key.startsWith('extra_')) data[key.slice(6)] = value.trim();
      for (const [key,,fields] of collections) {
        if (editing && !host.querySelector('[data-profile-editor]').contains(host.querySelector(`[data-records="${key}"]`))) continue;
        data[key] = [...host.querySelector(`[data-records="${key}"]`).children].map(row => {
          const record = JSON.parse(row.dataset.original);
          fields.forEach(([name],index)=>{record[name]=row.querySelectorAll('input,select,textarea')[index].value.trim();});
          if (key === 'work_experiences') record.is_current = !record.end_date;
          return record;
        });
        for (const record of data[key]) {
          if (record.start_date && record.end_date && record.end_date < record.start_date || record.start_year && record.end_year && Number(record.end_year) < Number(record.start_year)) { toast('End date must be after the start date.',true); return; }
        }
      }
      if (!editing && !data.education_history.length) { toast('Add at least one education record.',true); return; }
      if (f.has('extra_preferred_locations')) data.preferred_locations = String(f.get('extra_preferred_locations')).split(',').map(value => value.trim()).filter(Boolean);
      if ((!editing || requestedSection === 'education') && data.education_history?.length) {
        data.education_specialization = data.education_history[0].specialization;
        data.graduation_year = data.education_history[0].end_year;
      }
      delete data._onboarding_draft;
      data.onboarding_step = 'complete';
      const body = {country_specific_data:data};
      ['full_name','email','phone','country','city','current_title','linkedin_url','current_employer'].forEach(key=>body[key]=f.has(key) ? String(f.get(key)||'').trim() : profile[key]);
      body.total_experience = f.has('total_experience') ? Number(f.get('total_experience')) : profile.total_experience;
      body.skills = f.has('skills') ? [...new Set(String(f.get('skills')).split(',').map(x=>x.trim()).filter(Boolean))] : profile.skills;
      if (editing) {
        // Send only enabled fields from this section. The API merges them with saved data.
        const changedDetails = {};
        for (const [key] of f) if (key.startsWith('extra_')) changedDetails[key.slice(6)] = data[key.slice(6)];
        for (const [key] of collections) {
          if (host.querySelector('[data-profile-editor]').contains(host.querySelector(`[data-records="${key}"]`))) changedDetails[key] = data[key];
        }
        if (requestedSection === 'education') {
          changedDetails.education_specialization = data.education_specialization;
          changedDetails.graduation_year = data.graduation_year;
        }
        body.country_specific_data = changedDetails;
        for (const key of Object.keys(body)) if (key !== 'country_specific_data' && !f.has(key)) delete body[key];
      }
      button.disabled = true;
      const original = button.textContent; button.textContent = 'Saving profile…';
      try {
        const picture = pictureField.querySelector('input').files[0];
        if (picture) {
          if (!['image/jpeg','image/png','image/webp'].includes(picture.type) || picture.size > 2 * 1024 * 1024 || !picture.size) throw new Error('Choose a JPG, PNG or WebP photo up to 2 MB.');
          const upload = new FormData(); upload.append('file', picture);
          await api('/candidate/profile-picture', {method:'POST',body:upload});
        }
        if (!editing || f.has('extra_opportunity_status')) await api(`/candidates/${profile.id}/availability`, {method:'PUT',body:JSON.stringify({status:data.opportunity_status,available_from:data.available_from || null})});
        const resume = resumeField.querySelector('input').files[0];
        if (resume) {
          if (resume.size > 5 * 1024 * 1024) throw new Error('Resume must be 5 MB or smaller.');
          const upload = new FormData(); upload.append('file', resume);
          await api(`/candidates/${profile.id}/resume`, {method:'POST',body:upload});
        }
        await api('/candidate/profile',{method:editing ? 'PATCH' : 'PUT',body:JSON.stringify(body)}); localStorage.removeItem(draftKey); toast('Career profile saved'); route('/candidate/profile'); }
      catch(error) { toast(error.message,true); }
      finally {button.disabled=false;button.textContent=original;}
    };
  } catch(error) { toast(error.message,true); }
};

const careerProfileRender = render;
render = async function() {
  if (session?.user?.role === 'candidate') {
    const path = location.pathname;
    if (path.startsWith('/candidate/onboarding')) return profilePage();
    if (path === '/candidate/profile/edit') return profilePage();
    if (path.startsWith('/candidate') || path.startsWith('/auth')) {
      try {
        const profile = await api('/candidate/profile');
        if (path !== location.pathname) return;
        const saved = profile.country_specific_data || {};
        if (saved.onboarding_step !== 'complete' && !saved._profile_completed) return route('/candidate/onboarding');
      } catch (error) { toast(error.message, true); return; }
    }
  }
  return careerProfileRender();
};
window.onpopstate = () => render();
