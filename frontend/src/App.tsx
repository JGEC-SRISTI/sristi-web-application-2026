import { useLayoutEffect } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import "boxicons/css/boxicons.min.css";

import Home from "./pages/Home.tsx";
import AdminOverview from "./pages/admin/AdminOverview.tsx";
import AdminEvents from "./pages/admin/AdminEvents.tsx";
import CursorTrail from "./components/CursorTrail.tsx";
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
      {!isAdminRoute && <CursorTrail />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<AdminOverview />} />
        <Route path="/admin/events" element={<AdminEvents />} />
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
