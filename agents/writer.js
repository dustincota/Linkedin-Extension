// Writer Agent - Creates personalized connection messages

class WriterAgent extends BaseAgent {
  constructor(apiKey) {
    super('Writer', apiKey);
    this.messageTemplates = {};
    this.userInfo = {};
  }

  getSystemPrompt() {
    return `You are Writer, a LinkedIn message personalization agent. Your job is to:
1. Craft highly personalized connection requests
2. Use conversation hooks from Researcher
3. Match tone to recipient's seniority/industry
4. Keep messages concise (under 300 characters)
5. Include clear value proposition

You are persuasive, authentic, and personable. Every message should feel hand-written.

Output messages in JSON format.`;
  }

  async execute(task) {
    this.log(`Writing messages for ${task.profiles.length} profiles`);

    const withMessages = [];

    // Write messages in batches
    const batchSize = 3;
    for (let i = 0; i < task.profiles.length; i += batchSize) {
      const batch = task.profiles.slice(i, i + batchSize);
      const batchResults = await this.writeBatch(batch, task.criteria);
      withMessages.push(...batchResults);

      this.log(`Progress: ${withMessages.length}/${task.profiles.length}`);
    }

    this.log(`All messages written`);

    return {
      task: 'send_connections',
      profiles: withMessages,
      criteria: task.criteria,
      goal: task.goal
    };
  }

  async writeBatch(profiles, criteria) {
    const prompt = `
Write personalized LinkedIn connection request messages for these profiles.

User info: ${JSON.stringify(this.userInfo, null, 2)}
Goal: ${criteria.goal || 'Build professional network'}

Profiles:
${profiles.map((p, i) => `
Profile ${i + 1}:
- Name: ${p.name}
- Title: ${p.title}
- Company: ${p.company}
- Score: ${p.score}/10
- Conversation Hooks: ${p.analysis.hooks.join(', ')}
- Reasoning: ${p.analysis.reasoning}
`).join('\n')}

For each profile, write a connection message that:
1. Uses their first name
2. References a specific hook
3. Explains why you're connecting
4. Is under 300 characters
5. Feels personal and authentic

Respond in JSON array:
[
  {
    "profileIndex": 0,
    "message": "Hi [Name], ...",
    "tone": "professional/casual/enthusiastic",
    "rationale": "why this approach"
  },
  ...
]
`;

    try {
      const response = await this.think(prompt);
      const messages = JSON.parse(response);

      return profiles.map((profile, index) => {
        const messageData = messages.find(m => m.profileIndex === index) || {
          message: `Hi ${profile.name.split(' ')[0]}, I'd love to connect!`,
          tone: 'professional',
          rationale: 'Default message'
        };

        return {
          ...profile,
          message: messageData.message,
          messageTone: messageData.tone,
          messageRationale: messageData.rationale
        };
      });

    } catch (error) {
      this.log(`Message writing error: ${error.message}`, 'error');
      // Return profiles with default messages
      return profiles.map(p => ({
        ...p,
        message: `Hi ${p.name.split(' ')[0]}, I'd love to connect and exchange ideas about ${p.title.toLowerCase()}!`,
        messageTone: 'professional',
        messageRationale: 'Default template'
      }));
    }
  }

  setUserInfo(info) {
    this.userInfo = info;
    this.log('User info updated');
  }

  async sendToNextAgent(result) {
    this.log(`Sending ${result.profiles.length} profiles with messages to Connector`);
    return result;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = WriterAgent;
}
