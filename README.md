# LinkedIn Outreach Manager

A powerful Chrome extension for managing LinkedIn connections, outreach campaigns, and building an unlimited contact database. **PLUS** a custom Claude skill for AI-powered LinkedIn automation!

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## 🎯 Two Tools in One Repository

This repo contains:
1. **LinkedIn Outreach Manager Extension** - Database for storing unlimited contacts
2. **Claude Automation Skill** - AI assistant that automates LinkedIn tasks for you

Use them separately OR together for maximum power!

## Quick Start

**Want AI Automation?** → See [.claude/SETUP.md](.claude/SETUP.md) for Claude skill setup

**Want Manual Database?** → Continue reading for extension installation

## Features

### 🤖 NEW: Claude Automation Skill

**Talk to Claude and automate LinkedIn tasks:**
- "Find 20 marketing managers and connect with them"
- "Message everyone I connected with this week"
- "Research [person] before my meeting"
- "Build a list of 50 CTOs in AI startups"

**Features:**
- ✅ Automated connection requests with personalized notes
- ✅ Smart messaging with personalization
- ✅ Profile research and data extraction
- ✅ Built-in safety limits (20-50 actions/day)
- ✅ Respects LinkedIn's terms of service

**Setup:** Install Claude's Chrome extension + load the skill file. [Full instructions](.claude/SETUP.md)

---

### 🎯 LinkedIn Outreach Manager Extension Features

- **Profile Capture**: One-click capture of LinkedIn profiles with all relevant information
- **Unlimited Database**: Store unlimited contacts using IndexedDB with no size restrictions
- **Smart Filtering**: Filter contacts by status, company, location, and custom tags
- **Outreach Campaigns**: Create and manage personalized outreach campaigns with templates
- **Connection Tracking**: Track connection status (pending, connected, rejected)
- **Activity Log**: Monitor all your networking activities in one place
- **Data Export/Import**: Export your database as JSON for backup or migration
- **Auto-Capture**: Optional automatic capture while browsing LinkedIn

### 📊 Dashboard

- Real-time statistics of your network
- Recent activity feed
- Quick action buttons
- Connection status overview

### 👥 Contact Management

- Comprehensive contact profiles
- Search and filter capabilities
- Status tracking (Not Contacted, Pending, Connected, Rejected)
- Company and role information
- Custom notes and tags

### 📤 Outreach Campaigns

- Create personalized message templates
- Use dynamic variables ({firstName}, {lastName}, {company})
- Track sent messages and responses
- Auto-connect feature
- Campaign analytics

## Installation

### From Source

1. Clone or download this repository:
   ```bash
   git clone https://github.com/yourusername/Linkedin-Extension.git
   ```

2. Generate icons (optional - placeholder icons are included):
   - Convert `icons/icon.svg` to PNG files (16x16, 48x48, 128x128)
   - Or use the included placeholder icons

3. Open Chrome and navigate to `chrome://extensions/`

4. Enable "Developer mode" (toggle in top right)

5. Click "Load unpacked"

6. Select the `Linkedin-Extension` directory

7. The extension icon should appear in your Chrome toolbar

## Usage

### Quick Start

1. **Navigate to LinkedIn**: Visit any LinkedIn profile page

2. **Capture a Profile**:
   - Click the floating button (📋) on the profile page
   - Or click the extension icon and select "Capture Current Profile"
   - Or right-click and select "Capture LinkedIn Profile"

3. **View Your Contacts**:
   - Click the extension icon
   - Navigate to the "Contacts" tab
   - Search, filter, and manage your contacts

4. **Create Outreach Campaign**:
   - Go to the "Outreach" tab
   - Create a campaign with a message template
   - Use variables like {firstName}, {company} for personalization

### Features Guide

#### Profile Capture

The extension automatically extracts:
- Name and profile URL
- Current title and company
- Location
- About section
- Profile image
- Connection degree

#### Contact Filtering

Filter contacts by:
- **Status**: Not Contacted, Pending, Connected, Rejected
- **Company**: Filter by specific companies
- **Search**: Search by name, title, or company

#### Data Management

**Export Data**:
1. Click extension icon
2. Go to Dashboard
3. Click "Export Database"
4. Save the JSON file

**Import Data**:
1. Click "Import Database"
2. Select a previously exported JSON file
3. Data will be merged with existing contacts

**Clear Database**:
1. Go to Settings tab
2. Click "Clear All Data"
3. Confirm the action (cannot be undone)

### Settings

Configure the extension in the Settings tab:

- **Auto-Capture**: Automatically capture profiles while browsing
- **Daily Limit**: Set connection request limits (recommended: 20-50/day)
- **Action Delay**: Time between automated actions (recommended: 5+ seconds)

## Technical Details

### Architecture

- **Manifest V3**: Latest Chrome extension standard
- **IndexedDB**: Local database for unlimited storage
- **Service Worker**: Background script for data management
- **Content Script**: Interacts with LinkedIn pages
- **Popup UI**: User interface for managing contacts

### File Structure

```
Linkedin-Extension/
├── manifest.json           # Extension configuration
├── background.js           # Service worker
├── content.js             # LinkedIn page interaction
├── content.css            # Content script styles
├── database.js            # IndexedDB manager
├── popup.html             # Extension popup UI
├── popup.js               # Popup logic
├── popup.css              # Popup styles
├── icons/                 # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   ├── icon128.png
│   └── icon.svg
└── README.md              # This file
```

### Database Schema

**Contacts Store**:
- id (auto-increment)
- profileUrl (unique)
- name, title, company, location
- about, imageUrl
- status, connectionDegree
- dateAdded, lastUpdated

**Campaigns Store**:
- id (auto-increment)
- name, messageTemplate
- autoConnect, active
- sent, responses, connected
- dateCreated

**Activity Store**:
- id (auto-increment)
- type, description
- contactId, timestamp

**Settings Store**:
- key-value pairs for user preferences

## Privacy & Security

- **All data is stored locally** in your browser's IndexedDB
- **No data is sent to external servers**
- **No tracking or analytics**
- **You own and control all your data**
- Export your data anytime as JSON

## Best Practices

### LinkedIn Guidelines

1. **Respect Rate Limits**: Don't send too many connection requests per day (recommended: 20-50)
2. **Personalize Messages**: Use the template variables to personalize outreach
3. **Add Delays**: Use action delays to avoid appearing automated
4. **Review Profiles**: Always review profiles before connecting
5. **Follow LinkedIn's Terms**: Use responsibly and follow LinkedIn's user agreement

### Data Management

1. **Regular Backups**: Export your database regularly
2. **Clean Data**: Remove outdated or irrelevant contacts
3. **Organize Campaigns**: Create specific campaigns for different audiences
4. **Track Engagement**: Monitor response rates and adjust your approach

## Troubleshooting

### Extension Not Working

1. Check that you're on a LinkedIn page (https://www.linkedin.com/*)
2. Refresh the page after installing the extension
3. Check browser console for errors (F12)
4. Reload the extension from chrome://extensions/

### Profile Not Capturing

1. Make sure you're on a profile page (/in/...)
2. Wait for the page to fully load
3. Try clicking the floating button or using the context menu
4. Some profiles may have limited information visible

### Data Not Saving

1. Check that you have enough disk space
2. Try clearing browser cache
3. Export and reimport your data
4. Check browser console for IndexedDB errors

## Roadmap

Future features planned:

- [ ] LinkedIn InMail support
- [ ] Advanced analytics and reporting
- [ ] Custom tags and categories
- [ ] Chrome storage sync for multi-device
- [ ] Bulk actions (mass messaging, connection requests)
- [ ] Integration with CRM systems
- [ ] AI-powered message suggestions
- [ ] A/B testing for outreach campaigns
- [ ] Follow-up reminders
- [ ] Connection notes and conversation history

## Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Disclaimer

This extension is not affiliated with, endorsed by, or officially connected with LinkedIn Corporation. Use at your own risk and ensure compliance with LinkedIn's Terms of Service.

## Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check existing issues for solutions
- Review the troubleshooting section

## Credits

Built with inspiration from Claude's extension architecture, customized for LinkedIn outreach and networking.

---

**Version**: 1.0.0
**Last Updated**: January 2026
**Maintainer**: Your Name

Made with ❤️ for professional networkers
