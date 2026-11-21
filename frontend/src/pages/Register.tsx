
import {
  useEffect,
  useState,
  type SubmitEvent,
  type ChangeEvent,
} from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Loader2, UserPlus, UserRound } from "lucide-react";

interface FormData {
  full_name: string;
  email: string;
  phone: string;
  college_name: string;
  college_roll: string;
  department: string;
  academic_year: string;
}

const Register = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState<FormData>({
    full_name: "",
    email: "",
    phone: "",
    college_name: "",
    college_roll: "",
    department: "",
    academic_year: "",
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;

    
    const loadUser = async () => {
        if (!supabase) {
            setErrorMessage("Supabase configuration is missing.");
            setLoading(false);
            return;
        }

        // Get the authenticated user directly from Supabase.
        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (!active) return;

        if (userError || !user) {
            console.error("User fetch error:", userError);
            navigate("/", { replace: true });
            return;
        }

        // Check if the participant already has a profile.
        const { data: existingProfile, error: profileError } =
            await supabase
            .from("profiles")
            .select("id")
            .eq("id", user.id)
            .maybeSingle();

        if (!active) return;

        if (profileError) {
            console.error("PROFILE CHECK ERROR:", {
                message: profileError.message,
                code: profileError.code,
                details: profileError.details,
                hint: profileError.hint,
            });

            setErrorMessage(
                `Profile error: ${profileError.message}`
            );

            setLoading(false);
            return;
        }

        if (existingProfile) {
            navigate("/", { replace: true });
            return;
        }

        // Extract Google account information.
        const metadata = user.user_metadata ?? {};

        console.log("Google user metadata:", metadata);
        console.log("Google user email:", user.email);

        const googleName =
            metadata.full_name ||
            metadata.name ||
            [metadata.given_name, metadata.family_name]
            .filter(Boolean)
            .join(" ") ||
            "";

        setForm((previous) => ({
            ...previous,
            full_name: googleName,
            email: user.email || "",
        }));

        setLoading(false);
    };


    loadUser();

    return () => {
      active = false;
    };
  }, [navigate]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    let filteredValue = value;

    if (name === "phone" || name === "college_roll") {
      filteredValue = value.replace(/[^0-9]/g, "");
    } else if (name === "college_name" || name === "department") {
      filteredValue = value.replace(/[^a-zA-Z ]/g, "");
    }

    setForm((previous) => ({
      ...previous,
      [name]: filteredValue,
    }));
  };

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage("");

    if (!supabase) {
      setErrorMessage("Supabase configuration is missing.");
      return;
    }

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      setErrorMessage("Your session has expired. Please sign in again.");
      return;
    }

    const requiredFields = [
      form.full_name,
      form.phone,
      form.college_name,
      form.college_roll,
      form.department,
      form.academic_year,
    ];

    if (requiredFields.some((value) => !value.trim())) {
      setErrorMessage("Please complete all required fields.");
      return;
    }

    if (!/^\d{10}$/.test(form.phone)) {
      setErrorMessage("Mobile number must contain exactly 10 digits.");
      return;
    }

    if (!/^\d+$/.test(form.college_roll)) {
      setErrorMessage("College roll number must contain digits only.");
      return;
    }

    const academicYear = Number(form.academic_year);

    if (
      !Number.isInteger(academicYear) ||
      academicYear < 1 ||
      academicYear > 4
    ) {
      setErrorMessage("Please select a valid academic year.");
      return;
    }

    try {
      setSubmitting(true);

      const { error } = await supabase
        .from("profiles")
        .insert({
          id: session.user.id,
          full_name: form.full_name.trim(),
          phone: form.phone.trim(),
          college_name: form.college_name.trim(),
          college_roll: form.college_roll.trim(),
          department: form.department.trim(),
          academic_year: academicYear,
        });

      if (error) throw error;

      // Tell the Navbar to reload the newly created profile.
      window.dispatchEvent(new Event("sristi-profile-updated"));

      navigate("/", { replace: true });
    } catch (error) {
      console.error("Registration failed:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Registration failed. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full bg-black/50 border border-white/15 px-4 py-3 text-white outline-none transition-all duration-300 focus:border-pink-500 focus:ring-1 focus:ring-pink-500/30 placeholder:text-gray-600";

  const labelClass =
    "block text-xs tracking-[0.2em] text-gray-400 mb-2 font-mono";

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-pink-500">
        <Loader2 className="animate-spin mb-4" size={35} />
        <p className="font-mono tracking-[0.3em] text-xs">
          VERIFYING PLAYER IDENTITY...
        </p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white relative overflow-hidden px-4 py-28">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.07]">
        <div className="absolute top-20 left-10 w-40 h-40 border border-pink-500 rotate-45" />
        <div className="absolute bottom-20 right-10 w-52 h-52 rounded-full border border-pink-500" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border border-pink-500/50 text-pink-500 mb-5">
            <UserRound size={30} />
          </div>

          <p className="text-pink-500 font-mono text-xs tracking-[0.4em] mb-3">
            PLAYER REGISTRATION
          </p>

          <h1 className="font-title text-4xl md:text-6xl">
            enter the <span className="text-pink-500">arena</span>
          </h1>

          <p className="text-gray-400 text-sm mt-4">
            Complete your player information to register for SRISTI 2K26.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="border border-pink-500/30 bg-[#090909]/95 backdrop-blur-xl p-6 md:p-10 shadow-[0_0_50px_rgba(236,72,153,0.08)]"
        >
          <div className="flex items-center gap-3 mb-8 pb-5 border-b border-white/10">
            <UserPlus className="text-pink-500" size={22} />
            <div>
              <h2 className="font-title tracking-widest">
                PLAYER INFORMATION
              </h2>
              <p className="text-gray-500 text-xs mt-1">
                Fields marked with * are required.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelClass}>FULL NAME *</label>
              <input
                type="text"
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                placeholder="Enter your full name"
                className={inputClass}
                required
              />
              <p className="text-[10px] text-gray-600 mt-1">
                Retrieved from Google. You can edit your name.
              </p>
            </div>

            <div>
              <label className={labelClass}>EMAIL ADDRESS *</label>
              <input
                type="email"
                name="email"
                value={form.email}
                readOnly
                className={`${inputClass} opacity-70 cursor-not-allowed`}
              />
              <p className="text-[10px] text-gray-600 mt-1">
                Retrieved from your Google account
              </p>
            </div>

            <div>
              <label className={labelClass}>MOBILE NUMBER *</label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                inputMode="numeric"
                pattern="[0-9]{10}"
                maxLength={10}
                title="Enter exactly 10 digits"
                placeholder="10-digit mobile number"
                className={inputClass}
                required
              />
              <p className="mt-1 text-xs text-gray-400">Enter exactly 10 digits.</p>
            </div>

            <div>
              <label htmlFor="college-name" className={labelClass}>COLLEGE NAME *</label>
              <input
                id="college-name"
                name="college_name"
                pattern="[A-Za-z ]+"
                aria-describedby="college-name-format"
                value={form.college_name}
                onChange={handleChange}
                placeholder="Enter college name"
                className={inputClass}
                required
              />
              <p id="college-name-format" className="mt-1 text-xs text-gray-400">
                Letters A–Z, a–z, and spaces only.
              </p>
            </div>

            <div>
              <label htmlFor="college-roll" className={labelClass}>COLLEGE ROLL NUMBER *</label>
              <input
                id="college-roll"
                name="college_roll"
                inputMode="numeric"
                pattern="[0-9]+"
                aria-describedby="college-roll-format"
                value={form.college_roll}
                onChange={handleChange}
                placeholder="Enter roll number"
                className={inputClass}
                required
              />
              <p id="college-roll-format" className="mt-1 text-xs text-gray-400">
                Digits 0–9 only; no spaces or letters.
              </p>
            </div>

            <div>
              <label htmlFor="department" className={labelClass}>DEPARTMENT *</label>
              <input
                id="department"
                name="department"
                pattern="[A-Za-z ]+"
                aria-describedby="department-format"
                value={form.department}
                onChange={handleChange}
                placeholder="e.g. CSE, ECE, IT"
                className={inputClass}
                required
              />
              <p id="department-format" className="mt-1 text-xs text-gray-400">
                Letters A–Z, a–z, and spaces only.
              </p>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="academic-year" className={labelClass}>
                ACADEMIC YEAR *
              </label>
              <select
                id="academic-year"
                name="academic_year"
                value={form.academic_year}
                onChange={handleChange}
                className={`${inputClass} registration-year-select`}
                required
              >
                <option value="" disabled>
                  Select your academic year
                </option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
            </div>
          </div>

          {errorMessage && (
            <div className="mt-6 border border-red-500/40 bg-red-500/10 text-red-400 text-sm p-4">
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-8 py-4 bg-pink-600 text-white font-title tracking-[0.2em] hover:bg-pink-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {submitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                REGISTERING...
              </>
            ) : (
              "COMPLETE REGISTRATION"
            )}
          </button>

          <p className="text-center text-gray-600 text-[10px] tracking-widest mt-5">
            YOUR GAME. YOUR IDENTITY. SRISTI 2K26.
          </p>
        </form>
      </div>
    </main>
  );
};

export default Register;
