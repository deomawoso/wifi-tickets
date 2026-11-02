import Link from "next/link";

export default function Home() {
  return (
    <main className="page">
      <section className="hero">
        <h1 className="hero-title">Un ticket Wi-Fi, payé depuis votre téléphone</h1>
        <p className="muted hero-lead">
          Choisissez une zone près de chez vous, payez en mobile money et
          recevez votre code tout de suite.
        </p>
        <div className="hero-actions">
          <Link href="/zones" className="btn">
            Voir les zones Wi-Fi
          </Link>
          <Link href="/inscription" className="btn btn-ghost">
            Vendre mes tickets
          </Link>
        </div>

        <div className="ticket ticket-gold hero-ticket" aria-hidden="true">
          <div className="ticket-main">
            <p className="muted text-sm">Exemple de ticket</p>
            <p className="font-semibold">Pass 1 heure</p>
            <p className="voucher-code">A8K2-91XQ</p>
          </div>
          <div className="ticket-stub">
            <p className="ticket-price">1 000 CDF</p>
            <span className="muted text-sm">Valable 1 h</span>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2>Comment ça marche</h2>
        <ol className="steps">
          <li>
            <div>
              <p className="font-semibold">Choisissez une zone</p>
              <p className="muted">Trouvez le point Wi-Fi le plus proche et son pass.</p>
            </div>
          </li>
          <li>
            <div>
              <p className="font-semibold">Payez en mobile money</p>
              <p className="muted">Votre ticket est réservé pendant 10 minutes.</p>
            </div>
          </li>
          <li>
            <div>
              <p className="font-semibold">Connectez-vous avec votre code</p>
              <p className="muted">Il s'affiche dès que le paiement est confirmé.</p>
            </div>
          </li>
        </ol>
      </section>

      <section className="card">
        <h2>Vous gérez une zone Wi-Fi ?</h2>
        <p className="muted mt-2">
          Créez un compte : nous activerons votre espace gérant pour que vous
          puissiez vendre vos tickets en ligne.
        </p>
        <Link href="/inscription" className="btn btn-ghost mt-3">
          Créer un compte
        </Link>
      </section>
    </main>
  );
}
