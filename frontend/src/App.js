import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import AppShell from "@/components/layout/AppShell";
import Home from "@/pages/Home";
import Browse from "@/pages/Browse";
import Leaderboard from "@/pages/Leaderboard";
import WhatsNew from "@/pages/WhatsNew";
import Search from "@/pages/Search";
import Archive from "@/pages/Archive";
import ComingSoon from "@/pages/ComingSoon";
import Create from "@/pages/Create";
import Creations from "@/pages/Creations";
import MovieDetail from "@/pages/MovieDetail";
import Profile from "@/pages/Profile";
import Settings from "@/pages/Settings";
import FileViewer from "@/pages/FileViewer";
import Auth from "@/pages/Auth";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import api from "@/lib/api";

const Protected = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;
  return children;
};

function Bootstrap({ children }) {
  useEffect(() => { api.post("/seed").catch(() => {}); }, []);
  return children;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Bootstrap>
          <Toaster theme="dark" position="top-right" richColors />
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route element={<AppShell />}>
              <Route path="/" element={<Home />} />
              <Route path="/browse" element={<Browse />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/whats-new" element={<WhatsNew />} />
              <Route path="/search" element={<Search />} />
              <Route path="/archive" element={<Archive />} />
              <Route path="/coming-soon" element={<ComingSoon />} />
              <Route path="/create" element={<Protected><Create /></Protected>} />
              <Route path="/creations" element={<Protected><Creations /></Protected>} />
              <Route path="/m/:id" element={<MovieDetail />} />
              <Route path="/profile" element={<Protected><Profile /></Protected>} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/decoder" element={<FileViewer />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Bootstrap>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
