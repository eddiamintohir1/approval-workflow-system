import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  GripVertical, 
  Plus, 
  Trash2, 
  Edit, 
  CheckCircle, 
  Upload, 
  Mail,
  Eye,
  ArrowLeft,
  Save
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { StageEditor } from "@/components/StageEditor";

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

interface SortableStageProps {
  stage: TemplateStage;
  onEdit: (stage: TemplateStage) => void;
  onDelete: (id: string) => void;
}

function SortableStage({ stage, onEdit, onDelete }: SortableStageProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: stage.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="mb-3">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Drag Handle */}
            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing mt-1">
              <GripVertical className="h-5 w-5 text-muted-foreground" />
            </div>

            {/* Stage Content */}
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="font-mono">
                      Stage {stage.stageOrder}
                    </Badge>
                    <h4 className="font-semibold">{stage.stageName}</h4>
                  </div>
                  
                  {stage.stageDescription && (
                    <p className="text-sm text-muted-foreground mb-2">{stage.stageDescription}</p>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {stage.department && (
                      <Badge variant="secondary">
                        {stage.department}
                      </Badge>
                    )}
                    {stage.requiredRole && (
                      <Badge variant="secondary">
                        Role: {stage.requiredRole}
                      </Badge>
                    )}
                    {stage.requiresOneOf && stage.requiresOneOf.length > 0 && (
                      <Badge variant="secondary">
                        One of: {stage.requiresOneOf.join(", ")}
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 mt-2">
                    {stage.approvalRequired && (
                      <Badge variant="default" className="text-xs">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Approval Required
                      </Badge>
                    )}
                    {stage.fileUploadRequired && (
                      <Badge variant="default" className="text-xs">
                        <Upload className="h-3 w-3 mr-1" />
                        File Upload Required
                      </Badge>
                    )}
                    {stage.notificationEmails && stage.notificationEmails.length > 0 && (
                      <Badge variant="default" className="text-xs">
                        <Mail className="h-3 w-3 mr-1" />
                        Email Notify ({stage.notificationEmails.length})
                      </Badge>
                    )}
                    {stage.visibleToDepartments && stage.visibleToDepartments.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        <Eye className="h-3 w-3 mr-1" />
                        Visible to: {stage.visibleToDepartments.join(", ")}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onEdit(stage)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDelete(stage.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function TemplateBuilder() {
  const [, navigate] = useLocation();
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [workflowType, setWorkflowType] = useState("");
  const [stages, setStages] = useState<TemplateStage[]>([]);
  const [editingStage, setEditingStage] = useState<TemplateStage | null>(null);
  const [showStageEditor, setShowStageEditor] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setStages((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        
        // Update stage orders
        return newItems.map((item, index) => ({
          ...item,
          stageOrder: index + 1,
        }));
      });
    }
  };

  const handleAddStage = () => {
    const newStage: TemplateStage = {
      id: `stage-${Date.now()}`,
      stageOrder: stages.length + 1,
      stageName: `Stage ${stages.length + 1}`,
      approvalRequired: true,
      fileUploadRequired: false,
    };
    setEditingStage(newStage);
    setShowStageEditor(true);
  };

  const handleEditStage = (stage: TemplateStage) => {
    setEditingStage(stage);
    setShowStageEditor(true);
  };

  const handleDeleteStage = (id: string) => {
    setStages((prev) => {
      const filtered = prev.filter((s) => s.id !== id);
      // Reorder remaining stages
      return filtered.map((s, index) => ({
        ...s,
        stageOrder: index + 1,
      }));
    });
    toast.success("Stage deleted");
  };

  const handleSaveStage = (stage: TemplateStage) => {
    setStages((prev) => {
      const existing = prev.find((s) => s.id === stage.id);
      if (existing) {
        return prev.map((s) => (s.id === stage.id ? stage : s));
      } else {
        return [...prev, stage];
      }
    });
    setShowStageEditor(false);
    setEditingStage(null);
    toast.success("Stage saved");
  };

  const createTemplate = trpc.templates.create.useMutation();

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      toast.error("Please enter a template name");
      return;
    }
    if (!workflowType.trim()) {
      toast.error("Please enter a workflow type");
      return;
    }
    if (stages.length === 0) {
      toast.error("Please add at least one stage");
      return;
    }

    try {
      await createTemplate.mutateAsync({
        name: templateName,
        description: templateDescription,
        workflowType,
        stages: stages.map((stage) => ({
          stageOrder: stage.stageOrder,
          stageName: stage.stageName,
          stageDescription: stage.stageDescription,
          department: stage.department,
          requiredRole: stage.requiredRole,
          requiresOneOf: stage.requiresOneOf,
          approvalRequired: stage.approvalRequired,
          fileUploadRequired: stage.fileUploadRequired,
          notificationEmails: stage.notificationEmails,
          visibleToDepartments: stage.visibleToDepartments,
          approvalThreshold: stage.approvalThreshold,
        })),
      });
      toast.success("Template saved successfully");
      navigate("/dashboard");
    } catch (error) {
      toast.error("Failed to save template");
      console.error(error);
    }
  };

  return (
    <div className="container py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/templates">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Workflow Template Builder</h1>
            <p className="text-muted-foreground">
              Create a reusable workflow template with custom stages
            </p>
          </div>
        </div>
        <Button onClick={handleSaveTemplate}>
          <Save className="h-4 w-4 mr-2" />
          Save Template
        </Button>
      </div>

      {/* Template Info */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Template Information</CardTitle>
          <CardDescription>Basic information about this workflow template</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="templateName">Template Name *</Label>
            <Input
              id="templateName"
              placeholder="e.g., Standard MAF Approval Flow"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="workflowType">Workflow Type *</Label>
            <Input
              id="workflowType"
              placeholder="e.g., MAF, PR, Reimbursement, Leave Request"
              value={workflowType}
              onChange={(e) => setWorkflowType(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe when this template should be used..."
              value={templateDescription}
              onChange={(e) => setTemplateDescription(e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Stages */}
      <Card>
        <CardHeader>
          <CardTitle>Approval Stages</CardTitle>
          <CardDescription>
            Drag and drop to reorder stages. Each stage represents an approval step in the workflow.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stages.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground mb-4">No stages added yet</p>
              <Button onClick={handleAddStage}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Stage
              </Button>
            </div>
          ) : (
            <>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={stages.map((s) => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {stages.map((stage) => (
                    <SortableStage
                      key={stage.id}
                      stage={stage}
                      onEdit={handleEditStage}
                      onDelete={handleDeleteStage}
                    />
                  ))}
                </SortableContext>
              </DndContext>

              <Button onClick={handleAddStage} variant="outline" className="w-full mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Add Another Stage
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Stage Editor Modal */}
      {showStageEditor && editingStage && (
        <StageEditor
          stage={editingStage}
          onSave={handleSaveStage}
          onCancel={() => {
            setShowStageEditor(false);
            setEditingStage(null);
          }}
        />
      )}
    </div>
  );
}
