import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Calendar, DollarSign, Package, User } from "lucide-react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DynamicFormRenderer } from "@/components/DynamicFormRenderer";
import { toast } from "sonner";

interface FormSubmissionDisplayProps {
  workflowId: string;
}

export function FormSubmissionDisplay({
  workflowId,
}: FormSubmissionDisplayProps) {
  const [draftData, setDraftData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const {
    data: submissions,
    isLoading,
    refetch,
  } = trpc.formSubmissions.getByWorkflow.useQuery({ workflowId });
  const submission = submissions?.[0];

  useEffect(() => {
    if (submission) setDraftData(submission.formData);
  }, [submission]);

  const updateSubmission = trpc.formSubmissions.update.useMutation({
    onSuccess: async () => {
      await refetch();
    },
    onError: error => toast.error(error.message),
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!submission?.template) {
    return null; // No form submission for this workflow
  }

  const { template, formData } = submission;

  const saveDraft = async () => {
    await updateSubmission.mutateAsync({
      id: submission.id,
      formData: draftData,
      submissionStatus: "draft",
    });
    toast.success("Draft saved");
  };

  const submitDraft = async () => {
    const nextErrors: Record<string, string> = {};
    template.fields.forEach(field => {
      const value = draftData[field.id];
      if (
        field.required &&
        (value === undefined || value === null || value === "")
      ) {
        nextErrors[field.id] = `${field.label} is required`;
      }
    });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      toast.error("Complete all required fields before submitting");
      return;
    }

    await updateSubmission.mutateAsync({
      id: submission.id,
      formData: draftData,
      submissionStatus: "submitted",
    });
    toast.success("Form submitted for processing");
  };

  if (submission.submissionStatus === "draft") {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Continue Draft</CardTitle>
              <CardDescription>{template.templateName}</CardDescription>
            </div>
            <Badge variant="secondary">Draft</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <DynamicFormRenderer
            fields={template.fields}
            formData={draftData}
            errors={errors}
            onChange={(fieldId, value) => {
              setDraftData(current => ({ ...current, [fieldId]: value }));
              setErrors(current => {
                const next = { ...current };
                delete next[fieldId];
                return next;
              });
            }}
          />
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              disabled={updateSubmission.isPending}
              onClick={saveDraft}
            >
              Save Draft
            </Button>
            <Button disabled={updateSubmission.isPending} onClick={submitDraft}>
              Submit for Processing
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Helper to get icon for field type
  const getFieldIcon = (type: string) => {
    switch (type) {
      case "date":
        return <Calendar className="h-4 w-4" />;
      case "number":
        return <DollarSign className="h-4 w-4" />;
      case "text":
      case "email":
        return <User className="h-4 w-4" />;
      case "textarea":
        return <FileText className="h-4 w-4" />;
      case "dropdown":
        return <Package className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  // Helper to format field value
  const formatValue = (field: any, value: any) => {
    if (!value)
      return <span className="text-muted-foreground italic">Not provided</span>;

    switch (field.type) {
      case "date":
        return new Date(value).toLocaleDateString();
      case "number":
        return parseFloat(value).toLocaleString();
      case "checkbox":
        return value ? "Yes" : "No";
      case "file":
        return typeof value === "string" ? (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            View file
          </a>
        ) : (
          value.name || "File attached"
        );
      case "textarea":
        return <p className="whitespace-pre-wrap">{value}</p>;
      default:
        return value;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Form Details
            </CardTitle>
            <CardDescription>{template.templateName}</CardDescription>
          </div>
          <Badge variant="outline">{template.templateCode}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {template.fields.map((field: any) => {
            const value = formData[field.id];

            return (
              <div key={field.id} className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {getFieldIcon(field.type)}
                  <span className="font-medium">{field.label}</span>
                  {field.required && (
                    <span className="text-destructive">*</span>
                  )}
                </div>
                <div className="pl-6 text-sm">{formatValue(field, value)}</div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
