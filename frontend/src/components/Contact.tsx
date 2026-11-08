import { useEffect, useRef, useState } from "react";
import SristiLogo from "../assets/icons/logo.png";
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

      const rect = wordmark.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      // Start filling when the wordmark reaches 90% viewport height.
      const startPoint = viewportHeight * 0.7;

      // Complete filling when its top reaches 25% viewport height.
      const endPoint = viewportHeight * 0.4;

      const progress =
        (startPoint - rect.top) /
        (startPoint - endPoint);

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

    updateFill();

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    window.addEventListener("resize", handleScroll);

    // Recalculate after the custom font has loaded.
    document.fonts.ready.then(() => {
      updateFill();
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);

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
        py-14
        sm:py-20
        md:py-28
        lg:py-32
      "
    >
      {/* =========================================
          CONTACT CONTENT
      ========================================= */}

      <div
        className="
          relative
          z-10
          w-full max-w-[1600px] mx-auto px-5 sm:px-8 lg:px-12
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
              font-heavy-title
              text-4xl
              min-[380px]:text-5xl
              sm:text-6xl
              md:text-7xl
              lg:text-8xl
              tracking-wide
            "
          >
            contact us
          </h2>

        </div>


        {/* =========================================
            CONTACT CARDS
        ========================================= */}

        <div
          className="
            grid
            grid-cols-1
            md:grid-cols-2
            gap-5
            md:gap-8
            lg:gap-12
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

        <div
          className="
            grid
            grid-cols-2
            sm:grid-cols-3
            lg:grid-cols-[1.35fr_0.8fr_1.2fr_0.85fr_0.65fr]
            gap-x-5
            md:gap-x-8
            lg:gap-x-10
            gap-y-10
            mt-12
            md:mt-16
            lg:mt-20
            items-start
            w-full
          "
        >
          {/* BRAND */}

          <div className="col-span-2 sm:col-span-3 lg:col-span-1 flex flex-col gap-4 min-w-0">
            <Link to="/" className="flex items-center gap-2 sm:gap-3 group w-fit">
              <img
                src={JGECLogo}
                alt="JGEC Logo"
                className="w-14 h-14 sm:w-16 sm:h-16 lg:w-14 lg:h-14 object-contain group-hover:scale-90 transition-transform duration-300"
              />

              <img
                src={SristiLogo}
                alt="SRISTI Logo"
                className="h-14 sm:h-16 lg:h-14 object-contain group-hover:scale-110 transition-transform duration-300"
              />
            </Link>

            <h4 className="footer-brand-description font-regular text-sm sm:text-base text-white/80 font-regular leading-relaxed hover:text-pink-500 transition-colors">
              SRISTI - The Creation, The root of Innovation and Competitive
              Culture in Jalpaiguri Government Engineering College.
            </h4>
          </div>

          {/* NAVIGATION */}

          <div className="flex flex-col gap-4 min-w-0">
            <h4 className="footer-heading">Navigation</h4>

            <div className="flex flex-col gap-3 pl-1">
              <Link to="/" className="footer-link">Home</Link>
              <Link to="/committee" className="footer-link">Staffs</Link>
              <Link to="/events" className="footer-link">Games</Link>
              <Link to="/profile" className="footer-link">Profile</Link>
            </div>
          </div>

          {/* LOCATION */}

          <div className="flex flex-col gap-4 min-w-0">
            <h4 className="footer-heading">Located At</h4>

            <a
              href="https://www.google.com/maps/place/Jalpaiguri+Government+Engineering+College/@26.5459447,88.7011792,17z/data=!3m1!5s0x39e47bce83e33715:0xa93214f833105cbf!4m14!1m7!3m6!1s0x39e47bce687f169d:0x4152036d0d736d37!2sJalpaiguri+Government+Engineering+College!8m2!3d26.5459447!4d88.7037541!16s%2Fg%2F122drs1t!3m5!1s0x39e47bce687f169d:0x4152036d0d736d37!8m2!3d26.5459447!4d88.7037541!16s%2Fg%2F122drs1t"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-location footer-link leading-relaxed"
            >
              Jalpaiguri Government Engineering College,
              Denguajhar, Jalpaiguri,
              735102, West Bengal, India
            </a>
          </div>

          {/* SOCIAL */}

          <div className="flex flex-col gap-4 min-w-0">
            <h4 className="footer-heading">Follow Us</h4>

            <div className="flex flex-wrap gap-2 sm:gap-3">
              <a
                href="https://www.linkedin.com/company/sristi-jgec/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="footer-social"
              >
                <i className="bx bxl-linkedin-square" />
              </a>

              <a
                href="https://www.instagram.com/sristi.jgec/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="footer-social"
              >
                <i className="bx bxl-instagram" />
              </a>

              <a
                href="https://www.youtube.com/@sristi-jgec"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                className="footer-social"
              >
                <i className="bx bxl-youtube" />
              </a>
            </div>
          </div>

          {/* LEGAL */}

          <div className="flex flex-col gap-4 min-w-0">
            <h4 className="footer-heading">Legal</h4>

            <div className="flex flex-col gap-3 pl-1">
              <a
                href="/privacy-policy"
                className="footer-link"
              >
                Privacy Policy
              </a>

              <Link to="/terms" className="footer-link">
                Terms
              </Link>

              <Link to="/events" className="footer-link">
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
          className="contact-wordmark-wrapper"
        >
          <div
            className="contact-wordmark"
            style={{
              "--fill-level": `${fillProgress * 100}%`,
            } as React.CSSProperties}
          >
            sristi'26
          </div>
        </div>

      </div>

    </section>
  );
};

export default Contact;