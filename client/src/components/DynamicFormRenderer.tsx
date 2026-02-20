import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

interface FormField {
  id: string;
  type: "text" | "number" | "date" | "dropdown" | "textarea" | "file" | "checkbox" | "email";
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
}

interface DynamicFormRendererProps {
  fields: FormField[];
  formData: Record<string, any>;
  onChange: (fieldId: string, value: any) => void;
  onFileUpload?: (fieldId: string, file: File) => Promise<void>;
  errors?: Record<string, string>;
  disabled?: boolean;
}

export function DynamicFormRenderer({
  fields,
  formData,
  onChange,
  onFileUpload,
  errors = {},
  disabled = false,
}: DynamicFormRendererProps) {
  const [fileUploading, setFileUploading] = useState<Record<string, boolean>>({});

  const validateField = (field: FormField, value: any): string | null => {
    if (field.required && !value) {
      return `${field.label} is required`;
    }

    if (field.validation) {
      const { min, max, pattern, message } = field.validation;

      if (field.type === "number" && value !== undefined && value !== "") {
        const numValue = Number(value);
        if (min !== undefined && numValue < min) {
          return message || `Minimum value is ${min}`;
        }
        if (max !== undefined && numValue > max) {
          return message || `Maximum value is ${max}`;
        }
      }

      if (field.type === "text" && pattern && value) {
        const regex = new RegExp(pattern);
        if (!regex.test(value)) {
          return message || `Invalid format`;
        }
      }
    }

    return null;
  };

  const handleFileChange = async (fieldId: string, file: File | null) => {
    if (!file || !onFileUpload) return;

    setFileUploading({ ...fileUploading, [fieldId]: true });
    try {
      await onFileUpload(fieldId, file);
    } finally {
      setFileUploading({ ...fileUploading, [fieldId]: false });
    }
  };

  const renderField = (field: FormField) => {
    const value = formData[field.id];
    const error = errors[field.id];
    const isDisabled = disabled || fileUploading[field.id];

    switch (field.type) {
      case "text":
      case "email":
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={field.id}
              type={field.type}
              value={value || ""}
              onChange={(e) => onChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              disabled={isDisabled}
              className={error ? "border-destructive" : ""}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        );

      case "number":
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={field.id}
              type="number"
              value={value || ""}
              onChange={(e) => onChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              min={field.validation?.min}
              max={field.validation?.max}
              disabled={isDisabled}
              className={error ? "border-destructive" : ""}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        );

      case "date":
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={field.id}
              type="date"
              value={value || ""}
              onChange={(e) => onChange(field.id, e.target.value)}
              disabled={isDisabled}
              className={error ? "border-destructive" : ""}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        );

      case "textarea":
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Textarea
              id={field.id}
              value={value || ""}
              onChange={(e) => onChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              disabled={isDisabled}
              rows={4}
              className={error ? "border-destructive" : ""}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        );

      case "dropdown":
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Select
              value={value || ""}
              onValueChange={(val) => onChange(field.id, val)}
              disabled={isDisabled}
            >
              <SelectTrigger className={error ? "border-destructive" : ""}>
                <SelectValue placeholder={field.placeholder || "Select an option"} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        );

      case "checkbox":
        return (
          <div key={field.id} className="flex items-center space-x-2">
            <Checkbox
              id={field.id}
              checked={value || false}
              onCheckedChange={(checked) => onChange(field.id, checked)}
              disabled={isDisabled}
            />
            <Label htmlFor={field.id} className="font-normal">
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            {error && <p className="text-sm text-destructive ml-6">{error}</p>}
          </div>
        );

      case "file":
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id={field.id}
                type="file"
                onChange={(e) => handleFileChange(field.id, e.target.files?.[0] || null)}
                disabled={isDisabled}
                className={error ? "border-destructive" : ""}
              />
              {fileUploading[field.id] && (
                <span className="text-sm text-muted-foreground">Uploading...</span>
              )}
            </div>
            {value && (
              <p className="text-sm text-muted-foreground">
                Current file: {typeof value === "string" ? value : value.name}
              </p>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {fields.map((field) => renderField(field))}
    </div>
  );
}
