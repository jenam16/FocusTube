import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './hooks';
import { ProtectedRoute, PublicOnlyRoute } from './components';
import { AppLayout } from './layouts';
import {
  LandingPage,
  LoginPage,
  RegisterPage,
  VerifyEmailPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  DashboardPage,
  CoursesPage,
  CourseDetailPage,
  WatchPage,
  StudyPlanPage,
  FocusPage,
  AnalyticsPage,
  BookmarksPage,
  NotesPage,
  SettingsPage,
} from './pages';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Landing Route */}
            <Route path="/" element={<LandingPage />} />

            {/* Email Verification Route */}
            <Route path="/verify-email" element={<VerifyEmailPage />} />

            {/* Password Reset Routes */}
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Guest / Public Auth Routes */}
            <Route element={<PublicOnlyRoute />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>

            {/* Protected Application Routes wrapped in AppLayout */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/courses" element={<CoursesPage />} />
                <Route path="/courses/:courseId" element={<CourseDetailPage />} />
                <Route path="/courses/:id" element={<CourseDetailPage />} />
                <Route
                  path="/watch/:courseId/:videoId"
                  element={<WatchPage />}
                />
                <Route path="/study-plan" element={<StudyPlanPage />} />
                <Route path="/focus" element={<FocusPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/bookmarks" element={<BookmarksPage />} />
                <Route path="/notes" element={<NotesPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>
            </Route>

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
