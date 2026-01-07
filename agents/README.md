# Multi-Agent LinkedIn Automation System

A sophisticated AI-powered agent system for autonomous LinkedIn networking and outreach.

## Architecture

This system uses **5 specialized AI agents** that work together to automate LinkedIn networking:

```
┌──────────┐
│   USER   │ Gives goal: "Build network of 100 AI startup founders"
└────┬─────┘
     ↓
┌────────────────┐
│  ORCHESTRATOR  │ Coordinates all agents
└────┬───────────┘
     ↓
┌────────────┐
│  1. SCOUT  │ Finds profiles matching criteria
└────┬───────┘
     ↓ (200 profiles found)
┌───────────────┐
│ 2. RESEARCHER │ Analyzes and scores each profile (1-10)
└────┬──────────┘
     ↓ (120 qualified prospects)
┌──────────┐
│ 3. WRITER│ Creates personalized messages for each
└────┬─────┘
     ↓ (120 with custom messages)
┌─────────────┐
│ 4. CONNECTOR│ Sends requests safely (20/day limit)
└────┬────────┘
     ↓ (20 sent today)
┌───────────┐
│ 5. ANALYST│ Tracks metrics, optimizes strategy
└────┬──────┘
     ↓ Decision: "Continue tomorrow" or "Adjust criteria"
     ↓
[Repeat until goal achieved: 100 connections]
```

## The Agents

### 1. Scout Agent 🔍
**Role**: Profile Discovery

**What it does**:
- Receives goal from user
- Uses AI to create optimal LinkedIn search strategy
- Determines best keywords and filters
- Executes search on LinkedIn
- Collects profiles matching criteria
- Passes candidates to Researcher

**AI Decision Making**:
- "Should I search for 'CEO' or 'Founder'?"
- "Which location will yield best results?"
- "How many profiles do I need to collect?"

**Example Output**:
```javascript
{
  profiles: [
    {name: "Jane Smith", title: "CEO at AI Startup", ...},
    {name: "John Doe", title: "Founder at ML Company", ...},
    // ... 198 more
  ],
  strategy: {keywords: ["AI", "Founder"], filters: {...}}
}
```

### 2. Researcher Agent 🧠
**Role**: Profile Analysis & Qualification

**What it does**:
- Receives profiles from Scout
- Deeply analyzes each profile
- Scores relevance (1-10) based on criteria
- Identifies conversation hooks
- Decides: Connect, Skip, or Maybe
- Filters to only qualified prospects (score ≥ 7)
- Passes qualified leads to Writer

**AI Decision Making**:
- "Is this person relevant to the goal?"
- "What makes them a good/bad fit?"
- "What can I mention to start a conversation?"
- "Should we prioritize them?"

**Example Analysis**:
```javascript
{
  name: "Jane Smith",
  score: 9,
  decision: "connect",
  priority: "high",
  hooks: [
    "Recently raised Series A",
    "Interested in AI ethics",
    "Former Google employee"
  ],
  reasoning: "Perfect fit - AI startup founder, actively hiring, shares interests"
}
```

### 3. Writer Agent ✍️
**Role**: Message Personalization

**What it does**:
- Receives qualified profiles from Researcher
- Reads analysis and conversation hooks
- Crafts unique, personalized message for each person
- Adapts tone based on seniority/industry
- Ensures messages are concise (< 300 chars)
- Passes profiles with messages to Connector

**AI Decision Making**:
- "What tone should I use with this CEO?"
- "Which conversation hook is strongest?"
- "How do I stand out from generic requests?"
- "What's the best call-to-action?"

**Example Message**:
```
"Hi Jane, congrats on your Series A! I'm building AI tools and
noticed your focus on AI ethics. Would love to exchange ideas
on responsible AI development. Best, [User]"

Tone: Professional yet enthusiastic
Rationale: References recent success, shows genuine interest
```

### 4. Connector Agent 🤝
**Role**: Safe Connection Management

**What it does**:
- Receives profiles with messages from Writer
- Sends connection requests to LinkedIn
- Respects rate limits (20-50/day)
- Adds delays between actions (7+ seconds)
- Monitors for errors or warnings
- Stops immediately if issues detected
- Saves to database
- Passes results to Analyst

**Safety Features**:
- Daily limit enforcement
- Failure rate monitoring (stops if > 30% fail)
- CAPTCHA detection
- Rate limit detection
- Automatic pausing on errors

**Example Execution**:
```
09:00 - Sent to Jane Smith ✓
09:00 - Waiting 7 seconds...
09:00 - Sent to John Doe ✓
09:00 - Waiting 8 seconds...
09:00 - Sent to Sarah Lee ✓
...
09:15 - Daily limit reached (20/20)
09:15 - Pausing until tomorrow
```

### 5. Analyst Agent 📊
**Role**: Performance Optimization

**What it does**:
- Receives connection results from Connector
- Tracks acceptance rates and metrics
- Identifies patterns (what's working/not working)
- Generates strategic recommendations
- Decides next action:
  - Continue with same criteria?
  - Search for different profiles?
  - Pause and wait?
  - Goal achieved?
- Feeds back to Scout if more searching needed

**AI Decision Making**:
- "What's our acceptance rate?"
- "Which types of profiles accept most?"
- "Which message hooks work best?"
- "Should we target different companies/titles?"
- "Have we achieved the goal?"

**Example Analysis**:
```javascript
{
  metrics: {
    sent: 20,
    accepted: 9,
    acceptanceRate: 45%,
    avgScore: 8.2
  },
  patterns: {
    success: ["Series A founders", "Under 100 employees", "Tech background"],
    failure: ["Enterprise companies", "Generic messages"]
  },
  recommendations: [
    {
      recommendation: "Focus more on Series A companies",
      priority: "high",
      expectedImpact: "+15% acceptance rate"
    },
    {
      recommendation: "Reference their recent funding in messages",
      priority: "high",
      expectedImpact: "+20% response rate"
    }
  ],
  nextAction: {
    task: "search_more",
    reasoning: "Good results, continue with adjusted criteria",
    adjustedCriteria: {target: "Series A founders specifically"}
  }
}
```

## How They Work Together

### Example Session

**User Goal**: "Build a network of 100 AI startup founders"

**Day 1**:
1. **Scout**: Searches LinkedIn, finds 200 AI founders
2. **Researcher**: Analyzes all 200, qualifies 120 (score ≥ 7)
3. **Writer**: Creates 120 personalized messages
4. **Connector**: Sends 20 requests (daily limit), pauses
5. **Analyst**: Tracks results, 45% acceptance rate, recommends continuing

**Day 2**:
6. **Connector**: Sends next 20 requests from queue
7. **Analyst**: Now 9+8 = 17 accepted. Acceptance rate: 42.5%
8. **Analyst**: Identifies pattern - Series A founders accept more
9. **Analyst**: Recommends adjusting search to focus on Series A

**Day 3**:
10. **Scout**: Searches specifically for Series A founders
11. **Researcher**: Scores these higher (more relevant)
12. **Writer**: Emphasizes funding in messages
13. **Connector**: Sends 20 more
14. **Analyst**: Acceptance rate jumps to 60%!

**Days 4-7**:
15. Continues with optimized strategy
16. **Analyst**: Goal achieved - 100 connections!
17. **System**: Pauses and reports success

## Usage

### Basic Setup

```javascript
// 1. Initialize the orchestrator
const orchestrator = new AgentOrchestrator('your-openai-api-key');
await orchestrator.initialize();

// 2. Configure (optional)
orchestrator.setDailyLimit(25); // Max 25 connections per day
orchestrator.setUserInfo({
  name: 'Your Name',
  title: 'Your Title',
  interests: ['AI', 'Startups']
});

// 3. Give it a goal
await orchestrator.executeGoal(
  'Build a network of 50 product managers in AI startups',
  {
    target: {
      title: ['Product Manager', 'PM', 'Head of Product'],
      industry: ['AI', 'Machine Learning', 'Artificial Intelligence'],
      companySize: ['1-50', '51-200'],
      location: ['San Francisco', 'New York', 'Remote']
    },
    preferences: {
      prioritize: 'technical background',
      avoid: ['recruiters', 'sales']
    }
  }
);

// 4. Monitor progress
orchestrator.addEventListener((event) => {
  if (event.type === 'goal_complete') {
    console.log('🎉 Goal achieved!');
    console.log('Metrics:', event.metrics);
    console.log('Recommendations:', event.recommendations);
  }
});
```

### Advanced Usage

```javascript
// Listen to all events
orchestrator.addEventListener((event) => {
  switch(event.type) {
    case 'goal_started':
      console.log('Starting:', event.goal);
      break;

    case 'agent_transition':
      console.log(`${event.from} → ${event.to}`);
      break;

    case 'log':
      console.log(`[${event.log.level}] ${event.log.message}`);
      break;

    case 'goal_complete':
      displayResults(event);
      break;
  }
});

// Get real-time status
setInterval(() => {
  const status = orchestrator.getStatus();
  console.log('Current status:', status.status);
  console.log('Scout queue:', status.agents.scout.queueLength);
  console.log('Connections sent today:', status.agents.connector.sentToday);
}, 5000);

// Get metrics anytime
const metrics = orchestrator.getMetrics();
console.log('Acceptance rate:', metrics.acceptanceRate);

// Get recommendations
const recommendations = orchestrator.getRecommendations();
recommendations.forEach(rec => {
  console.log(`[${rec.priority}] ${rec.recommendation}`);
});

// Control execution
orchestrator.pause();   // Pause all agents
orchestrator.resume();  // Resume
orchestrator.stop();    // Stop completely
```

## Configuration

### API Keys

The system needs an AI API key (OpenAI or Claude):

```javascript
// OpenAI (default)
const orchestrator = new AgentOrchestrator('sk-...');

// Or for Claude (modify base.js to use Claude API)
```

### Safety Settings

```javascript
// Daily limits (LinkedIn recommends 20-50)
orchestrator.setDailyLimit(20);  // Conservative
orchestrator.setDailyLimit(50);  // Aggressive

// Delays between actions
orchestrator.agents.connector.delayBetweenActions = 10000; // 10 seconds
```

### Scoring Criteria

Modify in `researcher.js`:

```javascript
// Adjust qualification threshold
const qualified = analyzed.filter(p => p.score >= 8); // More selective
const qualified = analyzed.filter(p => p.score >= 6); // Less selective
```

## Integration with Extension

To integrate with your Chrome extension:

```javascript
// In your extension's background.js
let agentSystem;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'startAgents') {
    if (!agentSystem) {
      agentSystem = new AgentOrchestrator(request.apiKey);
      await agentSystem.initialize();
    }

    await agentSystem.executeGoal(request.goal, request.criteria);
    sendResponse({success: true});
  }

  if (request.action === 'getAgentStatus') {
    const status = agentSystem ? agentSystem.getStatus() : null;
    sendResponse({status});
  }

  return true;
});
```

## Performance Tips

1. **Start Conservative**: Begin with 10-20 connections/day
2. **Monitor Acceptance Rate**: Aim for >30% acceptance
3. **Adjust Based on Feedback**: Let Analyst guide optimization
4. **Quality > Quantity**: Better to send 10 great requests than 50 generic ones
5. **Be Patient**: Building a quality network takes time

## Troubleshooting

**Agents not progressing**:
- Check API key is valid
- Ensure LinkedIn page is loaded
- Check browser console for errors

**Low acceptance rates**:
- Review Analyst recommendations
- Make criteria more specific
- Improve message personalization

**Rate limiting**:
- Reduce daily limit
- Increase delays between actions
- Analyst will detect and pause automatically

**High failure rate**:
- Connector will auto-pause at 30% failure
- Check LinkedIn for restrictions
- May need to solve CAPTCHA manually

## Example Goals

Try these to get started:

```javascript
// Job hunting
orchestrator.executeGoal(
  'Connect with 50 hiring managers at tech companies',
  {target: {title: 'Hiring Manager', industry: 'Tech'}}
);

// Business development
orchestrator.executeGoal(
  'Build network of 30 potential B2B customers',
  {target: {title: 'VP', industry: 'Enterprise Software'}}
);

// Fundraising
orchestrator.executeGoal(
  'Connect with 20 venture capitalists in AI',
  {target: {title: 'Partner', company: 'Venture Capital'}}
);

// Learning/Mentorship
orchestrator.executeGoal(
  'Connect with 40 senior engineers at FAANG',
  {target: {title: 'Senior Engineer', company: ['Google', 'Meta', 'Amazon']}}
);
```

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                         │
│  "Build me a network of 100 AI startup founders"            │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                     ORCHESTRATOR                              │
│  - Coordinates agents                                         │
│  - Routes tasks between agents                                │
│  - Manages pipeline                                           │
│  - Reports progress                                           │
└──┬────────┬─────────┬──────────┬──────────┬─────────────────┘
   ↓        ↓         ↓          ↓          ↓
┌─────┐ ┌────────┐ ┌──────┐ ┌─────────┐ ┌────────┐
│SCOUT│→│RESEARCH│→│WRITER│→│CONNECTOR│→│ANALYST │
│ 🔍  │ │  ER🧠  │ │  ✍️   │ │   🤝    │ │  📊    │
└──┬──┘ └───┬────┘ └───┬──┘ └────┬────┘ └───┬────┘
   │        │           │         │          │
   ↓        ↓           ↓         ↓          ↓
 Find    Analyze    Personalize  Send    Optimize
Profiles Profiles   Messages   Safely   Strategy
   │        │           │         │          │
   └────────┴───────────┴─────────┴──────────┘
                      │
                      ↓
           ┌──────────────────────┐
           │   LinkedIn Database   │
           │  (Your Extension DB)  │
           └──────────────────────┘
```

## Next Steps

1. **Test with Mock Data**: Start with small numbers to test the flow
2. **Add Your API Key**: Get an OpenAI API key and configure
3. **Start Small**: Try a goal of 5-10 connections first
4. **Monitor and Adjust**: Watch the Analyst recommendations
5. **Scale Up**: Once working well, increase daily limits

---

**Built with AI for AI-powered networking 🤖🤝**
