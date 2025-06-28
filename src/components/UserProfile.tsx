
import { Button } from '@/components/ui/button';
import { Settings, Grid, Bookmark } from 'lucide-react';

interface UserProfileProps {
  username: string;
  displayName: string;
  avatar: string;
  followers: number;
  following: number;
  posts: number;
  bio: string;
  isOwnProfile?: boolean;
}

const UserProfile = ({ 
  username, 
  displayName, 
  avatar, 
  followers, 
  following, 
  posts, 
  bio, 
  isOwnProfile = true 
}: UserProfileProps) => {
  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8 mb-8">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <img 
            src={avatar} 
            alt={displayName}
            className="w-32 h-32 rounded-full object-cover border-4 border-green-500 neon-glow"
          />
        </div>

        {/* Profile Info */}
        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-6 mb-4">
            <h1 className="text-2xl font-light">{username}</h1>
            <div className="flex space-x-3">
              {isOwnProfile ? (
                <>
                  <Button variant="secondary" size="sm" className="bg-gray-800 hover:bg-gray-700">
                    Edit Profile
                  </Button>
                  <Button variant="ghost" size="sm" className="p-2">
                    <Settings className="w-5 h-5" />
                  </Button>
                </>
              ) : (
                <>
                  <Button className="bg-green-500 hover:bg-green-600 text-black font-semibold">
                    Follow
                  </Button>
                  <Button variant="secondary" size="sm" className="bg-gray-800 hover:bg-gray-700">
                    Message
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="flex justify-center md:justify-start space-x-8 mb-4">
            <div className="text-center">
              <span className="font-bold text-white">{posts}</span>
              <span className="text-gray-400 ml-1">posts</span>
            </div>
            <div className="text-center">
              <span className="font-bold text-white">{followers.toLocaleString()}</span>
              <span className="text-gray-400 ml-1">followers</span>
            </div>
            <div className="text-center">
              <span className="font-bold text-white">{following}</span>
              <span className="text-gray-400 ml-1">following</span>
            </div>
          </div>

          {/* Bio */}
          <div>
            <h2 className="font-semibold mb-1">{displayName}</h2>
            <p className="text-gray-300 whitespace-pre-line">{bio}</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-t border-gray-800">
        <div className="flex justify-center space-x-12">
          <button className="flex items-center space-x-1 py-4 border-t-2 border-green-500 text-green-400">
            <Grid className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wide">Posts</span>
          </button>
          <button className="flex items-center space-x-1 py-4 text-gray-400 hover:text-white">
            <Bookmark className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wide">Saved</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
