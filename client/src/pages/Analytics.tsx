import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { BarChart3, TrendingUp, CheckCircle2, XCircle, Clock, FileText, DollarSign, Calendar, Home, ArrowLeft } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { WorkflowGanttChart } from "@/components/WorkflowGanttChart";
import { BudgetAnalytics } from "@/components/BudgetAnalytics";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const DEPARTMENTS = ["All", "PPIC", "Purchasing", "GA", "Finance", "Production", "Logistics", "IT", "HR", "Marketing", "Sales", "R&D"];

export default function Analytics() {
  const [selectedDepartment, setSelectedDepartment] = useState("All");
  const [costPeriod, setCostPeriod] = useState<"monthly" | "yearly">("monthly");

  // Global analytics with aggressive caching (changes infrequently)
  const { data: overview, isLoading: overviewLoading } = trpc.analytics.overview.useQuery(undefined, {
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
  const { data: byType, isLoading: byTypeLoading } = trpc.analytics.byType.useQuery(undefined, {
    staleTime: 1000 * 60 * 10,
  });
  const { data: byDepartment, isLoading: byDepartmentLoading } = trpc.analytics.byDepartment.useQuery(undefined, {
    staleTime: 1000 * 60 * 10,
  });
  const { data: byStatus, isLoading: byStatusLoading } = trpc.analytics.byStatus.useQuery(undefined, {
    staleTime: 1000 * 60 * 10,
  });
  const { data: avgTimeByType, isLoading: avgTimeLoading } = trpc.analytics.avgTimeByType.useQuery(undefined, {
    staleTime: 1000 * 60 * 10,
  });
  const { data: completionTrend, isLoading: trendLoading } = trpc.analytics.completionTrend.useQuery(
    { days: 30 },
    { staleTime: 1000 * 60 * 10 }
  );
  const { data: timeline, isLoading: timelineLoading } = trpc.analytics.timeline.useQuery(undefined, {
    staleTime: 1000 * 60 * 10,
  });
  
  // Department-specific metrics with caching per department
  const { data: deptMetrics, isLoading: deptMetricsLoading } = trpc.analytics.departmentMetrics.useQuery(
    { department: selectedDepartment },
    { 
      enabled: selectedDepartment !== "All",
      staleTime: 1000 * 60 * 5, // 5 minutes - cache per department
      keepPreviousData: true, // Show previous data while loading new department
    }
  );
  const { data: deptCosts, isLoading: deptCostsLoading } = trpc.analytics.departmentCostBreakdown.useQuery(
    { department: selectedDepartment, period: costPeriod },
    { 
      enabled: selectedDepartment !== "All",
      staleTime: 1000 * 60 * 5,
      keepPreviousData: true, // Show previous data while loading new period
    }
  );

  // Only show full-page loading on initial load (when no data exists yet)
  const isInitialLoading = (overviewLoading && !overview) || (byTypeLoading && !byType);

  if (isInitialLoading) {
  return (
    <div className="container py-8">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/">
          <Button variant="outline" size="sm">
            <Home className="h-4 w-4 mr-2" />
            Home
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
      </div>
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
      {/* Home Button */}
      <div className="flex items-center gap-4 mb-4">
        <Link href="/">
          <Button variant="outline" size="sm">
            <Home className="h-4 w-4 mr-2" />
            Home
          </Button>
        </Link>
      </div>
      
      {/* Header with Department Filter */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workflow Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive overview of workflow performance and metrics
          </p>
        </div>
        <div className="w-64">
          <Label htmlFor="department">Filter by Department</Label>
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger id="department">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DEPARTMENTS.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Department-Specific Metrics (shown when department is selected) */}
      {selectedDepartment !== "All" && deptMetrics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-card/95 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Completion Time</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{deptMetrics.avgCompletionDays}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Days from assignment to completion
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/95 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Workflows</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{deptMetrics.totalWorkflows}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {selectedDepartment} department
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/95 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{deptMetrics.completedCount}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Successfully completed
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/95 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{deptMetrics.inProgressCount}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Currently active
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Global Metrics Cards (shown when All is selected) */}
      {selectedDepartment === "All" && (
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
      )}

      {/* Budget vs Spending Analysis (shown when department is selected) */}
      {selectedDepartment !== "All" && (
        <BudgetAnalytics department={selectedDepartment} />
      )}

      {/* Department Cost Breakdown (shown when department is selected) */}
      {selectedDepartment !== "All" && deptCosts && deptCosts.length > 0 && (
        <Card className="bg-card/95 backdrop-blur">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Cost Breakdown - {selectedDepartment}</CardTitle>
                <CardDescription>Total costs from workflow form data</CardDescription>
              </div>
              <Select value={costPeriod} onValueChange={(v) => setCostPeriod(v as "monthly" | "yearly")}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={deptCosts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => [`$${value.toLocaleString()}`, "Total Cost"]}
                />
                <Bar dataKey="totalCost" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 text-sm text-muted-foreground">
              Total: ${deptCosts.reduce((sum, item) => sum + item.totalCost, 0).toLocaleString()} | 
              Workflows: {deptCosts.reduce((sum, item) => sum + item.count, 0)}
            </div>
          </CardContent>
        </Card>
      )}

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
