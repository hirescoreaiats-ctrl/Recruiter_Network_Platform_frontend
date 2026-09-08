/* Five-step candidate profile builder. Uses only the existing profile, resume and availability APIs. */
const candidateWizardBaseProfile = profilePage;

profilePage = async function () {
  if (session.user.role !== 'candidate') return candidateWizardBaseProfile();
  try {
    const [profile, matchingStatus] = await Promise.all([api('/candidate/profile'), api('/candidate/matching-status')]);
    const details = profile.country_specific_data || {};
    const availability = matchingStatus.availability || {};
    const originalCountry = profile.country;
    const maxBytes = profile.max_resume_bytes || 5 * 1024 * 1024;
    const resumeName = profile.resume_file?.original_name || 'Current resume';
    const value = key => portalText(details[key] || '');
    const availabilityOptions = [
      ['actively_looking', 'Actively looking', 'Consider me for relevant opportunities now'],
      ['open_to_right_opportunity', 'Open to the right role', 'Only surface strong, high-quality matches'],
      ['not_looking', 'Not looking right now', 'Pause new opportunity matching']
    ];
    const steps = [
      ['Identity', 'Contact and professional links'],
      ['Career', 'Experience, skills and education'],
      ['Preferences', 'Location and market expectations'],
      ['Resume', 'Your latest career document'],
      ['Review', 'Availability and final confirmation']
    ];

    layout(`<div class="candidate-job-portal cpw-page">
      <header class="cpw-header"><div><span>AI TALENT PROFILE</span><h1>Build your complete candidate profile</h1><p>Five focused steps give HireScoreAI the structured evidence it needs to identify strong recruiter matches.</p></div><div class="cpw-progress-copy"><b id="cpw-progress-value">20%</b><small>Profile setup progress</small></div></header>
      <nav class="cpw-steps" aria-label="Profile creation progress">${steps.map(([title, copy], index) => `<button type="button" data-wizard-step="${index + 1}" class="${index === 0 ? 'active' : ''}"><span>${index + 1}</span><div><b>${title}</b><small>${copy}</small></div></button>`).join('')}</nav>
      <div class="cpw-layout"><main><form id="candidate-profile-wizard" novalidate>
        <section class="cpw-panel active" data-step-panel="1"><header><span>01</span><div><h2>Identity & contact</h2><p>Information recruiters use to identify you and communicate securely.</p></div></header><div class="cpw-fields">
          <label><span>Full name *</span><input name="full_name" autocomplete="name" value="${portalText(profile.full_name)}" required></label>
          <label><span>Profile email *</span><input name="email" type="email" autocomplete="email" value="${portalText(profile.email)}" required></label>
          <label><span>Phone number *</span><input name="phone" type="tel" autocomplete="tel" value="${portalText(profile.phone)}" required></label>
          <label><span>LinkedIn profile</span><input name="linkedin_url" type="url" value="${portalText(profile.linkedin_url || '')}" placeholder="https://linkedin.com/in/your-profile"></label>
        </div><div class="cpw-tip">${candidateIcon('lock')}<p><b>Protected contact details</b><small>Your contact information stays connected to your authenticated candidate profile.</small></p></div></section>

        <section class="cpw-panel" data-step-panel="2" hidden><header><span>02</span><div><h2>Career evidence</h2><p>Give the matching engine enough context to understand your professional depth.</p></div></header><div class="cpw-fields">
          <label><span>Current job title *</span><input name="current_title" value="${portalText(profile.current_title)}" required placeholder="e.g. Data Analyst"></label>
          <label><span>Total experience (years) *</span><input name="total_experience" type="number" min="0" max="60" step=".5" value="${profile.total_experience}" required></label>
          <label><span>Current employer</span><input name="current_employer" value="${portalText(profile.current_employer || '')}" placeholder="Company name"></label>
          <label><span>Highest qualification</span><select name="extra_highest_qualification"><option value="">Select qualification</option>${['High School','Diploma','Bachelor’s degree','Master’s degree','Doctorate','Professional certification'].map(item => `<option ${details.highest_qualification === item ? 'selected' : ''}>${item}</option>`).join('')}</select></label>
          <label class="wide"><span>Key skills *</span><input name="skills" value="${portalText(portalList(profile.skills).join(', '))}" required placeholder="SQL, Power BI, Python, Excel"><small>Separate skills with commas and list your strongest skills first.</small></label>
          <label><span>Education specialization</span><input name="extra_education_specialization" value="${value('education_specialization')}" placeholder="Computer Science, Finance, Marketing"></label>
          <label><span>Graduation year</span><input name="extra_graduation_year" type="number" min="1950" max="2100" value="${value('graduation_year')}" placeholder="2022"></label>
          <label class="wide"><span>Professional summary</span><textarea name="extra_professional_summary" maxlength="1200" placeholder="Summarize your expertise, key achievements and the problems you solve.">${value('professional_summary')}</textarea><small>Use 3–5 clear sentences. Specific tools, industries and outcomes improve matching.</small></label>
        </div></section>

        <section class="cpw-panel" data-step-panel="3" hidden><header><span>03</span><div><h2>Location & career preferences</h2><p>Country-aware expectations help AI exclude irrelevant requirements.</p></div></header><div class="cpw-fields">
          <label><span>Country / market *</span><select name="country" id="wizard-country" required>${Object.entries(countryConfig).map(([code, config]) => `<option value="${code}" ${profile.country === code ? 'selected' : ''}>${portalText(config.name)}</option>`).join('')}</select></label>
          <label><span>Current city / location *</span><input name="city" value="${portalText(profile.city)}" required placeholder="City"></label>
          <label class="wide"><span>Target roles</span><input name="extra_target_roles" value="${value('target_roles')}" placeholder="Senior Data Analyst, BI Analyst, Analytics Consultant"><small>Separate multiple target roles with commas.</small></label>
          <label><span>Preferred industries</span><input name="extra_preferred_industries" value="${value('preferred_industries')}" placeholder="FinTech, SaaS, Healthcare"></label>
          <label><span>Employment preference</span><select name="extra_employment_type_preference"><option value="">No preference</option>${['Full-Time','Contract','Contract-to-Hire','Part-Time'].map(item => `<option ${details.employment_type_preference === item ? 'selected' : ''}>${item}</option>`).join('')}</select></label>
        </div><div class="cpw-market"><header><div><b id="wizard-market-title">${portalText(countryConfig[profile.country]?.name || profile.country)} hiring details</b><small>Salary, notice, authorization and work-mode fields adapt to your market.</small></div><span>COUNTRY AWARE</span></header><div id="wizard-country-fields" class="cpw-fields">${profileCountryFields(profile.country, details)}</div></div></section>

        <section class="cpw-panel" data-step-panel="4" hidden><header><span>04</span><div><h2>Resume</h2><p>Upload the current document that supports your profile evidence.</p></div></header><div class="cpw-resume-current ${profile.resume_file_id ? 'ready' : ''}"><span>${candidateIcon('file')}</span><div><small>${profile.resume_file_id ? 'CURRENT RESUME' : 'NO RESUME UPLOADED'}</small><b>${profile.resume_file_id ? portalText(resumeName) : 'Add your resume to activate full matching'}</b><p>PDF, DOC or DOCX · Maximum ${candidateFileSize(maxBytes)}</p></div>${profile.resume_file_id ? `<button type="button" data-resume="${profile.resume_file_id}">Download</button>` : ''}</div><label class="cpw-upload"><input id="wizard-resume" name="resume" type="file" accept=".pdf,.doc,.docx"><span>${candidateIcon('upload')}</span><b>${profile.resume_file_id ? 'Upload a newer resume' : 'Choose your resume'}</b><p>Drag and drop or click to browse</p><small id="wizard-file-name">No new file selected</small></label><p class="cpw-file-error" id="wizard-file-error" role="alert"></p></section>

        <section class="cpw-panel" data-step-panel="5" hidden><header><span>05</span><div><h2>Availability & review</h2><p>Confirm when matching should run, then review your complete profile.</p></div></header><div class="cpw-availability"><h3>Your opportunity status *</h3>${availabilityOptions.map(([status, title, copy]) => `<label><input type="radio" name="availability_status" value="${status}" ${availability.status === status || (!availability.status && status === 'open_to_right_opportunity') ? 'checked' : ''} required><span><b>${title}</b><small>${copy}</small></span><i>✓</i></label>`).join('')}<label class="cpw-date"><span>Available from <small>Optional</small></span><input name="available_from" type="date" value="${portalText(availability.available_from || '')}"></label></div><div class="cpw-review"><h3>Profile review</h3><div id="wizard-review"></div><p>${candidateIcon('spark')} Saving refreshes your AI matching signals immediately. This does not submit a job application.</p></div></section>

        <footer class="cpw-actions"><button type="button" class="cpw-back" id="wizard-back" hidden>← Back</button><div><small id="wizard-step-copy">Step 1 of 5</small><button type="button" class="cpw-next" id="wizard-next">Continue →</button><button type="submit" class="cpw-submit" id="wizard-submit" hidden>Save complete profile</button></div></footer>
      </form></main><aside class="cpw-aside"><section><span>${candidateIcon('spark')}</span><h3>Why these details matter</h3><p>HireScoreAI matches structured evidence instead of guessing from keywords alone.</p><ul><li>✓ Better skill and title matching</li><li>✓ Correct experience context</li><li>✓ Country-aware compensation</li><li>✓ Eligibility and availability checks</li></ul></section><section class="cpw-strength"><div class="jp-completion-ring" style="--completion:${candidateProfileStrength(profile) * 3.6}deg"><span><b>${candidateProfileStrength(profile)}%</b><small>current</small></span></div><h3>Existing profile strength</h3><p>Your score updates after all five steps are saved.</p></section></aside></div>
    </div>`, 'My Profile');

    const form = document.querySelector('#candidate-profile-wizard');
    const panels = [...form.querySelectorAll('[data-step-panel]')];
    const stepButtons = [...document.querySelectorAll('[data-wizard-step]')];
    const back = document.querySelector('#wizard-back');
    const next = document.querySelector('#wizard-next');
    const submit = document.querySelector('#wizard-submit');
    const progress = document.querySelector('#cpw-progress-value');
    const stepCopy = document.querySelector('#wizard-step-copy');
    let currentStep = 1;

    const updateReview = () => {
      const data = new FormData(form);
      const rows = [['Name', data.get('full_name')], ['Current role', data.get('current_title')], ['Experience', `${data.get('total_experience') || 0} years`], ['Skills', data.get('skills')], ['Location', `${data.get('city')}, ${countryConfig[data.get('country')]?.name || data.get('country')}`], ['Target roles', data.get('extra_target_roles') || 'Not specified'], ['Availability', portalStatus(data.get('availability_status'))]];
      document.querySelector('#wizard-review').innerHTML = rows.map(([label, content]) => `<div><small>${portalText(label)}</small><b>${portalText(content)}</b></div>`).join('');
    };
    const showStep = step => {
      currentStep = step;
      panels.forEach(panel => { panel.hidden = Number(panel.dataset.stepPanel) !== step; panel.classList.toggle('active', Number(panel.dataset.stepPanel) === step); });
      stepButtons.forEach((button, index) => { button.classList.toggle('active', index + 1 === step); button.classList.toggle('complete', index + 1 < step); });
      back.hidden = step === 1;
      next.hidden = step === 5;
      submit.hidden = step !== 5;
      progress.textContent = `${step * 20}%`;
      stepCopy.textContent = `Step ${step} of 5`;
      if (step === 5) updateReview();
      window.scrollTo({top: 0, behavior: 'smooth'});
    };
    const validateStep = step => {
      const fields = [...panels[step - 1].querySelectorAll('input, select, textarea')];
      for (const field of fields) if (!field.checkValidity()) { field.reportValidity(); field.focus(); return false; }
      if (step === 4 && !profile.resume_file_id && !document.querySelector('#wizard-resume').files[0]) { document.querySelector('#wizard-file-error').textContent = 'Upload a resume before continuing.'; return false; }
      return true;
    };
    next.onclick = () => { if (validateStep(currentStep)) showStep(currentStep + 1); };
    back.onclick = () => showStep(currentStep - 1);
    stepButtons.forEach(button => button.onclick = () => {
      const target = Number(button.dataset.wizardStep);
      if (target <= currentStep) showStep(target);
      else if (validateStep(currentStep)) showStep(currentStep + 1);
    });

    const country = document.querySelector('#wizard-country');
    const requireMarketFields = () => document.querySelectorAll('#wizard-country-fields input, #wizard-country-fields select').forEach(field => field.required = true);
    country.onchange = () => {
      const code = country.value;
      document.querySelector('#wizard-country-fields').innerHTML = profileCountryFields(code, code === originalCountry ? details : {});
      document.querySelector('#wizard-market-title').textContent = `${countryConfig[code]?.name || 'Selected market'} hiring details`;
      requireMarketFields();
    };
    requireMarketFields();
    wireDownloads();
    const resumeInput = document.querySelector('#wizard-resume');
    resumeInput.onchange = () => {
      const file = resumeInput.files[0];
      const error = file && (!/\.(pdf|doc|docx)$/i.test(file.name) ? 'Choose a PDF, DOC or DOCX file.' : file.size > maxBytes ? `The file must be smaller than ${candidateFileSize(maxBytes)}.` : !file.size ? 'The selected file is empty.' : '');
      document.querySelector('#wizard-file-error').textContent = error || '';
      document.querySelector('#wizard-file-name').textContent = file && !error ? `${file.name} · ${candidateFileSize(file.size)}` : 'No valid new file selected';
      if (error) resumeInput.value = '';
    };

    form.onsubmit = async event => {
      event.preventDefault();
      if (currentStep !== 5) { if (validateStep(currentStep)) showStep(currentStep + 1); return; }
      if (!validateStep(5)) return;
      const data = new FormData(form);
      const body = {full_name: data.get('full_name').trim(), email: data.get('email').trim(), phone: data.get('phone').trim(), country: data.get('country'), city: data.get('city').trim(), current_title: data.get('current_title').trim(), total_experience: Number(data.get('total_experience')), skills: data.get('skills').split(',').map(item => item.trim()).filter(Boolean), linkedin_url: data.get('linkedin_url') || null, current_employer: data.get('current_employer') || null, country_specific_data: {}};
      for (const [key, item] of data) if (key.startsWith('extra_')) body.country_specific_data[key.slice(6)] = item;
      submit.disabled = true; submit.textContent = 'Saving profile…';
      try {
        await api('/candidate/profile', {method: 'PUT', body: JSON.stringify(body)});
        const file = resumeInput.files[0];
        if (file) { submit.textContent = 'Uploading resume…'; const upload = new FormData(); upload.append('file', file); await api(`/candidates/${profile.id}/resume`, {method: 'POST', body: upload}); }
        submit.textContent = 'Saving availability…';
        await api(`/candidates/${profile.id}/availability`, {method: 'PUT', body: JSON.stringify({status: data.get('availability_status'), available_from: data.get('available_from') || null})});
        toast('Your complete profile is saved and ready for AI matching');
        route('/candidate/dashboard');
      } catch (error) { submit.disabled = false; submit.textContent = 'Save complete profile'; toast(error.message, true); }
    };
  } catch (error) { toast(error.message, true); }
};

if (session?.user.role === 'candidate' && location.pathname === '/candidate/profile') profilePage();
