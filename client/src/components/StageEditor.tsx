import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface TemplateStage {
  id: string;
  stageOrder: number;
  stageName: string;
  stageDescription?: string;
  department?: string;
  requiredRole?: string;
  requiresOneOf?: string[];
  approvalRequired: boolean;
  fileUploadRequired: boolean;
  notificationEmails?: string[];
  visibleToDepartments?: string[];
  approvalThreshold?: number;
}

interface StageEditorProps {
  stage: TemplateStage;
  onSave: (stage: TemplateStage) => void;
  onCancel: () => void;
}

const DEPARTMENTS = [
  "Finance",
  "PPIC",
  "Purchasing",
  "GA",
  "Production",
  "Logistics",
  "Sales",
  "Marketing",
  "HR",
  "IT",
  "Operations",
];

const ROLES = [
  "CEO",
  "COO",
  "CFO",
  "Finance",
  "PPIC",
  "Purchasing",
  "GA",
  "Production",
  "Logistics",
  "admin",
];

export function StageEditor({ stage, onSave, onCancel }: StageEditorProps) {
  const [formData, setFormData] = useState<TemplateStage>(stage);
  const [emailInput, setEmailInput] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>(stage.requiresOneOf || []);
  const [selectedVisibleDepts, setSelectedVisibleDepts] = useState<string[]>(
    stage.visibleToDepartments || []
  );

  const handleSave = () => {
    if (!formData.stageName.trim()) {
      alert("Please enter a stage name");
      return;
    }
    onSave({
      ...formData,
      requiresOneOf: selectedRoles.length > 0 ? selectedRoles : undefined,
      visibleToDepartments: selectedVisibleDepts.length > 0 ? selectedVisibleDepts : undefined,
    });
  };

  const handleAddEmail = () => {
    if (emailInput.trim() && emailInput.includes("@")) {
      setFormData({
        ...formData,
        notificationEmails: [...(formData.notificationEmails || []), emailInput.trim()],
      });
      setEmailInput("");
    }
  };

  const handleRemoveEmail = (email: string) => {
    setFormData({
      ...formData,
      notificationEmails: formData.notificationEmails?.filter((e) => e !== email),
    });
  };

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const toggleVisibleDept = (dept: string) => {
    setSelectedVisibleDepts((prev) =>
      prev.includes(dept) ? prev.filter((d) => d !== dept) : [...prev, dept]
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-background border-b p-6 z-10">
          <h3 className="text-lg font-semibold">Configure Stage {formData.stageOrder}</h3>
          <p className="text-sm text-muted-foreground">
            Set up approval requirements and conditions for this stage
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h4 className="font-medium">Basic Information</h4>
            
            <div>
              <Label htmlFor="stageName">Stage Name *</Label>
              <Input
                id="stageName"
                placeholder="e.g., CEO/COO Approval, PPIC Review"
                value={formData.stageName}
                onChange={(e) => setFormData({ ...formData, stageName: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="stageDescription">Description</Label>
              <Textarea
                id="stageDescription"
                placeholder="Describe what happens in this stage..."
                value={formData.stageDescription || ""}
                onChange={(e) => setFormData({ ...formData, stageDescription: e.target.value })}
                rows={2}
              />
            </div>
          </div>

          {/* Department & Role Assignment */}
          <div className="space-y-4">
            <h4 className="font-medium">Who Performs This Stage?</h4>

            <div>
              <Label htmlFor="department">Department</Label>
              <Select
                value={formData.department || ""}
                onValueChange={(value) => setFormData({ ...formData, department: value })}
              >
                <SelectTrigger id="department">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="requiredRole">Required Role (Single)</Label>
              <Select
                value={formData.requiredRole || ""}
                onValueChange={(value) => setFormData({ ...formData, requiredRole: value })}
              >
                <SelectTrigger id="requiredRole">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Or use "One of Multiple Roles" below for flexible assignment
              </p>
            </div>

            <div>
              <Label>One of Multiple Roles (e.g., CEO or COO)</Label>
              <div className="flex flex-wrap gap-2 mt-2 mb-2">
                {selectedRoles.map((role) => (
                  <Badge key={role} variant="secondary">
                    {role}
                    <button
                      onClick={() => toggleRole(role)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {ROLES.filter((r) => !selectedRoles.includes(r)).map((role) => (
                  <Button
                    key={role}
                    size="sm"
                    variant="outline"
                    onClick={() => toggleRole(role)}
                  >
                    + {role}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Stage Visibility */}
          <div className="space-y-4">
            <h4 className="font-medium">Stage Visibility</h4>
            <Label>Which departments can see this stage?</Label>
            <div className="flex flex-wrap gap-2 mt-2 mb-2">
              {selectedVisibleDepts.map((dept) => (
                <Badge key={dept} variant="default">
                  {dept}
                  <button
                    onClick={() => toggleVisibleDept(dept)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {DEPARTMENTS.filter((d) => !selectedVisibleDepts.includes(d)).map((dept) => (
                <Button
                  key={dept}
                  size="sm"
                  variant="outline"
                  onClick={() => toggleVisibleDept(dept)}
                >
                  + {dept}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Leave empty to make visible to all departments
            </p>
          </div>

          {/* Conditions */}
          <div className="space-y-4">
            <h4 className="font-medium">Stage Conditions</h4>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="approvalRequired"
                checked={formData.approvalRequired}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, approvalRequired: checked as boolean })
                }
              />
              <Label htmlFor="approvalRequired" className="cursor-pointer">
                Approval Required
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="fileUploadRequired"
                checked={formData.fileUploadRequired}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, fileUploadRequired: checked as boolean })
                }
              />
              <Label htmlFor="fileUploadRequired" className="cursor-pointer">
                File Upload Required
              </Label>
            </div>

            <div>
              <Label htmlFor="approvalThreshold">Approval Threshold (Amount)</Label>
              <Input
                id="approvalThreshold"
                type="number"
                placeholder="e.g., 10000000"
                value={formData.approvalThreshold || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    approvalThreshold: e.target.value ? parseFloat(e.target.value) : undefined,
                  })
                }
              />
              <p className="text-xs text-muted-foreground mt-1">
                Only require this stage if workflow amount exceeds this threshold
              </p>
            </div>
          </div>

          {/* Email Notifications */}
          <div className="space-y-4">
            <h4 className="font-medium">Email Notifications</h4>
            <Label>Notify these emails when stage starts</Label>
            
            <div className="flex gap-2">
              <Input
                placeholder="email@example.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAddEmail()}
              />
              <Button onClick={handleAddEmail} variant="outline">
                Add
              </Button>
            </div>

            {formData.notificationEmails && formData.notificationEmails.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.notificationEmails.map((email) => (
                  <Badge key={email} variant="secondary">
                    {email}
                    <button
                      onClick={() => handleRemoveEmail(email)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-background border-t p-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Stage</Button>
        </div>
      </div>
    </div>
  );
}
