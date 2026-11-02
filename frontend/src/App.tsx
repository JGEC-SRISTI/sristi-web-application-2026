import { BrowserRouter, Route, Routes } from "react-router-dom";
import "boxicons/css/boxicons.min.css";

import Home from "./pages/Home.tsx";
// import CursorTrail from "./components/CursorTrail.tsx";
import CustomCursor from "./components/CustomCursor.tsx";

function App() {
  return (
    <BrowserRouter>
      <CustomCursor />
      {/* <CursorTrail /> */}

      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;