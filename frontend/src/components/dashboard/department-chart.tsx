"use client";

import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DepartmentHeadcount } from "@/lib/api/types";

const ROW_HEIGHT = 36;

export function DepartmentChart({ data }: { data: DepartmentHeadcount[] }) {
  const height = Math.max(data.length * ROW_HEIGHT + 24, 160);
  const summary = data.map((row) => `${row.department}: ${row.count}`).join(", ");
  return (
    <div role="img" aria-label={`Employees per department. ${summary}`} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 32, bottom: 4, left: 0 }}>
          <CartesianGrid horizontal={false} stroke="#e4e7ec" strokeDasharray="3 3" />
          <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "#667085", fontSize: 12 }} />
          <YAxis
            type="category"
            dataKey="department"
            width={150}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#344054", fontSize: 13 }}
          />
          <Tooltip
            cursor={{ fill: "rgba(16,24,40,0.04)" }}
            formatter={(value) => [`${value} employees`, "Headcount"]}
            contentStyle={{ borderRadius: 8, border: "1px solid #e4e7ec", boxShadow: "0 8px 24px -8px rgb(16 24 40 / 0.2)", fontSize: 13 }}
          />
          <Bar dataKey="count" fill="#4f46e5" radius={[0, 4, 4, 0]} barSize={16} isAnimationActive={false}>
            <LabelList dataKey="count" position="right" fill="#344054" fontSize={12} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
