import { useState, useEffect, useRef, memo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight, Eye, MessageCircle, Send, MoreVertical, Star, AtSign, MoreHorizontal, Share2, Facebook, Twitter, Instagram, Link, Mail, Volume2, VolumeX, Music2 } from 'lucide-react';
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
import { AddToHighlightDialog } from './AddToHighlightDialog';
import { VerifiedBadge } from './VerifiedBadge';

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
  music_title?: string | null;
  music_artist?: string | null;
  music_url?: string | null;
  profiles?: {
    username: string;
    avatar_url: string;
    is_verified?: boolean;
  };
}

interface StoryViewerProps {
  stories: Story[];
  currentIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  onStoryViewed?: (storyId: string, userId: string) => void;
}

const StoryViewer = ({ stories, currentIndex, onClose, onNext, onPrev, onStoryViewed }: StoryViewerProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [showViewers, setShowViewers] = useState(false);
  const [showAddToHighlight, setShowAddToHighlight] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [isOwnStory, setIsOwnStory] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showOwnMenu, setShowOwnMenu] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isTypingReply, setIsTypingReply] = useState(false);
  const [storyMuted, setStoryMuted] = useState(false);
  const storyAudioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef(0);
  const progressAnimRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const currentStory = stories[currentIndex];
  const { recordView } = useStoryViews(currentStory?.id || '');
  const { isFollowing, toggleFollow } = useFollow(currentStory?.user_id || '');

  // Dialogs should NOT pause story progress — only menus and typing should
  const shouldPause = isPaused || isTypingReply || showMenu || showOwnMenu;
  
  // Audio ref for background music continuity
  const audioContextRef = useRef<AudioContext | null>(null);
  
  // Ensure AudioContext stays alive across overlay state changes
  useEffect(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return () => {
      // Don't close on unmount of overlays — only on full viewer close
    };
  }, []);

  // Background music playback per-story
  useEffect(() => {
    storyAudioRef.current?.pause();
    storyAudioRef.current = null;
    const url = currentStory?.music_url;
    if (!url) return;
    const a = new Audio(url);
    a.loop = true;
    a.muted = storyMuted;
    a.volume = 0.8;
    storyAudioRef.current = a;
    if (!shouldPause) a.play().catch(() => {});
    return () => { a.pause(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStory?.id]);

  useEffect(() => {
    if (!storyAudioRef.current) return;
    if (shouldPause) storyAudioRef.current.pause();
    else storyAudioRef.current.play().catch(() => {});
  }, [shouldPause]);

  useEffect(() => {
    if (storyAudioRef.current) storyAudioRef.current.muted = storyMuted;
  }, [storyMuted]);

  useEffect(() => () => { storyAudioRef.current?.pause(); }, []);


  // Check ownership on story change
  useEffect(() => {
    if (!currentStory) return;
    const checkOwnership = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsOwnStory(user?.id === currentStory.user_id);
      if (user && user.id !== currentStory.user_id) {
        recordView();
        onStoryViewed?.(currentStory.id, currentStory.user_id);
      }
    };
    checkOwnership();
  }, [currentIndex, currentStory?.id]);

  // Reset progress on story change
  useEffect(() => {
    progressRef.current = 0;
    setProgress(0);
  }, [currentIndex]);

  // Video progress sync using rAF for video stories
  useEffect(() => {
    if (!currentStory || currentStory.media_type !== 'video') return;
    const video = videoRef.current;
    if (!video) return;

    const updateVideoProgress = () => {
      if (video && video.duration && !video.paused) {
        const pct = (video.currentTime / video.duration) * 100;
        progressRef.current = pct;
        setProgress(pct);
      }
      progressAnimRef.current = requestAnimationFrame(updateVideoProgress);
    };

    if (!shouldPause) {
      video.play().catch(() => {});
      progressAnimRef.current = requestAnimationFrame(updateVideoProgress);
    } else {
      video.pause();
      cancelAnimationFrame(progressAnimRef.current);
    }

    return () => cancelAnimationFrame(progressAnimRef.current);
  }, [currentIndex, currentStory?.media_type, shouldPause]);

  // Image progress using interval (preserves position on pause)
  useEffect(() => {
    if (!currentStory || currentStory.media_type === 'video') return;

    if (shouldPause) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const duration = 10000; // 10s for images
    const interval = 50;
    const increment = (interval / duration) * 100;

    timerRef.current = setInterval(() => {
      progressRef.current += increment;
      if (progressRef.current >= 100) {
        progressRef.current = 100;
        setProgress(100);
        if (timerRef.current) clearInterval(timerRef.current);
        if (currentIndex < stories.length - 1) {
          onNext();
        } else if (isOwnStory) {
          navigate('/create-story');
        } else {
          onClose();
        }
        return;
      }
      setProgress(progressRef.current);
    }, interval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, currentStory?.media_type, shouldPause, isOwnStory]);

  // Handle video ending (non-loop: advance to next)
  useEffect(() => {
    const video = videoRef.current;
    if (!video || currentStory?.media_type !== 'video') return;

    const onEnded = () => {
      setProgress(100);
      if (currentIndex < stories.length - 1) {
        onNext();
      } else if (isOwnStory) {
        navigate('/create-story');
      } else {
        onClose();
      }
    };

    video.addEventListener('ended', onEnded);
    return () => video.removeEventListener('ended', onEnded);
  }, [currentIndex, currentStory?.media_type, isOwnStory]);

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
      <div className="absolute top-0 left-0 right-0 flex space-x-1 p-2 z-10" style={{ padding: '8px' }}>
        {stories.map((_, idx) => (
          <div key={idx} className="flex-1 h-0.5 bg-gray-600 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white will-change-[width]"
              style={{ 
                width: idx === currentIndex ? `${progress}%` : idx < currentIndex ? '100%' : '0%',
                transition: 'none',
                transitionTimingFunction: 'linear'
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-4 left-0 right-0 flex items-center justify-between px-4 z-10">
        <div className="flex items-center space-x-3 space-x-reverse">
          <img 
            src={currentStory.profiles?.avatar_url || '/default-avatar.jpg'}
            alt={currentStory.profiles?.username || ''}
            className="w-10 h-10 rounded-full border-2 border-white"
          />
          <div>
            <div className="flex items-center gap-1">
              <p className="text-white font-semibold">{currentStory.profiles?.username}</p>
              {currentStory.profiles?.is_verified && <VerifiedBadge size="sm" className="text-white" />}
            </div>
            <p className="text-gray-300 text-sm">{timeAgo(currentStory.created_at)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {currentStory.music_url && (
            <button
              onClick={() => setStoryMuted(m => !m)}
              aria-label={storyMuted ? 'تشغيل الصوت' : 'كتم الصوت'}
              className="text-white hover:bg-white/20 p-2 rounded-full transition-colors"
            >
              {storyMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
          )}
          {isOwnStory && (
            <Popover open={showOwnMenu} onOpenChange={setShowOwnMenu}>
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
                      onClick={async () => {
                        try {
                          const { error } = await supabase
                            .from('stories')
                            .delete()
                            .eq('id', currentStory.id);
                          
                          if (error) throw error;
                          
                          toast({
                            title: "تم الحذف",
                            description: "تم حذف القصة بنجاح",
                          });
                          
                          onClose();
                        } catch (error) {
                          console.error('Error deleting story:', error);
                          toast({
                            title: "خطأ",
                            description: "فشل حذف القصة",
                            variant: "destructive",
                          });
                        }
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
                      onClick={() => setShowAddToHighlight(true)}
                    >
                      إضافة إلى الهايلايت
                    </Button>

                    <Button
                      variant="ghost"
                      className="justify-center text-white hover:bg-white/10 rounded-none py-3"
                      onClick={async () => {
                        try {
                          const link = document.createElement('a');
                          link.href = currentStory.media_url;
                          link.download = `story_${currentStory.id}.${currentStory.media_type === 'video' ? 'mp4' : 'jpg'}`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          
                          toast({
                            title: "تم الحفظ",
                            description: "تم حفظ القصة على جهازك",
                          });
                        } catch (error) {
                          console.error('Error saving story:', error);
                          toast({
                            title: "خطأ",
                            description: "فشل حفظ القصة",
                            variant: "destructive",
                          });
                        }
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
                      onClick={async () => {
                        try {
                          const { error } = await supabase
                            .from('stories')
                            .update({ allow_story_replies: !currentStory.allow_story_replies })
                            .eq('id', currentStory.id);
                          
                          if (error) throw error;
                          
                          toast({
                            title: currentStory.allow_story_replies ? "تم إيقاف التعليقات" : "تم تفعيل التعليقات",
                            description: currentStory.allow_story_replies ? "لن يتمكن أحد من الرد على هذه القصة" : "يمكن للآخرين الرد على هذه القصة",
                          });
                          
                          window.location.reload();
                        } catch (error) {
                          console.error('Error toggling replies:', error);
                          toast({
                            title: "خطأ",
                            description: "فشل تحديث إعدادات التعليقات",
                            variant: "destructive",
                          });
                        }
                      }}
                    >
                      {currentStory.allow_story_replies ? 'إيقاف التعليقات' : 'تفعيل التعليقات'}
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
          <button
            onClick={onClose}
            aria-label="إغلاق"
            className="relative text-white hover:bg-white/20 p-2 rounded-full transition-colors"
            style={{ zIndex: 50, pointerEvents: 'auto' }}
          >
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
            ref={videoRef}
            src={currentStory.media_url}
            className="max-h-full max-w-full object-contain"
            autoPlay
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

      {/* Music sticker */}
      {currentStory.music_title && (
        <div className="absolute bottom-24 left-4 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/55 backdrop-blur-md border border-white/10 max-w-[70%]">
          <Music2 className="w-3.5 h-3.5 text-white animate-pulse" />
          <div className="overflow-hidden">
            <p className="text-white text-xs font-medium whitespace-nowrap animate-[marquee_14s_linear_infinite]">
              {currentStory.music_title}{currentStory.music_artist ? ` • ${currentStory.music_artist}` : ''}
            </p>
          </div>
        </div>
      )}

      {/* Instagram-style tap zones: left 30% → prev, right 70% → next.
          Constrained vertically so they NEVER cover the header (close/menu) or
          the bottom reply/action bar — those must always stay clickable. */}
      <div
        className="absolute left-0 right-0 flex select-none"
        style={{ top: 80, bottom: 96, zIndex: 5, pointerEvents: 'none' }}
      >
        <button
          type="button"
          aria-label="القصة السابقة"
          onClick={onPrev}
          className="h-full bg-transparent focus:outline-none"
          style={{ width: '30%', pointerEvents: 'auto', WebkitTapHighlightColor: 'transparent' }}
        />
        <button
          type="button"
          aria-label="القصة التالية"
          onClick={onNext}
          className="h-full bg-transparent focus:outline-none"
          style={{ width: '70%', pointerEvents: 'auto', WebkitTapHighlightColor: 'transparent' }}
        />
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
              onFocus={() => setIsTypingReply(true)}
              onBlur={() => setIsTypingReply(false)}
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
                onClick={() => setShowShareDialog(true)}
              >
                <Share2 className="w-6 h-6 text-white" />
                <span className="text-xs text-white">Share</span>
              </button>

              <button 
                className="flex flex-col items-center gap-1 p-2 hover:bg-white/10 rounded-lg transition-colors"
                onClick={() => setShowAddToHighlight(true)}
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

      {/* Add to Highlight Dialog */}
      {isOwnStory && (
        <AddToHighlightDialog
          open={showAddToHighlight}
          onOpenChange={setShowAddToHighlight}
          storyId={currentStory.id}
          userId={currentStory.user_id}
        />
      )}

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="bg-gray-900/98 backdrop-blur-sm border-gray-800 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white text-center">مشاركة القصة</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh]">
            <div className="grid grid-cols-3 gap-4 p-4">
              {/* WhatsApp */}
              <button
                onClick={() => {
                  const storyUrl = `${window.location.origin}/story/${currentStory.id}`;
                  const shareText = `شاهد قصتي على Network!\n${storyUrl}`;
                  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
                  window.open(whatsappUrl, '_blank');
                  setShowShareDialog(false);
                  toast({ title: "تم فتح واتساب", description: "يمكنك الآن مشاركة قصتك" });
                }}
                className="flex flex-col items-center gap-2 p-4 hover:bg-white/10 rounded-lg transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <span className="text-white text-xs">WhatsApp</span>
              </button>

              {/* Facebook */}
              <button
                onClick={() => {
                  const storyUrl = `${window.location.origin}/story/${currentStory.id}`;
                  const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(storyUrl)}`;
                  window.open(fbUrl, '_blank');
                  setShowShareDialog(false);
                  toast({ title: "تم فتح فيسبوك", description: "يمكنك الآن مشاركة قصتك" });
                }}
                className="flex flex-col items-center gap-2 p-4 hover:bg-white/10 rounded-lg transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
                  <Facebook className="w-6 h-6 text-white" />
                </div>
                <span className="text-white text-xs">Facebook</span>
              </button>

              {/* Twitter/X */}
              <button
                onClick={() => {
                  const storyUrl = `${window.location.origin}/story/${currentStory.id}`;
                  const shareText = `شاهد قصتي على Network!`;
                  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(storyUrl)}`;
                  window.open(twitterUrl, '_blank');
                  setShowShareDialog(false);
                  toast({ title: "تم فتح تويتر", description: "يمكنك الآن مشاركة قصتك" });
                }}
                className="flex flex-col items-center gap-2 p-4 hover:bg-white/10 rounded-lg transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center">
                  <Twitter className="w-6 h-6 text-white" />
                </div>
                <span className="text-white text-xs">Twitter</span>
              </button>

              {/* Telegram */}
              <button
                onClick={() => {
                  const storyUrl = `${window.location.origin}/story/${currentStory.id}`;
                  const shareText = `شاهد قصتي على Network!`;
                  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(storyUrl)}&text=${encodeURIComponent(shareText)}`;
                  window.open(telegramUrl, '_blank');
                  setShowShareDialog(false);
                  toast({ title: "تم فتح تيليجرام", description: "يمكنك الآن مشاركة قصتك" });
                }}
                className="flex flex-col items-center gap-2 p-4 hover:bg-white/10 rounded-lg transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center">
                  <Send className="w-6 h-6 text-white" />
                </div>
                <span className="text-white text-xs">Telegram</span>
              </button>

              {/* Email */}
              <button
                onClick={() => {
                  const storyUrl = `${window.location.origin}/story/${currentStory.id}`;
                  const subject = 'شاهد قصتي على Network!';
                  const body = `شاهد قصتي على Network!\n\n${storyUrl}`;
                  const mailUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                  window.location.href = mailUrl;
                  setShowShareDialog(false);
                  toast({ title: "تم فتح البريد", description: "يمكنك الآن مشاركة قصتك" });
                }}
                className="flex flex-col items-center gap-2 p-4 hover:bg-white/10 rounded-lg transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <span className="text-white text-xs">Email</span>
              </button>

              {/* Copy Link */}
              <button
                onClick={() => {
                  const storyUrl = `${window.location.origin}/story/${currentStory.id}`;
                  navigator.clipboard.writeText(storyUrl);
                  setShowShareDialog(false);
                  toast({ title: "تم النسخ", description: "تم نسخ رابط القصة" });
                }}
                className="flex flex-col items-center gap-2 p-4 hover:bg-white/10 rounded-lg transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center">
                  <Link className="w-6 h-6 text-white" />
                </div>
                <span className="text-white text-xs">نسخ الرابط</span>
              </button>

              {/* Instagram (Info only) */}
              <button
                onClick={() => {
                  toast({ 
                    title: "إنستجرام", 
                    description: "قم بحفظ القصة ثم شاركها على إنستجرام من تطبيقهم" 
                  });
                  setShowShareDialog(false);
                }}
                className="flex flex-col items-center gap-2 p-4 hover:bg-white/10 rounded-lg transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 flex items-center justify-center">
                  <Instagram className="w-6 h-6 text-white" />
                </div>
                <span className="text-white text-xs">Instagram</span>
              </button>

              {/* Snapchat (Info only) */}
              <button
                onClick={() => {
                  toast({ 
                    title: "سناب شات", 
                    description: "قم بحفظ القصة ثم شاركها على سناب شات من تطبيقهم" 
                  });
                  setShowShareDialog(false);
                }}
                className="flex flex-col items-center gap-2 p-4 hover:bg-white/10 rounded-lg transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-yellow-400 flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-black" />
                </div>
                <span className="text-white text-xs">Snapchat</span>
              </button>

              {/* LinkedIn */}
              <button
                onClick={() => {
                  const storyUrl = `${window.location.origin}/story/${currentStory.id}`;
                  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(storyUrl)}`;
                  window.open(linkedinUrl, '_blank');
                  setShowShareDialog(false);
                  toast({ title: "تم فتح لينكد إن", description: "يمكنك الآن مشاركة قصتك" });
                }}
                className="flex flex-col items-center gap-2 p-4 hover:bg-white/10 rounded-lg transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-blue-700 flex items-center justify-center">
                  <Share2 className="w-6 h-6 text-white" />
                </div>
                <span className="text-white text-xs">LinkedIn</span>
              </button>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default memo(StoryViewer);
