import Link from "next/link";
import { Suspense } from "react";
import { estAdmin, exigerEntreprise } from "@/lib/pme/session";
import { aujourdhui } from "@/lib/pme/format";
import { carte } from "@/components/pme/styles";
import Icone, { type NomIcone } from "@/components/pme/Icones";
import { DOMAINES } from "@/lib/opportunites/domaines";
import { annoncesAutomatiques, estValable, fusionner, type TypeAnnonce } from "@/lib/opportunites/flux";
import { annoncesManuelles, lireFavoris, lirePreferences, type Preferences } from "@/lib/opportunites/donnees";
import { SITES_UTILES } from "@/lib/opportunites/sites";
import CarteAnnonce, { BadgeDateLimite, dateRelative, LienAnnonce, STYLE_TYPES } from "./CarteAnnonce";
import BoutonEnregistrer from "./BoutonEnregistrer";

export const metadata = { title: "Opportunités" };

const ONGLETS: { cle: string; libelle: string; icone: NomIcone; type: TypeAnnonce | null }[] = [
  { cle: "emplois", libelle: "Emplois", icone: "emploi", type: "emploi" },
  { cle: "appels", libelle: "Appels d'offres", icone: "appel", type: "appel_offres" },
  { cle: "actualites", libelle: "Actualités", icone: "actualite", type: "actualite" },
  { cle: "enregistrees", libelle: "Mes annonces", icone: "etoile", type: null },
];

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
  const tousDomaines = parametres.tout === "1";

  const { supabase, user } = await exigerEntreprise();
  const [preferences, admin] = await Promise.all([lirePreferences(supabase), estAdmin(supabase, user.id)]);

  const domainesSuivis = DOMAINES.filter((d) => preferences.domaines.includes(d.code));

  const lien = (changements: Record<string, string | null>) => {
    const p = new URLSearchParams();
    const valeurs = { onglet: onglet.cle, tout: tousDomaines ? "1" : null, ...changements };
    for (const [cle, valeur] of Object.entries(valeurs)) if (valeur) p.set(cle, valeur);
    return `/pme/opportunites?${p.toString()}`;
  };

  return (
    <div className="space-y-5">
      {/* En-tête : domaines suivis */}
      <section className="relative overflow-hidden rounded-3xl bg-linear-to-br from-marine via-marine-clair to-agri-fonce p-5 text-white shadow-xl shadow-marine/20">
        <div aria-hidden="true" className="absolute -top-16 -right-10 h-44 w-44 rounded-full bg-white/10" />
        <div className="relative">
          <p className="text-sm font-semibold tracking-wide text-green-200 uppercase">Au Mali</p>
          <h1 className="text-3xl font-black tracking-tight">Opportunités</h1>
          <p className="mt-1 text-base text-slate-200">Offres d&apos;emploi, appels d&apos;offres et actualités encore valables.</p>

          <div className="mt-4 flex flex-wrap gap-2">
            {tousDomaines ? (
              <span className="rounded-full bg-white/15 px-3 py-1.5 text-sm font-semibold ring-1 ring-white/20">Tous les domaines</span>
            ) : (
              <>
                {domainesSuivis.map((d) => (
                  <span key={d.code} className="rounded-full bg-white/15 px-3 py-1.5 text-sm font-semibold ring-1 ring-white/20">
                    {d.icone} {d.libelle}
                  </span>
                ))}
                {preferences.motsCles.map((mot) => (
                  <span key={mot} className="rounded-full bg-white/10 px-3 py-1.5 text-sm ring-1 ring-white/15">
                    {mot}
                  </span>
                ))}
              </>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/pme/opportunites/domaines"
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-4 text-sm font-bold text-marine shadow-md active:scale-95"
            >
              <Icone nom="reglages" className="h-4 w-4" />
              {preferences.choisies ? "Mes domaines" : "Choisir mes domaines"}
            </Link>
            {onglet.type && (
              <Link
                href={lien({ tout: tousDomaines ? null : "1" })}
                className="inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-bold text-white ring-1 ring-white/40 hover:bg-white/10"
              >
                <Icone nom="globe" className="h-4 w-4" />
                {tousDomaines ? "Mes domaines seulement" : "Tous les domaines"}
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Onglets */}
      <nav aria-label="Type d'annonces" className={`${carte} grid grid-cols-4 gap-1 p-1.5`}>
        {ONGLETS.map((o) => {
          const actif = o.cle === onglet.cle;
          return (
            <Link
              key={o.cle}
              href={lien({ onglet: o.cle })}
              aria-current={actif ? "page" : undefined}
              className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-center text-xs leading-tight font-bold transition ${
                actif ? "bg-marine text-white shadow-md shadow-marine/25" : "text-slate-500 hover:bg-slate-50 hover:text-marine"
              }`}
            >
              <Icone nom={o.icone} plein={actif && o.icone === "etoile"} className="h-6 w-6" />
              {o.libelle}
            </Link>
          );
        })}
      </nav>

      {admin && onglet.type && (
        <Link
          href={`/pme/opportunites/ajouter?type=${onglet.type}`}
          className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-green-300 bg-green-50/60 text-base font-bold text-agri-fonce hover:bg-green-50"
        >
          <Icone nom="plus" className="h-5 w-5" />
          Publier une annonce
        </Link>
      )}

      <Suspense key={`${onglet.cle}-${tousDomaines}`} fallback={<Chargement />}>
        {onglet.type ? (
          <ListeAnnonces supabase={supabase} type={onglet.type} preferences={preferences} tousDomaines={tousDomaines} admin={admin} />
        ) : (
          <MesAnnonces supabase={supabase} />
        )}
      </Suspense>

      <SitesUtiles />
    </div>
  );
}

/** Cartes grisées pendant la recherche des annonces. */
function Chargement() {
  return (
    <div role="status" aria-label="Recherche des annonces en cours" className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className={`${carte} animate-pulse p-4`}>
          <div className="flex gap-3">
            <div className="h-12 w-12 rounded-2xl bg-slate-100" />
            <div className="flex-1 space-y-2 py-1">
              <div className="h-3 w-1/3 rounded-full bg-slate-100" />
              <div className="h-4 w-full rounded-full bg-slate-100" />
              <div className="h-4 w-2/3 rounded-full bg-slate-100" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function Vide({ titre, texte }: { titre: string; texte: string }) {
  return (
    <div className={`${carte} px-6 py-10 text-center`}>
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-400">
        <Icone nom="opportunites" className="h-8 w-8" />
      </span>
      <p className="mt-4 text-lg font-black text-marine">{titre}</p>
      <p className="mt-1 text-base text-slate-500">{texte}</p>
    </div>
  );
}

async function ListeAnnonces({
  supabase,
  type,
  preferences,
  tousDomaines,
  admin,
}: {
  supabase: ClientSupabase;
  type: TypeAnnonce;
  preferences: Preferences;
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
  const annonces = [...fusionner([manuelles], jour), ...fusionner([sources.flatMap((s) => s.annonces)], jour)].slice(
    0,
    MAX_ANNONCES
  );

  const liensEnregistres = new Set(favoris.map((f) => f.lien));
  const enPanne = sources.filter((s) => s.erreur).map((s) => s.nom);

  return (
    <section className="space-y-3">
      {enPanne.length > 0 && (
        <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-200">
          Source momentanément indisponible : {enPanne.join(", ")}. Les autres annonces s&apos;affichent normalement.
        </p>
      )}

      {annonces.length === 0 ? (
        <Vide
          titre="Aucune annonce valable pour le moment"
          texte="Ajoutez des domaines ou des mots-clés, affichez tous les domaines, ou revenez plus tard."
        />
      ) : (
        <>
          <p className="px-1 text-sm font-semibold text-slate-500">
            {annonces.length} annonce{annonces.length > 1 ? "s" : ""} valable{annonces.length > 1 ? "s" : ""}
          </p>
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
        </>
      )}

      <p className="px-4 text-center text-sm text-slate-400">
        Mises à jour toutes les heures. Vérifiez toujours l&apos;annonce sur le site d&apos;origine avant de candidater.
      </p>
    </section>
  );
}

async function MesAnnonces({ supabase }: { supabase: ClientSupabase }) {
  const jour = aujourdhui();
  const favoris = await lireFavoris(supabase);

  if (favoris.length === 0) {
    return <Vide titre="Aucune annonce enregistrée" texte="Touchez l'étoile d'une annonce pour la retrouver ici." />;
  }

  return (
    <ul className="space-y-3">
      {favoris.map((f) => {
        const style = STYLE_TYPES[f.type];
        const perimee = !estValable(
          { type: f.type, titre: f.titre, lien: f.lien, source: "", date: f.date_publication ?? undefined, dateLimite: f.date_limite ?? undefined },
          jour
        );
        return (
          <li key={f.id} className={`${carte} p-4 ${perimee ? "opacity-60" : ""}`}>
            <div className="flex gap-3">
              <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${style.teinte}`}>
                <Icone nom={style.icone} className="h-6 w-6" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-slate-500">
                  <span className="font-semibold text-slate-600">{f.source ?? style.libelle}</span>
                  {f.date_publication && ` · ${dateRelative(f.date_publication, jour)}`}
                </p>
                <LienAnnonce lien={f.lien} className="mt-1 line-clamp-3 block text-base leading-snug font-bold text-marine hover:text-agri">
                  {f.titre}
                </LienAnnonce>
              </div>
              <BoutonEnregistrer annonce={{ type: f.type, titre: f.titre, lien: f.lien, source: f.source ?? "" }} enregistree />
            </div>
            {(f.date_limite || perimee) && (
              <div className="mt-3 border-t border-slate-100 pt-3">
                {f.date_limite ? (
                  <BadgeDateLimite dateLimite={f.date_limite} aujourdhui={jour} />
                ) : (
                  <span className="text-sm font-semibold text-slate-500">Annonce ancienne : vérifiez qu&apos;elle est encore ouverte</span>
                )}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function SitesUtiles() {
  return (
    <details className={`${carte} group overflow-hidden`}>
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between px-4 text-base font-black text-marine">
        <span className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-marine">
            <Icone nom="globe" className="h-5 w-5" />
          </span>
          Sites utiles à consulter
        </span>
        <Icone nom="fleche" className="h-5 w-5 text-slate-400 transition group-open:rotate-90" />
      </summary>
      <div className="space-y-4 border-t border-slate-100 px-4 py-4">
        {SITES_UTILES.map((groupe) => (
          <div key={groupe.titre}>
            <h2 className="px-1 text-sm font-bold tracking-wide text-slate-400 uppercase">{groupe.titre}</h2>
            <ul className="mt-1 divide-y divide-slate-100">
              {groupe.sites.map((site) => (
                <li key={site.lien}>
                  <a
                    href={site.lien}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-14 items-center justify-between gap-3 px-1 py-2 hover:text-agri"
                  >
                    <span className="min-w-0">
                      <span className="block text-base font-bold text-marine">{site.nom}</span>
                      <span className="block text-sm text-slate-500">{site.description}</span>
                    </span>
                    <Icone nom="externe" className="h-5 w-5 shrink-0 text-slate-400" />
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
