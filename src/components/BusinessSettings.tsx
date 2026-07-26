import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Briefcase, Mail, Globe, Clock } from 'lucide-react';

const businessCategories = [
  'ملابس',
  'كاتب',
  'كوزمتك',
  'قانون',
  'طعام ومطاعم',
  'تكنولوجيا',
  'تعليم',
  'صحة وعافية',
  'عقارات',
  'سفر وسياحة',
  'فن وثقافة',
  'رياضة',
  'أخرى'
];

export const BusinessSettings = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isBusinessAccount, setIsBusinessAccount] = useState(false);
  const [businessData, setBusinessData] = useState({
    category: '',
    description: '',
    email: '',
    website: '',
    hours: {
      saturday: { open: '09:00', close: '17:00', isOpen: true },
      sunday: { open: '09:00', close: '17:00', isOpen: true },
      monday: { open: '09:00', close: '17:00', isOpen: true },
      tuesday: { open: '09:00', close: '17:00', isOpen: true },
      wednesday: { open: '09:00', close: '17:00', isOpen: true },
      thursday: { open: '09:00', close: '17:00', isOpen: true },
      friday: { open: '09:00', close: '17:00', isOpen: false }
    }
  });

  useEffect(() => {
    loadBusinessSettings();
  }, []);

  const loadBusinessSettings = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // business_email is PII (server-side revoked); fetch full row via owner RPC
    const { data: rows } = await supabase.rpc('get_own_profile');
    const data: any = Array.isArray(rows) ? rows[0] : rows;

    if (data) {
      setIsBusinessAccount(data.is_business_account || false);
      const hoursData = typeof data.business_hours === 'object' && data.business_hours !== null
        ? data.business_hours as any
        : businessData.hours;

      setBusinessData({
        category: data.business_category || '',
        description: data.business_description || '',
        email: data.business_email || '',
        website: data.business_website || '',
        hours: hoursData
      });
    }
  };


  const handleSave = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update({
        is_business_account: isBusinessAccount,
        business_category: businessData.category,
        business_description: businessData.description,
        business_email: businessData.email,
        business_website: businessData.website,
        business_hours: businessData.hours
      })
      .eq('id', user.id);

    setLoading(false);

    if (error) {
      toast({
        title: 'خطأ',
        description: 'فشل حفظ إعدادات الحساب التجاري',
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'نجح',
        description: 'تم حفظ إعدادات الحساب التجاري'
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">الحساب التجاري</h3>
          <p className="text-sm text-gray-400">قم بتحويل حسابك إلى حساب تجاري</p>
        </div>
        <Switch
          checked={isBusinessAccount}
          onCheckedChange={setIsBusinessAccount}
        />
      </div>

      {isBusinessAccount && (
        <div className="space-y-4 p-4 bg-gray-800/50 rounded-lg">
          <div>
            <Label>فئة النشاط التجاري</Label>
            <Select
              value={businessData.category}
              onValueChange={(value) => setBusinessData({ ...businessData, category: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر الفئة" />
              </SelectTrigger>
              <SelectContent>
                {businessCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>وصف النشاط التجاري</Label>
            <Textarea
              value={businessData.description}
              onChange={(e) => setBusinessData({ ...businessData, description: e.target.value })}
              placeholder="اكتب وصفاً مختصراً عن نشاطك التجاري..."
              rows={3}
            />
          </div>

          <div>
            <Label className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              البريد الإلكتروني للعمل
            </Label>
            <Input
              type="email"
              value={businessData.email}
              onChange={(e) => setBusinessData({ ...businessData, email: e.target.value })}
              placeholder="email@business.com"
            />
          </div>

          <div>
            <Label className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              الموقع الإلكتروني
            </Label>
            <Input
              type="url"
              value={businessData.website}
              onChange={(e) => setBusinessData({ ...businessData, website: e.target.value })}
              placeholder="https://www.example.com"
            />
          </div>

          <div>
            <Label className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4" />
              أوقات العمل
            </Label>
            <div className="space-y-2">
              {Object.entries(businessData.hours).map(([day, hours]: any) => (
                <div key={day} className="flex items-center gap-2 p-2 bg-gray-900/50 rounded">
                  <Switch
                    checked={hours.isOpen}
                    onCheckedChange={(checked) => {
                      setBusinessData({
                        ...businessData,
                        hours: {
                          ...businessData.hours,
                          [day]: { ...hours, isOpen: checked }
                        }
                      });
                    }}
                  />
                  <span className="w-20 text-sm">{
                    day === 'saturday' ? 'السبت' :
                    day === 'sunday' ? 'الأحد' :
                    day === 'monday' ? 'الاثنين' :
                    day === 'tuesday' ? 'الثلاثاء' :
                    day === 'wednesday' ? 'الأربعاء' :
                    day === 'thursday' ? 'الخميس' : 'الجمعة'
                  }</span>
                  {hours.isOpen && (
                    <div className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={hours.open}
                        onChange={(e) => {
                          setBusinessData({
                            ...businessData,
                            hours: {
                              ...businessData.hours,
                              [day]: { ...hours, open: e.target.value }
                            }
                          });
                        }}
                        className="w-28"
                      />
                      <span>-</span>
                      <Input
                        type="time"
                        value={hours.close}
                        onChange={(e) => {
                          setBusinessData({
                            ...businessData,
                            hours: {
                              ...businessData.hours,
                              [day]: { ...hours, close: e.target.value }
                            }
                          });
                        }}
                        className="w-28"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <Button onClick={handleSave} disabled={loading} className="w-full">
            {loading ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
          </Button>
        </div>
      )}
    </div>
  );
};