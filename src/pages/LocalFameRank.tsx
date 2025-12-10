import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Crown, MapPin, School, Briefcase, Users } from "lucide-react";
import { toast } from "sonner";
import { FollowButton } from "@/components/FollowButton";
import Header from "@/components/Header";
import { VerifiedBadge } from "@/components/VerifiedBadge";

interface RankedUser {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  fame_score: number;
  followers_count: number;
  location?: string;
  school?: string;
  profession?: string;
  gender?: string;
  is_verified?: boolean;
}

const LocalFameRank = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [allRankings, setAllRankings] = useState<RankedUser[]>([]);
  const [locationRankings, setLocationRankings] = useState<RankedUser[]>([]);
  const [schoolRankings, setSchoolRankings] = useState<RankedUser[]>([]);
  const [professionRankings, setProfessionRankings] = useState<RankedUser[]>([]);
  const [maleRankings, setMaleRankings] = useState<RankedUser[]>([]);
  const [femaleRankings, setFemaleRankings] = useState<RankedUser[]>([]);

  useEffect(() => {
    loadRankings();
    
    // Refresh rankings every hour
    const interval = setInterval(() => {
      loadRankings();
    }, 60 * 60 * 1000); // 60 minutes
    
    return () => clearInterval(interval);
  }, []);

  const loadRankings = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        setCurrentUser(profile);
      }

      // Load all rankings
      const { data: all, error: allError } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url, fame_score, followers_count, location, school, profession, gender, is_verified")
        .order("fame_score", { ascending: false })
        .limit(50);

      if (allError) throw allError;
      setAllRankings(all || []);

      // Load location-based rankings
      if (currentUser?.location) {
        const { data: location } = await supabase
          .from("profiles")
          .select("id, username, full_name, avatar_url, fame_score, followers_count, location, school, profession, gender, is_verified")
          .eq("location", currentUser.location)
          .order("fame_score", { ascending: false })
          .limit(20);
        setLocationRankings(location || []);
      }

      // Load school-based rankings
      if (currentUser?.school) {
        const { data: school } = await supabase
          .from("profiles")
          .select("id, username, full_name, avatar_url, fame_score, followers_count, location, school, profession, gender")
          .eq("school", currentUser.school)
          .order("fame_score", { ascending: false })
          .limit(20);
        setSchoolRankings(school || []);
      }

      // Load profession-based rankings
      if (currentUser?.profession) {
        const { data: profession } = await supabase
          .from("profiles")
          .select("id, username, full_name, avatar_url, fame_score, followers_count, location, school, profession, gender")
          .eq("profession", currentUser.profession)
          .order("fame_score", { ascending: false })
          .limit(20);
        setProfessionRankings(profession || []);
      }

      // Load male rankings
      const { data: male } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url, fame_score, followers_count, location, school, profession, gender")
        .eq("gender", "male")
        .order("fame_score", { ascending: false })
        .limit(20);
      setMaleRankings(male || []);

      // Load female rankings
      const { data: female } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url, fame_score, followers_count, location, school, profession, gender")
        .eq("gender", "female")
        .order("fame_score", { ascending: false })
        .limit(20);
      setFemaleRankings(female || []);

    } catch (error: any) {
      console.error("Error loading rankings:", error);
      toast.error("فشل تحميل التصنيفات");
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="w-6 h-6 text-yellow-500" />;
    if (index === 1) return <Crown className="w-5 h-5 text-gray-400" />;
    if (index === 2) return <Crown className="w-5 h-5 text-amber-700" />;
    return <span className="text-muted-foreground">#{index + 1}</span>;
  };

  const RankingCard = ({ user, index }: { user: RankedUser; index: number }) => (
    <Card 
      className="mb-3 hover:shadow-lg transition-all cursor-pointer"
      onClick={() => navigate(`/profile/${user.id}`)}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 flex justify-center">
              {getRankIcon(index)}
            </div>
            <Avatar className="w-12 h-12">
              <AvatarImage src={user.avatar_url} />
              <AvatarFallback>{user.username?.[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-1">
                <h3 className="font-semibold text-foreground">{user.full_name || user.username}</h3>
                {user.is_verified && <VerifiedBadge size="sm" />}
              </div>
              <p className="text-sm text-muted-foreground">@{user.username}</p>
            </div>
          </div>
          <div className="text-right">
            <Badge variant="secondary" className="mb-1">
              {user.fame_score.toLocaleString()} نقطة
            </Badge>
            <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
              <Users className="w-3 h-3" />
              {user.followers_count} متابع
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20 pb-24">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">🏆 ترتيب المشاهير المحليين</h1>
            <p className="text-muted-foreground">يتم التحديث كل ساعة • آخر تحديث: {new Date().toLocaleTimeString("ar-SA")}</p>
          </div>

          <div className="space-y-6">
            {/* أشهر المستخدمين */}
            <Card className="border-yellow-500/20 bg-gradient-to-br from-yellow-500/5 to-transparent">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-yellow-500" />
                  <span className="bg-gradient-to-r from-yellow-500 to-yellow-600 bg-clip-text text-transparent">
                    أشهر المستخدمين
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {allRankings.map((user, index) => (
                  <RankingCard key={user.id} user={user} index={index} />
                ))}
              </CardContent>
            </Card>

            {/* أشهر الأشخاص في منطقتك */}
            {currentUser?.location && (
              <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-blue-500" />
                    <span className="bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">
                      أشهر الأشخاص في {currentUser?.location}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {locationRankings.length > 0 ? (
                    locationRankings.map((user, index) => (
                      <RankingCard key={user.id} user={user} index={index} />
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      لا توجد نتائج من منطقتك حالياً
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* أشهر الأشخاص في مدرستك */}
            {currentUser?.school && (
              <Card className="border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <School className="w-5 h-5 text-green-500" />
                    <span className="bg-gradient-to-r from-green-500 to-green-600 bg-clip-text text-transparent">
                      أشهر الأشخاص في {currentUser?.school}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {schoolRankings.length > 0 ? (
                    schoolRankings.map((user, index) => (
                      <RankingCard key={user.id} user={user} index={index} />
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      لا توجد نتائج من مدرستك حالياً
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* أشهر الأشخاص في مهنتك */}
            {currentUser?.profession && (
              <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-purple-500" />
                    <span className="bg-gradient-to-r from-purple-500 to-purple-600 bg-clip-text text-transparent">
                      أشهر الأشخاص في {currentUser?.profession}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {professionRankings.length > 0 ? (
                    professionRankings.map((user, index) => (
                      <RankingCard key={user.id} user={user} index={index} />
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      لا توجد نتائج من مهنتك حالياً
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* أشهر الأولاد */}
            <Card className="border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-transparent">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-cyan-500" />
                  <span className="bg-gradient-to-r from-cyan-500 to-cyan-600 bg-clip-text text-transparent">
                    أشهر الأولاد
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {maleRankings.length > 0 ? (
                  maleRankings.map((user, index) => (
                    <RankingCard key={user.id} user={user} index={index} />
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    لا توجد نتائج حالياً
                  </p>
                )}
              </CardContent>
            </Card>

            {/* أشهر البنات */}
            <Card className="border-pink-500/20 bg-gradient-to-br from-pink-500/5 to-transparent">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-pink-500" />
                  <span className="bg-gradient-to-r from-pink-500 to-pink-600 bg-clip-text text-transparent">
                    أشهر البنات
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {femaleRankings.length > 0 ? (
                  femaleRankings.map((user, index) => (
                    <RankingCard key={user.id} user={user} index={index} />
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    لا توجد نتائج حالياً
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LocalFameRank;
