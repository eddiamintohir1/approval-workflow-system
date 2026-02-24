import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, ExternalLink, RefreshCw, Eye, FileSignature, CheckCircle2, Clock, XCircle, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useTranslation } from "react-i18next";

export default function ESignature() {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [documentName, setDocumentName] = useState("");
  const [signerEmail, setSignerEmail] = useState("");
  const [signerName, setSignerName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedDocId, setUploadedDocId] = useState<string | null>(null);
  const [uploadedDocUrl, setUploadedDocUrl] = useState<string | null>(null);
  const [helloDocId, setHelloDocId] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const createDocument = trpc.eSignature.createDocument.useMutation();
  const updateHelloDocId = trpc.eSignature.updateHelloDocId.useMutation();
  const checkStatus = trpc.eSignature.checkStatus.useMutation();
  
  const { data: documents, refetch } = trpc.eSignature.getBySender.useQuery();
  const { data: templates } = trpc.documentTemplates.getAll.useQuery();

  const handleTemplateSelect = (templateId: string) => {
    const template = templates?.find((t: any) => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setDocumentName(template.name);
      fetch(template.s3Url)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], template.name + '.' + template.fileType, { type: blob.type });
          setFile(file);
        })
        .catch(err => console.error('Failed to load template:', err));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (!documentName) {
        setDocumentName(selectedFile.name);
      }
    }
  };

  const handleUpload = async () => {
    if (!file || !documentName || !signerEmail || !signerName) {
      alert("Please fill in all fields");
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      // Upload file to S3 with progress tracking
      const formData = new FormData();
      formData.append("file", file);
      
      const url = await new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(percentComplete);
          }
        });
        
        xhr.addEventListener("load", () => {
          if (xhr.status === 200) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response.url);
            } catch (err) {
              reject(new Error("Failed to parse upload response"));
            }
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });
        
        xhr.addEventListener("error", () => {
          reject(new Error("Upload failed"));
        });
        
        xhr.open("POST", "/api/upload");
        xhr.send(formData);
      });

      // Create document record
      const result = await createDocument.mutateAsync({
        documentName,
        documentUrl: url,
        signerEmail,
        signerName,
      });

      setUploadedDocId(result.documentId);
      setUploadedDocUrl(url);
      
      // Reset form
      setFile(null);
      setDocumentName("");
      setSignerEmail("");
      setSignerName("");
      setUploadProgress(0);
      
      refetch();
    } catch (error: any) {
      console.error("Upload error:", error);
      alert(`Failed to upload document: ${error.message}`);
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmitHelloDocId = async () => {
    if (!uploadedDocId || !helloDocId) {
      alert("Please enter HelloDoc Document ID");
      return;
    }

    try {
      await updateHelloDocId.mutateAsync({
        documentId: uploadedDocId,
        helloDocDocumentId: helloDocId,
      });
      
      alert("HelloDoc ID saved! Status tracking is now active.");
      setUploadedDocId(null);
      setUploadedDocUrl(null);
      setHelloDocId("");
      refetch();
    } catch (error: any) {
      console.error("Error:", error);
      alert(`Failed to save HelloDoc ID: ${error.message}`);
    }
  };

  const handleCheckStatus = async (docId: string, helloDocDocumentId: string) => {
    try {
      await checkStatus.mutateAsync({ helloDocDocumentId });
      refetch();
    } catch (error: any) {
      console.error("Status check error:", error);
      alert(`Failed to check status: ${error.message}`);
    }
  };

  const filteredDocuments = documents?.filter((doc) => {
    const matchesStatus = statusFilter === "all" || doc.status === statusFilter;
    const matchesSearch =
      searchQuery === "" ||
      doc.documentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.signerEmail.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", icon: any }> = {
      awaiting_hellodoc_id: { variant: "outline", icon: AlertCircle },
      pending: { variant: "secondary", icon: Clock },
      signed: { variant: "default", icon: CheckCircle2 },
      rejected: { variant: "destructive", icon: XCircle },
      expired: { variant: "outline", icon: XCircle },
    };
    const config = variants[status] || variants.pending;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3" />
        {status.replace(/_/g, " ").toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center gap-3">
        <FileSignature className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">{t("common.eSignature")}</h1>
          <p className="text-muted-foreground">Send documents for electronic signature via HelloDoc/Dropbox Sign</p>
        </div>
      </div>

      {/* Step 1: Upload Document */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm">1</span>
            Upload Document
          </CardTitle>
          <CardDescription>Upload the document you want to send for signature</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {templates && templates.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="template">Use Template (Optional)</Label>
              <Select value={selectedTemplate || ""} onValueChange={handleTemplateSelect} disabled={uploading || !!uploadedDocId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a template or upload new document" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template: any) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name} {template.category && `(${template.category})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="file">Document File (PDF, Word, Excel)</Label>
            <Input
              id="file"
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx"
              onChange={handleFileChange}
              disabled={uploading || !!uploadedDocId}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="documentName">Document Name</Label>
              <Input
                id="documentName"
                value={documentName}
                onChange={(e) => setDocumentName(e.target.value)}
                placeholder="Contract Agreement.pdf"
                disabled={uploading || !!uploadedDocId}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="signerEmail">Signer Email</Label>
              <Input
                id="signerEmail"
                type="email"
                value={signerEmail}
                onChange={(e) => setSignerEmail(e.target.value)}
                placeholder="signer@example.com"
                disabled={uploading || !!uploadedDocId}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="signerName">Signer Name</Label>
              <Input
                id="signerName"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                placeholder="John Doe"
                disabled={uploading || !!uploadedDocId}
              />
            </div>
          </div>

          <Button onClick={handleUpload} disabled={uploading || !file || !!uploadedDocId} className="w-full">
            {uploading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Uploading... {uploadProgress}%
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload & Prepare Document
              </>
            )}
          </Button>

          {uploading && uploadProgress > 0 && (
            <div className="space-y-2">
              <Progress value={uploadProgress} className="w-full" />
              <p className="text-sm text-muted-foreground text-center">
                Uploading: {uploadProgress}% complete
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 2: Send from HelloDoc */}
      {uploadedDocId && uploadedDocUrl && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm">2</span>
              Send from HelloDoc/Dropbox Sign
            </CardTitle>
            <CardDescription>Open HelloDoc, add signature fields, and send the document</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription className="space-y-3">
                <p className="font-medium">Document uploaded successfully! Follow these steps:</p>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Click the button below to open HelloDoc/Dropbox Sign</li>
                  <li>Create a new signature request and upload this document: <code className="text-xs bg-muted px-1 py-0.5 rounded">{documentName}</code></li>
                  <li>Add signature, date, and initial fields where needed</li>
                  <li>Enter signer details: <strong>{signerName}</strong> ({signerEmail})</li>
                  <li>Send the document from HelloDoc</li>
                  <li>Copy the HelloDoc Document ID and paste it below</li>
                </ol>
              </AlertDescription>
            </Alert>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => window.open(uploadedDocUrl, "_blank")}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Download Document
              </Button>
              <Button
                className="flex-1"
                onClick={() => window.open("https://app.hellosign.com/home/manage", "_blank")}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Open HelloDoc/Dropbox Sign
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="helloDocId">HelloDoc Document ID</Label>
              <div className="flex gap-2">
                <Input
                  id="helloDocId"
                  value={helloDocId}
                  onChange={(e) => setHelloDocId(e.target.value)}
                  placeholder="Enter the Document ID from HelloDoc"
                />
                <Button onClick={handleSubmitHelloDocId} disabled={!helloDocId}>
                  Save ID
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Find the Document ID in HelloDoc's dashboard after sending the document
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Track Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm">3</span>
            Track Sent Documents
          </CardTitle>
          <CardDescription>Monitor signature status and download signed documents</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Search by document name or signer email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="awaiting_hellodoc_id">Awaiting ID</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="signed">Signed</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document Name</TableHead>
                  <TableHead>Signer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sent Date</TableHead>
                  <TableHead>Signed Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments && filteredDocuments.length > 0 ? (
                  filteredDocuments.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">{doc.documentName}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{doc.signerName}</div>
                          <div className="text-muted-foreground">{doc.signerEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(doc.status)}</TableCell>
                      <TableCell>{doc.sentAt ? new Date(doc.sentAt).toLocaleDateString() : "-"}</TableCell>
                      <TableCell>{doc.signedAt ? new Date(doc.signedAt).toLocaleDateString() : "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {doc.status === "pending" && doc.helloDocDocumentId && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCheckStatus(doc.id, doc.helloDocDocumentId!)}
                            >
                              <RefreshCw className="mr-1 h-3 w-3" />
                              Check Status
                            </Button>
                          )}
                          {doc.status === "signed" && doc.s3Url && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(doc.s3Url!, "_blank")}
                            >
                              <Eye className="mr-1 h-3 w-3" />
                              View
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No documents found. Upload a document to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
