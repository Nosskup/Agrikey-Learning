import type { Entreprise } from "@/lib/pme/session";

/** En-tête des documents imprimés : logo, nom, coordonnées, couleur de l'entreprise. */
export default function EnTeteEntreprise({ entreprise }: { entreprise: Entreprise }) {
  const coordonnees = [entreprise.adresse, entreprise.ville, entreprise.telephone, entreprise.email]
    .filter(Boolean)
    .join(" · ");

  return (
    <header className="flex items-center gap-4 border-b-4 pb-4" style={{ borderColor: entreprise.couleur }}>
      {entreprise.logo_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={entreprise.logo_url} alt="" className="h-16 w-16 shrink-0 object-contain" />
      )}
      <div className="min-w-0">
        <p className="text-xl font-black" style={{ color: entreprise.couleur }}>
          {entreprise.nom}
        </p>
        {entreprise.activite && <p className="text-base text-slate-700">{entreprise.activite}</p>}
        {coordonnees && <p className="text-base text-slate-600">{coordonnees}</p>}
        {entreprise.rccm && <p className="text-base text-slate-600">RCCM : {entreprise.rccm}</p>}
      </div>
    </header>
  );
}
