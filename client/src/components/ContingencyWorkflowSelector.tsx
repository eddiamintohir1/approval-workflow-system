import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Search } from "lucide-react";
import { Card } from "@/components/ui/card";

interface ContingencyWorkflowSelectorProps {
  selectedIds: string[];
  onSelect: (ids: string[]) => void;
  currentWorkflowId: string | null; // Prevent selecting self
}

export function ContingencyWorkflowSelector({
  selectedIds,
  onSelect,
  currentWorkflowId,
}: ContingencyWorkflowSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);

  // Search workflows
  const { data: searchResults, isLoading } = trpc.workflows.search.useQuery(
    { query: searchQuery, limit: 10 },
    { enabled: searchQuery.length > 2 }
  );

  // Get selected workflows details
  const { data: selectedWorkflows } = trpc.workflows.getByIds.useQuery(
    { ids: selectedIds },
    { enabled: selectedIds.length > 0 }
  );

  const handleSelectWorkflow = (workflowId: string) => {
    if (!selectedIds.includes(workflowId) && workflowId !== currentWorkflowId) {
      onSelect([...selectedIds, workflowId]);
    }
    setSearchQuery("");
    setShowResults(false);
  };

  const handleRemoveWorkflow = (workflowId: string) => {
    onSelect(selectedIds.filter(id => id !== workflowId));
  };

  // Filter out current workflow and already selected ones
  const filteredResults = searchResults?.filter(
    w => w.id !== currentWorkflowId && !selectedIds.includes(w.id)
  ) || [];

  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor="contingencySearch">Search Workflows</Label>
        <div className="relative mt-1.5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="contingencySearch"
            placeholder="Search by workflow title or number..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowResults(true);
            }}
            onFocus={() => setShowResults(true)}
            className="pl-9"
          />
        </div>

        {/* Search Results Dropdown */}
        {showResults && searchQuery.length > 2 && (
          <Card className="absolute z-10 mt-1 max-h-60 w-full overflow-auto">
            {isLoading ? (
              <div className="p-4 text-sm text-muted-foreground">Searching...</div>
            ) : filteredResults.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">No workflows found</div>
            ) : (
              <div className="py-1">
                {filteredResults.map((workflow) => (
                  <button
                    key={workflow.id}
                    type="button"
                    onClick={() => handleSelectWorkflow(workflow.id)}
                    className="w-full px-4 py-2 text-left hover:bg-accent transition-colors"
                  >
                    <div className="font-medium text-sm">{workflow.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {workflow.workflowNumber} • {workflow.overallStatus}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Selected Workflows */}
      {selectedWorkflows && selectedWorkflows.length > 0 && (
        <div className="space-y-2">
          <Label>Selected Contingency Workflows ({selectedWorkflows.length})</Label>
          <div className="space-y-2">
            {selectedWorkflows.map((workflow) => (
              <div
                key={workflow.id}
                className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{workflow.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {workflow.workflowNumber}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-3">
                  <Badge variant={workflow.overallStatus === "completed" ? "default" : "secondary"}>
                    {workflow.overallStatus}
                  </Badge>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveWorkflow(workflow.id)}
                    className="h-7 w-7 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
