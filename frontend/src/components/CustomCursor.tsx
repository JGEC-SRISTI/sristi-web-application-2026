import { useEffect, useState } from "react";
import cursorImage from "../assets/icons/cursor.png";

const CustomCursor = () => {
  const [position, setPosition] = useState({ x: -100, y: -100 });

  useEffect(() => {
    // Activate custom cursor mode
    document.documentElement.classList.add("custom-cursor-active");

    const handleMouseMove = (event: MouseEvent) => {
      setPosition({
        x: event.clientX,
        y: event.clientY,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.documentElement.classList.remove("custom-cursor-active");
    };
  }, []);

  return (
    <div
      className="custom-cursor"
      style={{
        left: position.x,
        top: position.y,
      }}
    >
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