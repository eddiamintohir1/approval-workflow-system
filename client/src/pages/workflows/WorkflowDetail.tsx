import { useParams, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, FileText, CheckCircle2, Clock, XCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function WorkflowDetail() {
  const { id } = useParams();
  const { user } = useUserRole();

  const { data, isLoading, refetch } = trpc.workflows.getWithDetails.useQuery(
    { id: id! },
    { enabled: !!id }
  );

  const submitWorkflow = trpc.workflows.submit.useMutation({
    onSuccess: () => {
      toast.success("Workflow submitted for approval");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to submit workflow");
    },
  });

  const approveStage = trpc.stages.approve.useMutation({
    onSuccess: () => {
      toast.success("Stage approved successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to approve stage");
    },
  });

  const rejectStage = trpc.stages.reject.useMutation({
    onSuccess: () => {
      toast.success("Stage rejected");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to reject stage");
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data || !data.workflow) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Workflow Not Found</CardTitle>
            <CardDescription>The requested workflow could not be found</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard">
              <Button className="w-full">Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { workflow, stages, approvals, files, comments } = data;
  const currentStage = stages.find((s) => s.status === "in_progress");
  const canApprove = currentStage && user && (user.role === currentStage.requiredRole || user.role === "admin");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Workflow Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Badge variant={workflow.workflowType === "MAF" ? "default" : "secondary"}>
                    {workflow.workflowType}
                  </Badge>
                  <span className="font-mono text-sm text-muted-foreground">
                    {workflow.workflowNumber}
                  </span>
                  <StatusBadge status={workflow.overallStatus} />
                </div>
                <CardTitle className="text-2xl">{workflow.title}</CardTitle>
                {workflow.description && (
                  <CardDescription>{workflow.description}</CardDescription>
                )}
              </div>
              {workflow.overallStatus === "draft" && workflow.requesterId === user?.id && (
                <Button
                  onClick={() => submitWorkflow.mutate({ id: workflow.id })}
                  disabled={submitWorkflow.isPending}
                >
                  {submitWorkflow.isPending && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Submit for Approval
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Department</p>
                <p className="font-medium">{workflow.department}</p>
              </div>
              {workflow.estimatedAmount && (
                <div>
                  <p className="text-sm text-muted-foreground">Estimated Amount</p>
                  <p className="font-medium">
                    {workflow.currency} {parseFloat(workflow.estimatedAmount).toLocaleString()}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="font-medium">
                  {new Date(workflow.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="font-medium">
                  {new Date(workflow.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Approval Stages */}
        <Card>
          <CardHeader>
            <CardTitle>Approval Stages</CardTitle>
            <CardDescription>Track the progress of approval stages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stages.map((stage, index) => {
                const stageApprovals = approvals.filter((a) => a.stageId === stage.id);
                const isCurrentStage = stage.status === "in_progress";
                const canApproveThis = isCurrentStage && user && (user.role === stage.requiredRole || user.role === "admin");

                return (
                  <div
                    key={stage.id}
                    className={`p-4 border rounded-lg ${
                      isCurrentStage ? "border-primary bg-primary/5" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-sm font-medium text-muted-foreground">
                            Stage {stage.stageOrder}
                          </span>
                          <h3 className="font-semibold">{stage.stageName}</h3>
                          <StageStatusBadge status={stage.status} />
                        </div>
                        {stage.requiredRole && (
                          <p className="text-sm text-muted-foreground">
                            Required Role: {stage.requiredRole}
                          </p>
                        )}
                        
                        {/* Stage Approvals */}
                        {stageApprovals.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {stageApprovals.map((approval) => (
                              <div
                                key={approval.id}
                                className="text-sm p-2 bg-background rounded border"
                              >
                                <div className="flex items-center gap-2">
                                  {approval.action === "approved" ? (
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-red-500" />
                                  )}
                                  <span className="font-medium">
                                    {approval.action === "approved" ? "Approved" : "Rejected"}
                                  </span>
                                  <span className="text-muted-foreground">
                                    by {approval.approverRole}
                                  </span>
                                  <span className="text-muted-foreground">
                                    on {new Date(approval.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                                {approval.comments && (
                                  <p className="mt-1 text-muted-foreground">{approval.comments}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Approval Actions */}
                      {canApproveThis && (
                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const comments = prompt("Add comments (optional):");
                              if (comments !== null) {
                                approveStage.mutate({
                                  stageId: stage.id,
                                  workflowId: workflow.id,
                                  comments: comments ? comments : undefined,
                                });
                              }
                            }}
                            disabled={approveStage.isPending}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              const comments = prompt("Reason for rejection (required):");
                              if (comments && comments.trim()) {
                                rejectStage.mutate({
                                  stageId: stage.id,
                                  workflowId: workflow.id,
                                  comments: comments.trim() || "",
                                });
                              } else if (comments !== null) {
                                toast.error("Please provide a reason for rejection");
                              }
                            }}
                            disabled={rejectStage.isPending}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Files */}
        {files.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Attached Files</CardTitle>
              <CardDescription>Documents and files related to this workflow</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {files.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{file.fileName}</p>
                        <p className="text-sm text-muted-foreground">
                          {file.fileSize ? `${(file.fileSize / 1024).toFixed(2)} KB • ` : ""}{new Date(file.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" asChild>
                      <a href={file.s3Url || "#"} target="_blank" rel="noopener noreferrer">
                        Download
                      </a>
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Comments */}
        {comments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Comments</CardTitle>
              <CardDescription>Discussion and feedback on this workflow</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {comments.map((comment) => (
                  <div key={comment.id} className="p-3 border rounded">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium">{comment.authorRole}</span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm">{comment.commentText}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
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

function StageStatusBadge({ status }: { status: string }) {
  const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
    pending: { variant: "outline", icon: Clock },
    in_progress: { variant: "default", icon: AlertCircle },
    completed: { variant: "secondary", icon: CheckCircle2 },
    rejected: { variant: "destructive", icon: XCircle },
  };

  const config = variants[status] || variants.pending;
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="flex items-center gap-1">
      <Icon className="h-3 w-3" />
      {status.replace("_", " ").toUpperCase()}
    </Badge>
  );
}
