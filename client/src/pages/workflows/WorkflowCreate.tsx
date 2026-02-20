import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, ArrowLeft, Download } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";

export default function WorkflowCreate() {
  const [, setLocation] = useLocation();
  const { user } = useUserRole();
  
  const [workflowType, setWorkflowType] = useState<"MAF" | "PR">("MAF");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [department, setDepartment] = useState("");
  // Price fields removed - will be added later by GA when receiving vendor quotes
  const [requiresGa, setRequiresGa] = useState(false);
  const [requiresPpic, setRequiresPpic] = useState(false);

  const createWorkflow = trpc.workflows.create.useMutation({
    onSuccess: (data) => {
      toast.success("Workflow created successfully");
      setLocation(`/workflows/${data.id}`);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create workflow");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error("Please enter a workflow title");
      return;
    }
    
    if (!department.trim()) {
      toast.error("Please select a department");
      return;
    }

    createWorkflow.mutate({
      workflowType,
      title: title.trim(),
      description: description.trim() || undefined,
      department: department.trim(),
      // Price fields will be added later by GA
      requiresGa,
      requiresPpic,
    });
  };

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

      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Create New Workflow</CardTitle>
            <CardDescription>
              Fill in the details to create a new MAF or PR workflow
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Workflow Type */}
              <div className="space-y-2">
                <Label htmlFor="workflowType">Workflow Type *</Label>
                <Select
                  value={workflowType}
                  onValueChange={(value) => setWorkflowType(value as "MAF" | "PR")}
                >
                  <SelectTrigger id="workflowType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MAF">MAF (Material Authorization Form)</SelectItem>
                    <SelectItem value="PR">PR (Purchase Request)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  {workflowType === "MAF" 
                    ? "Material Authorization Form for material requests"
                    : "Purchase Request for procurement"}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    const url = workflowType === "MAF" 
                      ? "https://files.manuscdn.com/user_upload_by_module/session_file/94657144/ilFCYhWqzCJOhOQm.xlsx"
                      : "https://files.manuscdn.com/user_upload_by_module/session_file/94657144/rJwIBgYgrgdNufqM.xlsx";
                    window.open(url, "_blank");
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download {workflowType} Form Template
                </Button>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter workflow title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Enter workflow description (optional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </div>

              {/* Department */}
              <div className="space-y-2">
                <Label htmlFor="department">Department *</Label>
                <Select value={department} onValueChange={setDepartment}>
                  <SelectTrigger id="department">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PPIC">PPIC</SelectItem>
                    <SelectItem value="Purchasing">Purchasing</SelectItem>
                    <SelectItem value="GA">GA (General Affairs)</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="Production">Production</SelectItem>
                    <SelectItem value="Logistics">Logistics</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Price fields removed - will be added later by GA when receiving vendor quotes */}

              {/* Additional Options */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="requiresGa">Requires GA Approval</Label>
                    <p className="text-sm text-muted-foreground">
                      General Affairs approval required
                    </p>
                  </div>
                  <Switch
                    id="requiresGa"
                    checked={requiresGa}
                    onCheckedChange={setRequiresGa}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="requiresPpic">Requires PPIC Approval</Label>
                    <p className="text-sm text-muted-foreground">
                      PPIC approval required
                    </p>
                  </div>
                  <Switch
                    id="requiresPpic"
                    checked={requiresPpic}
                    onCheckedChange={setRequiresPpic}
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center gap-4 pt-4">
                <Link href="/dashboard" className="flex-1">
                  <Button type="button" variant="outline" className="w-full">
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={createWorkflow.isPending}
                >
                  {createWorkflow.isPending && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Create Workflow
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
