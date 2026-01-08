# 30-Day Home Service Company Owner Outreach Campaign

## Campaign Overview
- **Duration**: 30 days
- **Daily Target**: 10 connection requests
- **Total Connections**: 300 home service company owners
- **Auto-Follow-Up**: Yes (message sent when connection accepted)
- **Target Profile**: Owners/Founders of home service companies (HVAC, plumbing, electrical, landscaping, cleaning, etc.)

## Setup Instructions

### Step 1: Configure Your Settings

Open the extension and set these in Settings:
- **Daily Limit**: 10
- **Your Name**: [Your actual name]
- **Your Title**: [Your title/role]
- **Claude API Key**: Already set ✓

### Step 2: Start the Campaign

Use this exact prompt in the chat interface:

```
Start a 30-day LinkedIn outreach campaign with these parameters:

TARGET: Owners and founders of home service companies including:
- HVAC companies
- Plumbing businesses
- Electrical contractors
- Landscaping services
- Cleaning services
- Pest control
- Roofing companies
- Pool maintenance
- Handyman services
- Property maintenance

SEARCH CRITERIA:
- Job titles: "Owner", "Founder", "CEO", "President"
- Industries: "Construction", "Facilities Services", "Consumer Services"
- Company size: 1-50 employees (small businesses)
- Location: [YOUR TARGET LOCATION - specify city/region]

DAILY WORKFLOW:
1. Find 10 new profiles matching criteria
2. Research each profile (30 seconds per profile)
3. Send personalized connection request with note
4. Wait 5-10 seconds between each request
5. Track all activities

CONNECTION NOTE TEMPLATE:
"Hi [FirstName], I noticed you run [CompanyName] in [Location]. I work with home service business owners to [YOUR VALUE PROPOSITION]. Would love to connect!"

AUTO-FOLLOW-UP (when connection accepted):
Wait 24 hours, then send:
"Thanks for connecting, [FirstName]! I saw you're doing great work at [CompanyName]. I'd love to learn more about your business and see if there's a way we can help each other grow. Are you open to a quick chat this week?"

SCHEDULE:
- Run Monday-Friday (skip weekends)
- Best time: 9 AM - 11 AM (when business owners check LinkedIn)
- Total: 10 requests per day × 22 weekdays = 220 connections

SAFETY RULES:
- Never exceed 10 requests per day
- Always personalize each message
- Stop immediately if CAPTCHA appears
- Maintain 7-second delays between actions
```

### Step 3: Daily Operation

**IMPORTANT - About Running While You Sleep:**

⚠️ **LinkedIn automation CANNOT run while you sleep** because:
1. Your computer/browser must be awake and active
2. LinkedIn detects and blocks headless/background automation
3. You need to be "present" to handle CAPTCHAs if they appear

**Practical Solutions:**

**Option A: Morning Routine (RECOMMENDED)**
- Set aside 20-30 minutes each morning (9-10 AM)
- Open LinkedIn in your browser
- Open the extension
- Start the daily batch: "Find and connect with 10 home service owners today"
- Let it run while you have coffee/check emails
- It will complete in ~15-20 minutes

**Option B: Dedicated Device**
- Use a secondary laptop/computer that stays on
- Run the automation during business hours
- Set it to run 9 AM daily on a schedule
- Monitor remotely if needed

**Option C: Virtual Machine (Advanced)**
- Set up a cloud VM (AWS, DigitalOcean)
- Install Chrome and the extension
- Schedule to run during your timezone's business hours
- Costs ~$10-20/month

### Step 4: Monitor Progress

The extension will track:
- ✅ Connections sent: X/300
- ✅ Accepted: X
- ✅ Messages sent: X
- ✅ Responses received: X
- ✅ Days completed: X/30

### Step 5: Auto-Message Setup

The extension automatically monitors for new connections every 2 hours and sends the follow-up message 24 hours after acceptance.

**How it works:**
1. Scout agent finds new accepted connections
2. Researcher agent checks when they accepted (must be 24h ago)
3. Writer agent creates personalized message using their profile data
4. Connector agent sends the message
5. All activity logged to database

## Campaign Timeline

```
Day 1-5:   Send 50 requests → Expect ~10-15 acceptances
Day 6-10:  Send 50 requests → Expect ~15-20 acceptances → Start getting responses
Day 11-15: Send 50 requests → Expect ~20-25 acceptances → Schedule calls
Day 16-20: Send 50 requests → Expect ~20-25 acceptances → More conversations
Day 21-25: Send 50 requests → Expect ~20-25 acceptances → Pipeline building
Day 26-30: Send 50 requests → Final push → 100+ total connections

Total Expected Results:
- 300 connection requests sent
- 90-120 accepted (30-40% acceptance rate)
- 20-40 message responses (20-30% response rate)
- 5-15 qualified conversations
```

## Daily Checklist

**Each Morning (15-20 minutes):**
- [ ] Open LinkedIn
- [ ] Open extension
- [ ] Say: "Run today's outreach - find and connect with 10 home service owners"
- [ ] Monitor the 5 agents working (Scout → Researcher → Writer → Connector → Analyst)
- [ ] Verify completion: "10 requests sent ✓"
- [ ] Close extension (auto-messages will be sent later automatically)

**Every 2-3 Days (5 minutes):**
- [ ] Check new connection acceptances
- [ ] Verify auto-messages were sent
- [ ] Respond to any replies manually
- [ ] Review analytics: "Show me campaign stats"

## Troubleshooting

**"I got a CAPTCHA"**
- Stop immediately
- Complete the CAPTCHA manually
- Wait 2-4 hours before resuming
- Reduce daily limit to 5-7 for a few days

**"Extension stopped working"**
- Check if you're logged into LinkedIn
- Verify API key is still valid
- Refresh the LinkedIn page
- Restart the extension

**"Not getting responses"**
- Review your connection notes (might need better personalization)
- Check your LinkedIn profile (is it complete and professional?)
- Try different value propositions
- A/B test different message templates

**"Acceptance rate is low (<20%)"**
- Improve profile targeting (be more specific)
- Enhance your LinkedIn profile
- Better personalization in notes
- Check if you're targeting the right seniority level

## Message Templates Library

### Connection Request Variations (Use Different Ones)

**Template 1: Problem-Aware**
"Hi [FirstName], noticed [CompanyName] serves [Location]. Many home service businesses struggle with [common problem]. Would love to exchange ideas on growth strategies!"

**Template 2: Compliment**
"Hi [FirstName], impressive what you've built with [CompanyName]! I work with home service owners on [your solution]. Would love to connect and learn from your experience."

**Template 3: Referral-Style**
"Hi [FirstName], I help [type] businesses in [area] with [solution]. Thought we should connect - I'd love to learn about [CompanyName] and see if there's a fit."

**Template 4: Direct**
"Hi [FirstName], connecting with home service business owners in [Location]. Run [CompanyName]? Would love to exchange insights on growing service businesses."

### Follow-Up Message Variations (After Connection Accepted)

**Template 1: Value First**
"Thanks for connecting, [FirstName]! I saw [specific detail from their profile/company]. I recently helped a [similar business type] in [area] achieve [specific result]. Would you be open to a quick call to see if I can help [CompanyName] similarly?"

**Template 2: Question-Based**
"Thanks for connecting, [FirstName]! Quick question: what's your biggest challenge with [relevant area: lead generation/hiring/operations] at [CompanyName] right now? I might have some ideas that could help."

**Template 3: Case Study**
"Thanks for connecting, [FirstName]! I just helped [similar company] go from [before] to [after] in [timeframe]. Happy to share what we did if you'd find it valuable for [CompanyName]."

**Template 4: Meeting Request**
"Thanks for connecting, [FirstName]! I'd love to learn more about your vision for [CompanyName]. Are you available for a 15-minute call this week? I'll share some strategies that are working well for other home service businesses too."

## Advanced Settings

### Daily Schedule Customization
```javascript
// Edit in background.js if you want to change automation schedule
const CAMPAIGN_CONFIG = {
  dailyLimit: 10,
  targetJobTitles: ['Owner', 'Founder', 'CEO', 'President', 'Co-Founder'],
  targetIndustries: ['Home Services', 'Construction', 'Facilities Services'],
  companySizeMax: 50,
  skipWeekends: true,
  preferredHours: [9, 10, 11], // 9 AM - 12 PM
  delayBetweenActions: 7000, // 7 seconds
  followUpDelay: 24 * 60 * 60 * 1000 // 24 hours
};
```

### A/B Testing Setup
```javascript
// Test which message gets better response rates
const MESSAGE_VARIANTS = {
  groupA: "Template 1 - Problem-Aware",
  groupB: "Template 2 - Compliment",
  // Extension will automatically split 50/50 and track results
};
```

## Expected ROI

**If you're selling a service/product:**
- 300 requests → 100 connections → 25 conversations → 5 qualified leads → 1-2 customers
- If customer value = $5,000: ROI = $5,000-10,000
- Cost: ~30 hours of time + $20 API costs = ~$650 equivalent
- Return: 8x-15x ROI

**If you're building a network:**
- 100 new home service owner connections
- 10-20 referral partners
- Valuable market insights
- Future business opportunities

## Next Steps After 30 Days

1. **Segment your database**: Export all contacts, tag them by company type
2. **Nurture relationships**: Stay in touch, provide value, share content
3. **Referral requests**: Ask satisfied connections for introductions
4. **Expand targeting**: Try related industries (property management, real estate)
5. **Content strategy**: Post valuable content for your network
6. **Repeat campaign**: Target different location or industry

---

## Quick Start Command

**Copy and paste this into the extension to start:**

```
Begin my 30-day home service owner campaign:
- Target: Owners of HVAC, plumbing, electrical, landscaping companies
- Location: [YOUR CITY/REGION]
- 10 per day, Monday-Friday
- Auto-message accepted connections after 24 hours
- Use personalized connection notes mentioning their company
- Track all metrics in database
Start with today's batch of 10.
```

Good luck with your campaign! 🚀
