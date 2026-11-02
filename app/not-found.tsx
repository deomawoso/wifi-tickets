import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page page-narrow page-center">
      <h1>Page introuvable</h1>
      <p className="muted">Cette page n'existe pas ou a été déplacée.</p>
      <Link href="/" className="btn">
        Retour à l'accueil
      </Link>
    </main>
  );
}
