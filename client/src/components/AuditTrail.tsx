import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  FileText, 
  CheckCircle, 
  XCircle, 
  Upload, 
  Trash2, 
  MessageSquare, 
  User, 
  Settings,
  Clock,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";

interface AuditTrailProps {
  workflowId: string;
}

export function AuditTrail({ workflowId }: AuditTrailProps) {
  const { data: auditLogs, isLoading } = trpc.auditLogs.getByEntity.useQuery({
    entityType: "workflow",
    entityId: workflowId,
  });

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "uploaded":
      case "file_uploaded":
        return <Upload className="h-4 w-4 text-blue-500" />;
      case "deleted":
      case "file_deleted":
        return <Trash2 className="h-4 w-4 text-red-500" />;
      case "commented":
        return <MessageSquare className="h-4 w-4 text-purple-500" />;
      case "created":
        return <FileText className="h-4 w-4 text-blue-500" />;
      case "updated":
      case "status_changed":
        return <Settings className="h-4 w-4 text-orange-500" />;
      case "role_changed":
        return <User className="h-4 w-4 text-indigo-500" />;
      case "discontinued":
      case "archived":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActionBadgeColor = (action: string) => {
    switch (action.toLowerCase()) {
      case "approved":
        return "bg-green-100 text-green-800 border-green-300";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-300";
      case "uploaded":
      case "file_uploaded":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "deleted":
      case "file_deleted":
        return "bg-red-100 text-red-800 border-red-300";
      case "commented":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "created":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "updated":
      case "status_changed":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "role_changed":
        return "bg-indigo-100 text-indigo-800 border-indigo-300";
      case "discontinued":
      case "archived":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Audit Trail</CardTitle>
          <CardDescription>Loading activity history...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!auditLogs || auditLogs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Audit Trail</CardTitle>
          <CardDescription>Complete history of all actions on this workflow</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No activity recorded yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit Trail</CardTitle>
        <CardDescription>
          Complete history of all actions on this workflow ({auditLogs.length} {auditLogs.length === 1 ? 'event' : 'events'})
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-4">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="flex gap-4 pb-4 border-b last:border-0 last:pb-0"
              >
                <div className="flex-shrink-0 mt-1">
                  {getActionIcon(log.action)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={getActionBadgeColor(log.action)}>
                      {log.action}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(log.createdAt), "MMM d, yyyy 'at' h:mm a")}
                    </span>
                  </div>
                  
                  {log.actionDescription && (
                    <p className="text-sm text-foreground mb-2">
                      {log.actionDescription}
                    </p>
                  )}
                  
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">{log.actorEmail || "System"}</span>
                    {log.actorRole && (
                      <span className="ml-1">
                        ({log.actorRole})
                      </span>
                    )}
                  </div>
                  
                  {/* Show old/new values if they exist */}
                  {(log.oldValues || log.newValues) && (
                    <div className="mt-2 p-2 bg-muted rounded-md text-xs space-y-1">
                      {log.oldValues && Object.keys(log.oldValues).length > 0 && (
                        <div>
                          <span className="font-semibold">Previous: </span>
                          <span className="text-muted-foreground">
                            {JSON.stringify(log.oldValues)}
                          </span>
                        </div>
                      )}
                      {log.newValues && Object.keys(log.newValues).length > 0 && (
                        <div>
                          <span className="font-semibold">Updated: </span>
                          <span className="text-muted-foreground">
                            {JSON.stringify(log.newValues)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
