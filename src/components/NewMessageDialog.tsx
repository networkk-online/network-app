import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Search, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useMessages } from '@/hooks/useMessages';

interface NewMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConversationCreated?: (conversationId: string) => void;
}

interface Following {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
}

export const NewMessageDialog = ({ open, onOpenChange, onConversationCreated }: NewMessageDialogProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { createConversation } = useMessages();
  const [searchQuery, setSearchQuery] = useState('');
  const [following, setFollowing] = useState<Following[]>([]);
  const [filteredFollowing, setFilteredFollowing] = useState<Following[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadFollowing();
    }
  }, [open]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = following.filter(user => 
        user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredFollowing(filtered);
    } else {
      setFilteredFollowing(following);
    }
  }, [searchQuery, following]);

  const loadFollowing = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // First get the following IDs
      const { data: followsData, error: followsError } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);

      if (followsError) throw followsError;

      if (!followsData || followsData.length === 0) {
        setFollowing([]);
        setFilteredFollowing([]);
        return;
      }

      // Then get the profiles for those IDs
      const followingIds = followsData.map(f => f.following_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .in('id', followingIds);

      if (profilesError) throw profilesError;

      const followingList = profilesData?.map((profile: any) => ({
        id: profile.id,
        username: profile.username,
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
      })) || [];

      setFollowing(followingList);
      setFilteredFollowing(followingList);
    } catch (error: any) {
      console.error('Error loading following:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحميل المتابعين",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartConversation = async (userId: string) => {
    try {
      const result = await createConversation(userId);
      if (result.success && result.conversationId) {
        onOpenChange(false);
        if (onConversationCreated) {
          onConversationCreated(result.conversationId);
        }
      } else if (result.error) {
        toast({
          title: "خطأ",
          description: result.error,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Error starting conversation:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء بدء المحادثة",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-gray-950 text-white border-gray-800">
        <DialogHeader>
          <DialogTitle>رسالة جديدة</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="بحث عن متابع..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10 bg-gray-900 border-gray-800"
            />
          </div>

          <div className="max-h-[400px] overflow-y-auto space-y-2">
            {loading ? (
              <div className="text-center py-8 text-gray-400">جاري التحميل...</div>
            ) : filteredFollowing.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                {searchQuery ? 'لا توجد نتائج' : 'لا توجد متابعات بعد'}
              </div>
            ) : (
              filteredFollowing.map((user) => (
                <div
                  key={user.id}
                  onClick={() => handleStartConversation(user.id)}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 cursor-pointer transition-colors"
                >
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={user.avatar_url || ''} alt={user.full_name} />
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500">
                      {user.full_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate">{user.full_name}</p>
                    <p className="text-sm text-gray-400 truncate">@{user.username}</p>
                  </div>
                  <MessageCircle className="h-5 w-5 text-gray-400" />
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};