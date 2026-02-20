import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useCognitoAuth } from "@/hooks/useCognitoAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { trpc } from "@/lib/trpc";
import { Loader2, Plus, Search, Users, LogOut, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function Dashboard() {
  const { signOut } = useCognitoAuth();
  const { user, loading } = useUserRole();
  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [isOem, setIsOem] = useState(false);

  const { data: projects, isLoading: projectsLoading, refetch } = trpc.projects.list.useQuery(undefined, {
    enabled: !!user,
  });

  const createProject = trpc.projects.create.useMutation({
    onSuccess: () => {
      toast.success("Project created successfully");
      setCreateDialogOpen(false);
      setNewProjectName("");
      setIsOem(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteProject = trpc.projects.delete.useMutation({
    onSuccess: () => {
      toast.success("Project deleted successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<{ id: number; name: string } | null>(null);

  const handleDeleteClick = (e: React.MouseEvent, project: { id: number; name: string }) => {
    e.preventDefault();
    e.stopPropagation();
    setProjectToDelete(project);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (projectToDelete) {
      deleteProject.mutate({ projectId: projectToDelete.id });
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
    }
  };

  const handleLogout = async () => {
    await signOut();
    window.location.href = "/";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const filteredProjects = projects?.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      in_progress: "default",
      completed: "outline",
      discontinued: "destructive",
    };
    return <Badge variant={variants[status] || "default"}>{status.replace("_", " ").toUpperCase()}</Badge>;
  };

  const stats = {
    total: projects?.length || 0,
    pending: projects?.filter(p => p.status === "pending").length || 0,
    inProgress: projects?.filter(p => p.status === "in_progress").length || 0,
    completed: projects?.filter(p => p.status === "completed").length || 0,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Approval Workflow System</h1>
            <p className="text-sm text-muted-foreground">Welcome, {user.name || user.email}</p>
          </div>
          <div className="flex items-center gap-2">
            {(user.role === "admin" || user.role === "director") && (
              <Link href="/users">
                <Button variant="outline" size="sm">
                  <Users className="h-4 w-4 mr-2" />
                  User Management
                </Button>
              </Link>            )}
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Projects</CardDescription>
              <CardTitle className="text-3xl">{stats.total}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pending</CardDescription>
              <CardTitle className="text-3xl">{stats.pending}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>In Progress</CardDescription>
              <CardTitle className="text-3xl">{stats.inProgress}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Completed</CardDescription>
              <CardTitle className="text-3xl">{stats.completed}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription>Enter project details to get started</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Project Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter project name"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="oem" checked={isOem} onCheckedChange={setIsOem} />
                  <Label htmlFor="oem">OEM Project</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => createProject.mutate({ name: newProjectName, isOem })}
                  disabled={!newProjectName || createProject.isPending}
                >
                  {createProject.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create Project
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Projects List */}
        {projectsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredProjects && filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {filteredProjects.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <Card className="hover:bg-accent transition-colors cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          {project.name}
                          {project.is_oem && <Badge variant="secondary">OEM</Badge>}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          SKU: {project.sku} | Stage {project.current_stage}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(project.status)}
                        {user.role === "admin" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={(e) => handleDeleteClick(e, { id: project.id, name: project.name })}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">No projects found</p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Project
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{projectToDelete?.name}"? This action cannot be undone and will permanently delete all project data including milestones, audit logs, and uploaded forms.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteProject.isPending}
            >
              {deleteProject.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Copyright Footer */}
      <footer className="border-t bg-card mt-8">
        <div className="container mx-auto px-4 py-4 text-center text-sm text-muted-foreground">
          © Eddie Amintohir. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
