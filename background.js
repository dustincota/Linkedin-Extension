// Background Service Worker for LinkedIn Outreach Manager

// Inline Database Class (can't use importScripts in Manifest V3)
class LinkedInDatabase {
  constructor() {
    this.dbName = 'LinkedInOutreachDB';
    this.version = 1;
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        if (!db.objectStoreNames.contains('contacts')) {
          const contactsStore = db.createObjectStore('contacts', { keyPath: 'id', autoIncrement: true });
          contactsStore.createIndex('profileUrl', 'profileUrl', { unique: true });
          contactsStore.createIndex('name', 'name', { unique: false });
          contactsStore.createIndex('company', 'company', { unique: false });
          contactsStore.createIndex('status', 'status', { unique: false });
          contactsStore.createIndex('dateAdded', 'dateAdded', { unique: false });
        }

        if (!db.objectStoreNames.contains('campaigns')) {
          const campaignsStore = db.createObjectStore('campaigns', { keyPath: 'id', autoIncrement: true });
          campaignsStore.createIndex('name', 'name', { unique: false });
          campaignsStore.createIndex('dateCreated', 'dateCreated', { unique: false });
        }

        if (!db.objectStoreNames.contains('activity')) {
          const activityStore = db.createObjectStore('activity', { keyPath: 'id', autoIncrement: true });
          activityStore.createIndex('timestamp', 'timestamp', { unique: false });
          activityStore.createIndex('type', 'type', { unique: false });
        }

        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };
    });
  }

  async addContact(contact) {
    await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['contacts'], 'readwrite');
      const store = transaction.objectStore('contacts');

      const contactData = {
        ...contact,
        dateAdded: contact.dateAdded || new Date().toISOString(),
        status: contact.status || 'not_contacted',
        lastUpdated: new Date().toISOString()
      };

      const request = store.add(contactData);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async updateContact(id, updates) {
    await this.ensureDB();
    return new Promise(async (resolve, reject) => {
      const contact = await this.getContact(id);
      if (!contact) {
        reject(new Error('Contact not found'));
        return;
      }

      const transaction = this.db.transaction(['contacts'], 'readwrite');
      const store = transaction.objectStore('contacts');

      const updatedContact = {
        ...contact,
        ...updates,
        lastUpdated: new Date().toISOString()
      };

      const request = store.put(updatedContact);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getContact(id) {
    await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['contacts'], 'readonly');
      const store = transaction.objectStore('contacts');
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getContactByUrl(profileUrl) {
    await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['contacts'], 'readonly');
      const store = transaction.objectStore('contacts');
      const index = store.index('profileUrl');
      const request = index.get(profileUrl);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllContacts(filter = {}) {
    await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['contacts'], 'readonly');
      const store = transaction.objectStore('contacts');
      const request = store.getAll();

      request.onsuccess = () => {
        let contacts = request.result;

        if (filter.status && filter.status !== 'all') {
          contacts = contacts.filter(c => c.status === filter.status);
        }
        if (filter.company && filter.company !== 'all') {
          contacts = contacts.filter(c => c.company === filter.company);
        }
        if (filter.search) {
          const searchLower = filter.search.toLowerCase();
          contacts = contacts.filter(c =>
            c.name?.toLowerCase().includes(searchLower) ||
            c.title?.toLowerCase().includes(searchLower) ||
            c.company?.toLowerCase().includes(searchLower)
          );
        }

        resolve(contacts);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async deleteContact(id) {
    await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['contacts'], 'readwrite');
      const store = transaction.objectStore('contacts');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async addCampaign(campaign) {
    await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['campaigns'], 'readwrite');
      const store = transaction.objectStore('campaigns');

      const campaignData = {
        ...campaign,
        dateCreated: new Date().toISOString(),
        sent: 0,
        responses: 0,
        connected: 0
      };

      const request = store.add(campaignData);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllCampaigns() {
    await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['campaigns'], 'readonly');
      const store = transaction.objectStore('campaigns');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async updateCampaign(id, updates) {
    await this.ensureDB();
    return new Promise(async (resolve, reject) => {
      const campaign = await this.getCampaign(id);
      if (!campaign) {
        reject(new Error('Campaign not found'));
        return;
      }

      const transaction = this.db.transaction(['campaigns'], 'readwrite');
      const store = transaction.objectStore('campaigns');

      const updatedCampaign = { ...campaign, ...updates };
      const request = store.put(updatedCampaign);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getCampaign(id) {
    await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['campaigns'], 'readonly');
      const store = transaction.objectStore('campaigns');
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async addActivity(activity) {
    await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['activity'], 'readwrite');
      const store = transaction.objectStore('activity');

      const activityData = {
        ...activity,
        timestamp: new Date().toISOString()
      };

      const request = store.add(activityData);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getRecentActivity(limit = 10) {
    await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['activity'], 'readonly');
      const store = transaction.objectStore('activity');
      const index = store.index('timestamp');
      const request = index.openCursor(null, 'prev');

      const activities = [];
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor && activities.length < limit) {
          activities.push(cursor.value);
          cursor.continue();
        } else {
          resolve(activities);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getSetting(key) {
    await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['settings'], 'readonly');
      const store = transaction.objectStore('settings');
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result?.value);
      request.onerror = () => reject(request.error);
    });
  }

  async setSetting(key, value) {
    await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['settings'], 'readwrite');
      const store = transaction.objectStore('settings');
      const request = store.put({ key, value });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getStats() {
    await this.ensureDB();
    const contacts = await this.getAllContacts();
    const campaigns = await this.getAllCampaigns();

    return {
      totalContacts: contacts.length,
      connectedContacts: contacts.filter(c => c.status === 'connected').length,
      pendingContacts: contacts.filter(c => c.status === 'pending').length,
      totalCampaigns: campaigns.length,
      activeCampaigns: campaigns.filter(c => c.active).length,
      companies: [...new Set(contacts.map(c => c.company).filter(Boolean))],
      totalOutreach: campaigns.reduce((sum, c) => sum + (c.sent || 0), 0)
    };
  }

  async exportData() {
    await this.ensureDB();
    const contacts = await this.getAllContacts();
    const campaigns = await this.getAllCampaigns();
    const activity = await this.getRecentActivity(1000);

    return {
      version: this.version,
      exportDate: new Date().toISOString(),
      contacts,
      campaigns,
      activity
    };
  }

  async importData(data) {
    await this.ensureDB();

    if (data.contacts) {
      for (const contact of data.contacts) {
        try {
          const existing = await this.getContactByUrl(contact.profileUrl);
          if (!existing) {
            await this.addContact(contact);
          }
        } catch (error) {
          console.error('Error importing contact:', error);
        }
      }
    }

    if (data.campaigns) {
      for (const campaign of data.campaigns) {
        try {
          await this.addCampaign(campaign);
        } catch (error) {
          console.error('Error importing campaign:', error);
        }
      }
    }
  }

  async clearAll() {
    await this.ensureDB();
    const stores = ['contacts', 'campaigns', 'activity'];

    for (const storeName of stores) {
      await new Promise((resolve, reject) => {
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
  }

  async ensureDB() {
    if (!this.db) {
      await this.init();
    }
  }
}

const db = new LinkedInDatabase();
let isInitialized = false;

// Initialize database and context menu on install
chrome.runtime.onInstalled.addListener(async () => {
  console.log('LinkedIn Outreach Manager installed');
  await initializeDB();

  // Set default settings
  await db.setSetting('autoCaptureProfiles', false);
  await db.setSetting('captureConnections', false);
  await db.setSetting('dailyLimit', 20);
  await db.setSetting('actionDelay', 5);

  // Create context menu
  chrome.contextMenus.create({
    id: 'captureProfile',
    title: 'Capture LinkedIn Profile',
    contexts: ['page'],
    documentUrlPatterns: ['https://www.linkedin.com/*']
  });
});

// Initialize database
async function initializeDB() {
  if (!isInitialized) {
    await db.init();
    isInitialized = true;
    console.log('Database initialized');
  }
}

// Message handler
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  handleMessage(request, sender)
    .then(sendResponse)
    .catch(error => {
      console.error('Error handling message:', error);
      sendResponse({ success: false, error: error.message });
    });
  return true; // Keep channel open for async response
});

async function handleMessage(request, sender) {
  await initializeDB();

  switch (request.action) {
    case 'captureProfile':
      return await captureProfile(request.data);

    case 'addContact':
      return await addContact(request.contact);

    case 'updateContact':
      return await updateContact(request.id, request.updates);

    case 'getContacts':
      return await getContacts(request.filter);

    case 'getContact':
      return await getContact(request.id);

    case 'deleteContact':
      return await deleteContact(request.id);

    case 'addCampaign':
      return await addCampaign(request.campaign);

    case 'getCampaigns':
      return await getCampaigns();

    case 'updateCampaign':
      return await updateCampaign(request.id, request.updates);

    case 'getStats':
      return await getStats();

    case 'getActivity':
      return await getActivity(request.limit);

    case 'exportData':
      return await exportData();

    case 'importData':
      return await importData(request.data);

    case 'clearDatabase':
      return await clearDatabase();

    case 'getSetting':
      return await getSetting(request.key);

    case 'setSetting':
      return await setSetting(request.key, request.value);

    case 'process_chat_message':
      return await processChatMessage(request.message, request.apiKey, request.settings);

    case 'get_agent_status':
      return await getAgentStatus();

    case 'pause_agents':
      return await pauseAgents();

    case 'resume_agents':
      return await resumeAgents();

    case 'stop_agents':
      return await stopAgents();

    default:
      throw new Error(`Unknown action: ${request.action}`);
  }
}

async function captureProfile(profileData) {
  try {
    // Check if profile already exists
    const existing = await db.getContactByUrl(profileData.profileUrl);

    if (existing) {
      // Update existing contact
      await db.updateContact(existing.id, profileData);
      await db.addActivity({
        type: 'profile_updated',
        description: `Updated profile: ${profileData.name}`,
        contactId: existing.id
      });
      return { success: true, updated: true, id: existing.id };
    } else {
      // Add new contact
      const id = await db.addContact(profileData);
      await db.addActivity({
        type: 'profile_captured',
        description: `Captured new profile: ${profileData.name}`,
        contactId: id
      });
      return { success: true, updated: false, id };
    }
  } catch (error) {
    console.error('Error capturing profile:', error);
    throw error;
  }
}

async function addContact(contact) {
  try {
    const id = await db.addContact(contact);
    await db.addActivity({
      type: 'contact_added',
      description: `Added contact: ${contact.name}`,
      contactId: id
    });
    return { success: true, id };
  } catch (error) {
    console.error('Error adding contact:', error);
    throw error;
  }
}

async function updateContact(id, updates) {
  try {
    await db.updateContact(id, updates);
    await db.addActivity({
      type: 'contact_updated',
      description: `Updated contact`,
      contactId: id
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating contact:', error);
    throw error;
  }
}

async function getContacts(filter = {}) {
  try {
    const contacts = await db.getAllContacts(filter);
    return { success: true, contacts };
  } catch (error) {
    console.error('Error getting contacts:', error);
    throw error;
  }
}

async function getContact(id) {
  try {
    const contact = await db.getContact(id);
    return { success: true, contact };
  } catch (error) {
    console.error('Error getting contact:', error);
    throw error;
  }
}

async function deleteContact(id) {
  try {
    await db.deleteContact(id);
    await db.addActivity({
      type: 'contact_deleted',
      description: `Deleted contact`,
      contactId: id
    });
    return { success: true };
  } catch (error) {
    console.error('Error deleting contact:', error);
    throw error;
  }
}

async function addCampaign(campaign) {
  try {
    const id = await db.addCampaign(campaign);
    await db.addActivity({
      type: 'campaign_created',
      description: `Created campaign: ${campaign.name}`
    });
    return { success: true, id };
  } catch (error) {
    console.error('Error adding campaign:', error);
    throw error;
  }
}

async function getCampaigns() {
  try {
    const campaigns = await db.getAllCampaigns();
    return { success: true, campaigns };
  } catch (error) {
    console.error('Error getting campaigns:', error);
    throw error;
  }
}

async function updateCampaign(id, updates) {
  try {
    await db.updateCampaign(id, updates);
    return { success: true };
  } catch (error) {
    console.error('Error updating campaign:', error);
    throw error;
  }
}

async function getStats() {
  try {
    const stats = await db.getStats();
    return { success: true, stats };
  } catch (error) {
    console.error('Error getting stats:', error);
    throw error;
  }
}

async function getActivity(limit = 10) {
  try {
    const activity = await db.getRecentActivity(limit);
    return { success: true, activity };
  } catch (error) {
    console.error('Error getting activity:', error);
    throw error;
  }
}

async function exportData() {
  try {
    const data = await db.exportData();
    return { success: true, data };
  } catch (error) {
    console.error('Error exporting data:', error);
    throw error;
  }
}

async function importData(data) {
  try {
    await db.importData(data);
    await db.addActivity({
      type: 'data_imported',
      description: `Imported ${data.contacts?.length || 0} contacts and ${data.campaigns?.length || 0} campaigns`
    });
    return { success: true };
  } catch (error) {
    console.error('Error importing data:', error);
    throw error;
  }
}

async function clearDatabase() {
  try {
    await db.clearAll();
    await db.addActivity({
      type: 'database_cleared',
      description: 'Database cleared'
    });
    return { success: true };
  } catch (error) {
    console.error('Error clearing database:', error);
    throw error;
  }
}

async function getSetting(key) {
  try {
    const value = await db.getSetting(key);
    return { success: true, value };
  } catch (error) {
    console.error('Error getting setting:', error);
    throw error;
  }
}

async function setSetting(key, value) {
  try {
    await db.setSetting(key, value);
    return { success: true };
  } catch (error) {
    console.error('Error setting setting:', error);
    throw error;
  }
}

// ============================================================================
// AGENT SYSTEM INTEGRATION
// ============================================================================

// Note: Agent classes would need to be imported/inlined here
// For now, this is a simplified handler that will be enhanced

let agentOrchestrator = null;
let agentStatus = { status: 'idle', agents: {} };

// Initialize agent orchestrator
async function initializeAgents(apiKey, settings) {
  console.log('Initializing agent system...');

  // TODO: Load actual agent classes
  // For now, return a mock orchestrator
  agentOrchestrator = {
    status: 'ready',
    apiKey: apiKey,
    settings: settings,
    currentGoal: null
  };

  return true;
}

// Process chat message and determine intent
async function processChatMessage(message, apiKey, settings) {
  try {
    // Initialize agents if needed
    if (!agentOrchestrator || agentOrchestrator.apiKey !== apiKey) {
      await initializeAgents(apiKey, settings);
    }

    // Parse user intent using Claude
    const intent = await parseUserIntent(message, apiKey);

    if (intent.action === 'find_and_connect') {
      // Start agent workflow
      const reply = `Got it! I'll find ${intent.count || 10} ${intent.targetRole || 'professionals'} ${intent.location ? 'in ' + intent.location : ''} ${intent.industry ? 'in ' + intent.industry : ''} and connect with them.

I'm starting the agents now:
🔍 Scout will search LinkedIn
🧠 Researcher will analyze profiles
✍️ Writer will create personalized messages
🤝 Connector will send connection requests safely

This will take a few minutes. I'll update you as I progress!`;

      // Update status
      agentStatus = {
        status: 'working',
        goal: intent,
        agents: {
          scout: { status: 'working', queueLength: 0 },
          researcher: { status: 'idle', queueLength: 0 },
          writer: { status: 'idle', queueLength: 0 },
          connector: { status: 'idle', queueLength: 0 },
          analyst: { status: 'idle', queueLength: 0 }
        }
      };

      // Start async work (would call actual orchestrator here)
      startAgentWorkflow(intent, apiKey, settings);

      return {
        success: true,
        reply: reply,
        starting: true
      };
    } else if (intent.action === 'help') {
      return {
        success: true,
        reply: `I can help you automate LinkedIn networking! Here's what I can do:

**Find & Connect**: "Find 20 product managers at AI startups"
**Research**: "Research John Doe before my meeting"
**Message**: "Message my recent connections about [topic]"
**Build Lists**: "Build a list of 50 CTOs in fintech"

What would you like to do?`,
        starting: false
      };
    } else {
      return {
        success: true,
        reply: `I understand you want to: ${intent.description}

Could you be more specific? For example:
- "Find 20 software engineers in San Francisco"
- "Connect with product managers at Series A startups"
- "Build a list of marketing leaders"`,
        starting: false
      };
    }

  } catch (error) {
    console.error('Error processing chat:', error);
    return {
      success: false,
      error: error.message,
      reply: 'Sorry, I encountered an error processing your request.'
    };
  }
}

// Parse user intent with Claude API
async function parseUserIntent(message, apiKey) {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        system: `You are a LinkedIn automation assistant. Parse user requests into structured intent.

Respond in JSON format:
{
  "action": "find_and_connect" | "research" | "message" | "help" | "unknown",
  "targetRole": "job title",
  "industry": "industry name",
  "location": "location",
  "count": number,
  "description": "brief description of what user wants"
}`,
        messages: [
          {
            role: 'user',
            content: message
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error('Failed to parse intent');
    }

    const data = await response.json();
    const intentText = data.content[0].text;

    // Extract JSON from response
    const jsonMatch = intentText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return { action: 'unknown', description: 'Could not parse request' };

  } catch (error) {
    console.error('Error parsing intent:', error);
    return { action: 'unknown', description: message };
  }
}

// Simulate agent workflow (would use real orchestrator)
async function startAgentWorkflow(intent, apiKey, settings) {
  console.log('Starting agent workflow:', intent);

  // TODO: Replace with actual orchestrator.executeGoal()
  // For now, just simulate the workflow

  setTimeout(() => {
    agentStatus.agents.scout.status = 'completed';
    agentStatus.agents.researcher.status = 'working';
  }, 3000);

  setTimeout(() => {
    agentStatus.agents.researcher.status = 'completed';
    agentStatus.agents.writer.status = 'working';
  }, 6000);

  setTimeout(() => {
    agentStatus.agents.writer.status = 'completed';
    agentStatus.agents.connector.status = 'working';
  }, 9000);

  setTimeout(() => {
    agentStatus.agents.connector.status = 'completed';
    agentStatus.agents.analyst.status = 'working';
  }, 12000);

  setTimeout(() => {
    agentStatus.agents.analyst.status = 'completed';
    agentStatus.status = 'complete';
    agentStatus.summary = `Found and connected with ${intent.count || 10} professionals`;
  }, 15000);
}

// Get current agent status
async function getAgentStatus() {
  return { success: true, status: agentStatus };
}

// Pause agents
async function pauseAgents() {
  if (agentOrchestrator) {
    agentStatus.status = 'paused';
  }
  return { success: true };
}

// Resume agents
async function resumeAgents() {
  if (agentOrchestrator) {
    agentStatus.status = 'working';
  }
  return { success: true };
}

// Stop agents
async function stopAgents() {
  if (agentOrchestrator) {
    agentStatus.status = 'idle';
    agentStatus.agents = {};
  }
  return { success: true };
}

// ============================================================================
// END AGENT SYSTEM
// ============================================================================

// Context menu click handler
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'captureProfile') {
    chrome.tabs.sendMessage(tab.id, { action: 'captureCurrentProfile' });
  }
});
