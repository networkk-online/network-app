import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  X,
  Send,
  Check,
  MessageCircle,
  Copy,
  Link2,
  Image as ImageIcon,
  Play,
  PlusCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Friend {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  is_verified?: boolean;
}

interface ContentPreview {
  type: 'post' | 'reel' | 'story';
  thumbnailUrl?: string;
  creatorName: string;
  creatorAvatar?: string;
  caption?: string;
  id: string;
}

interface PremiumShareSheetProps {
  isOpen: boolean;
  onClose: () => void;
  content: ContentPreview;
  shareUrl: string;
}

const springConfig = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 25
};

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03
    }
  }
};

const staggerItem = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 }
};

export const PremiumShareSheet = ({ 
  isOpen, 
  onClose, 
  content, 
  shareUrl 
}: PremiumShareSheetProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [recentFriends, setRecentFriends] = useState<Friend[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<Set<string>>(new Set());
  const [sentTo, setSentTo] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  // Fetch friends (followers you follow back)
  useEffect(() => {
    if (!isOpen) return;
    
    const fetchFriends = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get users the current user follows
        const { data: followingData } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', user.id);

        if (!followingData || followingData.length === 0) {
          setLoading(false);
          return;
        }

        const followingIds = followingData.map(f => f.following_id);

        // Get their profiles
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url, is_verified')
          .in('id', followingIds);

        if (profiles) {
          setFriends(profiles);
          // Set first 5 as recent (in a real app, would track message frequency)
          setRecentFriends(profiles.slice(0, 5));
        }
      } catch (error) {
        console.error('Error fetching friends:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFriends();
  }, [isOpen]);

  // Filter friends based on search
  const filteredFriends = useMemo(() => {
    if (!searchQuery.trim()) return friends;
    const query = searchQuery.toLowerCase();
    return friends.filter(f => 
      f.username?.toLowerCase().includes(query) ||
      f.full_name?.toLowerCase().includes(query)
    );
  }, [friends, searchQuery]);

  const toggleFriendSelection = (friendId: string) => {
    const newSelected = new Set(selectedFriends);
    if (newSelected.has(friendId)) {
      newSelected.delete(friendId);
    } else {
      newSelected.add(friendId);
    }
    setSelectedFriends(newSelected);
  };

  const handleSendToFriend = async (friendId: string) => {
    if (sentTo.has(friendId) || sending) return;
    
    setSending(true);
    try {
      // Trigger haptic feedback
      if (navigator.vibrate) navigator.vibrate(10);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create or get conversation
      const response = await supabase.functions.invoke('create-conversation', {
        body: { otherUserId: friendId }
      });

      if (response.error) throw response.error;
      const conversationId = response.data.conversationId;

      // Create share message content
      const shareContent = message.trim() 
        ? `${message}\n\n🔗 ${shareUrl}`
        : `مشاركة ${content.type === 'post' ? 'منشور' : content.type === 'reel' ? 'ريلز' : 'قصة'} من @${content.creatorName}\n\n🔗 ${shareUrl}`;

      // Send message
      await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: shareContent,
        media_url: content.thumbnailUrl,
        media_type: content.type === 'reel' ? 'video' : 'image'
      });

      setSentTo(prev => new Set(prev).add(friendId));
      
      toast({
        title: 'تم الإرسال',
        description: 'تم مشاركة المحتوى بنجاح'
      });
    } catch (error) {
      console.error('Error sending share:', error);
      toast({
        title: 'خطأ',
        description: 'فشل إرسال المشاركة',
        variant: 'destructive'
      });
    } finally {
      setSending(false);
    }
  };

  const handleSendToAll = async () => {
    if (selectedFriends.size === 0) return;
    
    for (const friendId of selectedFriends) {
      await handleSendToFriend(friendId);
    }
    
    setSelectedFriends(new Set());
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      if (navigator.vibrate) navigator.vibrate(10);
      toast({
        title: 'تم النسخ',
        description: 'تم نسخ الرابط'
      });
    } catch {
      toast({
        title: 'خطأ',
        description: 'فشل نسخ الرابط',
        variant: 'destructive'
      });
    }
  };

  const externalShares = [
    {
      name: 'واتساب',
      icon: MessageCircle,
      color: 'bg-green-500',
      onClick: () => window.open(`https://wa.me/?text=${encodeURIComponent(shareUrl)}`, '_blank')
    },
    {
      name: 'نسخ الرابط',
      icon: Copy,
      color: 'bg-gray-600',
      onClick: handleCopyLink
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={springConfig}
            className="fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] overflow-hidden"
          >
            <div 
              className="bg-[#1C1C1E]/95 backdrop-blur-2xl rounded-t-[28px] border-t border-white/10"
              style={{ 
                boxShadow: '0 -10px 50px rgba(0, 0, 0, 0.5)',
                WebkitBackdropFilter: 'blur(40px)'
              }}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 rounded-full bg-white/30" />
              </div>

              {/* Content Preview */}
              <div className="px-4 pb-4">
                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/10">
                  {/* Thumbnail */}
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-white/10">
                    {content.thumbnailUrl ? (
                      <img 
                        src={content.thumbnailUrl} 
                        alt="" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-6 h-6 text-white/40" />
                      </div>
                    )}
                    {content.type === 'reel' && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <Play className="w-5 h-5 text-white fill-white" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {content.creatorAvatar && (
                        <img 
                          src={content.creatorAvatar} 
                          alt="" 
                          className="w-5 h-5 rounded-full"
                        />
                      )}
                      <span className="text-sm text-white font-medium">@{content.creatorName}</span>
                    </div>
                    {content.caption && (
                      <p className="text-xs text-white/60 truncate mt-1">{content.caption}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Search */}
              <div className="px-4 pb-3">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input
                    type="text"
                    placeholder="ابحث..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-11 pl-12 pr-4 rounded-xl bg-white/10 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-[#833AB4]/50 transition-colors"
                    dir="rtl"
                  />
                </div>
              </div>

              {/* Recent Friends - Horizontal Scroll */}
              {recentFriends.length > 0 && !searchQuery && (
                <div className="pb-4">
                  <h3 className="px-4 text-sm text-white/60 mb-3">الأصدقاء الأخيرون</h3>
                  <div className="flex gap-4 px-4 overflow-x-auto scrollbar-hide">
                    {recentFriends.map((friend, index) => (
                      <motion.button
                        key={friend.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05, ...springConfig }}
                        onClick={() => handleSendToFriend(friend.id)}
                        disabled={sentTo.has(friend.id)}
                        className="flex flex-col items-center gap-2 shrink-0"
                      >
                        <div className="relative">
                          <div className={cn(
                            'w-16 h-16 rounded-full p-0.5 transition-all',
                            selectedFriends.has(friend.id) 
                              ? 'bg-gradient-to-br from-[#833AB4] to-[#E1306C]' 
                              : 'bg-transparent'
                          )}>
                            <img
                              src={friend.avatar_url || '/default-avatar.jpg'}
                              alt={friend.username || ''}
                              className="w-full h-full rounded-full object-cover border-2 border-[#1C1C1E]"
                            />
                          </div>
                          {sentTo.has(friend.id) && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center border-2 border-[#1C1C1E]"
                            >
                              <Check className="w-3.5 h-3.5 text-white" />
                            </motion.div>
                          )}
                        </div>
                        <span className="text-xs text-white/80 max-w-[60px] truncate">
                          {friend.username}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Friends List - Vertical */}
              <div className="px-4 max-h-[300px] overflow-y-auto scrollbar-hide">
                <h3 className="text-sm text-white/60 mb-3">المتابعون</h3>
                
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-8 h-8 border-2 border-[#833AB4] border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : filteredFriends.length === 0 ? (
                  <div className="text-center py-8 text-white/40">
                    {searchQuery ? 'لا توجد نتائج' : 'لا يوجد متابعون'}
                  </div>
                ) : (
                  <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate="show"
                    className="space-y-2"
                  >
                    {filteredFriends.map((friend) => (
                      <motion.div
                        key={friend.id}
                        variants={staggerItem}
                        className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors"
                      >
                        <button
                          onClick={() => toggleFriendSelection(friend.id)}
                          className="shrink-0"
                        >
                          <div className={cn(
                            'w-12 h-12 rounded-full p-0.5 transition-all',
                            selectedFriends.has(friend.id) 
                              ? 'bg-gradient-to-br from-[#833AB4] to-[#E1306C]' 
                              : 'bg-transparent'
                          )}>
                            <img
                              src={friend.avatar_url || '/default-avatar.jpg'}
                              alt={friend.username || ''}
                              className="w-full h-full rounded-full object-cover border-2 border-[#1C1C1E]"
                            />
                          </div>
                        </button>
                        
                        <div className="flex-1 min-w-0" onClick={() => toggleFriendSelection(friend.id)}>
                          <p className="text-white font-medium text-sm truncate">{friend.username}</p>
                          {friend.full_name && (
                            <p className="text-white/50 text-xs truncate">{friend.full_name}</p>
                          )}
                        </div>

                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleSendToFriend(friend.id)}
                          disabled={sentTo.has(friend.id) || sending}
                          className={cn(
                            'px-4 py-2 rounded-xl text-sm font-medium transition-all',
                            sentTo.has(friend.id)
                              ? 'bg-white/10 text-white/60'
                              : 'bg-gradient-to-r from-[#833AB4] to-[#E1306C] text-white'
                          )}
                        >
                          {sentTo.has(friend.id) ? (
                            <span className="flex items-center gap-1">
                              <Check className="w-4 h-4" />
                              تم
                            </span>
                          ) : (
                            'إرسال'
                          )}
                        </motion.button>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </div>

              {/* Message Input */}
              <div className="px-4 py-3 border-t border-white/10 mt-4">
                <input
                  type="text"
                  placeholder="اكتب رسالة..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full h-10 px-4 rounded-xl bg-white/10 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-[#833AB4]/50 transition-colors text-sm"
                  dir="rtl"
                />
              </div>

              {/* Batch Send Button */}
              <AnimatePresence>
                {selectedFriends.size > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="px-4 pb-4"
                  >
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSendToAll}
                      disabled={sending}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-[#833AB4] via-[#C13584] to-[#E1306C] text-white font-medium text-sm shadow-lg shadow-[#833AB4]/30"
                    >
                      {sending ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          جاري الإرسال...
                        </div>
                      ) : (
                        `إرسال إلى ${selectedFriends.size} شخص`
                      )}
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* External Share Options */}
              <div className="px-4 pb-4">
                <div className="flex gap-4 justify-center">
                  {externalShares.map((option) => (
                    <motion.button
                      key={option.name}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={option.onClick}
                      className="flex flex-col items-center gap-2"
                    >
                      <div className={cn(
                        'w-12 h-12 rounded-full flex items-center justify-center',
                        option.color
                      )}>
                        <option.icon className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-xs text-white/60">{option.name}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* URL Preview */}
              <div className="px-4 pb-6 safe-area-bottom">
                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                  <Link2 className="w-4 h-4 text-white/40 shrink-0" />
                  <p className="text-white/40 text-xs truncate flex-1" dir="ltr">{shareUrl}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default PremiumShareSheet;
