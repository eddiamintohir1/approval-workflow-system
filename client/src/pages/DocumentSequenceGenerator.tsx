import { useState, useCallback } from "react";
import { trpc } from "../lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Home, Download, Search, Plus, ChevronLeft, ChevronRight, CheckCircle2, Clock, FileText, XCircle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { useLocation } from "wouter";

// ─── Legends ──────────────────────────────────────────────────────────────────
const COMPANY_LEGEND: Record<string, string> = {
  CJB: "Compawnion Jadi Berkat (Primary Company)",
  CBB: "Compawnion Bersama Berkembang (Subsidiary)",
  PJB: "PT Jadi Berkat (Partner)",
};
const DIVISION_LEGEND: Record<string, string> = {
  MKT: "Marketing", SAL: "Sales", OPS: "Operations", PRO: "Production",
  RND: "Research & Development", HRD: "Human Resources & Development",
  COR: "Corporate", LOG: "Logistics", PUR: "Purchasing", FIN: "Finance",
  ACC: "Accounting", ITS: "Information Technology Services", PRC: "Procurement",
};
const DOCUMENT_TYPE_LEGEND: Record<string, string> = {
  SOP: "Standard Operating Procedure", IK: "Instruksi Kerja (Work Instruction)",
  FORM: "Form/Template", SC: "Spesifikasi Cairan (Liquid Specification)",
  SPK: "Surat Perintah Kerja (Work Order)", NDA: "Non-Disclosure Agreement",
  JPB: "Jaminan Pembayaran (Payment Guarantee)", BA: "Berita Acara (Official Report)",
  SK: "Surat Keputusan (Decision Letter)", RET: "Rencana Eksekusi Teknis (Technical Execution Plan)",
  SPG: "Surat Perjalanan Dinas (Travel Authorization)",
  PKWT: "Perjanjian Kerja Waktu Tertentu (Fixed-Term Employment Contract)",
};

// ─── Status helpers ───────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  draft:      { label: "Draft",      color: "bg-slate-100 text-slate-700",   icon: <FileText className="w-3 h-3" /> },
  review:     { label: "Review",     color: "bg-blue-100 text-blue-700",     icon: <Clock className="w-3 h-3" /> },
  approved:   { label: "Approved",   color: "bg-green-100 text-green-700",   icon: <CheckCircle2 className="w-3 h-3" /> },
  effective:  { label: "Effective",  color: "bg-teal-100 text-teal-700",     icon: <CheckCircle2 className="w-3 h-3" /> },
  superseded: { label: "Superseded", color: "bg-orange-100 text-orange-700", icon: <RefreshCw className="w-3 h-3" /> },
  obsolete:   { label: "Obsolete",   color: "bg-red-100 text-red-700",       icon: <XCircle className="w-3 h-3" /> },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: "bg-slate-100 text-slate-700", icon: null };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
      {cfg.icon}{cfg.label}
    </span>
  );
}

// ─── Inline status update dropdown ───────────────────────────────────────────
function StatusUpdater({ docId, currentStatus, onUpdated }: { docId: string; currentStatus: string; onUpdated: () => void }) {
  const utils = trpc.useUtils();
  const { mutate, isPending } = trpc.documentSequence.updateDocumentStatus.useMutation({
    onSuccess: () => {
      toast.success("Status updated", { description: "Document status has been saved." });
      utils.documentSequence.listDocumentSequences.invalidate();
      onUpdated();
    },
    onError: (e) => toast.error("Error", { description: e.message }),
  });

  return (
    <Select
      value={currentStatus}
      onValueChange={(val) => mutate({ id: docId, status: val as any })}
      disabled={isPending}
    >
      <SelectTrigger className="h-7 text-xs w-32 border-slate-200">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(STATUS_CONFIG).map(([val, cfg]) => (
          <SelectItem key={val} value={val}>
            <span className="flex items-center gap-1">{cfg.icon} {cfg.label}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// ─── Pagination controls ──────────────────────────────────────────────────────
function Pagination({ page, totalPages, onPage }: { page: number; totalPages: number; onPage: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between pt-4 border-t">
      <span className="text-sm text-slate-500">Page {page} of {totalPages}</span>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPage(1)} className="h-8 w-8 p-0">«</Button>
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)} className="h-8 w-8 p-0">
          <ChevronLeft className="w-4 h-4" />
        </Button>
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          const start = Math.max(1, Math.min(page - 2, totalPages - 4));
          const p = start + i;
          return (
            <Button key={p} variant={p === page ? "default" : "outline"} size="sm"
              onClick={() => onPage(p)} className="h-8 w-8 p-0 text-xs">
              {p}
            </Button>
          );
        })}
        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPage(page + 1)} className="h-8 w-8 p-0">
          <ChevronRight className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPage(totalPages)} className="h-8 w-8 p-0">»</Button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
const PAGE_SIZE = 20;

export default function DocumentSequenceGenerator() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("generator");

  // Generate form state
  const [formData, setFormData] = useState({
    documentType: "", company: "", division: "",
    documentTitle: "", recipientName: "", documentDescription: "",
  });
  const [generatedNumber, setGeneratedNumber] = useState<string | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");

  // History / filter state
  const [filters, setFilters] = useState({
    company: "all", division: "all", documentType: "all", status: "all", year: "all",
  });
  const [historyPage, setHistoryPage] = useState(1);

  // ── Queries ──
  const { data: constants } = trpc.documentSequence.getConstants.useQuery();
  const { data: availableYears } = trpc.documentSequence.getAvailableYears.useQuery();

  const historyQuery = trpc.documentSequence.listDocumentSequences.useQuery({
    company: filters.company !== "all" ? (filters.company as any) : undefined,
    division: filters.division !== "all" ? (filters.division as any) : undefined,
    documentType: filters.documentType !== "all" ? (filters.documentType as any) : undefined,
    status: filters.status !== "all" ? (filters.status as any) : undefined,
    year: filters.year !== "all" ? Number(filters.year) : undefined,
    limit: PAGE_SIZE,
    offset: (historyPage - 1) * PAGE_SIZE,
  });

  const { data: searchResults } = trpc.documentSequence.searchDocumentSequences.useQuery(
    { query: searchQuery },
    { enabled: searchQuery.length >= 2 }
  );

  // ── Mutations ──
  const { mutate: generateNumber, isPending: isGenerating } = trpc.documentSequence.generateDocumentNumber.useMutation({
    onSuccess: (result) => {
      setGeneratedNumber(result.documentNumber);
      setFormData({ documentType: "", company: "", division: "", documentTitle: "", recipientName: "", documentDescription: "" });
      historyQuery.refetch();
      toast.success("Document number generated!", { description: result.documentNumber });
    },
    onError: (e) => toast.error("Error", { description: e.message }),
  });

  const handleGenerateNumber = () => {
    if (!formData.documentType || !formData.company || !formData.division || !formData.documentTitle) {
      toast.error("Missing fields", { description: "Please fill in all required fields." });
      return;
    }
    setGeneratedNumber(null);
    generateNumber({
      documentType: formData.documentType as any,
      company: formData.company as any,
      division: formData.division as any,
      documentTitle: formData.documentTitle,
      recipientName: formData.recipientName || undefined,
      documentDescription: formData.documentDescription || undefined,
    });
  };

  const handleFilterChange = useCallback((key: string, val: string) => {
    setFilters((prev) => ({ ...prev, [key]: val }));
    setHistoryPage(1);
  }, []);

  const handleExportCSV = () => {
    const data = historyQuery.data?.data ?? [];
    if (!data.length) return;
    const csv = [
      ["Document Number", "Title", "Recipient", "Type", "Company", "Division", "Year", "Status", "Created At"],
      ...data.map((d) => [
        d.documentNumber, d.documentTitle, (d as any).recipientName ?? "",
        d.documentType, d.company, d.division, d.year,
        d.status, new Date(d.createdAt).toLocaleDateString(),
      ]),
    ].map((row) => row.map((c) => `"${c}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `doc-sequences-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const totalPages = historyQuery.data ? Math.ceil(historyQuery.data.total / PAGE_SIZE) : 1;
  const isPKWT = formData.documentType === "PKWT";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-teal-900">Document Sequence Generator</h1>
          <p className="text-slate-600 mt-2">Generate and manage document numbering for Compawnion</p>
        </div>
        <Button variant="outline" size="lg" className="gap-2" onClick={() => navigate("/")}>
          <Home className="w-5 h-5" /> Dashboard
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="generator">Generate Number</TabsTrigger>
          <TabsTrigger value="search">Search Documents</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="legends">Legends</TabsTrigger>
        </TabsList>

        {/* ── Generator Tab ── */}
        <TabsContent value="generator" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-teal-50 to-teal-100 border-b">
              <CardTitle className="text-teal-900">Generate New Document Number</CardTitle>
              <CardDescription>
                Standard format: <code className="bg-white px-1 rounded">0001.SOP/CJB/MKT/III/2026</code>
                &nbsp;|&nbsp; PKWT format: <code className="bg-white px-1 rounded">012/PKWT/CJB/HRD/V/2026</code>
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {generatedNumber && (
                <Alert className="bg-green-50 border-green-300">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-900">
                    <strong>Generated:</strong>{" "}
                    <span className="font-mono text-lg">{generatedNumber}</span>
                    <Button variant="ghost" size="sm" className="ml-2 h-6 text-xs"
                      onClick={() => { navigator.clipboard.writeText(generatedNumber); toast.success("Copied!"); }}>
                      Copy
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Document Type */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">Document Type <span className="text-red-500">*</span></label>
                  <Select value={formData.documentType} onValueChange={(v) => setFormData({ ...formData, documentType: v })}>
                    <SelectTrigger><SelectValue placeholder="Select document type" /></SelectTrigger>
                    <SelectContent>
                      {constants?.documentTypes.map((t) => (
                        <SelectItem key={t} value={t}>{t} — {DOCUMENT_TYPE_LEGEND[t] ?? t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Company */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">Company <span className="text-red-500">*</span></label>
                  <Select value={formData.company} onValueChange={(v) => setFormData({ ...formData, company: v })}>
                    <SelectTrigger><SelectValue placeholder="Select company" /></SelectTrigger>
                    <SelectContent>
                      {constants?.companies.map((c) => (
                        <SelectItem key={c} value={c}>{c} — {COMPANY_LEGEND[c]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Division */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">Division <span className="text-red-500">*</span></label>
                  <Select value={formData.division} onValueChange={(v) => setFormData({ ...formData, division: v })}>
                    <SelectTrigger><SelectValue placeholder="Select division" /></SelectTrigger>
                    <SelectContent>
                      {constants?.divisions.map((d) => (
                        <SelectItem key={d} value={d}>{d} — {DIVISION_LEGEND[d]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Document Title */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    {isPKWT ? "Document Title" : "Document Title"} <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder={isPKWT ? "e.g., PKWT - John Doe" : "e.g., Marketing Campaign Guidelines"}
                    value={formData.documentTitle}
                    onChange={(e) => setFormData({ ...formData, documentTitle: e.target.value })}
                  />
                </div>

                {/* Recipient Name — shown for all types, prominent for PKWT */}
                <div className="space-y-2 md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Recipient / Employee Name
                    {isPKWT && <span className="text-red-500"> *</span>}
                    {!isPKWT && <span className="text-slate-400 font-normal"> (optional)</span>}
                  </label>
                  <Input
                    placeholder={isPKWT ? "Full name of employee (e.g., John Doe)" : "Name of the person this document is addressed to (optional)"}
                    value={formData.recipientName}
                    onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                    className={isPKWT ? "border-teal-400 ring-1 ring-teal-200" : ""}
                  />
                  {isPKWT && (
                    <p className="text-xs text-teal-600">For PKWT, this is the employee's full name as it will appear on the contract.</p>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">Document Description <span className="text-slate-400 font-normal">(optional)</span></label>
                <Textarea
                  placeholder="Provide additional details about this document..."
                  value={formData.documentDescription}
                  onChange={(e) => setFormData({ ...formData, documentDescription: e.target.value })}
                  rows={3}
                />
              </div>

              <Button onClick={handleGenerateNumber} disabled={isGenerating}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 gap-2">
                <Plus className="w-5 h-5" />
                {isGenerating ? "Generating..." : "Generate Document Number"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Search Tab ── */}
        <TabsContent value="search" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-teal-50 to-teal-100 border-b">
              <CardTitle className="text-teal-900">Search Documents</CardTitle>
              <CardDescription>Search by document number, title, or recipient name</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <Input
                  placeholder="Type at least 2 characters to search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {searchResults && searchResults.length > 0 && (
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700">Document Number</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700">Title</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700">Recipient</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700">Type</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700">Status</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700">Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {searchResults.map((doc) => (
                        <tr key={doc.id} className="border-b hover:bg-slate-50">
                          <td className="px-4 py-3 font-mono text-teal-600 text-xs">{doc.documentNumber}</td>
                          <td className="px-4 py-3 max-w-[200px] truncate">{doc.documentTitle}</td>
                          <td className="px-4 py-3 text-slate-600">{(doc as any).recipientName ?? "—"}</td>
                          <td className="px-4 py-3"><Badge variant="outline">{doc.documentType}</Badge></td>
                          <td className="px-4 py-3"><StatusBadge status={doc.status} /></td>
                          <td className="px-4 py-3 text-slate-500 text-xs">{new Date(doc.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {searchQuery.length >= 2 && searchResults?.length === 0 && (
                <p className="text-center text-slate-500 py-8">No documents found for "{searchQuery}"</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── History Tab ── */}
        <TabsContent value="history" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-slate-900">Document History</CardTitle>
                  <CardDescription>
                    {historyQuery.data ? `${historyQuery.data.total} total records` : "Loading..."}
                  </CardDescription>
                </div>
                <Button onClick={handleExportCSV} variant="outline" size="sm" className="gap-2">
                  <Download className="w-4 h-4" /> Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {/* Filters row */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <Select value={filters.year} onValueChange={(v) => handleFilterChange("year", v)}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="All Years" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
                    {(availableYears ?? []).map((y) => (
                      <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filters.documentType} onValueChange={(v) => handleFilterChange("documentType", v)}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="All Types" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {constants?.documentTypes.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filters.company} onValueChange={(v) => handleFilterChange("company", v)}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="All Companies" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Companies</SelectItem>
                    {constants?.companies.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filters.division} onValueChange={(v) => handleFilterChange("division", v)}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="All Divisions" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Divisions</SelectItem>
                    {constants?.divisions.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filters.status} onValueChange={(v) => handleFilterChange("status", v)}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="All Statuses" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {Object.entries(STATUS_CONFIG).map(([val, cfg]) => (
                      <SelectItem key={val} value={val}>{cfg.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Document Number</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Title / Recipient</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Type</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Div</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Year</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Status</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyQuery.isLoading && (
                      <tr><td colSpan={7} className="text-center py-8 text-slate-400">Loading...</td></tr>
                    )}
                    {!historyQuery.isLoading && (historyQuery.data?.data ?? []).length === 0 && (
                      <tr><td colSpan={7} className="text-center py-8 text-slate-400">No documents found</td></tr>
                    )}
                    {(historyQuery.data?.data ?? []).map((doc) => (
                      <tr key={doc.id} className="border-b hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-teal-600 text-xs">{doc.documentNumber}</span>
                            <button
                              title="Copy"
                              className="text-slate-300 hover:text-teal-500 transition-colors"
                              onClick={() => { navigator.clipboard.writeText(doc.documentNumber); toast.success("Copied!"); }}
                            >
                              ⧉
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-slate-800 truncate max-w-[180px]">{doc.documentTitle}</p>
                          {(doc as any).recipientName && (
                            <p className="text-xs text-slate-500">{(doc as any).recipientName}</p>
                          )}
                        </td>
                        <td className="px-4 py-3"><Badge variant="outline" className="text-xs">{doc.documentType}</Badge></td>
                        <td className="px-4 py-3 text-slate-600 text-xs">{doc.division}</td>
                        <td className="px-4 py-3 text-slate-600 text-xs">{doc.year}</td>
                        <td className="px-4 py-3">
                          <StatusUpdater docId={doc.id} currentStatus={doc.status} onUpdated={() => historyQuery.refetch()} />
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs">{new Date(doc.createdAt).toLocaleDateString("id-ID")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <Pagination page={historyPage} totalPages={totalPages} onPage={setHistoryPage} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Legends Tab ── */}
        <TabsContent value="legends" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
      </Tabs>
    </div>
  );
}
