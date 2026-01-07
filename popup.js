// Popup UI Controller
document.addEventListener('DOMContentLoaded', async () => {
  await initializeUI();
  setupEventListeners();
  await loadDashboard();
});

// Tab management
function setupEventListeners() {
  // Tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabName = btn.dataset.tab;
      switchTab(tabName);
    });
  });

  // Dashboard actions
  document.getElementById('captureProfile').addEventListener('click', captureCurrentProfile);
  document.getElementById('startOutreach').addEventListener('click', () => switchTab('outreach'));
  document.getElementById('exportData').addEventListener('click', exportData);
  document.getElementById('importData').addEventListener('click', () => {
    document.getElementById('importFileInput').click();
  });
  document.getElementById('importFileInput').addEventListener('change', importData);

  // Contacts
  document.getElementById('searchContacts').addEventListener('input', debounce(loadContacts, 300));
  document.getElementById('filterStatus').addEventListener('change', loadContacts);
  document.getElementById('filterCompany').addEventListener('change', loadContacts);
  document.getElementById('refreshContacts').addEventListener('click', loadContacts);

  // Outreach
  document.getElementById('saveCampaign').addEventListener('click', saveCampaign);

  // Settings
  document.getElementById('autoCaptureProfiles').addEventListener('change', saveSettings);
  document.getElementById('captureConnections').addEventListener('change', saveSettings);
  document.getElementById('dailyLimit').addEventListener('change', saveSettings);
  document.getElementById('actionDelay').addEventListener('change', saveSettings);
  document.getElementById('clearDatabase').addEventListener('click', clearDatabase);
  document.getElementById('viewStats').addEventListener('click', viewStats);
}

function switchTab(tabName) {
  // Update tab buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.tab === tabName) {
      btn.classList.add('active');
    }
  });

  // Update tab content
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });
  document.getElementById(tabName).classList.add('active');

  // Load tab-specific data
  switch (tabName) {
    case 'dashboard':
      loadDashboard();
      break;
    case 'contacts':
      loadContacts();
      break;
    case 'outreach':
      loadCampaigns();
      break;
    case 'settings':
      loadSettings();
      break;
  }
}

// Dashboard
async function loadDashboard() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getStats' });
    if (response.success) {
      updateStats(response.stats);
    }

    const activityResponse = await chrome.runtime.sendMessage({
      action: 'getActivity',
      limit: 10
    });
    if (activityResponse.success) {
      displayActivity(activityResponse.activity);
    }
  } catch (error) {
    console.error('Error loading dashboard:', error);
  }
}

function updateStats(stats) {
  document.getElementById('totalContacts').textContent = stats.totalContacts || 0;
  document.getElementById('totalOutreach').textContent = stats.totalOutreach || 0;
  document.getElementById('totalConnections').textContent = stats.connectedContacts || 0;
}

function displayActivity(activities) {
  const activityList = document.getElementById('activityList');

  if (activities.length === 0) {
    activityList.innerHTML = '<p class="empty-state">No recent activity</p>';
    return;
  }

  activityList.innerHTML = activities.map(activity => `
    <div class="activity-item">
      <div>${activity.description}</div>
      <div class="activity-time">${formatTime(activity.timestamp)}</div>
    </div>
  `).join('');
}

// Contacts
async function loadContacts() {
  try {
    const filter = {
      status: document.getElementById('filterStatus').value,
      company: document.getElementById('filterCompany').value,
      search: document.getElementById('searchContacts').value
    };

    const response = await chrome.runtime.sendMessage({
      action: 'getContacts',
      filter
    });

    if (response.success) {
      displayContacts(response.contacts);
      updateCompanyFilter(response.contacts);
    }
  } catch (error) {
    console.error('Error loading contacts:', error);
  }
}

function displayContacts(contacts) {
  const contactsList = document.getElementById('contactsList');

  if (contacts.length === 0) {
    contactsList.innerHTML = '<p class="empty-state">No contacts found</p>';
    return;
  }

  contactsList.innerHTML = contacts.map(contact => `
    <div class="contact-card" data-id="${contact.id}">
      <div class="contact-avatar">${getInitials(contact.name)}</div>
      <div class="contact-info">
        <div class="contact-name">${escapeHtml(contact.name)}</div>
        <div class="contact-title">${escapeHtml(contact.title || 'No title')}</div>
        <div class="contact-company">${escapeHtml(contact.company || 'No company')}</div>
      </div>
      <span class="contact-status status-${contact.status}">${formatStatus(contact.status)}</span>
    </div>
  `).join('');

  // Add click listeners
  contactsList.querySelectorAll('.contact-card').forEach(card => {
    card.addEventListener('click', () => {
      const contactId = parseInt(card.dataset.id);
      viewContactDetails(contactId);
    });
  });
}

function updateCompanyFilter(contacts) {
  const companies = [...new Set(contacts.map(c => c.company).filter(Boolean))];
  const filterCompany = document.getElementById('filterCompany');

  const currentValue = filterCompany.value;
  filterCompany.innerHTML = '<option value="all">All Companies</option>' +
    companies.map(company => `<option value="${escapeHtml(company)}">${escapeHtml(company)}</option>`).join('');
  filterCompany.value = currentValue;
}

async function viewContactDetails(contactId) {
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'getContact',
      id: contactId
    });

    if (response.success && response.contact) {
      const contact = response.contact;
      alert(`Contact Details:\n\nName: ${contact.name}\nTitle: ${contact.title || 'N/A'}\nCompany: ${contact.company || 'N/A'}\nLocation: ${contact.location || 'N/A'}\nStatus: ${formatStatus(contact.status)}\nProfile: ${contact.profileUrl}`);
    }
  } catch (error) {
    console.error('Error viewing contact:', error);
  }
}

// Campaigns
async function loadCampaigns() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getCampaigns' });

    if (response.success) {
      displayCampaigns(response.campaigns);
    }
  } catch (error) {
    console.error('Error loading campaigns:', error);
  }
}

function displayCampaigns(campaigns) {
  const campaignsList = document.getElementById('campaignsList');

  if (campaigns.length === 0) {
    campaignsList.innerHTML = '<p class="empty-state">No campaigns yet</p>';
    return;
  }

  campaignsList.innerHTML = campaigns.map(campaign => `
    <div class="campaign-card">
      <div class="campaign-name">${escapeHtml(campaign.name)}</div>
      <div class="campaign-stats">
        <span>Sent: ${campaign.sent || 0}</span>
        <span>Connected: ${campaign.connected || 0}</span>
        <span>Responses: ${campaign.responses || 0}</span>
      </div>
    </div>
  `).join('');
}

async function saveCampaign() {
  const name = document.getElementById('campaignName').value.trim();
  const messageTemplate = document.getElementById('messageTemplate').value.trim();
  const autoConnect = document.getElementById('autoConnect').checked;

  if (!name || !messageTemplate) {
    alert('Please fill in campaign name and message template');
    return;
  }

  try {
    const response = await chrome.runtime.sendMessage({
      action: 'addCampaign',
      campaign: {
        name,
        messageTemplate,
        autoConnect,
        active: true
      }
    });

    if (response.success) {
      document.getElementById('campaignName').value = '';
      document.getElementById('messageTemplate').value = '';
      document.getElementById('autoConnect').checked = false;
      showMessage('Campaign created successfully!');
      loadCampaigns();
    }
  } catch (error) {
    console.error('Error saving campaign:', error);
    showMessage('Error creating campaign', true);
  }
}

// Settings
async function loadSettings() {
  try {
    const settings = {
      autoCaptureProfiles: await getSetting('autoCaptureProfiles', false),
      captureConnections: await getSetting('captureConnections', false),
      dailyLimit: await getSetting('dailyLimit', 20),
      actionDelay: await getSetting('actionDelay', 5)
    };

    document.getElementById('autoCaptureProfiles').checked = settings.autoCaptureProfiles;
    document.getElementById('captureConnections').checked = settings.captureConnections;
    document.getElementById('dailyLimit').value = settings.dailyLimit;
    document.getElementById('actionDelay').value = settings.actionDelay;
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

async function saveSettings() {
  try {
    await setSetting('autoCaptureProfiles', document.getElementById('autoCaptureProfiles').checked);
    await setSetting('captureConnections', document.getElementById('captureConnections').checked);
    await setSetting('dailyLimit', parseInt(document.getElementById('dailyLimit').value));
    await setSetting('actionDelay', parseInt(document.getElementById('actionDelay').value));

    showMessage('Settings saved!');
  } catch (error) {
    console.error('Error saving settings:', error);
    showMessage('Error saving settings', true);
  }
}

async function clearDatabase() {
  if (!confirm('Are you sure you want to clear all data? This cannot be undone.')) {
    return;
  }

  try {
    const response = await chrome.runtime.sendMessage({ action: 'clearDatabase' });
    if (response.success) {
      showMessage('Database cleared successfully!');
      loadDashboard();
    }
  } catch (error) {
    console.error('Error clearing database:', error);
    showMessage('Error clearing database', true);
  }
}

async function viewStats() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getStats' });
    if (response.success) {
      const stats = response.stats;
      alert(`Database Statistics:\n\nTotal Contacts: ${stats.totalContacts}\nConnected: ${stats.connectedContacts}\nPending: ${stats.pendingContacts}\nTotal Campaigns: ${stats.totalCampaigns}\nActive Campaigns: ${stats.activeCampaigns}\nTotal Outreach: ${stats.totalOutreach}\nCompanies: ${stats.companies.length}`);
    }
  } catch (error) {
    console.error('Error viewing stats:', error);
  }
}

// Actions
async function captureCurrentProfile() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab.url.includes('linkedin.com')) {
      showMessage('Please navigate to a LinkedIn page', true);
      return;
    }

    await chrome.tabs.sendMessage(tab.id, { action: 'captureCurrentProfile' });
    showMessage('Profile capture initiated!');

    // Refresh after a delay
    setTimeout(loadDashboard, 1000);
  } catch (error) {
    console.error('Error capturing profile:', error);
    showMessage('Error capturing profile', true);
  }
}

async function exportData() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'exportData' });

    if (response.success) {
      const dataStr = JSON.stringify(response.data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `linkedin-outreach-export-${new Date().toISOString().split('T')[0]}.json`;
      link.click();

      URL.revokeObjectURL(url);
      showMessage('Data exported successfully!');
    }
  } catch (error) {
    console.error('Error exporting data:', error);
    showMessage('Error exporting data', true);
  }
}

async function importData(event) {
  const file = event.target.files[0];
  if (!file) return;

  try {
    const text = await file.text();
    const data = JSON.parse(text);

    const response = await chrome.runtime.sendMessage({
      action: 'importData',
      data
    });

    if (response.success) {
      showMessage('Data imported successfully!');
      loadDashboard();
      loadContacts();
    }
  } catch (error) {
    console.error('Error importing data:', error);
    showMessage('Error importing data', true);
  }

  // Reset file input
  event.target.value = '';
}

// Utility functions
async function initializeUI() {
  // Any initialization code
}

async function getSetting(key, defaultValue) {
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'getSetting',
      key
    });
    return response.success && response.value !== undefined ? response.value : defaultValue;
  } catch (error) {
    return defaultValue;
  }
}

async function setSetting(key, value) {
  return await chrome.runtime.sendMessage({
    action: 'setSetting',
    key,
    value
  });
}

function showMessage(message, isError = false) {
  // Simple alert for now - could be enhanced with a toast notification
  console.log(isError ? 'Error:' : 'Success:', message);
}

function formatTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

function formatStatus(status) {
  const statusMap = {
    'connected': 'Connected',
    'pending': 'Pending',
    'rejected': 'Rejected',
    'not_contacted': 'Not Contacted'
  };
  return statusMap[status] || status;
}

function getInitials(name) {
  if (!name) return '?';
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
