import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";

export function HelpButton() {
  return (
    <a
      href="https://tech.compawnion.id"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50"
    >
      <Button
        size="lg"
        className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow"
        title="Get Help & Support"
      >
        <HelpCircle className="h-6 w-6" />
      </Button>
    </a>
  );
}
