import { useParams, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, FileText, CheckCircle2, Clock, XCircle, AlertCircle, Upload, Download } from "lucide-react";
import { FormSubmissionDisplay } from "@/components/FormSubmissionDisplay";
import { toast } from "sonner";
import { useState, useRef } from "react";

export default function WorkflowDetail() {
  const { id } = useParams();
  const { user } = useUserRole();
  const [selectedStageForUpload, setSelectedStageForUpload] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const uploadFile = trpc.workflows.uploadFile.useMutation({
    onSuccess: () => {
      toast.success("Form uploaded successfully");
      setSelectedStageForUpload(null);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to upload form");
      setSelectedStageForUpload(null);
    },
  });

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>, stageId: string) => {
    const file = event.target.files?.[0];
    if (!file || !data?.workflow) return;

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;
        const base64Content = base64Data.split(',')[1];

        await uploadFile.mutateAsync({
          workflowId: data.workflow.id,
          stageId,
          filename: file.name,
          fileData: base64Content,
          mimeType: file.type,
          fileSize: file.size,
        });
      };
      reader.onerror = () => {
        toast.error("Failed to read file");
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error("Failed to upload file");
    }
  };

  const triggerFileUpload = (stageId: string) => {
    setSelectedStageForUpload(stageId);
    fileInputRef.current?.click();
  };

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
  
  // Check if user can approve current stage
  const canApprove = (stage: typeof stages[0]) => {
    if (!user || stage.status !== "in_progress") return false;
    if (user.role === "admin") return true;
    return user.role === stage.requiredRole;
  };

  // Check if user has uploaded a form for this stage
  const hasUploadedForm = (stageId: string) => {
    if (!user) return false;
    return files.some(f => f.stageId === stageId && f.uploadedBy === user.id);
  };

  // Get files for a specific stage
  const getStageFiles = (stageId: string) => {
    return files.filter(f => f.stageId === stageId);
  };

  // Get all files from previous stages (completed stages)
  const getPreviousStageFiles = (currentStageOrder: number) => {
    const previousStages = stages.filter(s => s.stageOrder < currentStageOrder && s.status === "completed");
    return previousStages.map(stage => ({
      stage,
      files: getStageFiles(stage.id)
    })).filter(item => item.files.length > 0);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(e) => selectedStageForUpload && handleFileSelect(e, selectedStageForUpload)}
        accept=".pdf,.xlsx,.xls,.doc,.docx,.jpg,.jpeg,.png"
      />

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

        {/* Form Submission Data */}
        <FormSubmissionDisplay workflowId={workflow.id} />

        {/* Approval Stages */}
        <Card>
          <CardHeader>
            <CardTitle>Approval Stages</CardTitle>
            <CardDescription>Track the progress of approval stages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {stages.map((stage, index) => {
                const stageApprovals = approvals.filter((a) => a.stageId === stage.id);
                const isCurrentStage = stage.status === "in_progress";
                const canApproveThis = canApprove(stage);
                const stageFiles = getStageFiles(stage.id);
                const previousFiles = getPreviousStageFiles(stage.stageOrder);
                const userHasUploadedForm = hasUploadedForm(stage.id);
                const isCeoOrCfo = user?.role === "CEO" || user?.role === "CFO";
                const canApproveWithoutForm = isCeoOrCfo; // CEO/CFO can approve with signature only

                return (
                  <div
                    key={stage.id}
                    className={`p-4 border rounded-lg ${
                      isCurrentStage
                        ? "border-primary bg-primary/5"
                        : stage.status === "pending"
                        ? "opacity-50 bg-muted/30"
                        : ""
                    }`}
                  >
                    <div className="space-y-4">
                      {/* Stage Header */}
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
                              disabled={approveStage.isPending || (!canApproveWithoutForm && !userHasUploadedForm)}
                              title={!canApproveWithoutForm && !userHasUploadedForm ? "You must upload a form before approving" : ""}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Approve
                              {isCeoOrCfo && " (Signature)"}
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

                      {/* Previous Stage Forms (Read-only) */}
                      {isCurrentStage && previousFiles.length > 0 && (
                        <div className="border-t pt-4">
                          <h4 className="text-sm font-semibold mb-3">Forms from Previous Stages</h4>
                          <div className="space-y-3">
                            {previousFiles.map(({ stage: prevStage, files: prevFiles }) => (
                              <div key={prevStage.id} className="bg-muted/30 p-3 rounded">
                                <p className="text-sm font-medium mb-2">
                                  Stage {prevStage.stageOrder}: {prevStage.stageName}
                                </p>
                                <div className="space-y-2">
                                  {prevFiles.map((file) => (
                                    <div key={file.id} className="flex items-center justify-between p-2 bg-background rounded text-sm">
                                      <div className="flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                        <span>{file.fileName}</span>
                                      </div>
                                      <Button size="sm" variant="ghost" asChild>
                                        <a href={file.s3Url || "#"} target="_blank" rel="noopener noreferrer">
                                          <Download className="h-4 w-4" />
                                        </a>
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Current Stage Forms */}
                      {stageFiles.length > 0 && (
                        <div className="border-t pt-4">
                          <h4 className="text-sm font-semibold mb-3">Uploaded Forms for This Stage</h4>
                          <div className="space-y-2">
                            {stageFiles.map((file) => (
                              <div key={file.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                                <div className="flex items-center gap-2">
                                  <FileText className="h-4 w-4" />
                                  <span className="text-sm">{file.fileName}</span>
                                  {file.uploadedBy === user?.id && (
                                    <Badge variant="outline" className="text-xs">Your upload</Badge>
                                  )}
                                </div>
                                <Button size="sm" variant="ghost" asChild>
                                  <a href={file.s3Url || "#"} target="_blank" rel="noopener noreferrer">
                                    <Download className="h-4 w-4" />
                                  </a>
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Upload Form Button */}
                      {isCurrentStage && canApproveThis && !isCeoOrCfo && (
                        <div className="border-t pt-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => triggerFileUpload(stage.id)}
                            disabled={uploadFile.isPending}
                            className="w-full"
                          >
                            {uploadFile.isPending ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Upload className="h-4 w-4 mr-2" />
                            )}
                            {userHasUploadedForm ? "Upload Another Form" : "Upload Form (Required for Approval)"}
                          </Button>
                          {!userHasUploadedForm && (
                            <p className="text-xs text-muted-foreground mt-2 text-center">
                              You must upload a form before you can approve this stage
                            </p>
                          )}
                        </div>
                      )}

                      {/* CEO/CFO Signature Note */}
                      {isCurrentStage && canApproveThis && isCeoOrCfo && (
                        <div className="border-t pt-4">
                          <p className="text-sm text-muted-foreground text-center">
                            As {user.role}, you can approve with your signature without uploading a form
                          </p>
                        </div>
                      )}

                      {/* Stage Approvals */}
                      {stageApprovals.length > 0 && (
                        <div className="border-t pt-4">
                          <h4 className="text-sm font-semibold mb-3">Approval History</h4>
                          <div className="space-y-2">
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
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

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
