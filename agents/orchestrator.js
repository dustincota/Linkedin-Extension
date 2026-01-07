// Agent Orchestrator - Coordinates the multi-agent system

class AgentOrchestrator {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.agents = {};
    this.status = 'idle'; // idle, running, paused, error, complete
    this.currentGoal = null;
    this.pipeline = [];
    this.logs = [];
    this.listeners = [];
  }

  async initialize() {
    console.log('Initializing Agent System...');

    // Import and create all agents
    // Note: In browser environment, these would be loaded differently
    this.agents = {
      scout: new ScoutAgent(this.apiKey),
      researcher: new ResearcherAgent(this.apiKey),
      writer: new WriterAgent(this.apiKey),
      connector: new ConnectorAgent(this.apiKey),
      analyst: new AnalystAgent(this.apiKey)
    };

    // Override sendToNextAgent for all agents to route through orchestrator
    Object.values(this.agents).forEach(agent => {
      agent.sendToNextAgent = async (result) => {
        return await this.routeToNextAgent(agent.name, result);
      };
    });

    console.log('✓ All agents initialized');
    this.log('System ready', 'system');
  }

  // Main entry point - user gives a goal
  async executeGoal(goal, criteria) {
    this.log(`🎯 New Goal: ${goal}`, 'system');
    this.status = 'running';
    this.currentGoal = {goal, criteria, startTime: Date.now()};

    try {
      // Start the pipeline: Scout → Researcher → Writer → Connector → Analyst
      const scoutTask = {
        goal: goal,
        criteria: criteria,
        type: 'search'
      };

      await this.agents.scout.addTask(scoutTask);
      this.agents.scout.start();

      this.notifyListeners({
        type: 'goal_started',
        goal: goal,
        status: this.status
      });

    } catch (error) {
      this.log(`Error executing goal: ${error.message}`, 'error');
      this.status = 'error';
      this.notifyListeners({
        type: 'goal_error',
        error: error.message
      });
    }
  }

  // Route results between agents
  async routeToNextAgent(fromAgent, result) {
    this.log(`Routing from ${fromAgent} to next agent`, 'system');

    const routingMap = {
      'Scout': 'researcher',
      'Researcher': 'writer',
      'Writer': 'connector',
      'Connector': 'analyst',
      'Analyst': null // Last in chain
    };

    const nextAgentName = routingMap[fromAgent];

    if (!nextAgentName) {
      // End of pipeline
      this.log('Pipeline complete', 'system');
      await this.handlePipelineComplete(result);
      return;
    }

    const nextAgent = this.agents[nextAgentName];
    this.log(`→ Sending to ${nextAgent.name}`, 'system');

    await nextAgent.addTask(result);
    nextAgent.start();

    this.notifyListeners({
      type: 'agent_transition',
      from: fromAgent,
      to: nextAgent.name
    });
  }

  async handlePipelineComplete(finalResult) {
    this.log('🎉 Pipeline complete, analyzing results...', 'system');

    // Analyst has decided what to do next
    if (finalResult.shouldContinue) {
      if (finalResult.nextAction.task === 'search_more') {
        this.log('Analyst recommends searching for more prospects', 'system');
        // Start another cycle with adjusted criteria
        const newTask = {
          goal: this.currentGoal.goal,
          criteria: finalResult.adjustedCriteria,
          type: 'search'
        };
        await this.agents.scout.addTask(newTask);
        this.agents.scout.start();
      }
    } else {
      this.status = 'complete';
      const duration = Date.now() - this.currentGoal.startTime;

      this.log(`✅ Goal complete in ${(duration / 1000).toFixed(0)}s`, 'system');

      this.notifyListeners({
        type: 'goal_complete',
        goal: this.currentGoal.goal,
        metrics: finalResult.metrics,
        recommendations: finalResult.recommendations,
        duration: duration
      });
    }
  }

  // Control methods
  pause() {
    this.status = 'paused';
    Object.values(this.agents).forEach(agent => agent.pause());
    this.log('System paused', 'system');
  }

  resume() {
    this.status = 'running';
    Object.values(this.agents).forEach(agent => agent.resume());
    this.log('System resumed', 'system');
  }

  stop() {
    this.status = 'idle';
    Object.values(this.agents).forEach(agent => agent.stop());
    this.currentGoal = null;
    this.log('System stopped', 'system');
  }

  // Configuration
  setDailyLimit(limit) {
    this.agents.connector.setDailyLimit(limit);
    this.log(`Daily limit set to ${limit}`, 'system');
  }

  setUserInfo(info) {
    this.agents.writer.setUserInfo(info);
    this.log('User info updated', 'system');
  }

  // Status and monitoring
  getStatus() {
    return {
      status: this.status,
      currentGoal: this.currentGoal,
      agents: Object.fromEntries(
        Object.entries(this.agents).map(([name, agent]) => [name, agent.getState()])
      ),
      logs: this.logs.slice(-50) // Last 50 logs
    };
  }

  getMetrics() {
    return this.agents.analyst.getMetrics();
  }

  getRecommendations() {
    return this.agents.analyst.getRecommendations();
  }

  // Logging
  log(message, level = 'info') {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: level,
      message: message
    };
    this.logs.push(logEntry);
    console.log(`[ORCHESTRATOR] [${level.toUpperCase()}] ${message}`);

    this.notifyListeners({
      type: 'log',
      log: logEntry
    });
  }

  // Event system for UI updates
  addEventListener(listener) {
    this.listeners.push(listener);
  }

  removeEventListener(listener) {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  notifyListeners(event) {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Listener error:', error);
      }
    });
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AgentOrchestrator;
}
