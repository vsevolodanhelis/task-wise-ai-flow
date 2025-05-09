
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export type TaskStatus = 'pending' | 'in-progress' | 'completed';

export type TaskTag = {
  id: string;
  name: string;
  color: string;
};

export type Task = {
  id: string;
  title: string;
  description: string;
  dueDate: Date | null;
  priority: TaskPriority;
  status: TaskStatus;
  tags: TaskTag[];
  createdAt: Date;
  updatedAt: Date;
  aiScore?: number; // AI computed score for prioritization
  dependencies?: string[]; // IDs of tasks this task depends on
  estimatedTime?: number; // In minutes
  completedAt?: Date;
  progress?: number; // Progress percentage (0-100)
};
