import { Button } from "@/components/ui/button";
import { Languages } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function LanguageSwitcher() {
  const handleTranslate = () => {
    // Show helpful message about browser translation
    const userAgent = navigator.userAgent.toLowerCase();
    
    let message = '';
    if (userAgent.includes('chrome') || userAgent.includes('edge')) {
      message = 'Right-click anywhere on the page and select "Translate to..." to translate this page to your language.';
    } else if (userAgent.includes('safari')) {
      message = 'Click the translate icon (aA) in the address bar to translate this page.';
    } else if (userAgent.includes('firefox')) {
      message = 'Click the translate icon in the address bar to translate this page.';
    } else {
      message = 'Use your browser\'s built-in translate feature to translate this page to your language.';
    }
    
    alert(message);
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            onClick={handleTranslate}
            className="h-9 px-3 gap-2"
          >
            <Languages className="h-4 w-4" />
            <span className="hidden sm:inline">Translate</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Translate this page using your browser</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
