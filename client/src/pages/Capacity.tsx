import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ExternalLink, Clock, AlertCircle, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";

export default function Capacity() {
  const { data: capacityData, isLoading } = trpc.capacity.getByUser.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading capacity data...</p>
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-300";
      case "in_progress":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-300";
      case "draft":
        return "bg-gray-100 text-gray-800 border-gray-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getProgressColor = (percent: number, isOverdue: boolean) => {
    if (isOverdue) return "bg-red-500";
    if (percent >= 75) return "bg-green-500";
    if (percent >= 50) return "bg-yellow-500";
    return "bg-blue-500";
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Capacity Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          View workload distribution across team members
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Roles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{capacityData?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Workflows</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {capacityData?.reduce((sum, role) => sum + role.workflowCount, 0) || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {capacityData?.reduce(
                (sum, role) => sum + role.workflows.filter((w: any) => w.isOverdue).length,
                0
              ) || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Workload</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {capacityData && capacityData.length > 0
                ? Math.round(
                    capacityData.reduce((sum, role) => sum + role.workflowCount, 0) /
                      capacityData.length
                  )
                : 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Horizontal Scrollable User Columns */}
      <div className="relative">
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-6" style={{ minWidth: "max-content" }}>
            {capacityData && capacityData.length > 0 ? (
              capacityData.map((roleData: any) => (
                <div key={roleData.role} className="flex-shrink-0" style={{ width: "320px" }}>
                  {/* Role Header */}
                  <Card className="mb-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center justify-between">
                        <span className="font-bold text-blue-900">{roleData.role}</span>
                        <Badge variant="secondary" className="ml-2">
                          {roleData.workflowCount} {roleData.workflowCount === 1 ? "item" : "items"}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                  </Card>

                  {/* Workflow Cards */}
                  <div className="space-y-3">
                    {roleData.workflows.map((workflow: any) => (
                      <Card
                        key={workflow.id}
                        className={`hover:shadow-lg transition-shadow ${
                          workflow.isOverdue ? "border-red-300 border-2" : ""
                        }`}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-sm line-clamp-2 mb-1">
                                {workflow.title}
                              </h3>
                              <p className="text-xs text-muted-foreground">
                                {workflow.workflowNumber}
                              </p>
                            </div>
                            <Link href={`/workflows/${workflow.id}`}>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </Link>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {/* Status Badge */}
                          <Badge
                            className={`${getStatusColor(workflow.overallStatus)} text-xs`}
                            variant="outline"
                          >
                            {workflow.overallStatus.replace("_", " ").toUpperCase()}
                          </Badge>

                          {/* Current Stage */}
                          <div className="text-xs text-muted-foreground">
                            <span className="font-medium">Stage:</span> {workflow.currentStage}
                          </div>

                          {/* Progress Bar */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">Progress</span>
                              <span className="font-medium">{workflow.progressPercent}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all ${getProgressColor(
                                  workflow.progressPercent,
                                  workflow.isOverdue
                                )}`}
                                style={{ width: `${workflow.progressPercent}%` }}
                              ></div>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {workflow.completedStages} of {workflow.totalStages} stages completed
                            </div>
                          </div>

                          {/* Time Metrics */}
                          {workflow.daysRemaining !== null && (
                            <div
                              className={`flex items-center gap-2 text-xs ${
                                workflow.isOverdue ? "text-red-600 font-semibold" : "text-muted-foreground"
                              }`}
                            >
                              {workflow.isOverdue ? (
                                <>
                                  <AlertCircle className="h-4 w-4" />
                                  <span>Overdue by {Math.abs(workflow.daysRemaining)} days</span>
                                </>
                              ) : (
                                <>
                                  <Clock className="h-4 w-4" />
                                  <span>{workflow.daysRemaining} days remaining</span>
                                </>
                              )}
                            </div>
                          )}

                          {workflow.totalDays && (
                            <div className="text-xs text-muted-foreground">
                              Total duration: {workflow.totalDays} days
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}

                    {roleData.workflows.length === 0 && (
                      <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                          <CheckCircle2 className="h-8 w-8 text-green-500 mb-2" />
                          <p className="text-sm text-muted-foreground">No pending workflows</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="w-full text-center py-12">
                <p className="text-muted-foreground">No active workflows found</p>
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
    </DashboardLayout>
  );
}
