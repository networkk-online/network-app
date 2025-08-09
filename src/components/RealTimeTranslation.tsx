import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Mic, 
  MicOff, 
  Languages, 
  Volume2, 
  Settings, 
  Trash2, 
  Plus,
  X,
  Globe,
  VolumeX
} from 'lucide-react';
import { useRealTimeTranslation } from '@/hooks/useRealTimeTranslation';

interface RealTimeTranslationProps {
  isVisible: boolean;
  onToggle: () => void;
}

export const RealTimeTranslation = ({ isVisible, onToggle }: RealTimeTranslationProps) => {
  const [showSettings, setShowSettings] = useState(false);
  const [selectedLanguageToAdd, setSelectedLanguageToAdd] = useState<string>('');
  
  const {
    isListening,
    isTranslating,
    sourceLanguage,
    targetLanguages,
    translations,
    currentText,
    volume,
    autoSpeak,
    changeSourceLanguage,
    addTargetLanguage,
    removeTargetLanguage,
    setVolume,
    setAutoSpeak,
    toggleListening,
    clearTranslations,
    stopAllSpeech,
    supportedLanguages,
    isSupported
  } = useRealTimeTranslation();

  if (!isVisible) return null;

  if (!isSupported) {
    return (
      <Card className="bg-destructive/10 border-destructive">
        <CardContent className="p-4">
          <div className="text-center">
            <Languages className="w-12 h-12 mx-auto mb-2 text-destructive" />
            <h3 className="font-semibold text-destructive mb-2">غير مدعوم</h3>
            <p className="text-sm text-muted-foreground">
              المتصفح لا يدعم الترجمة الفورية
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getLanguageName = (code: string) => {
    return supportedLanguages.find(lang => lang.code === code)?.name || code;
  };

  const getLanguageFlag = (code: string) => {
    return supportedLanguages.find(lang => lang.code === code)?.flag || '🌐';
  };

  return (
    <div className="space-y-4">
      {/* لوحة التحكم الرئيسية */}
      <Card className="bg-card/80 backdrop-blur-sm border-primary/20">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              الترجمة الفورية
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggle}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* أزرار التحكم الرئيسية */}
          <div className="flex items-center justify-center gap-4">
            <Button
              variant={isListening ? "destructive" : "default"}
              size="lg"
              onClick={toggleListening}
              className="rounded-full px-6"
              disabled={isTranslating}
            >
              {isListening ? (
                <>
                  <MicOff className="w-5 h-5 mr-2" />
                  إيقاف الاستماع
                </>
              ) : (
                <>
                  <Mic className="w-5 h-5 mr-2" />
                  بدء الاستماع
                </>
              )}
            </Button>
            
            {isListening && (
              <Button
                variant="outline"
                size="sm"
                onClick={stopAllSpeech}
              >
                <VolumeX className="w-4 h-4 mr-2" />
                إيقاف الصوت
              </Button>
            )}
          </div>

          {/* النص الحي */}
          {currentText && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                  <span className="text-sm font-medium">يتم الاستماع...</span>
                </div>
                <p className="text-sm">{currentText}</p>
              </CardContent>
            </Card>
          )}

          {/* اللغات المستهدفة */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">اللغات المستهدفة:</span>
              <Button
                variant="outline"
                size="sm"
                onClick={clearTranslations}
                disabled={translations.length === 0}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                مسح
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {targetLanguages.map((langCode) => (
                <Badge key={langCode} variant="secondary" className="gap-1">
                  {getLanguageFlag(langCode)} {getLanguageName(langCode)}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => removeTargetLanguage(langCode)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </div>

          {/* إعدادات سريعة */}
          {showSettings && (
            <Card className="bg-muted/50">
              <CardContent className="p-4 space-y-4">
                {/* لغة المصدر */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">لغة المصدر:</label>
                  <Select value={sourceLanguage} onValueChange={changeSourceLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {supportedLanguages.map((lang) => (
                        <SelectItem key={lang.code} value={lang.code}>
                          {lang.flag} {lang.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* إضافة لغة هدف */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">إضافة لغة هدف:</label>
                  <div className="flex gap-2">
                    <Select value={selectedLanguageToAdd} onValueChange={setSelectedLanguageToAdd}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="اختر لغة..." />
                      </SelectTrigger>
                      <SelectContent>
                        {supportedLanguages
                          .filter(lang => !targetLanguages.includes(lang.code) && lang.code !== sourceLanguage)
                          .map((lang) => (
                          <SelectItem key={lang.code} value={lang.code}>
                            {lang.flag} {lang.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      onClick={() => {
                        if (selectedLanguageToAdd) {
                          addTargetLanguage(selectedLanguageToAdd);
                          setSelectedLanguageToAdd('');
                        }
                      }}
                      disabled={!selectedLanguageToAdd}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* التشغيل التلقائي للصوت */}
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">التشغيل التلقائي للصوت</label>
                    <p className="text-xs text-muted-foreground">
                      تشغيل الترجمة صوتياً تلقائياً
                    </p>
                  </div>
                  <Switch
                    checked={autoSpeak}
                    onCheckedChange={setAutoSpeak}
                  />
                </div>

                {/* مستوى الصوت */}
                {autoSpeak && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-4 h-4" />
                      <label className="text-sm font-medium">مستوى الصوت</label>
                    </div>
                    <Slider
                      value={[volume * 100]}
                      onValueChange={(value) => setVolume(value[0] / 100)}
                      max={100}
                      min={0}
                      step={10}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground text-center">
                      {Math.round(volume * 100)}%
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* الترجمات */}
      {translations.length > 0 && (
        <Card className="bg-card/60 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Languages className="w-5 h-5 text-primary" />
              الترجمات الحية
              {isTranslating && (
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              )}
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            <ScrollArea className="h-48">
              <div className="space-y-3">
                {translations.slice(-10).reverse().map((translation) => (
                  <div key={translation.id} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {getLanguageFlag(translation.language)} {getLanguageName(translation.language)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(translation.timestamp).toLocaleTimeString('ar-SA', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <Card className="bg-muted/30">
                      <CardContent className="p-3">
                        <p className="text-sm font-medium mb-1">{translation.translatedText}</p>
                        <p className="text-xs text-muted-foreground">{translation.originalText}</p>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
};