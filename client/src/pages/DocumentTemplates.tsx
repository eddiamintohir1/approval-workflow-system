import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus, Upload, Pencil, Trash2, Download } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function DocumentTemplates() {
  const { t } = useTranslation();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [templateCategory, setTemplateCategory] = useState("");
  const [uploading, setUploading] = useState(false);

  const { data: templates, refetch } = trpc.documentTemplates.getAll.useQuery();
  const createTemplate = trpc.documentTemplates.create.useMutation();
  const deleteTemplate = trpc.documentTemplates.delete.useMutation();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (!templateName) {
        setTemplateName(selectedFile.name);
      }
    }
  };

  const handleCreateTemplate = async () => {
    if (!file || !templateName) {
      alert("Please provide template name and file");
      return;
    }

    try {
      setUploading(true);

      // Upload file to S3
      const formData = new FormData();
      formData.append("file", file);
      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const { url } = await uploadResponse.json();

      // Create template
      await createTemplate.mutateAsync({
        name: templateName,
        description: templateDescription,
        category: templateCategory,
        fileUrl: url,
        fileType: file.name.split('.').pop() || 'pdf',
      });

      // Reset form
      setFile(null);
      setTemplateName("");
      setTemplateDescription("");
      setTemplateCategory("");
      setIsCreateDialogOpen(false);
      refetch();
    } catch (error: any) {
      console.error("Error creating template:", error);
      alert(`Failed to create template: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) {
      return;
    }

    try {
      await deleteTemplate.mutateAsync({ id });
      refetch();
    } catch (error: any) {
      console.error("Error deleting template:", error);
      alert(`Failed to delete template: ${error.message}`);
    }
  };

  const getCategoryBadge = (category?: string) => {
    if (!category) return null;
    
    const colors: Record<string, string> = {
      Contract: "bg-blue-100 text-blue-700",
      NDA: "bg-purple-100 text-purple-700",
      Invoice: "bg-green-100 text-green-700",
      Agreement: "bg-orange-100 text-orange-700",
    };

    return (
      <Badge className={colors[category] || "bg-gray-100 text-gray-700"}>
        {category}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Document Templates</h1>
            <p className="text-muted-foreground">Manage reusable document templates for e-signature</p>
          </div>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Create New Template</DialogTitle>
              <DialogDescription>
                Upload a document template that can be reused for e-signature requests
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="template-file">Template File</Label>
                <Input
                  id="template-file"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  disabled={uploading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="template-name">Template Name</Label>
                <Input
                  id="template-name"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="e.g., Standard NDA"
                  disabled={uploading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="template-category">Category (Optional)</Label>
                <Input
                  id="template-category"
                  value={templateCategory}
                  onChange={(e) => setTemplateCategory(e.target.value)}
                  placeholder="e.g., Contract, NDA, Invoice"
                  disabled={uploading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="template-description">Description (Optional)</Label>
                <Textarea
                  id="template-description"
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  placeholder="Brief description of this template..."
                  rows={3}
                  disabled={uploading}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={uploading}>
                Cancel
              </Button>
              <Button onClick={handleCreateTemplate} disabled={uploading || !file || !templateName}>
                {uploading ? (
                  <>
                    <Upload className="mr-2 h-4 w-4 animate-pulse" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Template
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Template Library</CardTitle>
          <CardDescription>
            {templates?.length || 0} templates available
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Template Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>File Type</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!templates || templates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No templates found. Create your first template to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  templates.map((template: any) => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">{template.name}</TableCell>
                      <TableCell>{getCategoryBadge(template.category)}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {template.description || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{template.fileType.toUpperCase()}</Badge>
                      </TableCell>
                      <TableCell>{new Date(template.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(template.s3Url, "_blank")}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteTemplate(template.id)}
                            disabled={deleteTemplate.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
