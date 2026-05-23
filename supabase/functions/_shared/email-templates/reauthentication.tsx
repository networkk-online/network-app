/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

const LOGO_URL =
  'https://ykjnpcrseiyltsazbnci.supabase.co/storage/v1/object/public/email-assets/network-logo.png'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="ar" dir="rtl">
    <Head />
    <Preview>رمز التحقق الخاص بك</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Img src={LOGO_URL} width="56" height="56" alt="Network" style={logo} />
        </Section>
        <Section style={card}>
          <Heading style={h1}>رمز التحقق</Heading>
          <Text style={text}>استخدم الرمز التالي لتأكيد هويتك:</Text>
          <Text style={codeStyle}>{token}</Text>
          <Hr style={hr} />
          <Text style={footer}>
            تنتهي صلاحية هذا الرمز قريباً. إذا لم تطلبه، يمكنك تجاهل هذه الرسالة.
          </Text>
        </Section>
        <Text style={brandFooter}>© Network — networkk.online</Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', 'Segoe UI', -apple-system, BlinkMacSystemFont, Arial, sans-serif", padding: '24px 0' }
const container = { maxWidth: '560px', margin: '0 auto', padding: '0 16px' }
const header = { textAlign: 'center' as const, padding: '8px 0 20px' }
const logo = { margin: '0 auto', display: 'block' }
const card = {
  backgroundColor: '#ffffff',
  border: '1px solid #e6e8eb',
  borderRadius: '20px',
  padding: '32px 28px',
  boxShadow: '0 4px 24px rgba(8, 160, 69, 0.08)',
  borderTop: '3px solid #08A045',
  textAlign: 'center' as const,
}
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#0a0a0a', margin: '0 0 16px' }
const text = { fontSize: '15px', color: '#4b5563', lineHeight: '1.7', margin: '0 0 16px' }
const codeStyle = {
  display: 'inline-block',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  fontSize: '32px',
  letterSpacing: '10px',
  fontWeight: 'bold' as const,
  color: '#08A045',
  backgroundColor: '#f0fdf4',
  border: '1px solid #bbf7d0',
  borderRadius: '14px',
  padding: '18px 28px',
  margin: '0 0 24px',
}
const hr = { borderColor: '#eef0f2', margin: '12px 0 16px' }
const footer = { fontSize: '12px', color: '#9ca3af', margin: '0' }
const brandFooter = { fontSize: '12px', color: '#9ca3af', textAlign: 'center' as const, margin: '20px 0 0' }
