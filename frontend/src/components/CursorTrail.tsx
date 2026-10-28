import { useEffect, useRef } from "react";

type Shape = "circle" | "triangle" | "square";

interface Particle {
  id: number;
  x: number;
  y: number;
  shape: Shape;
  size: number;
  rotation: number;
}

const shapes: Shape[] = ["circle", "triangle", "square"];

const CursorTrail = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(0);
  const lastPosition = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const container = containerRef.current;

    if (!container) return;

    const handleMouseMove = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // Don't create cursor particles over interactive elements
      if (target.closest(".no-trail")) {
        return;
      }

      const { clientX, clientY } = event;

      const dx = clientX - lastPosition.current.x;
      const dy = clientY - lastPosition.current.y;

      const distance = Math.sqrt(dx * dx + dy * dy);

      // Don't spawn particles when the mouse barely moves
      if (distance < 18) return;

      lastPosition.current = {
        x: clientX,
        y: clientY,
      };

      const particle = document.createElement("span");

      const shape =
        shapes[Math.floor(Math.random() * shapes.length)];

      const size = Math.random() * 8 + 8;
      const rotation = Math.random() * 360;

      particle.className = `cursor-particle cursor-${shape}`;

      particle.style.left = `${clientX}px`;
      particle.style.top = `${clientY}px`;
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;

      particle.style.setProperty(
        "--rotation",
        `${rotation}deg`
      );

      particle.dataset.id = String(idRef.current++);

      container.appendChild(particle);

      setTimeout(() => {
        particle.remove();
      }, 900);
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed inset-0 z-9999 overflow-hidden"
    />
  );
};

export default CursorTrail;