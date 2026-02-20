import { Check, Circle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface Stage {
  id: string;
  stageName: string;
  status: string;
  stageOrder: number;
  requiredRole: string;
}

interface WorkflowProgressTrailProps {
  stages: Stage[];
  className?: string;
}

export function WorkflowProgressTrail({ stages, className }: WorkflowProgressTrailProps) {
  const sortedStages = [...stages].sort((a, b) => a.stageOrder - b.stageOrder);

  const getStageIcon = (status: string, index: number) => {
    if (status === "approved" || status === "completed") {
      return <Check className="h-5 w-5 text-white" />;
    } else if (status === "in_progress" || status === "pending") {
      return <Clock className="h-5 w-5 text-white" />;
    } else if (status === "rejected") {
      return <Circle className="h-5 w-5 text-white" />;
    }
    return <Circle className="h-5 w-5 text-white" />;
  };

  const getStageColor = (status: string) => {
    const colors: Record<string, string> = {
      approved: "bg-green-500 border-green-600",
      completed: "bg-green-600 border-green-700",
      in_progress: "bg-blue-500 border-blue-600",
      pending: "bg-gray-400 border-gray-500",
      rejected: "bg-red-500 border-red-600",
    };
    return colors[status] || "bg-gray-300 border-gray-400";
  };

  const getConnectorColor = (currentStatus: string, nextStatus: string) => {
    if (currentStatus === "approved" || currentStatus === "completed") {
      if (nextStatus === "approved" || nextStatus === "completed" || nextStatus === "in_progress") {
        return "bg-green-500";
      }
    }
    return "bg-gray-300";
  };

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between relative">
        {sortedStages.map((stage, index) => {
          const isLast = index === sortedStages.length - 1;
          const nextStage = !isLast ? sortedStages[index + 1] : null;
          
          return (
            <div key={stage.id} className="flex items-center flex-1">
              {/* Stage indicator */}
              <div className="flex flex-col items-center relative z-10">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all",
                    getStageColor(stage.status)
                  )}
                >
                  {getStageIcon(stage.status, index)}
                </div>
                <div className="mt-2 text-center">
                  <div className="text-sm font-medium">{stage.stageName}</div>
                  <div className="text-xs text-muted-foreground">{stage.requiredRole}</div>
                  <div className="text-xs">
                    <span
                      className={cn(
                        "inline-block px-2 py-0.5 rounded-full text-xs font-medium",
                        stage.status === "approved" || stage.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : stage.status === "in_progress"
                          ? "bg-blue-100 text-blue-800"
                          : stage.status === "rejected"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      )}
                    >
                      {stage.status.replace("_", " ").toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Connector line */}
              {!isLast && nextStage && (
                <div className="flex-1 h-0.5 mx-2 relative top-[-30px]">
                  <div
                    className={cn(
                      "h-full transition-all",
                      getConnectorColor(stage.status, nextStage.status)
                    )}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
