import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Gift, Plus, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const MasterGiftCodes = () => {
  const { toast } = useToast();
  const [codes, setCodes] = useState<any[]>([]);
  const [coinAmount, setCoinAmount] = useState('1000');
  const [expirationDays, setExpirationDays] = useState('30');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => { loadCodes(); }, []);

  const loadCodes = async () => {
    const { data } = await supabase.from('gift_codes').select('*').order('created_at', { ascending: false }).limit(100);
    if (data) setCodes(data);
  };

  const generate = async () => {
    setIsGenerating(true);
    const { data: { user } } = await supabase.auth.getUser();
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 12; i++) {
      if (i > 0 && i % 4 === 0) code += '-';
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + parseInt(expirationDays));
    await supabase.from('gift_codes').insert({
      code, coin_amount: parseInt(coinAmount), created_by: user?.id || '00000000-0000-0000-0000-000000000000', expires_at: expiresAt.toISOString(),
    });
    toast({ title: '✅ تم إنشاء الكود', description: code });
    loadCodes();
    setIsGenerating(false);
  };

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white/[0.03] border-white/[0.08]">
        <CardHeader className="pb-3">
          <CardTitle className="text-[#39FF14] flex items-center gap-2 text-base">
            <Gift className="h-5 w-5" /> إنشاء كود هدية عالمي
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="text-xs text-white/40 mb-1 block">عدد العملات</label>
              <Select value={coinAmount} onValueChange={setCoinAmount}>
                <SelectTrigger className="bg-white/[0.05] border-white/[0.1] text-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[100, 500, 1000, 5000, 10000, 50000].map(a => (
                    <SelectItem key={a} value={a.toString()}>{a.toLocaleString()} 💎</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1 block">صلاحية (أيام)</label>
              <Input type="number" value={expirationDays} onChange={e => setExpirationDays(e.target.value)}
                className="bg-white/[0.05] border-white/[0.1] text-white" min={1} max={365} />
            </div>
          </div>
          <Button onClick={generate} disabled={isGenerating} className="w-full bg-[#39FF14] text-black font-bold hover:bg-[#39FF14]/80">
            <Plus className="w-4 h-4 mr-2" />{isGenerating ? 'جاري الإنشاء...' : 'إنشاء كود عالمي'}
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-white/[0.03] border-white/[0.08]">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-white/[0.06]">
                <TableHead className="text-right text-white/40">الكود</TableHead>
                <TableHead className="text-right text-white/40">العملات</TableHead>
                <TableHead className="text-right text-white/40">الحالة</TableHead>
                <TableHead className="text-right text-white/40">الانتهاء</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {codes.map(gc => (
                <TableRow key={gc.id} className="border-white/[0.04]">
                  <TableCell className="font-mono text-sm font-bold text-[#39FF14]">{gc.code}</TableCell>
                  <TableCell className="text-white">{gc.coin_amount?.toLocaleString()} 💎</TableCell>
                  <TableCell>
                    <Badge className={gc.status === 'active' ? 'bg-[#39FF14]/15 text-[#39FF14] border-[#39FF14]/20' : 'bg-white/10 text-white/40'}>
                      {gc.status === 'active' ? 'نشط' : 'مُستخدم'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-white/30">{gc.expires_at ? new Date(gc.expires_at).toLocaleDateString('ar-IQ') : '-'}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => copyCode(gc.code, gc.id)}>
                      {copiedId === gc.id ? <Check className="w-4 h-4 text-[#39FF14]" /> : <Copy className="w-4 h-4 text-white/30" />}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {codes.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-white/30">لا توجد أكواد</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default MasterGiftCodes;
