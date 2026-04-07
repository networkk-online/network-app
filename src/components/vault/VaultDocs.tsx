import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Key, Shield, Globe, Server, Zap } from 'lucide-react';

const docs = [
  {
    id: 'protocol',
    title: 'بروتوكول G3142-AF26-0x99',
    icon: Shield,
    content: `## System Protocol G3142-AF26-0x99

- **Access Level**: OWNER ONLY
- **Route**: /G3142-AF26-0x99
- **Authentication**: Dual-layer (Supabase Auth + Security Password)
- **Session**: Encrypted, auto-logout after 30min inactivity
- **Logging**: All actions recorded in security_logs table

### Security Rules:
1. Non-owner users are immediately logged out
2. Access attempts are logged with IP and User ID
3. Maintenance mode blocks all non-owner access
4. Staff can only access /staff-portal with approved permissions`,
  },
  {
    id: 'api',
    title: 'مفاتيح API',
    icon: Key,
    content: `## API Keys Reference

| Service | Secret Name | Status |
|---------|------------|--------|
| Supabase | SUPABASE_SERVICE_ROLE_KEY | ✅ Active |
| Daily.co | DAILY_API_KEY | ✅ Active |
| AWS | AWS_ACCESS_KEY_ID | ✅ Active |
| AWS | AWS_SECRET_ACCESS_KEY | ✅ Active |
| Lovable AI | LOVABLE_API_KEY | ✅ Active |

> ⚠️ Never expose service role keys in client-side code.`,
  },
  {
    id: 'infra',
    title: 'البنية التحتية',
    icon: Server,
    content: `## Infrastructure

- **Frontend**: React 18 + Vite 5 + TailwindCSS
- **Backend**: Supabase (PostgreSQL + Auth + Realtime + Edge Functions)
- **Storage**: Supabase Storage (avatars, posts, reels, stories)
- **Mobile**: Capacitor (iOS + Android)
- **CDN**: Lovable Cloud
- **Database**: 40+ tables with RLS policies
- **Triggers**: 25+ automated PostgreSQL triggers`,
  },
  {
    id: 'roles',
    title: 'نظام الأدوار',
    icon: Zap,
    content: `## Role-Based Access Control

### OWNER (Ghaith)
- Full system access
- Financial control
- Moderator management
- Database administration

### MODERATOR
- Content review
- User banning (if permitted)
- Report handling
- Cannot access financial data

### USER
- Standard app functionality
- No admin access
- Cannot see admin routes`,
  },
];

const VaultDocs = () => {
  const [activeDoc, setActiveDoc] = useState('protocol');

  const current = docs.find(d => d.id === activeDoc);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* Sidebar */}
      <div className="space-y-1">
        {docs.map(doc => (
          <button key={doc.id} onClick={() => setActiveDoc(doc.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all ${
              activeDoc === doc.id
                ? 'bg-[#39FF14]/10 text-[#39FF14] border border-[#39FF14]/20'
                : 'text-white/30 hover:bg-white/[0.04] hover:text-white/60'
            }`}>
            <doc.icon className="w-4 h-4 shrink-0" />
            <span className="truncate">{doc.title}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <Card className="md:col-span-3 bg-white/[0.03] border-white/[0.06]">
        <CardHeader className="pb-3">
          <CardTitle className="text-[#39FF14] text-sm flex items-center gap-2">
            <BookOpen className="w-4 h-4" /> {current?.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-invert prose-sm max-w-none">
            <pre className="whitespace-pre-wrap text-white/60 text-xs leading-relaxed font-mono bg-white/[0.02] p-4 rounded-xl border border-white/[0.06]">
              {current?.content}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VaultDocs;
