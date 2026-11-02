import { useLayoutEffect } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import "boxicons/css/boxicons.min.css";

import Home from "./pages/Home.tsx";
import Events from "./pages/Events.tsx";
import EventDetail from "./pages/EventDetail.tsx";
import AdminOverview from "./pages/admin/AdminOverview.tsx";
import AdminEvents from "./pages/admin/AdminEvents.tsx";
import AdminSectionPlaceholder from "./pages/admin/AdminSectionPlaceholder.tsx";
import CustomCursor from "./components/CustomCursor.tsx";

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
        <Route path="/admin" element={<AdminOverview />} />
        <Route path="/admin/events" element={<AdminEvents />} />
        <Route
          path="/admin/registrations"
          element={<AdminSectionPlaceholder section="registrations" />}
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
