// IndexedDB Database Manager for unlimited storage
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

        // Contacts store
        if (!db.objectStoreNames.contains('contacts')) {
          const contactsStore = db.createObjectStore('contacts', { keyPath: 'id', autoIncrement: true });
          contactsStore.createIndex('profileUrl', 'profileUrl', { unique: true });
          contactsStore.createIndex('name', 'name', { unique: false });
          contactsStore.createIndex('company', 'company', { unique: false });
          contactsStore.createIndex('status', 'status', { unique: false });
          contactsStore.createIndex('dateAdded', 'dateAdded', { unique: false });
        }

        // Outreach campaigns store
        if (!db.objectStoreNames.contains('campaigns')) {
          const campaignsStore = db.createObjectStore('campaigns', { keyPath: 'id', autoIncrement: true });
          campaignsStore.createIndex('name', 'name', { unique: false });
          campaignsStore.createIndex('dateCreated', 'dateCreated', { unique: false });
        }

        // Activity log store
        if (!db.objectStoreNames.contains('activity')) {
          const activityStore = db.createObjectStore('activity', { keyPath: 'id', autoIncrement: true });
          activityStore.createIndex('timestamp', 'timestamp', { unique: false });
          activityStore.createIndex('type', 'type', { unique: false });
        }

        // Settings store
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

        // Apply filters
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

    // Import contacts
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

    // Import campaigns
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

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LinkedInDatabase;
}
