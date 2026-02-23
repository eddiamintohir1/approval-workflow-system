import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
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

export default function RecurringWorkflowEdit() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const id = params.id!;

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [department, setDepartment] = useState("");
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "monthly">("monthly");
  const [dayOfWeek, setDayOfWeek] = useState<number>(1);
  const [dayOfMonth, setDayOfMonth] = useState<number>(1);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  // Queries
  const { data: workflow, isLoading } = trpc.recurringWorkflows.getById.useQuery({ id });
  const updateMutation = trpc.recurringWorkflows.update.useMutation();

  // Load workflow data
  useEffect(() => {
    if (workflow) {
      setTitle(workflow.title);
      setDescription(workflow.description || "");
      setDepartment(workflow.department);
      setFrequency(workflow.frequency);
      setDayOfWeek(workflow.dayOfWeek || 1);
      setDayOfMonth(workflow.dayOfMonth || 1);
      setStartDate(new Date(workflow.startDate));
      setEndDate(workflow.endDate ? new Date(workflow.endDate) : undefined);
    }
  }, [workflow]);

  const handleSubmit = async () => {
    if (!title || !department) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id,
        title,
        description,
        department,
        frequency,
        dayOfWeek: frequency === "weekly" ? dayOfWeek : undefined,
        dayOfMonth: frequency === "monthly" ? dayOfMonth : undefined,
        startDate,
        endDate,
      });

      toast.success("Recurring workflow updated", {
        description: "Your changes have been saved successfully.",
      });

      setLocation("/my-personalized-workflows");
    } catch (error: any) {
      toast.error("Error", {
        description: error.message || "Failed to update recurring workflow",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container max-w-4xl py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="container max-w-4xl py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-muted-foreground">Recurring workflow not found</p>
            <Button
              onClick={() => setLocation("/my-personalized-workflows")}
              className="mt-4"
            >
              Back to My Personalized WF
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
        <h1 className="text-3xl font-bold tracking-tight">Edit Recurring Workflow</h1>
        <p className="text-muted-foreground mt-2">
          Modify the schedule and settings for this recurring workflow
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Workflow Settings</CardTitle>
          <CardDescription>
            Update the configuration for this recurring workflow
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Workflow Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Monthly Budget Review"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
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

          <div className="border-t pt-6 mt-6">
            <h3 className="text-lg font-semibold mb-4">Schedule</h3>

            {/* Frequency */}
            <div className="space-y-2 mb-4">
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
              <div className="space-y-2 mb-4">
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
              <div className="space-y-2 mb-4">
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
              </div>
            )}

            {/* Start Date */}
            <div className="space-y-2 mb-4">
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
                    disabled={(date) => date < startDate}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-6 border-t">
            <Button
              variant="outline"
              onClick={() => setLocation("/my-personalized-workflows")}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
