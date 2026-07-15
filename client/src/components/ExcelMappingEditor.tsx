import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BUILTIN_MAPPING_KEYS,
  type ExcelWorkbookMapping,
} from "@shared/excelMapping";

type TargetType = "none" | "cell" | "named_range" | "table_column";

interface DraftMapping {
  targetType: TargetType;
  sheetName: string;
  cellAddress: string;
  namedRange: string;
  tableName: string;
  columnName: string;
  sourcePath: string;
  valueType: "auto" | "text" | "number" | "date";
}

interface ExcelMappingEditorProps {
  template: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

const emptyMapping = (): DraftMapping => ({
  targetType: "none",
  sheetName: "",
  cellAddress: "",
  namedRange: "",
  tableName: "",
  columnName: "",
  sourcePath: "",
  valueType: "auto",
});

function toDraft(mapping: ExcelWorkbookMapping): DraftMapping {
  return {
    ...emptyMapping(),
    ...mapping,
    targetType: mapping.targetType,
  };
}

export function ExcelMappingEditor({
  template,
  open,
  onOpenChange,
  onSaved,
}: ExcelMappingEditorProps) {
  const [formTemplateId, setFormTemplateId] = useState("");
  const [outputPattern, setOutputPattern] = useState("");
  const [drafts, setDrafts] = useState<Record<string, DraftMapping>>({});
  const { data: formTemplates = [] } = trpc.formTemplates.getAll.useQuery(
    undefined,
    { enabled: open }
  );
  const { data: metadata, isLoading: isInspecting } =
    trpc.excelTemplates.inspectWorkbook.useQuery(
      { id: template?.id || 0 },
      { enabled: open && Boolean(template?.id), retry: false }
    );
  const selectedFormTemplate = formTemplates.find(
    item => item.id === formTemplateId
  );
  const saveMapping = trpc.excelTemplates.saveMapping.useMutation({
    onSuccess: () => {
      toast.success("Workbook mapping saved");
      onSaved();
      onOpenChange(false);
    },
    onError: error => toast.error(error.message),
  });

  useEffect(() => {
    if (!open || !template) return;
    let stored: ExcelWorkbookMapping[] = [];
    if (Array.isArray(template.workbookMappings)) {
      stored = template.workbookMappings;
    } else if (typeof template.workbookMappings === "string") {
      try {
        stored = JSON.parse(template.workbookMappings);
      } catch {
        toast.error(
          "The saved workbook mapping is invalid and must be configured again"
        );
      }
    }
    setFormTemplateId(template.formTemplateId || "");
    setOutputPattern(template.outputFileNamePattern || "");
    setDrafts(
      Object.fromEntries(
        stored.map((mapping: ExcelWorkbookMapping) => [
          mapping.mappingKey,
          toDraft(mapping),
        ])
      )
    );
  }, [open, template]);

  const sources = useMemo(() => {
    const fields = (selectedFormTemplate?.fields || [])
      .filter(field => Boolean(field.mappingKey))
      .map(field => ({ key: field.mappingKey!, label: field.label }));
    return [
      ...fields,
      ...BUILTIN_MAPPING_KEYS.map(key => ({
        key,
        label: `System: ${key.replaceAll("_", " ")}`,
      })),
    ];
  }, [selectedFormTemplate]);

  const updateDraft = (key: string, update: Partial<DraftMapping>) => {
    setDrafts(current => ({
      ...current,
      [key]: { ...(current[key] || emptyMapping()), ...update },
    }));
  };

  const handleSave = () => {
    if (!template || !formTemplateId) {
      toast.error("Select a form template first");
      return;
    }
    const mappings: ExcelWorkbookMapping[] = [];
    for (const source of sources) {
      const draft = drafts[source.key];
      if (!draft || draft.targetType === "none") continue;
      if (draft.targetType === "cell") {
        mappings.push({
          mappingKey: source.key,
          targetType: "cell",
          sheetName: draft.sheetName,
          cellAddress: draft.cellAddress.toUpperCase(),
          valueType: draft.valueType,
        });
      } else if (draft.targetType === "named_range") {
        mappings.push({
          mappingKey: source.key,
          targetType: "named_range",
          namedRange: draft.namedRange,
          valueType: draft.valueType,
        });
      } else {
        mappings.push({
          mappingKey: source.key,
          targetType: "table_column",
          sheetName: draft.sheetName,
          tableName: draft.tableName,
          columnName: draft.columnName,
          sourcePath: draft.sourcePath || undefined,
          valueType: draft.valueType,
        });
      }
    }
    if (mappings.length === 0) {
      toast.error("Map at least one field");
      return;
    }
    saveMapping.mutate({
      id: template.id,
      formTemplateId,
      mappings,
      outputFileNamePattern: outputPattern || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configure Excel mapping</DialogTitle>
          <DialogDescription>
            Link {template?.templateName || "this workbook"} to a form and
            choose where each value is written.
          </DialogDescription>
        </DialogHeader>

        {isInspecting ? (
          <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" /> Inspecting workbook…
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Form template</Label>
                <Select
                  value={formTemplateId}
                  onValueChange={setFormTemplateId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a form" />
                  </SelectTrigger>
                  <SelectContent>
                    {formTemplates.map(item => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.templateName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="output-pattern">Output filename pattern</Label>
                <Input
                  id="output-pattern"
                  value={outputPattern}
                  onChange={event => setOutputPattern(event.target.value)}
                  placeholder="{templateName}_{workflowNumber}_{date}.xlsx"
                />
              </div>
            </div>

            {selectedFormTemplate && (
              <div className="space-y-3">
                <div>
                  <h3 className="font-medium">Field targets</h3>
                  <p className="text-sm text-muted-foreground">
                    Workbook sheets:{" "}
                    {metadata?.worksheetNames.join(", ") || "None found"}
                  </p>
                </div>
                {sources.map(source => {
                  const draft = drafts[source.key] || emptyMapping();
                  const selectedTable = metadata?.tables.find(
                    table =>
                      table.sheetName === draft.sheetName &&
                      table.tableName === draft.tableName
                  );
                  return (
                    <div
                      key={source.key}
                      className="grid gap-3 rounded-lg border p-4 lg:grid-cols-[minmax(180px,1.3fr)_160px_1fr_130px]"
                    >
                      <div>
                        <p className="font-medium">{source.label}</p>
                        <p className="font-mono text-xs text-muted-foreground">
                          {source.key}
                        </p>
                      </div>
                      <Select
                        value={draft.targetType}
                        onValueChange={(value: TargetType) =>
                          updateDraft(source.key, { targetType: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Not mapped</SelectItem>
                          <SelectItem value="cell">Cell</SelectItem>
                          <SelectItem value="named_range">
                            Named range
                          </SelectItem>
                          <SelectItem value="table_column">
                            Table column
                          </SelectItem>
                        </SelectContent>
                      </Select>

                      {draft.targetType === "cell" && (
                        <div className="grid grid-cols-2 gap-2">
                          <Select
                            value={draft.sheetName}
                            onValueChange={sheetName =>
                              updateDraft(source.key, { sheetName })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Sheet" />
                            </SelectTrigger>
                            <SelectContent>
                              {metadata?.worksheetNames.map(name => (
                                <SelectItem key={name} value={name}>
                                  {name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            aria-label={`${source.label} cell address`}
                            placeholder="B5"
                            value={draft.cellAddress}
                            onChange={event =>
                              updateDraft(source.key, {
                                cellAddress: event.target.value,
                              })
                            }
                          />
                        </div>
                      )}
                      {draft.targetType === "named_range" && (
                        <Select
                          value={draft.namedRange}
                          onValueChange={namedRange =>
                            updateDraft(source.key, { namedRange })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Named range" />
                          </SelectTrigger>
                          <SelectContent>
                            {metadata?.definedNames.map(item => (
                              <SelectItem key={item.name} value={item.name}>
                                {item.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      {draft.targetType === "table_column" && (
                        <div className="grid grid-cols-3 gap-2">
                          <Select
                            value={
                              draft.tableName
                                ? JSON.stringify([
                                    draft.sheetName,
                                    draft.tableName,
                                  ])
                                : ""
                            }
                            onValueChange={value => {
                              const [sheetName, tableName] = JSON.parse(value);
                              updateDraft(source.key, {
                                sheetName,
                                tableName,
                                columnName: "",
                              });
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Table" />
                            </SelectTrigger>
                            <SelectContent>
                              {metadata?.tables.map(table => (
                                <SelectItem
                                  key={`${table.sheetName}-${table.tableName}`}
                                  value={JSON.stringify([
                                    table.sheetName,
                                    table.tableName,
                                  ])}
                                >
                                  {table.sheetName} / {table.tableName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select
                            value={draft.columnName}
                            onValueChange={columnName =>
                              updateDraft(source.key, { columnName })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Column" />
                            </SelectTrigger>
                            <SelectContent>
                              {selectedTable?.columns.map(column => (
                                <SelectItem key={column} value={column}>
                                  {column}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            aria-label={`${source.label} item property`}
                            placeholder="Item property"
                            value={draft.sourcePath}
                            onChange={event =>
                              updateDraft(source.key, {
                                sourcePath: event.target.value,
                              })
                            }
                          />
                        </div>
                      )}
                      {draft.targetType === "none" && (
                        <div className="text-sm text-muted-foreground">
                          No workbook value
                        </div>
                      )}

                      <Select
                        value={draft.valueType}
                        disabled={draft.targetType === "none"}
                        onValueChange={(value: DraftMapping["valueType"]) =>
                          updateDraft(source.key, { valueType: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="auto">Keep original</SelectItem>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="number">Number</SelectItem>
                          <SelectItem value="date">Date</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={isInspecting || saveMapping.isPending}
            onClick={handleSave}
          >
            {saveMapping.isPending ? "Saving…" : "Validate and save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
