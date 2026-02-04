import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Video, VideoOff, Mic, MicOff, X, Gift, RotateCcw, MessageCircle, DollarSign } from 'lucide-react';
import { RealTimeTranslation } from './RealTimeTranslation';
import { DonationReplyDialog } from './DonationReplyDialog';
import { TikTokLiveOverlay } from './TikTokLiveOverlay';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useInteractiveNotifications } from '@/hooks/useInteractiveNotifications';
import { motion, AnimatePresence } from 'framer-motion';

interface LiveBroadcastProps {
  onClose: () => void;
}

interface LiveComment {
  id: string;
  username: string;
  avatar?: string;
  message: string;
  isTranslated?: boolean;
}

const LiveBroadcast = ({ onClose }: LiveBroadcastProps) => {
  const { toast } = useToast();
  const { sendInteractiveNotification, permission, requestPermission } = useInteractiveNotifications();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [isLive, setIsLive] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [showTranslation, setShowTranslation] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [viewers, setViewers] = useState(0);
  const [liveComments, setLiveComments] = useState<LiveComment[]>([
    { id: '1', username: 'سيف_العراق', message: 'يا هلا! 🔥' },
    { id: '2', username: 'نور123', message: 'شلون الحال؟' },
    { id: '3', username: 'احمد_بغداد', message: 'بث رائع! ❤️' }
  ]);
  const [donationAmount, setDonationAmount] = useState('');
  const [donationMessage, setDonationMessage] = useState('');
  const [donations, setDonations] = useState<Array<{id: string, username: string, amount: number, message?: string, donor_user_id: string, creator_user_id: string}>>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [broadcastId] = useState(`broadcast-${Date.now()}`);
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState<any>(null);
  
  useEffect(() => {
    loadCurrentUser();
    loadDonations();
    
    if (permission === 'default') {
      requestPermission();
    }
    
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
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', payload.new.donor_user_id)
            .single();
            
          const newDonation = {
            id: payload.new.id,
            username: profile?.username || 'Anonymous',
            amount: Number(payload.new.amount),
            message: payload.new.message,
            donor_user_id: payload.new.donor_user_id,
            creator_user_id: payload.new.creator_user_id
          };
          
          setDonations(prev => [newDonation, ...prev]);
          
          if (permission === 'granted') {
            sendInteractiveNotification({
              title: '🎉 دعم جديد!',
              body: `${profile?.username || 'مستخدم'} أرسل لك ${Number(payload.new.amount).toFixed(2)}$`,
              icon: profile?.avatar_url || '/favicon.ico',
              data: { 
                type: 'donation',
                postId: '',
                userId: payload.new.donor_user_id,
                userName: profile?.username || 'Anonymous',
                userAvatar: profile?.avatar_url || '',
                content: payload.new.message || ''
              },
              actions: []
            });
          }
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [broadcastId, permission, requestPermission, sendInteractiveNotification]);
  
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
        creator_user_id,
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
        message: d.message || undefined,
        donor_user_id: d.donor_user_id,
        creator_user_id: d.creator_user_id
      })));
    }
  };
  
  const handleReplyToDonation = (donation: any) => {
    setSelectedDonation({
      id: donation.id,
      donor_user_id: donation.donor_user_id,
      creator_user_id: donation.creator_user_id,
      amount: donation.amount,
      donor_username: donation.username,
      message: donation.message
    });
    setReplyDialogOpen(true);
  };

  const initCamera = async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingMode, width: { ideal: 1080 }, height: { ideal: 1920 } },
        audio: isMicOn
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraOn(true);
    } catch (error) {
      console.error('Camera error:', error);
      toast({ title: 'خطأ في الكاميرا', description: 'تعذر تشغيل الكاميرا', variant: 'destructive' });
    }
  };

  const switchCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  useEffect(() => {
    if (isLive && isCameraOn) {
      initCamera();
    }
  }, [isLive, facingMode]);

  const handleSendLiveComment = (message: string) => {
    const newComment: LiveComment = { id: Date.now().toString(), username: 'أنت', message };
    setLiveComments(prev => [...prev, newComment]);
  };

  const startBroadcast = async () => {
    await initCamera();
    setIsLive(true);
    const interval = setInterval(() => {
      setViewers(prev => prev + Math.floor(Math.random() * 5));
      const randomComments = [
        { username: 'مستخدم_عشوائي', message: 'رائع! 🔥' },
        { username: 'fan123', message: 'استمر!' },
        { username: 'نور_العراق', message: 'احسنت ❤️' },
      ];
      const randomComment = randomComments[Math.floor(Math.random() * randomComments.length)];
      setLiveComments(prev => [...prev, { ...randomComment, id: Date.now().toString() }].slice(-30));
    }, 3000);
    setTimeout(() => clearInterval(interval), 60000);
  };

  const stopBroadcast = () => {
    setIsLive(false);
    setViewers(0);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const sendDonation = async () => {
    if (!currentUser) {
      toast({ title: "تسجيل الدخول مطلوب", description: "يجب تسجيل الدخول لإرسال دعم", variant: "destructive" });
      return;
    }
    
    const amount = parseFloat(donationAmount);
    if (!amount || amount <= 0) {
      toast({ title: "مبلغ غير صالح", description: "يرجى إدخال مبلغ صحيح", variant: "destructive" });
      return;
    }
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('broadcast_donations')
        .insert({
          broadcast_id: broadcastId,
          donor_user_id: currentUser.id,
          creator_user_id: user?.id || currentUser.id,
          amount: amount,
          message: donationMessage.trim() || null
        });
        
      if (error) throw error;
      toast({ title: "تم إرسال الدعم! 🎉", description: `تم إرسال ${amount}$ بنجاح` });
      setDonationAmount('');
      setDonationMessage('');
    } catch (error) {
      console.error('Error sending donation:', error);
      toast({ title: "خطأ", description: "حدث خطأ أثناء إرسال الدعم", variant: "destructive" });
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black z-50"
    >
      {/* Full-screen video background */}
      <div className="absolute inset-0">
        {isCameraOn && isLive ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 flex items-center justify-center">
            {!isLive ? (
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center"
              >
                <div className="w-32 h-32 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full mx-auto mb-6 flex items-center justify-center shadow-2xl shadow-pink-500/30">
                  <Video className="w-16 h-16 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">جاهز للبث المباشر؟</h2>
                <p className="text-gray-400">اضغط على "بدء البث" للانطلاق</p>
              </motion.div>
            ) : (
              <div className="text-center">
                <VideoOff className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">الكاميرا متوقفة</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* TikTok-style overlay when live */}
      {isLive && (
        <TikTokLiveOverlay
          streamerName="أنت"
          viewerCount={viewers}
          onClose={onClose}
          onSendComment={handleSendLiveComment}
          comments={liveComments}
          translationEnabled={showTranslation}
          onToggleTranslation={() => setShowTranslation(!showTranslation)}
        />
      )}

      {/* Translation overlay */}
      {showTranslation && isLive && (
        <div className="absolute top-20 left-4 right-4 z-30 max-h-[40vh] overflow-y-auto">
          <RealTimeTranslation 
            isVisible={showTranslation}
            onToggle={() => setShowTranslation(!showTranslation)}
          />
        </div>
      )}

      {/* Pre-live controls */}
      {!isLive && (
        <>
          <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-20 bg-gradient-to-b from-black/60 to-transparent">
            <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20 rounded-full">
              <X className="w-6 h-6" />
            </Button>
            <h1 className="text-xl font-bold text-white">البث المباشر</h1>
            <div className="w-10" />
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/80 to-transparent">
            <div className="flex items-center justify-center gap-6">
              <Button
                variant="ghost"
                size="lg"
                onClick={() => setIsCameraOn(!isCameraOn)}
                className={`w-14 h-14 rounded-full ${isCameraOn ? 'bg-white/20' : 'bg-red-500/50'}`}
              >
                {isCameraOn ? <Video className="w-6 h-6 text-white" /> : <VideoOff className="w-6 h-6 text-white" />}
              </Button>
              
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={startBroadcast}
                className="w-20 h-20 bg-gradient-to-r from-pink-500 to-red-500 rounded-full flex items-center justify-center shadow-2xl shadow-red-500/40"
              >
                <span className="text-white font-bold">بدء</span>
              </motion.button>

              <Button
                variant="ghost"
                size="lg"
                onClick={() => setIsMicOn(!isMicOn)}
                className={`w-14 h-14 rounded-full ${isMicOn ? 'bg-white/20' : 'bg-red-500/50'}`}
              >
                {isMicOn ? <Mic className="w-6 h-6 text-white" /> : <MicOff className="w-6 h-6 text-white" />}
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Live controls */}
      {isLive && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={switchCamera}
              className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm"
            >
              <RotateCcw className="w-5 h-5 text-white" />
            </Button>
            
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={stopBroadcast}
              className="px-6 py-3 bg-red-500 rounded-full"
            >
              <span className="text-white font-bold">إنهاء البث</span>
            </motion.button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMicOn(!isMicOn)}
              className={`w-12 h-12 rounded-full ${isMicOn ? 'bg-black/40' : 'bg-red-500/60'} backdrop-blur-sm`}
            >
              {isMicOn ? <Mic className="w-5 h-5 text-white" /> : <MicOff className="w-5 h-5 text-white" />}
            </Button>
          </div>
        </div>
      )}
      
      {selectedDonation && (
        <DonationReplyDialog
          isOpen={replyDialogOpen}
          onClose={() => {
            setReplyDialogOpen(false);
            setSelectedDonation(null);
          }}
          donation={selectedDonation}
        />
      )}
    </motion.div>
  );
};

export default LiveBroadcast;
