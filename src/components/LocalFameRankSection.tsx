import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Crown, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VerifiedBadge } from "@/components/VerifiedBadge";

interface RankedUser {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  fame_score: number;
  followers_count: number;
  is_verified?: boolean;
}

const LocalFameRankSection = () => {
  const navigate = useNavigate();
  const [topUsers, setTopUsers] = useState<RankedUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTopUsers();
  }, []);

  const loadTopUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url, fame_score, followers_count, is_verified")
        .order("fame_score", { ascending: false })
        .limit(5);

      if (error) throw error;
      setTopUsers(data || []);
    } catch (error) {
      console.error("Error loading top users:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="w-5 h-5 text-yellow-500" />;
    if (index === 1) return <Crown className="w-4 h-4 text-gray-400" />;
    if (index === 2) return <Crown className="w-4 h-4 text-amber-700" />;
    return <span className="text-muted-foreground text-sm">#{index + 1}</span>;
  };

  if (loading) return null;

  return (
    <Card className="border-yellow-500/20 bg-gradient-to-br from-yellow-500/5 to-transparent">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2">
          <Crown className="w-5 h-5 text-yellow-500" />
          <span className="bg-gradient-to-r from-yellow-500 to-yellow-600 bg-clip-text text-transparent">
            🏆 ترتيب المشاهير المحليين
          </span>
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/local-fame-rank")}
          className="text-yellow-500 hover:text-yellow-600"
        >
          المزيد
          <ChevronLeft className="w-4 h-4 mr-1" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {topUsers.map((user, index) => (
          <div
            key={user.id}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
            onClick={() => navigate(`/profile/${user.id}`)}
          >
            <div className="w-8 flex justify-center">
              {getRankIcon(index)}
            </div>
            <Avatar className="w-10 h-10">
              <AvatarImage src={user.avatar_url} />
              <AvatarFallback>{user.username?.[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <p className="font-semibold text-sm truncate">{user.full_name || user.username}</p>
                {user.is_verified && <VerifiedBadge size="sm" />}
              </div>
              <p className="text-xs text-muted-foreground">@{user.username}</p>
            </div>
            <div className="text-left">
              <Badge variant="secondary" className="text-xs">
                {(user.fame_score ?? 0).toLocaleString()}
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default LocalFameRankSection;
