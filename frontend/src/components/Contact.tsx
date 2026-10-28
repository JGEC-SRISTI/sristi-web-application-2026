import { useEffect, useRef, useState } from "react";
import SristiLogo from "../assets/icons/sristi_logo.png";
import JGECLogo from "../assets/icons/logo1.png";
import { Link } from "react-router-dom";

const Contact = () => {
  const wordmarkRef = useRef<HTMLDivElement>(null);

  const [fillProgress, setFillProgress] = useState(0);

  useEffect(() => {
    let frameId = 0;

    const updateFill = () => {
      const wordmark = wordmarkRef.current;

      if (!wordmark) return;

      /*
       * Position of the wordmark relative to
       * the entire document.
       */
      const wordmarkRect =
        wordmark.getBoundingClientRect();

      const wordmarkTop =
        wordmarkRect.top + window.scrollY;

      /*
       * The scroll range controls the fill.
       *
       * The animation starts when the user has
       * scrolled to approximately the top of the
       * SRISTI wordmark.
       */
      const startScroll =
        wordmarkTop - window.innerHeight * 0.9;

      /*
       * The animation completes after the user
       * scrolls another 70% of the viewport height.
       */
      const endScroll =
        wordmarkTop - window.innerHeight * 0.5;

      const scrollRange =
        endScroll - startScroll;

      const progress =
        (window.scrollY - startScroll) /
        scrollRange;

      const clampedProgress = Math.min(
        1,
        Math.max(0, progress)
      );

      setFillProgress(clampedProgress);
    };

    const handleScroll = () => {
      if (frameId) return;

      frameId = window.requestAnimationFrame(() => {
        updateFill();
        frameId = 0;
      });
    };

    /*
     * Initial calculation
     */
    updateFill();

    window.addEventListener(
      "scroll",
      handleScroll,
      { passive: true }
    );

    window.addEventListener(
      "resize",
      updateFill
    );

    return () => {
      window.removeEventListener(
        "scroll",
        handleScroll
      );

      window.removeEventListener(
        "resize",
        updateFill
      );

      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, []);

  return (
    <section
      className="
        relative
        w-full
        overflow-hidden
        bg-black/40
        text-white
        py-24
        md:py-32
      "
    >
      {/* =========================================
          CONTACT CONTENT
      ========================================= */}

      <div
        className="
          relative
          z-10
          mx-auto
          max-w-7xl
          px-4
          sm:px-6
          md:px-8
          lg:px-10
        "
      >

        {/* HEADER */}

        <div className="mb-10 md:mb-14">

          <p
            className="
              font-mono
              text-xs
              tracking-[0.45em]
              uppercase
              text-pink-500
            "
          >
            Get In Touch
          </p>

          <h2
            className="
              mt-3
              font-display
              text-5xl
              sm:text-6xl
              md:text-7xl
              tracking-wider
            "
          >
            CONTACT US
          </h2>

        </div>


        {/* =========================================
            CONTACT CARDS
        ========================================= */}

        <div
          className="
            grid
            grid-cols-1
            lg:grid-cols-2
            gap-15
          "
        >
          <div className="contact-card">
            <div>
              <p
                className="
                  font-ui
                  text-lg
                  sm:text-xl
                  font-semibold
                "
              >
                Arka Prava Mukhopadhyay
              </p>

              <p
                className="
                  mt-1
                  font-mono
                  text-xs
                  tracking-widest
                  text-white/40
                "
              >
                GENERAL QUERIES
              </p>
            </div>

            <a
              href="tel:+919123329667"
              className="contact-phone"
            >
              +91 91233 29667
            </a>
          </div>

          <div className="contact-card">
            <div>
              <p
                className="
                  font-ui
                  text-lg
                  sm:text-xl
                  font-semibold
                "
              >
                Biswanath Das
              </p>

              <p
                className="
                  mt-1
                  font-mono
                  text-xs
                  tracking-widest
                  text-white/40
                "
              >
                EVENT QUERIES
              </p>
            </div>

            <a
              href="tel:+918388011868"
              className="contact-phone"
            >
              +91 83880 11868
            </a>
          </div>
        </div>

        {/* FOOTER */}

        <div className="flex flex-row justify-between
        mt-5 md:mt-15 items-start">
            <div className="logo-text 
            flex flex-col gap-3
            w-1/3">
                <Link
                    to="/"
                    className="flex items-center gap-3 group"
                >

                    {/* jgec logo */}
                    <img
                    src={JGECLogo}
                    alt="JGEC Logo"
                    className="w-20 h-20 group-hover:scale-90 transition-transform duration-300"
                    ></img>

                    {/* Logo Text */}
                    <div className="leading-none">

                    <img src={SristiLogo} alt="SRISTI Logo" className="h-20 group-hover:scale-110 transition-transform duration-300" />

                    </div>

                </Link>

                <h4 className="font-regular 
                hover:text-pink-500 text-white/80
                transition-all 
                text-md">
                  SRISTI - The Creation, The root of Innovation and Competitive Culture in Jalpaiguri Government Engineering College.
                </h4>
            </div>

            <div className="navigation flex flex-col gap-4 text-start items-start justify-baseline px-5 max-w-1/5">
                <h4 className="font-style text-white/80
                text-md
                border-b-2 border-white/60 pb-2 pl-1 pr-10">
                  Navigation
                </h4>
                <div className="naviglink flex flex-col gap-3 pl-1">
                  <Link to="/" className="font-regular text-white/60 hover:text-pink-500 transition-colors text-md tracking-widest">
                    Home
                  </Link>
                  <Link to="/committee" className="font-regular text-white/60 hover:text-pink-500 transition-colors text-md tracking-widest">
                    Staffs
                  </Link>
                  <Link to="/events" className="font-regular text-white/60 hover:text-pink-500 transition-colors text-md tracking-widest">
                    Games
                  </Link>
                  <Link to="/profile" className="font-regular text-white/60 hover:text-pink-500 transition-colors text-md tracking-widest">
                    Profile
                  </Link>
                </div>
            </div>

            <div className="location flex flex-col gap-4 text-start items-start justify-baseline px-5 max-w-1/5">
                <h4 className="font-style text-white/80
                text-md
                border-b-2 border-white/60 pb-2 pl-1 pr-10">
                  Located At
                </h4>
                <a href="https://www.google.com/maps/place/Jalpaiguri+Government+Engineering+College/@26.5459447,88.7011792,17z/data=!3m1!5s0x39e47bce83e33715:0xa93214f833105cbf!4m14!1m7!3m6!1s0x39e47bce687f169d:0x4152036d0d736d37!2sJalpaiguri+Government+Engineering+College!8m2!3d26.5459447!4d88.7037541!16s%2Fg%2F122drs1t!3m5!1s0x39e47bce687f169d:0x4152036d0d736d37!8m2!3d26.5459447!4d88.7037541!16s%2Fg%2F122drs1t?entry=ttu&g_ep=EgoyMDI2MDkzMC4wIKXMDSoASAFQAw%3D%3D" 
                   target="_blank" rel="noopener noreferrer" 
                   className="font-regular text-white/60 hover:text-pink-500 text-md">
                  Jalpaiguri Government Engineering College, <br />
                  Denguajhar, Jalpaiguri,<br />
                  735102, <br />
                  West Bengal, India
                </a>
            </div>

            <div className="follow flex flex-col gap-4 text-start items-start justify-baseline px-5 max-w-1/5">
                <h4 className="font-style text-white/80
                text-md
                border-b-2 border-white/60 pb-2 pl-1 pr-11">
                  Follow Us
                </h4>
                <div className="social flex flex-row gap-1">
                  <a href="https://www.linkedin.com/company/sristi-jgec/" 
                  target="_blank" rel="noopener noreferrer" 
                  className="font-regular text-white/60 
                  hover:text-pink-500 hover:scale-105 
                  transition-all duration-250">
                    <i className="bx bxl-linkedin-square text-6xl"></i>
                  </a>

                  <a href="https://www.instagram.com/sristi.jgec/" 
                  target="_blank" rel="noopener noreferrer" 
                  className="font-regular text-white/60 
                  hover:text-pink-500 hover:scale-105 
                  transition-all duration-250">
                    <i className="bx bxl-instagram text-6xl"></i>
                  </a>

                  <a href="https://www.youtube.com/@sristi-jgec" 
                  target="_blank" rel="noopener noreferrer" 
                  className="font-regular text-white/60 
                  hover:text-pink-500 hover:scale-105 
                  transition-all duration-250">
                    <i className="bx bxl-youtube text-6xl"></i>
                  </a>
                </div>
            </div>

            <div className="legal flex flex-col gap-4 text-start items-start justify-baseline px-5 max-w-1/5">
                <h4 className="font-style text-white/80
                text-md
                border-b-2 border-white/60 pb-2 pl-1 pr-10">
                  Legal
                </h4>
                <div className="legal-links flex flex-col gap-3 pl-1">
                  <a href="/privacy-policy" className="font-regular text-white/60 hover:text-pink-500 transition-colors text-md tracking-widest">
                    Privacy Policy
                  </a>
                  <Link to="/terms" className="font-regular text-white/60 hover:text-pink-500 transition-colors text-md tracking-widest">
                    Terms
                  </Link>
                  <Link to="/events" className="font-regular text-white/60 hover:text-pink-500 transition-colors text-md tracking-widest">
                    Games
                  </Link>
                </div>
            </div>
        </div>

        {/* =========================================
            SRISTI WORDMARK
        ========================================= */}

        <div
          ref={wordmarkRef}
          className="
            contact-wordmark-wrapper
          "
        >

          {/* OUTLINE */}

          <div
            className="
              contact-wordmark
              contact-wordmark-outline
            "
          >
            sristi'26
          </div>


          {/* FILLED VERSION */}

          <div
            className="
              contact-wordmark
              contact-wordmark-fill
            "
            aria-hidden="true"
            style={{
              clipPath: `inset(
                ${80 - fillProgress * 100}%
                0
                0
                0
              )`,
            }}
          >
            sristi'26
          </div>

        </div>

      </div>

    </section>
  );
};

export default Contact;