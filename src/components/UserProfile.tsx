import { Button } from '@/components/ui/button';
import { Camera, MapPin, Calendar, BadgeCheck } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { FormField, FormItem, FormLabel, FormControl, Form } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { useState, useEffect, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useMessages } from '@/hooks/useMessages';
import { FollowButton } from '@/components/FollowButton';
import { CloseFriendsButton } from '@/components/CloseFriendsButton';
import { CloseFriendsDialog } from '@/components/CloseFriendsDialog';
import { BlockButton } from '@/components/BlockButton';
import { ReportDialog } from '@/components/ReportDialog';

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
  school?: string;
  profession?: string;
  gender?: string;
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
  school,
  profession,
  gender,
  isVerified = false
}: UserProfileProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { createConversation } = useMessages();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(avatar);
  const [uploading, setUploading] = useState(false);
  const [messageLoading, setMessageLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'none' | 'pending' | 'approved' | 'rejected'>('none');
  const [verificationLoading, setVerificationLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [coverUrl, setCoverUrl] = useState(coverImage);
  
  const form = useForm({
    defaultValues: {
      displayName,
      bio,
      username,
      location: location || '',
      school: school || '',
      profession: profession || '',
      gender: gender || ''
    }
  });

  useEffect(() => {
    form.reset({
      displayName,
      bio,
      username,
      location: location || '',
      school: school || '',
      profession: profession || '',
      gender: gender || ''
    });
    setAvatarUrl(avatar);
    setCoverUrl(coverImage);
  }, [displayName, bio, username, avatar, coverImage, location, school, profession, gender]);

  useEffect(() => {
    if (isOwnProfile) {
      checkVerificationStatus();
    }
  }, [isOwnProfile]);

  const checkVerificationStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (isVerified) {
        setVerificationStatus('approved');
        return;
      }

      const { data, error } = await supabase
        .from('verification_requests')
        .select('status')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .maybeSingle();

      if (!error && data) {
        setVerificationStatus(data.status as any);
      }
    } catch (error) {
      console.error('Error checking verification status:', error);
    }
  };

  const handleVerificationRequest = async () => {
    setVerificationLoading(true);
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

      const { error } = await supabase
        .from('verification_requests')
        .insert({
          user_id: user.id,
          status: 'pending',
        });

      if (error) throw error;

      setVerificationStatus('pending');
      toast({
        title: "تم إرسال الطلب",
        description: "سيتم مراجعة طلبك من قبل الإدارة قريباً",
      });
    } catch (error: any) {
      console.error('Error requesting verification:', error);
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء إرسال الطلب",
        variant: "destructive"
      });
    } finally {
      setVerificationLoading(false);
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
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-card rounded-lg overflow-hidden shadow-lg">
        <div 
          className={`relative h-48 sm:h-64 bg-gradient-to-br from-primary/20 to-accent/20 ${isOwnProfile ? 'cursor-pointer group' : ''}`}
          onClick={handleCoverClick}
        >
          {coverUrl && (
            <img 
              src={coverUrl} 
              alt="Cover" 
              className="w-full h-full object-cover"
            />
          )}
          {isOwnProfile && (
            <>
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="h-12 w-12 text-white" />
              </div>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                onChange={handleCoverUpload}
                className="hidden"
              />
            </>
          )}
        </div>

        <div className="px-4 sm:px-6 pb-6">
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

            {isOwnProfile && (
              <div className="pt-4">
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
                        <FormField
                          control={form.control}
                          name="location"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>المنطقة / المدينة</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="مثال: الرياض، جدة، دبي..." />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="school"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>المدرسة / الجامعة</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="اختياري" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="profession"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>المهنة</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="اختياري" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="gender"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>الجنس</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="اختر الجنس" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="male">ذكر</SelectItem>
                                  <SelectItem value="female">أنثى</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />
                        <Button 
                          type="submit" 
                          className="w-full"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? "جاري الحفظ..." : "حفظ التغييرات"}
                        </Button>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>

          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold">{displayName}</h1>
              {isVerified && (
                <div className="bg-blue-500 rounded-full p-1">
                  <BadgeCheck className="h-5 w-5 text-white" fill="currentColor" />
                </div>
              )}
              {!isOwnProfile && profileId && (
                <div className="flex gap-2 items-center flex-wrap">
                  <FollowButton 
                    userId={profileId}
                    variant="default"
                    size="sm"
                    showIcon={false}
                    className="rounded-lg px-4 py-1.5 h-8 text-sm font-medium"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleMessage}
                    disabled={messageLoading}
                    className="rounded-lg px-4 py-1.5 h-8 text-sm font-medium"
                  >
                    {messageLoading ? "جاري..." : "مراسلة"}
                  </Button>
                  <CloseFriendsButton
                    userId={profileId}
                    variant="ghost"
                    size="sm"
                    showIcon={true}
                    className="rounded-lg px-2 h-8"
                  />
                  <BlockButton
                    userId={profileId}
                    variant="ghost"
                    size="sm"
                    className="rounded-lg px-2 h-8"
                  />
                  <ReportDialog
                    reportedUserId={profileId}
                  />
                </div>
              )}
            </div>
            {isOwnProfile && !isVerified && (
              <div className="mt-2">
                {verificationStatus === 'none' ? (
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={handleVerificationRequest}
                    disabled={verificationLoading}
                    className="rounded-full px-4 gap-1.5 h-8"
                  >
                    <BadgeCheck className="h-3.5 w-3.5" />
                    <span className="text-xs">{verificationLoading ? "جاري الإرسال..." : "وثّق حسابك"}</span>
                  </Button>
                ) : verificationStatus === 'pending' ? (
                  <Button 
                    variant="secondary" 
                    size="sm"
                    disabled
                    className="rounded-full px-4 gap-1.5 h-8"
                  >
                    <BadgeCheck className="h-3.5 w-3.5" />
                    <span className="text-xs">طلب التوثيق قيد المراجعة</span>
                  </Button>
                ) : verificationStatus === 'rejected' ? (
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={handleVerificationRequest}
                    disabled={verificationLoading}
                    className="rounded-full px-4 gap-1.5 h-8"
                  >
                    <BadgeCheck className="h-3.5 w-3.5" />
                    <span className="text-xs">إعادة طلب التوثيق</span>
                  </Button>
                ) : null}
              </div>
            )}
            {isOwnProfile && (
              <div className="mt-2">
                <CloseFriendsDialog />
              </div>
            )}
            <p className="text-muted-foreground">@{username}</p>
            {bio && <p className="text-sm">{bio}</p>}
            
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
                <span className="font-bold">{followers}</span>
                <span className="text-muted-foreground"> متابعون</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
