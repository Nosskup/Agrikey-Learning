import Link from "next/link";
import type { Annonce } from "@/lib/opportunites/flux";
import BoutonSupprimer from "@/components/pme/BoutonSupprimer";
import BoutonEnregistrer from "./BoutonEnregistrer";
import { supprimerAnnonce } from "./actions";

/** "2026-10-18T09:00:00Z" -> "18 oct. 2026" */
export function datePublication(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

/** Nombre de jours entre aujourd'hui et la date limite (AAAA-MM-JJ). */
function joursRestants(dateLimite: string, aujourdhui: string): number {
  return Math.round((Date.parse(dateLimite) - Date.parse(aujourdhui)) / 86_400_000);
}

export function BadgeDateLimite({ dateLimite, aujourdhui }: { dateLimite: string; aujourdhui: string }) {
  const jours = joursRestants(dateLimite, aujourdhui);
  const urgent = jours <= 7;
  const texte =
    jours < 0 ? "Date limite dépassée" : jours === 0 ? "Dernier jour aujourd'hui" : `Date limite : ${datePublication(`${dateLimite}T12:00:00Z`)}`;

  return (
    <span
      className={`inline-block rounded-full px-3 py-0.5 text-base font-bold ${
        urgent ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-800"
      }`}
    >
      {texte}
      {jours > 0 && urgent && ` (${jours} j)`}
    </span>
  );
}

export default function CarteAnnonce({
  annonce,
  enregistree,
  aujourdhui,
  admin,
}: {
  annonce: Annonce;
  enregistree: boolean;
  aujourdhui: string;
  admin: boolean;
}) {
  const interne = annonce.lien.startsWith("/");

  return (
    <li className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
      <div className="space-y-1">
        <p className="text-base text-slate-500">
          {annonce.idManuelle && <span className="mr-2 rounded-md bg-marine px-2 py-0.5 font-bold text-white">AGRIKEY</span>}
          {annonce.source}
          {annonce.date && ` · ${datePublication(annonce.date)}`}
        </p>
        {interne ? (
          <Link href={annonce.lien} className="block text-lg font-bold leading-snug text-marine underline-offset-2 hover:underline">
            {annonce.titre}
          </Link>
        ) : (
          <a
            href={annonce.lien}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-lg font-bold leading-snug text-marine underline-offset-2 hover:underline"
          >
            {annonce.titre} <span aria-hidden="true" className="text-base text-slate-400">↗</span>
          </a>
        )}
      </div>

      {annonce.dateLimite && <BadgeDateLimite dateLimite={annonce.dateLimite} aujourdhui={aujourdhui} />}

      {annonce.resume && <p className="line-clamp-3 text-base text-slate-700">{annonce.resume}</p>}

      <div className="flex flex-wrap gap-2">
        <BoutonEnregistrer annonce={annonce} enregistree={enregistree} />
        {admin && annonce.idManuelle && (
          <BoutonSupprimer
            action={supprimerAnnonce.bind(null, annonce.idManuelle)}
            question="Supprimer cette annonce pour tous les membres ?"
          />
        )}
      </div>
    </li>
  );
}
