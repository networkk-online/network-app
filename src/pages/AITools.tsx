import Header from '@/components/Header';
import { AIContentFilter } from '@/components/AIContentFilter';
import { AIImageGenerator } from '@/components/AIImageGenerator';
import { AIPostOptimizer } from '@/components/AIPostOptimizer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, Sparkles, Image, Target } from 'lucide-react';

const AITools = () => {
  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <main className="pt-16 sm:pt-20 pb-8">
        <div className="container-responsive mobile-padding">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-2">
              <Brain className="w-8 h-8 text-blue-400" />
              أدوات الذكاء الاصطناعي
            </h1>
            <p className="text-gray-400">
              مجموعة شاملة من أدوات الذكاء الاصطناعي لتحسين محتواك وزيادة التفاعل
            </p>
          </div>

          <Tabs defaultValue="filter" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-gray-900 mb-8">
              <TabsTrigger 
                value="filter" 
                className="data-[state=active]:bg-gray-700 flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                فلتر المحتوى
              </TabsTrigger>
              <TabsTrigger 
                value="generator" 
                className="data-[state=active]:bg-gray-700 flex items-center gap-2"
              >
                <Image className="w-4 h-4" />
                مولد الصور
              </TabsTrigger>
              <TabsTrigger 
                value="optimizer" 
                className="data-[state=active]:bg-gray-700 flex items-center gap-2"
              >
                <Target className="w-4 h-4" />
                مُحسِن النشر
              </TabsTrigger>
            </TabsList>

            <TabsContent value="filter" className="space-y-6">
              <AIContentFilter />
            </TabsContent>

            <TabsContent value="generator" className="space-y-6">
              <AIImageGenerator />
            </TabsContent>

            <TabsContent value="optimizer" className="space-y-6">
              <AIPostOptimizer />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default AITools;