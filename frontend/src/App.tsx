import { BrowserRouter, Route, Routes } from "react-router-dom";
import "boxicons/css/boxicons.min.css";

import Home from "./pages/Home.tsx";
import Events from "./pages/Events.tsx";
import EventDetail from "./pages/EventDetail.tsx";
import CursorTrail from "./components/CursorTrail.tsx";
import CustomCursor from "./components/CustomCursor.tsx";

function App() {
  return (
    <BrowserRouter>
      <CustomCursor />
      <CursorTrail />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/events" element={<Events />} />
        <Route path="/events/:eventSlug" element={<EventDetail />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;