// Chat UI Controller - Connects user interface with AI agents

let apiKey = null;
let userSettings = {
  dailyLimit: 20,
  name: '',
  title: ''
};

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  setupEventListeners();
  checkApiKey();
});

// Load saved settings
async function loadSettings() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getSetting', key: 'claude_api_key' });
    if (response.success && response.value) {
      apiKey = response.value;
    }

    const dailyLimitResponse = await chrome.runtime.sendMessage({ action: 'getSetting', key: 'dailyLimit' });
    if (dailyLimitResponse.success && dailyLimitResponse.value) {
      userSettings.dailyLimit = dailyLimitResponse.value;
    }

    const nameResponse = await chrome.runtime.sendMessage({ action: 'getSetting', key: 'userName' });
    if (nameResponse.success && nameResponse.value) {
      userSettings.name = nameResponse.value;
    }

    const titleResponse = await chrome.runtime.sendMessage({ action: 'getSetting', key: 'userTitle' });
    if (titleResponse.success && titleResponse.value) {
      userSettings.title = titleResponse.value;
    }

  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

// Check if API key is set
function checkApiKey() {
  const hasKey = !!apiKey;
  const sendBtn = document.getElementById('sendButton');
  const messageInput = document.getElementById('messageInput');
  const keyStatusText = document.getElementById('keyStatusText');

  if (hasKey) {
    sendBtn.disabled = false;
    messageInput.disabled = false;
    keyStatusText.textContent = 'Claude API connected';
  } else {
    sendBtn.disabled = true;
    messageInput.disabled = false;
    keyStatusText.textContent = 'No API key set';
  }
}

// Setup event listeners
function setupEventListeners() {
  const sendBtn = document.getElementById('sendButton');
  const messageInput = document.getElementById('messageInput');
  const setApiKeyBtn = document.getElementById('setApiKeyBtn');
  const closeModal = document.getElementById('closeModal');
  const saveSettingsBtn = document.getElementById('saveSettingsBtn');
  const pauseBtn = document.getElementById('pauseBtn');
  const resumeBtn = document.getElementById('resumeBtn');
  const stopBtn = document.getElementById('stopBtn');

  // Send message
  sendBtn.addEventListener('click', () => sendMessage());
  messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Auto-resize textarea
  messageInput.addEventListener('input', () => {
    messageInput.style.height = 'auto';
    messageInput.style.height = messageInput.scrollHeight + 'px';
  });

  // Example prompts
  document.querySelectorAll('.example-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      messageInput.value = btn.dataset.prompt;
      sendMessage();
    });
  });

  // Settings modal
  setApiKeyBtn.addEventListener('click', () => openSettingsModal());
  closeModal.addEventListener('click', () => closeSettingsModal());
  saveSettingsBtn.addEventListener('click', () => saveSettings());

  // Controls
  pauseBtn.addEventListener('click', () => pauseAgents());
  resumeBtn.addEventListener('click', () => resumeAgents());
  stopBtn.addEventListener('click', () => stopAgents());

  // Close modal on background click
  document.getElementById('settingsModal').addEventListener('click', (e) => {
    if (e.target.id === 'settingsModal') {
      closeSettingsModal();
    }
  });
}

// Send user message
async function sendMessage() {
  const input = document.getElementById('messageInput');
  const message = input.value.trim();

  if (!message) return;
  if (!apiKey) {
    addSystemMessage('Please set your Claude API key in settings first');
    openSettingsModal();
    return;
  }

  // Clear input
  input.value = '';
  input.style.height = 'auto';

  // Add user message to chat
  addMessage(message, 'user');

  // Show thinking
  const thinkingId = addThinkingMessage();

  try {
    // Send to background script to process with agents
    const response = await chrome.runtime.sendMessage({
      action: 'process_chat_message',
      message: message,
      apiKey: apiKey,
      settings: userSettings
    });

    // Remove thinking
    removeThinkingMessage(thinkingId);

    if (response.success) {
      addMessage(response.reply, 'assistant');

      // If agents are starting, show controls
      if (response.starting) {
        document.getElementById('controls').style.display = 'flex';
        updateStatus('working');

        // Listen for agent updates
        startMonitoringAgents();
      }
    } else {
      addMessage('Sorry, I encountered an error: ' + response.error, 'assistant');
    }

  } catch (error) {
    removeThinkingMessage(thinkingId);
    addMessage('Error: ' + error.message, 'assistant');
  }
}

// Add message to chat
function addMessage(text, type) {
  const container = document.getElementById('messagesContainer');
  const welcome = container.querySelector('.welcome-message');
  if (welcome) welcome.remove();

  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${type}`;

  const bubble = document.createElement('div');
  bubble.className = 'message-bubble';
  bubble.textContent = text;

  const time = document.createElement('div');
  time.className = 'message-time';
  time.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  messageDiv.appendChild(bubble);
  messageDiv.appendChild(time);
  container.appendChild(messageDiv);

  // Scroll to bottom
  container.scrollTop = container.scrollHeight;

  return messageDiv;
}

// Add system message
function addSystemMessage(text) {
  const container = document.getElementById('messagesContainer');

  const messageDiv = document.createElement('div');
  messageDiv.className = 'message system';

  const bubble = document.createElement('div');
  bubble.className = 'message-bubble';
  bubble.textContent = text;

  messageDiv.appendChild(bubble);
  container.appendChild(messageDiv);

  container.scrollTop = container.scrollHeight;

  return messageDiv;
}

// Add thinking indicator
function addThinkingMessage() {
  const container = document.getElementById('messagesContainer');

  const messageDiv = document.createElement('div');
  messageDiv.className = 'message assistant';
  messageDiv.id = 'thinking-' + Date.now();

  const bubble = document.createElement('div');
  bubble.className = 'message-bubble';

  const thinking = document.createElement('div');
  thinking.className = 'thinking';
  for (let i = 0; i < 3; i++) {
    const dot = document.createElement('div');
    dot.className = 'thinking-dot';
    thinking.appendChild(dot);
  }

  bubble.appendChild(thinking);
  messageDiv.appendChild(bubble);
  container.appendChild(messageDiv);

  container.scrollTop = container.scrollHeight;

  return messageDiv.id;
}

// Remove thinking indicator
function removeThinkingMessage(id) {
  const thinkingMsg = document.getElementById(id);
  if (thinkingMsg) thinkingMsg.remove();
}

// Add agent activity message
function addAgentActivity(agentName, activity) {
  const container = document.getElementById('messagesContainer');

  const messageDiv = document.createElement('div');
  messageDiv.className = 'message assistant';

  const bubble = document.createElement('div');
  bubble.className = 'message-bubble';

  const activityDiv = document.createElement('div');
  activityDiv.className = 'agent-activity';
  activityDiv.innerHTML = `<span class="agent-name">${agentName}</span>: ${activity}`;

  bubble.appendChild(activityDiv);
  messageDiv.appendChild(bubble);
  container.appendChild(messageDiv);

  container.scrollTop = container.scrollHeight;
}

// Add progress bar
function addProgressMessage(text, progress) {
  const container = document.getElementById('messagesContainer');

  const messageDiv = document.createElement('div');
  messageDiv.className = 'message assistant';
  messageDiv.id = 'progress-msg';

  const bubble = document.createElement('div');
  bubble.className = 'message-bubble';

  const progressContainer = document.createElement('div');
  progressContainer.className = 'progress-container';

  const progressText = document.createElement('div');
  progressText.className = 'progress-text';
  progressText.textContent = text;

  const progressBar = document.createElement('div');
  progressBar.className = 'progress-bar';

  const progressFill = document.createElement('div');
  progressFill.className = 'progress-fill';
  progressFill.style.width = `${progress}%`;

  progressBar.appendChild(progressFill);
  progressContainer.appendChild(progressText);
  progressContainer.appendChild(progressBar);
  bubble.appendChild(progressContainer);
  messageDiv.appendChild(bubble);

  // Remove old progress message
  const oldProgress = document.getElementById('progress-msg');
  if (oldProgress) oldProgress.remove();

  container.appendChild(messageDiv);
  container.scrollTop = container.scrollHeight;

  return messageDiv;
}

// Monitor agents
async function startMonitoringAgents() {
  const interval = setInterval(async () => {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'get_agent_status' });

      if (response.success && response.status) {
        updateAgentStatus(response.status);

        // Check if complete
        if (response.status.status === 'complete') {
          clearInterval(interval);
          updateStatus('ready');
          document.getElementById('controls').style.display = 'none';

          addMessage(`✅ Task complete! ${response.status.summary || ''}`, 'assistant');
        }
      }
    } catch (error) {
      console.error('Error monitoring agents:', error);
      clearInterval(interval);
    }
  }, 2000);
}

// Update agent status pills
function updateAgentStatus(status) {
  if (!status.agents) return;

  Object.entries(status.agents).forEach(([name, state]) => {
    const pill = document.querySelector(`[data-agent="${name}"] span`);
    if (pill) {
      pill.textContent = state.status.charAt(0).toUpperCase() + state.status.slice(1);

      const pillEl = document.querySelector(`[data-agent="${name}"]`);
      if (state.status === 'working') {
        pillEl.classList.add('active');
      } else {
        pillEl.classList.remove('active');
      }
    }
  });
}

// Update system status
function updateStatus(status) {
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');

  statusDot.className = 'status-dot';

  switch(status) {
    case 'ready':
      statusText.textContent = 'Ready';
      break;
    case 'working':
      statusText.textContent = 'Working';
      statusDot.classList.add('working');
      break;
    case 'error':
      statusText.textContent = 'Error';
      statusDot.classList.add('error');
      break;
    default:
      statusText.textContent = 'Ready';
  }
}

// Settings modal
function openSettingsModal() {
  const modal = document.getElementById('settingsModal');
  modal.style.display = 'flex';

  // Populate current values
  document.getElementById('apiKeyInput').value = apiKey || '';
  document.getElementById('dailyLimitInput').value = userSettings.dailyLimit;
  document.getElementById('userNameInput').value = userSettings.name;
  document.getElementById('userTitleInput').value = userSettings.title;
}

function closeSettingsModal() {
  const modal = document.getElementById('settingsModal');
  modal.style.display = 'none';
}

async function saveSettings() {
  const newApiKey = document.getElementById('apiKeyInput').value.trim();
  const dailyLimit = parseInt(document.getElementById('dailyLimitInput').value);
  const userName = document.getElementById('userNameInput').value.trim();
  const userTitle = document.getElementById('userTitleInput').value.trim();

  // Save to storage
  if (newApiKey) {
    apiKey = newApiKey;
    await chrome.runtime.sendMessage({
      action: 'setSetting',
      key: 'claude_api_key',
      value: newApiKey
    });
  }

  await chrome.runtime.sendMessage({ action: 'setSetting', key: 'dailyLimit', value: dailyLimit });
  await chrome.runtime.sendMessage({ action: 'setSetting', key: 'userName', value: userName });
  await chrome.runtime.sendMessage({ action: 'setSetting', key: 'userTitle', value: userTitle });

  userSettings = { dailyLimit, name: userName, title: userTitle };

  closeSettingsModal();
  checkApiKey();

  addSystemMessage('Settings saved successfully!');
}

// Agent controls
async function pauseAgents() {
  await chrome.runtime.sendMessage({ action: 'pause_agents' });
  document.getElementById('pauseBtn').style.display = 'none';
  document.getElementById('resumeBtn').style.display = 'block';
  addSystemMessage('Agents paused');
}

async function resumeAgents() {
  await chrome.runtime.sendMessage({ action: 'resume_agents' });
  document.getElementById('pauseBtn').style.display = 'block';
  document.getElementById('resumeBtn').style.display = 'none';
  addSystemMessage('Agents resumed');
}

async function stopAgents() {
  if (!confirm('Are you sure you want to stop all agents?')) return;

  await chrome.runtime.sendMessage({ action: 'stop_agents' });
  document.getElementById('controls').style.display = 'none';
  updateStatus('ready');
  addSystemMessage('All agents stopped');
}
