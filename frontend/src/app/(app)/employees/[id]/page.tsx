import type { Metadata } from "next";
import { EmployeeDetails } from "@/components/employees/employee-details";

export const metadata: Metadata = { title: "Employee details" };

export default async function EmployeeDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EmployeeDetails id={id} />;
}
