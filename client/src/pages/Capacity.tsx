import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Users, TrendingUp, Clock, XCircle, DollarSign, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useUserRole } from "@/hooks/useUserRole";

export default function Capacity() {
  const { user: currentUser } = useUserRole();
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const pageSize = 20;

  // Get user list with pagination
  const { data: usersData, isLoading } = trpc.capacity.getUserList.useQuery({
    page,
    pageSize,
    search: searchQuery,
    department: departmentFilter === "all" ? undefined : departmentFilter,
  });

  // Get user performance metrics when popup opens
  const { data: userMetrics, isLoading: metricsLoading } = trpc.metrics.getUserMetrics.useQuery(
    { userId: selectedUserId! },
    { enabled: selectedUserId !== null }
  );

  // Get salary data (only for admin/CEO/CFO/COO)
  const canViewSalary = ['admin', 'CEO', 'CFO', 'COO'].includes(currentUser?.role || '');
  const { data: salaryData } = trpc.salary.getUserSalary.useQuery(
    { userId: selectedUserId! },
    { enabled: selectedUserId !== null && canViewSalary }
  );

  const users = usersData?.users || [];
  const totalPages = Math.ceil((usersData?.total || 0) / pageSize);

  // Get unique departments for filter
  const departments = Array.from(new Set(users.map(u => u.role).filter(Boolean)));

  const handleUserClick = (userId: number) => {
    setSelectedUserId(userId);
  };

  const closeUserPopup = () => {
    setSelectedUserId(null);
  };

  if (isLoading && page === 1) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Capacity Management</h1>
          <p className="text-muted-foreground mt-2">
            Monitor team workload, performance, and productivity
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  className="pl-9"
                />
              </div>

              {/* Department Filter */}
              <Select
                value={departmentFilter}
                onValueChange={(value) => {
                  setDepartmentFilter(value);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  <SelectItem value="my_team">My Team</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Results count */}
              <div className="flex items-center text-sm text-muted-foreground">
                <Users className="h-4 w-4 mr-2" />
                {usersData?.total || 0} users found
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User List Table */}
        <Card>
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>
              Click on a user to view detailed performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Active Tasks</TableHead>
                  {canViewSalary && <TableHead className="text-right">Salary</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={canViewSalary ? 6 : 5} className="text-center py-8 text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow
                      key={user.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleUserClick(user.id)}
                    >
                      <TableCell className="font-medium">{user.fullName}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{user.department || user.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge>{user.role}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary">{user.activeTaskCount || 0}</Badge>
                      </TableCell>
                      {canViewSalary && (
                        <TableCell className="text-right font-medium">
                          {user.salary ? `$${user.salary.toLocaleString()}` : '-'}
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1 || isLoading}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages || isLoading}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Performance Popup */}
        <Dialog open={selectedUserId !== null} onOpenChange={(open) => !open && closeUserPopup()}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Performance Metrics</DialogTitle>
              <DialogDescription>
                {users.find(u => u.id === selectedUserId)?.fullName}
              </DialogDescription>
            </DialogHeader>

            {metricsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : userMetrics ? (
              <div className="space-y-6">
                {/* Salary Info (if available) */}
                {canViewSalary && salaryData && (
                  <Card className="bg-primary/5 border-primary/20">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Compensation & Productivity
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-muted-foreground">Monthly Salary</div>
                          <div className="text-2xl font-bold">${salaryData.salary.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Tasks Completed This Month</div>
                          <div className="text-2xl font-bold">{userMetrics.tasksCompletedThisMonth}</div>
                        </div>
                      </div>
                      {userMetrics.tasksCompletedThisMonth > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <div className="text-sm text-muted-foreground">Cost per Completed Task</div>
                          <div className="text-xl font-semibold text-primary">
                            ${(salaryData.salary / userMetrics.tasksCompletedThisMonth).toFixed(2)}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Performance Metrics Grid */}
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Avg. Completion Time
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {userMetrics.avgCompletionHours.toFixed(1)} hrs
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Longest Stuck Task
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-orange-600">
                        {userMetrics.longestStuckHours.toFixed(1)} hrs
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Total Completed
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">
                        {userMetrics.tasksCompletedThisMonth}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">This month</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <XCircle className="h-4 w-4" />
                        Rejected Tasks
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600">
                        {userMetrics.rejectedCount}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">All time</div>
                    </CardContent>
                  </Card>
                </div>

                <div className="text-xs text-muted-foreground text-right">
                  Last updated: {new Date(userMetrics.lastCalculated).toLocaleString()}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No performance data available
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
