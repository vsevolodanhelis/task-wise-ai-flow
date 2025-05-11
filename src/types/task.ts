export type TaskStatus = "pending" | "in-progress" | "completed";

export type TaskTag = {
  id: string;
  name: string;
  color: string;
};

export type TaskPriority = "low" | "medium" | "high" | string;

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  progress?: number;
  dueDate?: Date | string | null;
  tags: TaskTag[];
  createdAt: Date | string;
  updatedAt: Date | string;
  completedAt?: Date | string | null;
  aiScore?: number | null;
}
