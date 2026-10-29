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
import { SubscriptionProvider } from "@/hooks/useSubscription";
import FeatureGate from "@/components/subscription/FeatureGate";


import ErrorBoundary from "@/components/ErrorBoundary";
import Index from "./pages/Index";
const PartnersPortal = lazy(() => import("./pages/PartnersPortal"));
const Explore = lazy(() => import("./pages/Explore"));
const Broadcast = lazy(() => import("./pages/Broadcast"));
const BusinessAccount = lazy(() => import("./pages/BusinessAccount"));
const BusinessAffiliates = lazy(() => import("./pages/BusinessAffiliates"));
const Pages = lazy(() => import("./pages/Pages"));
const Shorts = lazy(() => import("./pages/Shorts"));
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
const VerifyOtp = lazy(() => import("./pages/VerifyOtp"));
const Messages = lazy(() => import("./pages/Messages"));
const NetworkkAssistant = lazy(() => import("./pages/NetworkkAssistant"));
const Profile = lazy(() => import("./pages/Profile"));
const AITools = lazy(() => import("./pages/AITools"));
const CreatePost = lazy(() => import("./pages/CreatePost"));
import NotFound from "./pages/NotFound";
const AddFunds = lazy(() => import("./pages/AddFunds"));
const About = lazy(() => import("./pages/About"));
const QuickReply = lazy(() => import("./pages/QuickReply"));
const Withdraw = lazy(() => import("./pages/Withdraw"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const ManageStaff = lazy(() => import("./pages/ManageStaff"));
const ManageUsers = lazy(() => import("./pages/ManageUsers"));
const EliteUserDirectory = lazy(() => import("./pages/EliteUserDirectory"));
const ManageContent = lazy(() => import("./pages/ManageContent"));
const ManageAds = lazy(() => import("./pages/ManageAds"));
const AdsStudio = lazy(() => import("./pages/AdsStudio"));
const AdminSettings = lazy(() => import("./pages/AdminSettings"));
const SecretAdminAccess = lazy(() => import("./pages/SecretAdminAccess"));
const Settings = lazy(() => import("./pages/Settings"));
const FamilySupervision = lazy(() => import("./pages/FamilySupervision"));
const LanguageSettings = lazy(() => import("./pages/LanguageSettings"));
const BlockedAccounts = lazy(() => import("./pages/settings/BlockedAccounts"));
const PrivacySettings = lazy(() => import("./pages/settings/PrivacySettings"));
const MessagesSettings = lazy(() => import("./pages/settings/MessagesSettings"));
const MutedAccounts = lazy(() => import("./pages/settings/MutedAccounts"));
const ContentPreferences = lazy(() => import("./pages/settings/ContentPreferences"));
const ArchiveDownload = lazy(() => import("./pages/settings/ArchiveDownload"));
const AccessibilitySettings = lazy(() => import("./pages/settings/AccessibilitySettings"));
const AccountStatus = lazy(() => import("./pages/settings/AccountStatus"));
const RequestVerification = lazy(() => import("./pages/settings/RequestVerification"));
const AccountCenter = lazy(() => import("./pages/settings/AccountCenter"));
const CreatorTools = lazy(() => import("./pages/settings/CreatorTools"));
const NotificationsSettings = lazy(() => import("./pages/settings/NotificationsSettings"));
const HiddenWords = lazy(() => import("./pages/settings/HiddenWords"));
const TagsMentions = lazy(() => import("./pages/settings/TagsMentions"));
const SharingSettings = lazy(() => import("./pages/settings/SharingSettings"));
const RestrictedAccounts = lazy(() => import("./pages/settings/RestrictedAccounts"));
const StoryLocationSettings = lazy(() => import("./pages/settings/StoryLocationSettings"));
const PrivacyCenter = lazy(() => import("./pages/settings/PrivacyCenter"));
const PrivacyPolicy = lazy(() => import("./pages/settings/PrivacyPolicy"));
const DeleteAccount = lazy(() => import("./pages/settings/DeleteAccount"));
const PostSettings = lazy(() => import("./pages/settings/PostSettings"));
const ReelsSettings = lazy(() => import("./pages/settings/ReelsSettings"));
const CallSettings = lazy(() => import("./pages/settings/CallSettings"));
const MessagePrivacySettings = lazy(() => import("./pages/settings/MessagePrivacySettings"));
const Search = lazy(() => import("./pages/Search"));
const Followers = lazy(() => import("./pages/Followers"));
const Following = lazy(() => import("./pages/Following"));
const CreateStory = lazy(() => import("./pages/CreateStory"));
const CreateReel = lazy(() => import("./pages/CreateReel"));
const SavedPosts = lazy(() => import("./pages/SavedPosts"));
const PostView = lazy(() => import("./pages/PostView"));
const ExploreFeed = lazy(() => import("./pages/ExploreFeed"));
const SavedContent = lazy(() => import("./pages/SavedContent"));
const LocalFameRank = lazy(() => import("./pages/LocalFameRank"));
const VerificationRequests = lazy(() => import("./pages/VerificationRequests"));
const AdminLogs = lazy(() => import("./pages/AdminLogs"));
const AdminSurveillance = lazy(() => import("./pages/AdminSurveillance"));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage"));
const CallHistory = lazy(() => import("./pages/CallHistory"));
const StealthLogin = lazy(() => import("./pages/StealthLogin"));
const StealthDashboard = lazy(() => import("./pages/StealthDashboard"));
const StealthTeam = lazy(() => import("./pages/stealth/StealthTeam"));
const StealthUsers = lazy(() => import("./pages/stealth/StealthUsers"));
const StealthContent = lazy(() => import("./pages/stealth/StealthContent"));
const StealthNotifications = lazy(() => import("./pages/stealth/StealthNotifications"));
const StealthVerification = lazy(() => import("./pages/stealth/StealthVerification"));
const StealthWheel = lazy(() => import("./pages/stealth/StealthWheel"));
const RewardsWheel = lazy(() => import("./pages/RewardsWheel"));
const RedeemGiftCard = lazy(() => import("./pages/RedeemGiftCard"));
const AdminGiftCodes = lazy(() => import("./pages/AdminGiftCodes"));
const CoinStore = lazy(() => import("./pages/CoinStore"));
const TransactionHistory = lazy(() => import("./pages/TransactionHistory"));
const Recharge = lazy(() => import("./pages/Recharge"));
const NetworkTV = lazy(() => import("./pages/NetworkTV"));
const VideoPlayer = lazy(() => import("./pages/VideoPlayer"));
const CreatorStudio = lazy(() => import("./pages/CreatorStudio"));
const TvWatch = lazy(() => import("./pages/networktv/Watch"));
const CreatorUpload = lazy(() => import("./pages/creator-studio/Upload"));
const Marketplace = lazy(() => import("./pages/marketplace/Marketplace"));
const MpProductPage = lazy(() => import("./pages/marketplace/ProductPage"));
const MpStorePage = lazy(() => import("./pages/marketplace/StorePage"));
const MpCart = lazy(() => import("./pages/marketplace/Cart"));
const MpCheckout = lazy(() => import("./pages/marketplace/Checkout"));
const MpOrders = lazy(() => import("./pages/marketplace/Orders"));
const BusinessStore = lazy(() => import("./pages/business/BusinessStore"));
const AdminDeposits = lazy(() => import("./pages/AdminDeposits"));
const AdminCompanies = lazy(() => import("./pages/AdminCompanies"));
const Tweets = lazy(() => import("./pages/Tweets"));
const SecureAdminPanel = lazy(() => import("./pages/SecureAdminPanel"));
const ControlPanel = lazy(() => import("./pages/ControlPanel"));
const AdminControl = lazy(() => import("./pages/AdminControl"));
const AdminFinance = lazy(() => import("./pages/AdminFinance"));
const OwnerVault = lazy(() => import("./pages/OwnerVault"));
const ModeratorPortal = lazy(() => import("./pages/ModeratorPortal"));
const StaffLogin = lazy(() => import("./pages/StaffLogin"));
const MasterAdmin = lazy(() => import("./pages/MasterAdmin"));
const MasterControlDashboard = lazy(() => import("./pages/MasterControlDashboard"));
const Careers = lazy(() => import("./pages/public/Careers"));
const Matches = lazy(() => import("./pages/Matches"));
const MatchDetails = lazy(() => import("./pages/MatchDetails"));
const SupportCenter = lazy(() => import("./pages/public/SupportCenter"));
const ChildSafety = lazy(() => import("./pages/public/ChildSafety"));
import DynamicPage from "./components/public/DynamicPage";
import BottomNav from "./components/BottomNav";
import SplashScreen from "./components/SplashScreen";
import IntroSplash from "./components/IntroSplash";
import FloatingAdminButton from "./components/FloatingAdminButton";
import InstallPWAButton from "./components/InstallPWAButton";
// ... keep existing code
import MaintenanceGuard from "./components/MaintenanceGuard";
import AdminRouteBlocker from "./components/guards/AdminRouteBlocker";
const Subscriptions = lazy(() => import("./pages/Subscriptions"));
const SubscriptionManage = lazy(() => import("./pages/SubscriptionManage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: 1,
    },
  },
});

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
        <Route path="/business" element={<FeatureGate feature="business_dashboard" title="لوحة الأعمال" description="لوحة الأعمال والإحصائيات وأدوات الترويج متاحة ضمن باقة الأعمال أو الحكومية."><BusinessAccount /></FeatureGate>} />
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
        <Route path="/watch/:videoId" element={<TvWatch />} />
        <Route path="/network-tv/watch/:videoId" element={<TvWatch />} />
        <Route path="/creator-studio/upload" element={<CreatorUpload />} />
        <Route path="/creator-studio" element={<FeatureGate feature="analytics" title="الإحصائيات والتحليلات" description="التحليلات المتقدمة متاحة ضمن الباقات المدفوعة."><CreatorStudio /></FeatureGate>} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/product/:id" element={<MpProductPage />} />
        <Route path="/store/:username" element={<MpStorePage />} />
        <Route path="/cart" element={<MpCart />} />
        <Route path="/checkout" element={<MpCheckout />} />
        <Route path="/orders" element={<MpOrders />} />
        <Route path="/business/store" element={<BusinessStore />} />
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
        <Route path="/partners" element={<PartnersPortal />} />
        <Route path="/careers" element={<Careers />} />
        <Route path="/help" element={<SupportCenter />} />
        <Route path="/child-safety" element={<ChildSafety />} />
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
        <Route path="/subscriptions" element={<Subscriptions />} />
        <Route path="/pricing" element={<Subscriptions />} />
        <Route path="/subscriptions/manage" element={<SubscriptionManage />} />
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
                <SubscriptionProvider>
                  <AppContent />
                </SubscriptionProvider>
              </AgoraCallProvider>
            </ChimeCallProvider>

          </MaintenanceGuard>
        </ErrorBoundary>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
