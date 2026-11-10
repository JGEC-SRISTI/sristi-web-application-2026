
type Shape = "square" | "triangle" | "circle" | "house";

interface NavShapeProps {
  shape: Shape;
}

const NavShape = ({ shape }: NavShapeProps) => {
  if (shape === "square") {
    return (
      <svg viewBox="0 0 100 100" className="w-5 h-5 overflow-visible" aria-hidden="true">
        <rect
          className="nav-shape"
          x="10"
          y="10"
          width="80"
          height="80"
          pathLength="100"
        />
      </svg>
    );
  }

  if (shape === "triangle") {
    return (
      <svg viewBox="0 0 100 100" className="w-5 h-5 overflow-visible" aria-hidden="true">
        <polygon
          className="nav-shape"
          points="50,8 92,88 8,88"
          pathLength="100"
        />
      </svg>
    );
  }

  if (shape === "house") {
    return (
      <svg viewBox="0 0 100 100" className="w-5 h-5 overflow-visible" aria-hidden="true">
        <path
          className="nav-shape"
          d="M10 36 L50 5 L90 36 V90 H10 Z"
          pathLength="100"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 100 100" className="w-5 h-5 overflow-visible" aria-hidden="true">
      <circle
        className="nav-shape"
        cx="50"
        cy="50"
        r="40"
        pathLength="100"
      />
    </svg>
  );
};

export default NavShape;
