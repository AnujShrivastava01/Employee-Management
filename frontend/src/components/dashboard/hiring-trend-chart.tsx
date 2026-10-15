"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { HiringTrendPoint } from "@/lib/api/types";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function monthLabel(month: string): string {
  const [year = "", mm = "1"] = month.split("-");
  return `${MONTHS[Number(mm) - 1] ?? mm} ’${year.slice(2)}`;
}

export function HiringTrendChart({ data }: { data: HiringTrendPoint[] }) {
  const summary = data.map((point) => `${monthLabel(point.month)}: ${point.count}`).join(", ");
  return (
    <div role="img" aria-label={`Employees hired per month, last 12 months. ${summary}`} className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 12, right: 12, bottom: 0, left: -18 }}>
          <defs>
            <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6b7bea" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#6b7bea" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#e2e5f4" strokeDasharray="3 4" />
          <XAxis
            dataKey="month"
            tickFormatter={(value: string) => monthLabel(value).split(" ")[0] ?? value}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#5a6286", fontSize: 12 }}
            interval="preserveStartEnd"
            minTickGap={14}
          />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "#5a6286", fontSize: 12 }} />
          <Tooltip
            cursor={{ stroke: "#6b7bea", strokeDasharray: "4 4" }}
            labelFormatter={(value) => monthLabel(String(value))}
            formatter={(value) => [`${value} ${Number(value) === 1 ? "hire" : "hires"}`, ""]}
            contentStyle={{ borderRadius: 12, border: "1px solid #e2e5f4", boxShadow: "0 12px 32px -10px rgb(20 27 88 / 0.35)", fontSize: 13 }}
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke="#3140c4"
            strokeWidth={2.5}
            fill="url(#trend-fill)"
            dot={{ r: 3.5, fill: "#fff", stroke: "#3140c4", strokeWidth: 2 }}
            activeDot={{ r: 6, fill: "#ff7a59", stroke: "#fff", strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
