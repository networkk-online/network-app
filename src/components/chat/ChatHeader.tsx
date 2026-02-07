import { motion } from "framer-motion";
import { ArrowRight, Phone, Video, Flag, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { OnlineStatus } from "@/components/communication";
import CallButtons from "@/components/CallButtons";

interface ChatHeaderProps {
  otherUser: {
    id?: string;
    username: string;
    full_name: string;
    avatar_url: string;
  };
  onBack: () => void;
  onSettingsClick?: () => void;
}

const springConfig = {
  type: "spring" as const,
  stiffness: 400,
  damping: 30,
};

export const ChatHeader = ({ otherUser, onBack, onSettingsClick }: ChatHeaderProps) => {
  // دالة تمنع "طفرة" الشاشة وتوقف التأثير على الستوري
  const handleProtectedAction = (e: React.MouseEvent, action?: () => void) => {
    e.stopPropagation();
    if (action) action();
  };

  return (
    <motion.div
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={springConfig}
      className="sticky top-0 z-50 px-4 py-3 flex items-center justify-between backdrop-blur-xl border-b border-white/10"
      style={{
        background: "linear-gradient(180deg, rgba(0, 0, 0, 0.98) 0%, rgba(0, 0, 0, 0.95) 100%)",
      }}
    >
      <div className="flex items-center gap-3">
        {/* Back button */}
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} transition={springConfig}>
          <Button
            size="icon"
            variant="ghost"
            className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20"
            onClick={(e) => handleProtectedAction(e, onBack)}
          >
            <ArrowRight className="h-5 w-5 text-white" />
          </Button>
        </motion.div>

        {/* User Info */}
        <motion.div className="flex items-center gap-3 cursor-pointer" whileTap={{ scale: 0.98 }}>
          <div className="relative">
            <Avatar className="h-10 w-10 border-2 border-purple-500/30">
              <AvatarImage src={otherUser.avatar_url || ""} />
              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-purple-700 text-white">
                {otherUser.full_name?.charAt(0) || otherUser.username?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-0.5 -right-0.5">
              <OnlineStatus isOnline={true} size="sm" />
            </div>
          </div>
          <div>
            <h1 className="text-base font-semibold text-white">{otherUser.full_name || otherUser.username}</h1>
            <p className="text-xs text-white/50">متصل الآن</p>
          </div>
        </motion.div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        {otherUser.id && (
          <CallButtons
            participant={{
              id: otherUser.id,
              username: otherUser.username || "",
              full_name: otherUser.full_name || "",
              avatar_url: otherUser.avatar_url || null,
            }}
            variant="purple"
          />
        )}
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} transition={springConfig}>
          <Button
            size="icon"
            variant="ghost"
            className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20"
            onClick={(e) => handleProtectedAction(e, onSettingsClick)}
          >
            <MoreVertical className="h-5 w-5 text-white/70" />
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
};
