
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useNativeApp } from "@/hooks/useNativeApp";
import Index from "./pages/Index";
import Explore from "./pages/Explore";
import Broadcast from "./pages/Broadcast";
import BusinessAccount from "./pages/BusinessAccount";
import Pages from "./pages/Pages";
import Shorts from "./pages/Shorts";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Messages from "./pages/Messages";
import Profile from "./pages/Profile";
import AITools from "./pages/AITools";
import CreatePost from "./pages/CreatePost";
import NotFound from "./pages/NotFound";
import QuickReply from "./pages/QuickReply";
import Withdraw from "./pages/Withdraw";
import AdminDashboard from "./pages/AdminDashboard";
import AdminLogin from "./pages/AdminLogin";
import ManageStaff from "./pages/ManageStaff";
import ManageUsers from "./pages/ManageUsers";
import ManageContent from "./pages/ManageContent";
import ManageAds from "./pages/ManageAds";
import AdminSettings from "./pages/AdminSettings";
import SecretAdminAccess from "./pages/SecretAdminAccess";
import Settings from "./pages/Settings";
import LanguageSettings from "./pages/LanguageSettings";
import BlockedAccounts from "./pages/settings/BlockedAccounts";
import PrivacySettings from "./pages/settings/PrivacySettings";
import MessagesSettings from "./pages/settings/MessagesSettings";
import MutedAccounts from "./pages/settings/MutedAccounts";
import ContentPreferences from "./pages/settings/ContentPreferences";
import ArchiveDownload from "./pages/settings/ArchiveDownload";
import AccessibilitySettings from "./pages/settings/AccessibilitySettings";
import AccountStatus from "./pages/settings/AccountStatus";
import CreatorTools from "./pages/settings/CreatorTools";
import NotificationsSettings from "./pages/settings/NotificationsSettings";
import HiddenWords from "./pages/settings/HiddenWords";
import TagsMentions from "./pages/settings/TagsMentions";
import SharingSettings from "./pages/settings/SharingSettings";
import RestrictedAccounts from "./pages/settings/RestrictedAccounts";
import StoryLocationSettings from "./pages/settings/StoryLocationSettings";
import PrivacyCenter from "./pages/settings/PrivacyCenter";
import PrivacyPolicy from "./pages/settings/PrivacyPolicy";
import DeleteAccount from "./pages/settings/DeleteAccount";
import PostSettings from "./pages/settings/PostSettings";
import ReelsSettings from "./pages/settings/ReelsSettings";
import Search from "./pages/Search";
import Followers from "./pages/Followers";
import Following from "./pages/Following";
import CreateStory from "./pages/CreateStory";
import CreateReel from "./pages/CreateReel";
import SavedPosts from "./pages/SavedPosts";
import PostView from "./pages/PostView";
import SavedContent from "./pages/SavedContent";
import LocalFameRank from "./pages/LocalFameRank";
import VerificationRequests from "./pages/VerificationRequests";
import AdminLogs from "./pages/AdminLogs";
import AdminSurveillance from "./pages/AdminSurveillance";
import NotificationsPage from "./pages/NotificationsPage";
import BottomNav from "./components/BottomNav";
import SplashScreen from "./components/SplashScreen";

const queryClient = new QueryClient();

const AppContent = () => {
  useNativeApp();
  
  return (
    <>
      <BottomNav />
      <Routes>
        <Route path="/welcome" element={<SplashScreen />} />
        <Route path="/" element={<Index />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/broadcast" element={<Broadcast />} />
        <Route path="/business" element={<BusinessAccount />} />
        <Route path="/pages" element={<Pages />} />
        <Route path="/shorts" element={<Shorts />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/:userId" element={<Profile />} />
        <Route path="/ai-tools" element={<AITools />} />
        <Route path="/create-post" element={<CreatePost />} />
        <Route path="/quick-reply" element={<QuickReply />} />
        <Route path="/withdraw" element={<Withdraw />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin-control-panel-secret" element={<SecretAdminAccess />} />
        <Route path="/admin/staff" element={<ManageStaff />} />
        <Route path="/admin/users" element={<ManageUsers />} />
        <Route path="/admin/content" element={<ManageContent />} />
        <Route path="/admin/ads" element={<ManageAds />} />
        <Route path="/admin/settings" element={<AdminSettings />} />
        <Route path="/admin/verification" element={<VerificationRequests />} />
        <Route path="/admin/logs" element={<AdminLogs />} />
        <Route path="/admin/surveillance" element={<AdminSurveillance />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/settings/language" element={<LanguageSettings />} />
        <Route path="/settings/blocked" element={<BlockedAccounts />} />
        <Route path="/settings/privacy" element={<PrivacySettings />} />
        <Route path="/settings/messages" element={<MessagesSettings />} />
        <Route path="/settings/muted" element={<MutedAccounts />} />
        <Route path="/settings/content" element={<ContentPreferences />} />
        <Route path="/settings/archive" element={<ArchiveDownload />} />
        <Route path="/settings/accessibility" element={<AccessibilitySettings />} />
        <Route path="/settings/account-status" element={<AccountStatus />} />
        <Route path="/settings/creator-tools" element={<CreatorTools />} />
        <Route path="/settings/notifications" element={<NotificationsSettings />} />
        <Route path="/settings/hidden-words" element={<HiddenWords />} />
        <Route path="/settings/tags-mentions" element={<TagsMentions />} />
        <Route path="/settings/sharing" element={<SharingSettings />} />
        <Route path="/settings/restricted" element={<RestrictedAccounts />} />
        <Route path="/settings/story-location" element={<StoryLocationSettings />} />
        <Route path="/settings/privacy-center" element={<PrivacyCenter />} />
        <Route path="/settings/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/settings/delete-account" element={<DeleteAccount />} />
        <Route path="/settings/posts" element={<PostSettings />} />
        <Route path="/settings/reels" element={<ReelsSettings />} />
        <Route path="/search" element={<Search />} />
        <Route path="/followers" element={<Followers />} />
        <Route path="/following" element={<Following />} />
        <Route path="/create-story" element={<CreateStory />} />
        <Route path="/create-reel" element={<CreateReel />} />
        <Route path="/saved-posts" element={<SavedPosts />} />
        <Route path="/post/:postId" element={<PostView />} />
        <Route path="/saved-content" element={<SavedContent />} />
        <Route path="/local-fame-rank" element={<LocalFameRank />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
