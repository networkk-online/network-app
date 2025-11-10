import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";

interface Ad {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  link_url: string | null;
  placement: string;
}

interface AdvertisementProps {
  placement: "feed" | "stories" | "sidebar" | "reels";
  className?: string;
}

export default function Advertisement({ placement, className = "" }: AdvertisementProps) {
  const [ad, setAd] = useState<Ad | null>(null);
  const [hasViewed, setHasViewed] = useState(false);

  useEffect(() => {
    loadAd();
  }, [placement]);

  useEffect(() => {
    if (ad && !hasViewed) {
      recordView();
      setHasViewed(true);
    }
  }, [ad]);

  const loadAd = async () => {
    try {
      const { data, error } = await supabase
        .from("advertisements")
        .select("*")
        .eq("placement", placement)
        .eq("is_active", true)
        .lte("start_date", new Date().toISOString())
        .gte("end_date", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error loading ad:", error);
        return;
      }

      if (data) {
        setAd(data);
      }
    } catch (error) {
      console.error("Error loading ad:", error);
    }
  };

  const recordView = async () => {
    if (!ad) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase
        .from("ad_interactions")
        .insert({
          ad_id: ad.id,
          user_id: user?.id || null,
          interaction_type: "view",
        });
    } catch (error) {
      console.error("Error recording view:", error);
    }
  };

  const recordClick = async () => {
    if (!ad) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase
        .from("ad_interactions")
        .insert({
          ad_id: ad.id,
          user_id: user?.id || null,
          interaction_type: "click",
        });

      if (ad.link_url) {
        window.open(ad.link_url, "_blank");
      }
    } catch (error) {
      console.error("Error recording click:", error);
    }
  };

  if (!ad) return null;

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardContent className="p-0">
        <div
          className="relative group cursor-pointer"
          onClick={recordClick}
        >
          <img
            src={ad.image_url}
            alt={ad.title}
            className="w-full h-auto object-cover"
          />
          
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="text-center text-white p-4">
              <h3 className="text-lg font-bold mb-1">{ad.title}</h3>
              {ad.description && (
                <p className="text-sm mb-2">{ad.description}</p>
              )}
              {ad.link_url && (
                <div className="flex items-center justify-center gap-1 text-xs">
                  <ExternalLink className="h-3 w-3" />
                  <span>انقر للمزيد</span>
                </div>
              )}
            </div>
          </div>

          <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
            إعلان
          </div>
        </div>
      </CardContent>
    </Card>
  );
}