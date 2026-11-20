
import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import cursorImage from "../assets/icons/cursor.png";

const CustomCursor = () => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => {
    const isAdminRoute = location.pathname.startsWith("/admin");

    const root = document.documentElement;

    if (isAdminRoute) {
      root.classList.remove("custom-cursor-active");
      return;
    }

    root.classList.add("custom-cursor-active");

    const handleMouseMove = (event: MouseEvent) => {
      if (cursorRef.current) {
        cursorRef.current.style.left = `${event.clientX}px`;
        cursorRef.current.style.top = `${event.clientY}px`;
      }
    };

    window.addEventListener("mousemove", handleMouseMove, {
      passive: true,
    });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      root.classList.remove("custom-cursor-active");
    };
  }, [location.pathname]);

  if (location.pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <div ref={cursorRef} className="custom-cursor">
      <img
        src={cursorImage}
        alt=""
        className="cursor-image"
        draggable={false}
      />
    </div>
  );
};

export default CustomCursor;
