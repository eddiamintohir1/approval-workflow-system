import { useEntraAuth } from "@/hooks/useEntraAuth";
import { trpc } from "@/lib/trpc";

export function useUserRole() {
  const { user: entraUser, loading: authLoading } = useEntraAuth();

  // Call backend to get user with role from database
  const {
    data: userWithRole,
    isLoading: userLoading,
    refetch,
  } = trpc.users.me.useQuery(undefined, {
    enabled: !!entraUser && !authLoading,
    retry: 1,
  });

  return {
    user: userWithRole || null,
    loading: authLoading || userLoading,
    refetch,
  };
}
