"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="page page-narrow page-center">
      <h1>Une erreur est survenue</h1>
      <p className="muted">Réessayez dans un instant.</p>
      <button className="btn" onClick={reset}>
        Réessayer
      </button>
    </main>
  );
}
