import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import CourseAccessRoute from "@/components/auth/CourseAccessRoute";
import AdminRoute from "@/components/auth/AdminRoute";

// ---- Student Pages ----
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Verify from "./pages/Verify";

import Day1 from "./pages/day-1";
import Day2 from "./pages/day-2";
import Day3 from "./pages/day-3";
import Day4 from "./pages/day-4";
import Day5 from "./pages/day-5";
import Day6 from "./pages/day-6";
import Day7 from "./pages/day-7";

import IntegrationToolkit from "./pages/IntegrationToolkit";
import StudentWelcome from "./pages/StudentWelcome";

// ---- Admin Auth ----
import AdminLogin from "./pages/AdminLogin";
import AdminSetup from "./pages/AdminSetup";
import ResetPassword from "./pages/ResetPassword";
import MFASetup from "./pages/MFASetup";

// ---- Admin Dashboard ----
import AdminDashboard from "./components/admin/AdminDashboard";
import AdminDailyLessons from "./pages/admin-lessons/AdminDailyLessons";

// ---- Admin Preview Pages ----
import DailyLessons from "./pages/DailyLessons";

// ---- Student Portal Route ----
import StudentPortal from "./components/StudentPortal";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider defaultTheme="light">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />

        <BrowserRouter>
          <Routes>

            {/* -------------------------
                STUDENT PUBLIC ROUTES
            -------------------------- */}
            <Route path="/" element={<Index />} />
            <Route path="/verify" element={<Verify />} />

            {/* Student daily lessons */}
            <Route path="/day-1" element={<CourseAccessRoute><Day1 /></CourseAccessRoute>} />
            <Route path="/day-2" element={<CourseAccessRoute><Day2 /></CourseAccessRoute>} />
            <Route path="/day-3" element={<CourseAccessRoute><Day3 /></CourseAccessRoute>} />
            <Route path="/day-4" element={<CourseAccessRoute><Day4 /></CourseAccessRoute>} />
            <Route path="/day-5" element={<CourseAccessRoute><Day5 /></CourseAccessRoute>} />
            <Route path="/day-6" element={<CourseAccessRoute><Day6 /></CourseAccessRoute>} />
            <Route path="/day-7" element={<CourseAccessRoute><Day7 /></CourseAccessRoute>} />

            <Route path="/integration" element={<CourseAccessRoute><IntegrationToolkit /></CourseAccessRoute>} />
            <Route path="/student-welcome" element={<CourseAccessRoute><StudentWelcome /></CourseAccessRoute>} />

            {/* -------------------------
                ADMIN AUTH
            -------------------------- */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin-setup" element={<AdminSetup />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/mfa-setup" element={<MFASetup />} />

            {/* -------------------------
                ADMIN DASHBOARD
            -------------------------- */}
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/lessons" element={<AdminRoute><AdminDailyLessons /></AdminRoute>} />

            {/* -------------------------
                ADMIN PREVIEW PAGES
            -------------------------- */}
            <Route path="/class/daily" element={<AdminRoute><DailyLessons /></AdminRoute>} />

            {/* -------------------------
                STUDENT PORTAL
            -------------------------- */}
            <Route path="/student-portal" element={<CourseAccessRoute><StudentPortal /></CourseAccessRoute>} />

            {/* -------------------------
                FALLBACK
            -------------------------- */}
            <Route path="*" element={<NotFound />} />

          </Routes>
        </BrowserRouter>

      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
