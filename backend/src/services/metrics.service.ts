import { prisma } from "../db";

type MetricsRow = Awaited<
  ReturnType<typeof prisma.metricsSnapshot.findMany>
>[number];

export async function updateMetricsForAgent(
  agentId: string,
  data: { tokensUsed: number; latencyMs: number }
) {
  const current = await prisma.metricsSnapshot.findUnique({
    where: { agentId },
  });

  const newMessagesCount = (current?.messagesCount ?? 0) + 2;
  const newTokensProcessed = (current?.tokensProcessed ?? 0) + data.tokensUsed;

  const prevAvg = current?.avgLatencyMs ?? 0;
  const sampleCount = Math.max(
    1,
    Math.floor((current?.messagesCount ?? 0) / 2)
  );

  const newAvg = Math.round(
    (prevAvg * sampleCount + data.latencyMs) / (sampleCount + 1)
  );

  await prisma.metricsSnapshot.upsert({
    where: { agentId },
    update: {
      messagesCount: newMessagesCount,
      tokensProcessed: newTokensProcessed,
      avgLatencyMs: newAvg,
      lastResponseLatencyMs: data.latencyMs,
    },
    create: {
      agentId,
      messagesCount: newMessagesCount,
      tokensProcessed: newTokensProcessed,
      avgLatencyMs: data.latencyMs,
      lastResponseLatencyMs: data.latencyMs,
    },
  });
}

export async function getMetrics(agentId?: string) {
  if (agentId) {
    return prisma.metricsSnapshot.findUnique({ where: { agentId } });
  }

  const rows = (await prisma.metricsSnapshot.findMany()) as MetricsRow[];

  const messagesCount = rows.reduce<number>(
    (sum, r) => sum + (r.messagesCount ?? 0),
    0
  );

  const tokensProcessed = rows.reduce<number>(
    (sum, r) => sum + (r.tokensProcessed ?? 0),
    0
  );

  const totalSamples = rows.reduce<number>((sum, r) => {
    const exchanges = Math.max(0, Math.floor((r.messagesCount ?? 0) / 2));
    return sum + exchanges;
  }, 0);

  const weightedLatencySum = rows.reduce<number>((sum, r) => {
    const exchanges = Math.max(0, Math.floor((r.messagesCount ?? 0) / 2));
    const avg = r.avgLatencyMs ?? 0;
    return sum + avg * exchanges;
  }, 0);

  const avgLatencyMs =
    totalSamples === 0 ? 0 : Math.round(weightedLatencySum / totalSamples);

  const lastResponseLatencyMs =
    rows.length === 0
      ? 0
      : Math.max(...rows.map((r) => r.lastResponseLatencyMs ?? 0));

  return {
    agentId: "ALL",
    messagesCount,
    tokensProcessed,
    avgLatencyMs,
    lastResponseLatencyMs,
    updatedAt: new Date(),
  };
}
