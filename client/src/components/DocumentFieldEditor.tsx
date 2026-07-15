import { useState } from "react";
import { Loader2, Plus, Trash2, Upload, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import type { DocumentField } from "@shared/documentFieldMapping";
import { generateFieldId, sanitizeFieldName } from "@shared/documentFieldMapping";

interface DocumentFieldEditorProps {
  formTemplateId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

interface DraftField extends Omit<DocumentField, "id"> {
  id?: string;
}

const emptyField = (): DraftField => ({
  name: "",
  label: "",
  type: "text",
  required: false,
  placeholder: "",
});

export function DocumentFieldEditor({
  formTemplateId,
  open,
  onOpenChange,
  onSaved,
}: DocumentFieldEditorProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentName, setDocumentName] = useState("");
  const [fields, setFields] = useState<DraftField[]>([]);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [draftField, setDraftField] = useState<DraftField>(emptyField());
  const [isUploading, setIsUploading] = useState(false);

  const uploadMutation = trpc.formTemplates.uploadDocument.useMutation({
    onSuccess: () => {
      toast.success("Document uploaded successfully");
      resetForm();
      onSaved();
      onOpenChange(false);
    },
    onError: (error) => toast.error(error.message),
  });

  const resetForm = () => {
    setSelectedFile(null);
    setDocumentName("");
    setFields([]);
    setEditingFieldId(null);
    setDraftField(emptyField());
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const isValidType = file.name.toLowerCase().endsWith(".pdf") || 
                         file.name.toLowerCase().endsWith(".xlsx");
      if (!isValidType) {
        toast.error("Please select a PDF or Excel file");
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        toast.error("File must be 50 MB or smaller");
        return;
      }
      setSelectedFile(file);
      if (!documentName) {
        setDocumentName(file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const addOrUpdateField = () => {
    if (!draftField.name || !draftField.label) {
      toast.error("Field name and label are required");
      return;
    }

    const newField: DocumentField = {
      id: editingFieldId || generateFieldId(),
      name: sanitizeFieldName(draftField.name),
      label: draftField.label,
      type: draftField.type,
      required: draftField.required,
      placeholder: draftField.placeholder || undefined,
      validation: draftField.validation,
      position: draftField.position,
    };

    if (editingFieldId) {
      setFields(fields.map(f => f.id === editingFieldId ? newField : f));
      toast.success("Field updated");
    } else {
      setFields([...fields, newField]);
      toast.success("Field added");
    }

    setEditingFieldId(null);
    setDraftField(emptyField());
  };

  const removeField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
    if (editingFieldId === id) {
      setEditingFieldId(null);
      setDraftField(emptyField());
    }
  };

  const editField = (field: DocumentField) => {
    setEditingFieldId(field.id);
    setDraftField(field);
  };

  const handleUpload = async () => {
    if (!selectedFile || !documentName || fields.length === 0) {
      toast.error("Please select a file, enter a name, and add at least one field");
      return;
    }

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        const base64Data = base64.split(",")[1];

        uploadMutation.mutate({
          formTemplateId,
          documentName,
          filename: selectedFile.name,
          fileData: base64Data,
          fileSize: selectedFile.size,
          fields: fields as DocumentField[],
        });
      };
      reader.readAsDataURL(selectedFile);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Upload Document Template</DialogTitle>
          <DialogDescription className="text-base">
            Upload a PDF or Excel file and define fillable fields for users to complete
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Upload Section */}
          <Card className="border-2 border-dashed">
            <CardHeader>
              <CardTitle className="text-lg">Document File</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="doc-file" className="text-base font-semibold">
                  Upload PDF or Excel *
                </Label>
                <Input
                  id="doc-file"
                  type="file"
                  accept=".pdf,.xlsx,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  onChange={handleFileSelect}
                  className="mt-2 text-base"
                />
                {selectedFile && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="doc-name" className="text-base font-semibold">
                  Document Name *
                </Label>
                <Input
                  id="doc-name"
                  placeholder="e.g., MAF Form, PR Template"
                  value={documentName}
                  onChange={(e) => setDocumentName(e.target.value)}
                  className="mt-2 text-base"
                />
              </div>
            </CardContent>
          </Card>

          {/* Field Definition Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Fillable Fields</CardTitle>
              <CardDescription className="text-base">
                Define which fields users must fill before submission
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Field Editor Form */}
              <div className="grid gap-4 p-4 bg-muted/50 rounded-lg border">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="field-name" className="text-base font-semibold">
                      Field Name *
                    </Label>
                    <Input
                      id="field-name"
                      placeholder="e.g., applicant_name"
                      value={draftField.name}
                      onChange={(e) => setDraftField({ ...draftField, name: e.target.value })}
                      className="mt-2 text-base"
                    />
                  </div>
                  <div>
                    <Label htmlFor="field-label" className="text-base font-semibold">
                      Display Label *
                    </Label>
                    <Input
                      id="field-label"
                      placeholder="e.g., Applicant Name"
                      value={draftField.label}
                      onChange={(e) => setDraftField({ ...draftField, label: e.target.value })}
                      className="mt-2 text-base"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="field-type" className="text-base font-semibold">
                      Field Type
                    </Label>
                    <Select
                      value={draftField.type}
                      onValueChange={(type: any) => setDraftField({ ...draftField, type })}
                    >
                      <SelectTrigger className="mt-2 text-base">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="number">Number</SelectItem>
                        <SelectItem value="date">Date</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="signature">Signature</SelectItem>
                        <SelectItem value="checkbox">Checkbox</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="field-required"
                        checked={draftField.required}
                        onCheckedChange={(checked) =>
                          setDraftField({ ...draftField, required: Boolean(checked) })
                        }
                      />
                      <Label htmlFor="field-required" className="text-base font-semibold cursor-pointer">
                        Required
                      </Label>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="field-placeholder" className="text-base font-semibold">
                    Placeholder Text
                  </Label>
                  <Input
                    id="field-placeholder"
                    placeholder="Optional placeholder text"
                    value={draftField.placeholder || ""}
                    onChange={(e) => setDraftField({ ...draftField, placeholder: e.target.value })}
                    className="mt-2 text-base"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={addOrUpdateField}
                    className="text-base font-semibold py-2 h-auto"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {editingFieldId ? "Update Field" : "Add Field"}
                  </Button>
                  {editingFieldId && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditingFieldId(null);
                        setDraftField(emptyField());
                      }}
                      className="text-base"
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>

              {/* Fields List */}
              {fields.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-base">Added Fields ({fields.length})</h4>
                  <div className="space-y-2">
                    {fields.map((field) => (
                      <div
                        key={field.id}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          editingFieldId === field.id ? "bg-blue-50 border-blue-300" : "bg-muted"
                        }`}
                      >
                        <div className="flex-1">
                          <p className="font-medium text-base">{field.label}</p>
                          <p className="text-sm text-muted-foreground">
                            {field.type} {field.required && "• Required"}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => editField(field as DocumentField)}
                            className="text-base"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeField(field.id!)}
                            className="text-base text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              resetForm();
              onOpenChange(false);
            }}
            className="text-base"
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={isUploading || uploadMutation.isPending}
            className="text-base font-semibold py-2 h-auto"
          >
            {isUploading || uploadMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
