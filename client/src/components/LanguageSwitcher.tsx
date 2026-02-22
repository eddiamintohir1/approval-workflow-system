import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Languages } from "lucide-react";

declare global {
  interface Window {
    google: any;
    googleTranslateElementInit: () => void;
  }
}

export function LanguageSwitcher() {
  const [currentLang, setCurrentLang] = useState<'en' | 'id'>('en');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load Google Translate script
    const script = document.createElement('script');
    script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;
    document.body.appendChild(script);

    // Initialize Google Translate
    window.googleTranslateElementInit = () => {
      new window.google.translate.TranslateElement(
        {
          pageLanguage: 'en',
          includedLanguages: 'en,id',
          layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
          autoDisplay: false,
        },
        'google_translate_element'
      );
      setIsLoaded(true);
    };

    return () => {
      // Cleanup
      const existingScript = document.querySelector('script[src*="translate.google.com"]');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);

  const changeLanguage = (lang: 'en' | 'id') => {
    if (!isLoaded) return;

    const select = document.querySelector('.goog-te-combo') as HTMLSelectElement;
    if (select) {
      select.value = lang;
      select.dispatchEvent(new Event('change'));
      setCurrentLang(lang);
      localStorage.setItem('preferredLanguage', lang);
    }
  };

  useEffect(() => {
    // Restore saved language preference
    const saved = localStorage.getItem('preferredLanguage') as 'en' | 'id';
    if (saved && isLoaded) {
      setTimeout(() => changeLanguage(saved), 500);
    }
  }, [isLoaded]);

  return (
    <div className="flex items-center gap-2">
      {/* Hidden Google Translate widget */}
      <div id="google_translate_element" className="hidden"></div>
      
      {/* Custom language buttons */}
      <div className="flex items-center gap-1 border rounded-lg p-1 bg-background">
        <Button
          variant={currentLang === 'en' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => changeLanguage('en')}
          className="h-7 px-3 text-xs font-medium"
        >
          EN
        </Button>
        <Button
          variant={currentLang === 'id' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => changeLanguage('id')}
          className="h-7 px-3 text-xs font-medium"
        >
          ID
        </Button>
      </div>
    </div>
  );
}
