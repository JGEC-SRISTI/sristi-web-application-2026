import { useLayoutEffect } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import "boxicons/css/boxicons.min.css";

import Home from "./pages/Home.tsx";
import Events from "./pages/Events.tsx";
import EventDetail from "./pages/EventDetail.tsx";
import Accommodation from "./pages/Accommodation.tsx";
import ContactUs from "./pages/ContactUs.tsx";
import Committee from "./pages/Committee.tsx";
import AdminOverview from "./pages/admin/AdminOverview.tsx";
import AdminEvents from "./pages/admin/AdminEvents.tsx";
import AdminSectionPlaceholder from "./pages/admin/AdminSectionPlaceholder.tsx";
import CustomCursor from "./components/CustomCursor.tsx";
import Register from "./pages/Register.tsx";
import Dev from "./pages/Dev.tsx";

function AppRoutes() {
  const { pathname } = useLocation();
  const isAdminRoute = pathname.startsWith("/admin");

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return (
    <>
      {!isAdminRoute && <CustomCursor />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/events" element={<Events />} />
        <Route path="/events/:eventSlug" element={<EventDetail />} />
        <Route path="/accommodation" element={<Accommodation />} />
        <Route path="/contact_us" element={<ContactUs />} />
        <Route path="/committee" element={<Committee />} />
        <Route path="/dev" element={<Dev />} />
        <Route path="/register" element={<Register />} />
        {/* Public leaderboard route paused until the results page is scheduled. */}
        <Route path="/admin" element={<AdminOverview />} />
        <Route path="/admin/events" element={<AdminEvents />} />
        <Route
          path="/admin/registrations"
          element={<AdminSectionPlaceholder section="registrations" />}
        />
        <Route
          path="/admin/attendance"
          element={<AdminSectionPlaceholder section="attendance" />}
        />
        <Route
          path="/admin/results"
          element={<AdminSectionPlaceholder section="results" />}
        />
        <Route
          path="/admin/payments"
          element={<AdminSectionPlaceholder section="payments" />}
        />
        <Route
          path="/admin/admins"
          element={<AdminSectionPlaceholder section="admins" />}
        />
        <Route
          path="/admin/settings"
          element={<AdminSectionPlaceholder section="settings" />}
        />
      </Routes>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
