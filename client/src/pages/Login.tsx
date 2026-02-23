/* IP Owner: Eddie Amintohir */
import { useState, useEffect, useMemo } from "react";
import { useLocation, Link } from "wouter";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cognitoAuth } from "@/lib/cognito";
import { Lock, Loader2 } from "lucide-react";

// Array of dog images for login page background
const DOG_IMAGES = [
  "https://files.manuscdn.com/user_upload_by_module/session_file/94657144/IcJBoVhhvCyiorNO.png",
  "https://files.manuscdn.com/user_upload_by_module/session_file/94657144/dFzicHDXrCqYgrnf.png",
];

export default function Login() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pick a random dog image on component mount
  const randomDogImage = useMemo(() => {
    return DOG_IMAGES[Math.floor(Math.random() * DOG_IMAGES.length)];
  }, []);

  // Check if user is already logged in
  useEffect(() => {
    cognitoAuth.getCurrentUser().then((user) => {
      if (user) {
        setLocation("/dashboard");
      }
    });
  }, [setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted with email:', email);
    setError(null);
    setLoading(true);

    try {
      console.log('Attempting Cognito sign in...');
      const result = await cognitoAuth.signIn(email, password);
      console.log('Sign in successful:', result);
      setLocation("/dashboard");
    } catch (err: any) {
      console.error('Sign in error:', err);
      setError(err.message || "Failed to sign in");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-600 via-cyan-500 to-teal-400 relative overflow-hidden">
      {/* Random dog image */}
      <img
        src={randomDogImage}
        alt="Companion dog"
        className="absolute bottom-0 left-0 w-64 h-auto object-contain pointer-events-none opacity-90 hidden md:block"
        style={{ maxWidth: '300px', maxHeight: '40vh' }}
      />
      <Card className="w-full max-w-md relative z-10">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">CJB Workflow Hub</CardTitle>
          <CardDescription>
            {t('auth.onlyCompawnion')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t('auth.enterEmail')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">{t('auth.password')}</Label>
                <Link href="/forgot-password">
                  <span className="text-sm text-primary hover:underline cursor-pointer">
                    {t('auth.forgotPassword')}
                  </span>
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder={t('auth.enterPassword')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  {t('auth.signIn')}
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground mt-4">
              Only @compawnion.co email addresses are allowed to access this system.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
