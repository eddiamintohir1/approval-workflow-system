import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Loader2, ArrowLeft, UserCheck, UserX } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { useUserRole } from "@/hooks/useUserRole";

export default function UserManagement() {
  const { user } = useUserRole();

  const { data: users, isLoading, refetch } = trpc.users.list.useQuery();

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

  if (!user || (user.role !== "admin" && user.role !== "director")) {
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
            <CardTitle>Users</CardTitle>
            <CardDescription>Manage user roles and activation status</CardDescription>
          </CardHeader>
          <CardContent>
            {users && users.length > 0 ? (
              <div className="space-y-4">
                {users.map((u) => (
                  <div key={u.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">{u.name || "No Name"}</p>
                        {u.is_active ? (
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
                        variant={u.is_active ? "destructive" : "default"}
                        onClick={() => {
                          updateStatus.mutate({ userId: u.id, isActive: !u.is_active });
                        }}
                      >
                        {u.is_active ? (
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
    </div>
  );
}
