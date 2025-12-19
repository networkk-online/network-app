import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Post from "@/components/Post";
import { Button } from "@/components/ui/button";

const PostView = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPost = async () => {
      if (!postId) {
        setError("معرف المنشور غير موجود");
        setLoading(false);
        return;
      }

      try {
        // First get the post
        const { data: postData, error: postError } = await supabase
          .from("posts")
          .select("*")
          .eq("id", postId)
          .single();

        if (postError) {
          console.error("Error loading post:", postError);
          setError("لم يتم العثور على المنشور");
          return;
        }

        // Then get the profile separately
        const { data: profileData } = await supabase
          .from("profiles")
          .select("username, full_name, avatar_url, is_verified")
          .eq("id", postData.user_id)
          .single();

        setPost({
          ...postData,
          profile: profileData
        });
      } catch (err) {
        console.error("Error:", err);
        setError("حدث خطأ أثناء تحميل المنشور");
      } finally {
        setLoading(false);
      }
    };

    loadPost();
  }, [postId]);

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "الآن";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} د`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} س`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} ي`;
    return `${Math.floor(diffInSeconds / 604800)} أ`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">جاري التحميل...</div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="text-destructive">{error || "المنشور غير موجود"}</div>
        <Button onClick={() => navigate(-1)} variant="outline">
          <ArrowRight className="h-4 w-4 ml-2" />
          رجوع
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowRight className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">المنشور</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="max-w-lg mx-auto">
        <Post
          id={post.id}
          userId={post.user_id}
          username={post.profile?.username || "مستخدم"}
          userAvatar={post.profile?.avatar_url || "/default-avatar.jpg"}
          isVerified={post.profile?.is_verified || false}
          image={post.media_url || undefined}
          caption={post.content}
          likes={post.likes_count || 0}
          commentsCount={post.comments_count || 0}
          timeAgo={getTimeAgo(post.created_at)}
          walletEarnings={0}
        />
      </div>
    </div>
  );
};

export default PostView;
