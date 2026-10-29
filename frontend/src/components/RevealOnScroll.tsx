import { useEffect, useRef, useState } from "react";

interface RevealOnScrollProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "left" | "right";
}

const RevealOnScroll = ({
  children,
  className = "",
  delay = 0,
  direction = "up",
}: RevealOnScrollProps) => {
  const elementRef = useRef<HTMLDivElement>(null);

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = elementRef.current;

    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        /*
          Animate in when entering the viewport.
          Reset when leaving so it can animate again.
        */
        setIsVisible(entry.isIntersecting);
      },
      {
        /*
          The animation starts when roughly 15%
          of the element enters the viewport.
        */
        threshold: 0.15,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  const directionClass = {
    up: "translate-y-12",
    left: "-translate-x-16",
    right: "translate-x-16",
  }[direction];

  return (
    <div
      ref={elementRef}
      style={{
        transitionDelay: `${delay}ms`,
      }}
      className={`
        transition-all
        duration-1000
        ease-[cubic-bezier(0.16,1,0.3,1)]

        ${
          isVisible
            ? "translate-x-0 translate-y-0 opacity-100"
            : `${directionClass} opacity-0`
        }

        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default RevealOnScroll;