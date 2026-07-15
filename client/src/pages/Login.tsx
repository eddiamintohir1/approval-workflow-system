/* IP Owner: Eddie Amintohir */
import { useMemo, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { entraAuth, entraConfiguration } from "@/lib/entra";
import { ExternalLink, Loader2, LogIn } from "lucide-react";

const DOG_IMAGES = [
  "https://files.manuscdn.com/user_upload_by_module/session_file/94657144/IcJBoVhhvCyiorNO.png",
  "https://files.manuscdn.com/user_upload_by_module/session_file/94657144/dFzicHDXrCqYgrnf.png",
];

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const randomDogImage = useMemo(
    () => DOG_IMAGES[Math.floor(Math.random() * DOG_IMAGES.length)],
    []
  );

  const signIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await entraAuth.signIn();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Microsoft sign-in failed."
      );
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-600 via-cyan-500 to-teal-400 relative overflow-hidden">
      <img
        src={randomDogImage}
        alt="Companion dog"
        className="absolute bottom-0 left-0 w-64 h-auto object-contain pointer-events-none opacity-90 hidden md:block"
        style={{ maxWidth: "300px", maxHeight: "40vh" }}
      />
      <Card className="w-full max-w-md relative z-10">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">CJB Workflow Hub</CardTitle>
          <CardDescription>
            Sign in with your Compawnion Microsoft 365 account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!entraConfiguration.configured && (
            <Alert variant="destructive">
              <AlertDescription>
                Microsoft sign-in is awaiting the Entra tenant and application
                configuration.
              </AlertDescription>
            </Alert>
          )}

          <Button
            type="button"
            className="w-full"
            onClick={signIn}
            disabled={loading || !entraConfiguration.configured}
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <LogIn className="mr-2 h-4 w-4" />
            )}
            Continue with Microsoft
          </Button>

          <a
            href="https://passwordreset.microsoftonline.com/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-1 text-sm text-primary hover:underline"
          >
            Can&apos;t access your Microsoft account?
            <ExternalLink className="h-3.5 w-3.5" />
          </a>

          <p className="text-xs text-center text-muted-foreground">
            Access is restricted to @compawnion.co Microsoft accounts.
            Passwords, verification and MFA are managed securely by Microsoft.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
