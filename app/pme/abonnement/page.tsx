import Link from "next/link";
import { estPremium, exigerEntreprise } from "@/lib/pme/session";
import { dateLongue, formatFCFA } from "@/lib/pme/format";
import { carte } from "@/components/pme/styles";
import Icone from "@/components/pme/Icones";
import { AVANTAGES_PREMIUM, FORMULES, formuleParCode } from "@/lib/pme/formules";
import { MODE_PAYDUNYA } from "@/lib/pme/paydunya";
import BoutonPayer from "./BoutonPayer";

export const metadata = { title: "Abonnement" };

type Paiement = { id: string; created_at: string; formule: string; montant: number; statut: string; mode: string };

const STATUTS: Record<string, { libelle: string; style: string }> = {
  paye: { libelle: "Payé", style: "bg-green-50 text-agri-fonce" },
  en_attente: { libelle: "Non finalisé", style: "bg-slate-100 text-slate-600" },
  annule: { libelle: "Annulé", style: "bg-slate-100 text-slate-600" },
  echoue: { libelle: "Échoué", style: "bg-red-50 text-red-700" },
};

export default async function AbonnementPage({
  searchParams,
}: {
  searchParams: Promise<{ [cle: string]: string | string[] | undefined }>;
}) {
  const { annule } = await searchParams;
  const { supabase } = await exigerEntreprise();

  const [premium, { data: abonnement }, { data: paiements }] = await Promise.all([
    estPremium(supabase),
    supabase.from("pme_abonnements").select("formule, actif_jusqua").maybeSingle<{ formule: string; actif_jusqua: string }>(),
    supabase
      .from("pme_paiements")
      .select("id, created_at, formule, montant, statut, mode")
      .order("created_at", { ascending: false })
      .limit(10)
      .returns<Paiement[]>(),
  ]);

  // Les paiements abandonnés sur la page PayDunya restent « en attente » : inutile de les montrer.
  const historique = (paiements ?? []).filter((p) => p.statut !== "en_attente");

  return (
    <div className="space-y-5">
      {MODE_PAYDUNYA === "test" && (
        <p className="flex items-start gap-3 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900 ring-1 ring-amber-200">
          <span className="rounded-md bg-amber-400 px-1.5 py-0.5 text-xs font-black text-amber-950">TEST</span>
          Mode test PayDunya : aucun argent réel n&apos;est débité. Utilisez les comptes de test fournis par PayDunya.
        </p>
      )}

      {annule === "1" && (
        <p className="rounded-2xl bg-slate-100 px-4 py-3 text-base text-slate-700">Paiement annulé. Rien n&apos;a été débité.</p>
      )}

      {/* Statut */}
      <section className="relative overflow-hidden rounded-3xl bg-linear-to-br from-marine via-marine-clair to-agri-fonce p-5 text-white shadow-xl shadow-marine/20">
        <div aria-hidden="true" className="absolute -top-16 -right-10 h-44 w-44 rounded-full bg-white/10" />
        <div className="relative">
          <p className="text-sm font-semibold tracking-wide text-green-200 uppercase">Mon abonnement</p>
          {premium && abonnement ? (
            <>
              <h1 className="mt-1 flex items-center gap-2 text-3xl font-black tracking-tight">
                Premium
                <span className="rounded-full bg-amber-400 px-2.5 py-0.5 text-sm font-black text-amber-950">Actif</span>
              </h1>
              <p className="mt-1 text-base text-slate-200">
                {formuleParCode(abonnement.formule)?.titre ?? "Premium"} · jusqu&apos;au {dateLongue(abonnement.actif_jusqua)}
              </p>
            </>
          ) : (
            <>
              <h1 className="mt-1 text-3xl font-black tracking-tight">Gratuit</h1>
              <p className="mt-1 text-base text-slate-200">Passez à Premium pour aller plus loin avec votre entreprise.</p>
            </>
          )}
        </div>
      </section>

      {/* Avantages */}
      <section className={`${carte} p-5`}>
        <h2 className="text-lg font-black text-marine">Avec Premium</h2>
        <ul className="mt-3 space-y-2.5">
          {AVANTAGES_PREMIUM.map((avantage) => (
            <li key={avantage} className="flex items-start gap-3 text-base text-slate-700">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-50 text-agri">
                <Icone nom="verifie" className="h-4 w-4" />
              </span>
              {avantage}
            </li>
          ))}
        </ul>
      </section>

      {/* Formules */}
      <section className="space-y-3">
        <h2 className="px-1 text-lg font-black text-marine">{premium ? "Prolonger mon abonnement" : "Choisir une formule"}</h2>
        {FORMULES.map((formule, i) => {
          const miseEnAvant = Boolean(formule.accroche);
          return (
            <div
              key={formule.code}
              className={`${carte} relative p-5 ${miseEnAvant ? "ring-2 ring-agri" : ""}`}
            >
              {formule.accroche && (
                <span className="absolute -top-3 right-5 rounded-full bg-agri px-3 py-1 text-xs font-black text-white shadow-md">
                  {formule.accroche}
                </span>
              )}
              <p className="text-base font-bold text-slate-600">{formule.titre}</p>
              <p className="mt-1 text-3xl font-black tracking-tight text-marine">
                {formatFCFA(formule.montant)} <span className="text-base font-semibold text-slate-500">{formule.periode}</span>
              </p>
              <div className="mt-4">
                <BoutonPayer
                  formule={formule.code}
                  libelle={`Payer ${formatFCFA(formule.montant)}`}
                  principal={miseEnAvant || i === FORMULES.length - 1}
                />
              </div>
            </div>
          );
        })}
        <p className="px-2 text-center text-sm text-slate-500">
          Paiement sécurisé par PayDunya : Orange Money, Moov Money ou carte bancaire. Pas de renouvellement automatique.
        </p>
      </section>

      {/* Historique */}
      {historique.length > 0 && (
        <section className={`${carte} p-5`}>
          <h2 className="text-lg font-black text-marine">Mes paiements</h2>
          <ul className="mt-2 divide-y divide-slate-100">
            {historique.map((p) => {
              const statut = STATUTS[p.statut] ?? STATUTS.en_attente;
              return (
                <li key={p.id} className="flex items-center justify-between gap-3 py-3">
                  <span className="min-w-0">
                    <span className="block text-base font-bold text-marine">
                      {formuleParCode(p.formule)?.titre ?? p.formule}
                      {p.mode === "test" && <span className="ml-2 text-xs font-black text-amber-600">TEST</span>}
                    </span>
                    <span className="block text-sm text-slate-500">
                      {dateLongue(p.created_at)} · {formatFCFA(p.montant)}
                    </span>
                  </span>
                  <span className={`shrink-0 rounded-full px-3 py-1 text-sm font-bold ${statut.style}`}>{statut.libelle}</span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <Link href="/pme" className="block min-h-12 content-center text-center text-base font-semibold text-slate-600 underline">
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}
