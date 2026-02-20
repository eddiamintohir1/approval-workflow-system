import { useCognitoAuth } from "@/hooks/useCognitoAuth";
import { trpc } from "@/lib/trpc";

export interface UserWithRole {
  id: number;
  open_id: string;
  name: string | null;
  email: string | null;
  role: string;
  is_active: boolean;
}

export function useUserRole() {
  const { user: cognitoUser, loading: authLoading } = useCognitoAuth();

  // Call EC2 backend to get or create user
  const { data: userWithRole, isLoading: userLoading } = trpc.auth.me.useQuery(undefined, {
    enabled: !!cognitoUser && !authLoading,
    retry: 1,
  });

  return { 
    user: userWithRole as UserWithRole | null, 
    loading: authLoading || userLoading 
  };
}
