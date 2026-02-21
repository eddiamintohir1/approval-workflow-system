import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Upload, Users, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface TemplatePreviewProps {
  templateId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TemplatePreview({ templateId, open, onOpenChange }: TemplatePreviewProps) {
  const { data: template, isLoading } = trpc.templates.getById.useQuery(
    { id: templateId },
    { enabled: open && !!templateId }
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-muted-foreground">Loading template...</p>
            </div>
          </div>
        ) : template ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl">
                {template.name}
                <Badge className="ml-3" variant="outline">
                  {template.workflowType}
                </Badge>
              </DialogTitle>
              {template.description && (
                <p className="text-sm text-muted-foreground mt-2">{template.description}</p>
              )}
            </DialogHeader>

        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4">Approval Stages</h3>
          
          {/* Vertical Timeline */}
          <div className="relative space-y-4">
            {/* Connecting line */}
            <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-border" />

            {template.stages?.map((stage, index) => (
              <div key={stage.id} className="relative">
                {/* Stage number circle */}
                <div className="absolute left-0 top-0 flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold z-10">
                  {stage.stageOrder}
                </div>

                {/* Stage card */}
                <Card className="ml-16">
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      {/* Stage name and role */}
                      <div>
                        <h4 className="font-semibold text-lg">{stage.stageName}</h4>
                        {stage.stageDescription && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {stage.stageDescription}
                          </p>
                        )}
                      </div>

                      {/* Stage details */}
                      <div className="flex flex-wrap gap-2">
                        {stage.requiredRole && (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {stage.requiredRole}
                          </Badge>
                        )}
                        
                        {stage.department && (
                          <Badge variant="outline">
                            {stage.department}
                          </Badge>
                        )}

                        {stage.approvalRequired && (
                          <Badge variant="default" className="flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Approval Required
                          </Badge>
                        )}

                        {stage.fileUploadRequired && (
                          <Badge variant="default" className="flex items-center gap-1 bg-blue-500">
                            <Upload className="h-3 w-3" />
                            File Upload Required
                          </Badge>
                        )}
                      </div>

                      {/* Additional info */}
                      {stage.requiresOneOf && stage.requiresOneOf.length > 0 && (
                        <div className="text-sm text-muted-foreground flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>
                            Requires approval from one of: {stage.requiresOneOf.join(", ")}
                          </span>
                        </div>
                      )}

                      {stage.visibleToDepartments && stage.visibleToDepartments.length > 0 && (
                        <div className="text-sm text-muted-foreground">
                          <span className="font-medium">Visible to:</span>{" "}
                          {stage.visibleToDepartments.join(", ")}
                        </div>
                      )}

                      {stage.notificationEmails && stage.notificationEmails.length > 0 && (
                        <div className="text-sm text-muted-foreground">
                          <span className="font-medium">Notifications:</span>{" "}
                          {stage.notificationEmails.length} recipient(s)
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>

          {/* Summary footer */}
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Total Stages:</strong> {template.stages?.length || 0}
              {" • "}
              <strong>Workflow Type:</strong> {template.workflowType}
              {template.isDefault && (
                <>
                  {" • "}
                  <Badge variant="default" className="ml-1">Default Template</Badge>
                </>
              )}
            </p>
          </div>
        </div>
          </>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            Template not found
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
