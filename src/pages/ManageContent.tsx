import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminHeader from '@/components/AdminHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Shield, Trash2, Search, FileText, Video } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Post {
  id: string;
  content: string;
  media_url: string | null;
  created_at: string;
  likes_count: number;
  comments_count: number;
  profiles?: {
    username: string;
    full_name: string;
  };
}

interface Reel {
  id: string;
  caption: string | null;
  video_url: string;
  thumbnail_url: string | null;
  created_at: string;
  likes_count: number;
  comments_count: number;
  views_count: number;
  profiles?: {
    username: string;
    full_name: string;
  };
}

const ManageContent = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [reels, setReels] = useState<Reel[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; type: 'post' | 'reel'; id: string }>({
    open: false,
    type: 'post',
    id: '',
  });

  useEffect(() => {
    checkAuthorization();
  }, []);

  const checkAuthorization = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/admin/login');
        return;
      }

      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .in('role', ['admin', 'moderator']);

      if (!roles || roles.length === 0) {
        toast({
          title: "غير مصرح",
          description: "ليس لديك صلاحيات للوصول إلى هذه الصفحة",
          variant: "destructive",
        });
        await supabase.auth.signOut();
        navigate('/admin/login');
        return;
      }

      setIsAuthorized(true);
      await loadPosts();
      await loadReels();
    } catch (error) {
      console.error('Authorization error:', error);
      navigate('/admin/login');
    } finally {
      setLoading(false);
    }
  };

  const loadPosts = async () => {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        id,
        content,
        media_url,
        created_at,
        likes_count,
        comments_count,
        user:profiles!posts_user_id_fkey(username, full_name)
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error loading posts:', error);
      return;
    }

    if (data) {
      const formattedPosts = data.map(p => ({
        ...p,
        profiles: p.user
      }));
      setPosts(formattedPosts as any);
    }
  };

  const loadReels = async () => {
    const { data, error } = await supabase
      .from('reels')
      .select(`
        id,
        caption,
        video_url,
        thumbnail_url,
        created_at,
        likes_count,
        comments_count,
        views_count,
        user:profiles!reels_user_id_fkey(username, full_name)
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error loading reels:', error);
      return;
    }

    if (data) {
      const formattedReels = data.map(r => ({
        ...r,
        profiles: r.user
      }));
      setReels(formattedReels as any);
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      toast({
        title: "تم الحذف",
        description: "تم حذف المنشور بنجاح",
      });

      await loadPosts();
      setDeleteDialog({ open: false, type: 'post', id: '' });
    } catch (error) {
      console.error('Delete post error:', error);
      toast({
        title: "خطأ",
        description: "فشل حذف المنشور",
        variant: "destructive",
      });
    }
  };

  const handleDeleteReel = async (reelId: string) => {
    try {
      const { error } = await supabase
        .from('reels')
        .delete()
        .eq('id', reelId);

      if (error) throw error;

      toast({
        title: "تم الحذف",
        description: "تم حذف الريل بنجاح",
      });

      await loadReels();
      setDeleteDialog({ open: false, type: 'reel', id: '' });
    } catch (error) {
      console.error('Delete reel error:', error);
      toast({
        title: "خطأ",
        description: "فشل حذف الريل",
        variant: "destructive",
      });
    }
  };

  const filteredPosts = posts.filter(post =>
    post.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.profiles?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredReels = reels.filter(reel =>
    reel.caption?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reel.profiles?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reel.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">جاري التحميل...</div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <AdminHeader />
      
      <main className="pt-20 pb-8">
        <div className="container-responsive mobile-padding">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
              <Shield className="w-8 h-8 text-red-500" />
              إدارة المحتوى
            </h1>
            <p className="text-gray-400">مراجعة وحذف المنشورات والريلز</p>
          </div>

          <Tabs defaultValue="posts" className="space-y-6">
            <TabsList className="bg-gray-900">
              <TabsTrigger value="posts">المنشورات ({posts.length})</TabsTrigger>
              <TabsTrigger value="reels">الريلز ({reels.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="posts" className="space-y-6">
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <FileText className="w-5 h-5 text-green-500" />
                    جميع المنشورات
                  </CardTitle>
                  <div className="relative mt-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="بحث في المنشورات..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-gray-800 border-gray-700 text-white"
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {filteredPosts.map(post => (
                      <div key={post.id} className="p-4 bg-gray-800 rounded-lg">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <p className="text-white font-medium mb-1">
                              {post.profiles?.full_name || post.profiles?.username}
                            </p>
                            <p className="text-gray-400 text-sm mb-2">
                              @{post.profiles?.username} • {new Date(post.created_at).toLocaleDateString('ar')}
                            </p>
                            <p className="text-white">{post.content}</p>
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setDeleteDialog({ open: true, type: 'post', id: post.id })}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        {post.media_url && (
                          <img 
                            src={post.media_url} 
                            alt="Post media" 
                            className="w-full max-h-48 object-cover rounded-lg mb-2"
                          />
                        )}
                        <div className="flex gap-4 text-sm text-gray-400">
                          <span>👍 {post.likes_count}</span>
                          <span>💬 {post.comments_count}</span>
                        </div>
                      </div>
                    ))}
                    {filteredPosts.length === 0 && (
                      <p className="text-gray-400 text-center py-8">لا توجد منشورات</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reels" className="space-y-6">
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Video className="w-5 h-5 text-red-500" />
                    جميع الريلز
                  </CardTitle>
                  <div className="relative mt-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="بحث في الريلز..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-gray-800 border-gray-700 text-white"
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto">
                    {filteredReels.map(reel => (
                      <div key={reel.id} className="bg-gray-800 rounded-lg overflow-hidden">
                        <div className="relative">
                          {reel.thumbnail_url ? (
                            <img 
                              src={reel.thumbnail_url} 
                              alt="Reel thumbnail" 
                              className="w-full h-48 object-cover"
                            />
                          ) : (
                            <div className="w-full h-48 bg-gray-700 flex items-center justify-center">
                              <Video className="w-12 h-12 text-gray-500" />
                            </div>
                          )}
                          <Button
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={() => setDeleteDialog({ open: true, type: 'reel', id: reel.id })}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="p-3">
                          <p className="text-white font-medium mb-1">
                            {reel.profiles?.full_name || reel.profiles?.username}
                          </p>
                          <p className="text-gray-400 text-sm mb-2">
                            @{reel.profiles?.username}
                          </p>
                          {reel.caption && (
                            <p className="text-white text-sm mb-2 line-clamp-2">{reel.caption}</p>
                          )}
                          <div className="flex gap-3 text-xs text-gray-400">
                            <span>👁 {reel.views_count}</span>
                            <span>👍 {reel.likes_count}</span>
                            <span>💬 {reel.comments_count}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {filteredReels.length === 0 && (
                      <p className="text-gray-400 text-center py-8 col-span-full">لا توجد ريلز</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <AlertDialogContent className="bg-gray-900 border-gray-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              هل أنت متأكد من حذف هذا {deleteDialog.type === 'post' ? 'المنشور' : 'الريل'}؟ 
              لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-800 text-white border-gray-700">
              إلغاء
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (deleteDialog.type === 'post') {
                  handleDeletePost(deleteDialog.id);
                } else {
                  handleDeleteReel(deleteDialog.id);
                }
              }}
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ManageContent;
