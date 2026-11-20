import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Circle, Square, Triangle } from "lucide-react";
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

          <h2
            className="
              mt-3
              font-heavy-title
              text-3xl
              min-[380px]:text-4xl
              sm:text-5xl
              md:text-6xl
              lg:text-7xl
              tracking-wide
            "
          >
            get in <span className="text-pink-500">touch</span>
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
              <Link to="/accommodation" className="footer-link">Accommodation</Link>
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
              <FooterLegalDialog id="sristi-privacy" label="Privacy Policy">
                <section>
                  <h3 className="mb-1 font-semibold text-white">Information we collect</h3>
                  <p>
                    Google sign-in provides your name and email address. When you complete
                    your participant profile, we also collect your phone number, college,
                    roll number, department, and academic year.
                  </p>
                </section>

                <section>
                  <h3 className="mb-1 font-semibold text-white">How we use your information</h3>
                  <p>
                    Authorized organizers use participant records to verify payments, manage
                    event registrations, and record attendance and results. If you create or
                    join a team, signed-in members of that team can see your name on the roster.
                  </p>
                </section>

                <section>
                  <h3 className="mb-1 font-semibold text-white">Account and browser storage</h3>
                  <p>
                    Supabase stores participant records. Your browser stores your sign-in
                    session so you can stay signed in between visits.
                  </p>
                </section>

                <section>
                  <h3 className="mb-1 font-semibold text-white">Privacy questions</h3>
                  <p>Use the General Queries contact in the homepage footer to reach the organizers.</p>
                </section>
              </FooterLegalDialog>

              <FooterLegalDialog id="sristi-terms" label="Terms" title="Terms & Conditions">
                <p>
                  Welcome to SRISTI 2K26, the techno-management fest of Jalpaiguri
                  Government Engineering College.
                </p>
                <section>
                  <h3 className="mb-1 font-semibold text-white">Use of the site</h3>
                  <p>Use this site for festival information and provide accurate details when registering.</p>
                </section>
                <section>
                  <h3 className="mb-1 font-semibold text-white">Event registrations</h3>
                  <p>
                    Registrations are subject to availability and the rules for each event.
                    Contact the organizers with questions about cancellations.
                  </p>
                </section>
              </FooterLegalDialog>

              <Link to="/events" className="footer-link">
                Games
              </Link>
              <Link to="/dev" className="footer-link">
                Devers
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
          <a
            href="#home-hero"
            aria-label="SRISTI 2K26, back to top"
            className="contact-wordmark focus-visible:outline-2 focus-visible:outline-pink-400"
            style={{
              "--fill-level": `${fillProgress * 100}%`,
            } as React.CSSProperties}
          >
            sristi'26
          </a>
        </div>

      </div>

    </section>
  );
};

interface FooterLegalDialogProps {
  id: string;
  label: string;
  title?: string;
  children: ReactNode;
}

function FooterLegalDialog({ id, label, title = label, children }: FooterLegalDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        className="footer-link text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-pink-400"
        aria-haspopup="dialog"
        aria-controls={`${id}-dialog`}
        onClick={() => dialogRef.current?.showModal()}
      >
        {label}
      </button>
      <dialog
        ref={dialogRef}
        id={`${id}-dialog`}
        aria-labelledby={`${id}-title`}
        className="footer-legal-dialog fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-3xl overflow-y-auto overscroll-contain border border-pink-500/50 bg-[#0d0a0c] text-white shadow-[0_0_40px_rgba(236,72,153,0.18)] backdrop:bg-black/75 backdrop:backdrop-blur-sm"
        onKeyDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          const dialog = event.currentTarget;
          if (event.target !== dialog) return;

          const { left, right, top, bottom } = dialog.getBoundingClientRect();
          const { clientX, clientY } = event;
          if (clientX < left || clientX > right || clientY < top || clientY > bottom) {
            dialog.close();
          }
        }}
      >
        <div className="p-5 sm:p-7">
          <header className="flex items-start justify-between gap-3 border-b border-pink-500/25 pb-4">
            <div>
              <div className="mb-2 flex items-center gap-2.5 text-pink-400">
                <div aria-hidden="true" className="flex items-center gap-1">
                  <Circle size={13} />
                  <Triangle size={13} />
                  <Square size={13} />
                </div>
                <p className="font-mono text-xs tracking-widest">SRISTI 2K26</p>
              </div>
              <h2 id={`${id}-title`} className="font-title text-base leading-snug sm:text-xl">
                {title}
              </h2>
            </div>
            <button
              type="button"
              className="shrink-0 border border-pink-500/45 px-3 py-2 font-mono text-xs text-pink-300 hover:bg-pink-500 hover:text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-400"
              onClick={() => dialogRef.current?.close()}
            >
              Close
            </button>
          </header>

          <div className="mt-4 space-y-4 font-mono text-sm leading-relaxed text-white/75">
            {children}
          </div>
        </div>
      </dialog>
    </>
  );
}

export default Contact;
