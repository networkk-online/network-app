
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
        {/* Welcome & Auth - Zoom */}
        <Route path="/welcome" element={<PageTransition type="zoom"><SplashScreen /></PageTransition>} />
        <Route path="/login" element={<PageTransition type="zoom"><Login /></PageTransition>} />
        <Route path="/signup" element={<PageTransition type="zoom"><SignUp /></PageTransition>} />
        
        {/* Main Pages - Fade */}
        <Route path="/" element={<PageTransition type="fade"><Index /></PageTransition>} />
        <Route path="/explore" element={<PageTransition type="fade"><Explore /></PageTransition>} />
        <Route path="/shorts" element={<PageTransition type="fade"><Shorts /></PageTransition>} />
        <Route path="/search" element={<PageTransition type="fade"><Search /></PageTransition>} />
        
        {/* Profile & Social - Scale */}
        <Route path="/profile" element={<PageTransition type="scale"><Profile /></PageTransition>} />
        <Route path="/profile/:userId" element={<PageTransition type="scale"><Profile /></PageTransition>} />
        <Route path="/followers" element={<PageTransition type="scale"><Followers /></PageTransition>} />
        <Route path="/following" element={<PageTransition type="scale"><Following /></PageTransition>} />
        
        {/* Content Creation - Slide Up */}
        <Route path="/create-post" element={<PageTransition type="slide-up"><CreatePost /></PageTransition>} />
        <Route path="/create-story" element={<PageTransition type="slide-up"><CreateStory /></PageTransition>} />
        <Route path="/create-reel" element={<PageTransition type="slide-up"><CreateReel /></PageTransition>} />
        <Route path="/broadcast" element={<PageTransition type="slide-up"><Broadcast /></PageTransition>} />
        
        {/* Messages & Notifications - Slide Left */}
        <Route path="/messages" element={<PageTransition type="slide-left"><Messages /></PageTransition>} />
        <Route path="/notifications" element={<PageTransition type="slide-left"><NotificationsPage /></PageTransition>} />
        <Route path="/quick-reply" element={<PageTransition type="slide-left"><QuickReply /></PageTransition>} />
        
        {/* Settings - Slide Right */}
        <Route path="/settings" element={<PageTransition type="slide-right"><Settings /></PageTransition>} />
        <Route path="/settings/language" element={<PageTransition type="slide-right"><LanguageSettings /></PageTransition>} />
        <Route path="/settings/blocked" element={<PageTransition type="slide-right"><BlockedAccounts /></PageTransition>} />
        <Route path="/settings/privacy" element={<PageTransition type="slide-right"><PrivacySettings /></PageTransition>} />
        <Route path="/settings/messages" element={<PageTransition type="slide-right"><MessagesSettings /></PageTransition>} />
        <Route path="/settings/muted" element={<PageTransition type="slide-right"><MutedAccounts /></PageTransition>} />
        <Route path="/settings/content" element={<PageTransition type="slide-right"><ContentPreferences /></PageTransition>} />
        <Route path="/settings/archive" element={<PageTransition type="slide-right"><ArchiveDownload /></PageTransition>} />
        <Route path="/settings/accessibility" element={<PageTransition type="slide-right"><AccessibilitySettings /></PageTransition>} />
        <Route path="/settings/account-status" element={<PageTransition type="slide-right"><AccountStatus /></PageTransition>} />
        <Route path="/settings/creator-tools" element={<PageTransition type="slide-right"><CreatorTools /></PageTransition>} />
        <Route path="/settings/notifications" element={<PageTransition type="slide-right"><NotificationsSettings /></PageTransition>} />
        <Route path="/settings/hidden-words" element={<PageTransition type="slide-right"><HiddenWords /></PageTransition>} />
        <Route path="/settings/tags-mentions" element={<PageTransition type="slide-right"><TagsMentions /></PageTransition>} />
        <Route path="/settings/sharing" element={<PageTransition type="slide-right"><SharingSettings /></PageTransition>} />
        <Route path="/settings/restricted" element={<PageTransition type="slide-right"><RestrictedAccounts /></PageTransition>} />
        <Route path="/settings/story-location" element={<PageTransition type="slide-right"><StoryLocationSettings /></PageTransition>} />
        <Route path="/settings/privacy-center" element={<PageTransition type="slide-right"><PrivacyCenter /></PageTransition>} />
        <Route path="/settings/posts" element={<PageTransition type="slide-right"><PostSettings /></PageTransition>} />
        <Route path="/settings/reels" element={<PageTransition type="slide-right"><ReelsSettings /></PageTransition>} />
        
        {/* Business & Pages - Scale */}
        <Route path="/business" element={<PageTransition type="scale"><BusinessAccount /></PageTransition>} />
        <Route path="/pages" element={<PageTransition type="scale"><Pages /></PageTransition>} />
        
        {/* Content Views - Fade */}
        <Route path="/post/:postId" element={<PageTransition type="fade"><PostView /></PageTransition>} />
        <Route path="/saved-posts" element={<PageTransition type="fade"><SavedPosts /></PageTransition>} />
        <Route path="/saved-content" element={<PageTransition type="fade"><SavedContent /></PageTransition>} />
        <Route path="/local-fame-rank" element={<PageTransition type="fade"><LocalFameRank /></PageTransition>} />
        
        {/* Tools & Utilities - Scale */}
        <Route path="/ai-tools" element={<PageTransition type="scale"><AITools /></PageTransition>} />
        <Route path="/withdraw" element={<PageTransition type="scale"><Withdraw /></PageTransition>} />
        
        {/* Admin - Slide Left */}
        <Route path="/admin-login" element={<PageTransition type="slide-left"><AdminLogin /></PageTransition>} />
        <Route path="/admin" element={<PageTransition type="slide-left"><AdminDashboard /></PageTransition>} />
        <Route path="/admin-control-panel-secret" element={<PageTransition type="slide-left"><SecretAdminAccess /></PageTransition>} />
        <Route path="/admin/staff" element={<PageTransition type="slide-left"><ManageStaff /></PageTransition>} />
        <Route path="/admin/users" element={<PageTransition type="slide-left"><ManageUsers /></PageTransition>} />
        <Route path="/admin/content" element={<PageTransition type="slide-left"><ManageContent /></PageTransition>} />
        <Route path="/admin/ads" element={<PageTransition type="slide-left"><ManageAds /></PageTransition>} />
        <Route path="/admin/settings" element={<PageTransition type="slide-left"><AdminSettings /></PageTransition>} />
        <Route path="/admin/verification" element={<PageTransition type="slide-left"><VerificationRequests /></PageTransition>} />
        
        {/* 404 */}
        <Route path="*" element={<PageTransition type="fade"><NotFound /></PageTransition>} />
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
