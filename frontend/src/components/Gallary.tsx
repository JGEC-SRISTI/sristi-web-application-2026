import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { galleryData } from "../data/gallery";

type FlipDirection = "next" | "previous" | null;

const Gallery = () => {
  const sliderRef = useRef<HTMLDivElement>(null);

  const [activeIndex, setActiveIndex] = useState(0);
  const [flipDirection, setFlipDirection] =
    useState<FlipDirection>(null);
  const [isFlipping, setIsFlipping] =
    useState(false);

  /*
    =========================================
    SCROLL TO SLIDE
    =========================================
  */

  const scrollToSlide = (index: number) => {
    const slider = sliderRef.current;

    if (!slider) return;

    const slides =
      slider.querySelectorAll<HTMLElement>(
        ".gallery-slide"
      );

    const slide = slides[index];

    if (!slide) return;

    slider.scrollTo({
      left:
        slide.offsetLeft -
        slider.clientWidth / 2 +
        slide.clientWidth / 2,
      behavior: "smooth",
    });

    setActiveIndex(index);
  };

  /*
    =========================================
    FLIP NAVIGATION
    =========================================
  */

  const flipToSlide = (
    direction: "next" | "previous"
  ) => {
    if (
      galleryData.length === 0 ||
      isFlipping
    ) {
      return;
    }

    setFlipDirection(direction);
    setIsFlipping(true);

    window.setTimeout(() => {
      setActiveIndex((currentIndex) => {
        if (direction === "next") {
          return currentIndex ===
            galleryData.length - 1
            ? 0
            : currentIndex + 1;
        }

        return currentIndex === 0
          ? galleryData.length - 1
          : currentIndex - 1;
      });
    }, 300);

    window.setTimeout(() => {
      setIsFlipping(false);
      setFlipDirection(null);
    }, 300);
  };

  /*
    =========================================
    PREVIOUS
    =========================================
  */

  const previousSlide = () => {
    flipToSlide("previous");
  };

  /*
    =========================================
    NEXT
    =========================================
  */

  const nextSlide = () => {
    flipToSlide("next");
  };

  /*
    =========================================
    NORMAL SWIPING
    =========================================
  */

  const handleScroll = () => {
    const slider = sliderRef.current;

    if (!slider || isFlipping) return;

    const slides = Array.from(
      slider.querySelectorAll<HTMLElement>(
        ".gallery-slide"
      )
    );

    const sliderRect =
      slider.getBoundingClientRect();

    const sliderCenter =
      sliderRect.left + sliderRect.width / 2;

    let closestIndex = 0;
    let closestDistance = Infinity;

    slides.forEach((slide, index) => {
      const slideRect =
        slide.getBoundingClientRect();

      const slideCenter =
        slideRect.left + slideRect.width / 2;

      const distance = Math.abs(
        slideCenter - sliderCenter
      );

      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    setActiveIndex(closestIndex);
  };

  /*
    =========================================
    KEEP ACTIVE SLIDE CENTERED
    =========================================
  */

  useEffect(() => {
    if (!sliderRef.current) return;

    const timer = window.setTimeout(() => {
      scrollToSlide(activeIndex);
    }, 50);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  /*========================================
  flip aniation  on arrow keys
  ========================================*/

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();

        if (!isFlipping) {
          previousSlide();
        }
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();

        if (!isFlipping) {
          nextSlide();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFlipping]);

  /*
    =========================================
    EMPTY STATE
    =========================================
  */

  if (galleryData.length === 0) {
    return (
      <section
        className="
          relative
          z-10
          py-24
          text-center
          text-white
        "
      >
        <p
          className="
            font-mono
            text-pink-500
            tracking-[0.4em]
            text-sm
            uppercase
          "
        >
          Gallery
        </p>

        <p
          className="
            mt-4
            font-ui
            text-white/50
          "
        >
          No gallery images found.
        </p>
      </section>
    );
  }

  /*
    =========================================
    CURRENT / NEXT / PREVIOUS IMAGES
    =========================================
  */

  const currentImage =
    galleryData[activeIndex].image;

  const currentDescription =
    galleryData[activeIndex].description;

  const nextIndex =
    activeIndex === galleryData.length - 1
      ? 0
      : activeIndex + 1;

  const previousIndex =
    activeIndex === 0
      ? galleryData.length - 1
      : activeIndex - 1;

  const backImage =
    flipDirection === "previous"
      ? galleryData[previousIndex].image
      : galleryData[nextIndex].image;

  /*
    =========================================
    MAIN
    =========================================
  */

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
      {/* =========================================
          HEADER
      ========================================= */}

      <div
        className="
          max-w-7xl
          mx-auto
          px-6
          sm:px-10
          md:px-16
          lg:px-24
          mb-12
        "
      >
        <div
          className="
            flex
            items-end
            justify-between
          "
        >
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
                font-display
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

          {/* COUNTER */}

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
            {String(activeIndex + 1).padStart(
              2,
              "0"
            )}

            {" / "}

            {String(galleryData.length).padStart(
              2,
              "0"
            )}
          </div>
        </div>
      </div>

      {/* =========================================
          GALLERY
      ========================================= */}

      <div className="relative w-full">

        {/* LEFT FADE */}

        <div
          className="
            absolute
            left-0
            top-0
            bottom-0
            w-20
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
            w-20
            md:w-40
            z-20
            pointer-events-none
            bg-linear-to-l
            from-[#080808]
            to-transparent
          "
        />

        {/* =========================================
            CARD STAGE
        ========================================= */}

        <div
          className="
            relative
            w-full
            flex
            justify-center
            items-center
            py-8
            px-6
          "
          style={{
            perspective: "1600px",
          }}
        >
          {/* =======================================
              FLIP CARD
          ======================================= */}

          <div
            className={`
              gallery-flip-card
              relative
              w-[85vw]
              sm:w-[70vw]
              md:w-[60vw]
              lg:w-[52vw]
              max-w-180
              aspect-16/10
              ${
                isFlipping
                  ? "is-flipping"
                  : ""
              }
              ${
                flipDirection === "previous"
                  ? "flip-previous"
                  : "flip-next"
              }
            `}
          >
            <div
              className="
                gallery-flip-inner
                relative
                w-full
                h-full
              "
            >
              {/* =================================
                  FRONT FACE
              ================================= */}

              <div
                className="
                  gallery-flip-face
                  gallery-flip-front
                  absolute
                  inset-0
                  overflow-hidden
                  bg-black
                  border
                  border-white/10
                  group
                "
              >
                <img
                  src={currentImage}
                  alt={`SRISTI Gallery ${
                    activeIndex + 1
                  }`}
                  draggable={false}
                  className="
                    absolute
                    inset-0
                    w-full
                    h-full
                    object-cover
                    transition-transform
                    duration-500
                    group-hover:scale-105
                  "
                />

                {/* DARK OVERLAY */}

                <div
                  className="
                    absolute
                    inset-0
                    bg-black/10
                    group-hover:translate-x-200
                    transition-all
                    duration-500
                    pointer-events-none
                  "
                />

                {/* PHOTO DESCRIPTION */}

                <div
                  className="
                    gallery-description
                    absolute
                    left-0
                    right-0
                    bottom-0
                    z-20
                    px-5
                    sm:px-7
                    md:px-9
                    pb-5
                    sm:pb-6
                    md:pb-8
                    pt-12
                    pointer-events-none
                  "
                >
                  <p className="gallery-description-text">
                    {currentDescription}
                  </p>
                </div>

                {/* TOP LEFT */}

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

                {/* BOTTOM RIGHT */}

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
                    top-5
                    right-5
                    z-10
                    px-3
                    py-2
                    bg-black/60
                    backdrop-blur-md
                    border
                    border-white/10
                    font-mono
                    text-[10px]
                    tracking-[0.25em]
                    text-white/70
                  "
                >
                  FILE{" "}
                  {String(
                    activeIndex + 1
                  ).padStart(3, "0")}
                </div>

                {/* LABEL */}

                <div
                  className="
                    absolute
                    bottom-5
                    left-5
                    z-10
                    font-mono
                    text-[10px]
                    tracking-[0.3em]
                    text-pink-400
                  "
                >
                  SRISTI 2K26
                </div>
              </div>

              {/* =================================
                  BACK FACE
              ================================= */}

              <div
                className="
                  gallery-flip-face
                  gallery-flip-back
                  absolute
                  inset-0
                  overflow-hidden
                  bg-black
                  border
                  border-pink-500/30
                "
              >
                <img
                  src={backImage}
                  alt={`SRISTI Gallery ${
                    flipDirection ===
                    "previous"
                      ? previousIndex + 1
                      : nextIndex + 1
                  }`}
                  draggable={false}
                  className="
                    absolute
                    inset-0
                    w-full
                    h-full
                    object-cover
                  "
                />

                <div
                  className="
                    absolute
                    inset-0
                    bg-black/20
                    pointer-events-none
                  "
                />

                {/* PINK EDGE */}

                <div
                  className="
                    absolute
                    top-0
                    left-0
                    w-full
                    h-px
                    bg-pink-500
                    shadow-[0_0_15px_rgba(236,72,153,0.8)]
                  "
                />

                {/* FILE NUMBER */}

                <div
                  className="
                    absolute
                    top-5
                    right-5
                    z-10
                    px-3
                    py-2
                    bg-black/60
                    backdrop-blur-md
                    border
                    border-pink-500/20
                    font-mono
                    text-[10px]
                    tracking-[0.25em]
                    text-pink-400
                  "
                >
                  FILE{" "}
                  {String(
                    flipDirection ===
                      "previous"
                      ? previousIndex + 1
                      : nextIndex + 1
                  ).padStart(3, "0")}
                </div>

                <div
                  className="
                    absolute
                    bottom-5
                    left-5
                    z-10
                    font-mono
                    text-[10px]
                    tracking-[0.3em]
                    text-pink-400
                  "
                >
                  SRISTI 2K26
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================
            PREVIOUS
        ========================================= */}

        <button
          type="button"
          onClick={previousSlide}
          disabled={isFlipping}
          aria-label="Previous image"
          className="
            absolute
            left-4
            md:left-8
            lg:left-12
            top-1/2
            -translate-y-1/2
            z-40
            w-11
            h-11
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
            disabled:opacity-40
            disabled:pointer-events-none
          "
        >
          <ChevronLeft size={22} />
        </button>

        {/* =========================================
            NEXT
        ========================================= */}

        <button
          type="button"
          onClick={nextSlide}
          disabled={isFlipping}
          aria-label="Next image"
          className="
            absolute
            right-4
            md:right-8
            lg:right-12
            top-1/2
            -translate-y-1/2
            z-40
            w-11
            h-11
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
            disabled:opacity-40
            disabled:pointer-events-none
          "
        >
          <ChevronRight size={22} />
        </button>
      </div>

      {/* =========================================
          INDICATORS
      ========================================= */}

      <div
        className="
          flex
          items-center
          justify-center
          gap-2
          mt-6
        "
      >
        {galleryData.map((_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => {
              if (!isFlipping) {
                scrollToSlide(index);
              }
            }}
            aria-label={`Go to image ${
              index + 1
            }`}
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
    </section>
  );
};

export default Gallery;