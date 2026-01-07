// Connector Agent - Sends connection requests safely

class ConnectorAgent extends BaseAgent {
  constructor(apiKey) {
    super('Connector', apiKey);
    this.dailyLimit = 20;
    this.sentToday = 0;
    this.lastResetDate = new Date().toDateString();
    this.delayBetweenActions = 7000; // 7 seconds
  }

  getSystemPrompt() {
    return `You are Connector, a LinkedIn connection management agent. Your job is to:
1. Send connection requests safely (respect rate limits)
2. Monitor for errors or warnings
3. Handle retries intelligently
4. Track success/failure rates
5. Stop immediately if issues detected

You are cautious, reliable, and safety-first. Never risk the user's account.

Output decisions in JSON format.`;
  }

  async execute(task) {
    this.log(`Preparing to send ${task.profiles.length} connection requests`);

    // Check daily limit
    this.checkDailyLimit();

    const results = {
      sent: [],
      failed: [],
      skipped: [],
      remaining: []
    };

    const available = this.dailyLimit - this.sentToday;
    this.log(`Can send ${available} more today`);

    for (let i = 0; i < task.profiles.length; i++) {
      const profile = task.profiles[i];

      // Check if we hit daily limit
      if (this.sentToday >= this.dailyLimit) {
        this.log('Daily limit reached, queuing remaining');
        results.remaining.push(...task.profiles.slice(i));
        break;
      }

      // AI decides if it's safe to continue
      const shouldContinue = await this.checkSafety(results);
      if (!shouldContinue) {
        this.log('Safety check failed, stopping', 'warning');
        results.remaining.push(...task.profiles.slice(i));
        break;
      }

      // Send connection request
      this.log(`Sending to: ${profile.name}`);
      const result = await this.sendConnectionRequest(profile);

      if (result.success) {
        results.sent.push(profile);
        this.sentToday++;
      } else {
        results.failed.push({...profile, error: result.error});
      }

      // Wait before next action
      if (i < task.profiles.length - 1) {
        await this.wait(this.delayBetweenActions);
      }
    }

    this.log(`Complete: ${results.sent.length} sent, ${results.failed.length} failed, ${results.remaining.length} remaining`);

    return {
      task: 'analyze_results',
      results: results,
      criteria: task.criteria,
      goal: task.goal
    };
  }

  checkDailyLimit() {
    const today = new Date().toDateString();
    if (today !== this.lastResetDate) {
      this.sentToday = 0;
      this.lastResetDate = today;
      this.log('Daily counter reset');
    }
  }

  async checkSafety(currentResults) {
    // If too many failures, stop
    const failureRate = currentResults.failed.length / (currentResults.sent.length + currentResults.failed.length);
    if (failureRate > 0.3 && currentResults.sent.length > 5) {
      this.log(`High failure rate: ${(failureRate * 100).toFixed(0)}%`, 'warning');
      return false;
    }

    // Check for rate limit warnings
    const recentErrors = currentResults.failed.slice(-3).map(f => f.error).join(' ').toLowerCase();
    if (recentErrors.includes('limit') || recentErrors.includes('captcha') || recentErrors.includes('restricted')) {
      this.log('Detected rate limiting or restrictions', 'error');
      return false;
    }

    return true;
  }

  async sendConnectionRequest(profile) {
    try {
      // Send to content script
      const response = await chrome.runtime.sendMessage({
        action: 'send_connection_request',
        profile: profile,
        message: profile.message
      });

      if (response.success) {
        this.log(`✓ Connected with ${profile.name}`);

        // Save to database
        await chrome.runtime.sendMessage({
          action: 'captureProfile',
          data: {
            ...profile,
            status: 'pending',
            connectionRequestSent: new Date().toISOString()
          }
        });

        return { success: true };
      } else {
        return { success: false, error: response.error };
      }

    } catch (error) {
      this.log(`Error sending to ${profile.name}: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  async wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  setDailyLimit(limit) {
    this.dailyLimit = limit;
    this.log(`Daily limit set to ${limit}`);
  }

  async sendToNextAgent(result) {
    this.log(`Sending results to Analyst`);
    return result;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ConnectorAgent;
}
