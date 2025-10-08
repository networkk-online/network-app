
import Header from '@/components/Header';
import UserProfile from '@/components/UserProfile';

const Profile = () => {
  // Mock user data - in a real app this would come from context/store or API
  const userData = {
    username: 'your_username',
    displayName: 'Your Name', 
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face',
    followers: 1248,
    following: 567,
    posts: 127,
    bio: 'Content Creator | Digital Artist\nEarning through creativity 💚\nJoin the Network revolution!'
  };

  // Mock posts data for this user
  const userPosts = [
    {
      id: '1',
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop',
      likes: 1247,
      comments: 45
    },
    {
      id: '2', 
      image: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=400&fit=crop',
      likes: 892,
      comments: 23
    },
    {
      id: '3',
      image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=400&fit=crop', 
      likes: 2156,
      comments: 67
    },
    {
      id: '4',
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop',
      likes: 534,
      comments: 12
    },
    {
      id: '5',
      image: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=400&fit=crop',
      likes: 743,
      comments: 34
    },
    {
      id: '6',
      image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=400&fit=crop',
      likes: 1089,
      comments: 56
    }
  ];

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <main className="pt-16 sm:pt-20 pb-8">
        <div className="desktop-layout">
          <div className="container-responsive mobile-padding">
            <UserProfile {...userData} />
            
            {/* Posts Grid - Responsive */}
            <div className="grid grid-cols-3 gap-0.5 sm:gap-1 lg:gap-2 mt-6 sm:mt-8">
              {userPosts.map((post) => (
                <div key={post.id} className="relative aspect-square group cursor-pointer">
                  <img 
                    src={post.image} 
                    alt="Post"
                    className="w-full h-full object-cover rounded-sm lg:rounded-md"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-sm lg:rounded-md">
                    <div className="flex items-center space-x-3 sm:space-x-4 text-white text-sm sm:text-base lg:text-lg">
                      <div className="flex items-center space-x-1">
                        <span className="font-semibold">{post.likes}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="font-semibold">{post.comments}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
