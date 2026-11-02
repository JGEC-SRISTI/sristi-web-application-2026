import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { galleryData } from "../data/gallery";

const Gallery = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  // Used to detect mouse dragging and touch swiping.
  const pointerStartX = useRef<number | null>(null);
  const hasDragged = useRef(false);
  const frontCardRef = useRef<HTMLDivElement | null>(null);

  const totalImages = galleryData.length;

  const goToSlide = (index: number) => {
    if (totalImages === 0) return;

    setActiveIndex((index + totalImages) % totalImages);
  };

  const nextSlide = () => {
    goToSlide(activeIndex + 1);
  };

  const previousSlide = () => {
    goToSlide(activeIndex - 1);
  };

  // Keyboard navigation.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setActiveIndex((current) =>
          (current - 1 + totalImages) % totalImages
        );
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        setActiveIndex((current) =>
          (current + 1) % totalImages
        );
      }
    };

    if (totalImages > 1) {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [totalImages]);

  // Start mouse drag or touch swipe.
  const handlePointerDown = (
    event: React.PointerEvent<HTMLDivElement>
  ) => {
    if (!event.isPrimary) return;

    pointerStartX.current = event.clientX;
    hasDragged.current = false;

    event.currentTarget.setPointerCapture(event.pointerId);
  };

  // Finish drag or swipe.
  const handlePointerUp = (
    event: React.PointerEvent<HTMLDivElement>
  ) => {
    if (pointerStartX.current === null) return;

    const difference = event.clientX - pointerStartX.current;

    if (Math.abs(difference) > 45) {
      hasDragged.current = true;

      if (difference < 0) {
        nextSlide();
      } else {
        previousSlide();
      }
    }

    pointerStartX.current = null;
  };

  const handlePointerCancel = () => {
    pointerStartX.current = null;
  };

  // Reset the front card's 3D tilt.
  const resetFrontCard = () => {
    const card = frontCardRef.current;
    if (!card) return;

    card.style.transform =
      "perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)";

    card.style.setProperty("--glare-x", "50%");
    card.style.setProperty("--glare-y", "50%");
    card.style.setProperty("--glare-opacity", "0");
  };

  // Track the pointer over the active image.
  const handleStagePointerMove = (
    event: React.PointerEvent<HTMLDivElement>
  ) => {
    if (event.pointerType === "touch") return;

    // Don't apply tilt while dragging the carousel.
    if (pointerStartX.current !== null) return;

    const panel = event.currentTarget.querySelector(
      ".gallery-3d-panel-active"
    ) as HTMLElement | null;

    const card = frontCardRef.current;

    if (!panel || !card) return;

    const rect = panel.getBoundingClientRect();

    const inside =
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom;

    if (!inside) {
      resetFrontCard();
      return;
    }

    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;

    const rotateY = (x - 0.5) * 18;
    const rotateX = (0.5 - y) * 18;

    card.style.transform = `
      perspective(1000px)
      rotateX(${rotateX}deg)
      rotateY(${rotateY}deg)
      translateZ(18px)
    `;

    card.style.setProperty("--glare-x", `${x * 100}%`);
    card.style.setProperty("--glare-y", `${y * 100}%`);
    card.style.setProperty("--glare-opacity", "1");
  };

  // Empty gallery state.
  if (totalImages === 0) {
    return (
      <section className="relative z-10 py-24 text-center text-white">
        <p className="font-mono text-sm uppercase tracking-[0.4em] text-pink-500">
          Gallery
        </p>

        <p className="mt-4 font-ui text-white/50">
          No gallery images found.
        </p>
      </section>
    );
  }

  // const currentImage = galleryData[activeIndex];  // Currently not used, but can be used for future features.
  const visibleRange = 4;
  const panelAngle = 20;

  /*
   * Calculate the shortest distance between an image
   * and the currently active image.
   *
   * This makes the carousel wrap around at both ends.
   */
  const getRelativeOffset = (index: number) => {
    let offset = index - activeIndex;

    if (offset > totalImages / 2) {
      offset -= totalImages;
    }

    if (offset < -totalImages / 2) {
      offset += totalImages;
    }

    return offset;
  };

  return (
    <section
      className="
        relative
        z-10
        w-full
        py-24
        md:py-32
        overflow-hidden
      "
    >
      {/* HEADER */}

      <div
        className="
          max-w-7xl
          mx-auto
          px-6
          sm:px-10
          md:px-16
          lg:px-24
          mb-8
          md:mb-12
        "
      >
        <div className="flex items-end justify-between">
          <div>
            <p
              className="
                font-mono
                text-xs
                sm:text-sm
                tracking-[0.45em]
                uppercase
                text-pink-500
                mb-3
              "
            >
              Player Archive
            </p>

            <h2
              className="
                font-heavy-title
                text-5xl
                sm:text-6xl
                md:text-7xl
                tracking-wider
                text-white
              "
            >
              GALLERY
            </h2>
          </div>

          {/* IMAGE COUNTER */}

          <div
            className="
              hidden
              sm:block
              font-mono
              text-xs
              tracking-widest
              text-white/40
            "
          >
            {String(activeIndex + 1).padStart(2, "0")}
            {" / "}
            {String(totalImages).padStart(2, "0")}
          </div>
        </div>
      </div>

      {/* 3D CAROUSEL */}

      <div className="relative w-full">
        {/* LEFT FADE */}

        <div
          className="
            absolute
            left-0
            top-0
            bottom-0
            w-12
            sm:w-20
            md:w-40
            z-20
            pointer-events-none
            bg-linear-to-r
            from-[#080808]
            to-transparent
          "
        />

        {/* RIGHT FADE */}

        <div
          className="
            absolute
            right-0
            top-0
            bottom-0
            w-12
            sm:w-20
            md:w-40
            z-20
            pointer-events-none
            bg-linear-to-l
            from-[#080808]
            to-transparent
          "
        />

        {/* 3D STAGE */}

        <div
          className="
            gallery-3d-stage
            relative
            w-full
            h-60
            sm:h-87.5
            md:h-105
            flex
            items-center
            justify-center
            select-none
            cursor-grab
            active:cursor-grabbing
          "
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          onPointerMove={handleStagePointerMove}
          onPointerLeave={resetFrontCard}
        >
          {galleryData.map((item, index) => {
            const offset = getRelativeOffset(index);
            const distance = Math.abs(offset);
            const isVisible = distance <= visibleRange;
            const isActive = offset === 0;

            const scale = isActive
              ? 1
              : Math.max(0.72, 1 - distance * 0.075);

            const opacity = isVisible
              ? Math.max(0.25, 1 - distance * 0.2)
              : 0;

            return (
              <div
                key={index}
                className={`
                  gallery-3d-panel
                  absolute
                  ${isActive ? "gallery-3d-panel-active" : ""}
                  left-1/2
                  top-1/2
                  w-[44vw]
                  sm:w-[36vw]
                  md:w-[30vw]
                  lg:w-[25vw]
                  max-w-65
                  aspect-16/10
                  overflow-hidden
                  bg-black
                  border
                  border-white/10
                `}
                style={{
                  transform: `
                    translate(-50%, -50%)
                    rotateY(${offset * panelAngle}deg)
                    translateZ(var(--gallery-radius))
                    scale(${scale})
                  `,
                  opacity,
                  zIndex: 10 - distance,
                  pointerEvents: isVisible ? "auto" : "none",
                  transition:
                    "transform 700ms cubic-bezier(0.22, 1, 0.36, 1), opacity 500ms ease, border-color 500ms ease",
                  borderColor: isActive
                    ? "rgba(236, 72, 153, 0.8)"
                    : "rgba(255, 255, 255, 0.12)",
                  boxShadow: isActive
                    ? "0 0 35px rgba(236, 72, 153, 0.18)"
                    : "0 10px 35px rgba(0, 0, 0, 0.4)",
                }}
                onClick={() => {
                  if (hasDragged.current) {
                    hasDragged.current = false;
                    return;
                  }

                  if (!isActive) {
                    goToSlide(index);
                  }
                }}
                aria-label={`View gallery image ${index + 1}`}
              >
                <div
                  ref={isActive ? frontCardRef : undefined}
                  className="gallery-card-inner"
                >

                  {/* IMAGE */}

                  <img
                    src={item.image}
                    alt={`SRISTI Gallery ${index + 1}`}
                    draggable={false}
                    className="
                      gallery-panel-image
                      absolute
                      inset-0
                      w-full
                      h-full
                      object-cover
                    "
                  />

                  {/* DARK OVERLAY */}

                  <div
                    className={`
                      absolute
                      inset-0
                      pointer-events-none
                      transition-all
                      duration-700
                      ${
                        isActive
                          ? "bg-black/15"
                          : "bg-transparent"
                      }
                    `}
                  />

                  {/* DESCRIPTION - ACTIVE IMAGE ONLY */}

                  {/* HOVER DESCRIPTION */}

                  {isActive && (
                    <div className="gallery-hover-description">
                      <p className="gallery-description-text">
                        {item.description}
                      </p>
                    </div>
                  )}

                  {/* TOP LEFT CORNER */}

                  <div
                    className="
                      absolute
                      top-0
                      left-0
                      w-16
                      h-0.5
                      bg-pink-500
                      z-10
                    "
                  />

                  <div
                    className="
                      absolute
                      top-0
                      left-0
                      w-0.5
                      h-16
                      bg-pink-500
                      z-10
                    "
                  />

                  {/* BOTTOM RIGHT CORNER */}

                  <div
                    className="
                      absolute
                      bottom-0
                      right-0
                      w-16
                      h-0.5
                      bg-pink-500
                      z-10
                    "
                  />

                  <div
                    className="
                      absolute
                      bottom-0
                      right-0
                      w-0.5
                      h-16
                      bg-pink-500
                      z-10
                    "
                  />

                  {/* FILE NUMBER */}

                  <div
                    className="
                      absolute
                      top-2
                      right-2
                      sm:top-2
                      sm:right-2
                      z-10
                      px-1
                      py-1
                      bg-black/60
                      backdrop-blur-md
                      border
                      border-white/10
                      font-mono
                      text-[4px]
                      sm:text-[6px]
                      tracking-[0.25em]
                      text-white/70
                    "
                  >
                    FILE {String(index + 1).padStart(3, "0")}
                  </div>

                  {/* SRISTI LABEL */}

                  <div
                    className="
                      absolute
                      bottom-2
                      left-2
                      sm:bottom-2
                      sm:left-2
                      z-10
                      font-mono
                      text-[4px]
                      sm:text-[6px]
                      tracking-[0.3em]
                      text-pink-400
                    "
                  >
                    SRISTI 2K26
                  </div>

                  <div className="gallery-card-glare" />
                </div>
              </div>
            );
          })}
        </div>

        {/* PREVIOUS BUTTON */}

        <button
          type="button"
          onClick={previousSlide}
          aria-label="Previous image"
          className="
            absolute
            left-3
            sm:left-5
            md:left-8
            lg:left-12
            top-1/2
            -translate-y-1/2
            z-30
            w-10
            h-10
            md:w-14
            md:h-14
            flex
            items-center
            justify-center
            border
            border-white/20
            bg-black/70
            backdrop-blur-xl
            text-white
            transition-all
            duration-300
            hover:border-pink-500
            hover:text-pink-500
            hover:shadow-[0_0_25px_rgba(236,72,153,0.5)]
          "
        >
          <ChevronLeft size={22} />
        </button>

        {/* NEXT BUTTON */}

        <button
          type="button"
          onClick={nextSlide}
          aria-label="Next image"
          className="
            absolute
            right-3
            sm:right-5
            md:right-8
            lg:right-12
            top-1/2
            -translate-y-1/2
            z-30
            w-10
            h-10
            md:w-14
            md:h-14
            flex
            items-center
            justify-center
            border
            border-white/20
            bg-black/70
            backdrop-blur-xl
            text-white
            transition-all
            duration-300
            hover:border-pink-500
            hover:text-pink-500
            hover:shadow-[0_0_25px_rgba(236,72,153,0.5)]
          "
        >
          <ChevronRight size={22} />
        </button>
      </div>

      {/* IMAGE INDICATORS */}

      <div
        className="
          flex
          items-center
          justify-center
          flex-wrap
          gap-2
          mt-6
          px-6
        "
      >
        {galleryData.map((_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => goToSlide(index)}
            aria-label={`Go to image ${index + 1}`}
            aria-current={index === activeIndex ? "true" : undefined}
            className={`
              h-0.5
              transition-all
              duration-300
              ${
                index === activeIndex
                  ? "w-10 bg-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.8)]"
                  : "w-4 bg-white/20 hover:bg-white/50"
              }
            `}
          />
        ))}
      </div>

      {/* SMALL SCREEN COUNTER */}

      <p
        className="
          sm:hidden
          mt-5
          text-center
          font-mono
          text-xs
          tracking-widest
          text-white/40
        "
      >
        {String(activeIndex + 1).padStart(2, "0")}
        {" / "}
        {String(totalImages).padStart(2, "0")}
      </p>
    </section>
  );
};

export default Gallery;
