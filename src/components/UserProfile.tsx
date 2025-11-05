import { Button } from '@/components/ui/button';
import { Settings, Grid, Bookmark, Camera } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { FormField, FormItem, FormLabel, FormControl, Form } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { useState, useEffect, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  onUpdate?: (data: any) => Promise<void>;
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
  onUpdate
}: UserProfileProps) => {
  const { toast } = useToast();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(avatar);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
  }, [displayName, bio, username, avatar]);

  const handleAvatarClick = () => {
    if (isOwnProfile && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "خطأ",
        description: "الرجاء اختيار صورة فقط",
        variant: "destructive"
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "خطأ",
        description: "حجم الصورة يجب أن يكون أقل من 2 ميجابايت",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      
      toast({
        title: "تم التحديث",
        description: "تم تحديث صورة الملف الشخصي بنجاح",
      });
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء رفع الصورة",
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
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8 mb-8">
        {/* Avatar */}
        <div className="flex-shrink-0 relative">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarUpload}
            className="hidden"
          />
          <div 
            onClick={handleAvatarClick}
            className={`relative ${isOwnProfile ? 'cursor-pointer group' : ''}`}
          >
            <img 
              src={avatarUrl} 
              alt={displayName}
              className="w-32 h-32 rounded-full object-cover border-4 border-green-500 neon-glow"
            />
            {isOwnProfile && (
              <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="w-8 h-8 text-white" />
              </div>
            )}
            {uploading && (
              <div className="absolute inset-0 bg-black/70 rounded-full flex items-center justify-center">
                <div className="text-white text-sm">جاري الرفع...</div>
              </div>
            )}
          </div>
        </div>

        {/* Profile Info */}
        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-6 mb-4">
            <h1 className="text-2xl font-light">{username}</h1>
            <div className="flex space-x-3">
              {isOwnProfile ? (
                <>
                  <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                    <DialogTrigger asChild>
                      <Button variant="secondary" size="sm" className="bg-gray-800 hover:bg-gray-700">
                        تعديل الملف الشخصي
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-gray-900 border-gray-800">
                      <DialogHeader>
                        <DialogTitle className="text-white">تعديل الملف الشخصي</DialogTitle>
                      </DialogHeader>
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                          <FormField
                            control={form.control}
                            name="displayName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-gray-300">الاسم الكامل</FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field} 
                                    className="bg-gray-800 border-gray-700 text-white"
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="username"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-gray-300">اسم المستخدم</FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field} 
                                    className="bg-gray-800 border-gray-700 text-white"
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="bio"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-gray-300">الوصف</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    {...field}
                                    className="min-h-[100px] bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                                    placeholder="اكتب وصفاً عن نفسك..."
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <div className="flex justify-end space-x-2 pt-4">
                            <Button 
                              type="button" 
                              variant="secondary" 
                              onClick={() => setIsEditOpen(false)}
                              className="bg-gray-700 hover:bg-gray-600"
                              disabled={isSubmitting}
                            >
                              إلغاء
                            </Button>
                            <Button 
                              type="submit"
                              className="bg-green-500 hover:bg-green-600 text-black font-semibold"
                              disabled={isSubmitting}
                            >
                              {isSubmitting ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                  <Button variant="ghost" size="sm" className="p-2">
                    <Settings className="w-5 h-5" />
                  </Button>
                </>
              ) : (
                <>
                  <Button className="bg-green-500 hover:bg-green-600 text-black font-semibold">
                    Follow
                  </Button>
                  <Button variant="secondary" size="sm" className="bg-gray-800 hover:bg-gray-700">
                    Message
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="flex justify-center md:justify-start space-x-8 mb-4">
            <div className="text-center">
              <span className="font-bold text-white">{posts}</span>
              <span className="text-gray-400 ml-1">منشور</span>
            </div>
            <div className="text-center">
              <span className="font-bold text-white">{followers.toLocaleString()}</span>
              <span className="text-gray-400 ml-1">متابع</span>
            </div>
            <div className="text-center">
              <span className="font-bold text-white">{following}</span>
              <span className="text-gray-400 ml-1">يتابع</span>
            </div>
          </div>

          {/* Bio */}
          <div>
            <h2 className="font-semibold mb-1">{displayName}</h2>
            <p className="text-gray-300 whitespace-pre-line">{bio}</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-t border-gray-800">
        <div className="flex justify-center space-x-12">
          <button className="flex items-center space-x-1 py-4 border-t-2 border-green-500 text-green-400">
            <Grid className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wide">المنشورات</span>
          </button>
          <button className="flex items-center space-x-1 py-4 text-gray-400 hover:text-white">
            <Bookmark className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wide">المحفوظات</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
