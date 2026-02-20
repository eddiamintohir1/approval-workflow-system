import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Plus, Edit, Trash2, Eye, Search, CheckCircle, Upload, Mail, EyeIcon, Home } from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export default function TemplateList() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<any | null>(null);

  const { data: templates, isLoading, refetch } = trpc.templates.getAll.useQuery();
  const deleteTemplate = trpc.templates.delete.useMutation();

  const filteredTemplates = templates?.filter((template) =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.workflowType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async () => {
    if (!templateToDelete) return;

    try {
      await deleteTemplate.mutateAsync({ id: templateToDelete });
      toast.success("Template deleted successfully");
      refetch();
      setDeleteDialogOpen(false);
      setTemplateToDelete(null);
    } catch (error) {
      toast.error("Failed to delete template");
      console.error(error);
    }
  };

  const openDeleteDialog = (templateId: string) => {
    setTemplateToDelete(templateId);
    setDeleteDialogOpen(true);
  };

  const handlePreview = async (templateId: string) => {
    try {
      const template = await trpc.templates.getById.query({ id: templateId });
      setPreviewTemplate(template);
    } catch (error) {
      toast.error("Failed to load template preview");
    }
  };

  if (isLoading) {
    return (
      <div className="container py-6">
        <div className="text-center">Loading templates...</div>
      </div>
    );
  }

  return (
    <div className="container py-6">
      <Link href="/">
        <Button variant="outline" size="sm" className="mb-4">
          <Home className="h-4 w-4 mr-2" />
          Home
        </Button>
      </Link>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Workflow Templates</h1>
          <p className="text-muted-foreground">
            Manage reusable workflow templates for different approval flows
          </p>
        </div>
        <Link href="/templates/builder">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Template
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates by name or type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Templates Grid */}
      {!filteredTemplates || filteredTemplates.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              {searchQuery ? "No templates found matching your search" : "No templates created yet"}
            </p>
            <Link href="/templates/builder">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Template
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {template.description || "No description"}
                    </CardDescription>
                  </div>
                  {template.isDefault && (
                    <Badge variant="default" className="ml-2">
                      Default
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline">{template.workflowType}</Badge>
                  {!template.isActive && (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground">
                    Created {new Date(template.createdAt).toLocaleDateString()}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handlePreview(template.id)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Preview
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/templates/builder?id=${template.id}`)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openDeleteDialog(template.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this template? This action cannot be undone.
              Any workflows using this template will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Template Preview Dialog */}
      {previewTemplate && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewTemplate(null)}
        >
          <div
            className="bg-background rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-background border-b p-6 z-10">
              <h3 className="text-lg font-semibold">{previewTemplate.name}</h3>
              <p className="text-sm text-muted-foreground">{previewTemplate.description}</p>
              <div className="flex gap-2 mt-2">
                <Badge variant="outline">{previewTemplate.workflowType}</Badge>
                <Badge variant="secondary">{previewTemplate.stages?.length || 0} Stages</Badge>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {previewTemplate.stages?.map((stage: any, index: number) => (
                <div key={stage.id}>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold mb-1">{stage.stageName}</h4>
                          {stage.stageDescription && (
                            <p className="text-sm text-muted-foreground mb-2">{stage.stageDescription}</p>
                          )}
                          
                          <div className="flex flex-wrap gap-2 mb-2">
                            {stage.department && (
                              <Badge variant="secondary">{stage.department}</Badge>
                            )}
                            {stage.requiredRole && (
                              <Badge variant="secondary">Role: {stage.requiredRole}</Badge>
                            )}
                            {stage.requiresOneOf && stage.requiresOneOf.length > 0 && (
                              <Badge variant="secondary">
                                One of: {stage.requiresOneOf.join(", ")}
                              </Badge>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-2">
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
                                <EyeIcon className="h-3 w-3 mr-1" />
                                Visible to: {stage.visibleToDepartments.join(", ")}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  {index < (previewTemplate.stages?.length || 0) - 1 && (
                    <div className="flex justify-center py-2">
                      <div className="w-0.5 h-6 bg-border"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="sticky bottom-0 bg-background border-t p-6">
              <Button onClick={() => setPreviewTemplate(null)} className="w-full">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
