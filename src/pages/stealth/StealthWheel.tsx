import { useEffect, useState } from 'react';
import StealthLayout from '@/components/stealth/StealthLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Gem, Settings, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

const StealthWheel = () => {
  const [settings, setSettings] = useState<any>(null);
  const [totalPointsGiven, setTotalPointsGiven] = useState(0);
  const [totalSpins, setTotalSpins] = useState(0);
  const [recentSpins, setRecentSpins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load settings
      const { data: settingsData } = await supabase
        .from('wheel_settings')
        .select('*')
        .limit(1)
        .maybeSingle();
      setSettings(settingsData);

      // Total points given
      const { data: spinsData } = await supabase
        .from('wheel_spins')
        .select('points_won');
      
      if (spinsData) {
        setTotalSpins(spinsData.length);
        setTotalPointsGiven(spinsData.reduce((sum, s) => sum + s.points_won, 0));
      }

      // Recent spins with user info
      const { data: recent } = await supabase
        .from('wheel_spins')
        .select('id, user_id, points_won, created_at')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (recent) {
        // Fetch usernames
        const userIds = [...new Set(recent.map(s => s.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username')
          .in('id', userIds);
        
        const profileMap = new Map(profiles?.map(p => [p.id, p.username]) || []);
        setRecentSpins(recent.map(s => ({ ...s, username: profileMap.get(s.user_id) || 'Unknown' })));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const toggleGuaranteedWin = async () => {
    if (!settings) return;
    const newValue = !settings.guaranteed_win;
    const { error } = await supabase
      .from('wheel_settings')
      .update({ guaranteed_win: newValue, updated_at: new Date().toISOString() })
      .eq('id', settings.id);
    
    if (error) {
      toast.error('فشل التحديث');
    } else {
      setSettings({ ...settings, guaranteed_win: newValue });
      toast.success(newValue ? 'الفوز المضمون: مفعّل' : 'الفوز المضمون: معطّل');
    }
  };

  const toggleActive = async () => {
    if (!settings) return;
    const newValue = !settings.is_active;
    const { error } = await supabase
      .from('wheel_settings')
      .update({ is_active: newValue, updated_at: new Date().toISOString() })
      .eq('id', settings.id);
    
    if (error) {
      toast.error('فشل التحديث');
    } else {
      setSettings({ ...settings, is_active: newValue });
      toast.success(newValue ? 'العجلة: مفعّلة' : 'العجلة: معطّلة');
    }
  };

  return (
    <StealthLayout onRefresh={loadData}>
      <h1 className="text-lg font-mono text-[#00ff41] uppercase tracking-wider mb-6">
        Rewards Wheel Management
      </h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="bg-[#111] border-[#1a1a1a]">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-xs font-mono text-gray-500 uppercase tracking-wider">
              <Gem className="h-4 w-4 text-[#00ff41]" /> Total Points Given
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-mono text-[#00ff41] font-bold">
              {loading ? '—' : totalPointsGiven.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[#111] border-[#1a1a1a]">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-xs font-mono text-gray-500 uppercase tracking-wider">
              <BarChart3 className="h-4 w-4 text-[#00ff41]" /> Total Spins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-mono text-[#00ff41] font-bold">
              {loading ? '—' : totalSpins.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[#111] border-[#1a1a1a]">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-xs font-mono text-gray-500 uppercase tracking-wider">
              <Settings className="h-4 w-4 text-[#00ff41]" /> Default Prize
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-mono text-[#00ff41] font-bold">
              {loading ? '—' : `${settings?.default_prize || 10} pts`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Settings */}
      <Card className="bg-[#111] border-[#1a1a1a] mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xs font-mono text-gray-500 uppercase tracking-wider">
            <Settings className="h-4 w-4 text-[#00ff41]" /> Wheel Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2 border-b border-[#1a1a1a]">
            <div>
              <p className="text-sm font-mono text-gray-300">Guaranteed Win Mode</p>
              <p className="text-xs font-mono text-gray-600">Always lands on 10 Points</p>
            </div>
            <Switch
              checked={settings?.guaranteed_win || false}
              onCheckedChange={toggleGuaranteedWin}
            />
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-mono text-gray-300">Wheel Active</p>
              <p className="text-xs font-mono text-gray-600">Enable/disable the wheel</p>
            </div>
            <Switch
              checked={settings?.is_active || false}
              onCheckedChange={toggleActive}
            />
          </div>
        </CardContent>
      </Card>

      {/* Recent Spins */}
      <Card className="bg-[#111] border-[#1a1a1a]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xs font-mono text-gray-500 uppercase tracking-wider">
            <BarChart3 className="h-4 w-4 text-[#00ff41]" /> Recent Spins
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentSpins.length === 0 ? (
            <p className="text-center text-sm font-mono text-gray-600 py-8">No spins yet</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#1a1a1a] hover:bg-transparent">
                    <TableHead className="font-mono text-xs text-gray-500">User</TableHead>
                    <TableHead className="font-mono text-xs text-gray-500">Points</TableHead>
                    <TableHead className="font-mono text-xs text-gray-500">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentSpins.map((spin) => (
                    <TableRow key={spin.id} className="border-[#1a1a1a] hover:bg-[#151515]">
                      <TableCell className="font-mono text-xs text-gray-300">@{spin.username}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-[10px] bg-green-500/20 text-green-400 border-green-500/30">
                          +{spin.points_won}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-gray-500">
                        {new Date(spin.created_at).toLocaleString('ar-IQ')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </StealthLayout>
  );
};

export default StealthWheel;
