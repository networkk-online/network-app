import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminHeader from "@/components/AdminHeader";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ArrowLeft, Plus, Eye, MousePointer, TrendingUp, Trash2, Edit } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface Advertisement {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  link_url: string | null;
  placement: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  views_count: number;
  clicks_count: number;
  created_at: string;
}

export default function ManageAds() {
  const navigate = useNavigate();
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<Advertisement | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image_url: "",
    link_url: "",
    placement: "feed",
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    is_active: true,
  });

  useEffect(() => {
    checkAuth();
    loadAds();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/admin/login");
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    if (!roles?.some(r => r.role === "admin")) {
      toast.error("غير مصرح لك بالوصول");
      navigate("/");
    }
  };

  const loadAds = async () => {
    try {
      const { data, error } = await supabase
        .from("advertisements")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAds(data || []);
    } catch (error) {
      console.error("Error loading ads:", error);
      toast.error("فشل في تحميل الإعلانات");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingAd) {
        const { error } = await supabase
          .from("advertisements")
          .update(formData)
          .eq("id", editingAd.id);
        
        if (error) throw error;
        toast.success("تم تحديث الإعلان بنجاح");
      } else {
        const { error } = await supabase
          .from("advertisements")
          .insert([formData]);
        
        if (error) throw error;
        toast.success("تم إضافة الإعلان بنجاح");
      }

      setIsDialogOpen(false);
      resetForm();
      loadAds();
    } catch (error) {
      console.error("Error saving ad:", error);
      toast.error("فشل في حفظ الإعلان");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الإعلان؟")) return;

    try {
      const { error } = await supabase
        .from("advertisements")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("تم حذف الإعلان");
      loadAds();
    } catch (error) {
      console.error("Error deleting ad:", error);
      toast.error("فشل في حذف الإعلان");
    }
  };

  const toggleActive = async (ad: Advertisement) => {
    try {
      const { error } = await supabase
        .from("advertisements")
        .update({ is_active: !ad.is_active })
        .eq("id", ad.id);

      if (error) throw error;
      toast.success("تم تحديث الحالة");
      loadAds();
    } catch (error) {
      console.error("Error toggling ad:", error);
      toast.error("فشل في تحديث الحالة");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      image_url: "",
      link_url: "",
      placement: "feed",
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      is_active: true,
    });
    setEditingAd(null);
  };

  const startEdit = (ad: Advertisement) => {
    setEditingAd(ad);
    setFormData({
      title: ad.title,
      description: ad.description || "",
      image_url: ad.image_url,
      link_url: ad.link_url || "",
      placement: ad.placement,
      start_date: ad.start_date.split('T')[0],
      end_date: ad.end_date.split('T')[0],
      is_active: ad.is_active,
    });
    setIsDialogOpen(true);
  };

  const getPlacementText = (placement: string) => {
    const map: Record<string, string> = {
      feed: "الصفحة الرئيسية",
      stories: "القصص",
      sidebar: "الشريط الجانبي",
      reels: "الريلز"
    };
    return map[placement] || placement;
  };

  const calculateCTR = (ad: Advertisement) => {
    if (ad.views_count === 0) return 0;
    return ((ad.clicks_count / ad.views_count) * 100).toFixed(2);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">جاري التحميل...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <AdminHeader />
      
      <main className="pt-20 pb-8">
        <div className="container-responsive mobile-padding">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">إدارة الإعلانات</h1>
            <p className="text-gray-400">إنشاء وإدارة الإعلانات داخل التطبيق</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                إعلان جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingAd ? "تعديل الإعلان" : "إضافة إعلان جديد"}</DialogTitle>
                <DialogDescription>
                  املأ البيانات لإنشاء إعلان جديد في التطبيق
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">عنوان الإعلان *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">الوصف</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="image_url">رابط الصورة *</Label>
                  <Input
                    id="image_url"
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="link_url">رابط الهدف</Label>
                  <Input
                    id="link_url"
                    type="url"
                    value={formData.link_url}
                    onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="placement">موقع العرض *</Label>
                  <Select
                    value={formData.placement}
                    onValueChange={(value) => setFormData({ ...formData, placement: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="feed">الصفحة الرئيسية</SelectItem>
                      <SelectItem value="stories">القصص</SelectItem>
                      <SelectItem value="sidebar">الشريط الجانبي</SelectItem>
                      <SelectItem value="reels">الريلز</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_date">تاريخ البداية *</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="end_date">تاريخ النهاية *</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2 space-x-reverse">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">نشط</Label>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    إلغاء
                  </Button>
                  <Button type="submit">
                    {editingAd ? "حفظ التغييرات" : "إضافة الإعلان"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">إجمالي الإعلانات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ads.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">الإعلانات النشطة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ads.filter(a => a.is_active).length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">إجمالي المشاهدات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {ads.reduce((sum, ad) => sum + ad.views_count, 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">إجمالي النقرات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {ads.reduce((sum, ad) => sum + ad.clicks_count, 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ads List */}
        <div className="grid gap-4">
          {ads.map((ad) => (
            <Card key={ad.id} className="bg-gray-900 border-gray-800">
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <img
                    src={ad.image_url}
                    alt={ad.title}
                    className="w-32 h-32 object-cover rounded-lg"
                  />
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-semibold">{ad.title}</h3>
                        <p className="text-sm text-muted-foreground">{ad.description}</p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={ad.is_active}
                          onCheckedChange={() => toggleActive(ad)}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => startEdit(ad)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(ad.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <span className="font-medium">الموقع:</span>
                        <span className="text-muted-foreground">{getPlacementText(ad.placement)}</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        <span>{ad.views_count.toLocaleString()} مشاهدة</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <MousePointer className="h-4 w-4" />
                        <span>{ad.clicks_count.toLocaleString()} نقرة</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-4 w-4" />
                        <span>CTR: {calculateCTR(ad)}%</span>
                      </div>
                    </div>

                    <div className="mt-2 text-xs text-muted-foreground">
                      من {new Date(ad.start_date).toLocaleDateString('ar-EG')} إلى {new Date(ad.end_date).toLocaleDateString('ar-EG')}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {ads.length === 0 && (
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-12 text-center">
                <p className="text-gray-400">لا توجد إعلانات حالياً</p>
              </CardContent>
            </Card>
          )}
          </div>
        </div>
      </main>
    </div>
  );
}