import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Check, Plus, X, Loader2, User, LogOut } from 'lucide-react';
import { useAccountSwitcher } from '@/hooks/useAccountSwitcher';
import { useToast } from '@/hooks/use-toast';

interface AccountSwitcherProps {
  isOpen: boolean;
  onClose: () => void;
  anchorPosition?: 'bottom-nav' | 'header';
}

const AccountSwitcher = ({ isOpen, onClose, anchorPosition = 'bottom-nav' }: AccountSwitcherProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { accounts, activeAccountId, switching, switchToAccount, removeAccount, addAccountViaLogin } = useAccountSwitcher();
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleSwitch = async (accountId: string) => {
    try {
      await switchToAccount(accountId);
      toast({ title: 'تم التبديل ✅', description: 'تم تبديل الحساب بنجاح' });
      onClose();
      // Force full UI refresh
      window.location.reload();
    } catch {
      toast({ title: 'خطأ في التبديل', description: 'انتهت صلاحية الجلسة، سجل دخولك مرة أخرى', variant: 'destructive' });
    }
  };

  const handleAddAccount = () => {
    onClose();
    navigate(addAccountViaLogin());
  };

  const handleRemove = (id: string) => {
    removeAccount(id);
    setRemovingId(null);
    toast({ title: 'تم إزالة الحساب' });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-[80]"
          />

          {/* Switcher Panel */}
          <motion.div
            initial={anchorPosition === 'bottom-nav' ? { y: 40, opacity: 0 } : { y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={anchorPosition === 'bottom-nav' ? { y: 40, opacity: 0 } : { y: -20, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className={`fixed z-[81] w-[280px] ${
              anchorPosition === 'bottom-nav'
                ? 'bottom-20 right-4'
                : 'top-16 right-4'
            }`}
          >
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: 'linear-gradient(145deg, rgba(20,20,30,0.95) 0%, rgba(10,10,18,0.98) 100%)',
                backdropFilter: 'blur(40px)',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 pt-4 pb-2">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">الحسابات</span>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-white/5">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {/* Account List */}
              <div className="px-2 pb-2 max-h-[300px] overflow-y-auto">
                {accounts.map((account) => {
                  const isActive = account.id === activeAccountId;
                  return (
                    <motion.button
                      key={account.id}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => !isActive && handleSwitch(account.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all relative group ${
                        isActive
                          ? 'bg-primary/10 border border-primary/20'
                          : 'hover:bg-white/[0.04] border border-transparent'
                      }`}
                    >
                      {/* Avatar */}
                      <div className="relative">
                        <Avatar className={`w-9 h-9 ring-2 ${isActive ? 'ring-primary' : 'ring-white/10'}`}>
                          <AvatarImage src={account.avatar_url || undefined} />
                          <AvatarFallback className="bg-white/5 text-xs">
                            <User className="w-4 h-4 text-muted-foreground" />
                          </AvatarFallback>
                        </Avatar>
                        {isActive && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center"
                            style={{ boxShadow: '0 0 8px hsl(var(--primary) / 0.5)' }}>
                            <Check className="w-2.5 h-2.5 text-primary-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 text-right min-w-0">
                        <p className={`text-sm font-bold truncate ${isActive ? 'text-primary' : 'text-foreground'}`}>
                          {account.full_name || account.username || 'بدون اسم'}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          @{account.username || account.email?.split('@')[0] || '—'}
                        </p>
                      </div>

                      {/* Remove button (non-active only) */}
                      {!isActive && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (removingId === account.id) handleRemove(account.id);
                            else setRemovingId(account.id);
                          }}
                          className={`p-1.5 rounded-full transition-all opacity-0 group-hover:opacity-100 ${
                            removingId === account.id ? 'bg-destructive/20 text-destructive' : 'hover:bg-white/5 text-muted-foreground'
                          }`}
                        >
                          {removingId === account.id ? <LogOut className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                        </button>
                      )}

                      {/* Switching indicator */}
                      {switching && !isActive && (
                        <Loader2 className="w-4 h-4 text-primary animate-spin" />
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {/* Add Account Button */}
              <div className="px-2 pb-3">
                <button
                  onClick={handleAddAccount}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-dashed border-white/10 hover:border-primary/30 hover:bg-primary/5 transition-all"
                >
                  <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center">
                    <Plus className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">إضافة حساب</span>
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AccountSwitcher;
