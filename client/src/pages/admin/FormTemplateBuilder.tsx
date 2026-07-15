import { useEffect, useState } from "react";
import { useLocation, Link, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, GripVertical, Home } from "lucide-react";
import { toast } from "sonner";

type FieldType =
  | "text"
  | "number"
  | "date"
  | "dropdown"
  | "textarea"
  | "file"
  | "checkbox"
  | "email";

interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
  defaultValue?: any;
  mappingKey?: string;
  showInTable?: boolean;
  tableLabel?: string;
  tableOrder?: number;
}

export default function FormTemplateBuilder() {
  const [, setLocation] = useLocation();
  const { id } = useParams<{ id?: string }>();
  const isEditMode = Boolean(id);
  const [templateName, setTemplateName] = useState("");
  const [templateCode, setTemplateCode] = useState("");
  const [description, setDescription] = useState("");
  const [fields, setFields] = useState<FormField[]>([]);

  const { data: existingTemplate, isLoading } =
    trpc.formTemplates.getById.useQuery(
      { id: id || "" },
      { enabled: isEditMode }
    );

  useEffect(() => {
    if (!existingTemplate) return;
    setTemplateName(existingTemplate.templateName);
    setTemplateCode(existingTemplate.templateCode);
    setDescription(existingTemplate.description || "");
    setFields(existingTemplate.fields);
  }, [existingTemplate]);

  const createTemplate = trpc.formTemplates.create.useMutation({
    onSuccess: () => {
      toast.success("Form template created successfully");
      setLocation("/admin/form-templates");
    },
    onError: error => {
      toast.error(error.message);
    },
  });

  const updateTemplate = trpc.formTemplates.update.useMutation({
    onSuccess: () => {
      toast.success("Form template updated successfully");
      setLocation("/admin/form-templates");
    },
    onError: error => {
      toast.error(error.message);
    },
  });

  const addField = () => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      type: "text",
      label: "",
      required: false,
    };
    setFields([...fields, newField]);
  };

  const updateField = (index: number, updates: Partial<FormField>) => {
    const updated = [...fields];
    updated[index] = { ...updated[index], ...updates };
    setFields(updated);
  };

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!templateName || !templateCode) {
      toast.error("Template name and code are required");
      return;
    }

    if (fields.length === 0) {
      toast.error("Add at least one field to the form");
      return;
    }

    if (isEditMode && id) {
      updateTemplate.mutate({ id, templateName, description, fields });
    } else {
      createTemplate.mutate({
        templateName,
        templateCode,
        description,
        fields,
      });
    }
  };

  if (isEditMode && isLoading) {
    return (
      <div className="container max-w-4xl py-8">
        <p className="text-muted-foreground">Loading template...</p>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-6">
        <Link href="/">
          <Button variant="outline" size="sm" className="mb-4">
            <Home className="h-4 w-4 mr-2" />
            Home
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">
          {isEditMode ? "Edit Form Template" : "Create Form Template"}
        </h1>
        <p className="text-muted-foreground mt-2">
          Build custom forms with configurable fields and validation rules
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Template Information</CardTitle>
            <CardDescription>
              Basic details about the form template
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="templateName">Template Name *</Label>
              <Input
                id="templateName"
                value={templateName}
                onChange={e => setTemplateName(e.target.value)}
                placeholder="e.g., Material Approval Form"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="templateCode">Template Code *</Label>
              <Input
                id="templateCode"
                value={templateCode}
                onChange={e => setTemplateCode(e.target.value.toUpperCase())}
                placeholder="e.g., MAF_FORM"
                disabled={isEditMode}
                required
              />
              <p className="text-sm text-muted-foreground">
                Unique identifier for this template (uppercase, no spaces)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe the purpose of this form..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Form Fields</CardTitle>
            <CardDescription>
              Add and configure fields for this form
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <Card key={field.id} className="border-2">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-2">
                      <GripVertical className="h-5 w-5 text-muted-foreground" />
                    </div>

                    <div className="flex-1 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Field Label *</Label>
                          <Input
                            value={field.label}
                            onChange={e =>
                              updateField(index, { label: e.target.value })
                            }
                            placeholder="e.g., Material Name"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Field Type *</Label>
                          <Select
                            value={field.type}
                            onValueChange={value =>
                              updateField(index, { type: value as FieldType })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text">Text</SelectItem>
                              <SelectItem value="number">Number</SelectItem>
                              <SelectItem value="date">Date</SelectItem>
                              <SelectItem value="dropdown">Dropdown</SelectItem>
                              <SelectItem value="textarea">
                                Text Area
                              </SelectItem>
                              <SelectItem value="file">File Upload</SelectItem>
                              <SelectItem value="checkbox">Checkbox</SelectItem>
                              <SelectItem value="email">Email</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Placeholder</Label>
                        <Input
                          value={field.placeholder || ""}
                          onChange={e =>
                            updateField(index, { placeholder: e.target.value })
                          }
                          placeholder="Placeholder text..."
                        />
                      </div>

                      {field.type === "dropdown" && (
                        <div className="space-y-2">
                          <Label>Options (comma-separated) *</Label>
                          <Input
                            value={field.options?.join(", ") || ""}
                            onChange={e =>
                              updateField(index, {
                                options: e.target.value
                                  .split(",")
                                  .map(s => s.trim()),
                              })
                            }
                            placeholder="Option 1, Option 2, Option 3"
                          />
                        </div>
                      )}

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`required-${field.id}`}
                          checked={field.required}
                          onCheckedChange={checked =>
                            updateField(index, { required: checked as boolean })
                          }
                        />
                        <Label
                          htmlFor={`required-${field.id}`}
                          className="font-normal"
                        >
                          Required field
                        </Label>
                      </div>

                      <div className="rounded-md border bg-muted/30 p-4 space-y-4">
                        <div>
                          <p className="text-sm font-medium">
                            Processing table mapping
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Give reusable fields a stable key such as
                            account_number or account_name.
                          </p>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor={`mapping-${field.id}`}>
                              Mapping key
                            </Label>
                            <Input
                              id={`mapping-${field.id}`}
                              value={field.mappingKey || ""}
                              onChange={event =>
                                updateField(index, {
                                  mappingKey: event.target.value
                                    .toLowerCase()
                                    .replace(/[^a-z0-9_]/g, "_"),
                                })
                              }
                              placeholder="account_number"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`table-label-${field.id}`}>
                              Column label
                            </Label>
                            <Input
                              id={`table-label-${field.id}`}
                              value={field.tableLabel || ""}
                              onChange={event =>
                                updateField(index, {
                                  tableLabel: event.target.value,
                                })
                              }
                              placeholder={field.label || "Account Number"}
                            />
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`table-${field.id}`}
                            checked={field.showInTable || false}
                            disabled={!field.mappingKey}
                            onCheckedChange={checked =>
                              updateField(index, {
                                showInTable: checked as boolean,
                                tableOrder: field.tableOrder ?? index,
                              })
                            }
                          />
                          <Label
                            htmlFor={`table-${field.id}`}
                            className="font-normal"
                          >
                            Show this field in the processing inbox
                          </Label>
                        </div>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeField(index)}
                      className="flex-shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={addField}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Field
            </Button>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setLocation("/admin/form-templates")}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={createTemplate.isPending || updateTemplate.isPending}
          >
            {createTemplate.isPending || updateTemplate.isPending
              ? "Saving..."
              : isEditMode
                ? "Save Changes"
                : "Create Template"}
          </Button>
        </div>
      </form>
    </div>
  );
}
