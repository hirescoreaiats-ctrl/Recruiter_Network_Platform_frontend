/* Replaces the passive dashboard empty state with the live conversational Career Agent. */
const candidateAgentDashboardBase = candidateDashboard;
candidateDashboard = async function () {
  await candidateAgentDashboardBase();
  const matchList = document.querySelector('.jp-dashboard .jp-match-list');
  const section = matchList?.closest('.jp-section');
  if (!section) return;
  try {
    const status = await api('/candidate/matching-status');
    section.className = 'cda-section';
    section.innerHTML = `<div class="cda-intro"><span class="cda-label">CONVERSATIONAL CAREER AGENT</span><h2>Plan your next move with HireScoreAI</h2><p>Ask naturally. The agent inspects your live profile, runs matching tools and guides you to the next useful action.</p><div class="cda-capabilities"><span>${candidateIcon('profile')} Profile intelligence</span><span>${candidateIcon('file')} Resume checks</span><span>${candidateIcon('spark')} Live match scans</span></div><div class="cda-trust">${candidateIcon('lock')}<p><b>Account-aware, action-oriented</b><small>No public job feed and no automatic application submission.</small></p></div></div><div id="candidate-inline-agent"></div>`;
    initializeCandidateChat(document.querySelector('#candidate-inline-agent'), status);
  } catch (error) { toast(error.message, true); }
};

if (session?.user.role === 'candidate' && location.pathname === '/candidate/dashboard') candidateDashboard();
