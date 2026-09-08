/* Premium candidate matching view. Opportunities remain AI-curated with no manual application flow. */
candidateMatchesPage = async function () {
  try {
    const [status, applications] = await Promise.all([api('/candidate/matching-status'), api('/candidate/applications')]);
    const matches = portalList(status.matches);
    const selections = portalList(applications);
    const checks = status.profile_checks || {};
    const completed = Object.values(checks).filter(Boolean).length;
    const ready = completed === 3;
    const monitored = status.active_requirements_monitored || 0;
    const scanTime = status.last_scan_at ? new Date(status.last_scan_at).toLocaleString('en-GB', {day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'}) : 'Waiting for first scan';
    const signalRows = [
      ['profile', 'Professional profile', 'Skills, experience and preferences', '/candidate/profile'],
      ['resume', 'Resume evidence', 'Your latest verified document', '/candidate/resume'],
      ['availability', 'Availability signal', 'Your current opportunity status', '/candidate/availability']
    ];
    const pipeline = [
      ['Matched', matches.length, 'AI found a strong profile fit'],
      ['Recruiter review', selections.filter(item => ['submitted','received','under_review','under_evaluation','qualified'].includes(item.status)).length, 'Profile is being evaluated'],
      ['Interview', selections.filter(item => item.status === 'interview').length, 'Conversation with hiring team'],
      ['Offer', selections.filter(item => ['offer','selected','joined'].includes(item.status)).length, 'Final hiring outcome']
    ];
    layout(`<div class="candidate-job-portal cms-page">
      <section class="cms-hero"><div class="cms-hero-copy"><span>✦ AI TALENT MATCHING</span><h1>Your opportunity radar</h1><p>HireScoreAI continuously compares your profile with verified recruiter requirements and surfaces only meaningful fits—no searching and no manual applications.</p><div class="cms-live"><i></i><b>${ready ? 'Matching engine active' : 'Matching setup incomplete'}</b><small>Last scan ${portalText(scanTime)}</small></div></div><div class="cms-radar-mini"><span></span><i></i><b>✦</b><small>${matches.length} strong<br>match${matches.length === 1 ? '' : 'es'}</small></div></section>
      <section class="cms-metrics"><article><span class="violet">${candidateIcon('spark')}</span><div><small>Requirements monitored</small><b>${monitored}</b><em>Verified recruiter demand</em></div></article><article><span class="blue">${candidateIcon('profile')}</span><div><small>Strong profile fits</small><b>${matches.length}</b><em>${matches.length ? 'Ready for your review' : 'AI is still scanning'}</em></div></article><article><span class="green">${candidateIcon('check')}</span><div><small>Selection workflows</small><b>${selections.length}</b><em>${selections.length ? 'Recruiter activity detected' : 'No profile moved forward yet'}</em></div></article></section>
      <div class="cms-grid"><main><section class="cms-panel cms-opportunities"><header><div><span>OPPORTUNITY RADAR</span><h2>AI-curated profile matches</h2><p>Only requirements that clear the matching threshold appear here.</p></div><span class="cms-count">${matches.length} strong match${matches.length === 1 ? '' : 'es'}</span></header>${matches.length ? `<div class="jp-match-list">${matches.map(candidateMatchCard).join('')}</div>` : `<div class="cms-radar-empty"><div class="cms-radar"><span></span><i></i><b>${candidateIcon('spark')}</b><em></em></div><div><span class="cms-scanning"><i></i>${ready ? 'Continuous scan active' : 'Waiting for profile readiness'}</span><h3>${ready ? 'Scanning for a meaningful fit' : 'Complete your matching signals'}</h3><p>${ready ? `Your profile is active across ${monitored} recruiter requirement${monitored === 1 ? '' : 's'}. A role will appear only when the skills, experience, location and preferences align.` : 'Finish all three profile signals to activate continuous requirement matching.'}</p><button data-cms-route="${!checks.profile ? '/candidate/profile' : !checks.resume ? '/candidate/resume' : '/candidate/availability'}">${ready ? 'Review matching profile' : 'Complete next signal'} →</button></div></div>`}</section></main>
        <aside><section class="cms-panel cms-health"><header><div><span>PROFILE SIGNAL</span><h2>Matching health</h2></div><b>${completed}/3</b></header><div class="cms-health-bar"><i style="width:${Math.round(completed / 3 * 100)}%"></i></div><div class="cms-signal-list">${signalRows.map(([key, title, copy, path]) => `<button data-cms-route="${path}" class="${checks[key] ? 'complete' : ''}"><span>${checks[key] ? '✓' : '!'}</span><div><b>${title}</b><small>${copy}</small></div><i>${checks[key] ? 'Ready' : 'Action needed'}</i></button>`).join('')}</div><footer>${candidateIcon('spark')} Stronger evidence creates fewer, better matches.</footer></section><section class="cms-trust"><span>${candidateIcon('lock')}</span><div><b>Private by design</b><p>Your profile enters a recruiter workflow only through the platform’s matching process.</p></div></section></aside></div>
      <section class="cms-panel cms-pipeline"><header><div><span>SELECTION JOURNEY</span><h2>Your profile progress</h2><p>Track what happens after HireScoreAI identifies a strong fit.</p></div></header><div class="cms-stage-grid">${pipeline.map(([title, count, copy], index) => `<article class="${count ? 'active' : ''}"><span>${index + 1}</span><div><small>${portalText(title)}</small><b>${count}</b><p>${portalText(copy)}</p></div>${index < pipeline.length - 1 ? '<i>›</i>' : ''}</article>`).join('')}</div>${selections.length ? `<div class="jp-selection-list">${selections.map(candidateSelectionCard).join('')}</div>` : `<div class="cms-pipeline-empty">No recruiter activity yet. The pipeline will update automatically when a matched profile moves forward.</div>`}</section>
    </div>`, 'My Matches');
    document.querySelectorAll('[data-cms-route]').forEach(button => button.onclick = () => route(button.dataset.cmsRoute));
  } catch (error) { toast(error.message, true); }
};

if (session?.user.role === 'candidate' && location.pathname === '/candidate/matches') candidateMatchesPage();
