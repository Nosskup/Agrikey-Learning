import Link from "next/link";
import type { Annonce, TypeAnnonce } from "@/lib/opportunites/flux";
import BoutonSupprimer from "@/components/pme/BoutonSupprimer";
import Icone, { type NomIcone } from "@/components/pme/Icones";
import { carte } from "@/components/pme/styles";
import BoutonEnregistrer from "./BoutonEnregistrer";
import { supprimerAnnonce } from "./actions";

export const STYLE_TYPES: Record<TypeAnnonce, { icone: NomIcone; libelle: string; teinte: string }> = {
  emploi: { icone: "emploi", libelle: "Emploi", teinte: "bg-sky-50 text-sky-700" },
  appel_offres: { icone: "appel", libelle: "Appel d'offres", teinte: "bg-amber-50 text-amber-700" },
  actualite: { icone: "actualite", libelle: "Actualité", teinte: "bg-violet-50 text-violet-700" },
};

/** "2026-10-18T09:00:00Z" -> "18 oct. 2026" */
export function datePublication(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

/** "Aujourd'hui", "Hier", "Il y a 4 jours", ou la date au-delà d'une semaine. */
export function dateRelative(iso: string, aujourdhui: string): string {
  const jours = Math.floor((Date.parse(`${aujourdhui}T23:59:59Z`) - Date.parse(iso)) / 86_400_000);
  if (jours <= 0) return "Aujourd'hui";
  if (jours === 1) return "Hier";
  if (jours < 7) return `Il y a ${jours} jours`;
  return datePublication(iso);
}

/** Nombre de jours entre aujourd'hui et la date limite (AAAA-MM-JJ). */
function joursRestants(dateLimite: string, aujourdhui: string): number {
  return Math.round((Date.parse(dateLimite) - Date.parse(aujourdhui)) / 86_400_000);
}

export function BadgeDateLimite({ dateLimite, aujourdhui }: { dateLimite: string; aujourdhui: string }) {
  const jours = joursRestants(dateLimite, aujourdhui);
  const urgent = jours <= 7;
  const texte =
    jours < 0
      ? "Date limite dépassée"
      : jours === 0
        ? "Dernier jour aujourd'hui"
        : urgent
          ? `Plus que ${jours} jour${jours > 1 ? "s" : ""}`
          : `Jusqu'au ${datePublication(`${dateLimite}T12:00:00Z`)}`;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold ${
        urgent ? "bg-red-50 text-red-700" : "bg-green-50 text-agri-fonce"
      }`}
    >
      <Icone nom="calendrier" className="h-4 w-4" />
      {texte}
    </span>
  );
}

/** Titre de l'annonce : lien interne, ou externe ouvert dans un nouvel onglet. */
export function LienAnnonce({ lien, className, children }: { lien: string; className: string; children: React.ReactNode }) {
  if (lien.startsWith("/")) {
    return (
      <Link href={lien} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <a href={lien} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
    </a>
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
  const style = STYLE_TYPES[annonce.type];

  return (
    <li className={`${carte} p-4`}>
      <div className="flex gap-3">
        <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${style.teinte}`}>
          <Icone nom={style.icone} className="h-6 w-6" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-x-1.5 text-sm text-slate-500">
            {annonce.idManuelle && (
              <span className="rounded-md bg-marine px-1.5 py-0.5 text-xs font-bold tracking-wide text-white">AGRIKEY</span>
            )}
            <span className="truncate font-semibold text-slate-600">{annonce.source}</span>
            {annonce.date && (
              <>
                <span aria-hidden="true">·</span>
                <span>{dateRelative(annonce.date, aujourdhui)}</span>
              </>
            )}
          </p>
          <LienAnnonce lien={annonce.lien} className="mt-1 line-clamp-3 block text-base leading-snug font-bold text-marine hover:text-agri">
            {annonce.titre}
          </LienAnnonce>
        </div>

        <BoutonEnregistrer annonce={annonce} enregistree={enregistree} />
      </div>

      {annonce.resume && <p className="mt-3 line-clamp-2 text-base text-slate-600">{annonce.resume}</p>}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
        {annonce.dateLimite ? (
          <BadgeDateLimite dateLimite={annonce.dateLimite} aujourdhui={aujourdhui} />
        ) : (
          <span className="text-sm font-semibold text-slate-400">{style.libelle}</span>
        )}
        <div className="flex items-center gap-2">
          {admin && annonce.idManuelle && (
            <BoutonSupprimer
              action={supprimerAnnonce.bind(null, annonce.idManuelle)}
              question="Supprimer cette annonce pour tous les membres ?"
            />
          )}
          <LienAnnonce
            lien={annonce.lien}
            className="inline-flex min-h-10 items-center gap-1 rounded-full bg-marine px-4 text-sm font-bold text-white hover:bg-marine-clair"
          >
            Voir
            <Icone nom={annonce.lien.startsWith("/") ? "fleche" : "externe"} className="h-4 w-4" />
          </LienAnnonce>
        </div>
      </div>
    </li>
  );
}
