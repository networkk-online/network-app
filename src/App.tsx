
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useNativeApp } from "@/hooks/useNativeApp";
import { AnimatePresence } from "framer-motion";
import PageTransition from "./components/PageTransition";
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
import NotificationsPage from "./pages/NotificationsPage";
import BottomNav from "./components/BottomNav";
import SplashScreen from "./components/SplashScreen";

const queryClient = new QueryClient();

const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/welcome" element={<PageTransition><SplashScreen /></PageTransition>} />
        <Route path="/" element={<PageTransition><Index /></PageTransition>} />
        <Route path="/explore" element={<PageTransition><Explore /></PageTransition>} />
        <Route path="/broadcast" element={<PageTransition><Broadcast /></PageTransition>} />
        <Route path="/business" element={<PageTransition><BusinessAccount /></PageTransition>} />
        <Route path="/pages" element={<PageTransition><Pages /></PageTransition>} />
        <Route path="/shorts" element={<PageTransition><Shorts /></PageTransition>} />
        <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
        <Route path="/signup" element={<PageTransition><SignUp /></PageTransition>} />
        <Route path="/messages" element={<PageTransition><Messages /></PageTransition>} />
        <Route path="/profile" element={<PageTransition><Profile /></PageTransition>} />
        <Route path="/profile/:userId" element={<PageTransition><Profile /></PageTransition>} />
        <Route path="/ai-tools" element={<PageTransition><AITools /></PageTransition>} />
        <Route path="/create-post" element={<PageTransition><CreatePost /></PageTransition>} />
        <Route path="/quick-reply" element={<PageTransition><QuickReply /></PageTransition>} />
        <Route path="/withdraw" element={<PageTransition><Withdraw /></PageTransition>} />
        <Route path="/admin-login" element={<PageTransition><AdminLogin /></PageTransition>} />
        <Route path="/admin" element={<PageTransition><AdminDashboard /></PageTransition>} />
        <Route path="/admin-control-panel-secret" element={<PageTransition><SecretAdminAccess /></PageTransition>} />
        <Route path="/admin/staff" element={<PageTransition><ManageStaff /></PageTransition>} />
        <Route path="/admin/users" element={<PageTransition><ManageUsers /></PageTransition>} />
        <Route path="/admin/content" element={<PageTransition><ManageContent /></PageTransition>} />
        <Route path="/admin/ads" element={<PageTransition><ManageAds /></PageTransition>} />
        <Route path="/admin/settings" element={<PageTransition><AdminSettings /></PageTransition>} />
        <Route path="/admin/verification" element={<PageTransition><VerificationRequests /></PageTransition>} />
        <Route path="/settings" element={<PageTransition><Settings /></PageTransition>} />
        <Route path="/settings/language" element={<PageTransition><LanguageSettings /></PageTransition>} />
        <Route path="/settings/blocked" element={<PageTransition><BlockedAccounts /></PageTransition>} />
        <Route path="/settings/privacy" element={<PageTransition><PrivacySettings /></PageTransition>} />
        <Route path="/settings/messages" element={<PageTransition><MessagesSettings /></PageTransition>} />
        <Route path="/settings/muted" element={<PageTransition><MutedAccounts /></PageTransition>} />
        <Route path="/settings/content" element={<PageTransition><ContentPreferences /></PageTransition>} />
        <Route path="/settings/archive" element={<PageTransition><ArchiveDownload /></PageTransition>} />
        <Route path="/settings/accessibility" element={<PageTransition><AccessibilitySettings /></PageTransition>} />
        <Route path="/settings/account-status" element={<PageTransition><AccountStatus /></PageTransition>} />
        <Route path="/settings/creator-tools" element={<PageTransition><CreatorTools /></PageTransition>} />
        <Route path="/settings/notifications" element={<PageTransition><NotificationsSettings /></PageTransition>} />
        <Route path="/settings/hidden-words" element={<PageTransition><HiddenWords /></PageTransition>} />
        <Route path="/settings/tags-mentions" element={<PageTransition><TagsMentions /></PageTransition>} />
        <Route path="/settings/sharing" element={<PageTransition><SharingSettings /></PageTransition>} />
        <Route path="/settings/restricted" element={<PageTransition><RestrictedAccounts /></PageTransition>} />
        <Route path="/settings/story-location" element={<PageTransition><StoryLocationSettings /></PageTransition>} />
        <Route path="/settings/privacy-center" element={<PageTransition><PrivacyCenter /></PageTransition>} />
        <Route path="/settings/posts" element={<PageTransition><PostSettings /></PageTransition>} />
        <Route path="/settings/reels" element={<PageTransition><ReelsSettings /></PageTransition>} />
        <Route path="/search" element={<PageTransition><Search /></PageTransition>} />
        <Route path="/followers" element={<PageTransition><Followers /></PageTransition>} />
        <Route path="/following" element={<PageTransition><Following /></PageTransition>} />
        <Route path="/create-story" element={<PageTransition><CreateStory /></PageTransition>} />
        <Route path="/create-reel" element={<PageTransition><CreateReel /></PageTransition>} />
        <Route path="/saved-posts" element={<PageTransition><SavedPosts /></PageTransition>} />
        <Route path="/post/:postId" element={<PageTransition><PostView /></PageTransition>} />
        <Route path="/saved-content" element={<PageTransition><SavedContent /></PageTransition>} />
        <Route path="/local-fame-rank" element={<PageTransition><LocalFameRank /></PageTransition>} />
        <Route path="/notifications" element={<PageTransition><NotificationsPage /></PageTransition>} />
        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
};

const AppContent = () => {
  // Initialize native app features
  useNativeApp();
  
  return (
    <>
      <BottomNav />
      <AnimatedRoutes />
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
