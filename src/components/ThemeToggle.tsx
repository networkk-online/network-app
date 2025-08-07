import { Moon, Sun, Clock, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { useAutoTheme } from '@/hooks/useAutoTheme';

const ThemeToggle = () => {
  const [showSettings, setShowSettings] = useState(false);
  const [autoConfig, setAutoConfig] = useState({
    sunriseHour: 6,
    sunsetHour: 18,
    enableAutoMode: true
  });

  const { 
    currentTheme, 
    timeBasedTheme, 
    isAutoMode, 
    toggleTheme, 
    enableAutoMode 
  } = useAutoTheme(autoConfig);

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString('ar-SA', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getThemeStatus = () => {
    if (isAutoMode && autoConfig.enableAutoMode) {
      return `تلقائي - ${timeBasedTheme === 'dark' ? 'ليلي' : 'نهاري'}`;
    }
    return currentTheme === 'dark' ? 'ليلي' : 'نهاري';
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* زر الثيم الرئيسي */}
      <div className="flex flex-col items-end gap-2">
        <Button
          onClick={() => setShowSettings(!showSettings)}
          variant="outline"
          size="icon"
          className="w-12 h-12 rounded-full bg-card/80 backdrop-blur-sm border-border/50 hover:bg-card"
        >
          <Settings className="w-5 h-5" />
        </Button>

        <Button
          onClick={toggleTheme}
          className="w-12 h-12 rounded-full bg-primary hover:bg-primary/90 relative group"
          size="icon"
        >
          {currentTheme === 'dark' ? (
            <Moon className="w-5 h-5 text-primary-foreground" />
          ) : (
            <Sun className="w-5 h-5 text-primary-foreground" />
          )}
          
          {/* مؤشر الوضع التلقائي */}
          {isAutoMode && autoConfig.enableAutoMode && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full animate-pulse">
              <Clock className="w-2 h-2 text-accent-foreground absolute top-0.5 left-0.5" />
            </div>
          )}
        </Button>
      </div>

      {/* إعدادات الثيم */}
      {showSettings && (
        <Card className="absolute bottom-16 right-0 w-80 bg-card/95 backdrop-blur-sm border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5" />
              إعدادات الوضع التلقائي
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* معلومات الوقت الحالي */}
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">الوقت الحالي</div>
              <div className="font-semibold">{getCurrentTime()}</div>
              <div className="text-sm text-accent">الوضع: {getThemeStatus()}</div>
            </div>

            {/* تفعيل الوضع التلقائي */}
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-mode" className="text-sm font-medium">
                التبديل التلقائي
              </Label>
              <Switch
                id="auto-mode"
                checked={autoConfig.enableAutoMode}
                onCheckedChange={(checked) => {
                  setAutoConfig(prev => ({ ...prev, enableAutoMode: checked }));
                  if (checked) {
                    enableAutoMode();
                  }
                }}
              />
            </div>

            {/* إعدادات التوقيت */}
            {autoConfig.enableAutoMode && (
              <div className="space-y-3 pt-2 border-t border-border">
                <div>
                  <Label className="text-sm font-medium">
                    وقت بداية النهار: {autoConfig.sunriseHour}:00
                  </Label>
                  <input
                    type="range"
                    min="4"
                    max="10"
                    value={autoConfig.sunriseHour}
                    onChange={(e) => setAutoConfig(prev => ({ 
                      ...prev, 
                      sunriseHour: parseInt(e.target.value) 
                    }))}
                    className="w-full mt-1 accent-primary"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium">
                    وقت بداية الليل: {autoConfig.sunsetHour}:00
                  </Label>
                  <input
                    type="range"
                    min="16"
                    max="22"
                    value={autoConfig.sunsetHour}
                    onChange={(e) => setAutoConfig(prev => ({ 
                      ...prev, 
                      sunsetHour: parseInt(e.target.value) 
                    }))}
                    className="w-full mt-1 accent-primary"
                  />
                </div>
              </div>
            )}

            {/* معاينة الثيمات */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
              <div className="p-2 bg-background border rounded text-center text-xs">
                🌞 وضع نهاري
              </div>
              <div className="p-2 bg-card border rounded text-center text-xs">
                🌙 وضع ليلي
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ThemeToggle;