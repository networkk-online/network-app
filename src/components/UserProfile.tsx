import { Button } from '@/components/ui/button';
import { Camera, MapPin, Calendar, BadgeCheck } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { FormField, FormItem, FormLabel, FormControl, Form } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { useState, useEffect, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useMessages } from '@/hooks/useMessages';

interface UserProfileProps {
  username: string;
  displayName: string;
  avatar: string;
  followers: number;
  following: number;
  posts: number;
  bio: string;
  phone?: string;
  isOwnProfile?: boolean;
  profileId?: string;
  onUpdate?: (data: any) => Promise<void>;
  coverImage?: string;
  joinedDate?: string;
  birthDate?: string;
  location?: string;
  isVerified?: boolean;
}

const UserProfile = ({ 
  username, 
  displayName, 
  avatar, 
  followers, 
  following, 
  posts, 
  bio,
  phone,
  isOwnProfile = true,
  profileId,
  onUpdate,
  coverImage,
  joinedDate,
  birthDate,
  location,
  isVerified = false
}: UserProfileProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { createConversation } = useMessages();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(avatar);
  const [uploading, setUploading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followersCount, setFollowersCount] = useState(followers);
  const [messageLoading, setMessageLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [coverUrl, setCoverUrl] = useState(coverImage);
  
  const form = useForm({
    defaultValues: {
      displayName,
      bio,
      username
    }
  });

  useEffect(() => {
    form.reset({
      displayName,
      bio,
      username
    });
    setAvatarUrl(avatar);
    setCoverUrl(coverImage);
    setFollowersCount(followers);
  }, [displayName, bio, username, avatar, coverImage, followers]);

  useEffect(() => {
    if (!isOwnProfile && profileId) {
      checkFollowStatus();
    }
  }, [isOwnProfile, profileId]);

  const checkFollowStatus = async () => {
    if (!profileId) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', profileId)
        .maybeSingle();

      if (!error && data) {
        setIsFollowing(true);
      }
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  };

  const handleFollowToggle = async () => {
    if (!profileId) return;
    
    setFollowLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "خطأ",
          description: "يجب تسجيل الدخول",
          variant: "destructive"
        });
        return;
      }

      if (isFollowing) {
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', profileId);

        if (error) throw error;

        setIsFollowing(false);
        setFollowersCount(prev => prev - 1);
        toast({
          title: "تم إلغاء المتابعة",
          description: `لم تعد تتابع ${username}`,
        });
      } else {
        const { error } = await supabase
          .from('follows')
          .insert({
            follower_id: user.id,
            following_id: profileId
          });

        if (error) throw error;

        setIsFollowing(true);
        setFollowersCount(prev => prev + 1);
        toast({
          title: "تمت المتابعة",
          description: `أنت الآن تتابع ${username}`,
        });
      }
    } catch (error: any) {
      console.error('Error toggling follow:', error);
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء تحديث حالة المتابعة",
        variant: "destructive"
      });
    } finally {
      setFollowLoading(false);
    }
  };

  const handleAvatarClick = () => {
    if (isOwnProfile) {
      fileInputRef.current?.click();
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];
      
      if (!file.type.startsWith('image/')) {
        toast({
          title: "خطأ",
          description: "الرجاء اختيار صورة فقط",
          variant: "destructive"
        });
        return;
      }

      if (file.size > 5000000) {
        toast({
          title: "خطأ",
          description: "حجم الملف يجب أن يكون أقل من 5 ميجا",
          variant: "destructive"
        });
        return;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrl);

      if (onUpdate) {
        await onUpdate({ avatar_url: publicUrl });
      }

      toast({
        title: "نجاح",
        description: "تم تحديث الصورة الشخصية بنجاح",
      });
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleCoverClick = () => {
    if (isOwnProfile) {
      coverInputRef.current?.click();
    }
  };

  const handleCoverUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];
      
      if (!file.type.startsWith('image/')) {
        toast({
          title: "خطأ",
          description: "الرجاء اختيار صورة فقط",
          variant: "destructive"
        });
        return;
      }

      if (file.size > 5000000) {
        toast({
          title: "خطأ",
          description: "حجم الملف يجب أن يكون أقل من 5 ميجا",
          variant: "destructive"
        });
        return;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setCoverUrl(publicUrl);

      if (onUpdate) {
        await onUpdate({ cover_url: publicUrl });
      }

      toast({
        title: "نجاح",
        description: "تم تحديث صورة الغلاف بنجاح",
      });
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: any) => {
    if (!onUpdate) return;
    
    setIsSubmitting(true);
    try {
      await onUpdate(data);
      setIsEditOpen(false);
      toast({
        title: "تم التحديث",
        description: "تم تحديث ملفك الشخصي بنجاح",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء التحديث",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMessage = async () => {
    if (!profileId) return;

    setMessageLoading(true);
    try {
      const result = await createConversation(profileId);
      
      if (result?.success) {
        navigate('/messages');
      } else {
        toast({
          title: "خطأ",
          description: "حدث خطأ أثناء بدء المحادثة",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error starting chat:', error);
    } finally {
      setMessageLoading(false);
    }
  };

  return (
    <div className="space-y-0 -mt-6">
      {/* Cover Image */}
      <div className="relative h-48 md:h-64 overflow-hidden">
        {isOwnProfile ? (
          <>
            <div 
              className="relative w-full h-full cursor-pointer group"
              onClick={handleCoverClick}
            >
              {coverUrl ? (
                <img 
                  src={coverUrl} 
                  alt="Cover" 
                  className="w-full h-full object-cover transition-opacity group-hover:opacity-75"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
                  <Camera className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                <Camera className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              onChange={handleCoverUpload}
              className="hidden"
            />
          </>
        ) : (
          coverUrl ? (
            <img 
              src={coverUrl} 
              alt="Cover" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20" />
          )
        )}
      </div>

      {/* Profile Content */}
      <div className="px-4 pb-4">
        {/* Avatar and Actions */}
        <div className="flex justify-between items-start -mt-16 mb-4">
          <div className="relative">
            {isOwnProfile ? (
              <>
                <div 
                  className="relative cursor-pointer group"
                  onClick={handleAvatarClick}
                >
                  <img 
                    src={avatarUrl || '/placeholder.svg'} 
                    alt={displayName} 
                    className="w-32 h-32 rounded-full border-4 border-background object-cover transition-opacity group-hover:opacity-75 shadow-lg"
                  />
                  {uploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    </div>
                  )}
                  <div className="absolute bottom-0 right-0 bg-primary rounded-full p-2 border-4 border-background group-hover:bg-primary/80 transition-colors shadow-lg">
                    <Camera className="h-5 w-5 text-primary-foreground" />
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </>
            ) : (
              <img 
                src={avatarUrl || '/placeholder.svg'} 
                alt={displayName} 
                className="w-32 h-32 rounded-full border-4 border-background object-cover shadow-lg"
              />
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 items-center pt-4">
            {isOwnProfile ? (
              <>
                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="rounded-full px-6"
                    >
                      تعديل الملف الشخصي
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>تعديل الملف الشخصي</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="displayName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>الاسم الكامل</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>اسم المستخدم</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="bio"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>السيرة الذاتية</FormLabel>
                              <FormControl>
                                <Textarea {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <Button type="submit" disabled={isSubmitting} className="w-full">
                          {isSubmitting ? "جاري الحفظ..." : "حفظ"}
                        </Button>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
                <Button 
                  variant="default" 
                  className="rounded-full px-6 gap-2"
                >
                  <BadgeCheck className="h-4 w-4" />
                  وثّق حسابك
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant={isFollowing ? "outline" : "default"}
                  onClick={handleFollowToggle}
                  disabled={followLoading}
                  className="rounded-full px-6"
                >
                  {followLoading ? "جاري التحميل..." : isFollowing ? "إلغاء المتابعة" : "متابعة"}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleMessage}
                  disabled={messageLoading}
                  className="rounded-full px-6"
                >
                  {messageLoading ? "جاري..." : "مراسلة"}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Profile Info */}
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">{displayName}</h1>
            {isVerified && (
              <div className="bg-blue-500 rounded-full p-1">
                <BadgeCheck className="h-5 w-5 text-white" fill="currentColor" />
              </div>
            )}
          </div>
          <p className="text-muted-foreground">@{username}</p>
          {bio && <p className="text-sm">{bio}</p>}
          
          {/* Additional Info */}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            {birthDate && (
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{birthDate}</span>
              </div>
            )}
            {location && (
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{location}</span>
              </div>
            )}
            {joinedDate && (
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>انضم في {joinedDate}</span>
              </div>
            )}
          </div>
          
          {/* Stats */}
          <div className="flex gap-6 text-sm">
            <div>
              <span className="font-bold">{posts}</span>
              <span className="text-muted-foreground"> منشورات</span>
            </div>
            <div>
              <span className="font-bold">{following}</span>
              <span className="text-muted-foreground"> متابَع</span>
            </div>
            <div>
              <span className="font-bold">{followersCount}</span>
              <span className="text-muted-foreground"> متابعون</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
