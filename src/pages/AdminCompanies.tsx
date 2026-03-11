import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Building2, Plus, UserPlus, X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import StealthLayout from '@/components/stealth/StealthLayout';

interface Company {
  id: string;
  name: string;
  logo_url: string | null;
  owner_id: string;
  description: string | null;
  website: string | null;
  created_at: string;
}

const AdminCompanies = () => {
  const { toast } = useToast();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newLogo, setNewLogo] = useState('');
  const [newDesc, setNewDesc] = useState('');
  
  // Assign affiliation
  const [assignCompanyId, setAssignCompanyId] = useState<string | null>(null);
  const [searchUsername, setSearchUsername] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => { loadCompanies(); }, []);

  const loadCompanies = async () => {
    const { data } = await supabase.from('companies').select('*').order('created_at', { ascending: false });
    setCompanies((data as Company[]) || []);
    setLoading(false);
  };

  const createCompany = async () => {
    if (!newName.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('companies').insert({
      name: newName.trim(),
      logo_url: newLogo.trim() || null,
      description: newDesc.trim() || null,
      owner_id: user.id,
    });

    if (error) { toast({ title: 'خطأ', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'تم إنشاء الشركة' });
    setNewName(''); setNewLogo(''); setNewDesc(''); setShowCreate(false);
    loadCompanies();
  };

  const searchUsers = async () => {
    if (!searchUsername.trim()) return;
    const { data } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url')
      .or(`username.ilike.%${searchUsername}%,full_name.ilike.%${searchUsername}%`)
      .limit(10);
    setSearchResults(data || []);
  };

  const assignAffiliation = async (userId: string) => {
    if (!assignCompanyId) return;
    setAssigning(true);
    const { error } = await supabase
      .from('profiles')
      .update({ affiliated_company_id: assignCompanyId })
      .eq('id', userId);

    if (error) { toast({ title: 'خطأ', variant: 'destructive' }); }
    else { toast({ title: 'تم ربط المستخدم بالشركة' }); }
    setAssigning(false);
    setAssignCompanyId(null);
    setSearchUsername('');
    setSearchResults([]);
  };

  const removeAffiliation = async (userId: string) => {
    await supabase.from('profiles').update({ affiliated_company_id: null }).eq('id', userId);
    toast({ title: 'تم إزالة الانتساب' });
  };

  return (
    <StealthLayout onRefresh={loadCompanies}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-mono text-[#00ff41] tracking-wider uppercase flex items-center gap-2">
            <Building2 className="w-5 h-5" /> Companies
          </h1>
          <Button size="sm" onClick={() => setShowCreate(!showCreate)} className="bg-[#00ff41]/10 text-[#00ff41] hover:bg-[#00ff41]/20 border border-[#00ff41]/30">
            <Plus className="w-4 h-4 mr-1" /> New Company
          </Button>
        </div>

        {/* Create form */}
        {showCreate && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="bg-[#111] border border-[#1a1a1a] rounded-lg p-4 space-y-3">
            <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Company Name" className="bg-[#0a0a0a] border-[#222] text-white" />
            <Input value={newLogo} onChange={e => setNewLogo(e.target.value)} placeholder="Logo URL" className="bg-[#0a0a0a] border-[#222] text-white" />
            <Input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Description" className="bg-[#0a0a0a] border-[#222] text-white" />
            <div className="flex gap-2">
              <Button size="sm" onClick={createCompany} className="bg-[#00ff41]/20 text-[#00ff41] hover:bg-[#00ff41]/30">Create</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowCreate(false)} className="text-gray-500">Cancel</Button>
            </div>
          </motion.div>
        )}

        {/* Companies list */}
        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-[#111] rounded-lg animate-pulse" />)}</div>
        ) : companies.length === 0 ? (
          <div className="text-center py-16 text-gray-600 font-mono text-sm">No companies yet</div>
        ) : (
          <div className="space-y-3">
            {companies.map(comp => (
              <div key={comp.id} className="bg-[#111] border border-[#1a1a1a] rounded-lg p-4">
                <div className="flex items-center gap-3">
                  {comp.logo_url ? (
                    <img src={comp.logo_url} alt={comp.name} className="w-10 h-10 rounded-lg object-cover border border-[#222]" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-[#00ff41]/10 flex items-center justify-center border border-[#00ff41]/20">
                      <span className="text-[#00ff41] font-bold">{comp.name.charAt(0)}</span>
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-white font-bold text-sm">{comp.name}</p>
                    {comp.description && <p className="text-gray-500 text-xs">{comp.description}</p>}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { setAssignCompanyId(comp.id); setSearchResults([]); setSearchUsername(''); }}
                    className="text-[#00ff41] border-[#00ff41]/30 hover:bg-[#00ff41]/10"
                  >
                    <UserPlus className="w-4 h-4 mr-1" /> Assign User
                  </Button>
                </div>

                {/* Assign user modal inline */}
                {assignCompanyId === comp.id && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mt-3 p-3 bg-[#0a0a0a] rounded-lg border border-[#1a1a1a] space-y-2">
                    <div className="flex gap-2">
                      <Input
                        value={searchUsername}
                        onChange={e => setSearchUsername(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && searchUsers()}
                        placeholder="Search username..."
                        className="bg-[#111] border-[#222] text-white text-sm"
                      />
                      <Button size="sm" onClick={searchUsers} className="bg-[#00ff41]/20 text-[#00ff41]">
                        <Search className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setAssignCompanyId(null)} className="text-gray-500">
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    {searchResults.map(u => (
                      <div key={u.id} className="flex items-center gap-2 p-2 rounded bg-[#111] border border-[#151515]">
                        <img src={u.avatar_url || '/default-avatar.jpg'} className="w-7 h-7 rounded-full" alt="" />
                        <span className="text-sm text-white flex-1">@{u.username || u.full_name}</span>
                        <Button size="sm" onClick={() => assignAffiliation(u.id)} disabled={assigning} className="text-xs bg-[#00ff41]/20 text-[#00ff41] h-7">
                          Assign
                        </Button>
                      </div>
                    ))}
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </StealthLayout>
  );
};

export default AdminCompanies;
