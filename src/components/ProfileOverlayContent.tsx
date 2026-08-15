import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import UserProfile from '@/components/UserProfile';
import { Skeleton } from '@/components/ui/skeleton';
import { displayedFollowers } from '@/lib/followerDisplay';

interface ProfileOverlayContentProps {
  profileId: string;
  currentUserId?: string;
}

const ProfileOverlayContent = ({ profileId, currentUserId }: ProfileOverlayContentProps) => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [postCount, setPostCount] = useState(0);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      const [{ data: profileData }, { count }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', profileId).single(),
        supabase.from('posts').select('*', { count: 'exact', head: true }).eq('user_id', profileId),
      ]);
      setProfile(profileData);
      setPostCount(count || 0);
      setLoading(false);
    };
    fetchProfile();
  }, [profileId]);

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-16 w-16 rounded-full mx-auto" />
        <Skeleton className="h-4 w-32 mx-auto" />
        <Skeleton className="h-4 w-48 mx-auto" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <UserProfile
      username={profile.username || ''}
      displayName={profile.full_name || profile.username || ''}
      avatar={profile.avatar_url || '/default-avatar.jpg'}
      followers={displayedFollowers(profile)}
      following={profile.following_count || 0}
      posts={postCount}
      bio={profile.bio || ''}
      isOwnProfile={currentUserId === profileId}
      profileId={profileId}
      coverImage={profile.cover_url}
      joinedDate={profile.created_at}
      birthDate={profile.birth_date}
      location={profile.location}
      school={profile.school}
      profession={profile.profession}
      gender={profile.gender}
      isVerified={profile.is_verified || false}
      website={profile.website}
      socialLinks={profile.social_links as any || {}}
    />
  );
};

export default ProfileOverlayContent;
