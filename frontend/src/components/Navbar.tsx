import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Square, Triangle, Circle, CircleUserRound, UserRound } from "lucide-react";
import NavShape from "./NavShape";
import jgeclogo from "../assets/icons/logo1.png";
import sristilogo from "../assets/icons/sristi_logo.png";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
    <nav className="fixed no-trail top-0 left-0 w-full z-50">

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

              <span className="nav-text-wrap font-style">
                <span className="nav-text">HOME</span>
                <span className="nav-text-pink">HOME</span>
              </span>
            </NavLink>

            <NavLink to="/committee" className={navLinkClass}>
              <NavShape shape="triangle" />

              <span className="nav-text-wrap font-style">
                <span className="nav-text">STAFFS</span>
                <span className="nav-text-pink">STAFFS</span>
              </span>
            </NavLink>

            <NavLink to="/events" className={navLinkClass}>
              <NavShape shape="circle" />

              <span className="nav-text-wrap font-style">
                <span className="nav-text">GAMES</span>
                <span className="nav-text-pink">GAMES</span>
              </span>
            </NavLink>

          </div>


          {/* ================= PROFILE ================= */}

          <Link
            to="/profile"
            className="
              hidden
              md:flex
              w-10
              h-10
              items-center
              justify-center
              border
              border-pink-500/50
              rounded-full
              text-pink-500
              hover:bg-pink-500
              hover:text-black
              transition-all
              duration-300
            "
          >

            <span className="font-mono text-sm">
              <CircleUserRound />
            </span>

          </Link>


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
              to="/committee"
              className={navLinkClass}
              onClick={() => setIsMenuOpen(false)}
            >
                <Triangle size={16} className="inline-block mr-1" />
                <span className="font-bold">STAFFS</span>
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
              to="/profile"
              className={navLinkClass}
              onClick={() => setIsMenuOpen(false)}
            >
              <UserRound size={16} className="inline-block mr-1" />
              <span className="font-bold">PROFILE</span>
            </NavLink>

          </div>

        </div>

      </div>

    </nav>
  );
};

export default Navbar;