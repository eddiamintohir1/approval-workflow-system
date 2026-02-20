import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { Loader2, ArrowLeft, CheckCircle2, XCircle, Upload, Download, FileText } from "lucide-react";
import { useState, useRef } from "react";
import { Link, useParams } from "wouter";
import { toast } from "sonner";
import { useCognitoAuth } from "@/hooks/useCognitoAuth";
import { AuditTrail } from "@/components/AuditTrail";
import { HelpButton } from "@/components/HelpButton";
import { WorkflowProgressTrail } from "@/components/WorkflowProgressTrail";
import { format } from "date-fns";

export default function WorkflowDetail() {
  const { id } = useParams();
  const workflowId = id || "";
  const { user: cognitoUser } = useCognitoAuth();
  const { data: user } = trpc.users.me.useQuery(undefined, {
    enabled: !!cognitoUser, // Only fetch when Cognito user is available
  });
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);
  const [comments, setComments] = useState("");
  const [uploadingStageId, setUploadingStageId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: workflow, isLoading: workflowLoading } = trpc.workflows.getById.useQuery({ id: workflowId });
  const { data: stages, isLoading: stagesLoading, refetch: refetchStages } = trpc.stages.getByWorkflow.useQuery({ workflowId });
  const { data: files } = trpc.files.getByWorkflow.useQuery({ workflowId });

  const approveStage = trpc.stages.approve.useMutation({
    onSuccess: () => {
      toast.success("Stage approved successfully");
      setApproveDialogOpen(false);
      setComments("");
      setSelectedStageId(null);
      refetchStages();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const rejectStage = trpc.stages.reject.useMutation({
    onSuccess: () => {
      toast.success("Stage rejected");
      setRejectDialogOpen(false);
      setComments("");
      setSelectedStageId(null);
      refetchStages();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const uploadFile = trpc.files.upload.useMutation({
    onSuccess: () => {
      toast.success("File uploaded successfully");
      setUploadingStageId(null);
      refetchStages();
    },
    onError: (error) => {
      toast.error(`Upload failed: ${error.message}`);
      setUploadingStageId(null);
    },
  });

  const downloadTemplate = trpc.excel.downloadTemplate.useMutation({
    onSuccess: (data) => {
      // Convert base64 to blob and download
      const byteCharacters = atob(data.data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = data.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Template downloaded successfully");
    },
    onError: (error) => {
      toast.error(`Download failed: ${error.message}`);
    },
  });

  const handleFileUpload = async (stageId: string, file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      
      // Determine file type category based on MIME type
      let fileType = 'document';
      if (file.type.includes('spreadsheet') || file.type.includes('excel')) {
        fileType = 'excel';
      } else if (file.type.includes('pdf')) {
        fileType = 'pdf';
      } else if (file.type.includes('word')) {
        fileType = 'word';
      }
      
      uploadFile.mutate({
        workflowId,
        stageId,
        fileName: file.name,
        fileData: base64,
        fileType,
        mimeType: file.type,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleUploadClick = (stageId: string) => {
    setUploadingStageId(stageId);
    fileInputRef.current?.click();
  };

  const handleApproveClick = (stageId: string) => {
    setSelectedStageId(stageId);
    setApproveDialogOpen(true);
  };

  const handleRejectClick = (stageId: string) => {
    setSelectedStageId(stageId);
    setRejectDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
      case "pending":
        return <Badge className="bg-gray-100 text-gray-800">Pending</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const canUserApproveStage = (stage: any) => {
    if (!user) return false;
    // Allow approval for pending or in_progress stages
    if (stage.status !== "pending" && stage.status !== "in_progress") return false;
    // Check if workflow is in a state that allows approvals
    if (workflow?.overallStatus === "completed" || workflow?.overallStatus === "rejected" || workflow?.overallStatus === "discontinued") return false;
    // Check role permission
    if (stage.requiredRole && user.role !== stage.requiredRole && user.role !== "admin") return false;
    return true;
  };

  if (workflowLoading || stagesLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Workflow not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Workflow Header */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge>{workflow.workflowType}</Badge>
                      <span className="text-sm text-muted-foreground">{workflow.workflowNumber}</span>
                      {getStatusBadge(workflow.overallStatus)}
                    </div>
                    <CardTitle className="text-2xl">{workflow.title}</CardTitle>
                    {workflow.description && (
                      <CardDescription>{workflow.description}</CardDescription>
                    )}
                  </div>
                  <Button
                    onClick={() => downloadTemplate.mutate({ workflowType: workflow.workflowType as "MAF" | "PR" | "CATTO" })}
                    variant="outline"
                    size="sm"
                    disabled={downloadTemplate.isPending}
                  >
                    {downloadTemplate.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    Download {workflow.workflowType} Template
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Department</span>
                    <p className="font-medium">{workflow.department}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Created</span>
                    <p className="font-medium">{format(new Date(workflow.createdAt), "MM/dd/yyyy")}</p>
                  </div>
                  {workflow.estimatedAmount && (
                    <div>
                      <span className="text-muted-foreground">Amount</span>
                      <p className="font-medium">
                        {workflow.currency} {workflow.estimatedAmount.toLocaleString()}
                      </p>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Last Updated</span>
                    <p className="font-medium">{format(new Date(workflow.updatedAt), "MM/dd/yyyy")}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Progress Trail */}
            {stages && stages.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Approval Progress</CardTitle>
                  <CardDescription>Track the workflow through each approval stage</CardDescription>
                </CardHeader>
                <CardContent>
                  <WorkflowProgressTrail stages={stages} />
                </CardContent>
              </Card>
            )}

            {/* Approval Stages */}
            <Card>
              <CardHeader>
                <CardTitle>Approval Stages</CardTitle>
                <CardDescription>Track the progress of approval stages</CardDescription>
              </CardHeader>
              <CardContent>
                {stages && stages.length > 0 ? (
                  <div className="space-y-6">
                    {stages.map((stage, index) => (
                      <div key={stage.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold">Stage {index + 1}</span>
                              <span className="text-sm">{stage.stageName}</span>
                              {getStatusBadge(stage.status)}
                            </div>
                            {stage.requiredRole && (
                              <p className="text-sm text-muted-foreground">
                                Required Role: {stage.requiredRole}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Stage Files - Always show for all stages */}
                        <div className="mt-3 space-y-2">
                          <p className="text-sm font-medium">Uploaded Files:</p>
                          {files && files.filter(f => f.stageId === stage.id).length > 0 ? (
                            files.filter(f => f.stageId === stage.id).map((file) => (
                              <div key={file.id} className="p-3 bg-muted/50 rounded border">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 flex-1">
                                    <FileText className="h-4 w-4 text-blue-600" />
                                    <div className="flex-1">
                                      <p className="text-sm font-medium">{file.fileName}</p>
                                      <div className="flex items-center gap-3 mt-1">
                                        <span className="text-xs text-muted-foreground">
                                          Uploaded by {(file as any).uploaderName || 'Unknown'}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                          {format(new Date(file.uploadedAt), "MMM dd, yyyy h:mm a")}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => window.open(file.s3Url || '', "_blank")}
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground italic">No files uploaded yet</p>
                          )}
                        </div>

                        {/* Action Buttons */}
                        {canUserApproveStage(stage) && (
                          <div className="mt-4">
                            {(!files || files.filter(f => f.stageId === stage.id).length === 0) && (
                              <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                                <p className="text-sm text-blue-800 dark:text-blue-200">
                                  ℹ️ Please upload the required form before approving this stage.
                                </p>
                              </div>
                            )}
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleUploadClick(stage.id)}
                                variant="outline"
                                disabled={uploadingStageId === stage.id}
                              >
                                {uploadingStageId === stage.id ? (
                                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                ) : (
                                  <Upload className="h-4 w-4 mr-1" />
                                )}
                                {files && files.filter(f => f.stageId === stage.id).length > 0 ? 'Add Another File' : 'Upload File'}
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleApproveClick(stage.id)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleRejectClick(stage.id)}
                                variant="destructive"
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                          </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No stages defined</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Audit Trail */}
            <AuditTrail workflowId={workflowId} />
          </div>
        </div>
      </main>

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Stage</DialogTitle>
            <DialogDescription>Add optional comments for this approval</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Comments (optional)"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedStageId) {
                  approveStage.mutate({ 
                    stageId: selectedStageId, 
                    workflowId,
                    comments: comments || undefined 
                  });
                }
              }}
              disabled={approveStage.isPending}
            >
              {approveStage.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Stage</DialogTitle>
            <DialogDescription>Please provide a reason for rejection</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Reason for rejection (required)"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedStageId && comments) {
                  rejectStage.mutate({ 
                    stageId: selectedStageId, 
                    workflowId,
                    comments 
                  });
                }
              }}
              disabled={!comments || rejectStage.isPending}
            >
              {rejectStage.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && uploadingStageId) {
            handleFileUpload(uploadingStageId, file);
          }
          e.target.value = '';
        }}
        accept=".xlsx,.xls,.pdf,.doc,.docx,.png,.jpg,.jpeg"
      />

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
