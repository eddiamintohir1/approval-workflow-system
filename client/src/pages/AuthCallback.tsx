import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { entraAuth } from "@/lib/entra";

export default function AuthCallback() {
  const [, setLocation] = useLocation();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    entraAuth
      .getCurrentUser()
      .then(user => {
        if (!user)
          throw new Error("Microsoft did not return a signed-in account.");
        window.history.replaceState(null, "", "/auth/callback");
        setLocation("/dashboard");
      })
      .catch(cause => {
        console.error("Microsoft sign-in callback failed", cause);
        setError(
          cause instanceof Error ? cause.message : "Microsoft sign-in failed."
        );
      });
  }, [setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center max-w-md px-4">
        {error ? (
          <>
            <p className="text-destructive mb-4">{error}</p>
            <a className="text-primary hover:underline" href="/login">
              Return to login
            </a>
          </>
        ) : (
          <>
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">
              Completing Microsoft sign-in…
            </p>
          </>
        )}
      </div>
    </div>
  );
}
