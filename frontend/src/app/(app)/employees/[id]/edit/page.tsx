import type { Metadata } from "next";
import { EditEmployee } from "@/components/employees/employee-editor";

export const metadata: Metadata = { title: "Edit employee" };

export default async function EditEmployeePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EditEmployee id={id} />;
}
