
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, BarChart3, Target, Users, TrendingUp, DollarSign } from 'lucide-react';

interface BusinessSettingsProps {
  onClose: () => void;
}

const BusinessSettings = ({ onClose }: BusinessSettingsProps) => {
  const [isBusinessAccount, setIsBusinessAccount] = useState(false);
  const [businessCategory, setBusinessCategory] = useState('');

  const businessCategories = [
    'التجارة الإلكترونية',
    'المطاعم والمقاهي',
    'الموضة والجمال',
    'التكنولوجيا',
    'التعليم',
    'الصحة واللياقة',
    'السفر والسياحة',
    'الفن والتصميم'
  ];

  const insights = [
    { icon: Users, label: 'الوصول', value: '2,547', change: '+12%' },
    { icon: TrendingUp, label: 'التفاعل', value: '18.7%', change: '+5.2%' },
    { icon: BarChart3, label: 'الانطباعات', value: '15,892', change: '+8.3%' },
    { icon: DollarSign, label: 'الأرباح', value: '$127.50', change: '+15.7%' }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Building2 className="w-8 h-8 text-green-500" />
          <div>
            <h1 className="text-2xl font-bold text-white">حساب الأعمال</h1>
            <p className="text-gray-400">إدارة حسابك التجاري والحصول على الرؤى</p>
          </div>
        </div>
        <Button onClick={onClose} variant="ghost">
          إغلاق
        </Button>
      </div>

      {/* Business Account Toggle */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-white">
            تفعيل الحساب التجاري
            <Switch 
              checked={isBusinessAccount} 
              onCheckedChange={setIsBusinessAccount}
            />
          </CardTitle>
          <CardDescription>
            احصل على أدوات الترويج والرؤى التفصيلية لحسابك
          </CardDescription>
        </CardHeader>
        {isBusinessAccount && (
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-white mb-2 block">
                فئة النشاط التجاري
              </label>
              <select 
                value={businessCategory}
                onChange={(e) => setBusinessCategory(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white"
              >
                <option value="">اختر فئة النشاط</option>
                {businessCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <Badge className="bg-green-500 text-black">
              <Building2 className="w-4 h-4 mr-1" />
              حساب تجاري مُفعل
            </Badge>
          </CardContent>
        )}
      </Card>

      {/* Business Insights */}
      {isBusinessAccount && (
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">رؤى الحساب التجاري</CardTitle>
            <CardDescription>
              إحصائيات أداء المحتوى والتفاعل خلال آخر 7 أيام
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {insights.map((insight) => (
                <div key={insight.label} className="p-4 bg-gray-800 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <insight.icon className="w-5 h-5 text-green-500" />
                    <span className={`text-xs font-medium ${
                      insight.change.startsWith('+') ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {insight.change}
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">
                    {insight.value}
                  </div>
                  <div className="text-sm text-gray-400">
                    {insight.label}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Promotion Tools */}
      {isBusinessAccount && (
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">أدوات الترويج</CardTitle>
            <CardDescription>
              روج لمنتجاتك وخدماتك وزد من وصولك
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button className="bg-green-500 hover:bg-green-600 text-black h-auto p-4 flex-col items-start">
                <Target className="w-6 h-6 mb-2" />
                <div className="text-left">
                  <div className="font-semibold">ترويج المنشور</div>
                  <div className="text-sm opacity-80">زيادة الوصول والتفاعل</div>
                </div>
              </Button>
              <Button variant="outline" className="border-gray-700 h-auto p-4 flex-col items-start">
                <Users className="w-6 h-6 mb-2" />
                <div className="text-left">
                  <div className="font-semibold">استهداف الجمهور</div>
                  <div className="text-sm opacity-80">الوصول للعملاء المحتملين</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BusinessSettings;
