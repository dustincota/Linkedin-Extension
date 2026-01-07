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

// Context menu click handler
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'captureProfile') {
    chrome.tabs.sendMessage(tab.id, { action: 'captureCurrentProfile' });
  }
});
