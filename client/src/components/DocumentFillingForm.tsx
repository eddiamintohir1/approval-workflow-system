import { useState, useEffect } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { DocumentField, FormSubmissionDocument } from "@shared/documentFieldMapping";
import { validateFormSubmissionDocument } from "@shared/documentFieldMapping";

interface DocumentFillingFormProps {
  submissionId: string;
  templateDocumentId: string;
  fields: DocumentField[];
  onComplete: (data: Record<string, any>) => void;
  isSubmitting?: boolean;
}

export function DocumentFillingForm({
  submissionId,
  templateDocumentId,
  fields,
  onComplete,
  isSubmitting = false,
}: DocumentFillingFormProps) {
  const [filledData, setFilledData] = useState<Record<string, any>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isValidating, setIsValidating] = useState(false);

  // Initialize with empty values
  useEffect(() => {
    const initial: Record<string, any> = {};
    fields.forEach((field) => {
      initial[field.id] = "";
    });
    setFilledData(initial);
  }, [fields]);

  const handleFieldChange = (fieldId: string, value: any) => {
    setFilledData((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
    // Clear error for this field when user starts typing
    if (validationErrors[fieldId]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };

  const handleValidateAndSubmit = async () => {
    setIsValidating(true);
    try {
      // Validate all fields
      const validation = validateFormSubmissionDocument(fields, filledData);

      if (!validation.isValid) {
        const errorMap: Record<string, string> = {};
        validation.errors.forEach((error) => {
          errorMap[error.fieldId] = error.message;
        });
        setValidationErrors(errorMap);
        toast.error(`Please fix ${validation.errors.length} error(s)`);
        return;
      }

      setValidationErrors({});
      onComplete(filledData);
    } finally {
      setIsValidating(false);
    }
  };

  const requiredFields = fields.filter((f) => f.required);
  const completedFields = requiredFields.filter((f) => filledData[f.id]);
  const completionPercentage = Math.round(
    (completedFields.length / Math.max(requiredFields.length, 1)) * 100
  );

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      {requiredFields.length > 0 && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-blue-600" />
              Document Completion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-base font-semibold">
                  {completedFields.length} of {requiredFields.length} required fields completed
                </span>
                <span className="text-lg font-bold text-blue-600">{completionPercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form Fields */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Fill Document Fields</CardTitle>
          <CardDescription className="text-base">
            Fields marked with <span className="text-red-600 font-bold">*</span> are required
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {fields.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-base">
                No fields defined for this document
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-6">
              {fields.map((field) => {
                const hasError = Boolean(validationErrors[field.id]);
                const value = filledData[field.id] || "";

                return (
                  <div key={field.id} className="space-y-2">
                    <Label className="text-base font-semibold flex items-center gap-1">
                      {field.label}
                      {field.required && <span className="text-red-600">*</span>}
                    </Label>

                    {field.type === "checkbox" ? (
                      <div className="flex items-center space-x-2 mt-2">
                        <Checkbox
                          id={field.id}
                          checked={Boolean(value)}
                          onCheckedChange={(checked) =>
                            handleFieldChange(field.id, checked)
                          }
                          className="w-5 h-5"
                        />
                        <Label htmlFor={field.id} className="text-base cursor-pointer">
                          {field.placeholder || "Check this box"}
                        </Label>
                      </div>
                    ) : field.type === "date" ? (
                      <Input
                        type="date"
                        value={value}
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                        className={`text-base py-2 h-auto ${
                          hasError ? "border-red-500 focus:ring-red-500" : ""
                        }`}
                      />
                    ) : field.type === "signature" ? (
                      <div className="border-2 border-dashed rounded-lg p-4 bg-gray-50">
                        <Input
                          type="text"
                          placeholder="Type your signature or upload image"
                          value={value}
                          onChange={(e) => handleFieldChange(field.id, e.target.value)}
                          className={`text-base py-2 h-auto ${
                            hasError ? "border-red-500 focus:ring-red-500" : ""
                          }`}
                        />
                      </div>
                    ) : (
                      <Input
                        type={field.type === "number" ? "number" : field.type === "email" ? "email" : "text"}\n                        placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}\n                        value={value}\n                        onChange={(e) => handleFieldChange(field.id, e.target.value)}\n                        className={`text-base py-2 h-auto ${\n                          hasError ? \"border-red-500 focus:ring-red-500\" : \"\"\n                        }`}\n                      />\n                    )}\n\n                    {hasError && (\n                      <p className=\"text-red-600 text-sm font-semibold flex items-center gap-1\">\n                        <AlertCircle className=\"h-4 w-4\" />\n                        {validationErrors[field.id]}\n                      </p>\n                    )}\n                  </div>\n                );\n              })}\n            </div>\n          )}\n        </CardContent>\n      </Card>\n\n      {/* Submit Button */}\n      <Button\n        onClick={handleValidateAndSubmit}\n        disabled={isValidating || isSubmitting || fields.length === 0}\n        className=\"w-full text-base font-semibold py-3 h-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700\"\n      >\n        {isValidating || isSubmitting ? (\n          <>\n            <Loader2 className=\"h-4 w-4 mr-2 animate-spin\" />\n            Validating and Submitting...\n          </>\n        ) : (\n          <>Complete Document and Continue</>\n        )}\n      </Button>\n    </div>\n  );\n}\n
