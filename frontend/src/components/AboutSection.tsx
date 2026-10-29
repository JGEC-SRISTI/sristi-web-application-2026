import RevealOnScroll from "./RevealOnScroll";
import { Volume2, VolumeX } from "lucide-react";

// import sristiVideo from "../assets/videos/sristi_about.mp4";
import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

const AboutSection = () => {
    const youtubePlayerRef = useRef<any>(null);
    const [isMuted, setIsMuted] = useState(true);

    useEffect(() => {
    const loadYouTubeAPI = () => {
        if (window.YT && window.YT.Player) {
        createPlayer();
        return;
        }

        const existingScript = document.querySelector(
        'script[src="https://www.youtube.com/iframe_api"]'
        );

        if (!existingScript) {
        const script = document.createElement("script");

        script.src =
            "https://www.youtube.com/iframe_api";

        script.async = true;

        document.body.appendChild(script);
        }

        window.onYouTubeIframeAPIReady = createPlayer;
    };

    const createPlayer = () => {
        youtubePlayerRef.current =
        new window.YT.Player("sristi-youtube-player", {
            events: {
            onReady: (event: any) => {
                event.target.mute();
                event.target.playVideo();
            },
            },
        });
    };

    loadYouTubeAPI();

    return () => {
        if (youtubePlayerRef.current) {
        youtubePlayerRef.current.destroy();
        youtubePlayerRef.current = null;
        }
    };
    }, []);

    const toggleVideoSound = () => {
        const player = youtubePlayerRef.current;

        if (!player) return;

        if (isMuted) {
            player.unMute();
            player.setVolume(100);
            setIsMuted(false);
        } else {
            player.mute();
            setIsMuted(true);
        }
    };

  return (
    <section className="relative z-10 w-full overflow-hidden">

      {/* =====================================================
          ABOUT JGEC
      ===================================================== */}

      <section
        className="
          relative
          min-h-[85vh]
          flex
          items-center
          px-6
          sm:px-10
          md:px-16
          lg:px-24
          py-24
          md:py-32
          overflow-hidden
        "
      >

        <div
          className="
            relative
            z-10
            w-full
            max-w-7xl
            mx-auto
          "
        >

          {/* ABOUT */}

          <RevealOnScroll direction="up">

            <p
              className="
                font-mono
                text-xs
                sm:text-sm
                md:text-base
                tracking-[0.45em]
                uppercase
                text-pink-500
                mb-5
              "
            >
              About
            </p>

          </RevealOnScroll>


          {/* COLLEGE NAME */}

          <RevealOnScroll
            direction="left"
            delay={150}
          >

            <h2
              className="
                font-heavy
                text-4xl
                sm:text-5xl
                md:text-6xl
                lg:text-7xl
                xl:text-8xl
                leading-[0.95]
                tracking-wide
                text-white
                max-w-6xl
              "
            >
              JALPAIGURI
              <br />
              GOVERNMENT
              <br />
              ENGINEERING COLLEGE
            </h2>

          </RevealOnScroll>


          {/* DIVIDER */}

          <RevealOnScroll
            direction="up"
            delay={300}
          >

            <div
              className="
                w-24
                h-0.5
                bg-pink-500
                mt-10
                mb-8
                shadow-[0_0_15px_rgba(236,72,153,0.8)]
              "
            />

          </RevealOnScroll>


          {/* DESCRIPTION */}

          <RevealOnScroll
            direction="up"
            delay={400}
          >

            <div className="max-w-5xl">

              <p
                className="
                  font-body
                  text-sm
                  sm:text-base
                  md:text-lg
                  lg:text-xl
                  leading-7
                  md:leading-9
                  text-white/75
                "
              >
                Jalpaiguri Government Engineering College is
                an institution dedicated to engineering
                education, innovation and creativity. It
                provides students with an environment where
                ideas can take shape and technology can be
                transformed into meaningful solutions.
              </p>

              <p
                className="
                  font-body
                  mt-6
                  text-sm
                  sm:text-base
                  md:text-lg
                  lg:text-xl
                  leading-7
                  md:leading-9
                  text-white/75
                "
              >
                With a strong academic environment and a
                vibrant student community, the college
                continues to create opportunities for students
                to explore, compete, collaborate and build
                the skills required for the future.
              </p>

            </div>

          </RevealOnScroll>

        </div>

      </section>


      {/* =====================================================
          ABOUT SRISTI
      ===================================================== */}

      <section
        className="
          relative
          w-full
          px-6
          sm:px-10
          md:px-16
          lg:px-24
          py-24
          md:py-32
        "
      >

        <div
          className="
            relative
            z-10
            max-w-7xl
            mx-auto
          "
        >

          {/* ===============================================
              TITLE
          =============================================== */}

          <RevealOnScroll direction="up">

            <div className="text-center mb-16 md:mb-24">

              <p
                className="
                  font-mono
                  text-xs
                  sm:text-sm
                  tracking-[0.45em]
                  uppercase
                  text-pink-500
                  mb-4
                "
              >
                The Fest
              </p>

              <h2
                className="
                  font-display
                  text-6xl
                  sm:text-7xl
                  md:text-8xl
                  lg:text-9xl
                  tracking-wider
                  text-white
                "
              >
                ABOUT SRISTI
              </h2>

            </div>

          </RevealOnScroll>


          {/* ===============================================
              VIDEO + TEXT
          =============================================== */}

          <div
            className="
              grid
              grid-cols-1
              lg:grid-cols-2
              gap-12
              lg:gap-20
              items-center
            "
          >

            {/* =========================================
                YOUTUBE VIDEO
            ========================================= */}

            <RevealOnScroll
            direction="left"
            >
            <div
                className="
                relative
                w-full
                aspect-4/3
                overflow-hidden
                group
                bg-black
                "
            >

                {/* YouTube Embed */}

                <iframe
                id="sristi-youtube-player"
                className="
                    absolute
                    inset-0
                    w-full
                    h-full
                "
                src="https://www.youtube.com/embed/GFUPBPlxJy8?enablejsapi=1&autoplay=1&mute=1&controls=0&rel=0&iv_load_policy=3&playsinline=1&loop=1&playlist=GFUPBPlxJy8"
                title="SRISTI 2K26"
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                />

                {/* =========================================
                    CUSTOM SOUND BUTTON
                ========================================= */}

                <button
                type="button"
                onClick={toggleVideoSound}
                aria-label={
                    isMuted
                    ? "Turn video sound on"
                    : "Mute video"
                }
                className="
                    absolute
                    bottom-5
                    right-5
                    z-30
                    w-11
                    h-11
                    flex
                    items-center
                    justify-center
                    rounded-full
                    border
                    border-white/20
                    bg-black/60
                    backdrop-blur-xl
                    text-white
                    transition-all
                    duration-300
                    hover:border-pink-500
                    hover:text-pink-500
                    hover:bg-black/80
                    hover:shadow-[0_0_20px_rgba(236,72,153,0.45)]
                "
                >
                {isMuted ? (
                    <VolumeX size={18} />
                ) : (
                    <Volume2 size={18} />
                )}
                </button>


                {/* Pink Border */}

                <div
                className="
                    absolute
                    inset-0
                    pointer-events-none
                    border
                    border-pink-500/40
                    group-hover:border-pink-500
                    transition-all
                    duration-500
                    group-hover:shadow-[0_0_35px_rgba(236,72,153,0.3)]
                "
                />


                {/* Top-left Corner */}

                <div
                className="
                    absolute
                    top-0
                    left-0
                    w-20
                    h-0.5
                    bg-pink-500
                    z-10
                    pointer-events-none
                "
                />

                <div
                className="
                    absolute
                    top-0
                    left-0
                    w-0.5
                    h-20
                    bg-pink-500
                    z-10
                    pointer-events-none
                "
                />


                {/* Bottom-right Corner */}

                <div
                className="
                    absolute
                    bottom-0
                    right-0
                    w-20
                    h-0.5   
                    bg-pink-500
                    z-10
                    pointer-events-none
                "
                />

                <div
                className="
                    absolute
                    bottom-0
                    right-0
                    w-0.5
                    h-20
                    bg-pink-500
                    z-10
                    pointer-events-none
                "
                />

            </div>
            </RevealOnScroll>

            {/* =========================================
                TEXT
            ========================================= */}

            <RevealOnScroll
              direction="right"
              delay={200}
            >

              <div>

                <p
                  className="
                    font-body
                    text-sm
                    sm:text-base
                    md:text-lg
                    lg:text-xl
                    leading-7
                    md:leading-9
                    text-white/75
                  "
                >
                  SRISTI is the techno-management fest of
                  Jalpaiguri Government Engineering College,
                  bringing together technology, innovation,
                  management and creativity under one arena.
                </p>


                <p
                  className="
                    font-body
                    mt-7
                    text-sm
                    sm:text-base
                    md:text-lg
                    lg:text-xl
                    leading-7
                    md:leading-9
                    text-white/75
                  "
                >
                  It is a platform where students come
                  together to compete, collaborate,
                  experiment and showcase their skills
                  through a diverse range of technical,
                  management and creative events.
                </p>


                <p
                  className="
                    font-body
                    mt-7
                    text-sm
                    sm:text-base
                    md:text-lg
                    lg:text-xl
                    leading-7
                    md:leading-9
                    text-white/75
                  "
                >
                  SRISTI 2K26 takes this spirit into a new
                  arena, bringing the energy of technology
                  and competition into an experience designed
                  to challenge, connect and inspire the next
                  generation.
                </p>


                {/* =====================================
                    METADATA
                ===================================== */}

                <div
                  className="
                    mt-10
                    flex
                    flex-wrap
                    gap-x-8
                    gap-y-4
                  "
                >

                  <div>
                    <p
                      className="
                        font-mono
                        text-xs
                        text-pink-500
                        tracking-widest
                      "
                    >
                      EDITION
                    </p>

                    <p className="font-ui text-white mt-1">
                      2K26
                    </p>
                  </div>


                  <div>
                    <p
                      className="
                        font-mono
                        text-xs
                        text-pink-500
                        tracking-widest
                      "
                    >
                      VENUE
                    </p>

                    <p className="font-ui text-white mt-1">
                      JGEC
                    </p>
                  </div>


                  <div>
                    <p
                      className="
                        font-mono
                        text-xs
                        text-pink-500
                        tracking-widest
                      "
                    >
                      CATEGORY
                    </p>

                    <p className="font-ui text-white mt-1">
                      Techno-Management
                    </p>
                  </div>

                </div>

              </div>

            </RevealOnScroll>

          </div>

        </div>

      </section>

    </section>
  );
};

export default AboutSection;