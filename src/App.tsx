import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";

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
            <Route path="/day-1" element={<Day1 />} />
            <Route path="/day-2" element={<Day2 />} />
            <Route path="/day-3" element={<Day3 />} />
            <Route path="/day-4" element={<Day4 />} />
            <Route path="/day-5" element={<Day5 />} />
            <Route path="/day-6" element={<Day6 />} />
            <Route path="/day-7" element={<Day7 />} />

            <Route path="/integration" element={<IntegrationToolkit />} />
            <Route path="/student-welcome" element={<StudentWelcome />} />

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
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/lessons" element={<AdminDailyLessons />} />

            {/* -------------------------
                ADMIN PREVIEW PAGES
            -------------------------- */}
            <Route path="/class/daily" element={<DailyLessons />} />

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
