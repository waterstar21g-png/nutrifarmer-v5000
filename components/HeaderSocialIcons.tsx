const SOCIAL_LINKS = [
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/',
    icon: (
      <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
        <path fill="currentColor" d="M12 2C6.5 2 2 6.5 2 12c0 5 3.7 9.1 8.4 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.3v7C18.3 21.1 22 17 22 12c0-5.5-4.5-10-10-10z" />
      </svg>
    ),
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/',
    icon: (
      <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
        <path fill="currentColor" d="M7 2h10a5 5 0 015 5v10a5 5 0 01-5 5H7a5 5 0 01-5-5V7a5 5 0 015-5zm5 5.5A4.5 4.5 0 1016.5 12 4.5 4.5 0 0012 7.5zm6.25-1.75a1.05 1.05 0 11-1.05 1.05 1.05 1.05 0 011.05-1.05z" />
      </svg>
    ),
  },
  {
    label: 'YouTube',
    href: 'https://www.youtube.com/',
    icon: (
      <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
        <path fill="currentColor" d="M21.8 8.001S21.6 6.623 21 6.016c-.76-.797-1.613-.801-2.004-.847-2.799-.202-6.997-.202-6.997-.202h-.009s-4.198 0-6.997.202c-.391.047-1.243.051-2.004.847-.6.607-.795 1.985-.795 1.985S2 9.62 2 11.238v1.517c0 1.618.2 3.237.2 3.237s.195 1.378.795 1.985c.761.797 1.76.771 2.205.855 1.6.153 6.8.201 6.8.201s4.203-.006 7.001-.209c.391-.047 1.243-.051 2.004-.847.6-.607.795-1.985.795-1.985s.2-1.618.2-3.237v-1.517C22 9.62 21.8 8.001 21.8 8.001zM9.935 14.594V8.974l5.404 2.82-5.404 2.8z" />
      </svg>
    ),
  },
] as const;

export function HeaderSocialIcons() {
  return (
    <ul className="nf-nav-bar__social" aria-label="소셜 미디어">
      {SOCIAL_LINKS.map(item => (
        <li key={item.label}>
          <a
            href={item.href}
            className="nf-nav-bar__social-link"
            aria-label={item.label}
            target="_blank"
            rel="noopener noreferrer"
          >
            {item.icon}
            <span className="nf-nav-bar__social-label">{item.label}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
