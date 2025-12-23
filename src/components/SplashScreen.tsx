import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import networkLogo from '@/assets/network-logo.png';

const SplashScreen = () => {
  const navigate = useNavigate();
  const [stage, setStage] = useState(0);

  useEffect(() => {
    // Check if user has seen splash before
    const hasSeenSplash = localStorage.getItem('hasSeenSplash');
    if (hasSeenSplash) {
      navigate('/login', { replace: true });
      return;
    }

    // Animation stages
    const timer1 = setTimeout(() => setStage(1), 500);
    const timer2 = setTimeout(() => setStage(2), 1500);
    const timer3 = setTimeout(() => setStage(3), 2500);
    const timer4 = setTimeout(() => {
      localStorage.setItem('hasSeenSplash', 'true');
      navigate('/login', { replace: true });
    }, 4000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-green-400/15 rounded-full blur-2xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-green-600/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        
        {/* Floating particles */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-green-400 rounded-full animate-bounce"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}

        {/* Grid overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,197,94,0.1)_1px,transparent_1px)] bg-[length:50px_50px] opacity-30"></div>
      </div>

      {/* Logo Animation */}
      <div 
        className={`relative z-10 transition-all duration-1000 ease-out ${
          stage >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
        }`}
      >
        <div className="relative">
          {/* Glow effect */}
          <div className="absolute inset-0 w-40 h-40 bg-green-500/30 rounded-full blur-2xl animate-pulse"></div>
          <img 
            src={networkLogo} 
            alt="Network Logo" 
            className="w-40 h-40 object-contain relative z-10"
          />
        </div>
      </div>

      {/* Welcome Text */}
      <div 
        className={`mt-8 text-center z-10 transition-all duration-1000 ease-out ${
          stage >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <h1 className="text-4xl font-bold text-white mb-4">
          أهلاً بكم
        </h1>
        <p className="text-2xl text-green-400 font-semibold">
          في العالم الجديد
        </p>
      </div>

      {/* Tagline */}
      <div 
        className={`mt-6 z-10 transition-all duration-1000 ease-out ${
          stage >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <p className="text-gray-400 text-lg">تواصل • شارك • اكتشف</p>
      </div>

      {/* Loading indicator */}
      <div 
        className={`mt-12 z-10 transition-all duration-500 ${
          stage >= 2 ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div 
              key={i}
              className="w-3 h-3 bg-green-500 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>

      {/* Skip button */}
      <button
        onClick={() => {
          localStorage.setItem('hasSeenSplash', 'true');
          navigate('/login', { replace: true });
        }}
        className={`absolute bottom-10 z-10 text-gray-500 hover:text-white transition-all duration-500 ${
          stage >= 1 ? 'opacity-100' : 'opacity-0'
        }`}
      >
        تخطي
      </button>
    </div>
  );
};

export default SplashScreen;
