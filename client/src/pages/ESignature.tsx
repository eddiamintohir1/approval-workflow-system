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
import { Upload, FileSignature, Loader2, CheckCircle2, XCircle, Clock, ExternalLink, RefreshCw, Eye, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";


export default function ESignature() {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [documentName, setDocumentName] = useState("");
  const [signerEmail, setSignerEmail] = useState("");
  const [signerName, setSignerName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "signed" | "rejected" | "expired">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const sendForSignature = trpc.eSignature.sendForSignature.useMutation();
  const { data: documents, refetch: refetchDocuments } = trpc.eSignature.getAll.useQuery({
    status: statusFilter === "all" ? undefined : statusFilter,
    search: searchQuery || undefined,
  });
  const checkStatus = trpc.eSignature.checkStatus.useMutation();
  const handleSigned = trpc.eSignature.handleSignedDocument.useMutation();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setDocumentName(selectedFile.name);
      setError(null);
    }
  };

  const handleSendForSignature = async () => {
    if (!file || !signerEmail || !signerName) {
      setError("Please fill in all fields and select a document");
      return;
    }

    try {
      setSending(true);
      setError(null);

      // Upload file to S3 via backend
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      
      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      
      if (!uploadResponse.ok) {
        throw new Error("Failed to upload document");
      }
      
      const { url: documentUrl } = await uploadResponse.json();
      setUploading(false);

      // Send document for signature via HelloDoc
      const result = await sendForSignature.mutateAsync({
        documentName,
        documentUrl,
        signerEmail,
        signerName,
      });

      setSignatureUrl(result.signatureUrl);
      
      // Reset form and refetch documents
      setFile(null);
      setDocumentName("");
      setSignerEmail("");
      setSignerName("");
      refetchDocuments();
    } catch (err: any) {
      setError(err.message || "Failed to send document for signature");
    } finally {
      setSending(false);
      setUploading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <FileSignature className="h-8 w-8" />
          {t("eSignature.title", "E-Signature")}
        </h1>
        <p className="text-muted-foreground mt-2">
          {t("eSignature.description", "Send documents to clients or vendors for electronic signature")}
        </p>
      </div>

      {/* Send Document Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{t("eSignature.sendDocument", "Send Document for Signature")}</CardTitle>
          <CardDescription>
            {t("eSignature.sendDescription", "Upload a document and enter the signer's details")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="file">{t("eSignature.document", "Document")}</Label>
            <div className="flex items-center gap-4">
              <Input
                id="file"
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx"
                onChange={handleFileChange}
                disabled={uploading || sending}
              />
              {file && (
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  {file.name}
                </span>
              )}
            </div>
          </div>

          {/* Document Name */}
          <div className="space-y-2">
            <Label htmlFor="documentName">{t("eSignature.documentName", "Document Name")}</Label>
            <Input
              id="documentName"
              value={documentName}
              onChange={(e) => setDocumentName(e.target.value)}
              placeholder={t("eSignature.documentNamePlaceholder", "Enter document name")}
              disabled={uploading || sending}
            />
          </div>

          {/* Signer Email */}
          <div className="space-y-2">
            <Label htmlFor="signerEmail">{t("eSignature.signerEmail", "Signer Email")}</Label>
            <Input
              id="signerEmail"
              type="email"
              value={signerEmail}
              onChange={(e) => setSignerEmail(e.target.value)}
              placeholder={t("eSignature.signerEmailPlaceholder", "Enter signer's email")}
              disabled={uploading || sending}
            />
          </div>

          {/* Signer Name */}
          <div className="space-y-2">
            <Label htmlFor="signerName">{t("eSignature.signerName", "Signer Name")}</Label>
            <Input
              id="signerName"
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
              placeholder={t("eSignature.signerNamePlaceholder", "Enter signer's full name")}
              disabled={uploading || sending}
            />
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Alert with Signature URL */}
          {signatureUrl && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {t("eSignature.sentSuccess", "Document sent successfully! The signer will receive an email with the signature link.")}
                <div className="mt-2">
                  <a
                    href={signatureUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-1"
                  >
                    {t("eSignature.viewSignatureLink", "View Signature Link")}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Send Button */}
          <Button
            onClick={handleSendForSignature}
            disabled={uploading || sending || !file || !signerEmail || !signerName}
            className="w-full"
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("eSignature.uploading", "Uploading...")}
              </>
            ) : sending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("eSignature.sending", "Sending...")}
              </>
            ) : (
              <>
                <FileSignature className="mr-2 h-4 w-4" />
                {t("eSignature.sendForSignature", "Send for Signature")}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Sent Documents List */}
      <Card>
        <CardHeader>
          <CardTitle>{t("eSignature.sentDocuments", "Sent Documents")}</CardTitle>
          <CardDescription>
            {t("eSignature.sentDocumentsDescription", "Track the status of documents you've sent for signature")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("eSignature.searchPlaceholder", "Search by document name or signer email...")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("eSignature.statusAll", "All Status")}</SelectItem>
                <SelectItem value="pending">{t("eSignature.statusPending", "Pending")}</SelectItem>
                <SelectItem value="signed">{t("eSignature.statusSigned", "Signed")}</SelectItem>
                <SelectItem value="rejected">{t("eSignature.statusRejected", "Rejected")}</SelectItem>
                <SelectItem value="expired">{t("eSignature.statusExpired", "Expired")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Documents Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("eSignature.documentName", "Document Name")}</TableHead>
                  <TableHead>{t("eSignature.signerEmail", "Signer Email")}</TableHead>
                  <TableHead>{t("eSignature.status", "Status")}</TableHead>
                  <TableHead>{t("eSignature.sentDate", "Sent Date")}</TableHead>
                  <TableHead>{t("eSignature.signedDate", "Signed Date")}</TableHead>
                  <TableHead className="text-right">{t("eSignature.actions", "Actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!documents || documents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      {t("eSignature.noDocuments", "No documents found")}
                    </TableCell>
                  </TableRow>
                ) : (
                  documents.map((doc: any) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">{doc.documentName}</TableCell>
                      <TableCell>{doc.signerEmail}</TableCell>
                      <TableCell>
                        {doc.status === "pending" && (
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                            <Clock className="h-3 w-3 mr-1" />
                            {t("eSignature.statusPending", "Pending")}
                          </Badge>
                        )}
                        {doc.status === "signed" && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            {t("eSignature.statusSigned", "Signed")}
                          </Badge>
                        )}
                        {doc.status === "rejected" && (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            <XCircle className="h-3 w-3 mr-1" />
                            {t("eSignature.statusRejected", "Rejected")}
                          </Badge>
                        )}
                        {doc.status === "expired" && (
                          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                            {t("eSignature.statusExpired", "Expired")}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{format(new Date(doc.sentAt), "MMM d, yyyy")}</TableCell>
                      <TableCell>
                        {doc.signedAt ? format(new Date(doc.signedAt), "MMM d, yyyy") : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {doc.status === "pending" && doc.helloDocDocumentId && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                try {
                                  const status = await checkStatus.mutateAsync({
                                    helloDocDocumentId: doc.helloDocDocumentId,
                                  });
                                  if (status.status === "signed") {
                                    await handleSigned.mutateAsync({
                                      helloDocDocumentId: doc.helloDocDocumentId,
                                    });
                                  }
                                  refetchDocuments();
                                } catch (err) {
                                  console.error("Failed to check status:", err);
                                }
                              }}
                              disabled={checkStatus.isPending || handleSigned.isPending}
                            >
                              {checkStatus.isPending || handleSigned.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <RefreshCw className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                          {doc.status === "signed" && doc.s3Url && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(doc.s3Url, "_blank")}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              {t("eSignature.view", "View")}
                            </Button>
                          )}
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
