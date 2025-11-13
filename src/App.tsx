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
import SimpleAdminDashboard from "./components/admin/SimpleAdminDashboard";

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


// ★ NEW: import MFA setup page
import MFASetup from "./pages/MFASetup";


const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider defaultTheme="light">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/verify" element={<Verify />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<SimpleAdminDashboard />} />

            <Route path="/day-1" element={<Day1 />} />
            <Route path="/day-2" element={<Day2 />} />
            <Route path="/day-3" element={<Day3 />} />
            <Route path="/day-4" element={<Day4 />} />
            <Route path="/day-5" element={<Day5 />} />
            <Route path="/day-6" element={<Day6 />} />
            <Route path="/day-7" element={<Day7 />} />

            <Route path="/integration" element={<IntegrationToolkit />} />
            <Route path="/admin-setup" element={<AdminSetup />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/student-welcome" element={<StudentWelcome />} />

            {/* ⭐ NEW MFA route */}
            <Route path="/mfa-setup" element={<MFASetup />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;

