// Base Agent Class
// All specialized agents inherit from this

class BaseAgent {
  constructor(name, apiKey) {
    this.name = name;
    this.apiKey = apiKey; // OpenAI or Claude API key
    this.status = 'idle'; // idle, working, paused, error
    this.taskQueue = [];
    this.results = [];
    this.metrics = {
      tasksCompleted: 0,
      tasksFailed: 0,
      averageTime: 0
    };
  }

  // Core methods every agent must implement
  async execute(task) {
    throw new Error(`${this.name} must implement execute() method`);
  }

  // AI Decision Making - sends prompt to Claude
  async think(prompt, context = {}) {
    try {
      // Using Claude API (Anthropic)
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 4096,
          system: this.getSystemPrompt(),
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Claude API error: ${error.error?.message || response.statusText}`);
      }

      const data = await response.json();
      return data.content[0].text;
    } catch (error) {
      console.error(`${this.name} thinking error:`, error);
      throw error;
    }
  }

  // Each agent defines its system prompt
  getSystemPrompt() {
    return `You are ${this.name}, a specialized AI agent.`;
  }

  // Queue management
  async addTask(task) {
    this.taskQueue.push({
      ...task,
      id: Date.now() + Math.random(),
      addedAt: new Date().toISOString(),
      status: 'pending'
    });
    this.log(`Task added: ${task.type}`);
  }

  async processQueue() {
    while (this.taskQueue.length > 0 && this.status === 'working') {
      const task = this.taskQueue.shift();
      try {
        task.status = 'processing';
        const startTime = Date.now();

        const result = await this.execute(task);

        const endTime = Date.now();
        const duration = endTime - startTime;

        task.status = 'completed';
        task.result = result;
        task.duration = duration;

        this.results.push(task);
        this.metrics.tasksCompleted++;
        this.updateAverageTime(duration);

        this.log(`Task completed in ${duration}ms`);
        await this.sendToNextAgent(result);

      } catch (error) {
        task.status = 'failed';
        task.error = error.message;
        this.metrics.tasksFailed++;
        this.log(`Task failed: ${error.message}`, 'error');
      }
    }
  }

  updateAverageTime(newTime) {
    const total = this.metrics.averageTime * (this.metrics.tasksCompleted - 1) + newTime;
    this.metrics.averageTime = total / this.metrics.tasksCompleted;
  }

  async sendToNextAgent(result) {
    // Override in orchestrator to route to next agent
    this.log(`Result ready for next agent`);
  }

  // Logging
  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${this.name}] [${level.toUpperCase()}] ${message}`);

    // Send to orchestrator for UI display
    if (typeof self !== 'undefined' && self.postMessage) {
      self.postMessage({
        type: 'agent_log',
        agent: this.name,
        message,
        level,
        timestamp
      });
    }
  }

  // Control methods
  start() {
    this.status = 'working';
    this.log('Agent started');
    this.processQueue();
  }

  pause() {
    this.status = 'paused';
    this.log('Agent paused');
  }

  resume() {
    this.status = 'working';
    this.log('Agent resumed');
    this.processQueue();
  }

  stop() {
    this.status = 'idle';
    this.taskQueue = [];
    this.log('Agent stopped');
  }

  // Get current state
  getState() {
    return {
      name: this.name,
      status: this.status,
      queueLength: this.taskQueue.length,
      metrics: this.metrics,
      resultsCount: this.results.length
    };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BaseAgent;
}
