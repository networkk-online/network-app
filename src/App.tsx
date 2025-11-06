
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import Followers from "./pages/Followers";
import Following from "./pages/Following";
import CreateStory from "./pages/CreateStory";
import FloatingAIButton from "./components/FloatingAIButton";
import ThemeToggle from "./components/ThemeToggle";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <FloatingAIButton />
        <ThemeToggle />
        <Routes>
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
          <Route path="/ai-tools" element={<AITools />} />
          <Route path="/create-post" element={<CreatePost />} />
          <Route path="/quick-reply" element={<QuickReply />} />
          <Route path="/withdraw" element={<Withdraw />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/staff" element={<ManageStaff />} />
          <Route path="/admin/users" element={<ManageUsers />} />
          <Route path="/followers" element={<Followers />} />
          <Route path="/following" element={<Following />} />
          <Route path="/create-story" element={<CreateStory />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
