// LinkedIn CRM Platform - Main Controller

let apiKey = null;
let userSettings = {
  dailyLimit: 50,
  name: '',
  title: ''
};

let campaigns = [];
let contacts = [];
let currentPage = 'dashboard';
let currentCampaignStep = 1;
let newCampaign = {};

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  await loadData();
  setupEventListeners();
  renderDashboard();
  checkApiStatus();
});

// Load settings from storage
async function loadSettings() {
  try {
    const apiResponse = await chrome.runtime.sendMessage({ action: 'getSetting', key: 'claude_api_key' });
    if (apiResponse.success && apiResponse.value) {
      apiKey = apiResponse.value;
    }

    const limitResponse = await chrome.runtime.sendMessage({ action: 'getSetting', key: 'dailyLimit' });
    if (limitResponse.success && limitResponse.value) {
      userSettings.dailyLimit = limitResponse.value;
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

// Load data from storage
async function loadData() {
  try {
    // Load campaigns
    const campaignsResponse = await chrome.runtime.sendMessage({ action: 'getCampaigns' });
    if (campaignsResponse.success) {
      campaigns = campaignsResponse.campaigns || [];
    }

    // Load contacts
    const contactsResponse = await chrome.runtime.sendMessage({ action: 'getAllContacts' });
    if (contactsResponse.success) {
      contacts = contactsResponse.contacts || [];
    }
  } catch (error) {
    console.error('Error loading data:', error);
  }
}

// Check API status
function checkApiStatus() {
  const statusDot = document.getElementById('apiStatusDot');
  const statusText = document.getElementById('apiStatusText');

  if (apiKey) {
    statusDot.classList.add('connected');
    statusText.textContent = 'API Connected';
  } else {
    statusDot.classList.remove('connected');
    statusText.textContent = 'No API Key';
  }
}

// Setup event listeners
function setupEventListeners() {
  // Navigation
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const page = item.dataset.page;
      navigateTo(page);
    });
  });

  // Settings
  document.getElementById('settingsBtn').addEventListener('click', () => openSettings());
  document.getElementById('closeSettingsModal').addEventListener('click', () => closeSettings());
  document.getElementById('saveSettingsBtn').addEventListener('click', () => saveSettings());

  // Campaign modals
  document.getElementById('newCampaignBtn').addEventListener('click', () => openCampaignBuilder());
  document.getElementById('createCampaignBtn').addEventListener('click', () => openCampaignBuilder());
  document.getElementById('closeCampaignModal').addEventListener('click', () => closeCampaignBuilder());

  // Campaign builder navigation
  document.getElementById('nextStepBtn').addEventListener('click', () => nextCampaignStep());
  document.getElementById('prevStepBtn').addEventListener('click', () => prevCampaignStep());
  document.getElementById('launchCampaignBtn').addEventListener('click', () => launchCampaign());

  // Contact actions
  document.getElementById('exportContactsBtn').addEventListener('click', () => exportContacts());
  document.getElementById('addContactBtn').addEventListener('click', () => addContact());
  document.getElementById('importContactsBtn').addEventListener('click', () => openImportModal());
  document.getElementById('closeImportModal').addEventListener('click', () => closeImportModal());

  // CSV Upload
  const uploadArea = document.getElementById('uploadArea');
  const csvFileInput = document.getElementById('csvFileInput');

  uploadArea.addEventListener('click', () => csvFileInput.click());
  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
  });
  uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
  });
  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.csv')) {
      handleCSVFile(file);
    }
  });

  csvFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      handleCSVFile(file);
    }
  });

  document.getElementById('confirmImportBtn').addEventListener('click', () => confirmImport());

  // Apollo.io API
  document.getElementById('apolloSearchBtn').addEventListener('click', () => searchApollo());
  document.getElementById('apolloImportBtn').addEventListener('click', () => importApolloContacts());

  // View toggle
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const view = btn.dataset.view;
      toggleContactView(view);
    });
  });

  // Search and filters
  document.getElementById('contactSearch').addEventListener('input', (e) => filterContacts());
  document.getElementById('stageFilter').addEventListener('change', () => filterContacts());
  document.getElementById('campaignFilter').addEventListener('change', () => filterContacts());

  // Settings modal background click
  document.getElementById('settingsModal').addEventListener('click', (e) => {
    if (e.target.id === 'settingsModal') closeSettings();
  });

  document.getElementById('campaignModal').addEventListener('click', (e) => {
    if (e.target.id === 'campaignModal') closeCampaignBuilder();
  });
}

// Navigation
function navigateTo(page) {
  currentPage = page;

  // Update nav items
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
    if (item.dataset.page === page) {
      item.classList.add('active');
    }
  });

  // Update pages
  document.querySelectorAll('.page').forEach(p => {
    p.classList.remove('active');
  });
  document.getElementById(page + 'Page').classList.add('active');

  // Render page content
  renderPage(page);
}

// Render page content
function renderPage(page) {
  switch(page) {
    case 'dashboard':
      renderDashboard();
      break;
    case 'campaigns':
      renderCampaigns();
      break;
    case 'contacts':
      renderContacts();
      break;
    case 'sequences':
      renderSequences();
      break;
    case 'inbox':
      renderInbox();
      break;
    case 'analytics':
      renderAnalytics();
      break;
  }
}

// Render Dashboard
function renderDashboard() {
  // Update stats
  const totalContacts = contacts.length;
  const pendingRequests = contacts.filter(c => c.status === 'pending').length;
  const acceptedContacts = contacts.filter(c => c.status === 'connected').length;
  const acceptanceRate = totalContacts > 0 ? Math.round((acceptedContacts / totalContacts) * 100) : 0;
  const activeConvos = contacts.filter(c => c.lastMessage && !c.responded).length;

  document.getElementById('totalContacts').textContent = totalContacts;
  document.getElementById('pendingRequests').textContent = pendingRequests;
  document.getElementById('acceptanceRate').textContent = acceptanceRate + '%';
  document.getElementById('activeConvos').textContent = activeConvos;

  // Render active campaigns
  const activeCampaigns = campaigns.filter(c => c.status === 'active').slice(0, 3);
  const campaignsList = document.getElementById('activeCampaignsList');

  if (activeCampaigns.length === 0) {
    campaignsList.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 40px;">No active campaigns. Create one to get started!</p>';
  } else {
    campaignsList.innerHTML = activeCampaigns.map(campaign => `
      <div class="campaign-item" onclick="viewCampaign('${campaign.id}')">
        <div class="campaign-status ${campaign.status}"></div>
        <div class="campaign-info">
          <div class="campaign-name">${campaign.name}</div>
          <div class="campaign-meta">${campaign.target_titles || 'All prospects'} • Started ${formatDate(campaign.created_at)}</div>
        </div>
        <div class="campaign-progress">
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${(campaign.sent / campaign.total_target) * 100}%"></div>
          </div>
          <div class="progress-text">${campaign.sent} / ${campaign.total_target} sent</div>
        </div>
        <div class="campaign-stats">
          <div class="campaign-stat">
            <span class="campaign-stat-value">${campaign.connected || 0}</span>
            <span class="campaign-stat-label">Connected</span>
          </div>
          <div class="campaign-stat">
            <span class="campaign-stat-value">${campaign.replies || 0}</span>
            <span class="campaign-stat-label">Replies</span>
          </div>
        </div>
      </div>
    `).join('');
  }

  // Render recent activity
  const activityFeed = document.getElementById('activityFeed');
  const recentContacts = contacts.slice(0, 10);

  if (recentContacts.length === 0) {
    activityFeed.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 40px;">No recent activity</p>';
  } else {
    activityFeed.innerHTML = recentContacts.map(contact => {
      let icon = '👤';
      let text = `New contact added: ${contact.name}`;

      if (contact.status === 'connected') {
        icon = '✅';
        text = `${contact.name} accepted your connection request`;
      } else if (contact.lastMessage) {
        icon = '💬';
        text = `Sent message to ${contact.name}`;
      }

      return `
        <div class="activity-item">
          <div class="activity-icon">${icon}</div>
          <div class="activity-content">
            <div class="activity-text">${text}</div>
            <div class="activity-time">${formatTimeAgo(contact.created_at || Date.now())}</div>
          </div>
        </div>
      `;
    }).join('');
  }
}

// Render Campaigns
function renderCampaigns() {
  const campaignsGrid = document.getElementById('campaignsGrid');

  if (campaigns.length === 0) {
    campaignsGrid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 60px;">
        <div style="font-size: 64px; margin-bottom: 16px;">🎯</div>
        <h3 style="margin-bottom: 8px;">No campaigns yet</h3>
        <p style="color: var(--text-muted); margin-bottom: 24px;">Create your first campaign to start building your network</p>
        <button class="btn btn-primary" onclick="openCampaignBuilder()">➕ Create Campaign</button>
      </div>
    `;
  } else {
    campaignsGrid.innerHTML = campaigns.map(campaign => `
      <div class="campaign-card" onclick="viewCampaign('${campaign.id}')">
        <div class="campaign-card-header">
          <div>
            <div class="campaign-card-title">${campaign.name}</div>
            <div class="campaign-card-meta">Started ${formatDate(campaign.created_at)}</div>
          </div>
          <span class="campaign-badge ${campaign.status}">${campaign.status}</span>
        </div>

        <div class="campaign-progress">
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${(campaign.sent / campaign.total_target) * 100}%"></div>
          </div>
          <div class="progress-text">${campaign.sent} / ${campaign.total_target} connections</div>
        </div>

        <div class="campaign-card-stats">
          <div class="campaign-stat">
            <span class="campaign-stat-value">${campaign.sent || 0}</span>
            <span class="campaign-stat-label">Sent</span>
          </div>
          <div class="campaign-stat">
            <span class="campaign-stat-value">${campaign.connected || 0}</span>
            <span class="campaign-stat-label">Connected</span>
          </div>
          <div class="campaign-stat">
            <span class="campaign-stat-value">${campaign.replies || 0}</span>
            <span class="campaign-stat-label">Replies</span>
          </div>
        </div>
      </div>
    `).join('');
  }
}

// Render Contacts
function renderContacts() {
  const tableBody = document.getElementById('contactsTableBody');

  if (contacts.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align: center; padding: 60px;">
          <div style="color: var(--text-muted);">
            <div style="font-size: 48px; margin-bottom: 12px;">👥</div>
            <p>No contacts yet. Start a campaign to build your network!</p>
          </div>
        </td>
      </tr>
    `;
  } else {
    tableBody.innerHTML = contacts.map(contact => `
      <tr>
        <td><input type="checkbox" data-id="${contact.id}"></td>
        <td>
          <div class="contact-name">
            <div class="contact-avatar">${getInitials(contact.name)}</div>
            ${contact.name}
          </div>
        </td>
        <td>${contact.title || '-'}</td>
        <td>${contact.company || '-'}</td>
        <td><span class="stage-badge ${contact.stage || 'new'}">${formatStage(contact.stage || 'new')}</span></td>
        <td>${contact.campaign || '-'}</td>
        <td>${contact.last_contact ? formatDate(contact.last_contact) : 'Never'}</td>
        <td><span class="score-badge ${getScoreClass(contact.score || 0)}">${contact.score || 0}</span></td>
        <td>
          <button class="btn btn-secondary" style="padding: 6px 12px; font-size: 12px;" onclick="viewContact('${contact.id}')">View</button>
        </td>
      </tr>
    `).join('');
  }

  // Update campaign filter options
  const campaignFilter = document.getElementById('campaignFilter');
  const uniqueCampaigns = [...new Set(contacts.map(c => c.campaign).filter(Boolean))];
  campaignFilter.innerHTML = '<option value="">All Campaigns</option>' +
    uniqueCampaigns.map(c => `<option value="${c}">${c}</option>`).join('');
}

// Filter contacts
function filterContacts() {
  const searchTerm = document.getElementById('contactSearch').value.toLowerCase();
  const stageFilter = document.getElementById('stageFilter').value;
  const campaignFilter = document.getElementById('campaignFilter').value;

  const filtered = contacts.filter(contact => {
    const matchesSearch = !searchTerm ||
      contact.name.toLowerCase().includes(searchTerm) ||
      (contact.company && contact.company.toLowerCase().includes(searchTerm)) ||
      (contact.title && contact.title.toLowerCase().includes(searchTerm));

    const matchesStage = !stageFilter || contact.stage === stageFilter;
    const matchesCampaign = !campaignFilter || contact.campaign === campaignFilter;

    return matchesSearch && matchesStage && matchesCampaign;
  });

  // Update badge counts
  document.querySelector('[data-page="contacts"] .badge').textContent = filtered.length;

  // Re-render with filtered contacts
  const tableBody = document.getElementById('contactsTableBody');
  tableBody.innerHTML = filtered.map(contact => `
    <tr>
      <td><input type="checkbox" data-id="${contact.id}"></td>
      <td>
        <div class="contact-name">
          <div class="contact-avatar">${getInitials(contact.name)}</div>
          ${contact.name}
        </div>
      </td>
      <td>${contact.title || '-'}</td>
      <td>${contact.company || '-'}</td>
      <td><span class="stage-badge ${contact.stage || 'new'}">${formatStage(contact.stage || 'new')}</span></td>
      <td>${contact.campaign || '-'}</td>
      <td>${contact.last_contact ? formatDate(contact.last_contact) : 'Never'}</td>
      <td><span class="score-badge ${getScoreClass(contact.score || 0)}">${contact.score || 0}</span></td>
      <td>
        <button class="btn btn-secondary" style="padding: 6px 12px; font-size: 12px;" onclick="viewContact('${contact.id}')">View</button>
      </td>
    </tr>
  `).join('');
}

// Toggle contact view (table/board)
function toggleContactView(view) {
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  document.querySelector(`[data-view="${view}"]`).classList.add('active');

  if (view === 'table') {
    document.getElementById('tableView').classList.remove('hidden');
    document.getElementById('boardView').classList.add('hidden');
  } else {
    document.getElementById('tableView').classList.add('hidden');
    document.getElementById('boardView').classList.remove('hidden');
    renderPipelineBoard();
  }
}

// Render pipeline board
function renderPipelineBoard() {
  const stages = ['new', 'contacted', 'connected', 'engaged', 'qualified'];

  stages.forEach(stage => {
    const stageContacts = contacts.filter(c => c.stage === stage);
    const container = document.querySelector(`.pipeline-cards[data-stage="${stage}"]`);
    const count = container.parentElement.querySelector('.count');

    count.textContent = stageContacts.length;

    container.innerHTML = stageContacts.map(contact => `
      <div class="pipeline-card" draggable="true" data-id="${contact.id}">
        <div class="pipeline-card-name">${contact.name}</div>
        <div class="pipeline-card-company">${contact.company || 'No company'}</div>
        <div class="pipeline-card-meta">
          <span>${contact.title || 'No title'}</span>
          <span class="score-badge ${getScoreClass(contact.score || 0)}">${contact.score || 0}</span>
        </div>
      </div>
    `).join('');
  });
}

// Render Sequences
function renderSequences() {
  const sequencesList = document.getElementById('sequencesList');
  sequencesList.innerHTML = `
    <div style="text-align: center; padding: 60px;">
      <div style="font-size: 64px; margin-bottom: 16px;">📧</div>
      <h3 style="margin-bottom: 8px;">Sequences Coming Soon</h3>
      <p style="color: var(--text-muted);">Multi-touch email sequences will be available in the next update</p>
    </div>
  `;
}

// Render Inbox
function renderInbox() {
  const conversationsList = document.getElementById('conversationsList');
  const activeConversations = contacts.filter(c => c.lastMessage);

  if (activeConversations.length === 0) {
    conversationsList.innerHTML = '<div class="empty-state"><span class="empty-icon">💬</span><p>No conversations yet</p></div>';
  } else {
    conversationsList.innerHTML = activeConversations.map(contact => `
      <div class="conversation-item" onclick="viewConversation('${contact.id}')">
        <div class="contact-name">
          <div class="contact-avatar">${getInitials(contact.name)}</div>
          <div>
            <div style="font-weight: 600;">${contact.name}</div>
            <div style="font-size: 12px; color: var(--text-secondary);">${contact.lastMessage.substring(0, 50)}...</div>
          </div>
        </div>
      </div>
    `).join('');
  }
}

// Render Analytics
function renderAnalytics() {
  // Placeholder for chart rendering
  console.log('Analytics page loaded - charts would render here');
}

// Campaign Builder
function openCampaignBuilder() {
  document.getElementById('campaignModal').classList.add('active');
  currentCampaignStep = 1;
  newCampaign = {};
  showCampaignStep(1);
}

function closeCampaignBuilder() {
  document.getElementById('campaignModal').classList.remove('active');
}

function showCampaignStep(step) {
  currentCampaignStep = step;

  // Update step visibility
  document.querySelectorAll('.builder-step').forEach(s => s.classList.remove('active'));
  document.querySelector(`.builder-step[data-step="${step}"]`).classList.add('active');

  // Update buttons
  const prevBtn = document.getElementById('prevStepBtn');
  const nextBtn = document.getElementById('nextStepBtn');
  const launchBtn = document.getElementById('launchCampaignBtn');

  prevBtn.style.display = step > 1 ? 'block' : 'none';
  nextBtn.style.display = step < 5 ? 'block' : 'none';
  launchBtn.style.display = step === 5 ? 'block' : 'none';

  // Update review step if on step 5
  if (step === 5) {
    updateCampaignReview();
  }
}

function nextCampaignStep() {
  // Validate current step
  if (currentCampaignStep === 1) {
    newCampaign.name = document.getElementById('campaignName').value;
    newCampaign.goal = document.getElementById('campaignGoal').value;
    newCampaign.dailyLimit = parseInt(document.getElementById('campaignDailyLimit').value);
    newCampaign.duration = parseInt(document.getElementById('campaignDuration').value);

    if (!newCampaign.name) {
      alert('Please enter a campaign name');
      return;
    }
  } else if (currentCampaignStep === 2) {
    newCampaign.targetTitles = document.getElementById('targetTitles').value;
    newCampaign.targetIndustries = document.getElementById('targetIndustries').value;
    newCampaign.targetKeywords = document.getElementById('targetKeywords').value;
    newCampaign.targetLocation = document.getElementById('targetLocation').value;
    newCampaign.targetCompanySize = document.getElementById('targetCompanySize').value;
  } else if (currentCampaignStep === 3) {
    newCampaign.connectionTemplate = document.getElementById('connectionTemplate').value;
  } else if (currentCampaignStep === 4) {
    newCampaign.followup1Delay = parseInt(document.getElementById('followup1Delay').value);
    newCampaign.followup1Message = document.getElementById('followup1Message').value;
    newCampaign.enableFollowup2 = document.getElementById('enableFollowup2').checked;
    if (newCampaign.enableFollowup2) {
      newCampaign.followup2Delay = parseInt(document.getElementById('followup2Delay').value);
      newCampaign.followup2Message = document.getElementById('followup2Message').value;
    }
  }

  showCampaignStep(currentCampaignStep + 1);
}

function prevCampaignStep() {
  showCampaignStep(currentCampaignStep - 1);
}

function updateCampaignReview() {
  document.getElementById('reviewName').textContent = newCampaign.name;
  document.getElementById('reviewGoal').textContent = newCampaign.goal;
  document.getElementById('reviewDailyLimit').textContent = newCampaign.dailyLimit;
  document.getElementById('reviewDuration').textContent = newCampaign.duration;
  document.getElementById('reviewTotal').textContent = newCampaign.dailyLimit * newCampaign.duration;
  document.getElementById('reviewTitles').textContent = newCampaign.targetTitles || 'All';
  document.getElementById('reviewIndustries').textContent = newCampaign.targetIndustries || 'All';
  document.getElementById('reviewLocation').textContent = newCampaign.targetLocation || 'All locations';
  document.getElementById('reviewFollowupSteps').textContent = newCampaign.enableFollowup2 ? '2 follow-ups' : '1 follow-up';
}

async function launchCampaign() {
  // Add campaign settings
  newCampaign.startNow = document.getElementById('startNow').checked;
  newCampaign.skipWeekends = document.getElementById('skipWeekends').checked;
  newCampaign.status = newCampaign.startNow ? 'active' : 'draft';
  newCampaign.created_at = Date.now();
  newCampaign.id = 'campaign_' + Date.now();
  newCampaign.sent = 0;
  newCampaign.connected = 0;
  newCampaign.replies = 0;
  newCampaign.total_target = newCampaign.dailyLimit * newCampaign.duration;

  // Save campaign
  const response = await chrome.runtime.sendMessage({
    action: 'createCampaign',
    campaign: newCampaign
  });

  if (response.success) {
    campaigns.push(newCampaign);
    closeCampaignBuilder();
    navigateTo('campaigns');

    // Show success message
    alert(`Campaign "${newCampaign.name}" created successfully!${newCampaign.startNow ? ' Campaign is now active.' : ' Campaign saved as draft.'}`);
  } else {
    alert('Error creating campaign: ' + response.error);
  }
}

// Settings
function openSettings() {
  document.getElementById('settingsModal').classList.add('active');
  document.getElementById('apiKeyInput').value = apiKey || '';
  document.getElementById('userNameInput').value = userSettings.name || '';
  document.getElementById('userTitleInput').value = userSettings.title || '';
  document.getElementById('globalDailyLimit').value = userSettings.dailyLimit || 50;
}

function closeSettings() {
  document.getElementById('settingsModal').classList.remove('active');
}

async function saveSettings() {
  const newApiKey = document.getElementById('apiKeyInput').value.trim();
  const userName = document.getElementById('userNameInput').value.trim();
  const userTitle = document.getElementById('userTitleInput').value.trim();
  const dailyLimit = parseInt(document.getElementById('globalDailyLimit').value);

  if (newApiKey) {
    apiKey = newApiKey;
    await chrome.runtime.sendMessage({
      action: 'setSetting',
      key: 'claude_api_key',
      value: newApiKey
    });
  }

  await chrome.runtime.sendMessage({ action: 'setSetting', key: 'userName', value: userName });
  await chrome.runtime.sendMessage({ action: 'setSetting', key: 'userTitle', value: userTitle });
  await chrome.runtime.sendMessage({ action: 'setSetting', key: 'dailyLimit', value: dailyLimit });

  userSettings = { name: userName, title: userTitle, dailyLimit };

  closeSettings();
  checkApiStatus();
  alert('Settings saved successfully!');
}

// Export contacts
async function exportContacts() {
  const csv = contactsToCSV(contacts);
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `linkedin-contacts-${Date.now()}.csv`;
  a.click();
}

function contactsToCSV(contacts) {
  const headers = ['Name', 'Title', 'Company', 'Email', 'Phone', 'LinkedIn URL', 'Stage', 'Score', 'Campaign', 'Last Contact', 'Notes'];
  const rows = contacts.map(c => [
    c.name,
    c.title || '',
    c.company || '',
    c.email || '',
    c.phone || '',
    c.linkedinUrl || '',
    c.stage || 'new',
    c.score || 0,
    c.campaign || '',
    c.last_contact ? new Date(c.last_contact).toISOString() : '',
    c.notes || ''
  ]);

  return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
}

// Helper functions
function getInitials(name) {
  if (!name) return '?';
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

function formatStage(stage) {
  const stages = {
    'new': 'New Lead',
    'contacted': 'Contacted',
    'connected': 'Connected',
    'engaged': 'Engaged',
    'qualified': 'Qualified',
    'customer': 'Customer'
  };
  return stages[stage] || stage;
}

function getScoreClass(score) {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

function formatDate(timestamp) {
  if (!timestamp) return '-';
  const date = new Date(timestamp);
  const now = new Date();
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString();
}

function formatTimeAgo(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
}

function viewCampaign(id) {
  console.log('View campaign:', id);
  // TODO: Open campaign detail view
}

function viewContact(id) {
  console.log('View contact:', id);
  // TODO: Open contact detail modal
}

function viewConversation(id) {
  console.log('View conversation:', id);
  // TODO: Load conversation in inbox view
}

function addContact() {
  console.log('Add contact manually');
  // TODO: Open add contact modal
}

// ========== CSV IMPORT & APOLLO.IO INTEGRATION ==========

let csvData = [];
let csvHeaders = [];
let columnMapping = {};
let apolloContacts = [];

// Open import modal
function openImportModal() {
  document.getElementById('importModal').classList.add('active');
  // Reset sections
  document.getElementById('csvUploadSection').style.display = 'none';
  document.getElementById('apolloApiSection').style.display = 'none';
  document.querySelector('.import-options').style.display = 'grid';
}

function closeImportModal() {
  document.getElementById('importModal').classList.remove('active');
  csvData = [];
  csvHeaders = [];
  columnMapping = {};
  apolloContacts = [];
}

// Select import method
function selectImportMethod(method) {
  document.querySelector('.import-options').style.display = 'none';

  if (method === 'csv') {
    document.getElementById('csvUploadSection').style.display = 'block';
  } else if (method === 'apollo') {
    document.getElementById('apolloApiSection').style.display = 'block';
    // Load saved Apollo API key
    loadApolloApiKey();
  }
}

async function loadApolloApiKey() {
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'getSetting',
      key: 'apollo_api_key'
    });
    if (response.success && response.value) {
      document.getElementById('apolloApiKey').value = response.value;
    }
  } catch (error) {
    console.error('Error loading Apollo API key:', error);
  }
}

// Handle CSV file upload
function handleCSVFile(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const csv = e.target.result;
    parseCSV(csv);
  };
  reader.readAsText(file);
}

// Parse CSV
function parseCSV(csv) {
  const lines = csv.split('\n').filter(line => line.trim());
  if (lines.length === 0) {
    alert('CSV file is empty');
    return;
  }

  // Parse headers
  csvHeaders = parseCSVLine(lines[0]);

  // Parse data
  csvData = lines.slice(1).map(line => {
    const values = parseCSVLine(line);
    const row = {};
    csvHeaders.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    return row;
  });

  console.log(`Parsed ${csvData.length} contacts from CSV`);
  showColumnMapping();
}

// Parse CSV line (handles quoted values)
function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}

// Show column mapping interface
function showColumnMapping() {
  const mappingContainer = document.getElementById('columnMappings');
  const ourFields = [
    { value: 'name', label: 'Full Name *' },
    { value: 'first_name', label: 'First Name' },
    { value: 'last_name', label: 'Last Name' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone' },
    { value: 'company', label: 'Company' },
    { value: 'title', label: 'Job Title' },
    { value: 'linkedinUrl', label: 'LinkedIn URL' },
    { value: 'location', label: 'Location' },
    { value: 'industry', label: 'Industry' },
    { value: 'notes', label: 'Notes' },
    { value: 'skip', label: '(Skip this column)' }
  ];

  // Auto-detect common mappings
  const autoMappings = {
    'name': ['name', 'full name', 'contact name', 'person name'],
    'first_name': ['first name', 'firstname', 'first'],
    'last_name': ['last name', 'lastname', 'last'],
    'email': ['email', 'email address', 'e-mail', 'contact email'],
    'phone': ['phone', 'phone number', 'mobile', 'cell', 'telephone'],
    'company': ['company', 'company name', 'organization', 'account name'],
    'title': ['title', 'job title', 'position', 'role'],
    'linkedinUrl': ['linkedin', 'linkedin url', 'linkedin profile', 'profile url'],
    'location': ['location', 'city', 'state', 'country', 'region'],
    'industry': ['industry', 'sector', 'vertical'],
    'notes': ['notes', 'description', 'comments']
  };

  columnMapping = {};

  mappingContainer.innerHTML = csvHeaders.map((header, index) => {
    // Auto-detect mapping
    let suggested = 'skip';
    const headerLower = header.toLowerCase().trim();

    for (const [field, patterns] of Object.entries(autoMappings)) {
      if (patterns.some(pattern => headerLower.includes(pattern))) {
        suggested = field;
        break;
      }
    }

    columnMapping[header] = suggested;

    return `
      <div class="column-mapping-row">
        <div><strong>${header}</strong></div>
        <div class="mapping-arrow">→</div>
        <select data-csv-column="${header}" onchange="updateMapping('${header}', this.value)">
          ${ourFields.map(field =>
            `<option value="${field.value}" ${field.value === suggested ? 'selected' : ''}>${field.label}</option>`
          ).join('')}
        </select>
      </div>
    `;
  }).join('');

  document.getElementById('csvMapping').style.display = 'block';
  showPreview();
}

function updateMapping(csvColumn, ourField) {
  columnMapping[csvColumn] = ourField;
  showPreview();
}

// Show preview
function showPreview() {
  const preview = csvData.slice(0, 5);
  const mappedFields = Object.values(columnMapping).filter(v => v !== 'skip');

  const previewHTML = `
    <table>
      <thead>
        <tr>${mappedFields.map(field => `<th>${field}</th>`).join('')}</tr>
      </thead>
      <tbody>
        ${preview.map(row => {
          const mapped = {};
          for (const [csvCol, ourField] of Object.entries(columnMapping)) {
            if (ourField !== 'skip') {
              mapped[ourField] = row[csvCol] || '';
            }
          }
          return `<tr>${mappedFields.map(field => `<td>${mapped[field] || '-'}</td>`).join('')}</tr>`;
        }).join('')}
      </tbody>
    </table>
  `;

  document.getElementById('previewTable').innerHTML = previewHTML;
  document.getElementById('totalRowsCount').textContent = `Ready to import ${csvData.length} contacts`;
  document.getElementById('importPreview').style.display = 'block';
}

// Confirm import
async function confirmImport() {
  if (csvData.length === 0) {
    alert('No data to import');
    return;
  }

  // Check if name field is mapped
  const hasName = Object.values(columnMapping).includes('name') ||
                  (Object.values(columnMapping).includes('first_name') &&
                   Object.values(columnMapping).includes('last_name'));

  if (!hasName) {
    alert('Please map either "Full Name" or both "First Name" and "Last Name"');
    return;
  }

  const importBtn = document.getElementById('confirmImportBtn');
  importBtn.textContent = 'Importing...';
  importBtn.disabled = true;

  let imported = 0;
  let errors = 0;

  for (const row of csvData) {
    const contact = {};

    // Map fields
    for (const [csvCol, ourField] of Object.entries(columnMapping)) {
      if (ourField !== 'skip') {
        contact[ourField] = row[csvCol] || '';
      }
    }

    // Combine first/last name if needed
    if (!contact.name && contact.first_name && contact.last_name) {
      contact.name = `${contact.first_name} ${contact.last_name}`.trim();
    }

    // Add metadata
    contact.id = 'contact_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    contact.created_at = Date.now();
    contact.stage = 'new';
    contact.score = 0;
    contact.source = 'csv_import';

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'addContact',
        contact: contact
      });

      if (response.success) {
        imported++;
        contacts.push(contact);
      } else {
        errors++;
      }
    } catch (error) {
      console.error('Error importing contact:', error);
      errors++;
    }
  }

  importBtn.textContent = 'Import All Contacts';
  importBtn.disabled = false;

  closeImportModal();
  renderContacts();
  alert(`Import complete!\n\nImported: ${imported}\nErrors: ${errors}`);
}

// ========== APOLLO.IO API INTEGRATION ==========

async function searchApollo() {
  const apiKey = document.getElementById('apolloApiKey').value.trim();
  const query = document.getElementById('apolloSearchQuery').value.trim();
  const titles = document.getElementById('apolloTitles').value.trim();
  const location = document.getElementById('apolloLocation').value.trim();
  const industry = document.getElementById('apolloIndustry').value.trim();
  const maxResults = parseInt(document.getElementById('apolloMaxResults').value);

  if (!apiKey) {
    alert('Please enter your Apollo.io API key');
    return;
  }

  // Save API key for future use
  await chrome.runtime.sendMessage({
    action: 'setSetting',
    key: 'apollo_api_key',
    value: apiKey
  });

  const searchBtn = document.getElementById('apolloSearchBtn');
  searchBtn.textContent = '🔍 Searching...';
  searchBtn.disabled = true;

  try {
    // Apollo.io API v1 - People Search
    const requestBody = {
      api_key: apiKey,
      q_keywords: query,
      person_titles: titles ? titles.split(',').map(t => t.trim()) : [],
      person_locations: location ? [location] : [],
      organization_industry_tag_ids: industry ? [industry] : [],
      page: 1,
      per_page: Math.min(maxResults, 100)
    };

    const response = await fetch('https://api.apollo.io/v1/mixed_people/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Apollo API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    apolloContacts = data.people || [];

    // Transform Apollo format to our format
    apolloContacts = apolloContacts.map(person => ({
      name: person.name,
      first_name: person.first_name,
      last_name: person.last_name,
      email: person.email,
      phone: person.phone_numbers && person.phone_numbers[0] ? person.phone_numbers[0].raw_number : '',
      company: person.organization && person.organization.name,
      title: person.title,
      linkedinUrl: person.linkedin_url,
      location: person.city && person.state ? `${person.city}, ${person.state}` : person.city || person.state || '',
      industry: person.organization && person.organization.industry,
      source: 'apollo_api',
      stage: 'new',
      score: 0,
      created_at: Date.now(),
      id: 'contact_apollo_' + (person.id || Math.random().toString(36).substr(2, 9))
    }));

    displayApolloResults();

  } catch (error) {
    console.error('Apollo API error:', error);
    alert('Error searching Apollo.io:\n\n' + error.message + '\n\nMake sure your API key is valid and you have credits available.');
  } finally {
    searchBtn.textContent = '🔍 Search Apollo Database';
    searchBtn.disabled = false;
  }
}

function displayApolloResults() {
  if (apolloContacts.length === 0) {
    alert('No contacts found. Try adjusting your search criteria.');
    return;
  }

  document.getElementById('apolloResultCount').textContent = apolloContacts.length;

  const previewHTML = apolloContacts.slice(0, 10).map(contact => `
    <div class="apollo-contact-item">
      <div class="apollo-contact-info">
        <div class="apollo-contact-name">${contact.name}</div>
        <div class="apollo-contact-meta">
          ${contact.title || 'No title'} at ${contact.company || 'Unknown company'}
          ${contact.email ? ' • ' + contact.email : ''}
        </div>
      </div>
    </div>
  `).join('');

  document.getElementById('apolloPreview').innerHTML = previewHTML;
  if (apolloContacts.length > 10) {
    document.getElementById('apolloPreview').innerHTML += `
      <p style="text-align: center; color: var(--text-muted); margin-top: 12px;">
        ... and ${apolloContacts.length - 10} more contacts
      </p>
    `;
  }

  document.getElementById('apolloResults').style.display = 'block';
}

async function importApolloContacts() {
  if (apolloContacts.length === 0) {
    alert('No contacts to import');
    return;
  }

  const importBtn = document.getElementById('apolloImportBtn');
  importBtn.textContent = 'Importing...';
  importBtn.disabled = true;

  let imported = 0;
  let errors = 0;

  for (const contact of apolloContacts) {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'addContact',
        contact: contact
      });

      if (response.success) {
        imported++;
        contacts.push(contact);
      } else {
        errors++;
      }
    } catch (error) {
      console.error('Error importing contact:', error);
      errors++;
    }
  }

  importBtn.textContent = 'Import to CRM';
  importBtn.disabled = false;

  closeImportModal();
  renderContacts();
  alert(`Apollo.io import complete!\n\nImported: ${imported}\nErrors: ${errors}`);
}

// Make functions globally available
window.selectImportMethod = selectImportMethod;
window.updateMapping = updateMapping;
