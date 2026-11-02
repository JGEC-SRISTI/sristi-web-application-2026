import RevealOnScroll from "./RevealOnScroll";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
} from "lucide-react";

import pinkSoldier from "../assets/images/pink_sol_phone.png";
import sristiVideo from "../assets/videos/sristi_about.mp4";
import handImage from "../assets/images/hand.png";
import card1Image from "../assets/images/card1.png";
import card2Image from "../assets/images/card2.png";

import { useEffect, useRef, useState } from "react";

const AboutSection = () => {
    const jgecRef = useRef<HTMLElement>(null);
    const [jgecVisible, setJgecVisible] = useState(false);
    const [jgecTypedCharacters, setJgecTypedCharacters] = useState(0);

    useEffect(() => {
      const section = jgecRef.current;
      if (!section) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          setJgecVisible(entry.isIntersecting);
        },
        {
          threshold: 0.2,
        }
      );

      observer.observe(section);

      return () => observer.disconnect();
    }, []);

    useEffect(() => {
      if (!jgecVisible) {
        setJgecTypedCharacters(0);
        return;
      }

      setJgecTypedCharacters(0);

      const timer = window.setInterval(() => {
        setJgecTypedCharacters((current) => {
          if (current >= totalJgecCharacters) {
            window.clearInterval(timer);
            return totalJgecCharacters;
          }

          return current + 1;
        });
      }, 16);

      return () => window.clearInterval(timer);
    }, [jgecVisible]);

    // About SRISTI animation
    const sristiSectionRef = useRef<HTMLElement>(null);
    const [sristiVisible, setSristiVisible] = useState(false);
    const [typedCharacters, setTypedCharacters] = useState(0);

    const sristiParagraphs = [
      `SRISTI is the techno-management fest of Jalpaiguri Government Engineering College, bringing together technology, innovation, management and creativity under one arena. A platform where students come together to compete, collaborate, experiment and showcase their skills through a diverse range of technical, management and creative events.`,

      `15 Years of excellence in Tech and Innovation. <`,
      `25+ Unique events with attractive prizes. <`,
      `Above ₹2,00,000 worth prizes & gifts. <`,
      `A fabolous week of Workshops and Pre-events. <`,
      `05 days all with technology. <`,
      `15+ partner institutes involved. <`,
    ];

    const totalCharacters = sristiParagraphs.reduce(
      (total, paragraph) => total + paragraph.length,
      0
    );

    const jgecParagraphs = [
      `Jalpaiguri Government Engineering College is an institution dedicated to engineering education, innovation and creativity. It provides students with an environment where ideas can take shape and technology can be transformed into meaningful solutions.`,

      `With a strong academic environment and a vibrant student community, the college continues to create opportunities for students to explore, compete, collaborate and build the skills required for the future.`,
    ];

    const totalJgecCharacters = jgecParagraphs.join("").length;

    // Detect when About SRISTI enters or leaves the viewport
    useEffect(() => {
      const section = sristiSectionRef.current;
      if (!section) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          setSristiVisible(entry.isIntersecting);

          if (!entry.isIntersecting) {
            setTypedCharacters(0);
          }
        },
        {
          threshold: 0.15,
        }
      );

      observer.observe(section);

      return () => observer.disconnect();
    }, []);


    // Typing animation
    useEffect(() => {
      if (!sristiVisible) return;

      setTypedCharacters(0);

      const timer = window.setInterval(() => {
        setTypedCharacters((current) => {
          if (current >= totalCharacters) {
            window.clearInterval(timer);
            return totalCharacters;
          }

          return current + 1;
        });
      }, 16);

      return () => window.clearInterval(timer);
    }, [sristiVisible]);

    const videoRef = useRef<HTMLVideoElement>(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);

    useEffect(() => {
      const section = sristiSectionRef.current;
      if (!section) return;

      let playTimer: number | undefined;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setSristiVisible(true);

            // Let the soldier and phone entrance animation finish.
            playTimer = window.setTimeout(() => {
              videoRef.current?.play().catch(() => {
                // Playback may require the visitor to press Play.
              });
            }, 1200);
          } else {
            setSristiVisible(false);

            if (playTimer) {
              window.clearTimeout(playTimer);
            }

            const video = videoRef.current;

            if (video) {
              video.pause();
              video.currentTime = 0;
            }

            setIsPlaying(false);
            setProgress(0);
          }
        },
        { threshold: 0.2 }
      );

      observer.observe(section);

      return () => {
        observer.disconnect();

        if (playTimer) {
          window.clearTimeout(playTimer);
        }
      };
    }, []);

    const togglePlay = () => {
      const video = videoRef.current;
      if (!video) return;

      if (video.paused) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    };

    const toggleMute = () => {
      const video = videoRef.current;
      if (!video) return;

      video.muted = !video.muted;
      setIsMuted(video.muted);
    };

    const updateProgress = () => {
      const video = videoRef.current;
      if (!video || !video.duration) return;

      setProgress((video.currentTime / video.duration) * 100);
    };

    const seekVideo = (value: number) => {
      const video = videoRef.current;
      if (!video || !video.duration) return;

      video.currentTime = (value / 100) * video.duration;
      setProgress(value);
    };

    const toggleFullscreen = async () => {
      const video = videoRef.current;
      if (!video) return;

      try {
        if (document.fullscreenElement) {
          await document.exitFullscreen();
        } else {
          await video.requestFullscreen();
        }
      } catch {
        // Fullscreen may not be supported by the current browser.
      }
    };

    const formatTime = (time: number) => {
      if (!Number.isFinite(time)) return "0:00";

      const minutes = Math.floor(time / 60);
      const seconds = Math.floor(time % 60);

      return `${minutes}:${String(seconds).padStart(2, "0")}`;
    };

    const highlightWords = [
      "15",
      "25+",
      "₹2,00,000",
      "Workshops and Pre-events",
      "05",
      "15+",
    ];

    const renderHighlightedText = (text: string) => {
      const pattern = new RegExp(
        `(${highlightWords
          .sort((a, b) => b.length - a.length)
          .map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
          .join("|")})`,
        "gi"
      );

      return text.split(pattern).map((part, index) =>
        highlightWords.some(
          (word) => word.toLowerCase() === part.toLowerCase()
        ) ? (
          <span key={index} className="text-pink-500 font-semibold">
            {part}
          </span>
        ) : (
          part
        )
      );
    };

  return (
    <section className="relative z-10 w-full overflow-hidden">

      {/* =====================================================
          ABOUT JGEC — CINEMATIC INVITATION
      ===================================================== */}

      <section
        ref={jgecRef}
        className={`jgec-section relative min-h-[90vh] flex items-center px-6 sm:px-10 md:px-16 lg:px-24 overflow-hidden ${
          jgecVisible ? "jgec-visible" : ""
        }`}
      >
        {/* Ambient pink lighting */}
        <div className="jgec-ambient-glow" />

        <div className="relative z-10 w-full max-w-7xl mx-auto">

          <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-10 lg:gap-5">

            {/* LEFT — COLLEGE INFORMATION */}

            <div className="relative z-10">

              <p className="jgec-eyebrow font-mono text-xs sm:text-sm tracking-[0.45em] uppercase text-pink-500 mb-5">
                About
              </p>

              <h2 className="jgec-heading font-heavy-title text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl leading-[0.95] tracking-wide text-white">
                JALPAIGURI
                <br />
                GOVERNMENT
                <br />
                ENGINEERING COLLEGE
              </h2>

              <div className="jgec-divider mt-10 mb-8" />

              <div className="jgec-description max-w-2xl space-y-6 text-left border-l-4 border-pink-500 pl-4 rounded-md tracking-tight">
                <p className="font-body text-sm sm:text-base md:text-lg lg:text-xl leading-7 md:leading-9 text-white/75">
                  {jgecParagraphs[0].slice(0, jgecTypedCharacters)}

                  {jgecTypedCharacters <= jgecParagraphs[0].length && (
                    <span className="typing-cursor" />
                  )}
                </p>

                {jgecTypedCharacters > jgecParagraphs[0].length && (
                  <p className="font-body text-sm sm:text-base md:text-lg lg:text-xl leading-7 md:leading-9 text-white/75">
                    {jgecParagraphs[1].slice(
                      0,
                      jgecTypedCharacters - jgecParagraphs[0].length
                    )}

                    {jgecTypedCharacters < totalJgecCharacters && (
                      <span className="typing-cursor" />
                    )}
                  </p>
                )}
              </div>

            </div>


            {/* RIGHT — HOLD THE CARD COMPOSITION */}

            <div className="jgec-invitation relative w-full">

              {/* Ambient glow behind the hand */}
              <div className="invitation-glow" />

              {/* Floating card 1 */}
              <img
                src={card1Image}
                alt="Squid Game invitation card"
                className="invitation-card invitation-card-one"
              />

              {/* Floating card 2 */}
              <img
                src={card2Image}
                alt="Squid Game invitation card"
                className="invitation-card invitation-card-two"
              />

              {/* Hand */}
              <img
                src={handImage}
                alt="Pink soldier presenting the invitation"
                className="invitation-hand"
              />

            </div>

          </div>
        </div>
      </section>


      {/* =====================================================
          ABOUT SRISTI
      ===================================================== */}

      <section
        ref={sristiSectionRef}
        className={`sristi-section relative w-full px-6 sm:px-10 md:px-16 lg:px-24 py-24 md:py-32 ${
          sristiVisible ? "sristi-visible" : ""
        }`}
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
                  font-heavy-title
                  sristi-heading-layer
                  text-4xl
                  sm:text-7xl
                  md:text-8xl
                  lg:text-9xl
                  tracking-wider
                  text-white
                "
              >
                ABOUT{" "} 
                <span className="sristi-font-shift">SRISTI</span>
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
              VIDEO
            ========================================= */}

            <RevealOnScroll direction="left">
              <div
                className={`
                  soldier-phone-stage
                  relative
                  w-full
                  mx-auto
                  ${sristiVisible ? "soldier-phone-enter" : ""}
                `}
              >
                {/* COMPLETE SOLDIER + PHONE FRAME */}

                <img
                  src={pinkSoldier}
                  alt="Pink soldier presenting the SRISTI video"
                  className="soldier-phone-image"
                />

                {/* VIDEO INSIDE THE PHONE SCREEN */}

                <div className="soldier-phone-screen">
                  <video
                    ref={videoRef}
                    src={sristiVideo}
                    muted={isMuted}
                    autoPlay={false}
                    playsInline
                    preload="auto"
                    className="soldier-phone-video"
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onLoadedMetadata={(event) =>
                      setDuration(event.currentTarget.duration)
                    }
                    onTimeUpdate={updateProgress}
                    onEnded={() => setIsPlaying(false)}
                  />

                  {/* CUSTOM PHONE CONTROLS */}

                  <div className="phone-controls">

                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="0.1"
                      value={progress}
                      onChange={(event) =>
                        seekVideo(Number(event.target.value))
                      }
                      aria-label="Video progress"
                      className="phone-progress"
                      style={{
                        background: `linear-gradient(to right, #ec4899 ${progress}%, rgba(255,255,255,0.3) ${progress}%)`,
                      }}
                    />

                    <div className="phone-control-row">

                      <button
                        type="button"
                        onClick={togglePlay}
                        aria-label={isPlaying ? "Pause video" : "Play video"}
                      >
                        {isPlaying ? <Pause /> : <Play />}
                      </button>

                      <span className="phone-time">
                        {formatTime(videoRef.current?.currentTime ?? 0)}
                        {" / "}
                        {formatTime(duration)}
                      </span>

                      <button
                        type="button"
                        onClick={toggleMute}
                        aria-label={isMuted ? "Unmute video" : "Mute video"}
                      >
                        {isMuted ? <VolumeX /> : <Volume2 />}
                      </button>

                      <button
                        type="button"
                        onClick={toggleFullscreen}
                        aria-label="Fullscreen video"
                      >
                        <Maximize2 />
                      </button>

                    </div>
                  </div>
                </div>

                {/* DECORATIVE PINK GLOW */}

                <div className="soldier-phone-glow" />
              </div>
            </RevealOnScroll>

            {/* =========================================
                TEXT
            ========================================= */}

            <RevealOnScroll
              direction="right"
              delay={200}
            >

              <div className="sristi-text-layer">

                <div className="sristi-typing-content text-right border-r-4 border-pink-500 pr-4 rounded-md tracking-tight">
                  {sristiParagraphs.map((paragraph, index) => {
                    const startIndex = sristiParagraphs
                      .slice(0, index)
                      .reduce((total, text) => total + text.length, 0);

                    const endIndex = startIndex + paragraph.length;

                    const visibleCharacters = Math.max(
                      0,
                      Math.min(paragraph.length, typedCharacters - startIndex)
                    );

                    if (index !== 0 && typedCharacters <= startIndex) return null;

                    const visibleText = paragraph.slice(0, visibleCharacters);
                    const arrowIndex = visibleText.lastIndexOf("<");

                    const textPart =
                      arrowIndex !== -1
                        ? visibleText.slice(0, arrowIndex).trimEnd()
                        : visibleText;

                    const showArrow = arrowIndex !== -1;

                    return (
                      <p
                        key={index}
                        className={`font-body text-sm sm:text-base md:text-lg lg:text-xl leading-7 md:leading-9 text-white/75 ${
                          index !== 0 ? "mt-1" : ""
                        }`}
                      >
                        {renderHighlightedText(textPart)}

                        {showArrow && (
                          <span className="text-pink-500 font-bold ml-1">
                            {"<"}
                          </span>
                        )}

                        {typedCharacters < totalCharacters &&
                          typedCharacters >= startIndex &&
                          typedCharacters <= endIndex && (
                            <span className="typing-cursor" />
                          )}
                      </p>
                    );
                  })}
                </div>


                {/* =====================================
                    METADATA
                ===================================== */}

                <div
                  className="
                    mt-10
                    w-full
                    flex
                    flex-wrap
                    justify-end
                    text-right
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
                      CATEGORY
                    </p>

                    <p className="font-ui text-white mt-1">
                      Techno-Management
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