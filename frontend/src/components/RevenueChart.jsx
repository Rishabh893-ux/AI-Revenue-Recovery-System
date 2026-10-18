import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import "./RevenueChart.css";

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="revenue-chart-tooltip">
      <span className="revenue-chart-tooltip-label">{label}</span>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="revenue-chart-tooltip-row">
          <span style={{ color: entry.color }}>{entry.name}</span>
          <span>₹{entry.value.toLocaleString("en-IN")}</span>
        </div>
      ))}
    </div>
  );
}

export default function RevenueChart({ data }) {
  return (
    <div className="revenue-chart glass">
      <div className="revenue-chart-header">
        <h3>Revenue over time</h3>
        <div className="revenue-chart-legend">
          <span className="legend-dot legend-total" /> Total
          <span className="legend-dot legend-recovered" /> Recovered
        </div>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id="totalGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6d5ce7" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#6d5ce7" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="recoveredGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2dd4bf" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#2dd4bf" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis
            dataKey="month"
            stroke="rgba(255,255,255,0.35)"
            tick={{ fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            stroke="rgba(255,255,255,0.35)"
            tick={{ fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `₹${v / 1000}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="total"
            name="Total revenue"
            stroke="#6d5ce7"
            strokeWidth={2.5}
            fill="url(#totalGradient)"
          />
          <Area
            type="monotone"
            dataKey="recovered"
            name="Recovered revenue"
            stroke="#2dd4bf"
            strokeWidth={2.5}
            fill="url(#recoveredGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
