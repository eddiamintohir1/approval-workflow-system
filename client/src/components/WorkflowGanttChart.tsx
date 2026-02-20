import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface WorkflowTimelineData {
  id: string;
  workflowNumber: string;
  title: string;
  type: string;
  overallStatus: string;
  createdAt: Date;
  updatedAt: Date;
  stages: {
    stageName: string;
    status: string;
    startDate: Date;
    endDate: Date | null;
    duration: number;
    stageOrder: number;
  }[];
}

interface WorkflowGanttChartProps {
  data: WorkflowTimelineData[];
}

export function WorkflowGanttChart({ data }: WorkflowGanttChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Workflow Timeline</CardTitle>
          <CardDescription>Gantt chart showing workflow progress</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">No workflow data available</p>
        </CardContent>
      </Card>
    );
  }

  // Find the earliest and latest dates across all workflows
  const allDates = data.flatMap(w => [
    new Date(w.createdAt),
    ...w.stages.map(s => new Date(s.startDate)),
    ...w.stages.filter(s => s.endDate).map(s => new Date(s.endDate!))
  ]);
  const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
  const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));
  const totalDays = Math.max(1, Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)));

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-gray-400",
      in_progress: "bg-blue-500",
      approved: "bg-green-500",
      rejected: "bg-red-500",
      completed: "bg-green-600",
      draft: "bg-gray-300",
      discontinued: "bg-orange-500",
    };
    return colors[status] || "bg-gray-400";
  };

  const calculatePosition = (date: Date) => {
    const daysSinceStart = Math.floor((date.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
    return (daysSinceStart / totalDays) * 100;
  };

  const calculateWidth = (startDate: Date, endDate: Date | null) => {
    const end = endDate || new Date();
    const duration = Math.max(1, Math.ceil((end.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    return (duration / totalDays) * 100;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workflow Timeline</CardTitle>
        <CardDescription>Gantt chart showing workflow progress and stage durations</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Timeline header */}
          <div className="flex items-center justify-between text-xs text-muted-foreground border-b pb-2">
            <span>{format(minDate, "MMM dd, yyyy")}</span>
            <span>{format(maxDate, "MMM dd, yyyy")}</span>
          </div>

          {/* Workflow rows */}
          <div className="space-y-4">
            {data.slice(0, 10).map((workflow) => (
              <div key={workflow.id} className="space-y-2">
                {/* Workflow header */}
                <div className="flex items-center gap-2">
                  <Badge variant={workflow.type === "MAF" ? "default" : "secondary"} className="text-xs">
                    {workflow.type}
                  </Badge>
                  <span className="font-mono text-xs text-muted-foreground">{workflow.workflowNumber}</span>
                  <span className="text-sm font-medium truncate flex-1">{workflow.title}</span>
                </div>

                {/* Timeline bar */}
                <div className="relative h-8 bg-muted/30 rounded-md overflow-hidden">
                  {workflow.stages.map((stage, index) => {
                    const left = calculatePosition(new Date(stage.startDate));
                    const width = calculateWidth(new Date(stage.startDate), stage.endDate);
                    
                    return (
                      <div
                        key={index}
                        className={`absolute top-1 bottom-1 ${getStatusColor(stage.status)} rounded transition-all hover:opacity-80`}
                        style={{
                          left: `${left}%`,
                          width: `${width}%`,
                        }}
                        title={`${stage.stageName} - ${stage.status} (${stage.duration} days)`}
                      >
                        <div className="px-2 py-1 text-xs text-white truncate">
                          {stage.stageName}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Stage legend */}
                <div className="flex flex-wrap gap-2 text-xs">
                  {workflow.stages.map((stage, index) => (
                    <div key={index} className="flex items-center gap-1">
                      <div className={`w-3 h-3 rounded ${getStatusColor(stage.status)}`} />
                      <span className="text-muted-foreground">
                        {stage.stageName} ({stage.duration}d)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {data.length > 10 && (
            <p className="text-xs text-muted-foreground text-center pt-4 border-t">
              Showing 10 of {data.length} workflows
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
