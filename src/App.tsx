import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Verify from "./pages/Verify";
import AdminLogin from "./pages/AdminLogin";

import AdminDashboard from "./components/admin/AdminDashboard";

import Day1 from "./pages/Day1";
import Day2 from "./pages/Day2";
import Day3 from "./pages/Day3";
import Day4 from "./pages/Day4";
import Day5 from "./pages/Day5";
import Day6 from "./pages/Day6";
import Day7 from "./pages/Day7";

import IntegrationToolkit from "./pages/IntegrationToolkit";
import AdminSetup from "./pages/AdminSetup";
import ResetPassword from "./pages/ResetPassword";
import StudentWelcome from "./pages/StudentWelcome";

import MFASetup from "./pages/MFASetup";

// ADMIN LESSON EDITORS
import AdminDay1Editor from "./pages/admin-lessons/AdminDay1Editor";
import AdminDay2Editor from "./pages/admin-lessons/AdminDay2Editor";
import AdminDay3Editor from "./pages/admin-lessons/AdminDay3Editor";
import AdminDay4Editor from "./pages/admin-lessons/AdminDay4Editor";
import AdminDay5Editor from "./pages/admin-lessons/AdminDay5Editor";
import AdminDay6Editor from "./pages/admin-lessons/AdminDay6Editor";
import AdminDay7Editor from "./pages/admin-lessons/AdminDay7Editor";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider defaultTheme="light">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Index />} />
            <Route path="/verify" element={<Verify />} />
            <Route path="/admin/login" element={<AdminLogin />} />

            {/* Admin */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/day-1" element={<AdminDay1Editor />} />
            <Route path="/admin/day-2" element={<AdminDay2Editor />} />
            <Route path="/admin/day-3" element={<AdminDay3Editor />} />
            <Route path="/admin/day-4" element={<AdminDay4Editor />} />
            <Route path="/admin/day-5" element={<AdminDay5Editor />} />
            <Route path="/admin/day-6" element={<AdminDay6Editor />} />
            <Route path="/admin/day-7" element={<AdminDay7Editor />} />

            {/* Student Lessons */}
            <Route path="/day-1" element={<Day1 />} />
            <Route path="/day-2" element={<Day2 />} />
            <Route path="/day-3" element={<Day3 />} />
            <Route path="/day-4" element={<Day4 />} />
            <Route path="/day-5" element={<Day5 />} />
            <Route path="/day-6" element={<Day6 />} />
            <Route path="/day-7" element={<Day7 />} />

            {/* Extras */}
            <Route path="/integration" element={<IntegrationToolkit />} />
            <Route path="/admin-setup" element={<AdminSetup />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/student-welcome" element={<StudentWelcome />} />
            <Route path="/mfa-setup" element={<MFASetup />} />

            {/* Fallback */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;