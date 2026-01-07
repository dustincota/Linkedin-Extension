// Analyst Agent - Tracks metrics and optimizes strategy

class AnalystAgent extends BaseAgent {
  constructor(apiKey) {
    super('Analyst', apiKey);
    this.sessionMetrics = {
      totalSearched: 0,
      totalAnalyzed: 0,
      totalSent: 0,
      totalAccepted: 0,
      totalRejected: 0,
      acceptanceRate: 0,
      averageScore: 0,
      successfulHooks: [],
      failedPatterns: []
    };
    this.recommendations = [];
  }

  getSystemPrompt() {
    return `You are Analyst, a LinkedIn campaign optimization agent. Your job is to:
1. Track success metrics (acceptance rates, response rates)
2. Identify what's working and what's not
3. Provide strategic recommendations
4. Adjust targeting criteria in real-time
5. Predict optimal next actions

You are data-driven, insightful, and strategic. You find patterns others miss.

Output analysis in JSON format.`;
  }

  async execute(task) {
    this.log('Analyzing campaign results...');

    // Update metrics
    this.updateMetrics(task.results);

    // Analyze patterns
    const analysis = await this.analyzePatterns(task.results, task.criteria);

    // Generate recommendations
    const recommendations = await this.generateRecommendations(analysis);

    // Decide if we should continue or adjust
    const nextAction = await this.decideNextAction(task, analysis);

    this.log(`Analysis complete. Acceptance rate: ${this.sessionMetrics.acceptanceRate.toFixed(1)}%`);

    return {
      task: nextAction.task,
      metrics: this.sessionMetrics,
      analysis: analysis,
      recommendations: recommendations,
      nextAction: nextAction,
      shouldContinue: nextAction.continue,
      adjustedCriteria: nextAction.criteria || task.criteria
    };
  }

  updateMetrics(results) {
    this.sessionMetrics.totalSearched += results.sent.length + results.failed.length + results.skipped.length + results.remaining.length;
    this.sessionMetrics.totalSent += results.sent.length;

    // Calculate acceptance rate (would be updated as connections are accepted)
    if (this.sessionMetrics.totalSent > 0) {
      this.sessionMetrics.acceptanceRate =
        (this.sessionMetrics.totalAccepted / this.sessionMetrics.totalSent) * 100;
    }

    this.log(`Updated metrics: ${this.sessionMetrics.totalSent} sent, ${this.sessionMetrics.totalAccepted} accepted`);
  }

  async analyzePatterns(results, criteria) {
    const prompt = `
Analyze this LinkedIn outreach campaign:

Results:
- Sent: ${results.sent.length}
- Failed: ${results.failed.length}
- Remaining: ${results.remaining.length}

Sent Profiles Sample:
${results.sent.slice(0, 5).map(p => `
- ${p.name} (${p.title} at ${p.company})
  Score: ${p.score}/10
  Message: "${p.message}"
  Hooks: ${p.analysis.hooks.join(', ')}
`).join('\n')}

Failed Profiles Sample:
${results.failed.slice(0, 3).map(p => `
- ${p.name}: ${p.error}
`).join('\n')}

Current metrics:
${JSON.stringify(this.sessionMetrics, null, 2)}

Identify:
1. Success patterns (what's working)
2. Failure patterns (what's not working)
3. Hook effectiveness
4. Optimal profile characteristics
5. Message tone effectiveness

Respond in JSON:
{
  "successPatterns": ["pattern1", "pattern2"],
  "failurePatterns": ["pattern1"],
  "bestHooks": ["hook1", "hook2"],
  "optimalProfile": {
    "title": "...",
    "companyType": "...",
    "seniority": "..."
  },
  "insights": ["insight1", "insight2"]
}
`;

    try {
      const response = await this.think(prompt);
      return JSON.parse(response);
    } catch (error) {
      this.log(`Analysis error: ${error.message}`, 'error');
      return {
        successPatterns: [],
        failurePatterns: [],
        bestHooks: [],
        optimalProfile: {},
        insights: ['Analysis error occurred']
      };
    }
  }

  async generateRecommendations(analysis) {
    const prompt = `
Based on this campaign analysis:
${JSON.stringify(analysis, null, 2)}

Current metrics:
${JSON.stringify(this.sessionMetrics, null, 2)}

Provide 3-5 actionable recommendations to improve the campaign.
Consider:
1. Should we change targeting criteria?
2. Should we adjust message tone/content?
3. Should we focus on different industries/titles?
4. Should we increase/decrease volume?
5. What's the biggest opportunity for improvement?

Respond in JSON array:
[
  {
    "recommendation": "specific action to take",
    "reasoning": "why this will help",
    "priority": "high/medium/low",
    "expectedImpact": "what improvement to expect"
  },
  ...
]
`;

    try {
      const response = await this.think(prompt);
      this.recommendations = JSON.parse(response);
      return this.recommendations;
    } catch (error) {
      this.log(`Recommendations error: ${error.message}`, 'error');
      return [{
        recommendation: 'Continue with current strategy',
        reasoning: 'Insufficient data for changes',
        priority: 'medium',
        expectedImpact: 'Maintain current performance'
      }];
    }
  }

  async decideNextAction(task, analysis) {
    const prompt = `
Decide the next action for this LinkedIn campaign:

Goal: ${task.goal}
Current criteria: ${JSON.stringify(task.criteria, null, 2)}

Performance:
- Sent: ${this.sessionMetrics.totalSent}
- Acceptance rate: ${this.sessionMetrics.acceptanceRate}%
- Remaining in queue: ${task.results.remaining.length}

Analysis insights:
${JSON.stringify(analysis.insights, null, 2)}

Recommendations:
${JSON.stringify(this.recommendations, null, 2)}

Decide:
1. Should we continue with current criteria?
2. Should we adjust criteria and search for more prospects?
3. Should we pause and wait for results?
4. Have we achieved the goal?

Respond in JSON:
{
  "continue": true/false,
  "task": "continue_campaign" | "search_more" | "wait" | "goal_achieved",
  "reasoning": "why this decision",
  "criteria": { adjusted criteria if needed }
}
`;

    try {
      const response = await this.think(prompt);
      const decision = JSON.parse(response);
      this.log(`Decision: ${decision.task} - ${decision.reasoning}`);
      return decision;
    } catch (error) {
      this.log(`Decision error: ${error.message}`, 'error');
      return {
        continue: false,
        task: 'wait',
        reasoning: 'Error in decision making, pausing for safety'
      };
    }
  }

  getMetrics() {
    return this.sessionMetrics;
  }

  getRecommendations() {
    return this.recommendations;
  }

  async sendToNextAgent(result) {
    if (result.shouldContinue && result.nextAction.task === 'search_more') {
      this.log('Recommending to search for more prospects');
    } else {
      this.log('Campaign cycle complete');
    }
    return result;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AnalystAgent;
}
