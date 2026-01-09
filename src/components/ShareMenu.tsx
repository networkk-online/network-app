import { useState } from 'react';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle 
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  MessageCircle, 
  Send, 
  Copy, 
  Facebook, 
  Twitter, 
  Mail,
  Link2
} from 'lucide-react';

interface ShareMenuProps {
  isOpen: boolean;
  onClose: () => void;
  shareUrl: string;
  shareTitle: string;
  shareText: string;
}

const ShareMenu = ({ isOpen, onClose, shareUrl, shareTitle, shareText }: ShareMenuProps) => {
  const { toast } = useToast();
  const [copying, setCopying] = useState(false);

  const shareOptions = [
    {
      name: 'واتساب',
      icon: MessageCircle,
      color: 'bg-green-500',
      onClick: () => {
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`;
        window.open(whatsappUrl, '_blank');
        onClose();
      }
    },
    {
      name: 'تيليجرام',
      icon: Send,
      color: 'bg-blue-500',
      onClick: () => {
        const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
        window.open(telegramUrl, '_blank');
        onClose();
      }
    },
    {
      name: 'فيسبوك',
      icon: Facebook,
      color: 'bg-blue-600',
      onClick: () => {
        const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        window.open(facebookUrl, '_blank');
        onClose();
      }
    },
    {
      name: 'تويتر',
      icon: Twitter,
      color: 'bg-sky-500',
      onClick: () => {
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        window.open(twitterUrl, '_blank');
        onClose();
      }
    },
    {
      name: 'البريد',
      icon: Mail,
      color: 'bg-red-500',
      onClick: () => {
        const mailUrl = `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`;
        window.location.href = mailUrl;
        onClose();
      }
    },
    {
      name: 'نسخ الرابط',
      icon: Copy,
      color: 'bg-gray-600',
      onClick: async () => {
        setCopying(true);
        try {
          await navigator.clipboard.writeText(shareUrl);
          toast({
            title: 'تم النسخ',
            description: 'تم نسخ الرابط بنجاح',
          });
          onClose();
        } catch (error) {
          toast({
            title: 'خطأ',
            description: 'فشل نسخ الرابط',
            variant: 'destructive'
          });
        } finally {
          setCopying(false);
        }
      }
    }
  ];

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="bg-gray-900 border-gray-700 rounded-t-3xl">
        <SheetHeader className="mb-4">
          <SheetTitle className="text-white text-center">مشاركة</SheetTitle>
        </SheetHeader>
        
        <div className="grid grid-cols-3 gap-4 pb-8">
          {shareOptions.map((option) => (
            <Button
              key={option.name}
              variant="ghost"
              className="flex flex-col items-center gap-2 h-auto py-4 hover:bg-gray-800"
              onClick={option.onClick}
              disabled={copying && option.name === 'نسخ الرابط'}
            >
              <div className={`w-14 h-14 rounded-full ${option.color} flex items-center justify-center`}>
                <option.icon className="w-6 h-6 text-white" />
              </div>
              <span className="text-white text-sm">{option.name}</span>
            </Button>
          ))}
        </div>

        {/* URL Preview */}
        <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg mb-4">
          <Link2 className="w-5 h-5 text-gray-400" />
          <p className="text-gray-400 text-sm truncate flex-1" dir="ltr">{shareUrl}</p>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ShareMenu;
