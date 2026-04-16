import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Users, MessageCircle, Video, Shield, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import networkLogo from '@/assets/network-logo.png';

interface OnboardingSlide {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

const slides: OnboardingSlide[] = [
  {
    icon: <Sparkles className="w-16 h-16" />,
    title: "أهلاً بكم في العالم الجديد",
    description: "منصة اجتماعية متكاملة تجمعك مع أصدقائك وعائلتك في مكان واحد",
    color: "from-green-500 to-emerald-600"
  },
  {
    icon: <Users className="w-16 h-16" />,
    title: "تواصل مع الجميع",
    description: "تابع أصدقائك، شارك لحظاتك، واكتشف أشخاص جدد من حولك",
    color: "from-blue-500 to-cyan-600"
  },
  {
    icon: <MessageCircle className="w-16 h-16" />,
    title: "محادثات فورية",
    description: "أرسل رسائل نصية وصوتية وصور بسرعة وأمان تام",
    color: "from-purple-500 to-pink-600"
  },
  {
    icon: <Video className="w-16 h-16" />,
    title: "قصص وريلز",
    description: "شارك قصصك اليومية وأنشئ فيديوهات قصيرة ممتعة",
    color: "from-orange-500 to-red-600"
  },
  {
    icon: <Shield className="w-16 h-16" />,
    title: "خصوصية وأمان",
    description: "بياناتك محمية ومشفرة، تحكم كامل في خصوصيتك",
    color: "from-teal-500 to-green-600"
  }
];

const SplashScreen = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Check if user has seen onboarding before
    const hasSeenSplash = localStorage.getItem('hasSeenSplash');
    if (hasSeenSplash) {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  const goToSlide = (index: number) => {
    if (isAnimating || index === currentSlide) return;
    setIsAnimating(true);
    setCurrentSlide(index);
    setTimeout(() => setIsAnimating(false), 500);
  };

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      goToSlide(currentSlide + 1);
    } else {
      finishOnboarding();
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      goToSlide(currentSlide - 1);
    }
  };

  const finishOnboarding = () => {
    localStorage.setItem('hasSeenSplash', 'true');
    navigate('/login', { replace: true });
  };

  const slide = slides[currentSlide];

  return (
    <div className="min-h-screen bg-black flex flex-col relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 z-0">
        <div className={`absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r ${slide.color} opacity-20 rounded-full blur-3xl transition-all duration-1000`}></div>
        <div className={`absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r ${slide.color} opacity-15 rounded-full blur-2xl transition-all duration-1000 delay-300`}></div>
        
        {/* Floating particles */}
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/30 rounded-full animate-bounce"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}

        {/* Grid overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[length:50px_50px] opacity-30"></div>
      </div>

      {/* Header with Logo */}
      <div className="relative z-10 pt-12 pb-6 flex justify-center">
        <img 
          src={networkLogo} 
          alt="Network Logo" 
          className="w-20 h-20 object-contain drop-shadow-[0_0_20px_rgba(25,224,91,0.4)]"
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 relative z-10 flex flex-col items-center justify-center px-8">
        {/* Slide Content */}
        <div 
          className={`flex flex-col items-center text-center transition-all duration-500 ${
            isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
          }`}
        >
          {/* Icon */}
          <div className={`mb-8 p-6 rounded-full bg-gradient-to-r ${slide.color} text-white shadow-2xl`}>
            {slide.icon}
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-white mb-4">
            {slide.title}
          </h1>

          {/* Description */}
          <p className="text-gray-400 text-lg max-w-sm leading-relaxed">
            {slide.description}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="relative z-10 pb-12 px-8">
        {/* Dots Indicator */}
        <div className="flex justify-center gap-2 mb-8">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentSlide 
                  ? 'w-8 bg-white' 
                  : 'w-2 bg-gray-600 hover:bg-gray-500'
              }`}
            />
          ))}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between gap-4">
          {/* Previous / Skip */}
          <Button
            variant="ghost"
            onClick={currentSlide === 0 ? finishOnboarding : prevSlide}
            className="text-gray-400 hover:text-white"
          >
            {currentSlide === 0 ? (
              'تخطي'
            ) : (
              <>
                <ChevronRight className="w-5 h-5 ml-1" />
                السابق
              </>
            )}
          </Button>

          {/* Next / Start */}
          <Button
            onClick={nextSlide}
            className={`bg-gradient-to-r ${slide.color} hover:opacity-90 text-white px-8 py-6 rounded-xl font-semibold shadow-lg`}
          >
            {currentSlide === slides.length - 1 ? (
              'ابدأ الآن'
            ) : (
              <>
                التالي
                <ChevronLeft className="w-5 h-5 mr-1" />
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Swipe hint for first slide */}
      {currentSlide === 0 && (
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-10">
          <div className="flex items-center gap-2 text-gray-500 text-sm animate-pulse">
            <ChevronLeft className="w-4 h-4" />
            <span>اسحب للتنقل</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      )}
    </div>
  );
};

export default SplashScreen;
