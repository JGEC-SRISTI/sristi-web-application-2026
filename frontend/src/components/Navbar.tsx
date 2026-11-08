import { useState, useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import {
  Square,
  Triangle,
  Circle,
  CircleUserRound,
  UserRound,
  X,
  ShieldCheck,
  LogOut,
  House,
} from "lucide-react";
import NavShape from "./NavShape";
import jgeclogo from "../assets/icons/logo1.png";
import sristilogo from "../assets/icons/sristi_logo.png";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsProfileOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `
    group
    relative
    flex
    flex-row
    items-center
    gap-3
    font-ui
    text-sm
    tracking-widest
    transition-all
    duration-300
    ${
      isActive
        ? "text-pink-500"
        : "text-white"
    }
    hover:text-pink-500
  `;

  return (
    <nav className="fixed no-trail top-0 left-0 w-full z-200">

      <div className="mx-auto">

        <div
          className="
            relative
            flex
            items-center
            justify-between
            px-5
            py-3
            bg-black/30
            backdrop-blur-xl
            border
            border-white/10
            shadow-[0_10px_40px_rgba(0,0,0,0.3)]
          "
        >

          {/* ================= LOGO ================= */}

          <Link
            to="/"
            className="flex items-center gap-3 group"
          >

            {/* jgec logo */}
            <img
              src={jgeclogo}
              alt="JGECL Logo"
              className="w-10 h-10 group-hover:scale-90 transition-transform duration-300"
            ></img>

            {/* Logo Text */}
            <div className="leading-none">

              <img src={sristilogo} alt="SRISTI Logo" className="h-9 group-hover:scale-110 transition-transform duration-300" />

            </div>

          </Link>


          {/* ================= DESKTOP NAV ================= */}

          <div className="hidden no-trail md:flex items-center gap-10 py-2">

            <NavLink to="/" className={navLinkClass}>
              <NavShape shape="square" />

              <span className="nav-text-wrap font-title text-md">
                <span className="nav-text">home</span>
                <span className="nav-text-pink">HOME</span>
              </span>
            </NavLink>

            <NavLink to="/events" className={navLinkClass}>
              <NavShape shape="circle" />

              <span className="nav-text-wrap font-title text-md">
                <span className="nav-text">games</span>
                <span className="nav-text-pink">GAMES</span>
              </span>
            </NavLink>

            <NavLink to="/committee" className={navLinkClass}>
              <NavShape shape="triangle" />

              <span className="nav-text-wrap font-title text-md">
                <span className="nav-text">staffs</span>
                <span className="nav-text-pink">STAFFS</span>
              </span>
            </NavLink>

            <NavLink to="/accommodation" className={navLinkClass}>
              <NavShape shape="house" />

              <span className="nav-text-wrap font-title text-md">
                <span className="nav-text">accommodation</span>
                <span className="nav-text-pink">ACCOMMODATION</span>
              </span>
            </NavLink>

          </div>


          {/* ================= PROFILE ================= */}

          <button
            type="button"
            onClick={() => setIsProfileOpen(true)}
            aria-label="Open player profile"
            className="
              hidden md:flex
              w-10 h-10
              items-center justify-center
              border border-pink-500/50
              rounded-full
              text-pink-500
              hover:bg-pink-500
              hover:text-black
              transition-all duration-300
            "
          >
            <CircleUserRound size={22} />
          </button>


          {/* ================= MOBILE MENU BUTTON ================= */}

          <button
            type="button"
            aria-label="Toggle menu"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="
              md:hidden
              w-10
              h-10
              flex
              flex-col
              items-center
              justify-center
              gap-1.5
              border
              border-pink-500/50
              text-pink-500
            "
          >

            <span
              className={`
                block
                w-5
                h-0.5
                bg-current
                transition-all
                duration-300
                ${
                  isMenuOpen
                    ? "translate-y-1 rotate-45"
                    : ""
                }
              `}
            />

            <span
              className={`
                block
                w-5
                h-0.5
                bg-current
                transition-all
                duration-300
                ${
                  isMenuOpen
                    ? "-translate-y-1 -rotate-45"
                    : ""
                }
              `}
            />

          </button>

        </div>


        {/* ================= MOBILE MENU ================= */}

        <div
          className={`
            md:hidden
            overflow-hidden
            transition-all
            duration-300
            ${
              isMenuOpen
                ? "max-h-96 opacity-100"
                : "max-h-0 opacity-0"
            }
          `}
        >

          <div
            className="
              mt-2
              p-6
              bg-black/30
              backdrop-blur-xl
              border
              border-white/10
              shadow-[0_10px_40px_rgba(0,0,0,0.3)]
              flex
              flex-col
              gap-6
            "
          >

            <NavLink
              to="/"
              className={navLinkClass}
              onClick={() => setIsMenuOpen(false)}
            >
                <Square size={16} className="inline-block mr-1" />
                <span className="font-bold">HOME</span>
            </NavLink>

            <NavLink
              to="/events"
              className={navLinkClass}
              onClick={() => setIsMenuOpen(false)}
            >
                <Circle size={16} className="inline-block mr-1" />
                <span className="font-bold">GAMES</span>
            </NavLink>

            <NavLink
              to="/committee"
              className={navLinkClass}
              onClick={() => setIsMenuOpen(false)}
            >
                <Triangle size={16} className="inline-block mr-1" />
                <span className="font-bold">STAFFS</span>
            </NavLink>

            <NavLink
              to="/accommodation"
              className={navLinkClass}
              onClick={() => setIsMenuOpen(false)}
            >
              <House size={16} className="inline-block mr-1" />
              <span className="font-bold">ACCOMMODATION</span>
            </NavLink>

            <button
              type="button"
              onClick={() => {
                setIsProfileOpen(true);
                setIsMenuOpen(false);
              }}
              className={`${navLinkClass({ isActive: false })} text-left`}
            >
              <UserRound size={16} />
              <span className="font-bold">PROFILE</span>
            </button>

          </div>

        </div>

      </div>
      {/* ================= PLAYER PROFILE DRAWER ================= */}

      {/* BACKDROP */}
      <div
        onClick={() => setIsProfileOpen(false)}
        className={`
          fixed inset-0
          bg-black/70 backdrop-blur-sm
          transition-opacity duration-500
          ${
            isProfileOpen
              ? "opacity-100 visible"
              : "opacity-0 invisible pointer-events-none"
          }
        `}
        style={{ zIndex: 70 }}
      />

      {/* SLIDING CARD */}
      <div
        className={`
          fixed top-0 right-0
          h-screen
          w-full sm:w-105
          bg-[#090909]
          border-l border-pink-500/40
          shadow-[-20px_0_60px_rgba(236,72,153,0.15)]
          transition-transform duration-500
          ease-[cubic-bezier(0.22,1,0.36,1)]
          ${
            isProfileOpen
              ? "translate-x-0"
              : "translate-x-full"
          }
        `}
        style={{ zIndex: 1000 }}
      >
        <div className="h-full overflow-y-auto p-6 text-white">

          {/* HEADER */}
          <div className="flex items-center justify-between mb-10">

            <div>
              <p className="text-pink-500 font-mono text-xs tracking-[0.3em]">
                PLAYER DATABASE
              </p>

              <h2 className="font-title text-2xl mt-1">
                SRISTI <span className="text-pink-500">2K26</span>
              </h2>
            </div>

            <button
              onClick={() => setIsProfileOpen(false)}
              className="
                w-10 h-10
                border border-pink-500/40
                flex items-center justify-center
                hover:bg-pink-500 hover:text-black
                transition-all
              "
            >
              <X size={20} />
            </button>

          </div>


          {/* PLAYER IDENTITY */}
          <div className="
            relative overflow-hidden
            border border-pink-500/40
            bg-linear-to-br from-pink-950/50 to-black
            p-6 mb-6
          ">

            {/* LOGOUT BUTTON */}
            <button
              type="button"
              // onClick={handleLogout}
              title="Logout"
              aria-label="Logout"
              className="
                absolute top-5 right-5
                w-12 h-12
                border-[3px] border-white/10
                flex items-center justify-center
                text-gray-500
                hover:border-pink-500
                hover:text-pink-500
                hover:bg-pink-500/10
                transition-all duration-300
                group
                z-20
              "
            >
              <LogOut
                size={16}
                className="group-hover:rotate-[-15deg] transition-transform duration-300"
              />
            </button>

            <div className="absolute top-8 right-9 opacity-10">
              <Circle size={130} />
            </div>

            <div className="relative z-10">

              <div className="
                w-20 h-20 rounded-full
                border-2 border-pink-500
                flex items-center justify-center
                text-pink-500 mb-5
              ">
                <UserRound size={42} />
              </div>

              <p className="text-pink-500 text-xs tracking-widest font-mono">
                PLAYER NO. 0456
              </p>

              <h1 className="font-title tracking-tighter text-3xl mt-2">
                Dipesh Das
              </h1>

              <p className="text-gray-400 text-sm mt-2">
                Jalpaiguri Government Engineering College
              </p>

              <div className="mt-5 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-green-400 text-xs tracking-widest">
                  REGISTERED PLAYER
                </span>
              </div>

            </div>

          </div>


          {/* PLAYER INFORMATION */}
          <div className="mb-6">

            <h3 className="
              font-title text-lg
              text-pink-500 mb-5
              tracking-widest
            ">
              PLAYER INFORMATION
            </h3>

            <div className="space-y-5">

              {[
                ["EMAIL", "dd2874@cse.jgec.ac.in"],
                ["PHONE", "+91 9733717805"],
                ["COLLEGE ROLL", "24101104074"],
                ["DEPARTMENT", "Computer Science & Engineering"],
                ["ACADEMIC YEAR", "3rd Year"],
              ].map(([label, value]) => (

                <div
                  key={label}
                  className="border-b border-white/10 pb-3"
                >

                  <p className="
                    text-gray-500 text-[10px]
                    tracking-[0.2em] mb-2
                  ">
                    {label}
                  </p>

                  <p className="text-sm font-ui text-white">
                    {value}
                  </p>

                </div>

              ))}

            </div>

          </div>


          {/* FOOTER */}
          <div className="
            border border-pink-500/30
            bg-pink-500/5 p-4
            flex items-center justify-between
          ">

            <div>
              <p className="text-gray-500 text-[10px] tracking-widest">
                PLAYER STATUS
              </p>

              <p className="text-pink-500 font-title mt-1">
                VERIFIED
              </p>
            </div>

            <ShieldCheck
              size={28}
              className="text-pink-500"
            />

          </div>

          <p className="
            text-center text-gray-600
            text-[9px] tracking-[0.3em]
            mt-8 font-mono
          ">
            YOUR GAME. YOUR IDENTITY. SRISTI 2K26.
          </p>

        </div>
      </div>

    </nav>
  );
};

export default Navbar;
