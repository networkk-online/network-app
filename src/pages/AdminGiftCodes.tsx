import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Copy, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import AdminHeader from '@/components/AdminHeader';

const COIN_AMOUNTS = [100, 500, 1000, 5000, 10000];

const generateCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 12; i++) {
    if (i > 0 && i % 4 === 0) code += '-';
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
};

const AdminGiftCodes = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [coinAmount, setCoinAmount] = useState('1000');
  const [expirationDays, setExpirationDays] = useState('30');
  const [codes, setCodes] = useState<any[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    loadCodes();
  }, []);

  const loadCodes = async () => {
    const { data } = await supabase
      .from('gift_codes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) setCodes(data);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const code = generateCode();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + parseInt(expirationDays));

    const { error } = await supabase.from('gift_codes').insert({
      code,
      coin_amount: parseInt(coinAmount),
      created_by: user.id,
      expires_at: expiresAt.toISOString(),
    });

    if (!error) {
      toast({ title: '✅ تم إنشاء الكود بنجاح', description: code });
      loadCodes();
    }
    setIsGenerating(false);
  };

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AdminHeader />

      <div className="p-4 max-w-4xl mx-auto">
        {/* Generator Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-card border border-border rounded-2xl p-5 mb-6"
        >
          <h2 className="text-lg font-bold mb-4">إنشاء كود جديد</h2>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">عدد العملات</label>
              <Select value={coinAmount} onValueChange={setCoinAmount}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COIN_AMOUNTS.map(a => (
                    <SelectItem key={a} value={a.toString()}>{a.toLocaleString()} 💎</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">صلاحية (أيام)</label>
              <Input
                type="number"
                value={expirationDays}
                onChange={(e) => setExpirationDays(e.target.value)}
                className="bg-secondary border-border"
                min={1}
                max={365}
              />
            </div>
          </div>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full bg-primary text-primary-foreground font-bold"
          >
            <Plus className="w-4 h-4 mr-2" />
            {isGenerating ? 'جاري الإنشاء...' : 'إنشاء كود'}
          </Button>
        </motion.div>

        {/* Codes Table */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead className="text-right">الكود</TableHead>
                <TableHead className="text-right">العملات</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">انتهاء الصلاحية</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {codes.map((code) => (
                <TableRow key={code.id} className="border-border">
                  <TableCell className="font-mono text-sm font-bold">{code.code}</TableCell>
                  <TableCell>{code.coin_amount.toLocaleString()} 💎</TableCell>
                  <TableCell>
                    <Badge variant={code.status === 'active' ? 'default' : 'secondary'}
                      className={code.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-muted text-muted-foreground'}>
                      {code.status === 'active' ? 'نشط' : 'مُستخدم'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {code.expires_at ? new Date(code.expires_at).toLocaleDateString('ar-IQ') : '-'}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => copyCode(code.code, code.id)}>
                      {copiedId === code.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {codes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    لا توجد أكواد بعد
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default AdminGiftCodes;
