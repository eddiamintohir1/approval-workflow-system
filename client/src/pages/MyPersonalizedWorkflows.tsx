import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Calendar, 
  Repeat, 
  Play, 
  Pause, 
  Edit, 
  Trash2, 
  Plus,
  Clock,
  History,
  Building2
} from "lucide-react";
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

export default function MyPersonalizedWorkflows() {
  const [, setLocation] = useLocation();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);

  const { data: recurringWorkflows, isLoading, refetch } = trpc.recurringWorkflows.getMyRecurringWorkflows.useQuery();
  const pauseMutation = trpc.recurringWorkflows.pause.useMutation();
  const resumeMutation = trpc.recurringWorkflows.resume.useMutation();
  const deleteMutation = trpc.recurringWorkflows.delete.useMutation();

  const handlePause = async (id: string) => {
    try {
      await pauseMutation.mutateAsync({ id });
      toast.success("Recurring workflow paused", {
        description: "No new workflows will be generated until resumed.",
      });
      refetch();
    } catch (error: any) {
      toast.error("Error", {
        description: error.message || "Failed to pause recurring workflow",
      });
    }
  };

  const handleResume = async (id: string) => {
    try {
      await resumeMutation.mutateAsync({ id });
      toast.success("Recurring workflow resumed", {
        description: "Workflow generation will continue as scheduled.",
      });
      refetch();
    } catch (error: any) {
      toast.error("Error", {
        description: error.message || "Failed to resume recurring workflow",
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedWorkflowId) return;
    
    try {
      await deleteMutation.mutateAsync({ id: selectedWorkflowId });
      toast.success("Recurring workflow deleted", {
        description: "The recurring workflow has been removed.",
      });
      setDeleteDialogOpen(false);
      setSelectedWorkflowId(null);
      refetch();
    } catch (error: any) {
      toast.error("Error", {
        description: error.message || "Failed to delete recurring workflow",
      });
    }
  };

  const formatFrequency = (workflow: any) => {
    if (workflow.frequency === "daily") {
      return "Daily";
    } else if (workflow.frequency === "weekly") {
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      return `Weekly on ${days[workflow.dayOfWeek || 0]}`;
    } else if (workflow.frequency === "monthly") {
      return `Monthly on day ${workflow.dayOfMonth}`;
    }
    return workflow.frequency;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { 
      year: "numeric", 
      month: "short", 
      day: "numeric" 
    });
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading recurring workflows...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Repeat className="h-8 w-8 text-primary" />
            My Personalized Workflows
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your recurring workflow templates and schedules
          </p>
        </div>
        <Button onClick={() => setLocation("/recurring-workflows/create")}>
          <Plus className="h-4 w-4 mr-2" />
          Create Recurring Workflow
        </Button>
      </div>

      {/* Recurring Workflows List */}
      {!recurringWorkflows || recurringWorkflows.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Repeat className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No recurring workflows yet</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              Create your first recurring workflow to automatically generate workflows on a schedule
            </p>
             <Button onClick={() => setLocation("/recurring-workflows/create")}>
              <Plus className="h-4 w-4 mr-2" />
              Create Recurring Workflow
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {recurringWorkflows.map((workflow) => (
            <Card key={workflow.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{workflow.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {workflow.description || "No description"}
                    </CardDescription>
                  </div>
                  <Badge variant={workflow.isPaused ? "secondary" : "default"}>
                    {workflow.isPaused ? "Paused" : "Active"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Workflow Info */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    <span>{workflow.department}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Repeat className="h-4 w-4" />
                    <span>{formatFrequency(workflow)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Next: {formatDate(workflow.nextScheduledDate)}</span>
                  </div>
                  {workflow.lastGeneratedAt && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Last: {formatDate(workflow.lastGeneratedAt)}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLocation(`/recurring-workflows/${workflow.id}/edit`)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  
                  {workflow.isPaused ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResume(workflow.id)}
                      disabled={resumeMutation.isPending}
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Resume
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePause(workflow.id)}
                      disabled={pauseMutation.isPending}
                    >
                      <Pause className="h-4 w-4 mr-1" />
                      Pause
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLocation(`/recurring-workflows/${workflow.id}/history`)}
                  >
                    <History className="h-4 w-4 mr-1" />
                    History
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedWorkflowId(workflow.id);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Recurring Workflow?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this recurring workflow template. Previously generated workflows will not be affected.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedWorkflowId(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
