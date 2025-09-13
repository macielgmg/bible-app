import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import StudyLibrary from "./pages/StudyLibrary";
import Store from "./pages/Store";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import { SessionProvider } from "./contexts/SessionContext";
import AuthProtectedRoute from "./components/AuthProtectedRoute"; // Renamed import
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import AdminStudiesPage from "./pages/AdminStudiesPage";
import AdminDailyContentPage from "./pages/AdminDailyContentPage";
import AdminActivityPage from "./pages/AdminActivityPage";
import AdminFeedbackPage from "./pages/AdminFeedbackPage"; // Importar AdminFeedbackPage
import StudyDetail from "./pages/StudyDetail";
import ChapterDetail from "./pages/ChapterDetail";
import Today from "./pages/Today";
import PersonalData from "./pages/PersonalData";
import SpiritualJournalPage from "./pages/SpiritualJournalPage";
import VerseOfTheDayPage from "./pages/VerseOfTheDayPage";
import AchievementsPage from "./pages/Achievements";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import OnboardingQuiz from "./pages/OnboardingQuiz";
import { ThemeProvider } from "./components/theme-provider";
import PreferencesPage from "./pages/PreferencesPage";
import SettingsPage from "./pages/SettingsPage";
import DailyStudyPage from "./pages/DailyStudyPage";
import QuickReflectionPage from "./pages/QuickReflectionPage";
import InspirationalQuotePage from "./pages/InspirationalQuotePage";
import MyPrayerPage from "./pages/MyPrayerPage";
import AboutAppPage from "./pages/AboutAppPage";
import AccountSecurityPage from "./pages/AccountSecurityPage";
import DailyHistoryPage from "./pages/DailyHistoryPage";
import HelpAndSupportPage from "./pages/HelpAndSupportPage";
import { ConditionalSonnerToaster } from "./components/ConditionalSonnerToaster";
import ShareImageCreatorPage from "./pages/ShareImageCreatorPage";
import SharedContentPage from "./pages/SharedContentPage";


const queryClient = new QueryClient();

const App = () => (
  <React.Fragment>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <TooltipProvider>
          <Toaster />
          <BrowserRouter>
            <SessionProvider>
              <ConditionalSonnerToaster />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/share/:templateId" element={<SharedContentPage />} />
                {/* Onboarding Quiz is now protected by AuthProtectedRoute */}
                <Route path="/onboarding-quiz" element={<AuthProtectedRoute><OnboardingQuiz /></AuthProtectedRoute>} />
                
                {/* Admin Routes */}
                <Route path="/management" element={<AdminProtectedRoute><AdminDashboardPage /></AdminProtectedRoute>} />
                <Route path="/management/users" element={<AdminProtectedRoute><AdminUsersPage /></AdminProtectedRoute>} />
                <Route path="/management/studies" element={<AdminProtectedRoute><AdminStudiesPage /></AdminProtectedRoute>} />
                <Route path="/management/daily-content" element={<AdminProtectedRoute><AdminDailyContentPage /></AdminProtectedRoute>} />
                <Route path="/management/activity" element={<AdminProtectedRoute><AdminActivityPage /></AdminProtectedRoute>} />
                <Route path="/management/feedback" element={<AdminProtectedRoute><AdminFeedbackPage /></AdminProtectedRoute>} />
                
                {/* General Authenticated Routes */}
                <Route 
                  element={
                    <AuthProtectedRoute> {/* Use AuthProtectedRoute here */}
                      <Layout />
                    </AuthProtectedRoute>
                  }
                >
                  <Route path="/library" element={<StudyLibrary />} />
                  <Route path="/store" element={<Store />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/achievements" element={<AchievementsPage />} />
                  <Route path="/personal-data" element={<PersonalData />} />
                  {/* <Route path="/manage-subscription" element={<ManageSubscriptionPage />} /> */}
                  <Route path="/preferences" element={<PreferencesPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/about-app" element={<AboutAppPage />} />
                  <Route path="/account-security" element={<AccountSecurityPage />} />
                  <Route path="/help-and-support" element={<HelpAndSupportPage />} />
                  <Route path="/study/:studyId" element={<StudyDetail />} />
                  <Route path="/study/:studyId/chapter/:chapterId" element={<ChapterDetail />} />
                  <Route path="/today" element={<Today />} />
                  <Route path="/today/spiritual-journal" element={<SpiritualJournalPage />} />
                  <Route path="/today/verse-of-the-day" element={<VerseOfTheDayPage />} />
                  <Route path="/today/daily-study" element={<DailyStudyPage />} />
                  <Route path="/today/quick-reflection" element={<QuickReflectionPage />} />
                  <Route path="/today/inspirational-quote" element={<InspirationalQuotePage />} />
                  <Route path="/today/my-prayer" element={<MyPrayerPage />} />
                  <Route path="/today/history/:date" element={<DailyHistoryPage />} />
                  <Route path="/share-creator" element={<ShareImageCreatorPage />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </SessionProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </React.Fragment> 
);

export default App;