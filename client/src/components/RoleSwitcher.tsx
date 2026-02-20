import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useUserRole } from "@/hooks/useUserRole";

const AVAILABLE_ROLES = [
  { value: "admin", label: "Admin" },
  { value: "CEO", label: "CEO" },
  { value: "COO", label: "COO" },
  { value: "CFO", label: "CFO" },
  { value: "PPIC", label: "PPIC" },
  { value: "Purchasing", label: "Purchasing" },
  { value: "GA", label: "GA (General Affairs)" },
  { value: "Finance", label: "Finance" },
  { value: "Production", label: "Production" },
  { value: "Logistics", label: "Logistics" },
];

export function RoleSwitcher() {
  const { user, refetch } = useUserRole();
  const [isChanging, setIsChanging] = useState(false);

  const switchRole = trpc.users.switchRole.useMutation({
    onSuccess: async () => {
      toast.success("Role switched successfully");
      setIsChanging(false);
      // Refresh the page to apply new role permissions
      window.location.reload();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to switch role");
      setIsChanging(false);
    },
  });

  const handleRoleChange = (newRole: string) => {
    setIsChanging(true);
    switchRole.mutate({ role: newRole as "CEO" | "COO" | "CFO" | "PPIC" | "Purchasing" | "GA" | "Finance" | "Production" | "Logistics" | "admin" });
  };

  if (!user) return null;

  // Only show role switcher for test user
  if (user.email !== "test@compawnion.co") return null;

  return (
    <div className="flex items-center gap-2 px-4 py-2 border-b bg-yellow-50 dark:bg-yellow-950/20">
      <Label htmlFor="roleSwitcher" className="text-sm font-medium whitespace-nowrap">
        🧪 Test Mode - Current Role:
      </Label>
      <Select
        value={user.role}
        onValueChange={handleRoleChange}
        disabled={isChanging}
      >
        <SelectTrigger id="roleSwitcher" className="w-[200px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {AVAILABLE_ROLES.map((role) => (
            <SelectItem key={role.value} value={role.value}>
              {role.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isChanging && (
        <span className="text-sm text-muted-foreground">Switching...</span>
      )}
    </div>
  );
}
