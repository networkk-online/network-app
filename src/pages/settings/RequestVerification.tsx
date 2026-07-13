import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Upload, ShieldCheck, Loader2, CheckCircle2, AlertCircle, Building2, User, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

type AccountType = 'personal' | 'business';

const RequestVerification = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [profile, setProfile] = useState<any>(null);
  const [existing, setExisting] = useState<any>(null);
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);

  const [fullName, setFullName] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('personal');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [idFile, setIdFile] = useState<File | null>(null);
  const [bizFile, setBizFile] = useState<File | null>(null);
  const [agree, setAgree] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/login'); return; }
      setUserId(user.id);
      const [{ data: p }, { data: req }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
        supabase.from('verification_requests').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      ]);
      setProfile(p);
      setExisting(req);
      setFullName(p?.full_name || '');
      // Detect 2FA: check auth factors
      const { data: factors } = await supabase.auth.mfa.listFactors();
      setTwoFAEnabled(!!(factors?.totp?.length || factors?.all?.length));
      setLoading(false);
    })();
  }, [navigate]);

  const uploadDoc = async (file: File, kind: 'id' | 'business'): Promise<string> => {
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${userId}/${kind}_${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from('verification-documents')
      .upload(path, file, { contentType: file.type, upsert: true });
    if (error) throw error;
    return path;
  };

  const bioComplete = !!(profile?.bio && profile.bio.trim().length > 0);
  const avatarComplete = !!profile?.avatar_url;

  const canSubmit = fullName.trim() && idFile && agree && twoFAEnabled && bioComplete && avatarComplete &&
    (accountType === 'personal' || (accountType === 'business' && bizFile));

  const submit = async () => {
    if (!canSubmit) {
      toast({ title: 'أكمل المتطلبات', description: 'يرجى استيفاء جميع الحقول والشروط.', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const idPath = await uploadDoc(idFile!, 'id');
      const bizPath = bizFile ? await uploadDoc(bizFile, 'business') : null;
      const { error } = await supabase.from('verification_requests').insert({
        user_id: userId,
        full_name: fullName.trim(),
        account_type: accountType,
        website_url: websiteUrl.trim() || null,
        id_document_url: idPath,
        business_document_url: bizPath,
        status: 'pending',
        reason: 'طلب توثيق الهوية',
      });
      if (error) throw error;
      toast({ title: 'تم إرسال الطلب', description: 'سيتم مراجعة طلبك خلال 48 ساعة.' });
      navigate('/settings/account-status');
    } catch (e: any) {
      toast({ title: 'فشل الإرسال', description: e.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  if (existing?.status === 'pending') {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-lg mx-auto pt-10">
          <div className="rounded-3xl p-8 bg-white/[0.04] backdrop-blur-xl border border-white/10 text-center">
            <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-8 h-8 text-yellow-400" />
            </div>
            <h2 className="text-xl font-bold mb-2">طلبك قيد المراجعة</h2>
            <p className="text-muted-foreground text-sm mb-6">تم استلام طلبك بنجاح وسيتم مراجعته من قبل الفريق.</p>
            <Button onClick={() => navigate('/settings/account-status')} className="w-full">العودة</Button>
          </div>
        </div>
      </div>
    );
  }

  const Req = ({ ok, label }: { ok: boolean; label: string }) => (
    <div className={`flex items-center gap-2 text-sm ${ok ? 'text-emerald-400' : 'text-muted-foreground'}`}>
      {ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
      <span>{label}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-3 p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/settings/account-status')}>
            <ArrowRight className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">طلب توثيق الحساب</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-5">
        {/* Requirements */}
        <div className="rounded-2xl p-5 bg-white/[0.04] backdrop-blur-xl border border-white/10">
          <h3 className="font-bold mb-3 flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-primary" /> المتطلبات</h3>
          <div className="space-y-2">
            <Req ok={avatarComplete} label="تم إضافة الصورة الشخصية" />
            <Req ok={bioComplete} label="تم إكمال النبذة (Bio)" />
            <Req ok={twoFAEnabled} label="المصادقة الثنائية 2FA مفعّلة" />
          </div>
        </div>

        {/* Form */}
        <div className="rounded-2xl p-5 bg-white/[0.04] backdrop-blur-xl border border-white/10 space-y-4">
          <div>
            <Label className="mb-2 block">الاسم الكامل (كما في الهوية الرسمية)</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="مثال: أحمد علي حسن" />
          </div>

          <div>
            <Label className="mb-2 block">نوع الحساب</Label>
            <div className="grid grid-cols-2 gap-2">
              {(['personal', 'business'] as AccountType[]).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setAccountType(t)}
                  className={`p-3 rounded-xl border transition ${accountType === t ? 'border-primary bg-primary/10' : 'border-white/10 bg-white/[0.02]'}`}
                >
                  <div className="flex items-center gap-2 justify-center">
                    {t === 'personal' ? <User className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                    <span className="text-sm font-medium">{t === 'personal' ? 'شخصي' : 'تجاري'}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="mb-2 block flex items-center gap-2"><Globe className="w-4 h-4" /> الموقع / المتجر (اختياري)</Label>
            <Input dir="ltr" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://example.com" />
          </div>

          <FileField label="وثيقة الهوية (جواز / هوية / رخصة)" file={idFile} onChange={setIdFile} required />

          {accountType === 'business' && (
            <FileField label="السجل التجاري / وثيقة الشركة" file={bizFile} onChange={setBizFile} required />
          )}

          <label className="flex items-start gap-2 cursor-pointer pt-2">
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-1" />
            <span className="text-xs text-muted-foreground">أقر أن جميع المعلومات والمستندات المرفقة صحيحة، وأوافق على مراجعتها من قبل فريق التوثيق.</span>
          </label>

          <Button onClick={submit} disabled={!canSubmit || submitting} className="w-full h-11 font-bold">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'إرسال طلب التوثيق'}
          </Button>
        </div>
      </div>
    </div>
  );
};

const FileField = ({ label, file, onChange, required }: { label: string; file: File | null; onChange: (f: File | null) => void; required?: boolean }) => (
  <div>
    <Label className="mb-2 block">{label} {required && <span className="text-red-400">*</span>}</Label>
    <label className="block cursor-pointer">
      <input
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] || null)}
      />
      <div className={`rounded-xl border border-dashed p-4 text-center transition ${file ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-white/15 hover:border-white/30 bg-white/[0.02]'}`}>
        <Upload className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
        <p className="text-xs">{file ? file.name : 'اضغط لاختيار ملف (صورة أو PDF)'}</p>
      </div>
    </label>
  </div>
);

export default RequestVerification;
