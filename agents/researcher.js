// Researcher Agent - Analyzes and scores profiles

class ResearcherAgent extends BaseAgent {
  constructor(apiKey) {
    super('Researcher', apiKey);
    this.scoringCriteria = {};
  }

  getSystemPrompt() {
    return `You are Researcher, a LinkedIn profile analysis agent. Your job is to:
1. Deeply analyze each profile
2. Score relevance (1-10) based on criteria
3. Identify conversation hooks and commonalities
4. Decide: Connect, Skip, or Maybe
5. Prioritize the best prospects

You are analytical, discerning, and strategic. Quality over quantity.

Output your analysis in JSON format.`;
  }

  async execute(task) {
    this.log(`Analyzing ${task.profiles.length} profiles`);

    const analyzed = [];

    // Analyze profiles in batches
    const batchSize = 5;
    for (let i = 0; i < task.profiles.length; i += batchSize) {
      const batch = task.profiles.slice(i, i + batchSize);
      const batchResults = await this.analyzeBatch(batch, task.criteria);
      analyzed.push(...batchResults);

      this.log(`Progress: ${analyzed.length}/${task.profiles.length}`);
    }

    // Sort by score
    analyzed.sort((a, b) => b.score - a.score);

    // Filter qualified prospects (score >= 7)
    const qualified = analyzed.filter(p => p.score >= 7);

    this.log(`Qualified: ${qualified.length}/${analyzed.length}`);

    return {
      task: 'write_messages',
      profiles: qualified,
      allAnalyzed: analyzed,
      criteria: task.criteria,
      goal: task.goal
    };
  }

  async analyzeBatch(profiles, criteria) {
    const prompt = `
Analyze these LinkedIn profiles and score their relevance (1-10):

Criteria: ${JSON.stringify(criteria, null, 2)}

Profiles:
${profiles.map((p, i) => `
Profile ${i + 1}:
- Name: ${p.name}
- Title: ${p.title}
- Company: ${p.company}
- Location: ${p.location}
- About: ${p.about?.substring(0, 200) || 'N/A'}
- Connections: ${p.connections}
`).join('\n')}

For each profile, provide:
1. Relevance score (1-10)
2. Reasoning (why this score)
3. Conversation hooks (2-3 specific things to mention)
4. Decision: "connect", "skip", or "maybe"
5. Priority: "high", "medium", "low"

Respond in JSON array format:
[
  {
    "profileIndex": 0,
    "score": 8,
    "reasoning": "...",
    "hooks": ["hook1", "hook2"],
    "decision": "connect",
    "priority": "high"
  },
  ...
]
`;

    try {
      const response = await this.think(prompt);
      const analysis = JSON.parse(response);

      // Merge analysis with profile data
      return profiles.map((profile, index) => {
        const profileAnalysis = analysis.find(a => a.profileIndex === index) || {
          score: 5,
          reasoning: 'Default analysis',
          hooks: [],
          decision: 'maybe',
          priority: 'medium'
        };

        return {
          ...profile,
          analysis: profileAnalysis,
          score: profileAnalysis.score,
          decision: profileAnalysis.decision,
          priority: profileAnalysis.priority
        };
      });

    } catch (error) {
      this.log(`Analysis error: ${error.message}`, 'error');
      // Return profiles with default scores
      return profiles.map(p => ({
        ...p,
        score: 5,
        decision: 'maybe',
        priority: 'medium',
        analysis: {
          reasoning: 'Error in analysis',
          hooks: []
        }
      }));
    }
  }

  async sendToNextAgent(result) {
    this.log(`Sending ${result.profiles.length} qualified profiles to Writer`);
    return result;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ResearcherAgent;
}
