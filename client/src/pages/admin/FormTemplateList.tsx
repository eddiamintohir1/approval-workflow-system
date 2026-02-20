import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function FormTemplateList() {
  const { data: templates, isLoading, refetch } = trpc.formTemplates.getAll.useQuery();
  
  const deleteTemplate = trpc.formTemplates.delete.useMutation({
    onSuccess: () => {
      toast.success("Template deleted successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      deleteTemplate.mutate({ id });
    }
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex justify-center items-center h-64">
          <p className="text-muted-foreground">Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Form Templates</h1>
          <p className="text-muted-foreground mt-2">
            Manage custom form templates for workflows
          </p>
        </div>
        <Link href="/admin/form-templates/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Template
          </Button>
        </Link>
      </div>

      {!templates || templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No form templates yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first form template to get started
            </p>
            <Link href="/admin/form-templates/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {templates.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{template.templateName}</CardTitle>
                    <CardDescription className="mt-2">
                      Code: <span className="font-mono">{template.templateCode}</span>
                    </CardDescription>
                    {template.description && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {template.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={template.isActive ? "default" : "secondary"}>
                      {template.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(template.id, template.templateName)}
                      disabled={deleteTemplate.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{template.fields.length} fields</span>
                  <span>•</span>
                  <span>Version {template.version}</span>
                  <span>•</span>
                  <span>Created {new Date(template.createdAt).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
