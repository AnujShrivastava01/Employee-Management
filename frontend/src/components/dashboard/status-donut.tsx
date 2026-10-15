"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

interface StatusDonutProps {
  active: number;
  inactive: number;
}

export function StatusDonut({ active, inactive }: StatusDonutProps) {
  const total = active + inactive;
  const data = [
    { name: "Active", value: active, color: "#4b5bdc" },
    { name: "Inactive", value: inactive, color: "#ff7a59" },
  ];
  return (
    <div className="flex flex-col items-center gap-5">
      <div role="img" aria-label={`${active} active and ${inactive} inactive employees`} className="relative h-52 w-52">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              innerRadius="68%"
              outerRadius="92%"
              paddingAngle={total > 0 && active > 0 && inactive > 0 ? 4 : 0}
              cornerRadius={8}
              stroke="none"
              startAngle={90}
              endAngle={-270}
              isAnimationActive={false}
            >
              {data.map((slice) => (
                <Cell key={slice.name} fill={slice.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [`${value} employees`, String(name)]}
              contentStyle={{ borderRadius: 12, border: "1px solid #e2e5f4", fontSize: 13 }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="text-center">
            <p className="font-display text-4xl font-bold tabular-nums text-navy">{total}</p>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">employees</p>
          </div>
        </div>
      </div>
      <ul className="grid w-full grid-cols-2 gap-3 text-sm">
        {data.map((slice) => (
          <li key={slice.name} className="flex items-center gap-2 rounded-lg bg-surface-muted px-3 py-2">
            <span aria-hidden className="size-2.5 rounded-full" style={{ background: slice.color }} />
            <span className="text-muted-foreground">{slice.name}</span>
            <span className="ml-auto font-semibold tabular-nums">{slice.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
