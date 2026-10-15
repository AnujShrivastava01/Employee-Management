import { z } from "zod";

export const departmentFormSchema = z.object({
  name: z.string().trim().min(1, "Department name is required").max(100, "Department name must be at most 100 characters"),
  description: z.string().trim().max(500, "Description must be at most 500 characters"),
});

export type DepartmentFormValues = z.infer<typeof departmentFormSchema>;
