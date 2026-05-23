/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

const LOGO_URL =
  'https://ykjnpcrseiyltsazbnci.supabase.co/storage/v1/object/public/email-assets/network-logo.png'

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl?: string
  token?: string
}

export const MagicLinkEmail = ({ token = '------' }: MagicLinkEmailProps) => (
  <Html lang="ar" dir="rtl">
    <Head />
    <Preview>رمز التحقق الخاص بك من Network</Preview>
    <Body style={main}>
      <Container style={container}>
        {/* Top neon bar */}
        <div style={topBar} />

        <Section style={logoSection}>
          <Img src={LOGO_URL} width="92" height="92" alt="Network" style={logo} />
        </Section>

        <Section style={titleSection}>
          <Heading style={h1}>رمز التحقق الخاص بك</Heading>
          <Text style={subtitle}>
            استخدم الرمز التالي لإتمام تسجيل الدخول إلى تطبيق{' '}
            <span style={brandWord}>Network</span>
          </Text>
        </Section>

        {/* OTP Box */}
        <Section style={otpWrap}>
          <div style={otpBox}>
            <div style={otpCode} dir="ltr">
              {token}
            </div>
          </div>
        </Section>

        <Section style={expirySection}>
          <Text style={expiryText}>
            ينتهي هذا الرمز خلال{' '}
            <span style={brandWord}>5 دقائق</span>
          </Text>
        </Section>

        <div style={divider} />

        <Section style={noticeSection}>
          <Text style={noticeText}>
            إذا لم تطلب تسجيل الدخول، يمكنك تجاهل هذه الرسالة بأمان. لن يتمكن أحد
            من الوصول إلى حسابك دون هذا الرمز.
          </Text>
        </Section>

        <Section style={footerSection}>
          <Text style={footerText}>© Network — جميع الحقوق محفوظة</Text>
        </Section>

        <div style={topBar} />
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail

const main = {
  backgroundColor: '#09090b',
  fontFamily:
    "'Segoe UI', 'Cairo', 'Inter', -apple-system, BlinkMacSystemFont, Tahoma, Arial, sans-serif",
  padding: '40px 16px',
  margin: 0,
}
const container = {
  maxWidth: '560px',
  margin: '0 auto',
  backgroundColor: '#0d0d10',
  border: '1px solid rgba(16,185,129,0.25)',
  borderRadius: '24px',
  overflow: 'hidden' as const,
  boxShadow: '0 0 60px rgba(16,185,129,0.18)',
}
const topBar = {
  height: '3px',
  background:
    'linear-gradient(90deg, rgba(16,185,129,0) 0%, #10b981 50%, rgba(16,185,129,0) 100%)',
}
const logoSection = { textAlign: 'center' as const, padding: '44px 32px 16px' }
const logo = {
  margin: '0 auto',
  display: 'block',
  borderRadius: '20px',
  boxShadow: '0 0 40px rgba(16,185,129,0.45)',
}
const titleSection = { textAlign: 'center' as const, padding: '8px 32px 24px' }
const h1 = {
  margin: '0 0 8px',
  fontSize: '24px',
  fontWeight: 'bold' as const,
  color: '#ffffff',
  letterSpacing: '0.5px',
}
const subtitle = {
  margin: 0,
  fontSize: '14px',
  lineHeight: '1.7',
  color: 'rgba(255,255,255,0.55)',
}
const brandWord = { color: '#10b981', fontWeight: 600 }
const otpWrap = { padding: '0 32px 28px', textAlign: 'center' as const }
const otpBox = {
  display: 'inline-block',
  background: 'rgba(16,185,129,0.06)',
  border: '1px solid rgba(16,185,129,0.35)',
  borderRadius: '18px',
  padding: '26px 40px',
  boxShadow: '0 0 30px rgba(16,185,129,0.2)',
}
const otpCode = {
  fontFamily: "'Courier New', monospace",
  fontSize: '44px',
  fontWeight: 800 as const,
  color: '#10b981',
  letterSpacing: '14px',
  textShadow: '0 0 18px rgba(16,185,129,0.55)',
}
const expirySection = { textAlign: 'center' as const, padding: '0 32px 8px' }
const expiryText = {
  margin: 0,
  fontSize: '13px',
  color: 'rgba(255,255,255,0.45)',
}
const divider = {
  margin: '28px 32px 0',
  height: '1px',
  background:
    'linear-gradient(90deg, transparent, rgba(16,185,129,0.25), transparent)',
}
const noticeSection = { padding: '20px 32px 32px' }
const noticeText = {
  margin: 0,
  fontSize: '12px',
  lineHeight: '1.8',
  color: 'rgba(255,255,255,0.4)',
  textAlign: 'center' as const,
}
const footerSection = {
  textAlign: 'center' as const,
  padding: '18px 32px 28px',
  background: 'rgba(255,255,255,0.02)',
  borderTop: '1px solid rgba(255,255,255,0.04)',
}
const footerText = {
  margin: 0,
  fontSize: '11px',
  color: 'rgba(255,255,255,0.3)',
  letterSpacing: '0.5px',
}
