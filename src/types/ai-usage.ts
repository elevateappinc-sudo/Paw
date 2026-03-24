export interface AiUsageLog {
  id: string;
  userId: string;
  petId: string | null;
  sessionId: string;
  modelUsed: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  feature: 'vet-chat' | 'content-hub';
  createdAt: string;
}

export const MODEL_COSTS: Record<string, { input: number; output: number }> = {
  'llama-3.3-70b-versatile': { input: 0, output: 0 },
  'claude-3-5-haiku-20241022': { input: 0.80, output: 4.00 },
  'claude-sonnet-4-5': { input: 3.00, output: 15.00 },
};

export function calculateCostUsd(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const costs = MODEL_COSTS[model] ?? { input: 0, output: 0 };
  return (inputTokens * costs.input + outputTokens * costs.output) / 1_000_000;
}
