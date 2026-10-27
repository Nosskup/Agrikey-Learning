import Link from "next/link";
import { redirect } from "next/navigation";
import { estAdmin, utilisateurConnecte } from "@/lib/pme/session";
import BoutonSupprimer from "@/components/pme/BoutonSupprimer";
import { boutonSecondaire } from "@/components/pme/styles";
import { archiverCode, archiverEntreprise, supprimerCode, supprimerEntrepriseDefinitivement } from "../actions";

export const metadata = { title: "Archives" };

type EntrepriseArchivee = {
  entreprise_id: string;
  nom: string;
  email: string | null;
  ville: string | null;
  code_partenaire: string | null;
  statut: string;
  inscrite_le: string;
  documents: number;
  archivee_le?: string | null;
};
type CodeArchive = { code: string; libelle: string; archive_le?: string | null };

const date = (iso: string) => new Date(iso).toLocaleDateString("fr-FR");
const boutonRestaurer =
  "flex min-h-12 items-center justify-center rounded-xl bg-agri px-4 text-base font-bold whitespace-nowrap text-white hover:bg-agri-fonce";

// Comptes désactivés et codes rangés par l'administrateur : à restaurer ou à supprimer définitivement.
export default async function ArchivesPage() {
  const { supabase, user } = await utilisateurConnecte();
  if (!user) redirect("/pme/connexion");
  if (!(await estAdmin(supabase, user.id))) redirect("/pme/admin");

  const [{ data: liste, error }, { data: codesData }] = await Promise.all([
    supabase.rpc("pme_liste_entreprises"),
    supabase.from("codes_invitation").select("*").not("archive_le", "is", null).order("archive_le", { ascending: false }),
  ]);

  const inscrites = (liste ?? []) as EntrepriseArchivee[];
  const archivees = inscrites.filter((e) => e.archivee_le);
  const codes = (codesData ?? []) as CodeArchive[];
  const utilisations = (code: string) => inscrites.filter((e) => e.code_partenaire === code).length;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-black text-marine">🗄️ Archives</h1>
        <Link href="/pme/admin" className="min-h-12 content-center text-base font-semibold text-slate-600 underline">
          Administration
        </Link>
      </div>

      <p className="text-base text-slate-600">
        Les comptes et codes archivés n&apos;apparaissent plus dans l&apos;administration. Un compte archivé reste
        désactivé. Restaurez-le pour le revoir dans la liste, ou supprimez-le définitivement.
      </p>

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-base font-semibold text-red-700">
          Les archives n&apos;ont pas pu être chargées. Vérifiez que le script SQL 20261022 a été exécuté dans Supabase.
        </p>
      )}

      {/* Comptes */}
      <section className="space-y-3">
        <h2 className="text-xl font-black text-marine">Comptes archivés ({archivees.length})</h2>
        {archivees.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-base text-slate-600">
            Aucun compte archivé.
          </p>
        ) : (
          archivees.map((e) => (
            <div key={e.entreprise_id} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 text-base">
              <div>
                <p className="text-lg font-black text-marine">{e.nom}</p>
                <p className="text-slate-600">
                  {[e.email, e.ville, e.code_partenaire && `code ${e.code_partenaire}`].filter(Boolean).join(" · ")}
                </p>
                <p className="text-sm text-slate-500">
                  Inscrite le {date(e.inscrite_le)} · archivée le {date(e.archivee_le!)} · {e.documents} document
                  {Number(e.documents) > 1 ? "s" : ""}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <form action={archiverEntreprise.bind(null, e.entreprise_id, false)}>
                  <button type="submit" className={`${boutonRestaurer} w-full`}>
                    ↩ Restaurer
                  </button>
                </form>
                <BoutonSupprimer
                  action={supprimerEntrepriseDefinitivement.bind(null, e.entreprise_id)}
                  question={`Supprimer définitivement « ${e.nom} » ? Sa caisse, ses projets et ses documents seront effacés. C'est irréversible.`}
                  libelle="🗑️ Supprimer définitivement"
                  className="w-full"
                />
              </div>
            </div>
          ))
        )}
        <p className="text-sm text-slate-500">
          La suppression efface les données AGRIKEY PME du membre. Son compte de connexion AGRIKEY (utilisé aussi pour
          les formations) et la trace d&apos;éventuels paiements sont conservés.
        </p>
      </section>

      {/* Codes */}
      <section className="space-y-3">
        <h2 className="text-xl font-black text-marine">Codes archivés ({codes.length})</h2>
        {codes.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-base text-slate-600">
            Aucun code archivé.
          </p>
        ) : (
          codes.map((c) => {
            const nb = utilisations(c.code);
            return (
              <div key={c.code} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 text-base">
                <div>
                  <p className="font-mono text-lg font-black text-marine">{c.code}</p>
                  <p className="text-slate-600">
                    {[c.libelle, `${nb} inscription${nb > 1 ? "s" : ""}`, c.archive_le && `archivé le ${date(c.archive_le)}`]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <form action={archiverCode.bind(null, c.code, false)}>
                    <button type="submit" className={`${boutonRestaurer} w-full`}>
                      ↩ Restaurer (reste désactivé)
                    </button>
                  </form>
                  {nb === 0 ? (
                    <BoutonSupprimer
                      action={supprimerCode.bind(null, c.code)}
                      question={`Supprimer définitivement le code ${c.code} ?`}
                      libelle="🗑️ Supprimer définitivement"
                      className="w-full"
                    />
                  ) : (
                    <p className="text-sm text-slate-500">
                      Utilisé par des entreprises : il reste dans les archives pour garder l&apos;historique.
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </section>

      <Link href="/pme/admin" className={boutonSecondaire}>
        ← Retour à l&apos;administration
      </Link>
    </div>
  );
}
