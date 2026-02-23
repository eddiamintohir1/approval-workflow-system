import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { CalendarIcon, ArrowLeft, Loader2, Home, Users } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function RecurringWorkflowCreate() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  
  // Form state
  const [templateId, setTemplateId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [department, setDepartment] = useState("");
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "monthly">("monthly");
  const [dayOfWeek, setDayOfWeek] = useState<number>(1);
  const [dayOfMonth, setDayOfMonth] = useState<number>(1);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [assigneePresets, setAssigneePresets] = useState<Record<string, number[]>>({});

  // Queries
  const { data: templates, isLoading: templatesLoading } = trpc.templates.getAll.useQuery();
  const { data: users, isLoading: usersLoading } = trpc.users.getAll.useQuery();
  const { data: templateStages } = trpc.templates.getById.useQuery(
    { id: templateId },
    { enabled: !!templateId }
  );
  const createMutation = trpc.recurringWorkflows.create.useMutation();

  const handleSubmit = async () => {
    if (!templateId || !title || !department) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await createMutation.mutateAsync({
        templateId,
        title,
        description,
        department,
        frequency,
        dayOfWeek: frequency === "weekly" ? dayOfWeek : undefined,
        dayOfMonth: frequency === "monthly" ? dayOfMonth : undefined,
        startDate,
        endDate,
        assigneePresets: Object.keys(assigneePresets).length > 0 ? assigneePresets : undefined,
      });

      toast.success("Recurring workflow created", {
        description: "Your recurring workflow has been set up successfully.",
      });

      setLocation("/my-personalized-workflows");
    } catch (error: any) {
      toast.error("Error", {
        description: error.message || "Failed to create recurring workflow",
      });
    }
  };

  const selectedTemplate = templates?.find(t => t.id === templateId);
  const stages = templateStages?.stages || [];

  const toggleAssignee = (stageName: string, userId: number) => {
    setAssigneePresets(prev => {
      const current = prev[stageName] || [];
      const updated = current.includes(userId)
        ? current.filter(id => id !== userId)
        : [...current, userId];
      
      if (updated.length === 0) {
        const { [stageName]: _, ...rest } = prev;
        return rest;
      }
      
      return { ...prev, [stageName]: updated };
    });
  };

  return (
    <div className="container max-w-4xl py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/dashboard")}
          >
            <Home className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/my-personalized-workflows")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to My Personalized WF
          </Button>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Create Recurring Workflow</h1>
        <p className="text-muted-foreground mt-2">
          Set up a workflow that automatically generates on a schedule
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8 gap-2">
        {[1, 2, 3, 4].map((s, idx) => (
          <>
            <div key={s} className={cn(
              "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium",
              step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}>
              {s}
            </div>
            {idx < 3 && (
              <div key={`line-${s}`} className={cn("h-0.5 w-12", step > s ? "bg-primary" : "bg-muted")} />
            )}
          </>
        ))}
      </div>

      {/* Step 1: Basic Information */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Choose a template and provide basic details for your recurring workflow
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Template Selection */}
            <div className="space-y-2">
              <Label htmlFor="template">Workflow Template *</Label>
              <Select value={templateId} onValueChange={setTemplateId}>
                <SelectTrigger id="template">
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  {templatesLoading ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : (
                    templates?.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name} ({template.workflowType})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {selectedTemplate && (
                <p className="text-sm text-muted-foreground">
                  {selectedTemplate.description || "No description"}
                </p>
              )}
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Workflow Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Monthly Budget Review"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                This title will be used for all generated workflows
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Optional description for this recurring workflow"
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
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PPIC">PPIC</SelectItem>
                  <SelectItem value="Purchasing">Purchasing</SelectItem>
                  <SelectItem value="Finance">Finance</SelectItem>
                  <SelectItem value="GA">GA</SelectItem>
                  <SelectItem value="Production">Production</SelectItem>
                  <SelectItem value="Logistics">Logistics</SelectItem>
                  <SelectItem value="Sales">Sales</SelectItem>
                  <SelectItem value="R&D">R&D</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Operations">Operations</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                onClick={() => setStep(2)}
                disabled={!templateId || !title || !department}
              >
                Next: Schedule
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Schedule Configuration */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Schedule Configuration</CardTitle>
            <CardDescription>
              Define when this workflow should be automatically generated
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Frequency */}
            <div className="space-y-2">
              <Label>Frequency *</Label>
              <Select value={frequency} onValueChange={(v: any) => setFrequency(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Day of Week (for weekly) */}
            {frequency === "weekly" && (
              <div className="space-y-2">
                <Label>Day of Week *</Label>
                <Select value={String(dayOfWeek)} onValueChange={(v) => setDayOfWeek(Number(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Sunday</SelectItem>
                    <SelectItem value="1">Monday</SelectItem>
                    <SelectItem value="2">Tuesday</SelectItem>
                    <SelectItem value="3">Wednesday</SelectItem>
                    <SelectItem value="4">Thursday</SelectItem>
                    <SelectItem value="5">Friday</SelectItem>
                    <SelectItem value="6">Saturday</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Day of Month (for monthly) */}
            {frequency === "monthly" && (
              <div className="space-y-2">
                <Label>Day of Month *</Label>
                <Select value={String(dayOfMonth)} onValueChange={(v) => setDayOfMonth(Number(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                      <SelectItem key={day} value={String(day)}>
                        Day {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Start Date */}
            <div className="space-y-2">
              <Label>Start Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => date && setStartDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* End Date */}
            <div className="space-y-2">
              <Label>End Date (Optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "No end date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <p className="text-sm text-muted-foreground">
                Leave empty for indefinite recurrence
              </p>
            </div>

            <div className="flex justify-between gap-2 pt-4">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button onClick={() => setStep(3)}>
                Next: Assignees
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Assignee Pre-Selection */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Assignee Pre-Selection</CardTitle>
            <CardDescription>
              Pre-configure which approvers should be automatically assigned to each stage
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {usersLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : stages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No approval stages found in this template</p>
                <p className="text-sm mt-2">You can skip this step</p>
              </div>
            ) : (
              <div className="space-y-6">
                {stages
                  .filter(stage => stage.approvalRequired)
                  .map((stage) => (
                    <div key={stage.id} className="border rounded-lg p-4 space-y-3">
                      <div>
                        <h4 className="font-semibold">{stage.stageName}</h4>
                        {stage.stageDescription && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {stage.stageDescription}
                          </p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">
                          Select approvers for this stage:
                        </Label>
                        <div className="grid grid-cols-2 gap-2">
                          {users
                            ?.filter(user => user.isActive)
                            .map((user) => (
                              <div key={user.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`${stage.stageName}-${user.id}`}
                                  checked={assigneePresets[stage.stageName]?.includes(user.id) || false}
                                  onCheckedChange={() => toggleAssignee(stage.stageName, user.id)}
                                />
                                <label
                                  htmlFor={`${stage.stageName}-${user.id}`}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                >
                                  {user.fullName} ({user.role})
                                </label>
                              </div>
                            ))}
                        </div>
                        {assigneePresets[stage.stageName]?.length > 0 && (
                          <p className="text-sm text-muted-foreground">
                            {assigneePresets[stage.stageName].length} approver(s) selected
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}

            <div className="flex justify-between gap-2 pt-4">
              <Button variant="outline" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button onClick={() => setStep(4)}>
                Next: Review
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Review and Create */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Review and Create</CardTitle>
            <CardDescription>
              Review your recurring workflow configuration before creating
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Template</Label>
                <p className="font-medium">
                  {selectedTemplate?.name} ({selectedTemplate?.workflowType})
                </p>
              </div>
              
              <div>
                <Label className="text-muted-foreground">Title</Label>
                <p className="font-medium">{title}</p>
              </div>
              
              {description && (
                <div>
                  <Label className="text-muted-foreground">Description</Label>
                  <p className="font-medium">{description}</p>
                </div>
              )}
              
              <div>
                <Label className="text-muted-foreground">Department</Label>
                <p className="font-medium">{department}</p>
              </div>
              
              <div>
                <Label className="text-muted-foreground">Frequency</Label>
                <p className="font-medium">
                  {frequency === "daily" && "Daily"}
                  {frequency === "weekly" && `Weekly on ${["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][dayOfWeek]}`}
                  {frequency === "monthly" && `Monthly On Day ${dayOfMonth}`}
                </p>
              </div>
              
              <div>
                <Label className="text-muted-foreground">Start Date</Label>
                <p className="font-medium">{format(startDate, "PPP")}</p>
              </div>
              
              {endDate && (
                <div>
                  <Label className="text-muted-foreground">End Date</Label>
                  <p className="font-medium">{format(endDate, "PPP")}</p>
                </div>
              )}

              {Object.keys(assigneePresets).length > 0 && (
                <div>
                  <Label className="text-muted-foreground">Pre-assigned Approvers</Label>
                  <div className="mt-2 space-y-2">
                    {Object.entries(assigneePresets).map(([stageName, userIds]) => (
                      <div key={stageName} className="text-sm">
                        <span className="font-medium">{stageName}:</span>{" "}
                        {userIds.map(userId => {
                          const user = users?.find(u => u.id === userId);
                          return user?.fullName;
                        }).filter(Boolean).join(", ")}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between gap-2 pt-4">
              <Button variant="outline" onClick={() => setStep(3)}>
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Recurring Workflow
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
