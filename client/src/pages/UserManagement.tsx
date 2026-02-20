import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Loader2, ArrowLeft, UserCheck, UserX, RefreshCw } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { useUserRole } from "@/hooks/useUserRole";

export default function UserManagement() {
  const { user } = useUserRole();

  const { data: users, isLoading, refetch } = trpc.users.getAll.useQuery();

  const updateRole = trpc.users.updateRole.useMutation({
    onSuccess: () => {
      toast.success("User role updated successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateStatus = trpc.users.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("User status updated successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const syncFromCognito = trpc.users.syncFromCognito.useMutation({
    onSuccess: (data) => {
      toast.success(`Successfully synced ${data.syncedCount} users from Cognito`);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You don't have permission to access this page.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button>Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const roleOptions = [
    { value: "admin", label: "Admin" },
    { value: "brand_manager", label: "Brand Manager" },
    { value: "ppic_manager", label: "PPIC Manager" },
    { value: "production_manager", label: "Production Manager" },
    { value: "purchasing_manager", label: "Purchasing Manager" },
    { value: "sales_manager", label: "Sales Manager" },
    { value: "pr_manager", label: "PR Manager" },
    { value: "director", label: "Director" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-sm text-muted-foreground">Manage user roles and access</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Users</CardTitle>
                <CardDescription>Manage user roles and activation status</CardDescription>
              </div>
              <Button
                onClick={() => syncFromCognito.mutate()}
                disabled={syncFromCognito.isPending}
                variant="outline"
              >
                {syncFromCognito.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Sync from Cognito
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {users && users.length > 0 ? (
              <div className="space-y-4">
                {users.map((u) => (
                  <div key={u.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">{u.fullName || u.email}</p>
                        {u.isActive ? (
                          <Badge variant="outline" className="text-green-600">Active</Badge>
                        ) : (
                          <Badge variant="destructive">Inactive</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{u.email}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Select
                        value={u.role}
                        onValueChange={(value) => {
                          updateRole.mutate({ userId: u.id, role: value as any });
                        }}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {roleOptions.map((role) => (
                            <SelectItem key={role.value} value={role.value}>
                              {role.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        variant={u.isActive ? "destructive" : "default"}
                        onClick={() => {
                          updateStatus.mutate({ userId: u.id, isActive: !u.isActive });
                        }}
                      >
                        {u.isActive ? (
                          <>
                            <UserX className="h-4 w-4 mr-1" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <UserCheck className="h-4 w-4 mr-1" />
                            Activate
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No users found</p>
            )}
          </CardContent>
        </Card>
      </main>
      
      {/* Copyright Footer */}
      <footer className="border-t bg-card mt-8">
        <div className="container mx-auto px-4 py-4 text-center text-sm text-muted-foreground">
          © Eddie Amintohir. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
