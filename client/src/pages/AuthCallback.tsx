import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabaseClient";
import { Loader2 } from "lucide-react";

export default function AuthCallback() {
  const [, setLocation] = useLocation();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check if we have a hash with auth tokens
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");

        if (accessToken && refreshToken) {
          // Set the session using the tokens from the URL
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            console.error("Error setting session:", sessionError);
            setError("Failed to complete sign in. Please try again.");
            setTimeout(() => setLocation("/"), 3000);
            return;
          }

          if (data.session) {
            // Check if email is from @compawnion.co domain
            const email = data.session.user.email;
            if (email && !email.endsWith("@compawnion.co")) {
              await supabase.auth.signOut();
              setError("Only @compawnion.co email addresses are allowed");
              setTimeout(() => setLocation("/"), 3000);
              return;
            }

            // Clear the hash from URL
            window.history.replaceState(null, "", window.location.pathname);
            
            // Redirect to dashboard
            setLocation("/dashboard");
          } else {
            setError("No session found. Please try signing in again.");
            setTimeout(() => setLocation("/"), 3000);
          }
        } else {
          // No tokens in URL, check if we already have a session
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session) {
            setLocation("/dashboard");
          } else {
            setLocation("/");
          }
        }
      } catch (error) {
        console.error("Unexpected error in auth callback:", error);
        setError("An unexpected error occurred. Please try again.");
        setTimeout(() => setLocation("/"), 3000);
      }
    };

    handleCallback();
  }, [setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        {error ? (
          <>
            <p className="text-destructive mb-4">{error}</p>
            <p className="text-sm text-muted-foreground">Redirecting...</p>
          </>
        ) : (
          <>
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Completing sign in...</p>
          </>
        )}
      </div>
    </div>
  );
}
