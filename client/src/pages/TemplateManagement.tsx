import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Loader2, Upload, Download, Trash2, FileText } from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { useUserRole } from "@/hooks/useUserRole";
import { useLocation } from "wouter";

export default function TemplateManagement() {
  const { user } = useUserRole();
  const [, setLocation] = useLocation();
  const isAdmin = user?.role === "admin" || user?.role === "director";
  const [uploadingType, setUploadingType] = useState<"MAF" | "PR" | "CATTO" | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();

  const { data: templates, isLoading } = trpc.downloadableTemplates.list.useQuery();

  const uploadMutation = trpc.downloadableTemplates.upload.useMutation({
    onSuccess: () => {
      toast.success("Template uploaded successfully");
      utils.downloadableTemplates.list.invalidate();
      setUploadingType(null);
    },
    onError: (error) => {
      toast.error(`Failed to upload template: ${error.message}`);
      setUploadingType(null);
    },
  });

  const downloadMutation = trpc.downloadableTemplates.download.useMutation({
    onSuccess: (data) => {
      window.open(data.url, "_blank");
      toast.success("Template downloaded successfully");
    },
    onError: (error) => {
      toast.error(`Failed to download template: ${error.message}`);
    },
  });

  const deleteMutation = trpc.downloadableTemplates.delete.useMutation({
    onSuccess: () => {
      toast.success("Template deleted successfully");
      utils.downloadableTemplates.list.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to delete template: ${error.message}`);
    },
  });

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !uploadingType) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64Data = e.target?.result as string;
      const base64Content = base64Data.split(",")[1];

      uploadMutation.mutate({
        name: file.name,
        type: uploadingType,
        fileName: file.name,
        fileType: file.type,
        fileData: base64Content,
      });
    };
    reader.readAsDataURL(file);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerFileUpload = (type: "MAF" | "PR" | "CATTO") => {
    setUploadingType(type);
    fileInputRef.current?.click();
  };

  if (!user) {
    setLocation("/login");
    return null;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You don't have permission to access this page.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const getTemplateByType = (type: "MAF" | "PR" | "CATTO") => {
    return templates?.find((t) => t.type === type);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold">Form Template Management</h1>
          <p className="text-muted-foreground mt-1">
            Upload and manage downloadable form templates (MAF, PR, CATTO)
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".xlsx,.xls,.pdf,.doc,.docx"
          onChange={handleFileSelect}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(["MAF", "PR", "CATTO"] as const).map((type) => {
            const template = getTemplateByType(type);
            const isUploading = uploadingType === type && uploadMutation.isPending;

            return (
              <Card key={type}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {type} Template
                  </CardTitle>
                  <CardDescription>
                    {template ? "Template uploaded" : "No template uploaded"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {template && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium truncate">{template.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Uploaded: {new Date(template.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  )}

                  <div className="flex flex-col gap-2">
                    <Button
                      variant="default"
                      onClick={() => triggerFileUpload(type)}
                      disabled={isUploading}
                      className="w-full"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          {template ? "Replace Template" : "Upload Template"}
                        </>
                      )}
                    </Button>

                    {template && (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => downloadMutation.mutate({ type })}
                          disabled={downloadMutation.isPending}
                          className="w-full"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>

                        <Button
                          variant="destructive"
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete the ${type} template?`)) {
                              deleteMutation.mutate({ type });
                            }
                          }}
                          disabled={deleteMutation.isPending}
                          className="w-full"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• Upload blank form templates that users can download before filling them out</p>
            <p>• Supported formats: Excel (.xlsx, .xls), PDF (.pdf), Word (.doc, .docx)</p>
            <p>• Each template type (MAF, PR, CATTO) can only have one active template</p>
            <p>• Uploading a new template will replace the existing one</p>
            <p>• Users can download these templates from the project details page</p>
          </CardContent>
        </Card>

        {/* Copyright Footer */}
        <footer className="mt-12 pt-6 border-t text-center text-sm text-muted-foreground">
          © Eddie Amintohir. All rights reserved.
        </footer>
      </main>
    </div>
  );
}
