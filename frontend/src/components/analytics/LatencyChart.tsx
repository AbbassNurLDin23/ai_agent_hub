import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";
import { ChartEmptyState } from "./ChartEmptyState";
import type { MetricsSnapshot } from "@/types";

interface LatencyChartProps {
  data: MetricsSnapshot[];
}

export function LatencyChart({ data }: LatencyChartProps) {
  const chartData = (data ?? []).map((d) => ({
    time: format(new Date(d.updatedAt), "HH:mm"),
    avgLatency: Math.round(d.avgLatencyMs),
    lastLatency: Math.round(d.lastResponseLatencyMs),
  }));

  return (
    <div className="glass-panel p-6">
      <h3 className="text-lg font-semibold mb-4">Response Latency</h3>
      <div className="h-[300px]">
        {chartData.length === 0 ? (
          <ChartEmptyState type="latency" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                vertical={false}
              />
              <XAxis
                dataKey="time"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tickLine={false}
                tickFormatter={(value) => `${value}ms`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  color: "hsl(var(--foreground))",
                }}
                labelStyle={{ color: "hsl(var(--muted-foreground))" }}
              />
              <Line
                type="monotone"
                dataKey="avgLatency"
                name="Avg Latency"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: "hsl(var(--primary))" }}
                isAnimationActive={true}
                animationDuration={300}
                animationEasing="ease-out"
              />
              <Line
                type="monotone"
                dataKey="lastLatency"
                name="Last Response"
                stroke="hsl(var(--accent))"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: "hsl(var(--accent))" }}
                isAnimationActive={true}
                animationDuration={300}
                animationEasing="ease-out"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
