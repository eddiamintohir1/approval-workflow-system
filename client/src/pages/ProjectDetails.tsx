import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { Loader2, ArrowLeft, CheckCircle2, XCircle, AlertCircle, Upload, Download, FileText } from "lucide-react";
import { useState, useRef } from "react";
import { Link, useParams } from "wouter";
import { toast } from "sonner";
import { useUserRole } from "@/hooks/useUserRole";

// Component to handle forms for a single milestone
function MilestoneFormSection({ 
  milestoneId, 
  milestoneStatus, 
  isViewOnly, 
  uploadingMilestone, 
  onUploadClick, 
  onDownloadClick, 
  downloadPending 
}: { 
  milestoneId: number; 
  milestoneStatus: string; 
  isViewOnly: boolean; 
  uploadingMilestone: number | null; 
  onUploadClick: (id: number) => void; 
  onDownloadClick: (data: { formId: number }) => void; 
  downloadPending: boolean; 
}) {
  const { data: forms } = trpc.forms.getByMilestone.useQuery({ milestoneId });
  
  return (
    <div className="mt-3 space-y-2">
      {forms && forms.length > 0 && forms.map((form: any) => (
        <div key={form.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="text-sm">{form.name}</span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDownloadClick({ formId: form.id })}
            disabled={downloadPending}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      ))}
      
      {milestoneStatus === "in_progress" && !isViewOnly && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => onUploadClick(milestoneId)}
          disabled={uploadingMilestone === milestoneId}
        >
          {uploadingMilestone === milestoneId ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <Upload className="h-4 w-4 mr-1" />
          )}
          Upload Form
        </Button>
      )}
    </div>
  );
}

export default function ProjectDetails() {
  const { id } = useParams();
  const projectId = parseInt(id || "0");
  const { user } = useUserRole();
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<number | null>(null);
  const [comments, setComments] = useState("");
  const [uploadingMilestone, setUploadingMilestone] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: project, isLoading: projectLoading } = trpc.projects.getById.useQuery({ projectId });
  const { data: milestones, isLoading: milestonesLoading, refetch: refetchMilestones } = trpc.milestones.getByProject.useQuery({ projectId });
  const { data: auditTrail, refetch: refetchAudit } = trpc.audit.getByProject.useQuery({ projectId });

  const approveMilestone = trpc.milestones.approve.useMutation({
    onSuccess: () => {
      toast.success("Milestone approved successfully");
      setApproveDialogOpen(false);
      setComments("");
      setSelectedMilestone(null);
      refetchMilestones();
      refetchAudit();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const rejectMilestone = trpc.milestones.reject.useMutation({
    onSuccess: () => {
      toast.success("Milestone rejected");
      setRejectDialogOpen(false);
      setComments("");
      setSelectedMilestone(null);
      refetchMilestones();
      refetchAudit();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const uploadFormMutation = trpc.forms.upload.useMutation({
    onSuccess: () => {
      toast.success("Form uploaded successfully");
      setUploadingMilestone(null);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const downloadFormMutation = trpc.forms.download.useMutation({
    onSuccess: (data) => {
      // Open the presigned URL in a new tab to download
      window.open(data.url, '_blank');
      toast.success("Download started");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleFileUpload = async (milestoneId: number, file: File) => {
    try {
      setUploadingMilestone(milestoneId);
      
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;
        const base64Content = base64Data.split(',')[1]; // Remove data:mime;base64, prefix
        
        // Upload through backend
        await uploadFormMutation.mutateAsync({
          milestoneId,
          fileName: file.name,
          fileType: file.type,
          fileData: base64Content,
        });
      };
      reader.onerror = () => {
        toast.error("Failed to read file");
        setUploadingMilestone(null);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error("Failed to upload file");
      setUploadingMilestone(null);
    }
  };

  const triggerFileUpload = (milestoneId: number) => {
    setUploadingMilestone(milestoneId);
    fileInputRef.current?.click();
  };

  if (projectLoading || milestonesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Project Not Found</CardTitle>
            <CardDescription>The project you're looking for doesn't exist.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button>Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "rejected":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "in_progress":
        return <AlertCircle className="h-5 w-5 text-blue-500" />;
      default:
        return <div className="h-5 w-5 rounded-full border-2 border-muted" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      in_progress: "default",
      completed: "outline",
      rejected: "destructive",
    };
    return <Badge variant={variants[status] || "default"}>{status.replace("_", " ").toUpperCase()}</Badge>;
  };

  const canApprove = (milestone: any) => {
    if (!user) return false;
    // Hide buttons if milestone is already completed or rejected
    if (milestone.status === "completed" || milestone.status === "rejected") return false;
    if (user.role === "admin" || user.role === "director") return true;
    if (milestone.is_view_only) return false;
    // Check if any previous milestone was rejected - if so, disable this one
    const allMilestones = milestones || [];
    const currentIndex = allMilestones.findIndex(m => m.id === milestone.id);
    const previousMilestones = allMilestones.slice(0, currentIndex);
    const hasRejectedPrevious = previousMilestones.some(m => m.status === "rejected");
    if (hasRejectedPrevious) return false;
    return milestone.approver_role === user.role && milestone.status === "in_progress";
  };

  const groupedMilestones = milestones?.reduce((acc, milestone) => {
    if (!acc[milestone.stage]) {
      acc[milestone.stage] = [];
    }
    acc[milestone.stage].push(milestone);
    return acc;
  }, {} as Record<number, typeof milestones>);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold">{project.name}</h1>
                {project.is_oem && <Badge variant="secondary">OEM</Badge>}
              </div>
              <p className="text-sm text-muted-foreground">
                SKU: {project.sku} | Current Stage: {project.current_stage}
              </p>
            </div>
            {getStatusBadge(project.status)}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Workflow Timeline */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Workflow Progress</CardTitle>
                <CardDescription>Track the approval stages for this project</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {Object.entries(groupedMilestones || {}).map(([stage, stageMilestones]) => (
                  <div key={stage} className="space-y-4">
                    <h3 className="font-semibold text-lg">Stage {stage}</h3>
                    {stageMilestones.map((milestone) => (
                      <div key={milestone.id} className="flex items-start gap-4 p-4 border rounded-lg">
                        <div className="mt-1">{getStatusIcon(milestone.status)}</div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium">{milestone.name}</h4>
                            {getStatusBadge(milestone.status)}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {milestone.is_view_only ? "View Only" : `Approver: ${milestone.approver_role.replace("_", " ")}`}
                          </p>
                          
                          {/* Form Upload/Download Section */}
                          <MilestoneFormSection
                            milestoneId={milestone.id}
                            milestoneStatus={milestone.status}
                            isViewOnly={milestone.is_view_only}
                            uploadingMilestone={uploadingMilestone}
                            onUploadClick={triggerFileUpload}
                            onDownloadClick={downloadFormMutation.mutate}
                            downloadPending={downloadFormMutation.isPending}
                          />
                          
                          {canApprove(milestone) && (
                            <div className="flex gap-2 mt-3">
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedMilestone(milestone.id);
                                  setApproveDialogOpen(true);
                                }}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  setSelectedMilestone(milestone.id);
                                  setRejectDialogOpen(true);
                                }}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Audit Trail */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Audit Trail</CardTitle>
                <CardDescription>History of all actions</CardDescription>
              </CardHeader>
              <CardContent>
                {auditTrail && auditTrail.length > 0 ? (
                  <div className="space-y-4">
                    {auditTrail.map((entry) => (
                      <div key={entry.id} className="text-sm border-l-2 border-muted pl-3 py-1">
                        <p className="font-medium">{entry.action.replace("_", " ")}</p>
                        <p className="text-muted-foreground text-xs">
                          {new Date(entry.created_at).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No activity yet</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Milestone</DialogTitle>
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
                if (selectedMilestone) {
                  approveMilestone.mutate({ milestoneId: selectedMilestone, comments: comments || undefined });
                }
              }}
              disabled={approveMilestone.isPending}
            >
              {approveMilestone.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Approve
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
          if (file && uploadingMilestone) {
            handleFileUpload(uploadingMilestone, file);
          }
          // Reset the input
          e.target.value = '';
        }}
        accept=".xlsx,.xls,.pdf,.doc,.docx"
      />

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Milestone</DialogTitle>
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
                if (selectedMilestone && comments) {
                  rejectMilestone.mutate({ milestoneId: selectedMilestone, comments });
                }
              }}
              disabled={!comments || rejectMilestone.isPending}
            >
              {rejectMilestone.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Reject
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
