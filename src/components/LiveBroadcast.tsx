
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Video, VideoOff, Mic, MicOff, Users, MessageCircle, Heart, X } from 'lucide-react';

interface LiveBroadcastProps {
  onClose: () => void;
}

const LiveBroadcast = ({ onClose }: LiveBroadcastProps) => {
  const [isLive, setIsLive] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [viewers, setViewers] = useState(0);
  const [comments, setComments] = useState<Array<{id: string, username: string, message: string}>>([
    { id: '1', username: 'alex_creator', message: 'Great stream! 🔥' },
    { id: '2', username: 'sarah_artist', message: 'Love the content!' },
    { id: '3', username: 'mike_photographer', message: 'Amazing quality!' }
  ]);
  const [newComment, setNewComment] = useState('');

  const startBroadcast = () => {
    setIsLive(true);
    // Simulate viewers joining
    const interval = setInterval(() => {
      setViewers(prev => prev + Math.floor(Math.random() * 3));
    }, 2000);
    
    // Clean up interval after 30 seconds for demo
    setTimeout(() => clearInterval(interval), 30000);
  };

  const stopBroadcast = () => {
    setIsLive(false);
    setViewers(0);
  };

  const addComment = () => {
    if (newComment.trim()) {
      setComments(prev => [...prev, {
        id: Date.now().toString(),
        username: 'your_username',
        message: newComment
      }]);
      setNewComment('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex">
      {/* Main broadcast area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold neon-text">Live Broadcast</h1>
            {isLive && (
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-red-500 font-semibold">LIVE</span>
                <div className="flex items-center space-x-1 text-gray-400">
                  <Users className="w-4 h-4" />
                  <span>{viewers}</span>
                </div>
              </div>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Video area */}
        <div className="flex-1 bg-gray-900 flex items-center justify-center relative">
          {isCameraOn ? (
            <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
              <div className="text-center">
                <div className="w-32 h-32 bg-green-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Video className="w-16 h-16 text-black" />
                </div>
                <p className="text-gray-400">Camera feed would appear here</p>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <VideoOff className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400">Camera is off</p>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center justify-center space-x-4">
            <Button
              variant={isCameraOn ? "default" : "destructive"}
              size="lg"
              onClick={() => setIsCameraOn(!isCameraOn)}
              className="rounded-full w-12 h-12 p-0"
            >
              {isCameraOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
            </Button>
            
            <Button
              variant={isMicOn ? "default" : "destructive"}
              size="lg"
              onClick={() => setIsMicOn(!isMicOn)}
              className="rounded-full w-12 h-12 p-0"
            >
              {isMicOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
            </Button>

            {!isLive ? (
              <Button
                onClick={startBroadcast}
                className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-full font-semibold"
              >
                Go Live
              </Button>
            ) : (
              <Button
                onClick={stopBroadcast}
                variant="destructive"
                className="px-8 py-3 rounded-full font-semibold"
              >
                End Stream
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Chat sidebar */}
      <div className="w-80 border-l border-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-800">
          <h3 className="font-semibold text-white">Live Chat</h3>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {comments.map((comment) => (
            <div key={comment.id} className="flex items-start space-x-2">
              <div className="text-sm">
                <span className="font-semibold text-green-400">{comment.username}</span>
                <p className="text-gray-300">{comment.message}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-gray-800">
          <div className="flex space-x-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addComment()}
              placeholder="Say something..."
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <Button size="sm" onClick={addComment} className="bg-green-500 hover:bg-green-600">
              <MessageCircle className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveBroadcast;
