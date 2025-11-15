import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Video, VideoOff, Mic, MicOff, Users, MessageCircle, Heart, X, Languages, DollarSign, Gift } from 'lucide-react';
import { RealTimeTranslation } from './RealTimeTranslation';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
interface LiveBroadcastProps {
  onClose: () => void;
}

const LiveBroadcast = ({ onClose }: LiveBroadcastProps) => {
  const { toast } = useToast();
  const [isLive, setIsLive] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [showTranslation, setShowTranslation] = useState(false);
  const [viewers, setViewers] = useState(0);
  const [comments, setComments] = useState<Array<{id: string, username: string, message: string}>>([
    { id: '1', username: 'alex_creator', message: 'Great stream! 🔥' },
    { id: '2', username: 'sarah_artist', message: 'Love the content!' },
    { id: '3', username: 'mike_photographer', message: 'Amazing quality!' }
  ]);
  const [newComment, setNewComment] = useState('');
  const [donationAmount, setDonationAmount] = useState('');
  const [donationMessage, setDonationMessage] = useState('');
  const [donations, setDonations] = useState<Array<{id: string, username: string, amount: number, message?: string}>>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [broadcastId] = useState(`broadcast-${Date.now()}`);
  
  useEffect(() => {
    loadCurrentUser();
    loadDonations();
    
    // Subscribe to realtime donations
    const channel = supabase
      .channel('broadcast-donations')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'broadcast_donations',
          filter: `broadcast_id=eq.${broadcastId}`
        },
        async (payload) => {
          // Load donor profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', payload.new.donor_user_id)
            .single();
            
          setDonations(prev => [{
            id: payload.new.id,
            username: profile?.username || 'Anonymous',
            amount: Number(payload.new.amount),
            message: payload.new.message
          }, ...prev]);
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [broadcastId]);
  
  const loadCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
  };
  
  const loadDonations = async () => {
    const { data } = await supabase
      .from('broadcast_donations')
      .select(`
        id,
        amount,
        message,
        donor_user_id,
        profiles!broadcast_donations_donor_user_id_fkey(username)
      `)
      .eq('broadcast_id', broadcastId)
      .order('created_at', { ascending: false })
      .limit(10);
      
    if (data) {
      setDonations(data.map(d => ({
        id: d.id,
        username: (d.profiles as any)?.username || 'Anonymous',
        amount: Number(d.amount),
        message: d.message || undefined
      })));
    }
  };

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
  
  const sendDonation = async () => {
    if (!currentUser) {
      toast({
        title: "تسجيل الدخول مطلوب",
        description: "يجب تسجيل الدخول لإرسال دعم",
        variant: "destructive"
      });
      return;
    }
    
    const amount = parseFloat(donationAmount);
    if (!amount || amount <= 0) {
      toast({
        title: "مبلغ غير صالح",
        description: "يرجى إدخال مبلغ صحيح",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Get creator user ID (in real app, this would be the broadcaster's ID)
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('broadcast_donations')
        .insert({
          broadcast_id: broadcastId,
          donor_user_id: currentUser.id,
          creator_user_id: user?.id || currentUser.id, // In demo, same user
          amount: amount,
          message: donationMessage.trim() || null
        });
        
      if (error) throw error;
      
      toast({
        title: "تم إرسال الدعم! 🎉",
        description: `تم إرسال ${amount}$ بنجاح. المبدع سيحصل على ${(amount * 0.8).toFixed(2)}$ (بعد خصم 20%)`,
      });
      
      setDonationAmount('');
      setDonationMessage('');
    } catch (error) {
      console.error('Error sending donation:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إرسال الدعم",
        variant: "destructive"
      });
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
          <div className="flex items-center gap-2">
            <Button 
              variant={showTranslation ? "default" : "ghost"} 
              size="sm" 
              onClick={() => setShowTranslation(!showTranslation)}
              className="gap-2"
            >
              <Languages className="w-4 h-4" />
              ترجمة فورية
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Video area */}
        <div className="flex-1 bg-gray-900 flex relative">
          {/* Main video */}
          <div className="flex-1 flex items-center justify-center">
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

          {/* Translation overlay */}
          {showTranslation && (
            <div className="absolute top-4 left-4 right-4 z-10 max-h-[50vh] overflow-y-auto">
              <RealTimeTranslation 
                isVisible={showTranslation}
                onToggle={() => setShowTranslation(!showTranslation)}
              />
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
      
      {/* Donations sidebar */}
      <div className="w-80 border-l border-gray-800 flex flex-col bg-gradient-to-b from-gray-900 to-gray-950">
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-yellow-400" />
            <h3 className="font-semibold text-white">الدعم المالي</h3>
          </div>
        </div>
        
        {/* Donation form */}
        <div className="p-4 border-b border-gray-800 space-y-3">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">المبلغ ($)</label>
            <Input
              type="number"
              value={donationAmount}
              onChange={(e) => setDonationAmount(e.target.value)}
              placeholder="10.00"
              className="bg-gray-800 border-gray-700 text-white"
              min="1"
              step="0.01"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">رسالة (اختياري)</label>
            <Input
              type="text"
              value={donationMessage}
              onChange={(e) => setDonationMessage(e.target.value)}
              placeholder="أرسل رسالة للمبدع..."
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>
          <Button 
            onClick={sendDonation}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
          >
            <DollarSign className="w-4 h-4 ml-1" />
            إرسال دعم
          </Button>
          <p className="text-xs text-gray-400 text-center">
            المبدع يحصل على 80% والمنصة 20%
          </p>
        </div>
        
        {/* Recent donations list */}
        <div className="flex-1 overflow-y-auto p-4">
          <h4 className="text-sm font-semibold text-gray-300 mb-3">آخر المتبرعين 💝</h4>
          <div className="space-y-2">
            {donations.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">لا يوجد دعم بعد</p>
            ) : (
              donations.map((donation) => (
                <div key={donation.id} className="bg-gray-800/50 rounded-lg p-3 border border-yellow-500/20">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-yellow-400 text-sm">{donation.username}</span>
                    <span className="text-yellow-400 font-bold">${donation.amount.toFixed(2)}</span>
                  </div>
                  {donation.message && (
                    <p className="text-xs text-gray-400">{donation.message}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveBroadcast;
