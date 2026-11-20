
type Shape = "square" | "triangle" | "circle" | "house" | "phone";

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

  if (shape === "phone") {
    return (
      <svg viewBox="0 0 100 100" className="w-5 h-5 overflow-visible" aria-hidden="true">
        <path
          className="nav-shape"
          d="M24 10h12a5 5 0 0 1 5 4l3 15a5 5 0 0 1-2 5l-9 7a63 63 0 0 0 26 26l7-9a5 5 0 0 1 5-2l15 3a5 5 0 0 1 4 5v12a12 12 0 0 1-13 12A77 77 0 0 1 12 23a12 12 0 0 1 12-13Z"
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
