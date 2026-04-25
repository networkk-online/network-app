-- 1) Bot config table
CREATE TABLE public.bot_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.bot_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can read bot config"
  ON public.bot_config FOR SELECT TO authenticated USING (true);
CREATE POLICY "Owners can manage bot config"
  ON public.bot_config FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2) Knowledge base table
CREATE TABLE public.bot_knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  question_ar TEXT NOT NULL,
  question_en TEXT NOT NULL,
  answer_ar TEXT NOT NULL,
  answer_en TEXT NOT NULL,
  keywords TEXT[] DEFAULT ARRAY[]::TEXT[],
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.bot_knowledge_base ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read knowledge base"
  ON public.bot_knowledge_base FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "Owners manage knowledge base"
  ON public.bot_knowledge_base FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3) System messages table
CREATE TABLE public.system_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  severity TEXT NOT NULL DEFAULT 'info',
  is_read BOOLEAN NOT NULL DEFAULT false,
  is_from_bot BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_system_messages_user ON public.system_messages(user_id, created_at DESC);
CREATE INDEX idx_system_messages_unread ON public.system_messages(user_id, is_read) WHERE is_read = false;
ALTER TABLE public.system_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own system messages"
  ON public.system_messages FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can mark their own system messages as read"
  ON public.system_messages FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can send messages to bot"
  ON public.system_messages FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND is_from_bot = false);

CREATE POLICY "Owners manage all system messages"
  ON public.system_messages FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4) Support tickets
CREATE TABLE public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  question TEXT NOT NULL,
  context JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'open',
  assigned_to UUID,
  resolution TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see their own tickets"
  ON public.support_tickets FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users create their own tickets"
  ON public.support_tickets FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Owners manage tickets"
  ON public.support_tickets FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 5) Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.system_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_tickets;

-- 6) Seed knowledge base
INSERT INTO public.bot_knowledge_base (category, question_ar, question_en, answer_ar, answer_en, keywords, priority) VALUES
('topup', 'كيف أشحن حسابي؟', 'How do I top up my account?',
'💎 **Safe Top-up | شحن آمن**\n\nنظام الشحن في NETWORKK يعتمد بروتوكولات دفع مشفرة عبر Verified Gateway مع ضمان وصول 100%.\n\n**خطوات الشحن:**\n1. افتح المحفظة (Wallet)\n2. اختر "Secure Payment Gateway"\n3. اختر طريقة الدفع (ZainCash / AsiaHawala / Card)\n4. اتبع التعليمات لتأكيد التحويل\n\nسيتم تحديث رصيدك من الجواهر (Jewels) **فورياً** بعد مطابقة العملية عبر نظام التحقق المشفّر.',
'💎 **Safe Top-up**\n\nNETWORKK''s top-up system uses encrypted payment protocols through our Verified Gateway with 100% delivery guarantee.\n\n**Top-up Steps:**\n1. Open your Wallet\n2. Select "Secure Payment Gateway"\n3. Choose payment method (ZainCash / AsiaHawala / Card)\n4. Follow instructions to confirm the transaction\n\nYour Jewels balance will update **instantly** once the encrypted verification matches your transaction.',
ARRAY['شحن','top up','topup','recharge','إيداع','زين كاش','asiahawala','زين'], 10),

('withdrawal', 'ليش تأخر السحب؟', 'Why is my withdrawal delayed?',
'⏳ **Withdrawal Audit | تدقيق السحب**\n\nجميع عمليات السحب تخضع لنظام (Anti-Fraud System) لضمان أمان أموال المستخدمين.\n\n**معلومات مهمة:**\n• الحد الأدنى للسحب: $50\n• يتم مراجعة الطلب تقنياً للتأكد من سلامة المعاملة\n• المعالجة تتم خلال وقت قياسي عبر Encrypted Transactions\n\n📊 يمكنك تتبع حالة الطلب عبر قسم **Transaction History** في أي وقت.',
'⏳ **Withdrawal Audit**\n\nAll withdrawals go through our Anti-Fraud System to ensure user funds security.\n\n**Important Info:**\n• Minimum withdrawal: $50\n• Each request undergoes technical review for transaction integrity\n• Processing completed in record time via Encrypted Transactions\n\n📊 Track your request status anytime via **Transaction History**.',
ARRAY['سحب','withdraw','withdrawal','تأخر','delayed','status'], 10),

('p2p', 'أريد أحول جواهر لصديقي؟', 'How do I send Jewels to a friend?',
'🚀 **Instant P2P Transfer | تحويل فوري**\n\nيمكنك إجراء تحويلات لحظية (Real-time Transfers) عبر ميزة **P2P Network**.\n\n**خطوات التحويل:**\n1. ادخل قسم Transfer في المحفظة\n2. أدخل معرف الحساب (User ID) أو اسم المستخدم\n3. حدد المبلغ المطلوب\n4. أكّد عبر **Wallet PIN Verification**\n\n💼 **رسوم تشغيلية رمزية: 1% فقط** لضمان استقرار الشبكة وأمان المعاملات.',
'🚀 **Instant P2P Transfer**\n\nMake real-time transfers via our **P2P Network** feature.\n\n**Transfer Steps:**\n1. Open Transfer section in Wallet\n2. Enter recipient User ID or username\n3. Specify the amount\n4. Confirm via **Wallet PIN Verification**\n\n💼 **Operational fee: only 1%** to ensure network stability and transaction security.',
ARRAY['تحويل','transfer','p2p','صديق','friend','send'], 10),

('security', 'ما هي إجراءات الأمان؟', 'What are the security measures?',
'🛡️ **Security Audit | تدقيق الأمان**\n\nNETWORKK يطبّق طبقات حماية متعددة:\n\n• **Wallet PIN** منفصل عن كلمة مرور الدخول\n• **2FA Authentication** للعمليات الحساسة\n• **Device Fingerprinting** لكل جلسة دخول\n• **IP Geolocation Tracking** لرصد الدخول المشبوه\n• **Encrypted Transactions** بمعيار AES-256\n• **Anti-Fraud System** لمراجعة كل سحب',
'🛡️ **Security Audit**\n\nNETWORKK applies multi-layer protection:\n\n• **Wallet PIN** separate from login password\n• **2FA Authentication** for sensitive operations\n• **Device Fingerprinting** for every session\n• **IP Geolocation Tracking** for suspicious login detection\n• **Encrypted Transactions** with AES-256 standard\n• **Anti-Fraud System** review for every withdrawal',
ARRAY['أمان','security','حماية','protection','2fa','pin'], 8),

('balance', 'كم رصيدي؟', 'What is my balance?',
'💎 لمعرفة رصيدك الحالي اكتب الأمر التالي:\n\n`/balance`\n\nسأعرض لك:\n• رصيد الجواهر (Jewels)\n• القيمة بالدولار (USD)\n• الرصيد المتاح للسحب',
'💎 To check your current balance, type:\n\n`/balance`\n\nI will display:\n• Jewels balance\n• USD value\n• Available for withdrawal',
ARRAY['رصيد','balance','جواهر','jewels','كم'], 9);

-- 7) Update timestamp triggers
CREATE TRIGGER update_bot_config_updated_at BEFORE UPDATE ON public.bot_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_bot_knowledge_updated_at BEFORE UPDATE ON public.bot_knowledge_base
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();