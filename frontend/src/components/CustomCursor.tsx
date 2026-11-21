
import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import cursorImage from "../assets/icons/cursor.png";

const CustomCursor = () => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => {
    const root = document.documentElement;
    const cursor = cursorRef.current;

    const isAdminRoute = location.pathname.startsWith("/admin");

    // Always restore native cursor first.
    root.classList.remove("custom-cursor-active");

    if (isAdminRoute || !cursor) {
      return;
    }

    // Only enable custom cursor on devices with a precise pointer.
    const pointerQuery = window.matchMedia(
      "(hover: hover) and (pointer: fine)"
    );

    if (!pointerQuery.matches) {
      return;
    }

    const hideCustomCursor = () => {
      root.classList.remove("custom-cursor-active");
      cursor.style.visibility = "hidden";
    };

    const showCustomCursor = () => {
      cursor.style.visibility = "visible";
    };

    const handleMouseMove = (event: MouseEvent) => {
      cursor.style.left = `${event.clientX}px`;
      cursor.style.top = `${event.clientY}px`;

      root.classList.add("custom-cursor-active");
      showCustomCursor();
    };

    const handleMouseEnter = () => {
      showCustomCursor();
    };

    const handleMouseLeave = () => {
      hideCustomCursor();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        hideCustomCursor();
      }
    };

    // Initially hide until the first mouse movement.
    cursor.style.visibility = "hidden";

    window.addEventListener("mousemove", handleMouseMove, {
      passive: true,
    });

    window.addEventListener("mouseenter", handleMouseEnter);
    window.addEventListener("mouseleave", handleMouseLeave);

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseenter", handleMouseEnter);
      window.removeEventListener("mouseleave", handleMouseLeave);

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );

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
