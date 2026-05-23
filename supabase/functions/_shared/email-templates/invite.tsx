/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

const LOGO_URL =
  'https://ykjnpcrseiyltsazbnci.supabase.co/storage/v1/object/public/email-assets/network-logo.png'

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({ siteName, siteUrl, confirmationUrl }: InviteEmailProps) => (
  <Html lang="ar" dir="rtl">
    <Head />
    <Preview>دعوة للانضمام إلى {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Img src={LOGO_URL} width="56" height="56" alt="Network" style={logo} />
        </Section>
        <Section style={card}>
          <Heading style={h1}>تمت دعوتك</Heading>
          <Text style={text}>
            تمت دعوتك للانضمام إلى{' '}
            <Link href={siteUrl} style={link}><strong>{siteName}</strong></Link>
            . اضغط الزر أدناه لقبول الدعوة وإنشاء حسابك.
          </Text>
          <Button style={button} href={confirmationUrl}>
            قبول الدعوة
          </Button>
          <Hr style={hr} />
          <Text style={footer}>إذا لم تكن تتوقع هذه الدعوة، يمكنك تجاهلها بأمان.</Text>
        </Section>
        <Text style={brandFooter}>© Network — networkk.online</Text>
      </Container>
    </Body>
  </Html>
)

export default InviteEmail

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
const text = { fontSize: '15px', color: '#4b5563', lineHeight: '1.7', margin: '0 0 28px' }
const link = { color: '#08A045', textDecoration: 'none' }
const button = {
  backgroundColor: '#08A045',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 'bold' as const,
  borderRadius: '14px',
  padding: '14px 32px',
  textDecoration: 'none',
  display: 'inline-block',
  boxShadow: '0 6px 16px rgba(8, 160, 69, 0.35)',
}
const hr = { borderColor: '#eef0f2', margin: '28px 0 16px' }
const footer = { fontSize: '12px', color: '#9ca3af', margin: '0' }
const brandFooter = { fontSize: '12px', color: '#9ca3af', textAlign: 'center' as const, margin: '20px 0 0' }
