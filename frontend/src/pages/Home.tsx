import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Volume2,
  VolumeX,
  Video,
  Image as ImageIcon,
} from "lucide-react";

import Navbar from "../components/Navbar";

import homeBg from "../assets/images/home_bg.jpeg";
import homeVideo from "../assets/videos/home_bg_vid.mp4";
import Sristi from "../assets/icons/logo_updated.png";
import SponsorSlider from "../components/SponsorSlider";
import AboutSection from "../components/AboutSection";
import Gallery from "../components/Gallary";
import Contact from "../components/Contact";

const Home = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isVideo, setIsVideo] = useState(true);
  const [isMuted, setIsMuted] = useState(true);

  const toggleBackground = () => {
    setIsVideo((previous) => !previous);
  };

  const toggleMusic = () => {
    const video = videoRef.current;

    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  return (
    <main className="min-h-screen bg-[#080808] text-white">
      <section className="relative min-h-screen overflow-hidden">

        {/* =========================================
            BACKGROUND VIDEO
        ========================================= */}

        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          className={`
            fixed
            z-0
            inset-0
            w-full
            h-full
            object-cover
            transition-opacity
            duration-700
            ${
              isVideo
                ? "opacity-100"
                : "opacity-0"
            }
          `}
        >
          <source src={homeVideo} type="video/mp4" />
        </video>

        {/* =========================================
            BACKGROUND IMAGE
        ========================================= */}

        <div
          className={`
            fixed
            z-0
            inset-0
            bg-cover
            bg-center
            bg-no-repeat
            transition-opacity
            duration-700
            ${
              isVideo
                ? "opacity-0"
                : "opacity-100"
            }
          `}
          style={{
            backgroundImage: `url(${homeBg})`,
          }}
        />

        {/* =========================================
            DARK OVERLAY
        ========================================= */}

        <div className="fixed z-1 inset-0 bg-black/55" />

        {/* =========================================
            NAVBAR
        ========================================= */}

        <Navbar />

       {/* =========================================
            HERO
        ========================================= */}

        <div
          className="
            relative
            z-10
            min-h-screen
            flex
            items-center
            justify-center
            text-center
            px-6
            pt-10
          "
        >
          <div
            className="
              flex
              flex-col
              items-center
              justify-center
              w-full
              max-w-6xl
            "
          >

            {/* =========================================
                TOP TEXT
            ========================================= */}

            <p
              className="
                font-mono
                text-xs
                sm:text-sm
                md:text-base
                tracking-[0.35em]
                sm:tracking-[0.5em]
                uppercase
                text-white/80
              "
            >
              Players enter the arena
            </p>


            {/* =========================================
                SRISTI
            ========================================= */}

            <div
              className="
                sristi-logo
                relative
                w-90
                sm:w-100
                md:w-110
                lg:w-120
                mt-10
                mb-10
              "
            >
              {/* Original logo */}
              <img
                src={Sristi}
                alt="SRISTI"
                className="relative z-10 w-full h-auto"
              />

              {/* Animated light masked by the logo */}
              <span
                className="sristi-neon-sweep"
                style={{
                  maskImage: `url(${Sristi})`,
                  WebkitMaskImage: `url(${Sristi})`,
                }}
              />
            </div>


            {/* =========================================
                CIRCLE — SQUARE — TRIANGLE
            ========================================= */}

            <div
              className="
                flex
                items-center
                justify-center
                gap-3
                sm:gap-5
                md:gap-7
              "
            >

              {/* CIRCLE */}

              <div
                className="
                  w-8
                  h-8
                  sm:w-10
                  sm:h-10
                  md:w-12
                  md:h-12
                  rounded-full
                  border-[3px]
                  border-pink-500
                  shadow-[0_0_15px_rgba(236,72,153,0.55)]
                  transition-all
                  duration-300
                  hover:scale-105
                  hover:shadow-[0_0_30px_rgba(236,72,153,0.8)]
                "
              />


              {/* SQUARE */}

              <div
                className="
                  w-24
                  h-10
                  sm:w-28
                  sm:h-12
                  md:w-32
                  md:h-14
                  border-[3px]
                  border-pink-500
                  flex
                  items-center
                  justify-center
                  bg-black/20
                  backdrop-blur-sm
                  shadow-[0_0_20px_rgba(236,72,153,0.55)]
                  transition-all
                  duration-300
                  hover:scale-105
                  hover:shadow-[0_0_35px_rgba(236,72,153,0.8)]
                "
              >
                <span
                  className="
                    font-mono
                    text-xl
                    sm:text-2xl
                    md:text-3xl
                    font-bold
                    tracking-[0.08em]
                    text-white
                  "
                >
                  2<span className="text-pink-500">K</span>26
                </span>
              </div>


              {/* TRIANGLE */}

              <div
                className="
                  relative
                  w-8
                  h-8
                  sm:w-10
                  sm:h-10
                  md:w-12
                  md:h-12
                  flex
                  items-center
                  justify-center
                  transition-all
                  duration-300
                  hover:scale-105
                "
              >
                <svg
                  viewBox="0 0 100 100"
                  className="
                    w-full
                    h-full
                    overflow-visible
                    drop-shadow-[0_0_8px_rgba(236,72,153,0.7)]
                  "
                >
                  <polygon
                    points="50,8 92,88 8,88"
                    fill="transparent"
                    stroke="#ec4899"
                    strokeWidth="4"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

            </div>


            {/* =========================================
                TAGLINE
            ========================================= */}

            <p
              className="
                font-ui
                mt-8
                md:mt-10
                max-w-4xl
                text-xs
                sm:text-sm
                md:text-base
                lg:text-lg
                tracking-[0.12em]
                sm:tracking-[0.18em]
                uppercase
                text-white/80
              "
            >
              The Largest Techno Management Fest of North Bengal
            </p>


            {/* =========================================
                EXPLORE BUTTON
            ========================================= */}

            <Link
              to="/events"
              className="
                group
                relative
                mt-8
                md:mt-10
                px-10
                py-3.5
                md:px-12
                md:py-4
                border
                border-pink-500
                bg-black/20
                backdrop-blur-sm
                overflow-hidden
                font-ui
                text-xs
                sm:text-sm
                font-semibold
                tracking-[0.3em]
                text-white
                transition-all
                duration-300
                hover:text-black
                hover:bg-pink-500
                hover:shadow-[0_0_30px_rgba(236,72,153,0.6)]
              "
            >
              <span className="relative z-10">
                EXPLORE
              </span>

              {/* Hover sweep */}

              <span
                className="
                  absolute
                  inset-0
                  bg-white/20
                  -translate-x-full
                  transition-transform
                  duration-500
                  group-hover:translate-x-0
                "
              />
            </Link>

          </div>
        </div>

        {/* About Section */}

        <AboutSection />
        
        {/*SPONSORS*/}

        <SponsorSlider />

        {/* Gallery Section */}

        <Gallery />

        {/* Contact Section */}

        <Contact />

        {/* =========================================
            BACKGROUND CONTROLS
        ========================================= */}

        <div
          className="
            fixed
            bottom-6
            right-6
            sm:bottom-8
            sm:right-8
            md:bottom-14
            md:right-12
            z-50
            flex
            rounded-full
            border
            border-white/20
            bg-black/40
            backdrop-blur-xl
            items-center
            gap-2
            p-1
          "
        >

          {/* BACKGROUND TOGGLE */}

          <button
            type="button"
            onClick={toggleBackground}
            aria-label={
              isVideo
                ? "Switch to image background"
                : "Switch to video background"
            }
            className="
              group
              h-8
              w-8
              sm:w-10
              sm:h-10
              md:w-13
              md:h-13
              flex
              items-center
              justify-center
              rounded-full
              shadow-[1_1_10px_rgba(0,0,0,0.55)]
              bg-black/10
              backdrop-blur-xl
              text-white
              hover:text-pink-500
              hover:border-pink-500/70
              hover:bg-black/60
              transition-all
              duration-300
              hover:shadow-[0_0_20px_rgba(236,72,153,0.35)]
            "
          >
            {isVideo ? (
              <ImageIcon size={18} />
            ) : (
              <Video size={18} />
            )}
          </button>

          {/* MUSIC TOGGLE */}

          <button
            type="button"
            onClick={toggleMusic}
            aria-label={
              isMuted
                ? "Turn music on"
                : "Turn music off"
            }
            className="
              group
              h-8
              w-8
              sm:w-10
              sm:h-10
              md:w-13
              md:h-13
              flex
              items-center
              justify-center
              rounded-full
              shadow-[1_1_10px_rgba(0,0,0,0.55)]
              bg-black/10
              backdrop-blur-xl
              text-white
              hover:text-pink-500
              hover:border-pink-500/70
              hover:bg-black/60
              transition-all
              duration-300
              hover:shadow-[0_0_20px_rgba(236,72,153,0.35)]
            "
          >
            {isMuted ? (
              <VolumeX size={18} />
            ) : (
              <Volume2 size={18} />
            )}
          </button>

        </div>

      </section>
    </main>
  );
};

export default Home;