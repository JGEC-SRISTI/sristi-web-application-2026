import { useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import LiquidGradientBackground from "../components/LiquidGradientBackground";
import {
  faculty,
  students,
  type StaffGroup,
  type StaffMember,
} from "../data/staff";

const socials = [
  { label: "Instagram", href: "https://www.instagram.com/", icon: "bxl-instagram" },
  { label: "LinkedIn", href: "https://www.linkedin.com/", icon: "bxl-linkedin" },
  { label: "Facebook", href: "https://www.facebook.com/", icon: "bxl-facebook" },
];

const StaffCard = ({ member }: { member: StaffMember }) => (
  <article className="staff-card group">
    <div className="staff-card-image-wrap">
      <img className="staff-card-image" src={member.image} alt={`${member.name}, ${member.role}`} />
      <div className="staff-card-shade" />
      <div className="staff-socials" aria-label={`${member.name}'s social links`}>
        {socials.map(({ label, href, icon }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noreferrer"
            aria-label={`${member.name} on ${label}`}
            className="staff-social-link"
          >
            <i className={`bx ${icon}`} aria-hidden="true" />
          </a>
        ))}
      </div>
      <div className="staff-card-copy">
        <p className="staff-card-role">{member.role}</p>
        <h2>{member.name}</h2>
      </div>
    </div>
  </article>
);

const Committee = () => {
  const [activeGroup, setActiveGroup] = useState<StaffGroup>("faculty");
  const visibleStaff = useMemo(
    () => (activeGroup === "faculty" ? faculty : students),
    [activeGroup],
  );

  return (
    <main className="committee-page events-page min-h-screen text-white">
      <LiquidGradientBackground />
      <Navbar />

      <div className="relative z-10 mx-auto w-full max-w-[1440px] px-5 pb-16 pt-28 sm:px-8 lg:px-14">
        <header className="committee-heading">
          <div className="events-splash-wrap relative inline-block">
            <h1 className="font-squid text-5xl leading-none tracking-wider text-white/90 sm:text-6xl md:text-7xl lg:text-8xl">
              organizing staff
            </h1>
          </div>
          <p>the people behind sristi 2k26</p>
        </header>

        <div className="staff-filter-bar" role="group" aria-label="Staff category">
          {(["faculty", "students"] as const).map((group) => (
            <button
              key={group}
              type="button"
              onClick={() => setActiveGroup(group)}
              className={`staff-filter-button ${activeGroup === group ? "is-active" : ""}`}
              aria-pressed={activeGroup === group}
            >
              {group === "faculty" ? "Faculty coordinator" : "Student coordinators"}
            </button>
          ))}
        </div>

        <section
          key={activeGroup}
          className="staff-grid"
          aria-label={activeGroup === "faculty" ? "Faculty coordinators" : "Student coordinators"}
        >
          {visibleStaff.map((member) => (
            <StaffCard key={member.name} member={member} />
          ))}
        </section>
      </div>
    </main>
  );
};

export default Committee;
