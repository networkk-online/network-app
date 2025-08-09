import { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

// إضافة تعريفات TypeScript للـ Speech APIs
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

declare var SpeechRecognition: {
  prototype: SpeechRecognition;
  new(): SpeechRecognition;
};

interface TranslationEntry {
  id: string;
  originalText: string;
  translatedText: string;
  language: string;
  timestamp: number;
}

interface Language {
  code: string;
  name: string;
  flag: string;
}

const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' }
];

export const useRealTimeTranslation = () => {
  const [isListening, setIsListening] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [sourceLanguage, setSourceLanguage] = useState<string>('ar');
  const [targetLanguages, setTargetLanguages] = useState<string[]>(['en']);
  const [translations, setTranslations] = useState<TranslationEntry[]>([]);
  const [currentText, setCurrentText] = useState('');
  const [volume, setVolume] = useState(0.7);
  const [autoSpeak, setAutoSpeak] = useState(false);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthesisRef = useRef<SpeechSynthesis | null>(null);
  const { toast } = useToast();

  // تهيئة التعرف على الكلام
  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      if (recognitionRef.current) {
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = sourceLanguage === 'ar' ? 'ar-SA' : sourceLanguage;
        
        recognitionRef.current.onresult = (event) => {
          let finalTranscript = '';
          let interimTranscript = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }
          
          if (finalTranscript) {
            handleTranslation(finalTranscript);
          }
          setCurrentText(interimTranscript);
        };
        
        recognitionRef.current.onerror = (event) => {
          console.error('خطأ في التعرف على الكلام:', event.error);
          toast({
            title: "❌ خطأ في التعرف على الكلام",
            description: "تأكد من إعطاء الإذن للميكروفون",
            variant: "destructive"
          });
        };
      }
    }
    
    // تهيئة تحويل النص إلى كلام
    if ('speechSynthesis' in window) {
      synthesisRef.current = window.speechSynthesis;
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [sourceLanguage]);

  // ترجمة النص باستخدام Google Translate API (مجاني)
  const translateText = async (text: string, targetLang: string): Promise<string> => {
    try {
      // استخدام Google Translate API المجاني
      const response = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLanguage}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`
      );
      
      if (!response.ok) {
        throw new Error('فشل في الترجمة');
      }
      
      const data = await response.json();
      return data[0][0][0] || text;
    } catch (error) {
      console.error('خطأ في الترجمة:', error);
      return text; // إرجاع النص الأصلي في حالة الفشل
    }
  };

  // معالجة الترجمة
  const handleTranslation = useCallback(async (text: string) => {
    if (!text.trim()) return;
    
    setIsTranslating(true);
    
    try {
      const translationPromises = targetLanguages.map(async (targetLang) => {
        const translatedText = await translateText(text, targetLang);
        
        const entry: TranslationEntry = {
          id: `${Date.now()}-${targetLang}`,
          originalText: text,
          translatedText,
          language: targetLang,
          timestamp: Date.now()
        };
        
        // تشغيل الصوت المترجم إذا كان مفعلاً
        if (autoSpeak && synthesisRef.current) {
          const utterance = new SpeechSynthesisUtterance(translatedText);
          utterance.lang = targetLang;
          utterance.volume = volume;
          utterance.rate = 0.9;
          synthesisRef.current.speak(utterance);
        }
        
        return entry;
      });
      
      const newTranslations = await Promise.all(translationPromises);
      setTranslations(prev => [...prev, ...newTranslations].slice(-50)); // الاحتفاظ بآخر 50 ترجمة
      
    } catch (error) {
      console.error('خطأ في الترجمة:', error);
      toast({
        title: "❌ خطأ في الترجمة",
        description: "تعذر ترجمة النص",
        variant: "destructive"
      });
    } finally {
      setIsTranslating(false);
    }
  }, [targetLanguages, sourceLanguage, autoSpeak, volume]);

  // بدء/إيقاف الاستماع
  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast({
        title: "❌ غير مدعوم",
        description: "المتصفح لا يدعم التعرف على الكلام",
        variant: "destructive"
      });
      return;
    }
    
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  // إضافة لغة هدف
  const addTargetLanguage = (langCode: string) => {
    if (!targetLanguages.includes(langCode)) {
      setTargetLanguages(prev => [...prev, langCode]);
    }
  };

  // إزالة لغة هدف
  const removeTargetLanguage = (langCode: string) => {
    setTargetLanguages(prev => prev.filter(lang => lang !== langCode));
  };

  // تغيير لغة المصدر
  const changeSourceLanguage = (langCode: string) => {
    setSourceLanguage(langCode);
    if (recognitionRef.current) {
      recognitionRef.current.lang = langCode === 'ar' ? 'ar-SA' : langCode;
    }
  };

  // مسح الترجمات
  const clearTranslations = () => {
    setTranslations([]);
  };

  // إيقاف جميع الأصوات
  const stopAllSpeech = () => {
    if (synthesisRef.current) {
      synthesisRef.current.cancel();
    }
  };

  return {
    // الحالة
    isListening,
    isTranslating,
    sourceLanguage,
    targetLanguages,
    translations,
    currentText,
    volume,
    autoSpeak,
    
    // الإعدادات
    changeSourceLanguage,
    addTargetLanguage,
    removeTargetLanguage,
    setVolume,
    setAutoSpeak,
    
    // الإجراءات
    toggleListening,
    clearTranslations,
    stopAllSpeech,
    
    // البيانات
    supportedLanguages: SUPPORTED_LANGUAGES,
    isSupported: 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
  };
};