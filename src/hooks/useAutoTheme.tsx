import { useEffect, useState } from 'react';

interface AutoThemeConfig {
  sunriseHour: number; // الساعة التي يبدأ فيها النهار (افتراضي: 6)
  sunsetHour: number;  // الساعة التي يبدأ فيها الليل (افتراضي: 18)
  enableAutoMode: boolean; // تفعيل/إلغاء الوضع التلقائي
}

export const useAutoTheme = (config: AutoThemeConfig = { 
  sunriseHour: 6, 
  sunsetHour: 18, 
  enableAutoMode: true 
}) => {
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('dark');
  const [timeBasedTheme, setTimeBasedTheme] = useState<'light' | 'dark'>('dark');

  // حساب الثيم المناسب حسب الوقت الحالي
  const calculateTimeBasedTheme = (): 'light' | 'dark' => {
    const now = new Date();
    const currentHour = now.getHours();
    
    // إذا كان الوقت بين شروق الشمس وغروبها = وضع فاتح
    // وإلا = وضع داكن
    if (currentHour >= config.sunriseHour && currentHour < config.sunsetHour) {
      return 'light';
    }
    return 'dark';
  };

  // تطبيق الثيم على DOM
  const applyTheme = (theme: 'light' | 'dark') => {
    const root = document.documentElement;
    
    if (theme === 'dark') {
      root.classList.add('dark');
      // الألوان الداكنة (الحالية)
      root.style.setProperty('--background', '0 0% 0%');
      root.style.setProperty('--foreground', '0 0% 100%');
      root.style.setProperty('--card', '0 0% 8%');
      root.style.setProperty('--border', '0 0% 20%');
    } else {
      root.classList.remove('dark');
      // الألوان الفاتحة للنهار
      root.style.setProperty('--background', '0 0% 98%');
      root.style.setProperty('--foreground', '0 0% 2%');
      root.style.setProperty('--card', '0 0% 100%');
      root.style.setProperty('--border', '0 0% 85%');
    }
  };

  // فحص الوقت كل دقيقة للتحديث التلقائي
  useEffect(() => {
    if (!config.enableAutoMode) return;

    const checkTime = () => {
      const newTheme = calculateTimeBasedTheme();
      setTimeBasedTheme(newTheme);
      
      if (newTheme !== currentTheme) {
        setCurrentTheme(newTheme);
        applyTheme(newTheme);
      }
    };

    // فحص فوري
    checkTime();

    // فحص كل دقيقة
    const interval = setInterval(checkTime, 60000);

    return () => clearInterval(interval);
  }, [config.enableAutoMode, config.sunriseHour, config.sunsetHour, currentTheme]);

  // تطبيق الثيم عند التحميل الأول
  useEffect(() => {
    if (config.enableAutoMode) {
      const initialTheme = calculateTimeBasedTheme();
      setCurrentTheme(initialTheme);
      setTimeBasedTheme(initialTheme);
      applyTheme(initialTheme);
    }
  }, []);

  // دالة للتبديل اليدوي (تلغي الوضع التلقائي مؤقتاً)
  const toggleTheme = () => {
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setCurrentTheme(newTheme);
    applyTheme(newTheme);
  };

  // دالة لإعادة تفعيل الوضع التلقائي
  const enableAutoMode = () => {
    const timeTheme = calculateTimeBasedTheme();
    setCurrentTheme(timeTheme);
    applyTheme(timeTheme);
  };

  return {
    currentTheme,
    timeBasedTheme,
    isAutoMode: config.enableAutoMode,
    toggleTheme,
    enableAutoMode,
    calculateTimeBasedTheme
  };
};