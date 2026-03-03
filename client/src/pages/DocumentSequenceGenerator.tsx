import React, { useState } from "react";
import { trpc } from "../lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, Home, Download, Search, Plus } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Constants for legends
const COMPANY_LEGEND = {
  CJB: "Compawnion Jadi Berkat (Primary Company)",
  CBB: "Compawnion Bersama Berkembang (Subsidiary)",
  PJB: "PT Jadi Berkat (Partner)",
};

const DIVISION_LEGEND = {
  MKT: "Marketing",
  SAL: "Sales",
  OPS: "Operations",
  PRO: "Production",
  RND: "Research & Development",
  HRD: "Human Resources & Development",
  COR: "Corporate",
  LOG: "Logistics",
  PUR: "Purchasing",
  FIN: "Finance",
  ACC: "Accounting",
  ITS: "Information Technology Services",
  PRC: "Procurement",
};

const DOCUMENT_TYPE_LEGEND = {
  SOP: "Standard Operating Procedure",
  IK: "Instruksi Kerja (Work Instruction)",
  FORM: "Form/Template",
  SC: "Spesifikasi Cairan (Liquid Specification)",
  SPK: "Surat Perintah Kerja (Work Order)",
  NDA: "Non-Disclosure Agreement",
  JPB: "Jaminan Pembayaran (Payment Guarantee)",
  BA: "Berita Acara (Official Report)",
  SK: "Surat Keputusan (Decision Letter)",
  RET: "Rencana Eksekusi Teknis (Technical Execution Plan)",
  SPG: "Surat Perjalanan Dinas (Travel Authorization)",
};

export default function DocumentSequenceGenerator() {
  const [activeTab, setActiveTab] = useState("generator");
  const [formData, setFormData] = useState({
    documentType: "",
    company: "",
    division: "",
    documentTitle: "",
    documentDescription: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    company: "",
    division: "",
    documentType: "",
    status: "",
  });

  // tRPC queries and mutations
  const { data: constants } = trpc.documentSequence.getConstants.useQuery();
  const { mutate: generateNumber, isPending: isGenerating } = trpc.documentSequence.generateDocumentNumber.useMutation();
  const { data: documents, refetch: refetchDocuments } = trpc.documentSequence.listDocumentSequences.useQuery({
    company: filters.company ? (filters.company as any) : undefined,
    division: filters.division ? (filters.division as any) : undefined,
    documentType: filters.documentType ? (filters.documentType as any) : undefined,
    status: filters.status ? (filters.status as any) : undefined,
  });
  const { data: searchResults } = trpc.documentSequence.searchDocumentSequences.useQuery(
    { query: searchQuery },
    { enabled: searchQuery.length > 0 }
  );

  const handleGenerateNumber = () => {
    if (!formData.documentType || !formData.company || !formData.division || !formData.documentTitle) {
      alert("Please fill in all required fields");
      return;
    }

    generateNumber(
      {
        documentType: formData.documentType as any,
        company: formData.company as any,
        division: formData.division as any,
        documentTitle: formData.documentTitle,
        documentDescription: formData.documentDescription,
      },
      {
        onSuccess: (result) => {
          alert(`Document number generated: ${result.documentNumber}`);
          setFormData({
            documentType: "",
            company: "",
            division: "",
            documentTitle: "",
            documentDescription: "",
          });
          refetchDocuments();
        },
        onError: (error) => {
          alert(`Error: ${error.message}`);
        },
      }
    );
  };

  const handleExportCSV = () => {
    if (!documents?.data) return;

    const csv = [
      ["Document Number", "Title", "Type", "Company", "Division", "Status", "Created At"],
      ...documents.data.map((doc) => [
        doc.documentNumber,
        doc.documentTitle,
        doc.documentType,
        doc.company,
        doc.division,
        doc.status,
        new Date(doc.createdAt).toLocaleDateString(),
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `document-sequences-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      {/* Header with Home button */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-teal-900">Document Sequence Generator</h1>
          <p className="text-slate-600 mt-2">Generate and manage document numbering for Compawnion</p>
        </div>
        <Button variant="outline" size="lg" className="gap-2">
          <Home className="w-5 h-5" />
          Dashboard
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="generator">Generate Number</TabsTrigger>
          <TabsTrigger value="search">Search Documents</TabsTrigger>
          <TabsTrigger value="legends">Legends</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Generator Tab */}
        <TabsContent value="generator" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-teal-50 to-teal-100 border-b">
              <CardTitle className="text-teal-900">Generate New Document Number</CardTitle>
              <CardDescription>Create a unique document sequence number following the format: XXXX.TYPE/COMPANY/DIVISION/MONTH/YEAR</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Format Example */}
              <Alert className="bg-teal-50 border-teal-200">
                <AlertCircle className="h-4 w-4 text-teal-600" />
                <AlertDescription className="text-teal-900">
                  <strong>Format Example:</strong> 0001.SOP/CJB/MKT/III/2026 (Document #1, SOP type, Compawnion Jadi Berkat company, Marketing division, March 2026)
                </AlertDescription>
              </Alert>

              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Document Type */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Document Type <span className="text-red-500">*</span>
                  </label>
                  <Select value={formData.documentType} onValueChange={(value) => setFormData({ ...formData, documentType: value })}>
                    <SelectTrigger className="border-slate-300">
                      <SelectValue placeholder="Select document type" />
                    </SelectTrigger>
                    <SelectContent>
                      {constants?.documentTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type} - {DOCUMENT_TYPE_LEGEND[type as keyof typeof DOCUMENT_TYPE_LEGEND]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Company */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Company <span className="text-red-500">*</span>
                  </label>
                  <Select value={formData.company} onValueChange={(value) => setFormData({ ...formData, company: value })}>
                    <SelectTrigger className="border-slate-300">
                      <SelectValue placeholder="Select company" />
                    </SelectTrigger>
                    <SelectContent>
                      {constants?.companies.map((company) => (
                        <SelectItem key={company} value={company}>
                          {company} - {COMPANY_LEGEND[company as keyof typeof COMPANY_LEGEND]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Division */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Division <span className="text-red-500">*</span>
                  </label>
                  <Select value={formData.division} onValueChange={(value) => setFormData({ ...formData, division: value })}>
                    <SelectTrigger className="border-slate-300">
                      <SelectValue placeholder="Select division" />
                    </SelectTrigger>
                    <SelectContent>
                      {constants?.divisions.map((division) => (
                        <SelectItem key={division} value={division}>
                          {division} - {DIVISION_LEGEND[division as keyof typeof DIVISION_LEGEND]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Document Title */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Document Title <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="e.g., Marketing Campaign Guidelines"
                    value={formData.documentTitle}
                    onChange={(e) => setFormData({ ...formData, documentTitle: e.target.value })}
                    className="border-slate-300"
                  />
                </div>
              </div>

              {/* Document Description */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">Document Description (Optional)</label>
                <Textarea
                  placeholder="Provide additional details about this document..."
                  value={formData.documentDescription}
                  onChange={(e) => setFormData({ ...formData, documentDescription: e.target.value })}
                  rows={4}
                  className="border-slate-300"
                />
              </div>

              {/* Generate Button */}
              <Button
                onClick={handleGenerateNumber}
                disabled={isGenerating}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 gap-2"
              >
                <Plus className="w-5 h-5" />
                {isGenerating ? "Generating..." : "Generate Document Number"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Search Tab */}
        <TabsContent value="search" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-teal-50 to-teal-100 border-b">
              <CardTitle className="text-teal-900">Search & Filter Documents</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <Input
                  placeholder="Search by document number or title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-slate-300"
                />
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Select value={filters.company} onValueChange={(value) => setFilters({ ...filters, company: value })}>
                  <SelectTrigger className="border-slate-300">
                    <SelectValue placeholder="Filter by company" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Companies</SelectItem>
                    {constants?.companies.map((company) => (
                      <SelectItem key={company} value={company}>
                        {company}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filters.division} onValueChange={(value) => setFilters({ ...filters, division: value })}>
                  <SelectTrigger className="border-slate-300">
                    <SelectValue placeholder="Filter by division" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Divisions</SelectItem>
                    {constants?.divisions.map((division) => (
                      <SelectItem key={division} value={division}>
                        {division}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filters.documentType} onValueChange={(value) => setFilters({ ...filters, documentType: value })}>
                  <SelectTrigger className="border-slate-300">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Types</SelectItem>
                    {constants?.documentTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                  <SelectTrigger className="border-slate-300">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Statuses</SelectItem>
                    {constants?.documentStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Export Button */}
              <Button onClick={handleExportCSV} variant="outline" className="gap-2">
                <Download className="w-5 h-5" />
                Export as CSV
              </Button>

              {/* Results Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Document Number</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Title</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Type</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Company</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Division</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Status</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(searchResults || documents?.data || []).map((doc) => (
                      <tr key={doc.id} className="border-b hover:bg-slate-50">
                        <td className="px-4 py-3 font-mono text-teal-600">{doc.documentNumber}</td>
                        <td className="px-4 py-3">{doc.documentTitle}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline">{doc.documentType}</Badge>
                        </td>
                        <td className="px-4 py-3">{doc.company}</td>
                        <td className="px-4 py-3">{doc.division}</td>
                        <td className="px-4 py-3">
                          <Badge className={`${doc.status === "approved" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                            {doc.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-slate-500">{new Date(doc.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Legends Tab */}
        <TabsContent value="legends" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Companies Legend */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b">
                <CardTitle className="text-blue-900">Companies</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {Object.entries(COMPANY_LEGEND).map(([code, name]) => (
                  <div key={code} className="flex gap-4">
                    <Badge className="bg-blue-600 text-white min-w-fit">{code}</Badge>
                    <span className="text-slate-700">{name}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Divisions Legend */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 border-b">
                <CardTitle className="text-purple-900">Divisions</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {Object.entries(DIVISION_LEGEND).map(([code, name]) => (
                  <div key={code} className="flex gap-4">
                    <Badge className="bg-purple-600 text-white min-w-fit">{code}</Badge>
                    <span className="text-slate-700">{name}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Document Types Legend */}
            <Card className="border-0 shadow-lg md:col-span-2">
              <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 border-b">
                <CardTitle className="text-green-900">Document Types</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(DOCUMENT_TYPE_LEGEND).map(([code, name]) => (
                    <div key={code} className="flex gap-4">
                      <Badge className="bg-green-600 text-white min-w-fit">{code}</Badge>
                      <span className="text-slate-700">{name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b">
              <CardTitle className="text-slate-900">Recent Documents</CardTitle>
              <CardDescription>All documents generated in the system</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {documents?.data?.slice(0, 10).map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50">
                    <div>
                      <p className="font-mono font-semibold text-teal-600">{doc.documentNumber}</p>
                      <p className="text-slate-600">{doc.documentTitle}</p>
                      <p className="text-sm text-slate-500">{new Date(doc.createdAt).toLocaleString()}</p>
                    </div>
                    <Badge className={`${doc.status === "approved" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                      {doc.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
