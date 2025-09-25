import { BrowserRouter as Router, Routes, Route } from "react-router";
import { FirebaseAuthProvider } from "@/react-app/context/FirebaseAuthContext";
import HomePage from "@/react-app/pages/Home";
import PrayerPage from "@/react-app/pages/Prayer";
import ActivitiesPage from "@/react-app/pages/Activities";
import ProfilePage from "@/react-app/pages/Profile";
import AdminPanel from "@/react-app/pages/AdminPanel";
import GalleryPage from "@/react-app/pages/Gallery";
import ApplicationPage from "@/react-app/pages/Application";
import AuthCallbackPage from "@/react-app/pages/AuthCallback";
import Layout from "@/react-app/components/Layout";

export default function App() {
  const isGitHubPages = typeof window !== 'undefined' && /\.github\.io$/i.test(window.location.hostname);
  const basename = isGitHubPages ? '/siratulsabiqun' : '/';
  return (
    <FirebaseAuthProvider>
      <Router basename={basename}>
        <Routes>
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="prayer" element={<PrayerPage />} />
            <Route path="activities" element={<ActivitiesPage />} />
            <Route path="gallery" element={<GalleryPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="admin" element={<AdminPanel />} />
            <Route path="application" element={<ApplicationPage />} />
          </Route>
        </Routes>
      </Router>
    </FirebaseAuthProvider>
  );
}
