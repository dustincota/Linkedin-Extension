// Content Script for LinkedIn Pages
console.log('LinkedIn Outreach Manager: Content script loaded');

// Profile extraction functions
function extractProfileData() {
  const profileData = {
    profileUrl: window.location.href.split('?')[0],
    captureDate: new Date().toISOString()
  };

  // Extract name
  const nameElement = document.querySelector('h1.text-heading-xlarge') ||
                      document.querySelector('.pv-text-details__left-panel h1') ||
                      document.querySelector('[data-generated-suggestion-target]');
  if (nameElement) {
    profileData.name = nameElement.textContent.trim();
  }

  // Extract title
  const titleElement = document.querySelector('.text-body-medium.break-words') ||
                       document.querySelector('.pv-text-details__left-panel .text-body-medium');
  if (titleElement) {
    profileData.title = titleElement.textContent.trim();
  }

  // Extract company
  const companyElement = document.querySelector('.pv-text-details__right-panel .hoverable-link-text') ||
                        document.querySelector('[data-field="experience_company_logo"] + div .t-14');
  if (companyElement) {
    profileData.company = companyElement.textContent.trim();
  }

  // Extract location
  const locationElement = document.querySelector('.text-body-small.inline.t-black--light.break-words') ||
                          document.querySelector('.pv-top-card--list.pv-top-card--list-bullet li:first-child');
  if (locationElement) {
    profileData.location = locationElement.textContent.trim();
  }

  // Extract about section
  const aboutElement = document.querySelector('#about + * .inline-show-more-text') ||
                       document.querySelector('.pv-about__summary-text');
  if (aboutElement) {
    profileData.about = aboutElement.textContent.trim();
  }

  // Extract profile image
  const imageElement = document.querySelector('.pv-top-card-profile-picture__image') ||
                       document.querySelector('img.ember-view.profile-photo-edit__preview');
  if (imageElement) {
    profileData.imageUrl = imageElement.src;
  }

  // Extract connection degree
  const connectionElement = document.querySelector('.dist-value');
  if (connectionElement) {
    profileData.connectionDegree = connectionElement.textContent.trim();
  }

  // Extract contact info button availability
  const contactButton = document.querySelector('#top-card-text-details-contact-info');
  profileData.hasContactInfo = !!contactButton;

  return profileData;
}

function extractSearchResultProfiles() {
  const profiles = [];
  const profileCards = document.querySelectorAll('.reusable-search__result-container');

  profileCards.forEach(card => {
    const profile = {};

    // Extract profile URL
    const linkElement = card.querySelector('a.app-aware-link[href*="/in/"]');
    if (linkElement) {
      profile.profileUrl = linkElement.href.split('?')[0];
    }

    // Extract name
    const nameElement = card.querySelector('.entity-result__title-text a span[aria-hidden="true"]');
    if (nameElement) {
      profile.name = nameElement.textContent.trim();
    }

    // Extract title
    const titleElement = card.querySelector('.entity-result__primary-subtitle');
    if (titleElement) {
      profile.title = titleElement.textContent.trim();
    }

    // Extract company
    const companyElement = card.querySelector('.entity-result__secondary-subtitle');
    if (companyElement) {
      profile.company = companyElement.textContent.trim();
    }

    // Extract location
    const locationElement = card.querySelector('.entity-result__secondary-subtitle + div');
    if (locationElement) {
      profile.location = locationElement.textContent.trim();
    }

    if (profile.profileUrl && profile.name) {
      profile.captureDate = new Date().toISOString();
      profiles.push(profile);
    }
  });

  return profiles;
}

function extractConnectionProfiles() {
  const profiles = [];
  const connectionCards = document.querySelectorAll('.mn-connection-card');

  connectionCards.forEach(card => {
    const profile = {
      status: 'connected'
    };

    // Extract profile URL
    const linkElement = card.querySelector('a.mn-connection-card__link');
    if (linkElement) {
      profile.profileUrl = linkElement.href.split('?')[0];
    }

    // Extract name
    const nameElement = card.querySelector('.mn-connection-card__name');
    if (nameElement) {
      profile.name = nameElement.textContent.trim();
    }

    // Extract title
    const titleElement = card.querySelector('.mn-connection-card__occupation');
    if (titleElement) {
      profile.title = titleElement.textContent.trim();
    }

    if (profile.profileUrl && profile.name) {
      profile.captureDate = new Date().toISOString();
      profiles.push(profile);
    }
  });

  return profiles;
}

// Message listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'captureCurrentProfile') {
    captureCurrentProfile();
  } else if (request.action === 'captureSearchResults') {
    captureSearchResults();
  } else if (request.action === 'captureConnections') {
    captureConnections();
  } else if (request.action === 'extractProfileData') {
    const data = extractProfileData();
    sendResponse({ success: true, data });
  }
  return true;
});

async function captureCurrentProfile() {
  try {
    const profileData = extractProfileData();

    if (!profileData.name || !profileData.profileUrl) {
      showNotification('Unable to extract profile data', 'error');
      return;
    }

    const response = await chrome.runtime.sendMessage({
      action: 'captureProfile',
      data: profileData
    });

    if (response.success) {
      showNotification(
        response.updated ? 'Profile updated!' : 'Profile captured!',
        'success'
      );
    } else {
      showNotification('Failed to capture profile', 'error');
    }
  } catch (error) {
    console.error('Error capturing profile:', error);
    showNotification('Error capturing profile', 'error');
  }
}

async function captureSearchResults() {
  try {
    const profiles = extractSearchResultProfiles();

    if (profiles.length === 0) {
      showNotification('No profiles found on this page', 'warning');
      return;
    }

    let captured = 0;
    for (const profile of profiles) {
      try {
        const response = await chrome.runtime.sendMessage({
          action: 'captureProfile',
          data: profile
        });
        if (response.success && !response.updated) {
          captured++;
        }
      } catch (error) {
        console.error('Error capturing profile:', error);
      }
    }

    showNotification(`Captured ${captured} new profiles from search results`, 'success');
  } catch (error) {
    console.error('Error capturing search results:', error);
    showNotification('Error capturing search results', 'error');
  }
}

async function captureConnections() {
  try {
    const profiles = extractConnectionProfiles();

    if (profiles.length === 0) {
      showNotification('No connections found on this page', 'warning');
      return;
    }

    let captured = 0;
    for (const profile of profiles) {
      try {
        const response = await chrome.runtime.sendMessage({
          action: 'captureProfile',
          data: profile
        });
        if (response.success && !response.updated) {
          captured++;
        }
      } catch (error) {
        console.error('Error capturing connection:', error);
      }
    }

    showNotification(`Captured ${captured} new connections`, 'success');
  } catch (error) {
    console.error('Error capturing connections:', error);
    showNotification('Error capturing connections', 'error');
  }
}

// Notification system
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `linkedin-outreach-notification ${type}`;
  notification.textContent = message;

  const styles = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
    color: white;
    padding: 16px 24px;
    border-radius: 8px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    z-index: 999999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    font-weight: 500;
    animation: slideIn 0.3s ease-out;
  `;

  notification.style.cssText = styles;
  document.body.appendChild(notification);

  // Add animation styles
  if (!document.getElementById('linkedin-outreach-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'linkedin-outreach-styles';
    styleSheet.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(400px);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(styleSheet);
  }

  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-in';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Add floating action button for quick capture
function addFloatingButton() {
  // Check if button already exists
  if (document.getElementById('linkedin-outreach-fab')) {
    return;
  }

  const fab = document.createElement('button');
  fab.id = 'linkedin-outreach-fab';
  fab.innerHTML = '📋';
  fab.title = 'Capture Profile';

  const styles = `
    position: fixed;
    bottom: 30px;
    right: 30px;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: linear-gradient(135deg, #0077b5, #00a0dc);
    border: none;
    color: white;
    font-size: 24px;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0, 119, 181, 0.4);
    z-index: 999998;
    transition: all 0.3s ease;
  `;

  fab.style.cssText = styles;

  fab.addEventListener('mouseenter', () => {
    fab.style.transform = 'scale(1.1)';
    fab.style.boxShadow = '0 6px 16px rgba(0, 119, 181, 0.6)';
  });

  fab.addEventListener('mouseleave', () => {
    fab.style.transform = 'scale(1)';
    fab.style.boxShadow = '0 4px 12px rgba(0, 119, 181, 0.4)';
  });

  fab.addEventListener('click', () => {
    captureCurrentProfile();
  });

  document.body.appendChild(fab);
}

// Initialize on profile pages
function init() {
  const isProfilePage = window.location.pathname.includes('/in/');
  const isSearchPage = window.location.pathname.includes('/search/results/');
  const isConnectionsPage = window.location.pathname.includes('/mynetwork/');

  if (isProfilePage) {
    addFloatingButton();
  }
}

// Run on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Re-run on URL changes (LinkedIn is a SPA)
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    init();
  }
}).observe(document, { subtree: true, childList: true });
