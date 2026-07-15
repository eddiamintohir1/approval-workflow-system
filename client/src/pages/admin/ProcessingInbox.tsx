import { useMemo, useState } from "react";
import { Link } from "wouter";
import { AlertCircle, CheckCircle2, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { trpc } from "@/lib/trpc";

const statusLabels = {
  missing_info: "Missing info",
  draft: "Draft",
  ready: "Ready",
  in_progress: "In progress",
  completed: "Processed",
} as const;

const statusClasses = {
  missing_info: "bg-amber-100 text-amber-900 hover:bg-amber-100",
  draft: "bg-slate-100 text-slate-800 hover:bg-slate-100",
  ready: "bg-blue-100 text-blue-900 hover:bg-blue-100",
  in_progress: "bg-violet-100 text-violet-900 hover:bg-violet-100",
  completed: "bg-emerald-100 text-emerald-900 hover:bg-emerald-100",
} as const;

function formatMappedValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export default function ProcessingInbox() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [templateId, setTemplateId] = useState("all");
  const utils = trpc.useUtils();
  const { data: rows = [], isLoading } =
    trpc.formSubmissions.getProcessingInbox.useQuery();

  const processStage = trpc.stages.approve.useMutation({
    onSuccess: async () => {
      await utils.formSubmissions.getProcessingInbox.invalidate();
      toast.success("Workflow stage processed", {
        description:
          "The workflow was advanced. The submitter is notified when the final stage completes.",
      });
    },
    onError: error => toast.error(error.message),
  });

  const mappedColumns = useMemo(() => {
    const columns = new Map<string, { label: string; order: number }>();
    rows.forEach(row => {
      row.mappedFields.forEach(field => {
        const current = columns.get(field.key);
        if (!current || field.order < current.order) {
          columns.set(field.key, { label: field.label, order: field.order });
        }
      });
    });
    return Array.from(columns.entries())
      .map(([key, value]) => ({ key, ...value }))
      .sort((a, b) => a.order - b.order || a.label.localeCompare(b.label));
  }, [rows]);

  const templates = useMemo(
    () =>
      Array.from(
        new Map(rows.map(row => [row.templateId, row.templateName])).entries()
      )
        .map(([id, name]) => ({ id, name }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [rows]
  );

  const filteredRows = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return rows.filter(row => {
      if (status !== "all" && row.processingStatus !== status) return false;
      if (templateId !== "all" && row.templateId !== templateId) return false;
      if (!normalizedSearch) return true;

      const mappedText = row.mappedFields
        .map(field => formatMappedValue(field.value))
        .join(" ");
      return [
        row.workflowNumber,
        row.workflowTitle,
        row.templateName,
        row.submitterName,
        row.submitterEmail,
        mappedText,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);
    });
  }, [rows, search, status, templateId]);

  const counts = useMemo(
    () => ({
      missing: rows.filter(row => row.processingStatus === "missing_info")
        .length,
      draft: rows.filter(row => row.processingStatus === "draft").length,
      ready: rows.filter(row => row.processingStatus === "ready").length,
      completed: rows.filter(row => row.processingStatus === "completed")
        .length,
    }),
    [rows]
  );

  const handleProcess = (row: (typeof rows)[number]) => {
    if (!row.workflowId || !row.activeStage) {
      toast.error("This form has no active workflow stage to process");
      return;
    }
    if (row.missingFields.length > 0) {
      toast.error("Required information is still missing");
      return;
    }

    processStage.mutate({
      workflowId: row.workflowId,
      stageId: row.activeStage.id,
      comments: "Processed from the Processing Inbox",
    });
  };

  return (
    <DashboardLayout>
      <main className="container mx-auto space-y-6 px-4 py-8">
        <div>
          <h1 className="text-3xl font-bold">Processing Inbox</h1>
          <p className="mt-2 text-muted-foreground">
            Review mapped form data, identify missing information, and advance
            existing workflows.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Missing info</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold text-amber-700">
              {counts.missing}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Draft</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">
              {counts.draft}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Ready</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold text-blue-700">
              {counts.ready}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Processed</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold text-emerald-700">
              {counts.completed}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="grid gap-4 pt-6 md:grid-cols-[minmax(240px,1fr)_220px_220px]">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder="Search account, workflow, or submitter..."
                className="pl-9"
              />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={templateId} onValueChange={setTemplateId}>
              <SelectTrigger>
                <SelectValue placeholder="All templates" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All templates</SelectItem>
                {templates.map(template => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex min-h-64 items-center justify-center">
                <Loader2 className="h-7 w-7 animate-spin" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Workflow</TableHead>
                      {mappedColumns.map(column => (
                        <TableHead key={column.key}>{column.label}</TableHead>
                      ))}
                      <TableHead>Template</TableHead>
                      <TableHead>Submitter</TableHead>
                      <TableHead>Missing information</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Current stage</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRows.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={mappedColumns.length + 8}
                          className="h-32 text-center text-muted-foreground"
                        >
                          No forms match the current filters.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRows.map(row => {
                        const mappedValues = new Map(
                          row.mappedFields.map(field => [
                            field.key,
                            field.value,
                          ])
                        );
                        const canProcess = Boolean(
                          row.workflowId &&
                            row.activeStage &&
                            row.missingFields.length === 0 &&
                            ["ready", "in_progress"].includes(
                              row.processingStatus
                            )
                        );
                        return (
                          <TableRow key={row.submissionId}>
                            <TableCell>
                              <div className="font-medium">
                                {row.workflowNumber || "No workflow"}
                              </div>
                              <div className="max-w-56 truncate text-xs text-muted-foreground">
                                {row.workflowTitle}
                              </div>
                            </TableCell>
                            {mappedColumns.map(column => (
                              <TableCell key={column.key}>
                                {formatMappedValue(
                                  mappedValues.get(column.key)
                                )}
                              </TableCell>
                            ))}
                            <TableCell>{row.templateName}</TableCell>
                            <TableCell>
                              <div>{row.submitterName}</div>
                              <div className="text-xs text-muted-foreground">
                                {row.submitterEmail}
                              </div>
                            </TableCell>
                            <TableCell>
                              {row.missingFields.length ? (
                                <div className="flex max-w-64 items-start gap-2 text-sm text-amber-800">
                                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                                  <span>
                                    {row.missingFields
                                      .map(field => field.label)
                                      .join(", ")}
                                  </span>
                                </div>
                              ) : (
                                <span className="flex items-center gap-2 text-sm text-emerald-700">
                                  <CheckCircle2 className="h-4 w-4" /> Complete
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={statusClasses[row.processingStatus]}
                              >
                                {statusLabels[row.processingStatus]}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {row.activeStage?.name || "—"}
                            </TableCell>
                            <TableCell>
                              <div className="flex justify-end gap-2">
                                {row.workflowId && (
                                  <Button asChild size="sm" variant="outline">
                                    <Link href={`/workflows/${row.workflowId}`}>
                                      View
                                    </Link>
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  disabled={
                                    !canProcess || processStage.isPending
                                  }
                                  onClick={() => handleProcess(row)}
                                >
                                  {row.activeStage?.isFinal
                                    ? "Mark Processed"
                                    : "Process Stage"}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </DashboardLayout>
  );
}
