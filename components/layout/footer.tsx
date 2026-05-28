import Link from "next/link";

const legalLinks = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Use" },
  { href: "/dmca", label: "Copyright & DMCA" },
];

export function Footer() {
  return (
    <footer className="border-t bg-background/95">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-10 sm:grid-cols-2">
        <div className="flex items-start gap-3">
          <img
            src="/photos/logo.ico"
            alt="Downloader logo"
            className="h-9 w-9 rounded-md"
          />
          <div>
            <p className="text-lg font-semibold tracking-tight">Downloader</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Lightweight media downloader for supported links and formats.
            </p>
          </div>
        </div>

        <div className="sm:justify-self-end">
          <p className="text-sm font-semibold uppercase tracking-wide text-foreground/80">
            Legal
          </p>
          <nav className="mt-3 flex flex-col gap-2">
            {legalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
