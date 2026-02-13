import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Video, VideoOff, Mic, MicOff, X, RotateCcw } from 'lucide-react';
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

import type { LiveComment } from './live';

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
    { id: '1', username: 'سيف_العراق', message: 'يا هلا! 🔥', isVIP: true },
    { id: '2', username: 'نور123', message: 'شلون الحال؟' },
    { id: '3', username: 'احمد_بغداد', message: 'بث رائع! ❤️', isTopGifter: true }
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
    const newComment: LiveComment = { id: Date.now().toString(), username: 'أنت', message, isHost: true };
    setLiveComments(prev => [...prev, newComment]);
  };

  const startBroadcast = async () => {
    await initCamera();
    setIsLive(true);
    const interval = setInterval(() => {
      setViewers(prev => prev + Math.floor(Math.random() * 5));
      const randomComments: LiveComment[] = [
        { id: Date.now().toString(), username: 'مستخدم_عشوائي', message: 'رائع! 🔥' },
        { id: (Date.now()+1).toString(), username: 'fan123', message: 'استمر!', isVIP: true },
        { id: (Date.now()+2).toString(), username: 'نور_العراق', message: 'احسنت ❤️', isTopGifter: true },
        { id: (Date.now()+3).toString(), username: 'بغداد_لايف', message: 'ناااازك 🔥🔥' },
        { id: (Date.now()+4).toString(), username: 'عراقي_حر', message: 'يا عيني عليك' },
      ];
      const randomComment = randomComments[Math.floor(Math.random() * randomComments.length)];
      setLiveComments(prev => [...prev, { ...randomComment, id: Date.now().toString() }].slice(-50));
    }, 2000);
    setTimeout(() => clearInterval(interval), 120000);
  };

  const stopBroadcast = () => {
    setIsLive(false);
    setViewers(0);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black z-50 flex"
    >
      {/* ═══ VIDEO CONTAINER ═══ */}
      {/* Portrait: full-screen. Landscape: left side */}
      <div className="relative flex-1 min-w-0">
        {isCameraOn && isLive ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#0a0a0a] via-[#0d1a0f] to-[#0a0a0a] flex items-center justify-center">
            {!isLive ? (
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center"
              >
                <motion.div 
                  animate={{ 
                    boxShadow: [
                      '0 0 0 0 rgba(25, 224, 91, 0)',
                      '0 0 40px 15px rgba(25, 224, 91, 0.2)',
                      '0 0 0 0 rgba(25, 224, 91, 0)',
                    ]
                  }}
                  transition={{ repeat: Infinity, duration: 3 }}
                  className="w-28 h-28 bg-gradient-to-br from-[#19e05b] to-[#0f8a3a] rounded-full mx-auto mb-6 flex items-center justify-center"
                >
                  <Video className="w-14 h-14 text-black" />
                </motion.div>
                <h2 className="text-2xl font-bold text-white mb-2">جاهز للبث المباشر؟</h2>
                <p className="text-white/40 text-sm">اضغط على "بدء البث" للانطلاق</p>
              </motion.div>
            ) : (
              <div className="text-center">
                <VideoOff className="w-16 h-16 text-white/20 mx-auto mb-4" />
                <p className="text-white/40">الكاميرا متوقفة</p>
              </div>
            )}
          </div>
        )}

        {/* TikTok-style overlay when live */}
        {isLive && (
          <TikTokLiveOverlay
            streamerName="أنت"
            viewerCount={viewers}
            onClose={onClose}
            onSendComment={handleSendLiveComment}
            onSendGift={(giftType, amount) => {
              console.log('Gift sent:', giftType, amount);
            }}
            comments={liveComments}
            translationEnabled={showTranslation}
            onToggleTranslation={() => setShowTranslation(!showTranslation)}
            isHost={true}
          />
        )}
      </div>

      {/* ═══ LANDSCAPE CHAT PANEL — only on wide screens ═══ */}
      {isLive && (
        <div className="hidden lg:flex w-[360px] flex-col bg-[#0a0a0a] border-l border-white/10">
          {/* Chat header */}
          <div className="p-3 border-b border-white/10 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#19e05b] animate-pulse" />
            <span className="text-white font-semibold text-sm">الدردشة المباشرة</span>
            <span className="text-white/40 text-xs ml-auto">{viewers} مشاهد</span>
          </div>

          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto p-3 scrollbar-hide">
            <AnimatePresence initial={false}>
              {liveComments.slice(-50).map((comment) => (
                <motion.div
                  key={comment.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="py-1"
                >
                  <p className="text-[13px]">
                    <span className={`font-bold ${
                      comment.isHost ? 'text-[#19e05b]' 
                      : comment.isVIP || comment.isTopGifter ? 'text-[#19e05b]' 
                      : 'text-white/60'
                    }`}>
                      {comment.username}
                    </span>
                    <span className="text-white/30 mx-1">:</span>
                    <span className="text-white/80">{comment.message}</span>
                  </p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Chat input */}
          <div className="p-3 border-t border-white/10">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="أرسل رسالة..."
                className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-white text-sm placeholder:text-white/30 outline-none focus:border-[#19e05b]/50"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    const target = e.target as HTMLInputElement;
                    if (target.value.trim()) {
                      handleSendLiveComment(target.value);
                      target.value = '';
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ═══ PRE-LIVE CONTROLS ═══ */}
      {!isLive && (
        <>
          <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-20">
            <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/10 rounded-full">
              <X className="w-6 h-6" />
            </Button>
            <h1 className="text-lg font-bold text-white">البث المباشر</h1>
            <div className="w-10" />
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/90 to-transparent">
            <div className="flex items-center justify-center gap-6">
              <Button
                variant="ghost"
                size="lg"
                onClick={() => setIsCameraOn(!isCameraOn)}
                className={`w-14 h-14 rounded-full ${isCameraOn ? 'bg-white/10 border border-white/20' : 'bg-red-500/50'}`}
              >
                {isCameraOn ? <Video className="w-6 h-6 text-white" /> : <VideoOff className="w-6 h-6 text-white" />}
              </Button>
              
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={startBroadcast}
                className="w-20 h-20 bg-[#19e05b] rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(25,224,91,0.4)]"
              >
                <span className="text-black font-black text-lg">بدء</span>
              </motion.button>

              <Button
                variant="ghost"
                size="lg"
                onClick={() => setIsMicOn(!isMicOn)}
                className={`w-14 h-14 rounded-full ${isMicOn ? 'bg-white/10 border border-white/20' : 'bg-red-500/50'}`}
              >
                {isMicOn ? <Mic className="w-6 h-6 text-white" /> : <MicOff className="w-6 h-6 text-white" />}
              </Button>
            </div>
          </div>
        </>
      )}

      {/* ═══ LIVE CONTROLS ═══ */}
      {isLive && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 lg:left-[calc(50%-180px)]">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={switchCamera}
              className="w-11 h-11 rounded-full bg-black/50 backdrop-blur-md border border-white/10"
            >
              <RotateCcw className="w-5 h-5 text-white" />
            </Button>
            
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={stopBroadcast}
              className="px-6 py-2.5 bg-red-500 rounded-full shadow-[0_0_20px_rgba(239,68,68,0.3)]"
            >
              <span className="text-white font-bold">إنهاء البث</span>
            </motion.button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMicOn(!isMicOn)}
              className={`w-11 h-11 rounded-full ${isMicOn ? 'bg-black/50' : 'bg-red-500/60'} backdrop-blur-md border border-white/10`}
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
