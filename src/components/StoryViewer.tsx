import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Eye, MessageCircle, Send, MoreVertical, Star, AtSign, MoreHorizontal } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { StoryViewers } from './StoryViewers';
import { useStoryViews } from '@/hooks/useStoryViews';
import { StoryQuestion } from './StoryQuestion';
import { StoryPoll } from './StoryPoll';
import { useNavigate } from 'react-router-dom';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { ReportDialog } from './ReportDialog';
import { useFollow } from '@/hooks/useFollow';
import { ScrollArea } from './ui/scroll-area';

interface Story {
  id: string;
  user_id: string;
  media_url: string;
  media_type: string;
  created_at: string;
  expires_at: string;
  views_count: number;
  story_type?: string;
  question_text?: string;
  poll_question?: string;
  poll_options?: any;
  poll_votes?: any;
  allow_story_replies?: boolean;
  profiles?: {
    username: string;
    avatar_url: string;
  };
}

interface StoryViewerProps {
  stories: Story[];
  currentIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}

const StoryViewer = ({ stories, currentIndex, onClose, onNext, onPrev }: StoryViewerProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [showViewers, setShowViewers] = useState(false);
  const [isOwnStory, setIsOwnStory] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const currentStory = stories[currentIndex];
  const { recordView } = useStoryViews(currentStory?.id || '');
  const { isFollowing, toggleFollow } = useFollow(currentStory?.user_id || '');

  useEffect(() => {
    if (!currentStory) return;

    // Check if this is the current user's story
    const checkOwnership = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsOwnStory(user?.id === currentStory.user_id);
      
      // Record view if not own story
      if (user && user.id !== currentStory.user_id) {
        recordView();
      }
    };
    checkOwnership();

    // Reset progress
    setProgress(0);
    
    // Auto progress
    const duration = currentStory.media_type === 'video' ? 60000 : 10000; // 60s for video, 10s for image
    const interval = 50;
    const increment = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          if (currentIndex < stories.length - 1) {
            onNext();
          } else {
            onClose();
          }
          return 100;
        }
        return prev + increment;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [currentIndex, currentStory]);

  if (!currentStory) return null;

  const timeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'الآن';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}د`;
    return `${Math.floor(seconds / 3600)}س`;
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || isSendingReply || !currentStory) return;

    try {
      setIsSendingReply(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "خطأ",
          description: "يجب تسجيل الدخول للرد على القصة",
          variant: "destructive",
        });
        return;
      }

      // Check if story allows replies
      if (!currentStory.allow_story_replies) {
        toast({
          title: "غير مسموح",
          description: "صاحب القصة لا يسمح بالردود",
          variant: "destructive",
        });
        return;
      }

      // Insert story reply
      const { error } = await supabase
        .from('story_replies')
        .insert({
          story_id: currentStory.id,
          sender_id: user.id,
          receiver_id: currentStory.user_id,
          content: replyText,
        });

      if (error) throw error;

      toast({
        title: "تم الإرسال",
        description: "تم إرسال ردك على القصة",
      });

      setReplyText('');
    } catch (error) {
      console.error('Error sending story reply:', error);
      toast({
        title: "خطأ",
        description: "فشل إرسال الرد",
        variant: "destructive",
      });
    } finally {
      setIsSendingReply(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      {/* Progress bars */}
      <div className="absolute top-0 left-0 right-0 flex space-x-1 p-2 z-10">
        {stories.map((_, idx) => (
          <div key={idx} className="flex-1 h-0.5 bg-gray-600 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white transition-all duration-100"
              style={{ 
                width: idx === currentIndex ? `${progress}%` : idx < currentIndex ? '100%' : '0%'
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-4 left-0 right-0 flex items-center justify-between px-4 z-10">
        <div className="flex items-center space-x-3 space-x-reverse">
          <img 
            src={currentStory.profiles?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face'}
            alt={currentStory.profiles?.username || ''}
            className="w-10 h-10 rounded-full border-2 border-white"
          />
          <div>
            <p className="text-white font-semibold">{currentStory.profiles?.username}</p>
            <p className="text-gray-300 text-sm">{timeAgo(currentStory.created_at)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isOwnStory && (
            <Popover>
              <PopoverTrigger asChild>
                <button className="text-white hover:bg-white/20 p-2 rounded-full transition-colors">
                  <MoreVertical className="w-6 h-6" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-0 bg-gray-900/98 backdrop-blur-sm border-gray-800" align="end">
                <ScrollArea className="max-h-[500px]">
                  <div className="flex flex-col py-2">
                    <p className="px-4 py-2 text-xs text-gray-400">
                      أرشف القصص أثناء نشاطها
                    </p>
                    
                    <Button
                      variant="ghost"
                      className="justify-center text-red-500 hover:bg-white/10 hover:text-red-400 rounded-none py-3"
                      onClick={() => {
                        toast({
                          title: "حذف القصة",
                          description: "سيتم حذف القصة",
                        });
                      }}
                    >
                      حذف القصة
                    </Button>

                    <div className="border-t border-gray-800 my-1" />

                    <Button
                      variant="ghost"
                      className="justify-center text-white hover:bg-white/10 rounded-none py-3"
                      onClick={() => {
                        toast({
                          title: "أرشفة",
                          description: "تم نقل القصة إلى الأرشيف",
                        });
                      }}
                    >
                      أرشفة
                    </Button>

                    <Button
                      variant="ghost"
                      className="justify-center text-white hover:bg-white/10 rounded-none py-3"
                      onClick={() => {
                        toast({
                          title: "هايلايت",
                          description: "إضافة إلى الهايلايت",
                        });
                      }}
                    >
                      إضافة إلى الهايلايت
                    </Button>

                    <Button
                      variant="ghost"
                      className="justify-center text-white hover:bg-white/10 rounded-none py-3"
                      onClick={() => {
                        toast({
                          title: "حفظ",
                          description: "تم حفظ القصة",
                        });
                      }}
                    >
                      حفظ...
                    </Button>

                    <Button
                      variant="ghost"
                      className="justify-center text-white hover:bg-white/10 rounded-none py-3"
                      onClick={() => {
                        toast({
                          title: "إرسال",
                          description: "إرسال القصة إلى الأصدقاء",
                        });
                      }}
                    >
                      إرسال
                    </Button>

                    <Button
                      variant="ghost"
                      className="justify-center text-white hover:bg-white/10 rounded-none py-3"
                      onClick={() => {
                        toast({
                          title: "Edit AI Label",
                          description: "تعديل التسمية",
                        });
                      }}
                    >
                      Edit AI Label
                    </Button>

                    <Button
                      variant="ghost"
                      className="justify-center text-white hover:bg-white/10 rounded-none py-3"
                      onClick={() => {
                        toast({
                          title: "تعزيز القصة",
                          description: "تعزيز القصة للوصول لجمهور أكبر",
                        });
                      }}
                    >
                      تعزيز القصة
                    </Button>

                    <Button
                      variant="ghost"
                      className="justify-center text-white hover:bg-white/10 rounded-none py-3"
                      onClick={() => {
                        toast({
                          title: "مشاركة",
                          description: "مشاركة إلى قصة فيسبوك",
                        });
                      }}
                    >
                      مشاركة إلى قصة فيسبوك
                    </Button>

                    <Button
                      variant="ghost"
                      className="justify-center text-white hover:bg-white/10 rounded-none py-3"
                      onClick={() => {
                        toast({
                          title: "إعدادات القصة",
                          description: "فتح إعدادات القصة",
                        });
                      }}
                    >
                      إعدادات القصة
                    </Button>

                    <Button
                      variant="ghost"
                      className="justify-center text-white hover:bg-white/10 rounded-none py-3"
                      onClick={() => {
                        toast({
                          title: "إيقاف التعليقات",
                          description: "تم إيقاف التعليقات على القصة",
                        });
                      }}
                    >
                      إيقاف التعليقات
                    </Button>

                    <div className="border-t border-gray-800 my-1" />

                    <Button
                      variant="ghost"
                      className="justify-center text-white hover:bg-white/10 rounded-none py-3"
                      onClick={() => {}}
                    >
                      إلغاء
                    </Button>
                  </div>
                </ScrollArea>
              </PopoverContent>
            </Popover>
          )}
          {!isOwnStory && (
            <Popover open={showMenu} onOpenChange={setShowMenu}>
              <PopoverTrigger asChild>
                <button className="text-white hover:bg-white/20 p-2 rounded-full transition-colors">
                  <MoreVertical className="w-6 h-6" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-0 bg-gray-800/95 backdrop-blur-sm border-gray-700" align="end">
                <div className="flex flex-col">
                  <ReportDialog reportedUserId={currentStory.user_id} />
                  <Button
                    variant="ghost"
                    className="justify-start text-white hover:bg-white/10 rounded-none"
                    onClick={() => {
                      navigate(`/profile/${currentStory.user_id}`);
                      setShowMenu(false);
                    }}
                  >
                    حول هذا الحساب
                  </Button>
                  <Button
                    variant="ghost"
                    className="justify-start text-white hover:bg-white/10 rounded-none"
                    onClick={() => {
                      toast({
                        title: "تم كتم المستخدم",
                        description: "لن ترى المزيد من قصص هذا المستخدم",
                      });
                      setShowMenu(false);
                    }}
                  >
                    كتم
                  </Button>
                  {isFollowing && (
                    <Button
                      variant="ghost"
                      className="justify-start text-white hover:bg-white/10 rounded-none"
                      onClick={() => {
                        toggleFollow();
                        setShowMenu(false);
                      }}
                    >
                      إلغاء المتابعة
                    </Button>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          )}
          <button onClick={onClose} className="text-white hover:bg-white/20 p-2 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Navigation arrows */}
      {currentIndex > 0 && (
        <button 
          onClick={onPrev}
          className="absolute left-4 z-10 bg-black/50 p-3 rounded-full hover:bg-black/70"
        >
          <ChevronRight className="w-6 h-6 text-white" />
        </button>
      )}
      
      {currentIndex < stories.length - 1 && (
        <button 
          onClick={onNext}
          className="absolute right-4 z-10 bg-black/50 p-3 rounded-full hover:bg-black/70"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
      )}

      {/* Media content */}
      <div className="relative w-full h-full flex items-center justify-center">
        {currentStory.media_type === 'video' ? (
          <video 
            src={currentStory.media_url}
            className="max-h-full max-w-full object-contain"
            autoPlay
            loop
            playsInline
          />
        ) : (
          <img 
            src={currentStory.media_url}
            alt="Story"
            className="max-h-full max-w-full object-contain"
          />
        )}
      </div>

      {/* Click areas for navigation */}
      <div className="absolute inset-0 flex">
        <div className="flex-1" onClick={onPrev} />
        <div className="flex-1" onClick={onNext} />
      </div>

      {/* Interactive Elements */}
      {currentStory.story_type === 'question' && currentStory.question_text && (
        <StoryQuestion
          storyId={currentStory.id}
          questionText={currentStory.question_text}
          isOwner={isOwnStory}
          storyOwnerId={currentStory.user_id}
        />
      )}

      {currentStory.story_type === 'poll' && currentStory.poll_question && currentStory.poll_options && (
        <StoryPoll
          storyId={currentStory.id}
          pollQuestion={currentStory.poll_question}
          pollOptions={currentStory.poll_options}
          pollVotes={currentStory.poll_votes || {}}
          isOwner={isOwnStory}
        />
      )}

      {/* Reply Input - Only show if not own story and replies are allowed */}
      {!isOwnStory && currentStory.allow_story_replies && (
        <div className="absolute bottom-4 left-4 right-4 z-10">
          <div className="flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-full p-2">
            <Input
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="أرسل رسالة..."
              className="flex-1 bg-transparent border-0 text-white placeholder:text-gray-400 focus-visible:ring-0"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendReply();
                }
              }}
            />
            <Button
              size="icon"
              onClick={handleSendReply}
              disabled={!replyText.trim() || isSendingReply}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-full"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Bottom Action Bar - Only show for own stories */}
      {isOwnStory && (
        <div className="absolute bottom-4 left-0 right-0 z-10 px-4">
          <div className="bg-black/80 backdrop-blur-sm rounded-2xl p-3">
            <div className="flex items-center justify-around">
              <button 
                className="flex flex-col items-center gap-1 p-2 hover:bg-white/10 rounded-lg transition-colors"
                onClick={() => setShowViewers(true)}
              >
                <Eye className="w-6 h-6 text-white" />
                <span className="text-xs text-white">Activity</span>
              </button>

              <button 
                className="flex flex-col items-center gap-1 p-2 hover:bg-white/10 rounded-lg transition-colors"
                onClick={() => {
                  const currentStory = stories[currentIndex];
                  const storyUrl = `${window.location.origin}/story/${currentStory.id}`;
                  const shareText = `شاهد قصتي على Network!\n${storyUrl}`;
                  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
                  
                  window.open(whatsappUrl, '_blank');
                  
                  toast({
                    title: "تم فتح واتساب",
                    description: "يمكنك الآن مشاركة قصتك",
                  });
                }}
              >
                <MessageCircle className="w-6 h-6 text-white" />
                <span className="text-xs text-white">WhatsApp</span>
              </button>

              <button 
                className="flex flex-col items-center gap-1 p-2 hover:bg-white/10 rounded-lg transition-colors"
                onClick={() => {
                  toast({
                    title: "هايلايت",
                    description: "إضافة إلى الهايلايت",
                  });
                }}
              >
                <Star className="w-6 h-6 text-white" />
                <span className="text-xs text-white">Highlight</span>
              </button>

              <button 
                className="flex flex-col items-center gap-1 p-2 hover:bg-white/10 rounded-lg transition-colors"
                onClick={() => {
                  toast({
                    title: "إشارة",
                    description: "الإشارة إلى شخص",
                  });
                }}
              >
                <AtSign className="w-6 h-6 text-white" />
                <span className="text-xs text-white">Mention</span>
              </button>

              <button 
                className="flex flex-col items-center gap-1 p-2 hover:bg-white/10 rounded-lg transition-colors"
                onClick={() => {
                  toast({
                    title: "إرسال",
                    description: "إرسال القصة",
                  });
                }}
              >
                <Send className="w-6 h-6 text-white" />
                <span className="text-xs text-white">Send</span>
              </button>

              <button 
                className="flex flex-col items-center gap-1 p-2 hover:bg-white/10 rounded-lg transition-colors"
                onClick={() => {
                  toast({
                    title: "المزيد",
                    description: "خيارات إضافية",
                  });
                }}
              >
                <MoreHorizontal className="w-6 h-6 text-white" />
                <span className="text-xs text-white">More</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Viewers Dialog */}
      <Dialog open={showViewers} onOpenChange={setShowViewers}>
        <DialogContent className="bg-gray-900/98 backdrop-blur-sm border-gray-800 max-w-md p-0">
          <StoryViewers storyId={currentStory.id} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StoryViewer;
