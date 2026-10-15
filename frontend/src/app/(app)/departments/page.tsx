import type { Metadata } from "next";
import { DepartmentManager } from "@/components/departments/department-manager";

export const metadata: Metadata = { title: "Departments" };

export default function DepartmentsPage() {
  return <DepartmentManager />;
}
