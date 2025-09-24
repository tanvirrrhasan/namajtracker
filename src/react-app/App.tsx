import { BrowserRouter as Router, Routes, Route } from "react-router";
import { FirebaseAuthProvider } from "@/react-app/context/FirebaseAuthContext";
import HomePage from "@/react-app/pages/Home";
import PrayerPage from "@/react-app/pages/Prayer";
import ActivitiesPage from "@/react-app/pages/Activities";
import ProfilePage from "@/react-app/pages/Profile";
import AdminPanel from "@/react-app/pages/AdminPanel";
import GalleryPage from "@/react-app/pages/Gallery";
import AuthCallbackPage from "@/react-app/pages/AuthCallback";
import Layout from "@/react-app/components/Layout";

export default function App() {
  return (
    <FirebaseAuthProvider>
      <Router>
        <Routes>
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="prayer" element={<PrayerPage />} />
            <Route path="activities" element={<ActivitiesPage />} />
            <Route path="gallery" element={<GalleryPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="admin" element={<AdminPanel />} />
          </Route>
        </Routes>
      </Router>
    </FirebaseAuthProvider>
  );
}
