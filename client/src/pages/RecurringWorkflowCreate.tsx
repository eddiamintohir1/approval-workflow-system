import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { CalendarIcon, ArrowLeft, Loader2, Home } from "lucide-react";
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

  // Queries
  const { data: templates, isLoading: templatesLoading } = trpc.templates.getAll.useQuery();
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
        <div className={cn(
          "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium",
          step >= 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        )}>
          1
        </div>
        <div className={cn("h-0.5 w-16", step >= 2 ? "bg-primary" : "bg-muted")} />
        <div className={cn(
          "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium",
          step >= 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        )}>
          2
        </div>
        <div className={cn("h-0.5 w-16", step >= 3 ? "bg-primary" : "bg-muted")} />
        <div className={cn(
          "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium",
          step >= 3 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        )}>
          3
        </div>
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
                <Select value={dayOfWeek.toString()} onValueChange={(v) => setDayOfWeek(parseInt(v))}>
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
                <Select value={dayOfMonth.toString()} onValueChange={(v) => setDayOfMonth(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                      <SelectItem key={day} value={day.toString()}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Workflow will be generated on this day of each month
                </p>
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
              <p className="text-sm text-muted-foreground">
                First workflow will be generated on or after this date
              </p>
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
                    disabled={(date) => date < startDate}
                  />
                </PopoverContent>
              </Popover>
              <p className="text-sm text-muted-foreground">
                Leave empty to continue indefinitely
              </p>
            </div>

            <div className="flex justify-between gap-2 pt-4">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button onClick={() => setStep(3)}>
                Next: Review
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Review and Create */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Review and Create</CardTitle>
            <CardDescription>
              Review your recurring workflow configuration before creating
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-sm font-medium text-muted-foreground">Template:</div>
                <div className="col-span-2 text-sm">
                  {selectedTemplate?.name} ({selectedTemplate?.workflowType})
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-sm font-medium text-muted-foreground">Title:</div>
                <div className="col-span-2 text-sm">{title}</div>
              </div>
              {description && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-sm font-medium text-muted-foreground">Description:</div>
                  <div className="col-span-2 text-sm">{description}</div>
                </div>
              )}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-sm font-medium text-muted-foreground">Department:</div>
                <div className="col-span-2 text-sm">{department}</div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-sm font-medium text-muted-foreground">Frequency:</div>
                <div className="col-span-2 text-sm capitalize">
                  {frequency}
                  {frequency === "weekly" && ` on ${["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][dayOfWeek]}`}
                  {frequency === "monthly" && ` on day ${dayOfMonth}`}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-sm font-medium text-muted-foreground">Start Date:</div>
                <div className="col-span-2 text-sm">{format(startDate, "PPP")}</div>
              </div>
              {endDate && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-sm font-medium text-muted-foreground">End Date:</div>
                  <div className="col-span-2 text-sm">{format(endDate, "PPP")}</div>
                </div>
              )}
            </div>

            <div className="flex justify-between gap-2 pt-4">
              <Button variant="outline" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Recurring Workflow
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
