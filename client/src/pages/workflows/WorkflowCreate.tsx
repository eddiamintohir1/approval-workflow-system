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
import { Loader2, ArrowLeft, Download, FileText } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";
import { DynamicFormRenderer } from "@/components/DynamicFormRenderer";

export default function WorkflowCreate() {
  const [, setLocation] = useLocation();
  const { user } = useUserRole();
  
  const [workflowType, setWorkflowType] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [department, setDepartment] = useState("");
  const [requiresGa, setRequiresGa] = useState(false);
  const [requiresPpic, setRequiresPpic] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Fetch active form templates
  const { data: formTemplates, isLoading: formTemplatesLoading } = trpc.formTemplates.getActive.useQuery();
  
  // Fetch workflow templates
  const { data: workflowTemplates, isLoading: workflowTemplatesLoading } = trpc.templates.getAll.useQuery({ isActive: true });
  
  // Get selected workflow template
  const selectedWorkflowTemplate = workflowTemplates?.find(t => t.id === selectedTemplateId);

  // Get form template for selected workflow type
  const selectedFormTemplate = formTemplates?.find(t => t.templateCode === workflowType);

  const createWorkflow = trpc.workflows.create.useMutation({
    onSuccess: (data) => {
      toast.success("Workflow created successfully");
      setLocation(`/workflows/${data.id}`);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create workflow");
    },
  });

  const createFormSubmission = trpc.formSubmissions.create.useMutation();

  const handleFormDataChange = (fieldId: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
    // Clear error for this field when user starts typing
    if (formErrors[fieldId]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    if (!selectedFormTemplate) return true; // No template selected, skip validation

    const errors: Record<string, string> = {};
    
    for (const field of selectedFormTemplate.fields) {
      const value = formData[field.id];
      
      if (field.required && !value) {
        errors[field.id] = `${field.label} is required`;
      }
      
      if (field.validation) {
        const { min, max, pattern } = field.validation;
        
        if (field.type === "number" && value !== undefined && value !== "") {
          const numValue = Number(value);
          if (min !== undefined && numValue < min) {
            errors[field.id] = `Minimum value is ${min}`;
          }
          if (max !== undefined && numValue > max) {
            errors[field.id] = `Maximum value is ${max}`;
          }
        }
        
        if (field.type === "text" && pattern && value) {
          const regex = new RegExp(pattern);
          if (!regex.test(value)) {
            errors[field.id] = field.validation.message || `Invalid format`;
          }
        }
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error("Please enter a workflow title");
      return;
    }
    
    if (!department.trim()) {
      toast.error("Please select a department");
      return;
    }

    // Validate form if form template is selected
    if (selectedFormTemplate && !validateForm()) {
      toast.error("Please fill in all required fields correctly");
      return;
    }

    try {
      // Create workflow
      const workflow = await createWorkflow.mutateAsync({
        workflowType,
        title: title.trim(),
        description: description.trim() || undefined,
        department: department.trim(),
        requiresGa,
        requiresPpic,
        templateId: selectedTemplateId || undefined,
      });

      // If form template was used, save form submission
      if (selectedFormTemplate && selectedFormTemplate.id) {
        console.log('Creating form submission with data:', formData);
        await createFormSubmission.mutateAsync({
          workflowId: workflow.id,
          templateId: String(selectedFormTemplate.id),
          formData: formData || {},
          submissionStatus: 'submitted',
        });
      }

      toast.success("Workflow created successfully");
      setLocation(`/workflows/${workflow.id}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to create workflow");
    }
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
              Select a workflow type and fill in the form to create a new approval workflow
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Workflow Template Selection */}
              <div className="space-y-2">
                <Label htmlFor="templateId">Workflow Template *</Label>
                <Select
                  value={selectedTemplateId}
                  onValueChange={(value) => {
                    setSelectedTemplateId(value);
                    const template = workflowTemplates?.find(t => t.id === value);
                    if (template) {
                      setWorkflowType(template.workflowType);
                    }
                    setFormData({});
                    setFormErrors({});
                  }}
                >
                  <SelectTrigger id="templateId">
                    <SelectValue placeholder="Select a workflow template" />
                  </SelectTrigger>
                  <SelectContent>
                    {workflowTemplatesLoading ? (
                      <div className="p-2 text-sm text-muted-foreground">Loading templates...</div>
                    ) : workflowTemplates && workflowTemplates.length > 0 ? (
                      workflowTemplates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name} ({template.workflowType})
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-sm text-muted-foreground">No templates available</div>
                    )}
                  </SelectContent>
                </Select>
                {selectedWorkflowTemplate && (
                  <div className="flex items-center gap-2 mt-2 p-3 bg-muted rounded-md">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{selectedWorkflowTemplate.name}</p>
                      <p className="text-xs text-muted-foreground">{selectedWorkflowTemplate.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {selectedWorkflowTemplate.stages?.length || 0} stages
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Workflow Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter a descriptive title for this workflow"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Add any additional notes or context"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Department */}
              <div className="space-y-2">
                <Label htmlFor="department">Department *</Label>
                <Select value={department} onValueChange={setDepartment}>
                  <SelectTrigger id="department">
                    <SelectValue placeholder="Select your department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PPIC">PPIC</SelectItem>
                    <SelectItem value="Purchasing">Purchasing</SelectItem>
                    <SelectItem value="GA">GA (General Affairs)</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="Production">Production</SelectItem>
                    <SelectItem value="Logistics">Logistics</SelectItem>
                    <SelectItem value="IT">IT</SelectItem>
                    <SelectItem value="HR">HR</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="Sales">Sales</SelectItem>
                    <SelectItem value="R&D">R&D</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Dynamic Form Fields */}
              {selectedFormTemplate && (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2 mb-4">
                    <FileText className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Form Details</h3>
                  </div>
                  <DynamicFormRenderer
                    fields={selectedFormTemplate.fields}
                    formData={formData}
                    onChange={handleFormDataChange}
                    errors={formErrors}
                    disabled={createWorkflow.isPending}
                  />
                </div>
              )}

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
                  disabled={createWorkflow.isPending || createFormSubmission.isPending}
                >
                  {(createWorkflow.isPending || createFormSubmission.isPending) && (
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
