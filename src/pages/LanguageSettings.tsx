import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

interface Language {
  code: string;
  name: string;
  nativeName: string;
}

const languages: Language[] = [
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو' },
  { code: 'fa', name: 'Persian', nativeName: 'فارسی' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia' },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska' },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk' },
  { code: 'da', name: 'Danish', nativeName: 'Dansk' },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi' },
];

const LanguageSettings = () => {
  const navigate = useNavigate();
  const [selectedLanguage, setSelectedLanguage] = useState('ar');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('app_language') || 'ar';
    setSelectedLanguage(savedLanguage);
  }, []);

  const handleLanguageSelect = (code: string) => {
    setSelectedLanguage(code);
    localStorage.setItem('app_language', code);
    toast({
      title: "تم تغيير اللغة",
      description: "سيتم تطبيق التغييرات في المرة القادمة",
    });
  };

  const filteredLanguages = languages.filter(
    (lang) =>
      lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lang.nativeName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/settings')}
            >
              <ArrowRight className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold">اللغة</h1>
          </div>
          <Globe className="w-5 h-5 text-muted-foreground" />
        </div>

        {/* Search */}
        <div className="px-4 pb-4">
          <input
            type="text"
            placeholder="البحث عن لغة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 bg-muted rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Languages List */}
      <div className="p-4">
        <p className="text-sm text-muted-foreground mb-4">
          اختر اللغة المفضلة للتطبيق
        </p>

        <div className="space-y-1">
          {filteredLanguages.map((language) => (
            <button
              key={language.code}
              onClick={() => handleLanguageSelect(language.code)}
              className={`w-full flex items-center justify-between p-4 rounded-xl transition-colors ${
                selectedLanguage === language.code
                  ? 'bg-primary/10 border border-primary'
                  : 'bg-card hover:bg-muted'
              }`}
            >
              <div className="flex flex-col items-start">
                <span className="font-medium text-foreground">
                  {language.nativeName}
                </span>
                <span className="text-sm text-muted-foreground">
                  {language.name}
                </span>
              </div>
              {selectedLanguage === language.code && (
                <Check className="w-5 h-5 text-primary" />
              )}
            </button>
          ))}
        </div>

        {filteredLanguages.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">لم يتم العثور على لغات</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LanguageSettings;
