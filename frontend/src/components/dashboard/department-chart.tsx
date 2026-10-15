"use client";

import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DepartmentHeadcount } from "@/lib/api/types";

const ROW_HEIGHT = 38;

export function DepartmentChart({ data }: { data: DepartmentHeadcount[] }) {
  const height = Math.max(data.length * ROW_HEIGHT + 24, 160);
  const summary = data.map((row) => `${row.department}: ${row.count}`).join(", ");
  return (
    <div role="img" aria-label={`Employees per department. ${summary}`} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 32, bottom: 4, left: 0 }}>
          <defs>
            <linearGradient id="dept-bar" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#8f9cf3" />
              <stop offset="100%" stopColor="#3140c4" />
            </linearGradient>
            <linearGradient id="dept-bar-top" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#ffa58d" />
              <stop offset="100%" stopColor="#ff6a45" />
            </linearGradient>
          </defs>
          <CartesianGrid horizontal={false} stroke="#e2e5f4" strokeDasharray="3 4" />
          <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "#5a6286", fontSize: 12 }} />
          <YAxis type="category" dataKey="department" width={150} tickLine={false} axisLine={false} tick={{ fill: "#2a3260", fontSize: 13 }} />
          <Tooltip
            cursor={{ fill: "rgba(107,123,234,0.08)" }}
            formatter={(value) => [`${value} employees`, "Headcount"]}
            contentStyle={{ borderRadius: 12, border: "1px solid #e2e5f4", boxShadow: "0 12px 32px -10px rgb(20 27 88 / 0.35)", fontSize: 13 }}
          />
          <Bar dataKey="count" radius={[0, 8, 8, 0]} barSize={18} isAnimationActive={false}>
            {data.map((row, index) => (
              <Cell key={row.department} fill={index === 0 ? "url(#dept-bar-top)" : "url(#dept-bar)"} />
            ))}
            <LabelList dataKey="count" position="right" fill="#1f2a7a" fontSize={12} fontWeight={600} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
