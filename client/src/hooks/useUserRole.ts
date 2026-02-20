import { useCognitoAuth } from "@/hooks/useCognitoAuth";
import { trpc } from "@/lib/trpc";

export function useUserRole() {
  const { user: cognitoUser, loading: authLoading } = useCognitoAuth();

  // Call backend to get user with role from database
  const { data: userWithRole, isLoading: userLoading, refetch } = trpc.users.me.useQuery(undefined, {
    enabled: !!cognitoUser && !authLoading,
    retry: 1,
  });

  return { 
    user: userWithRole || null, 
    loading: authLoading || userLoading,
    refetch
  };
}
