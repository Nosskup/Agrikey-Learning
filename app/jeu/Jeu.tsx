"use client";

import { useEffect, useMemo, useState } from "react";
import { EVENEMENTS, libelleMetier } from "./evenements";
import { Avatar, Illustration } from "./Illustrations";
import {
  AGES_DES_TOURS,
  LIBELLES_JAUGES,
  REGIONS,
  TRAITS,
  appliquerChoix,
  bilanDeVie,
  choixDisponibles,
  demarrer,
  evenementDuTour,
  genrer,
  nomAuHasard,
  nomTrait,
  nouvellePartie,
  prenomAuHasard,
  probabilite,
  sceneDe,
  txt,
  type CleJauge,
  type CleTrait,
  type Etat,
  type Evenement,
  type Issue,
  type Sexe,
} from "./moteur";

const CLE_SAUVEGARDE = "dakan-partie-v2";

type Sauvegarde = { etat: Etat; evenementId: string | null };

export default function Jeu() {
  const [etat, setEtat] = useState<Etat | null>(null);
  const [evenement, setEvenement] = useState<Evenement | null>(null);
  const [issue, setIssue] = useState<Issue | null>(null);
  const [sauvegarde, setSauvegarde] = useState<Sauvegarde | null>(null);
  const [intro, setIntro] = useState(false);

  // Reprendre une partie en cours si elle existe.
  useEffect(() => {
    try {
      const brut = localStorage.getItem(CLE_SAUVEGARDE);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (brut) setSauvegarde(JSON.parse(brut));
    } catch {
      /* sauvegarde illisible : on l'ignore */
    }
  }, []);

  useEffect(() => {
    if (!etat) return;
    const s: Sauvegarde = { etat, evenementId: evenement?.id ?? null };
    localStorage.setItem(CLE_SAUVEGARDE, JSON.stringify(s));
  }, [etat, evenement]);

  function commencer(nouvel: Etat) {
    setEtat(nouvel);
    setIssue(null);
    setEvenement(null);
    setIntro(true);
  }

  function entrerDansLaVie() {
    if (!etat) return;
    const e = demarrer(etat);
    setEtat(e);
    setEvenement(evenementDuTour(e, EVENEMENTS));
    setIntro(false);
  }

  function reprendre() {
    if (!sauvegarde) return;
    const { etat: brut, evenementId } = sauvegarde;
    const e: Etat = { ...brut, traits: brut.traits ?? [], echecs: brut.echecs ?? 0 };
    setEtat(e);
    setIntro(false);
    if (e.fini) return;
    const ev =
      EVENEMENTS.find((x) => x.id === evenementId) ??
      evenementDuTour(e, EVENEMENTS);
    setEvenement(ev);
  }

  function choisir(index: number) {
    if (!etat || !evenement) return;
    const choix = choixDisponibles(evenement, etat)[index];
    setIssue(appliquerChoix(etat, evenement, choix));
  }

  function continuer() {
    if (!issue) return;
    const e = issue.etat;
    setEtat(e);
    setIssue(null);
    setEvenement(e.fini ? null : evenementDuTour(e, EVENEMENTS));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function recommencer() {
    localStorage.removeItem(CLE_SAUVEGARDE);
    setSauvegarde(null);
    setEtat(null);
    setEvenement(null);
    setIssue(null);
    setIntro(false);
  }

  return (
    <main className="min-h-screen bg-[#fbf6ee] bg-[radial-gradient(#ead9c0_1px,transparent_1px)] [background-size:18px_18px] text-[#2b1d12]">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
        {!etat && (
          <Creation
            onCommencer={commencer}
            sauvegarde={sauvegarde}
            onReprendre={reprendre}
          />
        )}

        {etat && intro && <Naissance etat={etat} onSuite={entrerDansLaVie} />}

        {etat && !intro && !etat.fini && (
          <>
            <Tableau etat={issue?.etat ?? etat} variations={issue?.variations} />
            {issue ? (
              <Resultat issue={issue} onSuite={continuer} />
            ) : (
              evenement && (
                <Scene etat={etat} evenement={evenement} onChoix={choisir} />
              )
            )}
          </>
        )}

        {etat && !intro && etat.fini && !issue && (
          <Fin etat={etat} onRecommencer={recommencer} />
        )}

        {etat && !etat.fini && (
          <div className="mt-10 text-center">
            <button
              onClick={recommencer}
              className="text-sm text-[#8a6a4f] underline underline-offset-4 hover:text-[#5a3d26]"
            >
              Abandonner et recommencer une vie
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

// ---------------------------------------------------------------------------

function Bandeau({ avecImage = false }: { avecImage?: boolean }) {
  return (
    <div className="mb-8 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#b5651d]">
        Un jeu de choix de vie
      </p>
      <h1 className="mt-2 font-serif text-5xl font-bold text-[#5a2e0e] sm:text-6xl">
        Dakan
      </h1>
      <p className="mt-2 text-lg text-[#7a5236]">
        « Destin » — grandir au Mali, de l&apos;enfance à l&apos;âge adulte
      </p>
      <div className="mx-auto mt-4 h-1.5 w-40 rounded-full bg-[linear-gradient(90deg,#14b53a_33%,#fcd116_33%_66%,#ce1126_66%)]" />
      {avecImage && (
        <div className="mt-6 overflow-hidden rounded-2xl border border-[#e8d9c4] shadow-sm">
          <Illustration scene="fleuve" className="block h-40 w-full sm:h-52" />
        </div>
      )}
    </div>
  );
}

function Carte({
  children,
  image,
  bordure = "border-[#e8d9c4]",
}: {
  children: React.ReactNode;
  image?: React.ReactNode;
  bordure?: string;
}) {
  return (
    <div className={`overflow-hidden rounded-2xl border-2 bg-white shadow-sm ${bordure}`}>
      {image}
      <div className="p-6 sm:p-8">{children}</div>
    </div>
  );
}

function BoutonPrincipal({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full rounded-xl bg-[#b5651d] px-6 py-3 text-lg font-semibold text-white transition hover:bg-[#8f4e14] disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------

function Creation({
  onCommencer,
  sauvegarde,
  onReprendre,
}: {
  onCommencer: (e: Etat) => void;
  sauvegarde: Sauvegarde | null;
  onReprendre: () => void;
}) {
  const [sexe, setSexe] = useState<Sexe | null>(null);
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [region, setRegion] = useState<number | null>(null);

  function choisirSexe(s: Sexe) {
    setSexe(s);
    setPrenom(prenomAuHasard(s));
    if (!nom) setNom(nomAuHasard());
  }

  const pret = sexe && prenom.trim() && nom.trim() && region !== null;

  return (
    <>
      <Bandeau avecImage />

      {sauvegarde && (
        <div className="mb-6 rounded-2xl border border-[#14b53a]/30 bg-[#effaf2] p-5 text-center">
          <p className="text-[#1f5130]">
            Une vie est en cours : <strong>{sauvegarde.etat.prenom}</strong>,{" "}
            {sauvegarde.etat.age} ans.
          </p>
          <button
            onClick={onReprendre}
            className="mt-3 rounded-lg bg-[#16834b] px-5 py-2 font-semibold text-white hover:bg-[#0f6338]"
          >
            Reprendre la partie
          </button>
        </div>
      )}

      <Carte>
        <h2 className="text-xl font-bold">Une nouvelle vie commence</h2>
        <p className="mt-1 text-[#7a5236]">
          Chaque choix aura des conséquences, jusqu&apos;à tes 25 ans. Il n&apos;y a
          pas de bonne réponse : seulement ta vie.
        </p>

        <h3 className="mt-6 font-semibold">Tu es…</h3>
        <div className="mt-2 grid grid-cols-2 gap-3">
          {(["fille", "garcon"] as Sexe[]).map((s) => (
            <button
              key={s}
              onClick={() => choisirSexe(s)}
              className={`rounded-xl border-2 p-4 text-lg font-semibold transition ${
                sexe === s
                  ? "border-[#b5651d] bg-[#fdf1e4]"
                  : "border-[#e8d9c4] hover:border-[#d4a373]"
              }`}
            >
              {s === "fille" ? "👧🏿 Une fille" : "👦🏿 Un garçon"}
            </button>
          ))}
        </div>

        {sexe && (
          <>
            <h3 className="mt-6 font-semibold">Ton nom</h3>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <div className="flex gap-2">
                <input
                  value={prenom}
                  onChange={(ev) => setPrenom(ev.target.value)}
                  placeholder="Prénom"
                  className="w-full rounded-lg border border-[#e8d9c4] px-3 py-2"
                />
                <button
                  onClick={() => setPrenom(prenomAuHasard(sexe))}
                  title="Prénom au hasard"
                  className="rounded-lg border border-[#e8d9c4] px-3 hover:bg-[#fdf1e4]"
                >
                  🎲
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  value={nom}
                  onChange={(ev) => setNom(ev.target.value)}
                  placeholder="Nom de famille"
                  className="w-full rounded-lg border border-[#e8d9c4] px-3 py-2"
                />
                <button
                  onClick={() => setNom(nomAuHasard())}
                  title="Nom au hasard"
                  className="rounded-lg border border-[#e8d9c4] px-3 hover:bg-[#fdf1e4]"
                >
                  🎲
                </button>
              </div>
            </div>

            <h3 className="mt-6 font-semibold">Tu nais à…</h3>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              {REGIONS.map((r, i) => (
                <button
                  key={r.nom}
                  onClick={() => setRegion(i)}
                  className={`rounded-xl border-2 p-3 text-left transition ${
                    region === i
                      ? "border-[#b5651d] bg-[#fdf1e4]"
                      : "border-[#e8d9c4] hover:border-[#d4a373]"
                  }`}
                >
                  <span className="font-semibold first-letter:uppercase">
                    {r.nom}
                  </span>
                  <span className="ml-2 rounded-full bg-[#f3e6d4] px-2 py-0.5 text-xs">
                    {r.milieu}
                  </span>
                  <p className="mt-1 text-sm text-[#7a5236]">{r.description}</p>
                </button>
              ))}
            </div>
          </>
        )}

        <div className="mt-8">
          <BoutonPrincipal
            disabled={!pret}
            onClick={() =>
              pret &&
              onCommencer(
                nouvellePartie(prenom.trim(), nom.trim(), sexe, region),
              )
            }
          >
            Naître
          </BoutonPrincipal>
        </div>
      </Carte>
    </>
  );
}


function Naissance({ etat, onSuite }: { etat: Etat; onSuite: () => void }) {
  return (
    <>
      <Bandeau />
      <Carte image={<Illustration scene="concession" etat={etat} className="block h-44 w-full sm:h-56" />}>
        <p className="text-sm font-semibold uppercase tracking-wider text-[#b5651d]">
          Jour 7 — le baptême
        </p>
        <h2 className="mt-1 text-2xl font-bold">
          Bienvenue, {etat.prenom} {etat.nomFamille}
        </h2>
        <p className="mt-4 text-lg leading-relaxed">{etat.journal[0]?.texte}</p>
        <p className="mt-4 leading-relaxed text-[#7a5236]">
          Les premières années passent, bercées par les chants des femmes, le bruit
          des pilons et les appels à la prière. Te voilà{" "}
          {etat.sexe === "fille" ? "grande" : "grand"} : ta vie, désormais, dépend
          aussi de tes choix.
        </p>
        <div className="mt-5 rounded-xl bg-[#fdf1e4] p-4 text-sm leading-relaxed text-[#5a3d26]">
          <p className="font-semibold">Comment ça marche</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              Les <strong>décisions majeures ★</strong> changent durablement ta
              trajectoire.
            </li>
            <li>
              Certains choix forgent ton <strong>caractère</strong> (traits) : ils
              augmentent tes chances et agissent chaque année.
            </li>
            <li>
              Tes actes ont des <strong>échos</strong> : ils peuvent revenir des
              années plus tard.
            </li>
            <li>🎲 indique une issue incertaine, avec tes chances de réussite.</li>
          </ul>
        </div>
        <div className="mt-8">
          <BoutonPrincipal onClick={onSuite}>Commencer ma vie</BoutonPrincipal>
        </div>
      </Carte>
    </>
  );
}

function PastilleTrait({ etat, trait }: { etat: Etat; trait: CleTrait }) {
  return (
    <span
      title={TRAITS[trait].effet}
      className="inline-flex cursor-help items-center gap-1 rounded-full border border-[#e8d9c4] bg-[#fdf8f1] px-2.5 py-0.5 text-xs font-semibold text-[#5a3d26]"
    >
      {TRAITS[trait].icone} {nomTrait(etat, trait)}
    </span>
  );
}

function situation(etat: Etat) {
  const d = etat.drapeaux;
  const metier = libelleMetier(etat);
  if (d.migrant) return `Vit ${d.migrant}`;
  if (metier) return metier.charAt(0).toUpperCase() + metier.slice(1);
  if (d.enEcole) return d.suiteBac ? "Étudiant·e" : d.lycee ? "Lycéen·ne" : "Élève";
  if (d.apprenti) return "Apprenti·e";
  if (etat.age < 14) return "Enfant";
  return "Sans emploi stable";
}

function Tableau({
  etat,
  variations,
}: {
  etat: Etat;
  variations?: Partial<Record<CleJauge, number>>;
}) {
  const progression = Math.round(
    (Math.min(etat.tour, AGES_DES_TOURS.length) / AGES_DES_TOURS.length) * 100,
  );
  const traits = etat.traits ?? [];
  return (
    <div className="mb-6 rounded-2xl border border-[#e8d9c4] bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <Avatar etat={etat} taille={60} />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="truncate text-lg font-bold">
              {etat.prenom} {etat.nomFamille}
            </span>
            <span className="shrink-0 rounded-full bg-[#5a2e0e] px-3 py-1 text-sm font-bold text-white">
              {etat.age} ans
            </span>
          </div>
          <p className="truncate text-sm text-[#7a5236]">
            {genrer(etat, situation(etat))} ·{" "}
            <span className="first-letter:uppercase">{etat.region}</span>
            {etat.drapeaux.marie ? " · 💍" : ""}
            {etat.drapeaux.enfants ? " · 👶" : ""}
          </p>
        </div>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#f3e6d4]">
        <div
          className="h-full bg-[#b5651d] transition-all"
          style={{ width: `${progression}%` }}
        />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
        {(Object.keys(LIBELLES_JAUGES) as CleJauge[]).map((cle) => {
          const v = etat.jauges[cle];
          const delta = variations?.[cle];
          const couleur =
            v >= 60 ? "bg-[#16834b]" : v >= 30 ? "bg-[#d99a2b]" : "bg-[#ce1126]";
          return (
            <div key={cle}>
              <div className="flex justify-between text-sm">
                <span>
                  {LIBELLES_JAUGES[cle].icone} {LIBELLES_JAUGES[cle].nom}
                </span>
                <span className="font-semibold tabular-nums">
                  {v}
                  {delta ? (
                    <span
                      className={`ml-1 ${delta > 0 ? "text-[#16834b]" : "text-[#ce1126]"}`}
                    >
                      {delta > 0 ? `+${delta}` : delta}
                    </span>
                  ) : null}
                </span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-[#f3e6d4]">
                <div
                  className={`h-full ${couleur} transition-all duration-500`}
                  style={{ width: `${v}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      {traits.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5 border-t border-[#f3e6d4] pt-3">
          <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-[#8a6a4f]">
            Caractère
          </span>
          {traits.map((t) => (
            <PastilleTrait key={t} etat={etat} trait={t} />
          ))}
        </div>
      )}
    </div>
  );
}

function Scene({
  etat,
  evenement,
  onChoix,
}: {
  etat: Etat;
  evenement: Evenement;
  onChoix: (i: number) => void;
}) {
  const choix = useMemo(
    () => choixDisponibles(evenement, etat),
    [evenement, etat],
  );
  const bordure = evenement.majeur
    ? "border-[#b5651d]"
    : evenement.echo
      ? "border-[#7c3aed]/50"
      : "border-[#e8d9c4]";
  return (
    <Carte
      bordure={bordure}
      image={
        <div className="relative">
          <Illustration
            scene={sceneDe(evenement, etat)}
            etat={etat}
            className="block h-44 w-full sm:h-56"
          />
          {evenement.majeur && (
            <span className="absolute left-3 top-3 rounded-full bg-[#b5651d] px-3 py-1 text-xs font-bold uppercase tracking-wider text-white shadow">
              ★ Décision majeure
            </span>
          )}
          {evenement.echo && (
            <span className="absolute left-3 top-3 rounded-full bg-[#6d28d9] px-3 py-1 text-xs font-bold uppercase tracking-wider text-white shadow">
              ↺ Ton passé te rattrape
            </span>
          )}
        </div>
      }
    >
      <p className="text-sm font-semibold uppercase tracking-wider text-[#b5651d]">
        {etat.age} ans
      </p>
      <h2 className="mt-1 text-2xl font-bold">{txt(evenement.titre, etat)}</h2>
      <p className="mt-4 text-lg leading-relaxed">{txt(evenement.texte, etat)}</p>
      {evenement.majeur && (
        <p className="mt-3 rounded-lg bg-[#fdf1e4] px-3 py-2 text-sm text-[#7a4a1d]">
          Ce choix façonnera la suite de ta vie. Prends le temps d&apos;y réfléchir.
        </p>
      )}
      <div className="mt-6 space-y-3">
        {choix.map((c, i) => {
          const p = probabilite(etat, evenement, c);
          return (
            <button
              key={i}
              onClick={() => onChoix(i)}
              className="flex w-full items-start gap-3 rounded-xl border-2 border-[#e8d9c4] p-4 text-left transition hover:border-[#b5651d] hover:bg-[#fdf1e4]"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#5a2e0e] text-sm font-bold text-white">
                {String.fromCharCode(65 + i)}
              </span>
              <span className="flex-1 pt-0.5">
                {txt(c.texte, etat)}
                {(p !== undefined || (c.traits && c.traits.length > 0)) && (
                  <span className="mt-1.5 flex flex-wrap gap-1.5 text-xs">
                    {p !== undefined && (
                      <span
                        className={`rounded-full px-2 py-0.5 font-semibold ${
                          p >= 0.6
                            ? "bg-[#e7f6ec] text-[#16834b]"
                            : p >= 0.35
                              ? "bg-[#fdf3dc] text-[#9a6a00]"
                              : "bg-[#fde8ea] text-[#ce1126]"
                        }`}
                      >
                        🎲 {Math.round(p * 100)} % de chances
                      </span>
                    )}
                    {c.traits
                      ?.filter((t) => !(etat.traits ?? []).includes(t))
                      .map((t) => (
                        <span
                          key={t}
                          title={TRAITS[t].effet}
                          className="rounded-full bg-[#f3e6d4] px-2 py-0.5 font-semibold text-[#5a3d26]"
                        >
                          forge : {TRAITS[t].icone} {nomTrait(etat, t)}
                        </span>
                      ))}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </Carte>
  );
}

function Resultat({ issue, onSuite }: { issue: Issue; onSuite: () => void }) {
  const e = issue.etat;
  return (
    <Carte>
      {issue.reussite !== undefined && (
        <p
          className={`mb-2 text-sm font-bold uppercase tracking-wider ${
            issue.reussite ? "text-[#16834b]" : "text-[#ce1126]"
          }`}
        >
          {issue.reussite ? "Le destin te sourit" : "Le sort en a décidé autrement"}
          {issue.chance !== undefined && (
            <span className="ml-2 font-normal normal-case tracking-normal text-[#8a6a4f]">
              ({Math.round(issue.chance * 100)} % de chances)
            </span>
          )}
        </p>
      )}
      <p className="text-lg leading-relaxed">{issue.resultat}</p>

      {issue.nouveauxTraits.length > 0 && (
        <div className="mt-5 space-y-2">
          {issue.nouveauxTraits.map((t) => (
            <div
              key={t}
              className="flex items-start gap-3 rounded-xl border border-[#d4a373] bg-[#fdf1e4] p-3"
            >
              <span className="text-2xl">{TRAITS[t].icone}</span>
              <div>
                <p className="font-bold">
                  Nouveau trait de caractère : {nomTrait(e, t)}
                </p>
                <p className="text-sm text-[#7a5236]">{TRAITS[t].effet}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {issue.changements.length > 0 && (
        <div className="mt-5 rounded-xl border border-[#14b53a]/30 bg-[#effaf2] p-3">
          <p className="text-xs font-bold uppercase tracking-wider text-[#16834b]">
            Ta vie change
          </p>
          <ul className="mt-1 space-y-1">
            {issue.changements.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      )}

      {issue.annee.length > 0 && (
        <div className="mt-5 rounded-xl bg-[#f7f2ea] p-3 text-sm text-[#5a3d26]">
          <p className="text-xs font-bold uppercase tracking-wider text-[#8a6a4f]">
            Les années passent…
          </p>
          <ul className="mt-1 space-y-0.5">
            {issue.annee.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8">
        <BoutonPrincipal onClick={onSuite}>
          {e.fini ? "Voir le bilan de ma vie" : `Continuer — ${e.age} ans`}
        </BoutonPrincipal>
      </div>
    </Carte>
  );
}

function sceneFinale(etat: Etat) {
  const d = etat.drapeaux;
  const m = String(d.metier ?? "");
  if (d.migrant) return "desert" as const;
  if (/agri|coopérative|karité/.test(m)) return "champ" as const;
  if (/atelier|garage|salon|compte|commerç|transport|transfert/.test(m)) return "atelier" as const;
  if (d.etudes && /master|universit|concours/.test(String(d.etudes))) return "diplome" as const;
  if (d.marie) return "fete" as const;
  return etat.milieu === "village" ? ("village" as const) : ("ville" as const);
}

function Fin({
  etat,
  onRecommencer,
}: {
  etat: Etat;
  onRecommencer: () => void;
}) {
  const bilan = bilanDeVie(etat, libelleMetier(etat));
  const majeures = etat.journal.filter((j) => j.majeur);
  const traits = etat.traits ?? [];
  return (
    <>
      <Bandeau />
      <Tableau etat={etat} />
      <Carte
        bordure="border-[#b5651d]"
        image={
          <Illustration
            scene={sceneFinale(etat)}
            etat={etat}
            className="block h-48 w-full sm:h-60"
          />
        }
      >
        <p className="text-sm font-semibold uppercase tracking-wider text-[#b5651d]">
          25 ans — bilan d&apos;une jeunesse
        </p>
        <div className="mt-1 flex items-center gap-4">
          <Avatar etat={etat} taille={72} />
          <div>
            <h2 className="text-3xl font-bold">{bilan.titre}</h2>
            <p className="text-[#7a5236]">Score de vie : {bilan.score} / 100</p>
          </div>
        </div>
        <div className="mt-5 space-y-3 text-lg leading-relaxed">
          {bilan.paragraphes.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        {traits.length > 0 && (
          <>
            <h3 className="mt-8 text-lg font-bold">Ton caractère</h3>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {traits.map((t) => (
                <div key={t} className="flex items-start gap-2 rounded-xl bg-[#fdf1e4] p-3">
                  <span className="text-xl">{TRAITS[t].icone}</span>
                  <div>
                    <p className="font-semibold">{nomTrait(etat, t)}</p>
                    <p className="text-sm text-[#7a5236]">{TRAITS[t].effet}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {majeures.length > 0 && (
          <>
            <h3 className="mt-8 text-lg font-bold">
              Les décisions qui ont façonné ta vie
            </h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {majeures.map((j, i) => (
                <div
                  key={i}
                  className="overflow-hidden rounded-xl border border-[#e8d9c4]"
                >
                  {j.scene && (
                    <Illustration
                      scene={j.scene}
                      etat={etat}
                      className="block h-20 w-full"
                    />
                  )}
                  <div className="p-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#b5651d]">
                      ★ {j.age} ans — {j.titre}
                    </p>
                    <p className="mt-1 text-sm text-[#5a3d26]">{j.texte}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <h3 className="mt-8 text-lg font-bold">Le fil de ta vie</h3>
        <ol className="mt-3 space-y-3 border-l-2 border-[#e8d9c4] pl-5">
          {etat.journal.map((j, i) => (
            <li key={i} className="relative">
              <span
                className={`absolute -left-[27px] top-1 h-3 w-3 rounded-full ${
                  j.majeur ? "bg-[#b5651d] ring-4 ring-[#fdf1e4]" : "bg-[#d4b48f]"
                }`}
              />
              <span className="font-semibold">
                {j.age} ans{j.titre ? ` — ${j.titre}` : ""}
              </span>
              <span className="block text-[#5a3d26]">{j.texte}</span>
            </li>
          ))}
        </ol>

        <div className="mt-8">
          <BoutonPrincipal onClick={onRecommencer}>Vivre une autre vie</BoutonPrincipal>
        </div>
      </Carte>
    </>
  );
}
