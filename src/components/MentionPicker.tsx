import { useState, useEffect } from 'react';
import { AtSign, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

interface MentionPickerProps {
  onMentionsChange: (mentions: string[]) => void;
  currentMentions?: string[];
}

export const MentionPicker = ({ onMentionsChange, currentMentions = [] }: MentionPickerProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [selectedMentions, setSelectedMentions] = useState<string[]>(currentMentions);

  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      searchUsers(searchQuery);
    } else {
      setSuggestions([]);
    }
  }, [searchQuery]);

  const searchUsers = async (query: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url')
      .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
      .limit(5);
    
    if (data) {
      setSuggestions(data);
    }
  };

  const addMention = (userId: string) => {
    if (!selectedMentions.includes(userId)) {
      const newMentions = [...selectedMentions, userId];
      setSelectedMentions(newMentions);
      onMentionsChange(newMentions);
    }
    setSearchQuery('');
    setSuggestions([]);
  };

  const removeMention = (userId: string) => {
    const newMentions = selectedMentions.filter(id => id !== userId);
    setSelectedMentions(newMentions);
    onMentionsChange(newMentions);
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          placeholder="ابحث عن مستخدمين للإشارة إليهم..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {suggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg">
            {suggestions.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => addMention(user.id)}
                className="w-full p-2 text-right hover:bg-gray-700 flex items-center gap-2"
              >
                <img
                  src={user.avatar_url || '/placeholder.svg'}
                  alt={user.username}
                  className="w-8 h-8 rounded-full"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium">{user.username}</p>
                  <p className="text-xs text-gray-400">{user.full_name}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      
      {selectedMentions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedMentions.map((userId) => (
            <Badge key={userId} variant="secondary" className="flex items-center gap-1">
              <AtSign className="w-3 h-3" />
              <span>مستخدم</span>
              <button
                type="button"
                onClick={() => removeMention(userId)}
                className="ml-1"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};