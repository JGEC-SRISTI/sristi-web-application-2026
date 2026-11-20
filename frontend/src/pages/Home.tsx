import { useEffect, useRef, useState } from "react";
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
import SponsorSlider from "../components/SponsorSlider";
import AboutSection from "../components/AboutSection";
import Gallery from "../components/Gallary";
import Contact from "../components/Contact";
import pinkSoldier from "../assets/images/pink_soldier.png";
import countdownVideo from "../assets/videos/sristi_countdown.mp4";

const COUNTDOWN_END = new Date("2026-12-01T00:00:00+05:30").getTime();

const getCountdown = (now: number) => {
  const remaining = Math.max(COUNTDOWN_END - now, 0);

  return {
    days: Math.floor(remaining / 86_400_000),
    hours: Math.floor((remaining / 3_600_000) % 24),
    minutes: Math.floor((remaining / 60_000) % 60),
    seconds: Math.floor((remaining / 1_000) % 60),
  };
};

const padCountdownPart = (value: number) => String(value).padStart(2, "0");

const Home = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isVideo, setIsVideo] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [soldierScroll, setSoldierScroll] = useState(0);
  const [countdown, setCountdown] = useState(() => getCountdown(Date.now()));
  const [showCountdown, setShowCountdown] = useState(() => Date.now() < COUNTDOWN_END);
  const [showCountdownButton, setShowCountdownButton] = useState(false);

  useEffect(() => {
    if (!showCountdown) return;

    const updateCountdown = () => {
      const now = Date.now();
      if (now >= COUNTDOWN_END) {
        setCountdown(getCountdown(now));
        setShowCountdown(false);
        setShowCountdownButton(false);
        return;
      }

      setCountdown(getCountdown(now));
    };

    updateCountdown();
    const interval = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(interval);
  }, [showCountdown]);

  useEffect(() => {
    if (!showCountdown) return;

    const timeout = window.setTimeout(() => setShowCountdownButton(true), 5000);
    return () => window.clearTimeout(timeout);
  }, [showCountdown]);

  useEffect(() => {
    const isMobile = window.matchMedia("(max-width: 768px)").matches;

    if (isMobile) {
      setIsVideo(false);
    }
  }, []);

  const toggleBackground = () => {
    setIsVideo((previous) => !previous);
  };

  const toggleMusic = () => {
    const video = videoRef.current;

    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const heroRef = useRef<HTMLDivElement>(null);
  const [heroAnimationKey, setHeroAnimationKey] = useState(0);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;

    let wasVisible = false;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isVisible = entry.isIntersecting;

        if (isVisible && !wasVisible) {
          setHeroAnimationKey((prev) => prev + 1);
        }

        wasVisible = isVisible;
      },
      {
        threshold: 0.35,
      }
    );

    observer.observe(hero);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const hero = heroRef.current;
      if (!hero) return;

      const heroHeight = hero.offsetHeight;
      const scrollProgress = Math.min(
        Math.max(window.scrollY / heroHeight, 0),
        1
      );

      setSoldierScroll(scrollProgress);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (showCountdown) {
    return (
      <main className="countdown-view relative min-h-screen overflow-hidden bg-black text-white">
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src={countdownVideo}
          autoPlay
          loop
          muted
          playsInline
          aria-hidden="true"
        />
        <div className="countdown-overlay absolute inset-0" />

        <div className="countdown-stage relative z-10 flex min-h-screen items-center justify-center px-5 py-10 text-center">
          <div className="countdown-content w-full max-w-5xl">
            <h1 className="countdown-brand font-title leading-none">
              <span className="countdown-sristi">SRISTI</span>{" "}
              <span className="countdown-year">2K26</span>
            </h1>

            <p className="countdown-label font-a24">STARTS IN</p>

            <div
              className="countdown-clock mx-auto mt-3 grid grid-cols-4 items-start"
              aria-label={`${countdown.days} days, ${countdown.hours} hours, ${countdown.minutes} minutes, ${countdown.seconds} seconds until SRISTI 2K26`}
            >
              {[
                [countdown.days, "DAYS"],
                [countdown.hours, "HOURS"],
                [countdown.minutes, "MINUTES"],
                [countdown.seconds, "SECONDS"],
              ].map(([value, label]) => (
                <div className="countdown-unit" key={String(label)}>
                  <span className="countdown-number font-speedy">
                    {padCountdownPart(Number(value))}
                  </span>
                  <span className="countdown-unit-label font-a24">{String(label)}</span>
                </div>
              ))}
            </div>

            {showCountdownButton && (
              <button
                type="button"
                onClick={() => setShowCountdown(false)}
                className="countdown-enter font-space-mono"
              >
                ENTER THE HOME PAGE
              </button>
            )}
          </div>
        </div>
      </main>
    );
  }

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
                ? "opacity-40"
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
                : "opacity-80"
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

        {/* CINEMATIC HERO */}
        <div
        ref={heroRef}
        className="hero-stage relative z-10 min-h-screen flex items-center justify-center px-5 pt-30 pb-16">
          <div className="hero-content w-full max-w-7xl mx-auto text-center">

            {/* Intro label */}
            <p className="hero-eyebrow font-mono text-[10px] sm:text-xs md:text-sm tracking-[0.35em] sm:tracking-[0.6em] uppercase text-white/60 mb-2">
              <span>Players</span>{" "}
              <span className="text-pink-500">enter</span>{" "}
              <span>the arena</span>
            </p>

            {/* SRISTI — horizontal expansion animation */}
            <h1
              key={`sristi-${heroAnimationKey}`}
              className="hero-title font-title text-[clamp(4rem,15vw,13rem)] leading-[0.85] tracking-[0.04em] text-white"
            >
              sristi
            </h1>

            <img
              key={`soldier-${heroAnimationKey}`}
              src={pinkSoldier}
              alt="Pink Soldier"
              className="hero-soldier"
              style={{
                transform: `translateY(${soldierScroll * 300}vh)`,
                opacity: Math.max(0, 1 - soldierScroll),
              }}
            />

            {/* 2K26 — separate horizontal expansion animation */}
            <div
              key={`year-${heroAnimationKey}`}
              className="hero-year font-title mt-2 sm:mt-3 text-[clamp(3rem,10vw,9rem)] leading-none tracking-[0.3em] text-pink-500"
            >
              2k26
            </div>

            {/* Neon divider */}
            <div className="hero-divider mx-auto mt-2 sm:mt-4" />

            {/* Fest description */}
            <p className="hero-tagline font-ui mx-auto mt-7 max-w-3xl text-xs sm:text-sm md:text-base tracking-[0.12em] sm:tracking-[0.2em] uppercase text-white/70">
              The Largest Techno-Management Fest of North Bengal
            </p>

            {/* Explore */}
            <Link
              to="/events"
              className="hero-explore group relative inline-flex items-center justify-center mt-9 sm:mt-12 px-9 py-3.5 sm:px-12 sm:py-4 overflow-hidden border border-pink-500/70 bg-black/30 font-ui text-xs sm:text-sm tracking-[0.25em] text-white transition-all duration-300 hover:bg-pink-500 hover:text-black hover:shadow-[0_0_35px_rgba(236,72,153,0.45)]"
            >
              <span className="relative z-10">ENTER THE ARENA</span>
              <span className="absolute inset-0 -translate-x-full bg-pink-500 transition-transform duration-500 group-hover:translate-x-0" />
            </Link>

            {/* Scroll indicator */}
            <div className="hero-scroll-indicator mt-12 sm:mt-16 flex flex-col items-center gap-2">
              <span className="font-mono text-[9px] tracking-[0.35em] text-white/40">
                SCROLL TO BEGIN
              </span>
              <span className="hero-scroll-line" />
            </div>

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