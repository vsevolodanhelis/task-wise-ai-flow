
import { useState } from "react";
import { useTaskContext } from "@/context/TaskContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip 
} from "recharts";
import { TaskTag } from "@/types/task";
import { cn } from "@/lib/utils";

interface TaskAnalyticsProps {
  className?: string;
}

const COLORS = ["#9b87f5", "#5C95FF", "#6ECB63", "#FFCB42", "#FF884B", "#ea384c"];

export const TaskAnalytics: React.FC<TaskAnalyticsProps> = ({ className }) => {
  const { tasks, tags } = useTaskContext();
  const [activeTab, setActiveTab] = useState<"overview" | "tags" | "priority">("overview");

  // Count task statuses
  const statusCounts = {
    pending: tasks.filter(t => t.status === "pending").length,
    "in-progress": tasks.filter(t => t.status === "in-progress").length,
    completed: tasks.filter(t => t.status === "completed").length,
  };

  // Count tasks by tag
  const tagCounts: Record<string, number> = {};
  tags.forEach(tag => {
    tagCounts[tag.id] = tasks.filter(task => 
      task.tags.some(t => t.id === tag.id)
    ).length;
  });

  // Count tasks by priority
  const priorityCounts = {
    low: tasks.filter(t => t.priority === "low").length,
    medium: tasks.filter(t => t.priority === "medium").length,
    high: tasks.filter(t => t.priority === "high").length,
    urgent: tasks.filter(t => t.priority === "urgent").length,
  };

  // Calculate completion rate
  const totalTasks = tasks.length;
  const completedTasks = statusCounts.completed;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  // Average AI priority score
  const averageAiScore = tasks.length > 0
    ? Math.round(tasks.reduce((acc, task) => acc + (task.aiScore || 0), 0) / tasks.length)
    : 0;

  // Prepare data for pie chart
  const statusData = [
    { name: "Pending", value: statusCounts.pending },
    { name: "In Progress", value: statusCounts["in-progress"] },
    { name: "Completed", value: statusCounts.completed },
  ];

  // Prepare data for tag bar chart
  const tagData = Object.entries(tagCounts)
    .map(([id, count]) => ({
      name: tags.find(t => t.id === id)?.name || id,
      value: count,
      color: tags.find(t => t.id === id)?.color || "#9b87f5"
    }))
    .sort((a, b) => b.value - a.value);

  // Prepare data for priority bar chart
  const priorityData = [
    { name: "Low", value: priorityCounts.low, color: "#5C95FF" },
    { name: "Medium", value: priorityCounts.medium, color: "#FFCB42" },
    { name: "High", value: priorityCounts.high, color: "#FF884B" },
    { name: "Urgent", value: priorityCounts.urgent, color: "#ea384c" },
  ];

  return (
    <Card className={cn("w-full overflow-hidden", className)}>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Task Analytics</CardTitle>
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab("overview")}
              className={cn(
                "px-3 py-1 text-sm rounded-md",
                activeTab === "overview"
                  ? "bg-task-purple text-white"
                  : "text-muted-foreground hover:bg-accent"
              )}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("tags")}
              className={cn(
                "px-3 py-1 text-sm rounded-md",
                activeTab === "tags"
                  ? "bg-task-purple text-white"
                  : "text-muted-foreground hover:bg-accent"
              )}
            >
              Tags
            </button>
            <button
              onClick={() => setActiveTab("priority")}
              className={cn(
                "px-3 py-1 text-sm rounded-md",
                activeTab === "priority"
                  ? "bg-task-purple text-white"
                  : "text-muted-foreground hover:bg-accent"
              )}
            >
              Priority
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <h4 className="text-sm font-medium">Task Completion Rate</h4>
                <span className="text-sm font-medium">{completionRate}%</span>
              </div>
              <Progress value={completionRate} className="h-2" />
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-accent/50 p-4 rounded-lg">
                <div className="text-2xl font-bold">{totalTasks}</div>
                <div className="text-xs text-muted-foreground">Total Tasks</div>
              </div>
              <div className="bg-accent/50 p-4 rounded-lg">
                <div className="text-2xl font-bold">{averageAiScore}</div>
                <div className="text-xs text-muted-foreground">Avg. Priority Score</div>
              </div>
            </div>
            
            <div className="h-[200px]">
              <h4 className="text-sm font-medium mb-2">Task Status</h4>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => 
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
        
        {activeTab === "tags" && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Tasks by Tag</h4>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tagData} layout="vertical">
                  <XAxis type="number" />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={100}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip />
                  <Bar dataKey="value">
                    {tagData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
        
        {activeTab === "priority" && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Tasks by Priority</h4>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value">
                    {priorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
