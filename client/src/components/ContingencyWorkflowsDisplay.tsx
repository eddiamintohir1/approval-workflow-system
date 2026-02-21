import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, AlertCircle, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";

interface ContingencyWorkflowsDisplayProps {
  workflowIds: string[];
}

export function ContingencyWorkflowsDisplay({ workflowIds }: ContingencyWorkflowsDisplayProps) {
  const { data: workflows, isLoading } = trpc.workflows.getByIds.useQuery({ ids: workflowIds });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pre-completion Contingencies</CardTitle>
          <CardDescription>Loading contingency workflows...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!workflows || workflows.length === 0) {
    return null;
  }

  const allCompleted = workflows.every(w => w?.overallStatus === "completed");
  const incompleteWorkflows = workflows.filter(w => w && w.overallStatus !== "completed");

  return (
    <Card className={!allCompleted ? "border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20" : ""}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {allCompleted ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-amber-600" />
              )}
              Pre-completion Contingencies
            </CardTitle>
            <CardDescription>
              {allCompleted
                ? "All contingency workflows have been completed"
                : `${incompleteWorkflows.length} workflow(s) must be completed before this workflow can be finished`}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {workflows.map((workflow) => {
            if (!workflow) return null;
            
            const isCompleted = workflow.overallStatus === "completed";
            
            return (
              <div
                key={workflow.id}
                className="flex items-center justify-between p-3 border rounded-lg bg-card"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {isCompleted ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{workflow.title}</p>
                      <p className="text-xs text-muted-foreground">{workflow.workflowNumber}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-3">
                  <Badge
                    variant={isCompleted ? "default" : "secondary"}
                    className={isCompleted ? "bg-green-600" : ""}
                  >
                    {workflow.overallStatus}
                  </Badge>
                  <Link href={`/workflows/${workflow.id}`}>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
