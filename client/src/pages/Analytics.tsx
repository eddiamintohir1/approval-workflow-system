import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, CheckCircle2, XCircle, Clock, FileText } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { WorkflowGanttChart } from "@/components/WorkflowGanttChart";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function Analytics() {
  const { data: overview, isLoading: overviewLoading } = trpc.analytics.overview.useQuery();
  const { data: byType, isLoading: byTypeLoading } = trpc.analytics.byType.useQuery();
  const { data: byDepartment, isLoading: byDepartmentLoading } = trpc.analytics.byDepartment.useQuery();
  const { data: byStatus, isLoading: byStatusLoading } = trpc.analytics.byStatus.useQuery();
  const { data: avgTimeByType, isLoading: avgTimeLoading } = trpc.analytics.avgTimeByType.useQuery();
  const { data: completionTrend, isLoading: trendLoading } = trpc.analytics.completionTrend.useQuery({ days: 30 });
  const { data: timeline, isLoading: timelineLoading } = trpc.analytics.timeline.useQuery();

  const isLoading = overviewLoading || byTypeLoading || byDepartmentLoading || byStatusLoading || avgTimeLoading || trendLoading || timelineLoading;

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Workflow Analytics</h1>
        <p className="text-muted-foreground mt-2">
          Comprehensive overview of workflow performance and metrics
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card/95 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Workflows</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.total || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              All time workflows
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/95 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.inProgress || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Currently active
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/95 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.completed || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Successfully approved
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/95 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Approval Time</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.avgApprovalTime || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Days to complete
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Workflow by Type */}
        <Card className="bg-card/95 backdrop-blur">
          <CardHeader>
            <CardTitle>Workflows by Type</CardTitle>
            <CardDescription>Distribution of workflow types</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={byType || []}
                  dataKey="count"
                  nameKey="type"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={(entry) => `${entry.type}: ${entry.count}`}
                >
                  {(byType || []).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Workflow by Status */}
        <Card className="bg-card/95 backdrop-blur">
          <CardHeader>
            <CardTitle>Workflows by Status</CardTitle>
            <CardDescription>Current workflow status distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={byStatus || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Workflow by Department */}
        <Card className="bg-card/95 backdrop-blur">
          <CardHeader>
            <CardTitle>Workflows by Department</CardTitle>
            <CardDescription>Department-wise workflow distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={byDepartment || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="department" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Average Approval Time by Type */}
        <Card className="bg-card/95 backdrop-blur">
          <CardHeader>
            <CardTitle>Avg. Approval Time by Type</CardTitle>
            <CardDescription>Average days to complete by workflow type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={avgTimeByType || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="avgDays" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Workflow Timeline Gantt Chart */}
      {timeline && <WorkflowGanttChart data={timeline} />}

      {/* Completion Trend */}
      <Card className="bg-card/95 backdrop-blur">
        <CardHeader>
          <CardTitle>Workflow Completion Trend (Last 30 Days)</CardTitle>
          <CardDescription>Daily workflow creation and completion rates</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={completionTrend || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="total" stroke="#3b82f6" name="Total Created" />
              <Line type="monotone" dataKey="completed" stroke="#10b981" name="Completed" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
