import { useState, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import squidGameIcon from "../assets/icons/squid_game_symbols_transparent.svg";
import userIcon from "../assets/icons/user.png";

import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

import {
  Square,
  Triangle,
  Circle,
  Phone,
  CircleUserRound,
  UserRound,
  X,
  ShieldCheck,
  LogOut,
  House,
  ShieldOff,
  UserPen,
  Save,
} from "lucide-react";
import NavShape from "./NavShape";
import jgeclogo from "../assets/icons/logo1.png";
import sristilogo from "../assets/icons/sristi_logo.png";

interface StudentProfile {
  id: string;
  full_name: string;
  phone: string;
  college_name: string;
  college_roll: string;
  department: string;
  academic_year: string;
}

interface NavbarProps {
  onVerifiedPlayerChange?: (playerId: string | null) => void;
}

const Navbar = ({ onVerifiedPlayerChange }: NavbarProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const [session, setSession] = useState<Session | null>(null);

  const [profile, setProfile] =
    useState<StudentProfile | null>(null);

  const [authLoading, setAuthLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const [profileRefreshKey, setProfileRefreshKey] = useState(0);

  const [verifiedUserId, setVerifiedUserId] = useState<string | null>(null);
  const isVerified = verifiedUserId !== null && verifiedUserId === session?.user.id;
  const verifiedPlayerId = isVerified && profile?.id === verifiedUserId ? verifiedUserId : null;
  const [verificationLoading, setVerificationLoading] = useState(true);

  const [isVerifyOpen, setIsVerifyOpen] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState("");
  const [verificationMessage, setVerificationMessage] = useState("");

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [editError, setEditError] = useState("");

  const [editForm, setEditForm] = useState({
    full_name: "",
    college_name: "",
    phone: "",
    college_roll: "",
  });

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

  useEffect(() => {
    const openVerification = () => {
      setVerificationCode("");
      setVerificationError("");
      setVerificationMessage("");
      setIsProfileOpen(true);
      setIsVerifyOpen(true);
    };

    window.addEventListener("sristi-open-verification", openVerification);
    return () => window.removeEventListener("sristi-open-verification", openVerification);
  }, []);

  const handleEditProfile = () => {
    if (!profile) return;

    setEditForm({
      full_name: profile.full_name || "",
      college_name: profile.college_name || "",
      phone: profile.phone || "",
      college_roll: profile.college_roll || "",
    });

    setEditError("");
    setIsEditingProfile(true);
  };

  const handleSaveProfile = async () => {
    if (!supabase || !session?.user.id) {
      setEditError("Please sign in again.");
      return;
    }

    const fullName = editForm.full_name.trim();
    const collegeName = editForm.college_name.trim();
    const phone = editForm.phone.trim();
    const collegeRoll = editForm.college_roll.trim();

    if (!fullName || !collegeName || !phone || !collegeRoll) {
      setEditError("Please fill in all four fields.");
      return;
    }

    if (!/^[0-9+\-\s()]{10,15}$/.test(phone)) {
      setEditError("Please enter a valid mobile number.");
      return;
    }

    try {
      setIsSavingProfile(true);
      setEditError("");

      const { data, error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          college_name: collegeName,
          phone,
          college_roll: collegeRoll,
        })
        .eq("id", session.user.id)
        .select(`
          id,
          full_name,
          phone,
          college_name,
          college_roll,
          department,
          academic_year
        `)
        .single();

      if (error) throw error;

      setProfile(data as StudentProfile);
      setIsEditingProfile(false);

    } catch (error) {
      console.error("Profile update failed:", error);

      setEditError(
        error instanceof Error
          ? error.message
          : "Unable to update your profile."
      );
    } finally {
      setIsSavingProfile(false);
    }
  };

  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false);
      return;
    }

    let authEventReceived = false;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        authEventReceived = true;
        setSession(newSession);
        setAuthLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        console.error("Session error:", error.message);
      }

      // Do not overwrite a newer auth event, such as signOut(), with a
      // session snapshot that was read before that event completed.
      if (!authEventReceived) {
        setSession(data.session);
      }
      setAuthLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!supabase || !session?.user.id) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }

    let cancelled = false;

    const fetchProfile = async () => {
      if (!supabase) {
        setProfile(null);
        setProfileLoading(false);
        return;
      }

      setProfileLoading(true);

      const { data, error } = await supabase
        .from("profiles")
        .select(`
          id,
          full_name,
          phone,
          college_name,
          college_roll,
          department,
          academic_year
        `)
        .eq("id", session.user.id)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        console.error("Profile fetch error:", error.message);
        setProfile(null);
      } else {
        setProfile(data as StudentProfile | null);
      }

      setProfileLoading(false);
    };

    fetchProfile();

    return () => {
      cancelled = true;
    };
  }, [session?.user.id, profileRefreshKey]);

  const handleRegisterClick = async () => {
    if (!supabase) {
      alert("Supabase configuration missing.");
      return;
    }

    // Already logged in: go directly to registration.
    if (session) {
      navigate("/register");
      setIsMenuOpen(false);
      return;
    }

    // New user: authenticate and return to registration.
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/register`,
        queryParams: {
          prompt: "select_account",
        },
      },
    });

    if (error) {
      console.error("Google login failed:", error.message);
      alert(error.message);
    }
  };

  useEffect(() => {
    const refreshProfile = () => {
      setProfileRefreshKey((previous) => previous + 1);
    };

    window.addEventListener(
      "sristi-profile-updated",
      refreshProfile
    );

    return () => {
      window.removeEventListener(
        "sristi-profile-updated",
        refreshProfile
      );
    };
  }, []);

  const handleLogout = async () => {
    if (!supabase || isLoggingOut) return;

    try {
      setIsLoggingOut(true);

      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      // Close the profile drawer and mobile menu
      setIsProfileOpen(false);
      setIsMenuOpen(false);

      // Clear profile information
      setProfile(null);
      setSession(null);

      // Return to homepage
      navigate("/", { replace: true });

    } catch (error) {
      console.error("Logout failed:", error);
      alert("Unable to logout. Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const checkVerification = async () => {
      if (!supabase || !session?.user.id) {
        setVerifiedUserId(null);
        setVerificationLoading(false);
        return;
      }

      setVerificationLoading(true);

      const { data, error } = await supabase.rpc(
        "is_verified_user"
      );

      if (cancelled) return;

      if (error) {
        console.error("Verification status error:", error);
        setVerifiedUserId(null);
      } else {
        setVerifiedUserId(data === true ? session.user.id : null);
      }

      setVerificationLoading(false);
    };

    checkVerification();

    return () => {
      cancelled = true;
    };
  }, [session?.user.id]);

  useEffect(() => {
    onVerifiedPlayerChange?.(verifiedPlayerId);
  }, [onVerifiedPlayerChange, verifiedPlayerId]);

  const handleVerifyCode = async () => {
    if (!supabase || !session?.user.id) {
      setVerificationError("Please sign in first.");
      return;
    }

    const code = verificationCode.trim().toUpperCase();

    if (!/^[A-Z0-9]{6}$/.test(code)) {
      setVerificationError(
        "Enter a valid 6-character alphanumeric code."
      );
      return;
    }

    try {
      setIsVerifying(true);
      setVerificationError("");
      setVerificationMessage("");

      // Validate and consume the participant's issued code.
      const { data, error } = await supabase.rpc(
        "verify_participant_code",
        {
          p_code: code,
        }
      );

      if (error) {
        throw error;
      }

      if (data !== true) {
        setVerificationError(
          "Invalid verification code. Please try again."
        );
        return;
      }

      // Confirm the final verification status.
      const {
        data: verified,
        error: statusError,
      } = await supabase.rpc("is_verified_user");

      if (statusError) {
        throw statusError;
      }

      if (verified === true) {
        setVerifiedUserId(session.user.id);
        setIsVerifyOpen(false);
        setVerificationCode("");
        setVerificationMessage("");
      } else {
        setVerificationError(
          "Code accepted, but your account is not yet marked as verified. Please contact the organizers."
        );
      }
    } catch (error) {
      console.error("Verification failed:", error);

      setVerificationError(
        error instanceof Error
          ? error.message
          : "Verification failed. Please check your code."
      );
    } finally {
      setIsVerifying(false);
    }
  };

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
    ${isActive ? "text-pink-500" : "text-white"}
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
            gap-4
            px-3 sm:px-5
            py-3
            bg-black/30
            backdrop-blur-xl
            border
            border-white/10
            shadow-[0_10px_40px_rgba(0,0,0,0.3)]
          "
        >
          {/* ================= LOGO ================= */}

          <Link to="/" className="flex shrink-0 items-center gap-2 sm:gap-3 group">
            {/* jgec logo */}
            <img
              src={jgeclogo}
              alt="JGECL Logo"
              className="w-9 h-9 shrink-0 sm:w-10 sm:h-10 group-hover:scale-90 transition-transform duration-300"
            ></img>

            {/* Logo Text */}
            <div className="leading-none">
              <img
                src={sristilogo}
                alt="SRISTI Logo"
                className="h-8 w-auto sm:h-9 group-hover:scale-110 transition-transform duration-300"
              />
            </div>
          </Link>

          {/* ================= DESKTOP NAV ================= */}

          <div className="hidden no-trail xl:flex shrink-0 items-center gap-5 py-2 2xl:gap-10">
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

            <NavLink to="/contact_us" className={navLinkClass}>
              <NavShape shape="phone" />

              <span className="nav-text-wrap font-title text-md">
                <span className="nav-text">contact us</span>
                <span className="nav-text-pink">CONTACT US</span>
              </span>
            </NavLink>

            <NavLink to="/accommodation" className={navLinkClass}>
              <NavShape shape="house" />

              <span className="nav-text-wrap font-title text-md">
                <span className="nav-text">accommodation</span>
                <span className="nav-text-pink">ACCOMMODATION</span>
              </span>
            </NavLink>

            {/* Public leaderboard link paused until the results page is scheduled. */}
          </div>

          {/* ================= PROFILE ================= */}

                    {/* REGISTER / PROFILE */}

          <div className="hidden xl:flex shrink-0 items-center">

            {authLoading || profileLoading ? (
              <div className="w-10 h-10 rounded-full border border-pink-500/30 animate-pulse" />
            ) : profile ? (

              <button
                type="button"
                onClick={() => setIsProfileOpen(true)}
                className="
                  w-10 h-10
                  flex items-center justify-center
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

            ) : (

              <button
                type="button"
                onClick={handleRegisterClick}
                className="
                  flex flex-row items-center
                  px-2 py-2
                  border border-pink-500
                  text-pink-500
                  font-title tracking-widest
                  hover:bg-pink-500
                  hover:text-black
                  transition-all duration-300
                "
              >
                <img src={squidGameIcon} alt="Squid Game" className="w-7 h-7 mr-1" />
                REGISTER
              </button>

            )}

          </div>

          {/* ================= MOBILE MENU BUTTON ================= */}

          <button
            type="button"
            aria-label="Toggle menu"
            aria-expanded={isMenuOpen}
            aria-controls="site-navigation-menu"
            onClick={() => setIsMenuOpen((open) => !open)}
            className="
              xl:hidden
              w-10 h-10
              shrink-0
              flex flex-col
              items-center justify-center
              gap-1.5
              border border-pink-500/50
              text-pink-500
            "
          >
            <span
              className={`
                block w-5 h-0.5 bg-current
                transition-all duration-300
                ${
                  isMenuOpen
                    ? "translate-y-1 rotate-45"
                    : ""
                }
              `}
            />

            <span
              className={`
                block w-5 h-0.5 bg-current
                transition-all duration-300
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
          id="site-navigation-menu"
          inert={!isMenuOpen}
          className={`
            xl:hidden
            overflow-x-hidden overflow-y-auto
            transition-[max-height,opacity]
            duration-300
            ${isMenuOpen ? "max-h-[calc(100dvh-4.125rem)] opacity-100" : "max-h-0 opacity-0"}
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
              <span className="font-title">HOME</span>
            </NavLink>

            <NavLink
              to="/events"
              className={navLinkClass}
              onClick={() => setIsMenuOpen(false)}
            >
              <Circle size={16} className="inline-block mr-1" />
              <span className="font-title">GAMES</span>
            </NavLink>

            <NavLink
              to="/committee"
              className={navLinkClass}
              onClick={() => setIsMenuOpen(false)}
            >
              <Triangle size={16} className="inline-block mr-1" />
              <span className="font-title">STAFFS</span>
            </NavLink>

            <NavLink
              to="/contact_us"
              className={navLinkClass}
              onClick={() => setIsMenuOpen(false)}
            >
              <Phone size={16} className="inline-block mr-1" aria-hidden="true" />
              <span className="font-title">CONTACT US</span>
            </NavLink>

            <NavLink
              to="/accommodation"
              className={navLinkClass}
              onClick={() => setIsMenuOpen(false)}
            >
              <House size={16} className="inline-block mr-1" />
              <span className="font-title">ACCOMMODATION</span>
            </NavLink>

            {/* Public leaderboard link paused until the results page is scheduled. */}

            {/* MOBILE REGISTER / PROFILE */}

            {!authLoading && !profileLoading && (
              profile ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen(true);
                    setIsMenuOpen(false);
                  }}
                  className={`${navLinkClass({ isActive: false })} text-left`}
                >
                  <UserRound size={16} />
                  <span className="font-title">PROFILE</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    handleRegisterClick();
                  }}
                  className={`${navLinkClass({ isActive: false })} text-left`}
                >
                  <UserRound size={16} />
                  <span className="font-title">REGISTER</span>
                </button>
              )
            )}
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
          ${isProfileOpen ? "translate-x-0" : "translate-x-full"}
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
                sristi <span className="text-pink-500">2k26</span>
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
          <div
            className="
            relative overflow-hidden
            border border-pink-500/40
            bg-linear-to-br from-pink-950/50 to-black
            p-6 mb-6
          "
          >
            {/* LOGOUT BUTTON */}
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              title="Logout"
              aria-label="Logout"
              className="
                absolute top-5 right-5
                w-15 h-15
                z-1000
                rounded-full
                border-[3px] border-white/10
                flex items-center justify-center
                text-gray-500
                hover:border-pink-500
                hover:text-pink-500
                hover:bg-pink-500/10
                transition-all duration-300
                disabled:opacity-50
              "
            >
              {isLoggingOut ? (
                <span className="text-xs">...</span>
              ) : (
                <LogOut size={16} />
              )}
            </button>

            <div className="absolute top-8 right-9 opacity-10">
              <Circle size={130} />
            </div>

            <div className="relative z-10">
              <div
                className="
                w-20 h-20 rounded-full
                border-2 border-pink-500
                flex items-center justify-center
                text-pink-500 mb-5
              "
              >
                <img src={userIcon} alt="User" className="w-9/10 h-9/10 object-cover" />
              </div>

              <h1 className="font-title text-3xl mt-2">
                {profile?.full_name || "PLAYER"}
              </h1>

              <p className="text-gray-400 text-sm mt-2">
                {profile?.college_name}
              </p>

              <div className="mt-5 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-teal-500" />
                <span className="text-teal-400 text-xs tracking-widest">
                  REGISTERED PLAYER
                </span>
              </div>
            </div>
          </div>

          
          {/* PLAYER INFORMATION */}
          <div className="mb-6">

            <div className="flex items-center justify-between mb-5">
              <h3 className="
                font-title text-lg
                text-pink-500
                tracking-widest
              ">
                PLAYER INFORMATION
              </h3>

              {!isEditingProfile ? (
                <button
                  type="button"
                  onClick={handleEditProfile}
                  className="
                    profile-edit-button
                    flex items-center gap-2
                    text-xs tracking-widest
                    rounded-md px-4 py-2
                    font-semibold
                    text-gray-400
                    hover:text-black
                    hover:bg-pink-500/80
                    transition-all duration-300
                  "
                >
                  <UserPen size={24} />
                  EDIT PROFILE
                </button>
              ) : (
                <span className="text-xs text-sky-400 tracking-widest">
                  EDITING
                </span>
              )}
            </div>

            <div className="space-y-5">

              {[
                {
                  label: "FULL NAME",
                  key: "full_name" as const,
                  value: profile?.full_name,
                },
                {
                  label: "EMAIL",
                  key: null,
                  value: session?.user.email || "Not available",
                },
                {
                  label: "PHONE",
                  key: "phone" as const,
                  value: profile?.phone,
                },
                {
                  label: "COLLEGE ROLL",
                  key: "college_roll" as const,
                  value: profile?.college_roll,
                },
                {
                  label: "COLLEGE",
                  key: "college_name" as const,
                  value: profile?.college_name,
                },
                {
                  label: "DEPARTMENT",
                  key: null,
                  value: profile?.department,
                },
                {
                  label: "ACADEMIC YEAR",
                  key: null,
                  value: profile?.academic_year,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="border-b border-white/10 pb-3"
                >
                  <p className="
                    text-gray-500 text-[10px]
                    tracking-[0.2em] mb-2
                  ">
                    {item.label}
                  </p>

                  {isEditingProfile && item.key ? (
                    <input
                      type="text"
                      value={editForm[item.key]}
                      onChange={(e) =>
                        setEditForm((previous) => ({
                          ...previous,
                          [item.key!]: e.target.value,
                        }))
                      }
                      className="
                        w-full bg-white/5
                        border border-pink-500/40
                        focus:border-pink-500
                        outline-none
                        px-3 py-2
                        text-sm text-white
                        transition-all
                      "
                    />
                  ) : (
                    <p className="text-sm font-ui text-white">
                      {item.value || "Not available"}
                    </p>
                  )}
                </div>
              ))}

            </div>

            {/* EDIT ERROR */}
            {isEditingProfile && editError && (
              <div className="
                mt-5 p-3
                border border-red-500/30
                bg-red-500/10
                text-red-400 text-xs
              ">
                {editError}
              </div>
            )}

            {/* SAVE / CANCEL */}
            {isEditingProfile && (
              <div className="grid grid-cols-2 gap-3 mt-6">

                <button
                  type="button"
                  onClick={() => {
                    setIsEditingProfile(false);
                    setEditError("");
                  }}
                  disabled={isSavingProfile}
                  className="
                    flex items-center justify-center gap-2
                    py-3
                    border border-white/20
                    text-gray-400
                    text-xs tracking-widest
                    hover:border-white/50 hover:text-white
                    transition-all
                  "
                >
                  <X size={15} />
                  CANCEL
                </button>

                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={isSavingProfile}
                  className="
                    flex items-center justify-center gap-2
                    py-3
                    bg-pink-600
                    text-white
                    text-xs tracking-widest
                    hover:bg-pink-500
                    transition-all
                    disabled:opacity-50
                  "
                >
                  <Save size={15} />
                  {isSavingProfile ? "SAVING..." : "SAVE"}
                </button>

              </div>
            )}

          </div>


          {/* FOOTER */}
          
          {/* PLAYER VERIFICATION STATUS */}
          <div
            className={`
              border p-5 transition-all duration-500
              ${
                isVerified
                  ? "border-teal-500/40 bg-teal-500/5"
                  : "border-sky-400/40 bg-sky-400/5"
              }
            `}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-[10px] tracking-widest">
                  PLAYER STATUS
                </p>

                <p
                  className={`
                    font-title text-lg tracking-widest mt-2
                    ${
                      isVerified
                        ? "text-teal-400"
                        : "text-sky-400"
                    }
                  `}
                >
                  {verificationLoading
                    ? "CHECKING..."
                    : isVerified
                    ? "VERIFIED"
                    : "UNVERIFIED"}
                </p>
              </div>

              {isVerified ? (
                <ShieldCheck
                  size={30}
                  className="text-teal-400"
                />
              ) : (
                <ShieldOff
                  size={30}
                  className="text-sky-400"
                />
              )}
            </div>

            {!isVerified && !verificationLoading && (
              <button
                type="button"
                onClick={() => {
                  setVerificationCode("");
                  setVerificationError("");
                  setVerificationMessage("");
                  setIsVerifyOpen(true);
                }}
                className="
                  w-full mt-5 py-3
                  border border-sky-400/50
                  text-sky-400
                  font-title tracking-widest
                  hover:bg-sky-400
                  hover:text-black
                  transition-all duration-300
                "
              >
                VERIFY PLAYER
              </button>
            )}
          </div>

          <p
            className="
            text-center text-gray-600
            text-[9px] tracking-[0.3em]
            mt-8 font-mono
          "
          >
            YOUR GAME. YOUR IDENTITY. SRISTI 2K26.
          </p>
        </div>
      </div>

      {/* VERIFICATION MODAL */}
      <div
        className={`
          fixed inset-0
          flex items-center justify-center
          p-4 bg-black/80 backdrop-blur-md
          transition-all duration-300
          ${
            isVerifyOpen
              ? "opacity-100 visible"
              : "opacity-0 invisible pointer-events-none"
          }
        `}
        style={{ zIndex: 1200 }}
        onClick={() => setIsVerifyOpen(false)}
      >
        <div
          className="
            w-full max-w-md
            bg-[#090909]
            border border-pink-500/40
            shadow-[0_0_50px_rgba(56,189,248,0.12)]
            p-7
          "
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-7">
            <div>
              <p className="text-pink-500 font-mono text-xs tracking-[0.3em]">
                PLAYER VERIFICATION
              </p>

              <h2 className="font-title text-2xl mt-2 text-white">
                enter code
              </h2>
            </div>

            <button
              type="button"
              onClick={() => setIsVerifyOpen(false)}
              className="
                w-9 h-9 border border-white/20
                flex items-center justify-center
                hover:border-pink-500 hover:text-pink-400
                transition-all
              "
            >
              <X size={18} />
            </button>
          </div>

          <p className="text-gray-400 text-sm mb-6">
            Enter the unique 6-character verification code
            provided by the SRISTI organizers.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleVerifyCode();
            }}
          >
            <label htmlFor="participant-verification-code" className="sr-only">
              Six-character participant verification code
            </label>
            <input
              id="participant-verification-code"
              type="text"
              value={verificationCode}
              onChange={(e) => {
                setVerificationCode(
                  e.target.value
                    .toUpperCase()
                    .replace(/[^A-Z0-9]/g, "")
                    .slice(0, 6)
                );

                setVerificationError("");
              }}
              placeholder="XXXXXX"
              maxLength={6}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              aria-describedby="participant-verification-count"
              className="
                w-full bg-black
                border border-pink-500/30
                focus:border-pink-500
                outline-none
                text-center text-2xl
                tracking-[0.5em] font-mono
                text-pink-500
                py-4 px-3
                transition-all
              "
            />

            <p id="participant-verification-count" className="text-gray-600 text-[10px] mt-2 tracking-widest text-right">
              {verificationCode.length}/6 CHARACTERS
            </p>

            {verificationError && (
              <p role="alert" className="mt-4 p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/30">
                {verificationError}
              </p>
            )}

            {verificationMessage && (
              <p role="status" className="mt-4 p-3 text-sm text-sky-400 bg-sky-500/10 border border-sky-500/30">
                {verificationMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={isVerifying}
              className="
                w-full mt-6 py-4
                bg-teal-500 text-black
                font-title tracking-widest
                hover:bg-teal-300
                transition-all duration-300
                disabled:opacity-40 disabled:cursor-not-allowed
              "
            >
              {isVerifying
                ? "VERIFYING..."
                : "CONFIRM VERIFICATION"}
            </button>
          </form>

          <p className="text-center text-gray-600 text-[9px] tracking-widest mt-5">
            SRISTI 2K26 · PLAYER AUTHENTICATION
          </p>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
