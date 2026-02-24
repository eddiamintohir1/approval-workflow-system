import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, ExternalLink, Home, Inbox } from "lucide-react";
import { format } from "date-fns";
import { useLocation } from "wouter";

export default function CFODocumentQueue() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const { data: documents, isLoading } = trpc.cfoDocumentQueue.getAll.useQuery();

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      awaiting_hellodoc_id: "secondary",
      pending: "default",
      signed: "outline",
      rejected: "destructive",
      expired: "destructive",
    };
    return <Badge variant={variants[status] || "default"}>{status.replace(/_/g, " ")}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <p>Loading documents...</p>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Inbox className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Document Queue</h1>
            <p className="text-muted-foreground">All uploaded documents awaiting Dropbox Sign processing</p>
          </div>
        </div>
        <Button variant="outline" onClick={() => setLocation("/")}>
          <Home className="mr-2 h-4 w-4" />
          Home
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Documents</CardTitle>
          <CardDescription>
            Download and process these documents in Dropbox Sign
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!documents || documents.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No documents found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document Name</TableHead>
                  <TableHead>Uploaded By</TableHead>
                  <TableHead>Upload Date</TableHead>
                  <TableHead>Signer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">{doc.documentName}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{doc.uploaderName}</div>
                        <div className="text-muted-foreground text-xs">{doc.uploaderEmail}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(doc.createdAt), "MMM d, yyyy HH:mm")}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{doc.signerName}</div>
                        <div className="text-muted-foreground text-xs">{doc.signerEmail}</div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(doc.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {doc.uploadedS3Url && (
                          <Button
                            size="sm"
                            variant="outline"
                            asChild
                          >
                            <a href={doc.uploadedS3Url} download target="_blank" rel="noopener noreferrer">
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </a>
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="default"
                          asChild
                        >
                          <a href="https://app.hellosign.com" target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Open Dropbox Sign
                          </a>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
