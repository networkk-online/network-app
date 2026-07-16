import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { lazy, Suspense } from "react";
import { useNativeApp } from "@/hooks/useNativeApp";
import useFinanceNotifications from "@/hooks/useFinanceNotifications";
import { ChimeCallProvider } from "@/components/ChimeCallProvider";
import { AgoraCallProvider } from "@/components/calls/AgoraCallProvider";
import ErrorBoundary from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import Explore from "./pages/Explore";
const Broadcast = lazy(() => import("./pages/Broadcast"));
import BusinessAccount from "./pages/BusinessAccount";
import BusinessAffiliates from "./pages/BusinessAffiliates";
import Pages from "./pages/Pages";
const Shorts = lazy(() => import("./pages/Shorts"));
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import VerifyOtp from "./pages/VerifyOtp";
import Messages from "./pages/Messages";
import NetworkkAssistant from "./pages/NetworkkAssistant";
import Profile from "./pages/Profile";
import AITools from "./pages/AITools";
import CreatePost from "./pages/CreatePost";
import NotFound from "./pages/NotFound";
import AddFunds from "./pages/AddFunds";
import About from "./pages/About";
import QuickReply from "./pages/QuickReply";
import Withdraw from "./pages/Withdraw";
import AdminDashboard from "./pages/AdminDashboard";
import AdminLogin from "./pages/AdminLogin";
import ManageStaff from "./pages/ManageStaff";
import ManageUsers from "./pages/ManageUsers";
import EliteUserDirectory from "./pages/EliteUserDirectory";
import ManageContent from "./pages/ManageContent";
import ManageAds from "./pages/ManageAds";
import AdsStudio from "./pages/AdsStudio";
import AdminSettings from "./pages/AdminSettings";
import SecretAdminAccess from "./pages/SecretAdminAccess";
import Settings from "./pages/Settings";
import FamilySupervision from "./pages/FamilySupervision";
import LanguageSettings from "./pages/LanguageSettings";
import BlockedAccounts from "./pages/settings/BlockedAccounts";
import PrivacySettings from "./pages/settings/PrivacySettings";
import MessagesSettings from "./pages/settings/MessagesSettings";
import MutedAccounts from "./pages/settings/MutedAccounts";
import ContentPreferences from "./pages/settings/ContentPreferences";
import ArchiveDownload from "./pages/settings/ArchiveDownload";
import AccessibilitySettings from "./pages/settings/AccessibilitySettings";
import AccountStatus from "./pages/settings/AccountStatus";
import RequestVerification from "./pages/settings/RequestVerification";
import AccountCenter from "./pages/settings/AccountCenter";
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
import CallSettings from "./pages/settings/CallSettings";
import MessagePrivacySettings from "./pages/settings/MessagePrivacySettings";
import Search from "./pages/Search";
import Followers from "./pages/Followers";
import Following from "./pages/Following";
import CreateStory from "./pages/CreateStory";
const CreateReel = lazy(() => import("./pages/CreateReel"));
import SavedPosts from "./pages/SavedPosts";
import PostView from "./pages/PostView";
import ExploreFeed from "./pages/ExploreFeed";
import SavedContent from "./pages/SavedContent";
import LocalFameRank from "./pages/LocalFameRank";
import VerificationRequests from "./pages/VerificationRequests";
import AdminLogs from "./pages/AdminLogs";
import AdminSurveillance from "./pages/AdminSurveillance";
import NotificationsPage from "./pages/NotificationsPage";
import CallHistory from "./pages/CallHistory";
import StealthLogin from "./pages/StealthLogin";
import StealthDashboard from "./pages/StealthDashboard";
import StealthTeam from "./pages/stealth/StealthTeam";
import StealthUsers from "./pages/stealth/StealthUsers";
import StealthContent from "./pages/stealth/StealthContent";
import StealthNotifications from "./pages/stealth/StealthNotifications";
import StealthVerification from "./pages/stealth/StealthVerification";
import StealthWheel from "./pages/stealth/StealthWheel";
import RewardsWheel from "./pages/RewardsWheel";
import RedeemGiftCard from "./pages/RedeemGiftCard";
import AdminGiftCodes from "./pages/AdminGiftCodes";
import CoinStore from "./pages/CoinStore";
import TransactionHistory from "./pages/TransactionHistory";
import Recharge from "./pages/Recharge";
import NetworkTV from "./pages/NetworkTV";
const VideoPlayer = lazy(() => import("./pages/VideoPlayer"));
const CreatorStudio = lazy(() => import("./pages/CreatorStudio"));
import AdminDeposits from "./pages/AdminDeposits";
import AdminCompanies from "./pages/AdminCompanies";
import Tweets from "./pages/Tweets";
import SecureAdminPanel from "./pages/SecureAdminPanel";
import ControlPanel from "./pages/ControlPanel";
import AdminControl from "./pages/AdminControl";
import AdminFinance from "./pages/AdminFinance";
const OwnerVault = lazy(() => import("./pages/OwnerVault"));
import ModeratorPortal from "./pages/ModeratorPortal";
import StaffLogin from "./pages/StaffLogin";
import MasterAdmin from "./pages/MasterAdmin";
const MasterControlDashboard = lazy(() => import("./pages/MasterControlDashboard"));
import Careers from "./pages/public/Careers";
import Matches from "./pages/Matches";
import MatchDetails from "./pages/MatchDetails";
import SupportCenter from "./pages/public/SupportCenter";
import DynamicPage from "./components/public/DynamicPage";
import BottomNav from "./components/BottomNav";
import SplashScreen from "./components/SplashScreen";
import IntroSplash from "./components/IntroSplash";
import FloatingAdminButton from "./components/FloatingAdminButton";
import InstallPWAButton from "./components/InstallPWAButton";
// ... keep existing code
import MaintenanceGuard from "./components/MaintenanceGuard";
import AdminRouteBlocker from "./components/guards/AdminRouteBlocker";

const queryClient = new QueryClient();

import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";

const AppContent = () => {
  const location = useLocation();
  useNativeApp();
  useFinanceNotifications();
  useRealtimeNotifications();

  const hideNavbarPaths = ['/add-funds', '/withdraw', '/recharge'];
  const shouldHideNavbar = hideNavbarPaths.includes(location.pathname);

  return (
    <>
      <AdminRouteBlocker />
      {!shouldHideNavbar && <BottomNav />}
      <FloatingAdminButton />
      <InstallPWAButton />
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
      <Routes>
        <Route path="/welcome" element={<SplashScreen />} />
        <Route path="/" element={<Index />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/explore/feed/:postId" element={<ExploreFeed />} />
        <Route path="/broadcast" element={<Broadcast />} />
        <Route path="/business" element={<BusinessAccount />} />
        <Route path="/business/:companyId/affiliates" element={<BusinessAffiliates />} />
        <Route path="/pages" element={<Pages />} />
        <Route path="/shorts" element={<Shorts />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/networkk-assistant" element={<NetworkkAssistant />} />
        <Route path="/chat/assistant" element={<NetworkkAssistant />} />
        <Route path="/chat/:id" element={<NetworkkAssistant />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/:userId" element={<Profile />} />
        <Route path="/ai-tools" element={<AITools />} />
        <Route path="/create-post" element={<CreatePost />} />
        <Route path="/quick-reply" element={<QuickReply />} />
        <Route path="/withdraw" element={<Withdraw />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/admin" element={<SecureAdminPanel />} />
        <Route path="/control-panel" element={<ControlPanel />} />
        <Route path="/admin-control-panel-secret" element={<SecretAdminAccess />} />
        <Route path="/admin/staff" element={<ManageStaff />} />
        <Route path="/admin/users" element={<EliteUserDirectory />} />
        <Route path="/admin/users-legacy" element={<ManageUsers />} />
        <Route path="/admin/content" element={<ManageContent />} />
        <Route path="/admin/ads" element={<ManageAds />} />
        <Route path="/ads" element={<AdsStudio />} />
        <Route path="/manage-ads" element={<AdsStudio />} />
        <Route path="/admin/settings" element={<AdminSettings />} />
        <Route path="/admin/verification" element={<VerificationRequests />} />
        <Route path="/admin/logs" element={<AdminLogs />} />
        <Route path="/admin/surveillance" element={<AdminSurveillance />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/settings/family" element={<FamilySupervision />} />
        <Route path="/family" element={<FamilySupervision />} />
        <Route path="/settings/language" element={<LanguageSettings />} />
        <Route path="/settings/blocked" element={<BlockedAccounts />} />
        <Route path="/settings/privacy" element={<PrivacySettings />} />
        <Route path="/settings/messages" element={<MessagesSettings />} />
        <Route path="/settings/muted" element={<MutedAccounts />} />
        <Route path="/settings/content" element={<ContentPreferences />} />
        <Route path="/settings/archive" element={<ArchiveDownload />} />
        <Route path="/settings/accessibility" element={<AccessibilitySettings />} />
        <Route path="/settings/account-status" element={<AccountStatus />} />
        <Route path="/settings/verification-request" element={<RequestVerification />} />
        <Route path="/settings/account-center" element={<AccountCenter />} />
        <Route path="/account-center" element={<AccountCenter />} />
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
        <Route path="/settings/calls" element={<CallSettings />} />
        <Route path="/settings/message-privacy" element={<MessagePrivacySettings />} />
        <Route path="/call-history" element={<CallHistory />} />
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
        <Route path="/system-access" element={<StealthLogin />} />
        <Route path="/system-panel" element={<StealthDashboard />} />
        <Route path="/system-panel/team" element={<StealthTeam />} />
        <Route path="/system-panel/users" element={<StealthUsers />} />
        <Route path="/system-panel/content" element={<StealthContent />} />
        <Route path="/system-panel/notifications" element={<StealthNotifications />} />
        <Route path="/system-panel/verification" element={<StealthVerification />} />
        <Route path="/system-panel/deposits" element={<AdminDeposits />} />
        <Route path="/system-panel/companies" element={<AdminCompanies />} />
        <Route path="/system-panel/wheel" element={<StealthWheel />} />
        <Route path="/rewards-wheel" element={<RewardsWheel />} />
        <Route path="/redeem" element={<RedeemGiftCard />} />
        <Route path="/admin/gift-codes" element={<NotFound />} />
        <Route path="/store" element={<CoinStore />} />
        <Route path="/transactions" element={<TransactionHistory />} />
        <Route path="/recharge" element={<Recharge />} />
        <Route path="/add-funds" element={<AddFunds />} />
        <Route path="/about" element={<About />} />
        <Route path="/network-tv" element={<NetworkTV />} />
        <Route path="/watch/:videoId" element={<VideoPlayer />} />
        <Route path="/creator-studio" element={<CreatorStudio />} />
        <Route path="/tweets" element={<Tweets />} />
        <Route path="/admin-control" element={<AdminControl />} />
        <Route path="/admin-networkk-online" element={<NotFound />} />
        <Route path="/secure-system-admin-panel" element={<SecureAdminPanel />} />
        <Route path="/system-control-secret-key" element={<SecureAdminPanel />} />
        <Route path="/G3142-AF26-0x99" element={<OwnerVault />} />
        <Route path="/staff-portal" element={<ModeratorPortal />} />
        <Route path="/staff-login" element={<StaffLogin />} />
        <Route path="/master-control" element={<MasterControlDashboard />} />
        <Route path="/master-admin-legacy" element={<MasterAdmin />} />
        <Route path="/matches" element={<Matches />} />
        <Route path="/matches/:matchId" element={<MatchDetails />} />
        {/* Public footer pages (admin-editable) */}
        <Route path="/careers" element={<Careers />} />
        <Route path="/help" element={<SupportCenter />} />
        <Route path="/platform-status" element={<DynamicPage slug="platform-status" />} />
        <Route path="/accessibility" element={<DynamicPage slug="accessibility" />} />
        <Route path="/download" element={<DynamicPage slug="download" />} />
        <Route path="/newsroom" element={<DynamicPage slug="newsroom" />} />
        <Route path="/investors" element={<DynamicPage slug="investors" />} />
        <Route path="/using-networkk" element={<DynamicPage slug="using-networkk" />} />
        <Route path="/manage-account" element={<DynamicPage slug="manage-account" />} />
        <Route path="/terms" element={<DynamicPage slug="terms" />} />
        <Route path="/contact" element={<DynamicPage slug="contact" />} />
        <Route path="/developers" element={<DynamicPage slug="developers" />} />
        <Route path="/docs" element={<DynamicPage slug="docs" />} />
        <Route path="/engineering-blog" element={<DynamicPage slug="engineering-blog" />} />
        <Route path="/advertising" element={<DynamicPage slug="advertising" />} />
        <Route path="/resources" element={<DynamicPage slug="resources" />} />
        <Route path="/p/:slug" element={<DynamicPage slug="" />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      </Suspense>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <IntroSplash />
        <ErrorBoundary>
          <MaintenanceGuard>
            <ChimeCallProvider>
              <AgoraCallProvider>
                <AppContent />
              </AgoraCallProvider>
            </ChimeCallProvider>
          </MaintenanceGuard>
        </ErrorBoundary>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
