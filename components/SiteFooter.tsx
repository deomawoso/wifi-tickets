import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="footer">
      <p>© 2026 Tickets Wi-Fi</p>
      <p>
        <Link href="/conditions">Conditions d'utilisation</Link>
        <Link href="/confidentialite">Confidentialité</Link>
      </p>
    </footer>
  );
}
