import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, Users, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface QuickAssignModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function QuickAssignModal({ open, onOpenChange, onSuccess }: QuickAssignModalProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  
  // Get quick assign enabled templates
  const { data: templates, isLoading: templatesLoading } = trpc.templates.getQuickAssignTemplates.useQuery(undefined, {
    enabled: open,
  });
  
  // Get staff users
  const { data: users, isLoading: usersLoading } = trpc.users.getAll.useQuery(undefined, {
    enabled: open,
  });
  
  const staffUsers = users?.filter(u => u.role === 'Staff') || [];
  
  // Create workflow from template and assign
  const createWorkflow = trpc.workflows.createFromTemplate.useMutation({
    onSuccess: async (workflow) => {
      // Assign to selected user
      if (selectedUserId) {
        await assignWorkflow.mutateAsync({
          workflowId: workflow.id,
          assignedTo: parseInt(selectedUserId),
        });
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create workflow');
    },
  });
  
  const assignWorkflow = trpc.assignments.create.useMutation({
    onSuccess: () => {
      onSuccess();
      onOpenChange(false);
      // Reset form
      setSelectedTemplateId("");
      setSelectedUserId("");
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to assign workflow');
    },
  });
  
  const handleAssign = async () => {
    if (!selectedTemplateId || !selectedUserId) {
      toast.error('Please select both template and user');
      return;
    }
    
    // Create workflow from template
    await createWorkflow.mutateAsync({
      templateId: selectedTemplateId,
      title: `Quick Assigned - ${templates?.find(t => t.id === selectedTemplateId)?.name}`,
    });
  };
  
  const isLoading = createWorkflow.isPending || assignWorkflow.isPending;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Quick Assign Workflow</DialogTitle>
          <DialogDescription>
            Select a template and assign it to a staff member
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Template Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Select Template</label>
            {templatesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : templates && templates.length > 0 ? (
              <div className="grid gap-3">
                {templates.map((template) => (
                  <Card
                    key={template.id}
                    className={`cursor-pointer transition-all ${
                      selectedTemplateId === template.id
                        ? 'ring-2 ring-primary'
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedTemplateId(template.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-base">{template.name}</CardTitle>
                          {template.description && (
                            <CardDescription className="text-sm">
                              {template.description}
                            </CardDescription>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="secondary">{template.workflowType}</Badge>
                          <Badge variant="outline">{template.stages?.length || 0} Stages</Badge>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No templates enabled for quick assign</p>
                  <p className="text-sm mt-1">Enable templates in the Templates page</p>
                </CardContent>
              </Card>
            )}
          </div>
          
          {/* User Selection */}
          {selectedTemplateId && (
            <div className="space-y-3">
              <label className="text-sm font-medium">Assign To (Staff)</label>
              {usersLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : staffUsers.length > 0 ? (
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select staff member" />
                  </SelectTrigger>
                  <SelectContent>
                    {staffUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span>{user.fullName}</span>
                          <span className="text-muted-foreground text-sm">({user.email})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Card>
                  <CardContent className="py-6 text-center text-muted-foreground">
                    <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No staff users available</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button 
              onClick={handleAssign} 
              disabled={!selectedTemplateId || !selectedUserId || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Assign Workflow
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
