import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useCognitoAuth } from "@/hooks/useCognitoAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Search, FileText, CheckCircle2, Clock, XCircle, LogOut, Users, BarChart3, FileEdit } from "lucide-react";
import { RoleSwitcher } from "@/components/RoleSwitcher";
import { HelpButton } from "@/components/HelpButton";
import { DashboardSkeleton } from "@/components/DashboardSkeleton";

export default function Dashboard() {
  const { signOut } = useCognitoAuth();
  const { user, loading: authLoading } = useUserRole();
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch workflows
  const { data: workflows, isLoading: workflowsLoading } = trpc.workflows.getAll.useQuery(
    undefined,
    { enabled: !!user }
  );

  const handleLogout = async () => {
    await signOut();
    window.location.href = "/";
  };

  // Show loading skeleton while auth is loading OR while user data is loading
  if (authLoading || workflowsLoading) {
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

  // Filter workflows by search query
  const filteredWorkflows = workflows?.filter((w) =>
    w.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.workflowNumber.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

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
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search workflows..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Workflows List */}
            {filteredWorkflows.length === 0 ? (
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
                  <Link key={workflow.id} href={`/workflows/${workflow.id}`}>
                    <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
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
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
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
