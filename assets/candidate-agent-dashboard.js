/* Replaces the passive dashboard empty state with the live conversational Career Agent. */
const candidateAgentDashboardBase = candidateDashboard;
candidateDashboard = async function () {
  await candidateAgentDashboardBase();
  const matchList = document.querySelector('.jp-dashboard .jp-match-list');
  const section = matchList?.closest('.jp-section');
  if (!section) return;
  try {
    const status = await api('/candidate/matching-status');
    const checks = status.profile_checks || {};
    const readyCount = Object.values(checks).filter(Boolean).length;
    const matchingActive = readyCount === 3;
    const firstName = portalText(status.candidate.name.split(' ')[0]);
    const hero = document.querySelector('.jp-passive-hero');
    if (hero) hero.innerHTML = `<div class="chp-hero-copy"><span class="jp-eyebrow">HIREScoreAI CAREER WORKSPACE</span><h1>Good ${new Date().getHours() < 12 ? 'morning' : 'afternoon'}, ${firstName}.</h1><p>${matchingActive ? 'Your talent profile is active and continuously evaluated against verified recruiter demand.' : 'Complete your career signals once. HireScoreAI will continuously identify the opportunities that genuinely fit you.'}</p><div class="jp-hero-actions"><button data-portal-route="${!checks.profile ? '/candidate/profile' : !checks.resume ? '/candidate/resume' : '/candidate/availability'}">${matchingActive ? 'Review my profile' : 'Complete next step'}</button><button class="secondary" data-portal-route="/candidate/matches">Open opportunity radar</button></div><div class="chp-trust-row"><span>${candidateIcon('lock')} Private profile</span><span>${candidateIcon('spark')} Evidence-based matching</span><span>${candidateIcon('check')} No manual applications</span></div></div><div class="chp-command"><div class="chp-orbit"><span></span><i></i><b>${candidateIcon('spark')}</b></div><span class="${matchingActive ? 'live' : ''}"><i></i>${matchingActive ? 'AI agent active' : 'Setup in progress'}</span><strong>${readyCount}<small>of 3 signals ready</small></strong><p>${status.active_requirements_monitored || 0} recruiter requirements in the monitoring network</p></div>`;
    const grid = document.querySelector('.jp-dashboard-grid');
    if (grid && !document.querySelector('.chp-overview')) grid.insertAdjacentHTML('beforebegin', `<section class="chp-overview"><article><span class="purple">${candidateIcon('profile')}</span><div><small>Profile readiness</small><b>${Math.round(readyCount / 3 * 100)}%</b><p>${matchingActive ? 'All core signals complete' : `${3 - readyCount} action${3 - readyCount === 1 ? '' : 's'} remaining`}</p></div></article><article><span class="blue">${candidateIcon('spark')}</span><div><small>Opportunity radar</small><b>${status.active_requirements_monitored || 0}</b><p>Active requirements monitored</p></div></article><article><span class="green">${candidateIcon('check')}</span><div><small>Strong profile fits</small><b>${portalList(status.matches).length}</b><p>${portalList(status.matches).length ? 'Ready for review' : 'Agent is continuously scanning'}</p></div></article></section>`);
    wireCandidatePortalRoutes();
    section.className = 'cda-section';
    section.innerHTML = '<div id="candidate-inline-agent"></div>';
    initializeCandidateChat(document.querySelector('#candidate-inline-agent'), status);
  } catch (error) { toast(error.message, true); }
};

if (session?.user.role === 'candidate' && location.pathname === '/candidate/dashboard') candidateDashboard();
