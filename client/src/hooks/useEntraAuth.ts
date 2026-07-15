import { useEffect, useState } from "react";
import { entraAuth, type EntraAuthUser } from "@/lib/entra";

export function useEntraAuth() {
  const [user, setUser] = useState<EntraAuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    entraAuth
      .getCurrentUser()
      .then(currentUser => {
        if (mounted) setUser(currentUser);
      })
      .catch(error => {
        console.error("Microsoft authentication check failed", error);
        if (mounted) setUser(null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const signOut = async () => {
    setUser(null);
    await entraAuth.signOut();
  };

  return { user, loading, signOut };
}
