import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, ExternalLink, Loader2, LogIn } from "lucide-react";
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

export default function ForgotPassword() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = async () => {
    setLoading(true);
    setError(null);
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to login
            </Link>
          </Button>
          <CardTitle className="text-2xl">
            Recover your Microsoft account
          </CardTitle>
          <CardDescription>
            This app does not store passwords or send verification codes.
            Microsoft manages account recovery for your @compawnion.co account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
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

          <Button asChild variant="outline" className="w-full">
            <a
              href="https://passwordreset.microsoftonline.com/"
              target="_blank"
              rel="noreferrer"
            >
              Reset Microsoft password
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
