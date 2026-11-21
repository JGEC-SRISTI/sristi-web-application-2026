
interface Developer {
  name: string;
  number: string;
  image: string;
  roles: string[];
  email: string;
  linkedin: string;
  github: string;
}

interface DevCardProps {
  developer: Developer;
  index: number;
}

function DevCard({ developer, index }: DevCardProps) {
  return (
    <article
      className="dev-card"
      style={{ animationDelay: `${index * 150}ms` }}
    >
      <div className="dev-card-top">
        <span className="dev-card-number">
          Frontman {developer.number}
        </span>

        <span className="dev-card-symbol">
          {index % 3 === 0
            ? "○"
            : index % 3 === 1
            ? "△"
            : "□"}
        </span>
      </div>

      <div className="dev-image-container">
        <div className="dev-image-glow" />

        <img
          src={developer.image}
          alt={developer.name}
          className="dev-person-image"
          loading="lazy"
        />

        <div className="dev-image-gradient" />
      </div>

      <div className="dev-card-info">
        <span className="dev-card-label">
          DEVELOPMENT SQUAD
        </span>

        <h2 className="dev-title">{developer.name}</h2>

        <div className="dev-role-list">
          {developer.roles.map((role) => (
            <span key={role}>{role}</span>
          ))}
        </div>

        <div className="dev-socials">
          <a
            href={`mailto:${developer.email}`}
            aria-label={`Email ${developer.name}`}
            title="Email"
          >
            <i className="bx bx-envelope" />
          </a>

          <a
            href={developer.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${developer.name} LinkedIn`}
            title="LinkedIn"
          >
            <i className="bx bxl-linkedin" />
          </a>

          <a
            href={developer.github}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${developer.name} GitHub`}
            title="GitHub"
          >
            <i className="bx bxl-github" />
          </a>
        </div>
      </div>

      <div className="dev-card-bottom">
        <span>SRISTI 2K26</span>
        <span>JGEC</span>
      </div>
    </article>
  );
}

export default DevCard;
