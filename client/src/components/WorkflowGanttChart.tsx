import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";
import { ChevronDown, ChevronRight, ExternalLink, ChevronLeft, ChevronRight as ChevronRightIcon } from "lucide-react";

interface WorkflowTimelineData {
  id: string;
  workflowNumber: string;
  title: string;
  type: string;
  department: string;
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
  const [expandedDepartments, setExpandedDepartments] = useState<Set<string>>(new Set());
  const [dateRange, setDateRange] = useState({
    start: startOfMonth(subMonths(new Date(), 1)),
    end: endOfMonth(new Date())
  });

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Workflow Timeline</CardTitle>
          <CardDescription>Gantt chart showing workflow progress by department</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">No workflow data available</p>
        </CardContent>
      </Card>
    );
  }

  // Filter workflows by date range
  const filteredData = data.filter(w => {
    const workflowStart = new Date(w.createdAt);
    const workflowEnd = w.stages.length > 0 
      ? (w.stages[w.stages.length - 1].endDate || new Date())
      : new Date(w.updatedAt);
    
    return (workflowStart <= dateRange.end && workflowEnd >= dateRange.start);
  });

  // Group workflows by department
  const workflowsByDepartment = filteredData.reduce((acc, workflow) => {
    const dept = workflow.department || "Unassigned";
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(workflow);
    return acc;
  }, {} as Record<string, WorkflowTimelineData[]>);

  const departments = Object.keys(workflowsByDepartment).sort();

  const toggleDepartment = (dept: string) => {
    setExpandedDepartments(prev => {
      const next = new Set(prev);
      if (next.has(dept)) {
        next.delete(dept);
      } else {
        next.add(dept);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedDepartments(new Set(departments));
  };

  const collapseAll = () => {
    setExpandedDepartments(new Set());
  };

  const goToPreviousMonth = () => {
    setDateRange({
      start: startOfMonth(subMonths(dateRange.start, 1)),
      end: endOfMonth(subMonths(dateRange.end, 1))
    });
  };

  const goToNextMonth = () => {
    setDateRange({
      start: startOfMonth(addMonths(dateRange.start, 1)),
      end: endOfMonth(addMonths(dateRange.end, 1))
    });
  };

  const goToCurrentMonth = () => {
    setDateRange({
      start: startOfMonth(subMonths(new Date(), 1)),
      end: endOfMonth(new Date())
    });
  };

  const totalDays = Math.max(1, Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24)));

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
    const daysSinceStart = Math.floor((date.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, Math.min(100, (daysSinceStart / totalDays) * 100));
  };

  const calculateWidth = (startDate: Date, endDate: Date | null) => {
    const end = endDate || new Date();
    const clampedStart = new Date(Math.max(startDate.getTime(), dateRange.start.getTime()));
    const clampedEnd = new Date(Math.min(end.getTime(), dateRange.end.getTime()));
    
    if (clampedStart > dateRange.end || clampedEnd < dateRange.start) {
      return 0;
    }
    
    const duration = Math.max(1, Math.ceil((clampedEnd.getTime() - clampedStart.getTime()) / (1000 * 60 * 60 * 24)));
    return Math.min(100, (duration / totalDays) * 100);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Workflow Timeline by Department</CardTitle>
            <CardDescription>Gantt chart showing workflow progress grouped by department</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={expandAll}>
              Expand All
            </Button>
            <Button variant="outline" size="sm" onClick={collapseAll}>
              Collapse All
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Date Range Controls */}
          <div className="flex items-center justify-between border-b pb-4">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-sm font-medium min-w-[200px] text-center">
                {format(dateRange.start, "MMM dd, yyyy")} - {format(dateRange.end, "MMM dd, yyyy")}
              </div>
              <Button variant="outline" size="sm" onClick={goToNextMonth}>
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={goToCurrentMonth}>
              Current Period
            </Button>
          </div>

          {/* Department Groups */}
          <div className="space-y-4">
            {departments.map((department) => {
              const workflows = workflowsByDepartment[department];
              const isExpanded = expandedDepartments.has(department);
              
              return (
                <div key={department} className="border rounded-lg overflow-hidden">
                  {/* Department Header */}
                  <button
                    onClick={() => toggleDepartment(department)}
                    className="w-full flex items-center justify-between p-4 bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="font-semibold">{department}</span>
                      <Badge variant="secondary" className="text-xs">{workflows.length} workflows</Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{workflows.filter(w => w.overallStatus === "completed").length} completed</span>
                      <span>•</span>
                      <span>{workflows.filter(w => w.overallStatus === "in_progress").length} in progress</span>
                    </div>
                  </button>

                  {/* Workflows List */}
                  {isExpanded && (
                    <div className="p-2 space-y-1 bg-card">
                      {workflows.map((workflow) => (
                        <div key={workflow.id} className="flex items-center gap-2 py-1 hover:bg-muted/30 rounded px-2">
                          {/* Workflow info - compact single line */}
                          <Badge variant={workflow.type === "MAF" ? "default" : "secondary"} className="text-xs shrink-0">
                            {workflow.type}
                          </Badge>
                          <span className="font-mono text-xs text-muted-foreground shrink-0">{workflow.workflowNumber}</span>
                          <span className="text-sm truncate flex-1 min-w-0">{workflow.title}</span>
                          <Badge 
                            variant={workflow.overallStatus === "completed" ? "default" : "secondary"}
                            className={
                              workflow.overallStatus === "completed" ? "bg-green-600 shrink-0" :
                              workflow.overallStatus === "rejected" ? "bg-red-600 shrink-0" :
                              workflow.overallStatus === "in_progress" ? "bg-blue-600 shrink-0" :
                              "shrink-0"
                            }
                          >
                            {workflow.overallStatus}
                          </Badge>
                          
                          {/* Inline timeline bar */}
                          <div className="relative h-6 w-64 bg-muted/30 rounded overflow-hidden shrink-0">
                            {workflow.stages.map((stage, index) => {
                              const left = calculatePosition(new Date(stage.startDate));
                              const width = calculateWidth(new Date(stage.startDate), stage.endDate);
                              
                              if (width === 0) return null;
                              
                              return (
                                <div
                                  key={index}
                                  className={`absolute top-0.5 bottom-0.5 ${getStatusColor(stage.status)} rounded transition-all hover:opacity-80 cursor-pointer`}
                                  style={{
                                    left: `${left}%`,
                                    width: `${width}%`,
                                  }}
                                  title={`${stage.stageName} - ${stage.status} (${stage.duration} days)`}
                                />
                              );
                            })}
                          </div>
                          
                          <Link href={`/workflows/${workflow.id}`}>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 shrink-0">
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {filteredData.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              No workflows found in the selected date range
            </p>
          )}

          {filteredData.length > 0 && (
            <div className="text-xs text-muted-foreground text-center pt-4 border-t">
              Showing {filteredData.length} of {data.length} workflows • {departments.length} departments
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
