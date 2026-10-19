import Link from "next/link";
import { exigerEntreprise } from "@/lib/pme/session";
import { iaDisponible } from "@/lib/pme/ia";
import { trouverFormat, type Creation } from "@/lib/pme/creations";
import { boutonPrincipal, boutonSecondaire, carte } from "@/components/pme/styles";
import BoutonMePrevenir from "./BoutonMePrevenir";
import { lireQuota, retirerAbandonnees } from "./quota";

export const metadata = { title: "Affiches et logos IA" };

function Bientot({ dejaInscrit }: { dejaInscrit: boolean }) {
  return (
    <div className="space-y-6">
      <div>
        <span className="inline-block rounded-full bg-slate-200 px-3 py-1 text-base font-bold text-slate-700">
          Bientôt disponible
        </span>
        <h1 className="mt-3 text-3xl font-black text-marine">Affiches et logos IA</h1>
      </div>

      <div className={`${carte} space-y-3 p-5 text-base text-slate-700`}>
        <p>Bientôt, décrivez ce que vous voulez en quelques mots, et AGRIKEY PME créera pour vous :</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>une affiche pour annoncer une promotion ou un événement ;</li>
          <li>un logo pour votre entreprise ;</li>
          <li>des visuels à partager sur WhatsApp et Facebook.</li>
        </ul>
      </div>

      <BoutonMePrevenir dejaInscrit={dejaInscrit} />

      <Link href="/pme" className={boutonSecondaire}>
        ← Retour au tableau de bord
      </Link>
    </div>
  );
}

export default async function AffichesPage() {
  const { supabase } = await exigerEntreprise();
  const quota = iaDisponible() ? await lireQuota(supabase) : null;

  if (!quota) {
    const { data: inscription } = await supabase.from("liste_attente_ia").select("id").maybeSingle();
    return <Bientot dejaInscrit={Boolean(inscription)} />;
  }

  if (quota.limite === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-black text-marine">Affiches et logos IA</h1>
        <p className={`${carte} p-5 text-base text-slate-700`}>
          Ce module n&apos;est pas ouvert pour votre compte. Pour y accéder, contactez votre association ou AGRIKEY.
        </p>
        <Link href="/pme" className={boutonSecondaire}>
          ← Retour au tableau de bord
        </Link>
      </div>
    );
  }

  const { data } = await supabase
    .from("creations_ia")
    .select("id, type, format, titre, demande, statut, created_at")
    .order("created_at", { ascending: false })
    .limit(60);
  const toutes = (data ?? []) as Creation[];

  const abandonnees = await retirerAbandonnees(supabase, toutes);
  // Crédits rendus : on relit le compteur du mois.
  const restantes = abandonnees.length ? ((await lireQuota(supabase))?.restantes ?? quota.restantes) : quota.restantes;
  const creations = toutes.filter((c) => !abandonnees.includes(c));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-marine">Affiches et logos IA</h1>
        <p className="mt-1 text-base text-slate-600">
          Décrivez votre idée en quelques mots : l&apos;IA crée l&apos;image, prête à partager sur WhatsApp et Facebook.
        </p>
      </div>

      <div className={`${carte} p-5`}>
        <p className="text-base font-semibold text-marine">
          {restantes} création{restantes > 1 ? "s" : ""} restante{restantes > 1 ? "s" : ""} ce mois-ci (sur{" "}
          {quota.limite})
        </p>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
          <div
            className="h-full rounded-full bg-agri"
            style={{ width: `${Math.min(100, (restantes / quota.limite) * 100)}%` }}
          />
        </div>
        {restantes <= 0 && (
          <p className="mt-2 text-base text-slate-600">Vos créations reviennent le 1er du mois prochain.</p>
        )}
      </div>

      {restantes > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Link href="/pme/affiches/nouvelle?type=affiche" className={boutonPrincipal}>
            🖼️ Créer une affiche
          </Link>
          <Link href="/pme/affiches/nouvelle?type=logo" className={boutonSecondaire}>
            ✏️ Créer un logo
          </Link>
        </div>
      )}

      <section className="space-y-3">
        <h2 className="text-xl font-black text-marine">Mes créations</h2>
        {creations.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-base text-slate-600">
            Vous n&apos;avez encore rien créé. Commencez par une affiche pour votre prochaine promotion !
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {creations.map((c) => {
              const format = trouverFormat(c.type, c.format);
              return (
                <li key={c.id}>
                  {c.statut === "pret" ? (
                    <Link
                      href={`/pme/affiches/${c.id}`}
                      className="block overflow-hidden rounded-2xl border border-slate-200 bg-white hover:border-agri"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element -- image privée servie par notre route */}
                      <img
                        src={`/pme/affiches/${c.id}/image`}
                        alt=""
                        width={format?.largeur}
                        height={format?.hauteur}
                        loading="lazy"
                        className="aspect-square w-full bg-slate-50 object-contain"
                      />
                      <span className="block truncate px-3 py-2 text-base font-semibold text-marine">{c.titre}</span>
                    </Link>
                  ) : (
                    <div className="flex aspect-square flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-3 text-center text-base text-slate-500">
                      ⏳ Création en cours…
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <Link href="/pme" className={boutonSecondaire}>
        ← Retour au tableau de bord
      </Link>
    </div>
  );
}
