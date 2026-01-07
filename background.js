// Background Service Worker for LinkedIn Outreach Manager

// Import database
importScripts('database.js');

const db = new LinkedInDatabase();
let isInitialized = false;

// Initialize database on install
chrome.runtime.onInstalled.addListener(async () => {
  console.log('LinkedIn Outreach Manager installed');
  await initializeDB();

  // Set default settings
  await db.setSetting('autoCaptureProfiles', false);
  await db.setSetting('captureConnections', false);
  await db.setSetting('dailyLimit', 20);
  await db.setSetting('actionDelay', 5);
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

// Context menu for quick actions on LinkedIn
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'captureProfile',
    title: 'Capture LinkedIn Profile',
    contexts: ['page'],
    documentUrlPatterns: ['https://www.linkedin.com/*']
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'captureProfile') {
    chrome.tabs.sendMessage(tab.id, { action: 'captureCurrentProfile' });
  }
});
