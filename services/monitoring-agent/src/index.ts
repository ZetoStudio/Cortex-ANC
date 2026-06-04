import { createLogger, llmClient } from '@cortex/shared';
import { createConsumer, TOPICS } from '@cortex/shared/kafka';
import pg from 'pg';

const log = createLogger('monitoring-agent');
const { Pool } = pg;

type Interaction = {
  id: string;
  query: string;
  answer?: string;
  success?: boolean;
  feedback?: string;
};

async function evaluateFailure(interaction: Interaction): Promise<string> {
  return llmClient.complete(
    `Classify this Q&A failure and suggest ONE fix (missing tool / stale graph / prompt):
Q: ${interaction.query}
A: ${interaction.answer ?? 'none'}
Feedback: ${interaction.feedback ?? 'negative'}
Fix:`,
    { temperature: 0.2 },
  );
}

async function maybeOpenRemediationPr(fix: string, query: string): Promise<void> {
  if (!process.env.GITHUB_TOKEN) {
    log.info({ fix }, 'Remediation suggestion (no GITHUB_TOKEN for auto-PR)');
    return;
  }
  log.info({ query, fix }, 'Would open GitHub PR via connector — stub for local dev');
}

async function main(): Promise<void> {
  const consumer = await createConsumer('cortex-monitoring-agent');
  await consumer.subscribe({ topic: TOPICS.AGENT_INTERACTIONS, fromBeginning: false });

  log.info('Monitoring agent.interactions');

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;
      const interaction = JSON.parse(message.value.toString()) as Interaction;
      if (interaction.success !== false) return;

      const fix = await evaluateFailure(interaction);
      await maybeOpenRemediationPr(fix, interaction.query);

      const dbUrl = process.env.DATABASE_URL;
      if (dbUrl) {
        const pool = new Pool({ connectionString: dbUrl });
        await pool.query(`UPDATE cortex_agent_interactions SET feedback = $1 WHERE id = $2`, [
          `remediation: ${fix}`,
          interaction.id,
        ]);
        await pool.end();
      }
    },
  });
}

main().catch((err) => {
  log.error({ err }, 'monitoring-agent failed');
  process.exit(1);
});
