import Navbar from "../components/Navbar";
import LiquidGradientBackground from "../components/LiquidGradientBackground";
import {
  ArrowUpRight,
  Phone,
  MapPin,
  CalendarDays,
  ShieldCheck,
  BedDouble,
  Users,
  Ticket,
  Droplets,
  Utensils
} from "lucide-react";
import QRImage from "../assets/images/accomodation_qr.png"

import { useState, type MouseEvent } from "react";

const FORM_LINK =
  "https://forms.gle/BmAn7DZb3LgzfzYn7";

const contacts = [
  {
    name: "Akriti",
    phone: "8116428183",
  },
  {
    name: "Ramyak",
    phone: "8695446943",
  },
  {
    name: "Richa",
    phone: "9126057983",
  },
];

const facilities = [
  {
    number: "01",
    description:
      "Basic bedding and shared washrooms.",
    icon: BedDouble,
  },
  {
    number: "02",
    description:
      "24x7 Clean water supply.",
    icon: Droplets,
  },
  {
    number: "03",
    description: "Seperate arrangements for boys and girls.",
    icon: Users,
  },
  {
    number: "04",
    description:
      "Security and safety measures in place.",
    icon: ShieldCheck,
  },
  {
    number: "05",
    description:
        "Hygenic food stalls available in campus (on paid basis).",
    icon: Utensils,
  },
  {
    number: "06",
    description:
      "Check-in from the evening prior to your registered event or workshop date",
    icon: Ticket,
  },
  {
    number: "07",
    description:
      "Check-out by 10 AM on the day after your participation ends.",
    icon: CalendarDays,
  },
  {
    number: "08",
    description:
      "Register through our official accommodation application form.",
    icon: ShieldCheck,
  },
];

function Accommodation() {
    const [lightPosition, setLightPosition] = useState({
    x: 50,
    y: 50,
    });

    const [isGlassHovered, setIsGlassHovered] = useState(false);

    const handleGlassMouseMove = (
    e: MouseEvent<HTMLDivElement>
    ) => {
    const rect = e.currentTarget.getBoundingClientRect();

    setLightPosition({
        x: ((e.clientX - rect.left) / rect.width) * 100,
        y: ((e.clientY - rect.top) / rect.height) * 100,
    });
    };
  return (
    <main className="accommodation-page events-page relative min-h-screen overflow-hidden bg-[#080808] text-white">

      <LiquidGradientBackground />
      <Navbar />

      {/* BACKGROUND */}
      <div className="fixed inset-0 pointer-events-none z-0">

        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,rgba(236,72,153,0.12),transparent_60%)]" />

        <div className="absolute top-0 left-0 w-full h-full opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)",
            backgroundSize: "55px 55px",
          }}
        />

        {/* FLOATING SQUID GAME SYMBOLS */}
        <div className="absolute top-[20%] left-[7%] w-12 h-12 rounded-full border border-pink-500/20 animate-pulse" />

        <div className="absolute top-[35%] right-[8%] w-10 h-10 border border-pink-500/20 rotate-45 animate-pulse" />

        <div className="absolute bottom-[18%] left-[12%] w-0 h-0 border-l-15 border-r-15 border-b-26 border-l-transparent border-r-transparent border-b-pink-500/20" />

        <div className="absolute bottom-[25%] right-[12%] w-14 h-14 border border-pink-500/20" />

      </div>

      {/* MAIN CONTENT */}
      <section className="relative z-10 pt-32 pb-20 px-5">

        <div className="max-w-6xl mx-auto">

          {/* TOP LABEL */}
          <div className="flex justify-center mb-8">

            <div className="flex items-center gap-3 border border-pink-500/30 bg-pink-500/5 px-5 py-2">

              <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />

              <span className="font-mono text-[10px] md:text-xs tracking-[0.3em] text-pink-400">
                PLAYER SERVICES // 02-05 DECEMBER 2026
              </span>

            </div>

          </div>

          {/* HERO */}
          <div className="text-center mb-16">

            <div className="flex justify-center items-center gap-5 mb-6">

              <span className="w-12 md:w-24 h-px bg-pink-500/50" />

              <span className="font-mono text-pink-500 text-xs tracking-[0.4em]">
                THE GAME CONTINUES
              </span>

              <span className="w-12 md:w-24 h-px bg-pink-500/50" />

            </div>

            <h1 className="font-title text-4xl sm:text-5xl md:text-7xl leading-tight">
              YOUR STAY
              <br />
              <span className="text-pink-500">
                IN THE GAME
              </span>
            </h1>

            <p className="font-ui text-gray-400 text-sm md:text-base max-w-2xl mx-auto mt-8 leading-relaxed">
              Planning to participate in SRISTI 2K26?
              Don't worry about where to stay.
              We've got your accommodation sorted at
              Jalpaiguri Government Engineering College.
            </p>

            <div className="flex justify-center gap-3 mt-8">

              <span className="w-4 h-4 rounded-full border-2 border-pink-500" />

              <span className="w-4 h-4 rotate-45 border-2 border-pink-500" />

              <span className="w-4 h-4 border-2 border-pink-500" />

            </div>

          </div>

          {/* INVITATION CARD */}
          <div
            onMouseMove={handleGlassMouseMove}
            onMouseEnter={() => setIsGlassHovered(true)}
            onMouseLeave={() => setIsGlassHovered(false)}
            className={`
                relative max-w-5xl mx-auto overflow-hidden
                border bg-[#0c0c0c]/95
                transition-all duration-500
                ${
                isGlassHovered
                    ? "border-pink-500/60 shadow-[0_0_60px_rgba(236,72,153,0.15)]"
                    : "border-pink-500/40 shadow-[0_0_60px_rgba(236,72,153,0.08)]"
                }
            `}
            >
            {/* CURSOR FOLLOWING LIGHT */}
            <div
                className="absolute inset-0 pointer-events-none z-0 transition-opacity duration-500"
                style={{
                opacity: isGlassHovered ? 1 : 0,
                background: `
                    radial-gradient(
                    400px circle at ${lightPosition.x}% ${lightPosition.y}%,
                    rgba(236,72,153,0.18),
                    rgba(236,72,153,0.07) 35%,
                    transparent 75%
                    )
                `,
                }}
            />

            {/* GLASS REFLECTION */}
            <div
                className="absolute inset-0 pointer-events-none z-0"
                style={{
                background: `
                    linear-gradient(
                    135deg,
                    rgba(255,255,255,0.045),
                    transparent 30%,
                    transparent 70%,
                    rgba(236,72,153,0.025)
                    )
                `,
                }}
            />  

            {/* TOP STRIP */}
            <div className="flex justify-between items-center border-b border-pink-500/30 px-5 md:px-8 py-4">

              <span className="font-title text-xs md:text-sm text-pink-500">
                SRISTI 2K26
              </span>

              <span className="font-mono text-[9px] md:text-xs text-gray-500 tracking-widest">
                15 YEARS OF INNOVATION // JGEC
              </span>

            </div>

            <div className="grid md:grid-cols-[1.2fr_0.8fr]">

              {/* LEFT CONTENT */}
              <div className="p-6 md:p-10">

                <div className="flex items-center gap-3 mb-8">

                  <Ticket className="text-pink-500" size={22} />

                  <span className="font-mono text-xs tracking-[0.25em] text-gray-400">
                    OFFICIAL ACCOMMODATION NOTICE
                  </span>

                </div>

                <h2 className="font-title text-2xl md:text-4xl leading-relaxed mb-6">
                  YOUR PARTICIPATION.
                  <br />
                  <span className="text-pink-500">
                    OUR RESPONSIBILITY.
                  </span>
                </h2>

                <p className="font-ui text-sm text-gray-400 leading-7 mb-8">
                  Accommodation facilities are available at
                  Jalpaiguri Government Engineering College
                  for participants attending the 15th
                  Anniversary Edition of SRISTI.
                </p>

                {/* INFORMATION */}
                <div className="space-y-5">

                  <div className="flex items-center gap-4">

                    <div className="w-11 h-11 flex items-center justify-center border border-pink-500/30 bg-pink-500/5">
                      <MapPin className="text-pink-500" size={20} />
                    </div>

                    <div>
                      <p className="font-mono text-[10px] text-gray-500 tracking-widest">
                        LOCATION
                      </p>

                      <p className="font-ui text-sm text-white mt-1">
                        JGEC Campus, Jalpaiguri
                      </p>
                    </div>

                  </div>

                  <div className="flex items-center gap-4">

                    <div className="w-11 h-11 flex items-center justify-center border border-pink-500/30 bg-pink-500/5">
                      <CalendarDays className="text-pink-500" size={20} />
                    </div>

                    <div>
                      <p className="font-mono text-[10px] text-gray-500 tracking-widest">
                        FEST DATES
                      </p>

                      <p className="font-ui text-sm text-white mt-1">
                        2nd – 5th December 2026
                      </p>
                    </div>

                  </div>

                </div>

              </div>

              {/* RIGHT SIDE */}
              <div className="relative border-t md:border-t-0 md:border-l border-pink-500/30 p-6 md:p-10 flex flex-col items-center justify-center text-center overflow-hidden">

                <div className="absolute w-56 h-56 rounded-full bg-pink-500/10 blur-[70px]" />

                <img
                    src={QRImage}
                    className="w-32 h-32 md:w-40 md:h-40 object-cover mb-5 relative z-10" 
                />

                <p className="font-title text-pink-500 text-lg mt-8">
                  PLAYER ACCESS
                </p>

                <p className="font-mono text-[10px] text-gray-500 tracking-widest mt-2 mb-8">
                  REGISTRATION IS OPEN
                </p>

                <a
                  href={FORM_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group w-full flex items-center justify-center gap-3 bg-pink-600 hover:bg-pink-500 text-white py-4 px-5 font-title text-xs tracking-widest transition-all duration-300 shadow-[0_0_25px_rgba(236,72,153,0.2)] hover:shadow-[0_0_35px_rgba(236,72,153,0.4)]"
                >
                  APPLY NOW

                  <ArrowUpRight
                    size={18}
                    className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform"
                  />

                </a>

                <p className="font-mono text-[9px] text-gray-600 mt-5 tracking-widest">
                  SCAN // REGISTER // PARTICIPATE
                </p>

              </div>

            </div>

          </div>

        {/* FACILITIES */}
          <section className="mt-24">

            <div className="text-center mb-12">

                <p className="font-mono text-pink-500 text-xs tracking-[0.35em] mb-4">
                WHAT WE OFFER
                </p>

                <h2 className="font-title text-2xl md:text-4xl">
                PLAYER <span className="text-pink-500">FACILITIES</span>
                </h2>

            </div>


            {/* SINGLE INTERACTIVE GLASS BOX */}
                <div
                onMouseMove={handleGlassMouseMove}
                onMouseEnter={() => setIsGlassHovered(true)}
                onMouseLeave={() => setIsGlassHovered(false)}
                className={`
                    max-w-4xl mx-auto
                    relative overflow-hidden
                    border rounded-2xl
                    backdrop-blur-xl
                    p-6 md:p-10
                    transition-all duration-500
                    ${
                    isGlassHovered
                        ? "border-pink-500/50 shadow-[0_0_35px_rgba(236,72,153,0.12)]"
                        : "border-pink-500/25 shadow-[0_0_50px_rgba(236,72,153,0.06)]"
                    }
                `}
                style={{
                    background: "rgba(255,255,255,0.025)",
                }}
                >

                {/* CURSOR FOLLOWING LIGHT */}
                <div
                    className="absolute inset-0 pointer-events-none transition-opacity duration-500"
                    style={{
                    opacity: isGlassHovered ? 1 : 0,
                    background: `
                        radial-gradient(
                        350px circle at ${lightPosition.x}% ${lightPosition.y}%,
                        rgba(236,72,153,0.16),
                        rgba(236,72,153,0.06) 35%,
                        transparent 75%
                        )
                    `,
                    }}
                />

                {/* GLASS REFLECTION */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                    background: `
                        linear-gradient(
                        135deg,
                        rgba(255,255,255,0.045),
                        transparent 30%,
                        transparent 70%,
                        rgba(236,72,153,0.025)
                        )
                    `,
                    }}
                />

                {/* FACILITY LIST */}
                <div className="relative z-10 flex flex-col gap-7">

                    {facilities.map((item) => {
                    const Icon = item.icon;

                    return (
                        <div
                        key={item.number}
                        className="group flex items-start gap-4 md:gap-6"
                        >

                        {/* ICON */}
                        <div className="
                            shrink-0
                            w-10 h-10 md:w-11 md:h-11
                            flex items-center justify-center
                            rounded-full
                            border border-pink-500/30
                            bg-pink-500/[0.07]
                            text-pink-500
                            group-hover:bg-pink-500
                            group-hover:text-black
                            group-hover:shadow-[0_0_20px_rgba(236,72,153,0.3)]
                            transition-all duration-300
                        ">
                            <Icon size={19} />
                        </div>

                        {/* DESCRIPTION */}
                        <div className="flex-1 pt-1.5">
                            <p className="
                            font-ui text-sm md:text-base
                            text-gray-300 leading-relaxed
                            group-hover:text-white
                            transition-colors duration-300
                            ">
                            {item.description}
                            </p>
                        </div>

                        </div>
                    );
                    })}

                </div>

                </div>

            </section>

          {/* CONTACTS */}
          <section className="mt-24">

            <div className="text-center mb-12">

              <p className="font-mono text-pink-500 text-xs tracking-[0.35em] mb-4">
                NEED ASSISTANCE?
              </p>

              <h2 className="font-title text-2xl md:text-4xl">
                CONTACT <span className="text-pink-500">OUR TEAM</span>
              </h2>

              <p className="font-ui text-sm text-gray-500 mt-5">
                For accommodation queries and booking assistance.
              </p>

            </div>

            <div className="grid sm:grid-cols-3 gap-4">

              {contacts.map((person) => (

                <a
                  key={person.name}
                  href={`tel:${person.phone}`}
                  className="group flex items-center gap-4 border border-white/10 bg-white/[0.02] p-5 hover:border-pink-500/50 hover:bg-pink-500/5 transition-all duration-300"
                >

                  <div className="w-12 h-12 flex items-center justify-center border border-pink-500/30 text-pink-500 group-hover:bg-pink-500 group-hover:text-black transition-all">
                    <Phone size={20} />
                  </div>

                  <div>
                    <p className="font-title text-sm">
                      {person.name}
                    </p>

                    <p className="font-mono text-xs text-gray-500 mt-2">
                      +91 {person.phone}
                    </p>
                  </div>

                  <ArrowUpRight
                    size={16}
                    className="ml-auto text-gray-600 group-hover:text-pink-500 transition-colors"
                  />

                </a>

              ))}

            </div>

          </section>

          {/* FINAL CTA */}
          <section className="relative mt-24 border border-pink-500/30 bg-pink-500/[0.04] px-6 py-12 text-center overflow-visible">

            <div className="absolute top-4 left-4 w-5 h-5 border-t-2 border-l-2 border-pink-500/50" />

            <div className="absolute right-[-10px] bottom-[-10px] w-5 h-5 border-b-2 border-r-2 border-pink-500/50" />

            <p className="font-mono text-xs tracking-[0.3em] text-pink-500 mb-5">
              YOUR NEXT MOVE
            </p>

            <h2 className="font-title text-2xl md:text-4xl leading-relaxed">
              DON'T MISS
              <span className="text-pink-500"> THE GAME.</span>
            </h2>

            <p className="font-ui text-gray-400 text-sm mt-5">
              Come, participate, connect and make memories at SRISTI 2K26.
            </p>

            <a
              href={FORM_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 mt-8 px-8 py-4 border border-pink-500 text-pink-500 font-title text-xs tracking-widest hover:bg-pink-500 hover:text-black transition-all duration-300"
            >
              SECURE YOUR STAY
              <ArrowUpRight size={17} />
            </a>

            <a
              href="mailto:contact@sristi2k26.tech"
              className="block mt-5 font-ui text-sm text-gray-400 hover:text-gray-300 hover:underline transition-colors"
            >
              contact@sristi2k26.tech
            </a>

          </section>

          {/* FOOTER */}
          <div className="mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">

            <p className="font-title text-sm text-pink-500">
              SRISTI 2K26
            </p>

            <p className="relative top-[-2] font-mono text-[9px] text-gray-600 tracking-widest text-center">
              15 YEARS OF INNOVATION // JGEC
            </p>

            <p className="font-ui text-xs text-gray-500">
              THE GAME AWAITS YOU.
            </p>

          </div>

        </div>

      </section>

    </main>
  );
}

export default Accommodation;