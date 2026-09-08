// Candidate agent conversations are isolated by signed-in user for the current browser tab.
const candidateConversations = new Map();
const candidateChatList = value => Array.isArray(value) ? value : [];
const candidateChatEscape = value => String(value ?? '').replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));

function initializeCandidateChat(panel, status) {
  panel.classList.add('candidate-conversation');
  panel.innerHTML = `<header><div><span class="cca-orb">✦</span><div><b>HireScoreAI Career Agent</b><small>Ask about your profile, resume, availability or matches</small></div></div><span class="cca-online"><i></i> Online</span></header><div class="cca-thread" role="log" aria-label="Career Agent conversation" aria-live="polite"></div><div class="cca-prompts"><button type="button" data-agent-prompt="What should I complete next?">What should I complete next?</button><button type="button" data-agent-prompt="Scan my best recruiter matches">Scan my matches</button><button type="button" data-agent-prompt="Is my resume ready?">Check my resume</button></div><form class="cca-composer"><label for="career-message">Message your Career Agent</label><div><textarea id="career-message" rows="2" maxlength="500" placeholder="Message HireScoreAI…"></textarea><button type="submit" aria-label="Send message" disabled><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></button></div><small>Responses use your authenticated candidate profile and live recruiter requirements.</small></form>`;
  const thread = panel.querySelector('.cca-thread');
  const form = panel.querySelector('form');
  const input = panel.querySelector('textarea');
  const send = form.querySelector('button');
  const userKey = session.user.id || session.user.email;
  let messages = candidateConversations.get(userKey);
  if (!messages) {
    const missing = Object.entries(status.profile_checks || {}).filter(([, complete]) => !complete).map(([key]) => key);
    const intro = missing.length
      ? `Hi ${status.candidate.name.split(' ')[0]}! I’m connected to your profile. I can see ${missing.length} matching signal${missing.length === 1 ? '' : 's'} still need attention. Ask me what to complete next.`
      : `Hi ${status.candidate.name.split(' ')[0]}! Your matching setup is active. Ask me to scan recruiter requirements, explain a match, or review your profile health.`;
    messages = [{role: 'assistant', text: intro}];
    candidateConversations.set(userKey, messages);
  }

  const appendMessage = (role, text, result = {}) => {
    const bubble = document.createElement('article');
    bubble.className = `cca-message ${role}`;
    bubble.innerHTML = `<span>${role === 'assistant' ? '✦' : candidateChatEscape(session.user.name.split(' ')[0][0])}</span><div><small>${role === 'assistant' ? 'HireScoreAI' : 'You'}</small><p></p></div>`;
    bubble.querySelector('p').textContent = text;
    if (candidateChatList(result.matches).length) {
      const list = document.createElement('div');
      list.className = 'cca-match-results';
      result.matches.slice(0, 3).forEach(match => {
        const card = document.createElement('article');
        card.innerHTML = `<span>${candidateChatEscape((match.company || 'C')[0])}</span><div><small>${candidateChatEscape(match.company || 'Verified recruiter')}</small><b>${candidateChatEscape(match.title || 'Matching opportunity')}</b><p>${candidateChatEscape([match.city, match.work_mode].filter(Boolean).join(' · '))}</p></div><strong>${Math.round(match.match_score || 0)}%</strong>`;
        list.append(card);
      });
      bubble.querySelector('div').append(list);
    }
    if (candidateChatList(result.actions).length) {
      const actions = document.createElement('div');
      actions.className = 'cca-actions';
      result.actions.forEach(action => {
        const button = document.createElement('button');
        button.type = 'button'; button.textContent = action.label;
        button.onclick = () => action.route ? route(action.route) : ask(action.prompt);
        actions.append(button);
      });
      bubble.querySelector('div').append(actions);
    }
    thread.append(bubble);
    thread.scrollTop = thread.scrollHeight;
    return bubble;
  };
  messages.forEach(message => appendMessage(message.role, message.text));
  let busy = false;
  const ask = async prompt => {
    const message = String(prompt || '').trim();
    if (!message || busy) return;
    busy = true; send.disabled = true; input.value = '';
    messages.push({role: 'user', text: message});
    appendMessage('user', message);
    const pending = appendMessage('assistant', 'Inspecting your workspace…');
    pending.classList.add('thinking');
    try {
      const result = await api('/candidate/agent/chat', {method: 'POST', body: JSON.stringify({message, history: messages.slice(-8)})});
      pending.remove();
      appendMessage('assistant', result.reply, result);
      messages.push({role: 'assistant', text: result.reply});
    } catch (error) {
      pending.querySelector('p').textContent = `I couldn’t inspect your workspace. ${error.message}`;
      pending.classList.remove('thinking');
    } finally { busy = false; send.disabled = !input.value.trim(); input.focus(); }
  };
  input.oninput = () => send.disabled = busy || !input.value.trim();
  input.onkeydown = event => { if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) { event.preventDefault(); if (!send.disabled) form.requestSubmit(); } };
  form.onsubmit = event => { event.preventDefault(); ask(input.value); };
  panel.querySelectorAll('[data-agent-prompt]').forEach(button => button.onclick = () => ask(button.dataset.agentPrompt));
}
