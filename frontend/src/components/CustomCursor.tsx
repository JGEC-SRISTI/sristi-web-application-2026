import { useEffect, useState } from "react";

const CustomCursor = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const { clientX, clientY } = event;

      setPosition({ x: clientX, y: clientY });

      const target = event.target as HTMLElement;

      setIsHovering(
        !!target.closest(
          "a, button, [role='button'], input, select, textarea, label, [data-cursor-hover]"
        )
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
        transform: "translate(-50%, -50%)",
      }}
    >
      <svg
        className="cursor-triangle-outline"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Main irregular arrow outline */}
        <path
          d="M8 5 L92 30 L42 49 L27 92 Z"
          stroke="#ff6685"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* Parallel inner line */}
        <path
          d="M11 8 L45 46"
          stroke="#ff6685"
          strokeWidth="1.8"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </div>
  );
};

export default CustomCursor;