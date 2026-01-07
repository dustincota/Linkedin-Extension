# Claude LinkedIn Automation Skill - Setup Guide

This skill teaches Claude how to automate LinkedIn tasks safely and effectively.

## Prerequisites

1. **Claude Pro Subscription** ($20/month) - Required
2. **Claude Chrome Extension** - Installed from Chrome Web Store
3. **LinkedIn Account** - Active account in good standing

## Installation Steps

### Step 1: Install Claude's Extension

1. Go to Chrome Web Store
2. Search for "Claude" by Anthropic
3. Click "Add to Chrome"
4. Sign in with your Claude account

### Step 2: Install This Skill

**Option A: Using Claude Code (Current Method)**
1. You're already here in the repository!
2. The skill file is in `.claude/skills/linkedin-automation.md`
3. Claude will automatically detect and load it

**Option B: Manual Installation**
1. Open Claude's extension settings
2. Go to "Skills" or "Custom Instructions"
3. Click "Add New Skill"
4. Copy the contents of `linkedin-automation.md`
5. Paste and save

### Step 3: Test the Skill

1. Open LinkedIn in Chrome
2. Click the Claude extension icon
3. In the chat, type: **"Help me find 5 software engineers to connect with"**
4. Claude should now follow the LinkedIn automation procedures!

## How to Use

### Basic Commands

Once installed, you can tell Claude:

**Profile Discovery:**
- "Find 10 marketing managers in New York"
- "Search for product designers at Google"
- "Show me CTOs in the AI industry"

**Connection Requests:**
- "Connect with 20 sales directors in my area"
- "Send connection requests to everyone who viewed my profile"
- "Connect with alumni from [University]"

**Messaging:**
- "Message all my recent connections"
- "Send this message to recruiters: [your message]"
- "Follow up with people I connected with last week"

**Research:**
- "Research [Person Name] before my meeting"
- "What should I know about [Company]'s leadership team"
- "Find common connections with [Person]"

**Data Collection:**
- "Build a list of 50 VPs of Engineering"
- "Export all profiles of data scientists at [Company]"
- "Create a spreadsheet of potential clients in [Industry]"

### Customizing Your Preferences

Tell Claude your preferences once, and it will remember:

```
Claude, here are my LinkedIn automation preferences:
- Daily connection limit: 25
- Wait time between actions: 8 seconds
- Message style: Casual and friendly
- Target industries: SaaS, AI, FinTech
- Target roles: Product Manager, Engineering Lead
- Avoid companies: [List]
```

### Safety Features

The skill includes automatic safeguards:
- ✅ Respects LinkedIn's rate limits (20-50 connections/day)
- ✅ Adds wait times between actions (5-10 seconds)
- ✅ Stops if CAPTCHA appears
- ✅ Personalizes every message
- ✅ Reports all actions taken

## Example Session

```
You: "Find and connect with 10 DevRel engineers"

Claude:
I'll help you find and connect with DevRel engineers. Let me start by searching LinkedIn.

[Navigates to LinkedIn search]
[Searches for "Developer Relations" OR "DevRel" in titles]
[Applies filters]

Found 150+ results. I'll review the first 10 that match your criteria...

Profile 1: Jane Smith - DevRel at Stripe
- Sending connection request with note: "Hi Jane, fellow DevRel professional here!
  Love your work with Stripe's API documentation. Would love to connect!"
- ✅ Sent (waiting 7 seconds)

Profile 2: John Doe - Developer Advocate at MongoDB
...

[After completing all 10]

✅ Task Complete!

Results:
- Connection requests sent: 10
- All personalized with specific references
- Average wait time: 7 seconds
- No errors

Next Steps:
- Check LinkedIn for acceptances tomorrow
- I can help you message them once they accept
- Want to target more DevRel engineers at specific companies?
```

## Tips for Best Results

1. **Be Specific**: "Find CTOs at Series A startups" is better than "Find tech people"

2. **Set Reasonable Limits**: Start with 10-20 connections per day, not 100

3. **Personalize Templates**: Give Claude context about why you're reaching out

4. **Use in Batches**: "Do 10 now, then 10 more in 2 hours" vs all 100 at once

5. **Monitor Results**: Check what Claude is sending before scaling up

6. **Vary Your Approach**: Mix connection requests with research and messaging

## Safety & Compliance

**This skill helps you:**
- ✅ Network professionally
- ✅ Save time on repetitive tasks
- ✅ Build genuine relationships
- ✅ Research before meetings

**This skill does NOT:**
- ❌ Spam people
- ❌ Send generic mass messages
- ❌ Violate LinkedIn's Terms of Service
- ❌ Scrape data for resale
- ❌ Impersonate anyone

**LinkedIn's Rules:**
- Max 100 connection requests pending at once
- Max 20-50 connection requests per day (recommended)
- Messages must be personalized
- No automated scrapers for commercial purposes
- Respect user privacy

## Troubleshooting

**Problem: Claude doesn't seem to recognize the skill**
- Solution: Make sure the `.claude` folder is in your repository root
- Try asking: "Do you have the LinkedIn automation skill installed?"

**Problem: Claude is too slow/cautious**
- Solution: Tell it: "You can be more aggressive with timing, use 5-second delays"

**Problem: Getting CAPTCHAs**
- Solution: You're going too fast. Reduce daily limits and increase wait times
- Take a break for 24 hours

**Problem: Connection requests not sending**
- Solution: Check if you've hit LinkedIn's pending limit (100 max)
- Accept or withdraw old requests first

**Problem: Claude keeps asking for confirmation**
- Solution: Tell it upfront: "Please proceed without asking for confirmation on each action"

## Advanced Usage

### Combining with Your Extension

You now have TWO tools:
1. **Your LinkedIn Outreach Manager Extension** - Stores contacts locally
2. **Claude's Automation Skill** - Does the clicking and messaging

Use them together:
```
You: "Use Claude's automation to find 50 product managers, then save them
     all to my Outreach Manager extension database"

Claude: [Finds profiles with automation] → [Clicks your extension's capture
        button on each profile] → [Verifies they're saved]
```

### Creating Workflows

**Weekly Networking Routine:**
```
Monday: "Find 20 new prospects in [industry]"
Tuesday: "Message last week's new connections with [template]"
Wednesday: "Research the 5 people I'm meeting this week"
Thursday: "Follow up with people who haven't responded"
Friday: "Export this week's contacts to spreadsheet"
```

### Message Template Library

Create reusable templates:
```
You: "Save this as my 'Cold Outreach' template:
     Hi [Name], I'm reaching out because [reason].
     Would you be open to [ask]? Thanks, [Me]"

Then later: "Send my Cold Outreach template to all CTOs at Series B companies"
```

## What's Next?

Now that you have the skill installed:

1. **Start Small**: Try "Find 3 people in [your field] to connect with"
2. **Review Results**: Check what Claude sends before scaling up
3. **Customize**: Tell Claude your preferences and style
4. **Automate Routine Tasks**: Set up weekly workflows
5. **Combine Tools**: Use both extensions together for maximum power

## Need Help?

Common questions:

**Q: Is this against LinkedIn's terms?**
A: No, as long as you're networking genuinely and not spamming. The skill includes safeguards.

**Q: Can I get banned?**
A: Unlikely if you follow the built-in rate limits. Don't exceed 50 actions/day.

**Q: Does it cost money?**
A: You need Claude Pro ($20/month). No other costs.

**Q: Can it apply to jobs?**
A: Yes! Try: "Find 10 jobs for [role] and tell me which to apply to"

**Q: Will it message people while I'm sleeping?**
A: No, it only acts when you explicitly ask it to.

---

**Ready to Start?**

Open LinkedIn, click the Claude extension, and say:

**"I have the LinkedIn automation skill. Help me find 5 people to connect with in [your field]"**

That's it! Claude will take it from there.
