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
    section.innerHTML = '<div id="candidate-inline-agent"></div>';
    initializeCandidateChat(document.querySelector('#candidate-inline-agent'), status);
  } catch (error) { toast(error.message, true); }
};

if (session?.user.role === 'candidate' && location.pathname === '/candidate/dashboard') candidateDashboard();
