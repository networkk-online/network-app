import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, TrendingUp, Users, Target, Calendar, Bell } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TimeSlot {
  time: string;
  engagement: number;
  followers: number;
  description: string;
}

interface AudienceInsight {
  ageGroup: string;
  percentage: number;
  activeHours: string[];
  interests: string[];
}

export const AIPostOptimizer = () => {
  const [bestTimes, setBestTimes] = useState<TimeSlot[]>([]);
  const [audienceInsights, setAudienceInsights] = useState<AudienceInsight[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentHour] = useState(new Date().getHours());
  const { toast } = useToast();

  useEffect(() => {
    // محاكاة تحليل البيانات عند تحميل المكون
    analyzeAudience();
  }, []);

  const analyzeAudience = async () => {
    setIsAnalyzing(true);
    
    try {
      // محاكاة تحليل جمهور المستخدم
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockBestTimes: TimeSlot[] = [
        {
          time: '08:00',
          engagement: 95,
          followers: 1250,
          description: 'بداية اليوم - الجمهور يتصفح قبل العمل'
        },
        {
          time: '12:30',
          engagement: 88,
          followers: 980,
          description: 'وقت الغداء - استراحة من العمل'
        },
        {
          time: '19:00',
          engagement: 92,
          followers: 1180,
          description: 'المساء - وقت الاسترخاء والتصفح'
        },
        {
          time: '21:30',
          engagement: 87,
          followers: 1050,
          description: 'ليلاً - قبل النوم، تفاعل عالي'
        }
      ];

      const mockAudienceInsights: AudienceInsight[] = [
        {
          ageGroup: '18-24',
          percentage: 35,
          activeHours: ['20:00', '21:00', '22:00'],
          interests: ['تقنية', 'ألعاب', 'موسيقى']
        },
        {
          ageGroup: '25-34',
          percentage: 40,
          activeHours: ['08:00', '12:00', '19:00'],
          interests: ['مهنة', 'سفر', 'طعام']
        },
        {
          ageGroup: '35-44',
          percentage: 20,
          activeHours: ['07:00', '18:00', '20:00'],
          interests: ['عائلة', 'صحة', 'تعليم']
        },
        {
          ageGroup: '45+',
          percentage: 5,
          activeHours: ['06:00', '17:00', '19:00'],
          interests: ['إخبار', 'ثقافة', 'دين']
        }
      ];

      setBestTimes(mockBestTimes);
      setAudienceInsights(mockAudienceInsights);
      
      toast({
        title: "تم التحليل بنجاح",
        description: "تم تحليل جمهورك وتحديد أفضل أوقات النشر",
      });
      
    } catch (error) {
      toast({
        title: "خطأ في التحليل",
        description: "حدث خطأ أثناء تحليل البيانات",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const schedulePost = (time: string) => {
    toast({
      title: "تم جدولة المنشور",
      description: `سيتم نشر المحتوى في ${time}`,
    });
  };

  const getCurrentTimeRecommendation = () => {
    const recommendations = {
      6: { status: 'جيد', message: 'وقت جيد للمحتوى الصباحي', color: 'green' },
      8: { status: 'ممتاز', message: 'أفضل وقت للنشر!', color: 'blue' },
      12: { status: 'جيد', message: 'وقت الغداء مناسب', color: 'green' },
      19: { status: 'ممتاز', message: 'وقت مثالي للتفاعل', color: 'blue' },
      21: { status: 'جيد جداً', message: 'تفاعل عالي متوقع', color: 'purple' },
      23: { status: 'ضعيف', message: 'تفاعل منخفض', color: 'red' }
    };

    const rec = recommendations[currentHour as keyof typeof recommendations] || 
                recommendations[23];
    return rec;
  };

  const currentRec = getCurrentTimeRecommendation();

  return (
    <div className="w-full space-y-6">
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-green-400" />
            مُحسِن النشر بالذكاء الاصطناعي
          </CardTitle>
          <CardDescription>
            تحليل جمهورك واقتراح أفضل أوقات النشر لزيادة التفاعل
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="bg-gray-800 border-gray-600">
              <CardContent className="p-4 text-center">
                <Users className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-400">2,450</div>
                <div className="text-sm text-gray-400">إجمالي المتابعين</div>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800 border-gray-600">
              <CardContent className="p-4 text-center">
                <TrendingUp className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-400">+15%</div>
                <div className="text-sm text-gray-400">نمو التفاعل هذا الأسبوع</div>
              </CardContent>
            </Card>
            
            <Card className={`bg-gray-800 border-gray-600 border-2 border-${currentRec.color}-400/50`}>
              <CardContent className="p-4 text-center">
                <Clock className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                <Badge 
                  variant="outline" 
                  className={`bg-${currentRec.color}-900/20 text-${currentRec.color}-400 border-${currentRec.color}-600 mb-1`}
                >
                  {currentRec.status}
                </Badge>
                <div className="text-xs text-gray-400">{currentRec.message}</div>
              </CardContent>
            </Card>
          </div>

          <Button 
            onClick={analyzeAudience}
            disabled={isAnalyzing}
            className="w-full mb-6 bg-green-600 hover:bg-green-700"
          >
            {isAnalyzing ? 'جاري التحليل...' : 'تحديث التحليل'}
          </Button>
        </CardContent>
      </Card>

      <Tabs defaultValue="times" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-gray-900">
          <TabsTrigger value="times" className="data-[state=active]:bg-gray-700">
            أفضل الأوقات
          </TabsTrigger>
          <TabsTrigger value="audience" className="data-[state=active]:bg-gray-700">
            تحليل الجمهور
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="times" className="space-y-4">
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-400" />
                أفضل أوقات النشر
              </CardTitle>
              <CardDescription>
                أوقات مُحسَّنة بناءً على تحليل نشاط جمهورك
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {bestTimes.map((timeSlot, index) => (
                  <Card key={index} className="bg-gray-800 border-gray-600">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="bg-blue-900/20 text-blue-400 border-blue-600">
                            {timeSlot.time}
                          </Badge>
                          <div>
                            <div className="font-medium text-white">{timeSlot.description}</div>
                            <div className="text-sm text-gray-400">
                              {timeSlot.followers} متابع نشط
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => schedulePost(timeSlot.time)}
                          className="border-gray-600"
                        >
                          <Calendar className="w-4 h-4 mr-1" />
                          جدولة
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">معدل التفاعل</span>
                          <span className="text-green-400">{timeSlot.engagement}%</span>
                        </div>
                        <Progress value={timeSlot.engagement} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audience" className="space-y-4">
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-400" />
                تحليل الجمهور
              </CardTitle>
              <CardDescription>
                تفاصيل عن جمهورك وأوقات نشاطهم
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {audienceInsights.map((insight, index) => (
                  <Card key={index} className="bg-gray-800 border-gray-600">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="font-medium text-white">الفئة العمرية {insight.ageGroup}</div>
                          <div className="text-sm text-gray-400">{insight.percentage}% من الجمهور</div>
                        </div>
                        <Badge variant="outline" className="bg-purple-900/20 text-purple-400 border-purple-600">
                          {insight.percentage}%
                        </Badge>
                      </div>
                      
                      <Progress value={insight.percentage} className="h-2 mb-3" />
                      
                      <div className="space-y-2">
                        <div>
                          <div className="text-sm font-medium text-gray-300 mb-1">أوقات النشاط</div>
                          <div className="flex gap-2">
                            {insight.activeHours.map((hour, idx) => (
                              <Badge
                                key={idx}
                                variant="outline"
                                className="bg-green-900/20 text-green-400 border-green-600 text-xs"
                              >
                                {hour}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-sm font-medium text-gray-300 mb-1">الاهتمامات</div>
                          <div className="flex gap-2">
                            {insight.interests.map((interest, idx) => (
                              <Badge
                                key={idx}
                                variant="outline"
                                className="bg-yellow-900/20 text-yellow-400 border-yellow-600 text-xs"
                              >
                                {interest}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};