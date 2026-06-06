import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Briefcase, Plus, Trash2, Save } from 'lucide-react';

interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  employment_type: string;
  description: string;
  requirements: string;
  is_open: boolean;
}

const empty: Omit<Job, 'id'> = {
  title: '', department: '', location: 'Remote', employment_type: 'Full-time',
  description: '', requirements: '', is_open: true,
};

const VaultCareersManager = () => {
  const { toast } = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [edit, setEdit] = useState<Partial<Job> | null>(null);

  const load = async () => {
    const { data } = await supabase.from('careers_jobs').select('*').order('posted_at', { ascending: false });
    setJobs((data || []) as any);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!edit?.title) return toast({ title: 'Title required', variant: 'destructive' });
    const payload = { ...empty, ...edit };
    const { error } = edit.id
      ? await supabase.from('careers_jobs').update(payload).eq('id', edit.id)
      : await supabase.from('careers_jobs').insert([payload]);
    if (error) toast({ title: 'Save failed', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Saved' }); setEdit(null); load(); }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this job?')) return;
    await supabase.from('careers_jobs').delete().eq('id', id);
    load();
  };

  const toggleOpen = async (j: Job) => {
    await supabase.from('careers_jobs').update({ is_open: !j.is_open }).eq('id', j.id);
    load();
  };

  return (
    <div className="space-y-4">
      <Card className="bg-[#0d0d0d]/80 border-white/5">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-[#00e676] text-sm flex items-center gap-2"><Briefcase className="h-4 w-4" /> Careers Manager</CardTitle>
          <Button onClick={() => setEdit({ ...empty })} className="bg-[#00e676] hover:bg-[#00e676]/90 text-black"><Plus className="h-4 w-4 mr-1" /> New Job</Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {jobs.length === 0 && <p className="text-white/30 text-sm py-6 text-center">No jobs posted yet.</p>}
          {jobs.map(j => (
            <div key={j.id} className="flex items-center gap-3 p-3 rounded-lg bg-black/30 border border-white/5">
              <div className="flex-1 cursor-pointer" onClick={() => setEdit(j)}>
                <div className="text-white text-sm font-medium">{j.title}</div>
                <div className="text-[10px] text-white/40">{j.department} • {j.location} • {j.employment_type}</div>
              </div>
              <Switch checked={j.is_open} onCheckedChange={() => toggleOpen(j)} />
              <Button size="sm" variant="ghost" onClick={() => remove(j.id)} className="text-red-400"><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {edit && (
        <Card className="bg-[#0d0d0d]/80 border-[#00e676]/30">
          <CardHeader><CardTitle className="text-[#00e676] text-sm">{edit.id ? 'Edit Job' : 'New Job'}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Title" value={edit.title || ''} onChange={e => setEdit({ ...edit, title: e.target.value })} className="bg-black/40 border-white/10" />
            <div className="grid grid-cols-3 gap-2">
              <Input placeholder="Department" value={edit.department || ''} onChange={e => setEdit({ ...edit, department: e.target.value })} className="bg-black/40 border-white/10" />
              <Input placeholder="Location" value={edit.location || ''} onChange={e => setEdit({ ...edit, location: e.target.value })} className="bg-black/40 border-white/10" />
              <Input placeholder="Type" value={edit.employment_type || ''} onChange={e => setEdit({ ...edit, employment_type: e.target.value })} className="bg-black/40 border-white/10" />
            </div>
            <Textarea placeholder="Description" value={edit.description || ''} onChange={e => setEdit({ ...edit, description: e.target.value })} rows={6} className="bg-black/40 border-white/10" />
            <Textarea placeholder="Requirements" value={edit.requirements || ''} onChange={e => setEdit({ ...edit, requirements: e.target.value })} rows={4} className="bg-black/40 border-white/10" />
            <div className="flex gap-2">
              <Button onClick={save} className="bg-[#00e676] hover:bg-[#00e676]/90 text-black"><Save className="h-4 w-4 mr-2" /> Save</Button>
              <Button variant="ghost" onClick={() => setEdit(null)} className="text-white/60">Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VaultCareersManager;
