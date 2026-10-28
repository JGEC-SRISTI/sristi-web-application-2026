import { useEffect, useState } from "react";

const CustomCursor = () => {
  const [position, setPosition] = useState({
    x: 0,
    y: 0,
  });

  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const target = event.target as HTMLElement;

      setIsHovering(
        !!target.closest("a, button, [role='button']")
      );
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <div
      className={`custom-cursor ${
        isHovering ? "cursor-hover" : ""
      }`}
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      <div className="cursor-ring" />

      <div className="cursor-dot">
        <span />
      </div>
    </div>
  );
};

export default CustomCursor;