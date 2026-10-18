import Link from "next/link";
import { Suspense } from "react";
import { estAdmin, exigerEntreprise } from "@/lib/pme/session";
import { aujourdhui } from "@/lib/pme/format";
import { boutonPrincipal, champ } from "@/components/pme/styles";
import { DOMAINES } from "@/lib/opportunites/domaines";
import { annoncesAutomatiques, contientUnMot, fusionner, type TypeAnnonce } from "@/lib/opportunites/flux";
import { annoncesManuelles, lireFavoris, lirePreferences, type Preferences } from "@/lib/opportunites/donnees";
import { SITES_UTILES } from "@/lib/opportunites/sites";
import CarteAnnonce, { BadgeDateLimite, datePublication } from "./CarteAnnonce";
import BoutonEnregistrer from "./BoutonEnregistrer";

export const metadata = { title: "Opportunités" };

const ONGLETS = [
  { cle: "emplois", libelle: "Emplois", icone: "💼", type: "emploi" },
  { cle: "appels", libelle: "Appels d'offres", icone: "📢", type: "appel_offres" },
  { cle: "actualites", libelle: "Actualités", icone: "📰", type: "actualite" },
  { cle: "enregistrees", libelle: "Mes annonces", icone: "★", type: null },
] as const;

type Onglet = (typeof ONGLETS)[number];

const MAX_ANNONCES = 40;

type ClientSupabase = Awaited<ReturnType<typeof exigerEntreprise>>["supabase"];

export default async function OpportunitesPage({
  searchParams,
}: {
  searchParams: Promise<{ [cle: string]: string | string[] | undefined }>;
}) {
  const parametres = await searchParams;
  const onglet: Onglet = ONGLETS.find((o) => o.cle === parametres.onglet) ?? ONGLETS[0];
  const recherche = typeof parametres.q === "string" ? parametres.q.trim().slice(0, 80) : "";
  const tousDomaines = parametres.tout === "1";

  const { supabase, user } = await exigerEntreprise();
  const [preferences, admin] = await Promise.all([lirePreferences(supabase), estAdmin(supabase, user.id)]);

  const libellesDomaines = DOMAINES.filter((d) => preferences.domaines.includes(d.code)).map((d) => d.libelle);
  const suivis = [...libellesDomaines, ...preferences.motsCles];

  const lien = (changements: Record<string, string | null>) => {
    const p = new URLSearchParams();
    const valeurs = { onglet: onglet.cle, q: recherche || null, tout: tousDomaines ? "1" : null, ...changements };
    for (const [cle, valeur] of Object.entries(valeurs)) if (valeur) p.set(cle, valeur);
    return `/pme/opportunites?${p.toString()}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-black text-marine">🔎 Opportunités</h1>
        <Link href="/pme" className="min-h-12 content-center text-base font-semibold text-slate-600 underline">
          Accueil
        </Link>
      </div>

      {/* Domaines suivis */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <p className="text-base text-slate-700">
          {tousDomaines ? (
            <>Tous les domaines, au Mali.</>
          ) : (
            <>
              Au Mali, dans vos domaines : <strong className="text-marine">{suivis.join(", ") || "aucun"}</strong>
            </>
          )}
        </p>
        <div className="mt-2 flex flex-wrap gap-x-4">
          <Link href="/pme/opportunites/domaines" className="inline-block min-h-12 content-center font-semibold text-agri underline">
            {preferences.choisies ? "Changer mes domaines" : "Choisir mes domaines"}
          </Link>
          {onglet.type && (
            <Link href={lien({ tout: tousDomaines ? null : "1" })} className="inline-block min-h-12 content-center font-semibold text-slate-600 underline">
              {tousDomaines ? "Revenir à mes domaines" : "Voir tous les domaines"}
            </Link>
          )}
        </div>
      </div>

      {/* Onglets */}
      <nav aria-label="Type d'annonces" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {ONGLETS.map((o) => (
          <Link
            key={o.cle}
            href={lien({ onglet: o.cle })}
            aria-current={o.cle === onglet.cle ? "page" : undefined}
            className={`flex min-h-12 items-center justify-center gap-1.5 rounded-xl border px-2 text-base font-bold ${
              o.cle === onglet.cle ? "border-marine bg-marine text-white" : "border-slate-300 bg-white text-marine hover:bg-slate-50"
            }`}
          >
            <span aria-hidden="true">{o.icone}</span> {o.libelle}
          </Link>
        ))}
      </nav>

      {/* Recherche */}
      {onglet.type && (
        <form action="/pme/opportunites" className="flex gap-2">
          <input type="hidden" name="onglet" value={onglet.cle} />
          {tousDomaines && <input type="hidden" name="tout" value="1" />}
          <label htmlFor="q" className="sr-only">
            Rechercher
          </label>
          <input id="q" name="q" type="search" defaultValue={recherche} placeholder="Rechercher (ex. Sikasso, riz…)" className={champ} />
          <button type="submit" className={`${boutonPrincipal} w-auto shrink-0`}>
            OK
          </button>
        </form>
      )}

      {admin && onglet.type && (
        <Link href={`/pme/opportunites/ajouter?type=${onglet.type}`} className={boutonPrincipal}>
          + Ajouter une annonce
        </Link>
      )}

      <Suspense key={`${onglet.cle}-${recherche}-${tousDomaines}`} fallback={<Chargement />}>
        {onglet.type ? (
          <ListeAnnonces
            supabase={supabase}
            type={onglet.type}
            preferences={preferences}
            recherche={recherche}
            tousDomaines={tousDomaines}
            admin={admin}
          />
        ) : (
          <MesAnnonces supabase={supabase} />
        )}
      </Suspense>

      <SitesUtiles />
    </div>
  );
}

function Chargement() {
  return (
    <p role="status" className="rounded-2xl border border-slate-200 bg-white p-5 text-center text-base text-slate-600">
      Recherche des annonces en cours…
    </p>
  );
}

async function ListeAnnonces({
  supabase,
  type,
  preferences,
  recherche,
  tousDomaines,
  admin,
}: {
  supabase: ClientSupabase;
  type: TypeAnnonce;
  preferences: Preferences;
  recherche: string;
  tousDomaines: boolean;
  admin: boolean;
}) {
  const jour = aujourdhui();
  const [manuelles, sources, favoris] = await Promise.all([
    annoncesManuelles(supabase, type, preferences, tousDomaines),
    annoncesAutomatiques(type, preferences.domaines, preferences.motsCles, tousDomaines),
    lireFavoris(supabase),
  ]);

  // Les annonces d'AGRIKEY passent en premier, puis les sources automatiques.
  let annonces = [...fusionner([manuelles], jour), ...fusionner([sources.flatMap((s) => s.annonces)], jour)];
  if (recherche) {
    const mots = recherche.split(/\s+/).filter(Boolean);
    annonces = annonces.filter((a) => mots.every((mot) => contientUnMot(`${a.titre} ${a.resume ?? ""} ${a.source}`, [mot])));
  }
  annonces = annonces.slice(0, MAX_ANNONCES);

  const liensEnregistres = new Set(favoris.map((f) => f.lien));
  const enPanne = sources.filter((s) => s.erreur).map((s) => s.nom);

  return (
    <section className="space-y-3">
      {enPanne.length > 0 && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-base text-amber-800">
          Source momentanément indisponible : {enPanne.join(", ")}. Les autres annonces s&apos;affichent normalement.
        </p>
      )}

      {annonces.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-base text-slate-700">
          <p className="font-semibold">Aucune annonce trouvée pour le moment.</p>
          <p className="mt-1">
            Essayez une autre recherche, ajoutez des domaines ou des mots-clés, ou consultez les sites ci-dessous.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {annonces.map((annonce) => (
            <CarteAnnonce
              key={annonce.lien}
              annonce={annonce}
              enregistree={liensEnregistres.has(annonce.lien)}
              aujourdhui={jour}
              admin={admin}
            />
          ))}
        </ul>
      )}

      <p className="text-center text-base text-slate-500">
        Annonces mises à jour toutes les heures. Vérifiez toujours les informations sur le site d&apos;origine avant de candidater.
      </p>
    </section>
  );
}

const LIBELLES_TYPES: Record<TypeAnnonce, string> = {
  emploi: "Emploi",
  appel_offres: "Appel d'offres",
  actualite: "Actualité",
};

async function MesAnnonces({ supabase }: { supabase: ClientSupabase }) {
  const jour = aujourdhui();
  const favoris = await lireFavoris(supabase);

  if (favoris.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 text-base text-slate-700">
        <p className="font-semibold">Aucune annonce enregistrée.</p>
        <p className="mt-1">Touchez « ☆ Enregistrer » sous une annonce pour la retrouver ici.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {favoris.map((f) => {
        const interne = f.lien.startsWith("/");
        return (
          <li key={f.id} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
            <div className="space-y-1">
              <p className="text-base text-slate-500">
                {LIBELLES_TYPES[f.type]}
                {f.source && ` · ${f.source}`}
                {f.date_publication && ` · ${datePublication(f.date_publication)}`}
              </p>
              {interne ? (
                <Link href={f.lien} className="block text-lg font-bold leading-snug text-marine hover:underline">
                  {f.titre}
                </Link>
              ) : (
                <a href={f.lien} target="_blank" rel="noopener noreferrer" className="block text-lg font-bold leading-snug text-marine hover:underline">
                  {f.titre} <span aria-hidden="true" className="text-base text-slate-400">↗</span>
                </a>
              )}
            </div>
            {f.date_limite && <BadgeDateLimite dateLimite={f.date_limite} aujourdhui={jour} />}
            <BoutonEnregistrer
              annonce={{ type: f.type, titre: f.titre, lien: f.lien, source: f.source ?? "" }}
              enregistree
            />
          </li>
        );
      })}
    </ul>
  );
}

function SitesUtiles() {
  return (
    <details className="rounded-2xl border border-slate-200 bg-white p-4">
      <summary className="min-h-12 cursor-pointer content-center text-lg font-bold text-marine">Sites utiles à consulter</summary>
      <div className="mt-3 space-y-4">
        {SITES_UTILES.map((groupe) => (
          <div key={groupe.titre}>
            <h2 className="text-base font-bold text-slate-800">{groupe.titre}</h2>
            <ul className="mt-1 space-y-1">
              {groupe.sites.map((site) => (
                <li key={site.lien}>
                  <a href={site.lien} target="_blank" rel="noopener noreferrer" className="inline-block min-h-12 content-center text-base">
                    <span className="font-semibold text-agri underline">{site.nom}</span>
                    <span className="text-slate-600"> — {site.description}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </details>
  );
}
