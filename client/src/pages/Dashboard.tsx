import { useState, useEffect } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useCognitoAuth } from "@/hooks/useCognitoAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Search, FileText, CheckCircle2, Clock, XCircle, LogOut, Users, BarChart3, FileEdit, Trash2, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RoleSwitcher } from "@/components/RoleSwitcher";
import { HelpButton } from "@/components/HelpButton";
import { DashboardSkeleton } from "@/components/DashboardSkeleton";

export default function Dashboard() {
  const { signOut } = useCognitoAuth();
  const { user, loading: authLoading } = useUserRole();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [workflowToDelete, setWorkflowToDelete] = useState<string | null>(null);
  const utils = trpc.useUtils();

  // Load filters from localStorage on mount
  useEffect(() => {
    const savedFilters = localStorage.getItem("workflowFilters");
    if (savedFilters) {
      try {
        const filters = JSON.parse(savedFilters);
        setSearchQuery(filters.search || "");
        setStatusFilter(filters.status || "all");
        setTypeFilter(filters.type || "all");
        setDepartmentFilter(filters.department || "all");
        setDateFrom(filters.dateFrom || "");
        setDateTo(filters.dateTo || "");
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, []);

  // Save filters to localStorage whenever they change
  useEffect(() => {
    const filters = {
      search: searchQuery,
      status: statusFilter,
      type: typeFilter,
      department: departmentFilter,
      dateFrom,
      dateTo,
    };
    localStorage.setItem("workflowFilters", JSON.stringify(filters));
  }, [searchQuery, statusFilter, typeFilter, departmentFilter, dateFrom, dateTo]);

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setTypeFilter("all");
    setDepartmentFilter("all");
    setDateFrom("");
    setDateTo("");
  };

  // Count active filters
  const activeFilterCount = [
    searchQuery !== "",
    statusFilter !== "all",
    typeFilter !== "all",
    departmentFilter !== "all",
    dateFrom !== "",
    dateTo !== "",
  ].filter(Boolean).length;

  // Fetch workflows with caching
  const { data: workflows, isLoading: workflowsLoading } = trpc.workflows.getAll.useQuery(
    undefined,
    { 
      enabled: !!user,
      staleTime: 1000 * 60 * 2, // 2 minutes - workflows change frequently
      refetchInterval: 1000 * 60 * 5, // Auto-refetch every 5 minutes in background
    }
  );

  // Delete workflow mutation
  const deleteWorkflow = trpc.workflows.delete.useMutation({
    onSuccess: () => {
      toast.success("Workflow deleted", {
        description: "The workflow has been permanently deleted.",
      });
      utils.workflows.getAll.invalidate();
      setDeleteDialogOpen(false);
      setWorkflowToDelete(null);
    },
    onError: (error) => {
      toast.error("Error", {
        description: error.message,
      });
    },
  });

  const handleDeleteClick = (e: React.MouseEvent, workflowId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setWorkflowToDelete(workflowId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (workflowToDelete) {
      deleteWorkflow.mutate({ id: workflowToDelete });
    }
  };

  const handleLogout = async () => {
    await signOut();
    window.location.href = "/";
  };

  // Show loading skeleton only while auth is loading
  if (authLoading) {
    return <DashboardSkeleton />;
  }

  // Only show auth required screen if auth is complete AND user is null
  if (!authLoading && !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please sign in to access the dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/login">
              <Button className="w-full">Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Filter workflows by all criteria
  const filteredWorkflows = workflows?.filter((w) => {
    // Search filter (ID or title)
    const matchesSearch = !searchQuery ||
      w.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.workflowNumber.toLowerCase().includes(searchQuery.toLowerCase());

    // Status filter
    const matchesStatus = statusFilter === "all" || w.overallStatus === statusFilter;

    // Type filter
    const matchesType = typeFilter === "all" || w.workflowType === typeFilter;

    // Department filter
    const matchesDepartment = departmentFilter === "all" || w.department === departmentFilter;

    // Date range filter
    const workflowDate = new Date(w.createdAt);
    const matchesDateFrom = !dateFrom || workflowDate >= new Date(dateFrom);
    const matchesDateTo = !dateTo || workflowDate <= new Date(dateTo + "T23:59:59");

    return matchesSearch && matchesStatus && matchesType && matchesDepartment && matchesDateFrom && matchesDateTo;
  }) || [];

  // Calculate statistics
  const stats = {
    total: workflows?.length || 0,
    draft: workflows?.filter((w) => w.overallStatus === "draft").length || 0,
    inProgress: workflows?.filter((w) => w.overallStatus === "in_progress").length || 0,
    completed: workflows?.filter((w) => w.overallStatus === "completed").length || 0,
    rejected: workflows?.filter((w) => w.overallStatus === "rejected").length || 0,
  };

  return (
    <div className="min-h-screen">
      {/* Role Switcher for test user */}
      <RoleSwitcher />
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="https://files.manuscdn.com/user_upload_by_module/session_file/94657144/VBJnHGARwdnBRpGK.png" alt="Compawnion" className="h-10 w-10 rounded-full" />
            <div>
              <h1 className="text-2xl font-bold">Approval Workflow System</h1>
              <p className="text-sm text-muted-foreground">Welcome, {user.email?.split("@")[0] || "User"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Executive features for CEO, COO, CFO */}
            {(user.role === "CEO" || user.role === "COO" || user.role === "CFO" || user.role === "admin") && (
              <>
                <Link href="/analytics">
                  <Button variant="outline" size="sm">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Analytics
                  </Button>
                </Link>
                <Link href="/templates">
                  <Button variant="outline" size="sm">
                    <FileEdit className="h-4 w-4 mr-2" />
                    Workflow Templates
                  </Button>
                </Link>
                <Link href="/admin/form-templates">
                  <Button variant="outline" size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    Form Templates
                  </Button>
                </Link>
                <Link href="/admin/excel-templates">
                  <Button variant="outline" size="sm">
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Excel Templates
                  </Button>
                </Link>
              </>
            )}
            {user.role === "admin" && (
              <>
                <Link href="/users">
                  <Button variant="outline" size="sm">
                    <Users className="h-4 w-4 mr-2" />
                    User Management
                  </Button>
                </Link>
                <Link href="/admin/sequences">
                  <Button variant="outline" size="sm">
                    <FileEdit className="h-4 w-4 mr-2" />
                    Templates
                  </Button>
                </Link>
              </>
            )}
            {user.role === "admin" && (
              <Link href="/users">
                <Button variant="outline" size="sm">
                  <Users className="h-4 w-4 mr-2" />
                  User Management
                </Button>
              </Link>
            )}
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Workflows</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Draft</CardTitle>
              <FileText className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.draft}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.inProgress}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completed}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <XCircle className="h-4 w-4 text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.rejected}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Workflows List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Workflows</CardTitle>
                <CardDescription>View and manage your approval workflows</CardDescription>
              </div>
              <Link href="/workflows/create">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Workflow
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by workflow ID or title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {/* Status Filter */}
              <div>
                <label className="text-sm font-medium mb-1.5 block">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              {/* Type Filter */}
              <div>
                <label className="text-sm font-medium mb-1.5 block">Type</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                >
                  <option value="all">All Types</option>
                  <option value="MAF">MAF</option>
                  <option value="PR">PR</option>
                  <option value="Reimbursement">Reimbursement</option>
                  <option value="Budget">Budget</option>
                </select>
              </div>

              {/* Department Filter */}
              <div>
                <label className="text-sm font-medium mb-1.5 block">Department</label>
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                >
                  <option value="all">All Departments</option>
                  <option value="PPIC">PPIC</option>
                  <option value="Purchasing">Purchasing</option>
                  <option value="GA">GA</option>
                  <option value="Finance">Finance</option>
                  <option value="Production">Production</option>
                  <option value="Logistics">Logistics</option>
                </select>
              </div>

              {/* Clear Filters Button */}
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  disabled={activeFilterCount === 0}
                  className="w-full"
                >
                  Clear Filters
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </div>
            </div>

            {/* Date Range Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1.5 block">From Date</label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">To Date</label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>

            {/* Results Count */}
            {activeFilterCount > 0 && (
              <div className="text-sm text-muted-foreground">
                Showing {filteredWorkflows.length} of {workflows?.length || 0} workflows
              </div>
            )}

            {/* Workflows List */}
            {workflowsLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="h-5 bg-muted rounded w-1/3 mb-2"></div>
                          <div className="h-4 bg-muted rounded w-1/2"></div>
                        </div>
                        <div className="h-6 bg-muted rounded w-20"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredWorkflows.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No workflows found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery ? "Try adjusting your search" : "Create your first workflow to get started"}
                </p>
                {!searchQuery && (
                  <Link href="/workflows/create">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Workflow
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredWorkflows.map((workflow) => (
                  <Card key={workflow.id} className="hover:bg-accent/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <Link href={`/workflows/${workflow.id}`} className="flex-1 cursor-pointer">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <Badge variant={workflow.workflowType === "MAF" ? "default" : "secondary"}>
                                {workflow.workflowType}
                              </Badge>
                              <span className="font-mono text-sm text-muted-foreground">
                                {workflow.workflowNumber}
                              </span>
                              <StatusBadge status={workflow.overallStatus} />
                            </div>
                            <h3 className="font-semibold text-lg">{workflow.title}</h3>
                            {workflow.description && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                                {workflow.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                              <span>Department: {workflow.department}</span>
                              {workflow.estimatedAmount && (
                                <span>
                                  Amount: {workflow.currency} {parseFloat(workflow.estimatedAmount).toLocaleString()}
                                </span>
                              )}
                              <span>
                                Created: {new Date(workflow.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </Link>
                        {user.role === "admin" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => handleDeleteClick(e, workflow.id)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Copyright Footer */}
      <footer className="border-t bg-card mt-8">
        <div className="container mx-auto px-4 py-4 text-center text-sm text-muted-foreground">
          © Eddie Amintohir. All rights reserved.
        </div>
      </footer>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workflow?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the workflow and all related data (stages, files, approvals, comments).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteWorkflow.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Help Button */}
      <HelpButton />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
    draft: { variant: "outline", icon: FileText },
    in_progress: { variant: "default", icon: Clock },
    completed: { variant: "secondary", icon: CheckCircle2 },
    rejected: { variant: "destructive", icon: XCircle },
    cancelled: { variant: "outline", icon: XCircle },
  };

  const config = variants[status] || variants.draft;
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="flex items-center gap-1">
      <Icon className="h-3 w-3" />
      {status.replace("_", " ").toUpperCase()}
    </Badge>
  );
}
