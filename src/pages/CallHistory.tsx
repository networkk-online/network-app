import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Phone, Video, PhoneIncoming, PhoneOutgoing, PhoneMissed, Clock, Search, Trash2, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useCalls } from '@/hooks/useCalls';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface CallRecord {
  id: string;
  caller_id: string;
  receiver_id: string;
  call_type: 'voice' | 'video';
  status: 'missed' | 'answered' | 'declined' | 'busy';
  started_at: string;
  ended_at: string | null;
  duration: number;
  caller: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string | null;
  };
  receiver: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string | null;
  };
}

const CallHistory = () => {
  const navigate = useNavigate();
  const { startCall, muteCaller } = useCalls();
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'missed'>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null);

  useEffect(() => {
    loadCallHistory();
  }, []);

  const loadCallHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }
      setCurrentUserId(user.id);

      const { data, error } = await supabase
        .from('call_history')
        .select('*')
        .or(`caller_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      
      // Fetch profiles for each call
      const callsWithProfiles = await Promise.all((data || []).map(async (call) => {
        const { data: callerProfile } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url')
          .eq('id', call.caller_id)
          .single();
        
        const { data: receiverProfile } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url')
          .eq('id', call.receiver_id)
          .single();

        return {
          ...call,
          call_type: call.call_type as 'voice' | 'video',
          status: call.status as 'missed' | 'answered' | 'declined' | 'busy',
          caller: callerProfile || { id: call.caller_id, username: '', full_name: '', avatar_url: null },
          receiver: receiverProfile || { id: call.receiver_id, username: '', full_name: '', avatar_url: null },
        };
      }));

      setCalls(callsWithProfiles);
    } catch (error) {
      console.error('Error loading call history:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteCall = async (callId: string) => {
    try {
      await supabase.from('call_history').delete().eq('id', callId);
      setCalls(prev => prev.filter(c => c.id !== callId));
    } catch (error) {
      console.error('Error deleting call:', error);
    }
    setDeleteDialogOpen(false);
    setSelectedCallId(null);
  };

  const clearAllHistory = async () => {
    if (!currentUserId) return;
    try {
      await supabase
        .from('call_history')
        .delete()
        .or(`caller_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`);
      setCalls([]);
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getOtherUser = (call: CallRecord) => {
    return call.caller_id === currentUserId ? call.receiver : call.caller;
  };

  const isOutgoing = (call: CallRecord) => call.caller_id === currentUserId;

  const filteredCalls = calls.filter(call => {
    const otherUser = getOtherUser(call);
    const matchesSearch = 
      otherUser.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      otherUser.username?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filter === 'missed') {
      return matchesSearch && call.status === 'missed';
    }
    return matchesSearch;
  });

  const CallItem = ({ call }: { call: CallRecord }) => {
    const otherUser = getOtherUser(call);
    const outgoing = isOutgoing(call);

    const getStatusIcon = () => {
      if (call.status === 'missed') {
        return <PhoneMissed className="h-4 w-4 text-red-500" />;
      }
      return outgoing ? (
        <PhoneOutgoing className="h-4 w-4 text-green-500" />
      ) : (
        <PhoneIncoming className="h-4 w-4 text-blue-500" />
      );
    };

    const handleCall = () => {
      startCall(
        {
          id: otherUser.id,
          username: otherUser.username,
          full_name: otherUser.full_name,
          avatar_url: otherUser.avatar_url,
        },
        call.call_type
      );
    };

    return (
      <div className="flex items-center justify-between p-4 hover:bg-accent/5 transition-colors">
        <div className="flex items-center gap-3 flex-1">
          <Avatar className="h-12 w-12">
            <AvatarImage src={otherUser.avatar_url || ''} />
            <AvatarFallback>
              {otherUser.full_name?.charAt(0) || otherUser.username?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={`font-medium truncate ${call.status === 'missed' ? 'text-red-500' : ''}`}>
                {otherUser.full_name || otherUser.username}
              </span>
              {getStatusIcon()}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {call.call_type === 'video' ? (
                <Video className="h-3 w-3" />
              ) : (
                <Phone className="h-3 w-3" />
              )}
              <span>
                {formatDistanceToNow(new Date(call.started_at), { 
                  addSuffix: true, 
                  locale: ar 
                })}
              </span>
              {call.duration > 0 && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDuration(call.duration)}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCall}
            className="text-green-500 hover:bg-green-500/10"
          >
            {call.call_type === 'video' ? (
              <Video className="h-5 w-5" />
            ) : (
              <Phone className="h-5 w-5" />
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleCall}>
                <Phone className="h-4 w-4 mr-2" />
                اتصال صوتي
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => startCall(
                {
                  id: otherUser.id,
                  username: otherUser.username,
                  full_name: otherUser.full_name,
                  avatar_url: otherUser.avatar_url,
                },
                'video'
              )}>
                <Video className="h-4 w-4 mr-2" />
                مكالمة فيديو
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => muteCaller(otherUser.id)}
                className="text-yellow-500"
              >
                <PhoneMissed className="h-4 w-4 mr-2" />
                كتم المكالمات
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => {
                  setSelectedCallId(call.id);
                  setDeleteDialogOpen(true);
                }}
                className="text-red-500"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                حذف
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowRight className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">سجل المكالمات</h1>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate('/settings/calls')}>
                إعدادات المكالمات
              </DropdownMenuItem>
              <DropdownMenuItem onClick={clearAllHistory} className="text-red-500">
                مسح السجل
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Search */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث في المكالمات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={filter} onValueChange={(v) => setFilter(v as 'all' | 'missed')}>
          <TabsList className="w-full justify-start px-4 bg-transparent">
            <TabsTrigger value="all" className="flex-1">الكل</TabsTrigger>
            <TabsTrigger value="missed" className="flex-1">
              الفائتة
              {calls.filter(c => c.status === 'missed').length > 0 && (
                <span className="mr-1 px-1.5 py-0.5 text-xs bg-red-500 text-white rounded-full">
                  {calls.filter(c => c.status === 'missed').length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Call List */}
      <div className="divide-y divide-border">
        {filteredCalls.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Phone className="h-12 w-12 mb-4 opacity-50" />
            <p>لا توجد مكالمات</p>
          </div>
        ) : (
          filteredCalls.map((call) => (
            <CallItem key={call.id} call={call} />
          ))
        )}
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف المكالمة</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذه المكالمة من السجل؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedCallId && deleteCall(selectedCallId)}
              className="bg-red-500 hover:bg-red-600"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CallHistory;
