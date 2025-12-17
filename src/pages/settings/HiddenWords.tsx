import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Type, Plus, X, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';

const HiddenWords = () => {
  const navigate = useNavigate();
  const [filterEnabled, setFilterEnabled] = useState(true);
  const [hiddenWords, setHiddenWords] = useState<string[]>([]);
  const [newWord, setNewWord] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    const savedWords = localStorage.getItem('hidden_words');
    const filterStatus = localStorage.getItem('filter_enabled');
    
    if (savedWords) {
      setHiddenWords(JSON.parse(savedWords));
    }
    setFilterEnabled(filterStatus !== 'false');
  };

  const handleToggleFilter = (value: boolean) => {
    setFilterEnabled(value);
    localStorage.setItem('filter_enabled', value.toString());
    toast({ title: "تم حفظ الإعداد" });
  };

  const addWord = () => {
    if (!newWord.trim()) return;
    
    const updated = [...hiddenWords, newWord.trim().toLowerCase()];
    setHiddenWords(updated);
    localStorage.setItem('hidden_words', JSON.stringify(updated));
    setNewWord('');
    toast({ title: "تمت إضافة الكلمة" });
  };

  const removeWord = (word: string) => {
    const updated = hiddenWords.filter(w => w !== word);
    setHiddenWords(updated);
    localStorage.setItem('hidden_words', JSON.stringify(updated));
    toast({ title: "تم حذف الكلمة" });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center gap-3 p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
            <ArrowRight className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">الكلمات المخفية</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        <p className="text-sm text-muted-foreground">
          ستتم تصفية التعليقات والرسائل التي تحتوي على هذه الكلمات تلقائياً
        </p>

        {/* Filter Toggle */}
        <div className="bg-card rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">تفعيل الفلتر</p>
                <p className="text-sm text-muted-foreground">
                  إخفاء التعليقات المحتوية على الكلمات المحددة
                </p>
              </div>
            </div>
            <Switch checked={filterEnabled} onCheckedChange={handleToggleFilter} />
          </div>
        </div>

        {/* Add Word */}
        <div className="bg-card rounded-xl p-4">
          <div className="flex items-center gap-3 mb-4">
            <Type className="w-5 h-5 text-muted-foreground" />
            <p className="font-medium">إضافة كلمة</p>
          </div>
          <div className="flex gap-2">
            <Input
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              placeholder="أدخل كلمة..."
              onKeyPress={(e) => e.key === 'Enter' && addWord()}
            />
            <Button onClick={addWord} size="icon">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Words List */}
        <div className="bg-card rounded-xl p-4">
          <h3 className="font-bold mb-4">الكلمات المخفية ({hiddenWords.length})</h3>
          
          {hiddenWords.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              لم تقم بإضافة أي كلمات بعد
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {hiddenWords.map((word, index) => (
                <div
                  key={index}
                  className="flex items-center gap-1 bg-muted px-3 py-1.5 rounded-full"
                >
                  <span className="text-sm">{word}</span>
                  <button
                    onClick={() => removeWord(word)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Default Filters */}
        <div className="bg-card rounded-xl p-4">
          <h3 className="font-bold mb-4">فلاتر تلقائية</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">الكلمات المسيئة</span>
              <span className="text-green-500">مفعل</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">الروابط المشبوهة</span>
              <span className="text-green-500">مفعل</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">الرسائل المكررة</span>
              <span className="text-green-500">مفعل</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HiddenWords;
