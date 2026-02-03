import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight,
  MessageCircle,
  Users,
  UserCheck,
  Globe,
  Lock,
  Shield,
  ChevronLeft,
  Eye,
  EyeOff
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const springConfig = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 30
};

export default function MessagePrivacySettings() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Settings state
  const [whoCanMessage, setWhoCanMessage] = useState<'everyone' | 'followers' | 'following' | 'no_one'>('followers');
  const [allowStoryReplies, setAllowStoryReplies] = useState<'everyone' | 'followers' | 'off'>('followers');
  const [showReadReceipts, setShowReadReceipts] = useState(true);
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);
  const [messageRequests, setMessageRequests] = useState(true);
  const [filterMessages, setFilterMessages] = useState(true);

  const handleSave = () => {
    toast({
      title: 'تم الحفظ',
      description: 'تم تحديث إعدادات الخصوصية بنجاح'
    });
  };

  const SettingCard = ({ 
    icon: Icon, 
    title, 
    description, 
    children 
  }: { 
    icon: any; 
    title: string; 
    description?: string; 
    children: React.ReactNode;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springConfig}
      className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#833AB4] to-[#E1306C] flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-white">{title}</h3>
          {description && (
            <p className="text-sm text-white/50 mt-1">{description}</p>
          )}
        </div>
      </div>
      <div className="pt-2">
        {children}
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
            >
              <ArrowRight className="w-5 h-5" />
            </motion.button>
            <h1 className="text-lg font-bold">خصوصية الرسائل</h1>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleSave}
            className="px-4 py-2 rounded-full bg-gradient-to-r from-[#833AB4] to-[#E1306C] text-white text-sm font-medium"
          >
            حفظ
          </motion.button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Who Can Message */}
        <SettingCard
          icon={MessageCircle}
          title="من يمكنه مراسلتي"
          description="اختر من يمكنه إرسال رسائل مباشرة إليك"
        >
          <RadioGroup
            value={whoCanMessage}
            onValueChange={(v) => setWhoCanMessage(v as any)}
            className="space-y-3"
          >
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
              <div className="flex items-center gap-3">
                <Globe className="w-4 h-4 text-white/50" />
                <Label htmlFor="msg-everyone" className="text-white cursor-pointer">الجميع</Label>
              </div>
              <RadioGroupItem value="everyone" id="msg-everyone" />
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 text-white/50" />
                <Label htmlFor="msg-followers" className="text-white cursor-pointer">المتابعون فقط</Label>
              </div>
              <RadioGroupItem value="followers" id="msg-followers" />
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
              <div className="flex items-center gap-3">
                <UserCheck className="w-4 h-4 text-white/50" />
                <Label htmlFor="msg-following" className="text-white cursor-pointer">من أتابعهم فقط</Label>
              </div>
              <RadioGroupItem value="following" id="msg-following" />
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
              <div className="flex items-center gap-3">
                <Lock className="w-4 h-4 text-white/50" />
                <Label htmlFor="msg-no_one" className="text-white cursor-pointer">لا أحد</Label>
              </div>
              <RadioGroupItem value="no_one" id="msg-no_one" />
            </div>
          </RadioGroup>
        </SettingCard>

        {/* Story Replies */}
        <SettingCard
          icon={Eye}
          title="ردود القصص"
          description="من يمكنه الرد على قصصك"
        >
          <RadioGroup
            value={allowStoryReplies}
            onValueChange={(v) => setAllowStoryReplies(v as any)}
            className="space-y-3"
          >
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
              <Label htmlFor="story-everyone" className="text-white cursor-pointer">الجميع</Label>
              <RadioGroupItem value="everyone" id="story-everyone" />
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
              <Label htmlFor="story-followers" className="text-white cursor-pointer">المتابعون فقط</Label>
              <RadioGroupItem value="followers" id="story-followers" />
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
              <Label htmlFor="story-off" className="text-white cursor-pointer">إيقاف الردود</Label>
              <RadioGroupItem value="off" id="story-off" />
            </div>
          </RadioGroup>
        </SettingCard>

        {/* Toggle Settings */}
        <SettingCard
          icon={Shield}
          title="إعدادات إضافية"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Eye className="w-4 h-4 text-white/50" />
                <span className="text-white">إظهار إيصالات القراءة</span>
              </div>
              <Switch 
                checked={showReadReceipts} 
                onCheckedChange={setShowReadReceipts} 
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-white">إظهار حالة الاتصال</span>
              </div>
              <Switch 
                checked={showOnlineStatus} 
                onCheckedChange={setShowOnlineStatus} 
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageCircle className="w-4 h-4 text-white/50" />
                <span className="text-white">طلبات الرسائل</span>
              </div>
              <Switch 
                checked={messageRequests} 
                onCheckedChange={setMessageRequests} 
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <EyeOff className="w-4 h-4 text-white/50" />
                <span className="text-white">تصفية الرسائل المسيئة</span>
              </div>
              <Switch 
                checked={filterMessages} 
                onCheckedChange={setFilterMessages} 
              />
            </div>
          </div>
        </SettingCard>
      </div>
    </div>
  );
}
