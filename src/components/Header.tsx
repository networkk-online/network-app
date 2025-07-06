
import { Heart, Home, MessageCircle, PlusSquare, Search, User, Video, Building2, Users, LogIn, Film, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black border-b border-gray-800">
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 flex items-center justify-center">
              <img 
                src="/lovable-uploads/af5dfbd6-d4e4-4f84-be84-7086fe302cd2.png" 
                alt="Network Logo" 
                className="w-8 h-8 object-contain"
              />
            </div>
            <h1 className="text-xl font-bold neon-text">Network</h1>
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex items-center bg-gray-900 rounded-lg px-3 py-2 w-64">
            <Search className="w-4 h-4 text-gray-400 mr-2" />
            <input 
              type="text" 
              placeholder="Search..." 
              className="bg-transparent text-white placeholder-gray-400 outline-none flex-1 text-sm"
            />
          </div>

          {/* Navigation Icons */}
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" className="p-2 hover:bg-gray-900" onClick={() => navigate('/')}>
              <Home className="w-6 h-6" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-2 hover:bg-gray-900"
              onClick={() => navigate('/explore')}
            >
              <Compass className="w-6 h-6" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-2 hover:bg-gray-900"
              onClick={() => navigate('/shorts')}
            >
              <Film className="w-6 h-6" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-2 hover:bg-gray-900"
              onClick={() => navigate('/messages')}
            >
              <MessageCircle className="w-6 h-6" />
            </Button>
            <Button variant="ghost" size="sm" className="p-2 hover:bg-gray-900">
              <PlusSquare className="w-6 h-6" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-2 hover:bg-gray-900"
              onClick={() => navigate('/broadcast')}
            >
              <Video className="w-6 h-6" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-2 hover:bg-gray-900"
              onClick={() => navigate('/pages')}
            >
              <Users className="w-6 h-6" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-2 hover:bg-gray-900"
              onClick={() => navigate('/business')}
            >
              <Building2 className="w-6 h-6" />
            </Button>
            <Button variant="ghost" size="sm" className="p-2 hover:bg-gray-900">
              <Heart className="w-6 h-6" />
            </Button>
            <Button variant="ghost" size="sm" className="p-2 hover:bg-gray-900">
              <User className="w-6 h-6" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-2 hover:bg-gray-900"
              onClick={() => navigate('/login')}
            >
              <LogIn className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
