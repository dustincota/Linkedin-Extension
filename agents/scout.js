// Scout Agent - Finds and collects LinkedIn profiles

class ScoutAgent extends BaseAgent {
  constructor(apiKey) {
    super('Scout', apiKey);
    this.searchCriteria = null;
    this.profilesFound = [];
  }

  getSystemPrompt() {
    return `You are Scout, a LinkedIn profile discovery agent. Your job is to:
1. Analyze search criteria and create optimal LinkedIn search queries
2. Determine the best filters to use (location, company, title, etc.)
3. Decide how many results to collect
4. Identify patterns in successful profiles

You are analytical, thorough, and strategic. You think about WHO to target, not just HOW MANY.

Output your decisions in JSON format.`;
  }

  async execute(task) {
    this.log(`Searching for: ${task.goal}`);

    // Step 1: AI decides search strategy
    const strategy = await this.planSearch(task);
    this.log(`Search strategy: ${JSON.stringify(strategy)}`);

    // Step 2: Execute search on LinkedIn
    const profiles = await this.searchLinkedIn(strategy);
    this.log(`Found ${profiles.length} profiles`);

    // Step 3: Package results for Researcher
    return {
      task: 'research_profiles',
      profiles: profiles,
      criteria: task.criteria,
      goal: task.goal,
      strategy: strategy
    };
  }

  async planSearch(task) {
    const prompt = `
I need to find LinkedIn profiles matching these criteria:
${JSON.stringify(task.criteria, null, 2)}

Goal: ${task.goal}

Based on this, determine:
1. Primary search keywords
2. Filters to apply (title, company, location, etc.)
3. Number of profiles to collect
4. Search order/priority

Respond in JSON format:
{
  "keywords": ["keyword1", "keyword2"],
  "filters": {
    "title": ["title1", "title2"],
    "location": "location",
    "company": "company size or name"
  },
  "targetCount": 100,
  "reasoning": "why this strategy"
}
`;

    const response = await this.think(prompt);
    return JSON.parse(response);
  }

  async searchLinkedIn(strategy) {
    // This sends commands to content script to actually search LinkedIn
    this.log('Executing LinkedIn search...');

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'search_linkedin',
        strategy: strategy
      });

      if (response.success) {
        return response.profiles;
      } else {
        throw new Error(response.error || 'Search failed');
      }
    } catch (error) {
      this.log(`Search error: ${error.message}`, 'error');

      // Return mock data for testing
      return this.getMockProfiles(strategy.targetCount);
    }
  }

  getMockProfiles(count) {
    // Mock data for development
    const profiles = [];
    for (let i = 0; i < Math.min(count, 20); i++) {
      profiles.push({
        name: `Person ${i + 1}`,
        title: 'Software Engineer',
        company: `Company ${i % 5 + 1}`,
        location: 'San Francisco',
        profileUrl: `https://linkedin.com/in/person${i + 1}`,
        about: 'Passionate about technology and innovation...',
        connections: '500+',
        imageUrl: null
      });
    }
    return profiles;
  }

  // Override to send to Researcher
  async sendToNextAgent(result) {
    this.log(`Sending ${result.profiles.length} profiles to Researcher`);
    // Orchestrator will handle routing
    return result;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ScoutAgent;
}
