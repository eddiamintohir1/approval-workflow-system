import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { Mail, Loader2, CheckCircle, Lock } from "lucide-react";

export default function Login() {
  const { signInWithMagicLink, signInWithPassword } = useSupabaseAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPasswordLogin, setShowPasswordLogin] = useState(false);

  const handleMagicLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    const result = await signInWithMagicLink(email);

    if (result.success) {
      setSuccess(true);
      setEmail("");
    } else {
      setError(result.error || "Failed to send magic link");
    }

    setLoading(false);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signInWithPassword(email, password);

    if (result.success) {
      // Redirect will happen automatically via auth state change
    } else {
      setError(result.error || "Failed to sign in");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Approval Workflow System</CardTitle>
          <CardDescription>
            Sign in with your @compawnion.co email address
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Magic link sent! Check your email inbox for the sign-in link.
              </AlertDescription>
            </Alert>
          ) : (
            <form onSubmit={showPasswordLogin ? handlePasswordSubmit : handleMagicLinkSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.name@compawnion.co"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              {showPasswordLogin && (
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {showPasswordLogin ? "Signing in..." : "Sending magic link..."}
                  </>
                ) : (
                  <>
                    {showPasswordLogin ? (
                      <>
                        <Lock className="mr-2 h-4 w-4" />
                        Sign In
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        Send Magic Link
                      </>
                    )}
                  </>
                )}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordLogin(!showPasswordLogin);
                    setError(null);
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground underline"
                  disabled={loading}
                >
                  {showPasswordLogin ? "Use magic link instead" : "Developer login with password"}
                </button>
              </div>

              <p className="text-xs text-center text-muted-foreground mt-4">
                Only @compawnion.co email addresses are allowed to access this system.
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
