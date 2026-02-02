import { Button } from '@/components/ui/button';
import { Camera, MapPin, Calendar, BadgeCheck, MoreHorizontal, Share2, Copy, Check, Link as LinkIcon, Instagram, Twitter, Youtube, EyeOff, UserX } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { FormField, FormItem, FormLabel, FormControl, Form } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { useState, useEffect, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useCountUp } from '@/hooks/useCountUp';

import { FollowButton } from '@/components/FollowButton';
import { CloseFriendsButton } from '@/components/CloseFriendsButton';
import { CloseFriendsDialog } from '@/components/CloseFriendsDialog';
import { BlockButton } from '@/components/BlockButton';
import { ReportDialog } from '@/components/ReportDialog';
import { ImageCropDialog } from '@/components/ImageCropDialog';
import CallButtons from '@/components/CallButtons';

// Social media icons
const TikTokIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
  </svg>
);

const SnapchatIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.464-.104.182 0 .359.029.509.09.45.149.734.479.734.838.015.449-.39.839-1.213 1.168-.089.029-.209.075-.344.119-.45.135-1.139.36-1.333.81-.09.224-.061.524.12.868l.015.015c.06.136 1.526 3.475 4.791 4.014.255.044.435.27.42.509 0 .075-.015.149-.045.225-.24.569-1.273.988-3.146 1.271-.059.091-.12.375-.164.57-.029.179-.074.36-.134.553-.076.271-.27.405-.555.405h-.03a3.17 3.17 0 01-.538-.074 4.776 4.776 0 00-.975-.12c-.329 0-.72.015-1.183.149-.715.209-1.154.72-2.154 1.438-.874.629-1.786 1.063-3.086 1.063-.03 0-.06 0-.089-.002-.03 0-.061.002-.091.002-1.3 0-2.212-.434-3.086-1.063-1-.718-1.439-1.229-2.154-1.438-.463-.134-.854-.149-1.183-.149a4.776 4.776 0 00-.975.12 3.14 3.14 0 01-.538.074h-.03c-.284 0-.479-.134-.554-.405-.061-.193-.106-.374-.135-.553-.045-.195-.104-.479-.165-.57-1.872-.283-2.905-.702-3.145-1.271a.49.49 0 01-.045-.225c-.016-.24.165-.465.42-.509 3.264-.54 4.73-3.879 4.791-4.014l.015-.015c.182-.344.21-.644.12-.868-.195-.45-.884-.675-1.333-.81a2.557 2.557 0 01-.344-.119c-.823-.33-1.228-.72-1.213-1.168 0-.36.284-.689.735-.838.149-.061.326-.09.508-.09.121 0 .3.016.465.104.374.181.733.285 1.033.301.198 0 .326-.045.401-.09a33.4 33.4 0 01-.03-.51l-.003-.06c-.104-1.628-.23-3.654.299-4.847C7.547 1.069 10.904.793 11.894.793h.312z"/>
  </svg>
);

interface SocialLinks {
  instagram?: string;
  twitter?: string;
  tiktok?: string;
  youtube?: string;
  snapchat?: string;
  website?: string;
}

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
  website?: string;
  socialLinks?: SocialLinks;
}

// Animated Number Component
const AnimatedNumber = ({ value, delay = 0 }: { value: number; delay?: number }) => {
  const count = useCountUp({ end: value, duration: 800, delay });
  return <p className="text-xl sm:text-2xl font-bold text-foreground">{count}</p>;
};

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
  isVerified = false,
  website,
  socialLinks = {}
}: UserProfileProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(avatar);
  const [uploading, setUploading] = useState(false);
  
  const [verificationStatus, setVerificationStatus] = useState<'none' | 'pending' | 'approved' | 'rejected'>('none');
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [coverUrl, setCoverUrl] = useState(coverImage);
  const [showAvatarCrop, setShowAvatarCrop] = useState(false);
  const [showCoverCrop, setShowCoverCrop] = useState(false);
  const [pendingAvatarSrc, setPendingAvatarSrc] = useState<string | null>(null);
  const [pendingCoverSrc, setPendingCoverSrc] = useState<string | null>(null);

  const [followersCount, setFollowersCount] = useState(followers);

  useEffect(() => {
    setFollowersCount(followers);
  }, [followers]);
  
  const form = useForm({
    defaultValues: {
      displayName,
      bio,
      username,
      location: location || '',
      school: school || '',
      profession: profession || '',
      gender: gender || '',
      birthDate: birthDate || '',
      website: website || '',
      instagram: socialLinks?.instagram || '',
      twitter: socialLinks?.twitter || '',
      tiktok: socialLinks?.tiktok || '',
      youtube: socialLinks?.youtube || '',
      snapchat: socialLinks?.snapchat || ''
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
      gender: gender || '',
      birthDate: birthDate || '',
      website: website || '',
      instagram: socialLinks?.instagram || '',
      twitter: socialLinks?.twitter || '',
      tiktok: socialLinks?.tiktok || '',
      youtube: socialLinks?.youtube || '',
      snapchat: socialLinks?.snapchat || ''
    });
    setAvatarUrl(avatar);
    setCoverUrl(coverImage);
  }, [displayName, bio, username, avatar, coverImage, location, school, profession, gender, birthDate, website, socialLinks]);

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

  const handleAvatarFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
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

    if (file.size > 10000000) {
      toast({
        title: "خطأ",
        description: "حجم الملف يجب أن يكون أقل من 10 ميجا",
        variant: "destructive"
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPendingAvatarSrc(reader.result as string);
      setShowAvatarCrop(true);
    };
    reader.readAsDataURL(file);
    
    // Reset input
    event.target.value = '';
  };

  const handleAvatarCropComplete = async (croppedBlob: Blob) => {
    try {
      setUploading(true);
      
      const fileName = `avatar_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, croppedBlob);

      if (uploadError) {
        console.error('Avatar upload error:', uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      setAvatarUrl(publicUrl);

      if (onUpdate) {
        await onUpdate({ avatar_url: publicUrl });
      }

      toast({
        title: "نجاح",
        description: "تم تحديث الصورة الشخصية بنجاح",
      });
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء رفع الصورة",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      setPendingAvatarSrc(null);
    }
  };

  const handleCoverClick = () => {
    if (isOwnProfile) {
      coverInputRef.current?.click();
    }
  };

  const handleCoverFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
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

    if (file.size > 10000000) {
      toast({
        title: "خطأ",
        description: "حجم الملف يجب أن يكون أقل من 10 ميجا",
        variant: "destructive"
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPendingCoverSrc(reader.result as string);
      setShowCoverCrop(true);
    };
    reader.readAsDataURL(file);
    
    // Reset input
    event.target.value = '';
  };

  const handleCoverCropComplete = async (croppedBlob: Blob) => {
    try {
      setUploading(true);
      
      const fileName = `cover_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('covers')
        .upload(fileName, croppedBlob);

      if (uploadError) {
        console.error('Cover upload error:', uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('covers')
        .getPublicUrl(fileName);

      setCoverUrl(publicUrl);

      if (onUpdate) {
        await onUpdate({ cover_url: publicUrl });
      }

      toast({
        title: "نجاح",
        description: "تم تحديث صورة الغلاف بنجاح",
      });
    } catch (error: any) {
      console.error('Cover upload error:', error);
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء رفع الصورة",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      setPendingCoverSrc(null);
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
    // Navigate to messages with userId param - Messages page will handle conversation creation/selection
    navigate(`/messages?userId=${profileId}`);
  };

  const handleCopyProfile = async () => {
    const profileUrl = `${window.location.origin}/profile/${username}`;
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      toast({
        title: "تم النسخ",
        description: "تم نسخ رابط الملف الشخصي",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل نسخ الرابط",
        variant: "destructive"
      });
    }
  };

  const handleShareProfile = async () => {
    const profileUrl = `${window.location.origin}/profile/${username}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${displayName} على Network`,
          url: profileUrl
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      handleCopyProfile();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-card rounded-lg overflow-hidden shadow-lg">
        {/* Cover Image with Username Overlay */}
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
          
          {/* Username Overlay on Cover */}
          <div className="absolute top-4 left-4 sm:top-6 sm:left-6">
            <h3 className="text-white text-xl sm:text-2xl font-bold drop-shadow-lg">
              {username}
            </h3>
          </div>

          {/* Three Dots Menu */}
          {!isOwnProfile && (
            <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="bg-black/50 hover:bg-black/70 text-white rounded-full">
                    <MoreHorizontal className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={handleShareProfile}>
                    <Share2 className="ml-2 h-4 w-4" />
                    مشاركة الملف الشخصي
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleCopyProfile}>
                    {copied ? <Check className="ml-2 h-4 w-4" /> : <Copy className="ml-2 h-4 w-4" />}
                    نسخ رابط الملف الشخصي
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => {
                    toast({
                      title: "تم إخفاء القصة",
                      description: "لن تظهر قصصك لهذا المستخدم",
                    });
                  }}>
                    <EyeOff className="ml-2 h-4 w-4" />
                    إخفاء قصتي عنه
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    toast({
                      title: "تم تقييد الحساب",
                      description: "تم تقييد هذا الحساب",
                    });
                  }}>
                    <UserX className="ml-2 h-4 w-4" />
                    تقييد
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <BlockButton userId={profileId!} />
                  <ReportDialog 
                    reportedUserId={profileId}
                  />
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
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
                onChange={handleCoverFileSelect}
                className="hidden"
              />
            </>
          )}
        </div>

        <div className="px-4 sm:px-6 pb-6">
          {/* Avatar and Stats Section */}
          <div className="flex items-start gap-4 -mt-16 mb-6">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              {isOwnProfile ? (
                <>
                  <div 
                    className="relative cursor-pointer group"
                    onClick={handleAvatarClick}
                  >
                    <img 
                      src={avatarUrl || '/default-avatar.jpg'} 
                      alt={displayName} 
                      className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-background object-cover transition-opacity group-hover:opacity-75 shadow-lg"
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
                    onChange={handleAvatarFileSelect}
                    className="hidden"
                  />
                </>
              ) : (
                <img 
                  src={avatarUrl || '/default-avatar.jpg'} 
                  alt={displayName} 
                  className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-background object-cover shadow-lg"
                />
              )}
            </div>

            {/* Stats */}
            <div className="flex flex-col justify-center pt-20 sm:pt-24 gap-2 flex-1">
              <div className="flex gap-8 sm:gap-12">
                <button 
                  onClick={() => navigate('/following', { state: { profileId, username } })} 
                  className="text-center hover:opacity-80 transition-opacity flex flex-col gap-1 animate-fade-in"
                  style={{ animationDelay: '0.1s', animationFillMode: 'backwards' }}
                >
                  <AnimatedNumber value={following} delay={100} />
                  <p className="text-xs sm:text-sm text-muted-foreground">يتابع</p>
                </button>
                <button 
                  onClick={() => navigate('/followers', { state: { profileId, username } })} 
                  className="text-center hover:opacity-80 transition-opacity flex flex-col gap-1 animate-fade-in"
                  style={{ animationDelay: '0.2s', animationFillMode: 'backwards' }}
                >
                  <AnimatedNumber value={followersCount} delay={200} />
                  <p className="text-xs sm:text-sm text-muted-foreground">المتابعون</p>
                </button>
                <div 
                  className="text-center flex flex-col gap-1 animate-fade-in"
                  style={{ animationDelay: '0.3s', animationFillMode: 'backwards' }}
                >
                  <AnimatedNumber value={posts} delay={300} />
                  <p className="text-xs sm:text-sm text-muted-foreground">المنشورات</p>
                </div>
              </div>
            </div>
          </div>

          {/* Display Name with Verification Badge */}
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">{displayName}</h2>
            {isVerified && (
              <div className="relative">
                <BadgeCheck className="h-6 w-6 sm:h-7 sm:w-7 text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {isOwnProfile ? (
            <div className="flex gap-3 mb-4">
              <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="flex-1 rounded-lg font-semibold"
                  >
                    تعديل الملف الشخصي
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] max-h-[85vh] overflow-y-auto overscroll-contain">
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
                      <FormField
                        control={form.control}
                        name="birthDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>تاريخ الميلاد</FormLabel>
                            <FormControl>
                              <Input {...field} type="date" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="website"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>الموقع الإلكتروني</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="https://example.com" dir="ltr" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      {/* Social Media Links */}
                      <div className="space-y-3 border-t pt-4 mt-4">
                        <h4 className="text-sm font-semibold text-foreground">روابط التواصل الاجتماعي</h4>
                        <FormField
                          control={form.control}
                          name="instagram"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                <Instagram className="h-4 w-4 text-pink-500" />
                                Instagram
                              </FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="username" dir="ltr" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="twitter"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                <Twitter className="h-4 w-4 text-blue-400" />
                                X (Twitter)
                              </FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="username" dir="ltr" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="tiktok"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                <TikTokIcon />
                                TikTok
                              </FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="username" dir="ltr" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="youtube"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                <Youtube className="h-4 w-4 text-red-500" />
                                YouTube
                              </FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="channel" dir="ltr" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="snapchat"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                <SnapchatIcon />
                                Snapchat
                              </FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="username" dir="ltr" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
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

              {verificationStatus === 'none' && (
                <Button
                  onClick={handleVerificationRequest}
                  disabled={verificationLoading}
                  variant="outline"
                  className="flex-1 rounded-lg font-semibold"
                >
                  {verificationLoading ? "جاري..." : "طلب التوثيق"}
                </Button>
              )}
            </div>
          ) : (
            <div className="flex gap-2 mb-4">
              <FollowButton 
                userId={profileId!}
                variant="default"
                size="lg"
                showIcon={false}
                onOptimisticChange={(next, prev) => {
                  if (next === prev) return;
                  setFollowersCount((c) => Math.max(0, c + (next ? 1 : -1)));
                }}
                onRevertChange={(prev, optimistic) => {
                  if (prev === optimistic) return;
                  // revert the previous optimistic delta
                  setFollowersCount((c) => Math.max(0, c + (prev ? 1 : -1)));
                }}
                className="flex-1 rounded-lg font-semibold text-base h-11"
              />
              <Button
                variant="default"
                size="lg"
                onClick={handleMessage}
                className="flex-1 rounded-lg font-semibold text-base h-11 bg-black hover:bg-black/90 text-white border-0"
              >
                مراسلة
              </Button>
              <CallButtons 
                participant={{
                  id: profileId!,
                  username: username,
                  full_name: displayName,
                  avatar_url: avatar,
                }}
                variant="outline"
                size="lg"
                className="flex-shrink-0"
              />
            </div>
          )}

          {/* Bio Section */}
          <div className="mb-4">
            <h3 className="text-lg font-bold text-foreground mb-2">الوصف</h3>
            <p className="text-muted-foreground whitespace-pre-wrap text-2xl font-bold leading-relaxed">{bio}</p>
          </div>
            
          {/* Social Links - مباشرة تحت الوصف */}
          <div className="mb-4">
            <div className="flex flex-wrap gap-3">
              {website && (
                <a 
                  href={website.startsWith('http') ? website : `https://${website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 text-sm transition-colors"
                >
                  <LinkIcon className="h-4 w-4" />
                  <span className="truncate max-w-[150px]">الموقع</span>
                </a>
              )}
              {socialLinks?.instagram && (
                <a 
                  href={`https://instagram.com/${socialLinks.instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm hover:opacity-90 transition-opacity"
                >
                  <Instagram className="h-4 w-4" />
                  <span>Instagram</span>
                </a>
              )}
              {socialLinks?.twitter && (
                <a 
                  href={`https://twitter.com/${socialLinks.twitter}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500 text-white text-sm hover:opacity-90 transition-opacity"
                >
                  <Twitter className="h-4 w-4" />
                  <span>X</span>
                </a>
              )}
              {socialLinks?.tiktok && (
                <a 
                  href={`https://tiktok.com/@${socialLinks.tiktok}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black text-white text-sm hover:opacity-90 transition-opacity border border-gray-600"
                >
                  <TikTokIcon />
                  <span>TikTok</span>
                </a>
              )}
              {socialLinks?.youtube && (
                <a 
                  href={`https://youtube.com/${socialLinks.youtube}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-600 text-white text-sm hover:opacity-90 transition-opacity"
                >
                  <Youtube className="h-4 w-4" />
                  <span>YouTube</span>
                </a>
              )}
              {socialLinks?.snapchat && (
                <a 
                  href={`https://snapchat.com/add/${socialLinks.snapchat}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-400 text-black text-sm hover:opacity-90 transition-opacity"
                >
                  <SnapchatIcon />
                  <span>Snapchat</span>
                </a>
              )}
            </div>
          </div>

          {/* Additional Info */}
          <div className="space-y-2 text-sm text-muted-foreground">
            {location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>{location}</span>
              </div>
            )}
            {joinedDate && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>انضم {joinedDate}</span>
              </div>
            )}
          </div>

          {/* Close Friends and Settings for Own Profile */}
          {isOwnProfile && (
            <div className="mt-4 flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/settings')}
                className="rounded-lg"
              >
                الإعدادات
              </Button>
            </div>
          )}

          {/* Followed By Section for Other's Profile */}
          {!isOwnProfile && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">
                Followed by username1, username2 and 13 others
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Close Friends Button for Other User Profiles */}
      {!isOwnProfile && profileId && (
        <div className="mt-4">
          <CloseFriendsButton userId={profileId} />
        </div>
      )}

      {/* Image Crop Dialogs */}
      {pendingAvatarSrc && (
        <ImageCropDialog
          open={showAvatarCrop}
          onClose={() => {
            setShowAvatarCrop(false);
            setPendingAvatarSrc(null);
          }}
          imageSrc={pendingAvatarSrc}
          onCropComplete={handleAvatarCropComplete}
          aspectRatio={1}
          circularCrop={true}
          title="قص صورة البروفايل"
        />
      )}

      {pendingCoverSrc && (
        <ImageCropDialog
          open={showCoverCrop}
          onClose={() => {
            setShowCoverCrop(false);
            setPendingCoverSrc(null);
          }}
          imageSrc={pendingCoverSrc}
          onCropComplete={handleCoverCropComplete}
          aspectRatio={16 / 9}
          circularCrop={false}
          title="قص صورة الغلاف"
        />
      )}
    </div>
  );
};

export default UserProfile;
