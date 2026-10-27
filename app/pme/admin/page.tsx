import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { estAdmin, utilisateurConnecte } from "@/lib/pme/session";
import BoutonSupprimer from "@/components/pme/BoutonSupprimer";
import { boutonSecondaire } from "@/components/pme/styles";
import { archiverCode, archiverEntreprise, basculerCode, changerStatut } from "./actions";
import FormulaireCode from "./FormulaireCode";
import { resumerModeles } from "@/lib/pme/modeles";
import { QUOTA_IA_DEFAUT, resumerQuota } from "@/lib/pme/creations";

export const metadata = { title: "Administration AGRIKEY PME" };

type Ligne = { code_partenaire: string; entreprises: number; actives_30_jours: number; documents: number };
type EntrepriseInscrite = {
  entreprise_id: string;
  nom: string;
  email: string | null;
  ville: string | null;
  activite: string | null;
  code_partenaire: string | null;
  statut: "en_attente" | "valide" | "refuse";
  inscrite_le: string;
  active_30_jours: boolean;
  documents: number;
  modeles_autorises: string[] | null;
  quota_ia?: number | null;
  creations_ia_mois?: number;
  archivee_le?: string | null;
};
type CodeInvitation = {
  code: string;
  libelle: string;
  actif: boolean;
  max_inscriptions: number | null;
  modeles_autorises: string[] | null;
  quota_ia?: number | null;
  archive_le?: string | null;
};

const STATUTS = {
  en_attente: { libelle: "En attente", classe: "bg-amber-100 text-amber-900" },
  valide: { libelle: "Validée", classe: "bg-green-100 text-agri-fonce" },
  refuse: { libelle: "Refusée", classe: "bg-red-100 text-red-800" },
} as const;

const puce = "min-h-12 content-center rounded-full border px-4 text-base font-semibold";

// Réservé aux administrateurs (rôle « admin » d'AGRIKEY Learning) : validation des inscriptions,
// codes d'invitation, statistiques et liste des entreprises (jamais leur caisse, projets ni documents).
export default async function AdminPmePage({
  searchParams,
}: {
  searchParams: Promise<{ [cle: string]: string | string[] | undefined }>;
}) {
  const { code } = await searchParams;
  const filtre = typeof code === "string" && /^[A-Z0-9-]{2,20}$|^AUCUN$/.test(code) ? code : "";

  const { supabase, user } = await utilisateurConnecte();
  if (!user) redirect("/pme/connexion");

  if (!(await estAdmin(supabase, user.id))) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-black text-marine">Administration</h1>
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-base text-amber-900">
          Cette page est réservée aux comptes administrateurs. Vous êtes connecté avec <strong>{user.email}</strong>, qui
          n&apos;a pas le rôle « admin ». Déconnectez-vous et reconnectez-vous avec le compte administrateur d&apos;AGRIKEY
          Learning, ou donnez ce rôle à ce compte dans Supabase (table profiles).
        </p>
        <Link href="/pme" className={boutonSecondaire}>
          ← Retour au tableau de bord
        </Link>
      </div>
    );
  }

  const [{ data, error }, { data: liste, error: erreurListe }, { data: codesData, error: erreurCodes }] =
    await Promise.all([
      supabase.rpc("pme_statistiques_partenaires"),
      supabase.rpc("pme_liste_entreprises"),
      supabase.from("codes_invitation").select("*").order("created_at"),
    ]);

  const tousLesCodes = (codesData ?? []) as CodeInvitation[];
  // Les codes et les entreprises archivés sont rangés dans « Archives » : on ne les montre pas ici.
  const codesArchives = new Set(tousLesCodes.filter((c) => c.archive_le).map((c) => c.code));
  const codes = tousLesCodes.filter((c) => !c.archive_le);
  const lignes = ((data ?? []) as Ligne[]).filter((l) => !codesArchives.has(l.code_partenaire));
  const inscrites = (liste ?? []) as EntrepriseInscrite[];
  const toutes = inscrites.filter((e) => !e.archivee_le);
  const nbArchives = inscrites.length - toutes.length + codesArchives.size;
  // Limite IA effective d'un membre : la sienne, sinon celle de son code, sinon la valeur par défaut.
  const quotaMembre = (e: EntrepriseInscrite) =>
    e.quota_ia ?? codes.find((c) => c.code === e.code_partenaire)?.quota_ia ?? QUOTA_IA_DEFAUT;
  const enAttente = toutes.filter((e) => e.statut === "en_attente");
  const entreprises = toutes.filter((e) => !filtre || (e.code_partenaire ?? "AUCUN") === filtre);
  const utilisations = (c: string) => inscrites.filter((e) => e.code_partenaire === c).length;
  const total = lignes.reduce((t, l) => t + Number(l.entreprises), 0);
  const hote = (await headers()).get("host") ?? "agrikey-learning.vercel.app";

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-black text-marine">Administration</h1>
        <Link
          href="/pme/admin/archives"
          className="min-h-12 content-center rounded-xl border border-slate-300 bg-white px-4 text-base font-semibold text-marine"
        >
          🗄️ Archives ({nbArchives})
        </Link>
      </div>

      {(error || erreurListe || erreurCodes) && (
        <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-base font-semibold text-red-700">
          Certaines informations n&apos;ont pas pu être chargées. Vérifiez que le script SQL 20261017 a été exécuté dans
          Supabase.
          <span className="mt-2 block font-mono text-sm font-normal break-all">
            Détail : {[error, erreurListe, erreurCodes].filter(Boolean).map((e) => e!.message).join(" · ")}
          </span>
        </p>
      )}

      {/* 1. Inscriptions à valider */}
      <section className="space-y-3">
        <h2 className="text-xl font-black text-marine">Inscriptions à valider ({enAttente.length})</h2>
        {enAttente.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-base text-slate-600">
            Aucune inscription en attente.
          </p>
        ) : (
          enAttente.map((e) => (
            <div key={e.entreprise_id} className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-base">
              <div>
                <p className="text-lg font-black text-marine">{e.nom}</p>
                <p className="text-slate-700">
                  {e.email ?? "—"} · code {e.code_partenaire ?? "—"} · inscrite le{" "}
                  {new Date(e.inscrite_le).toLocaleDateString("fr-FR")}
                </p>
                {(e.activite || e.ville) && (
                  <p className="text-slate-600">{[e.activite, e.ville].filter(Boolean).join(" · ")}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <form action={changerStatut.bind(null, e.entreprise_id, "valide")}>
                  <button
                    type="submit"
                    className="flex min-h-12 w-full items-center justify-center rounded-xl bg-agri px-4 font-bold text-white hover:bg-agri-fonce"
                  >
                    ✓ Valider
                  </button>
                </form>
                <BoutonSupprimer
                  action={changerStatut.bind(null, e.entreprise_id, "refuse")}
                  question={`Refuser l'inscription de « ${e.nom} » ?`}
                  libelle="✕ Refuser"
                  className="w-full"
                />
              </div>
            </div>
          ))
        )}
      </section>

      {/* 2. Statistiques par code */}
      <section className="space-y-3">
        <h2 className="text-xl font-black text-marine">Statistiques par code</h2>
        <p className="text-base text-slate-600">
          {total} entreprise{total > 1 ? "s" : ""} au total. « Actives » = au moins une opération de caisse ces 30
          derniers jours.
        </p>
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-base">
            <thead className="bg-marine text-left text-white">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3 text-right">Inscrites</th>
                <th className="px-4 py-3 text-right">Actives</th>
                <th className="px-4 py-3 text-right">Documents</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lignes.map((l) => (
                <tr key={l.code_partenaire}>
                  <td className="px-4 py-3 font-semibold text-marine">
                    {l.code_partenaire === "AUCUN" ? "Sans code" : l.code_partenaire}
                  </td>
                  <td className="px-4 py-3 text-right">{l.entreprises}</td>
                  <td className="px-4 py-3 text-right">{l.actives_30_jours}</td>
                  <td className="px-4 py-3 text-right">{l.documents}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. Liste des entreprises */}
      <section className="space-y-3">
        <h2 className="text-xl font-black text-marine">Entreprises inscrites</h2>

        <nav aria-label="Filtrer par code" className="flex flex-wrap gap-2">
          <Link href="/pme/admin" className={`${puce} ${!filtre ? "border-agri bg-agri text-white" : "border-slate-300 bg-white text-marine"}`}>
            Toutes
          </Link>
          {lignes.map((l) => (
            <Link
              key={l.code_partenaire}
              href={`/pme/admin?code=${l.code_partenaire}`}
              className={`${puce} ${filtre === l.code_partenaire ? "border-agri bg-agri text-white" : "border-slate-300 bg-white text-marine"}`}
            >
              {l.code_partenaire === "AUCUN" ? "Sans code" : l.code_partenaire}
            </Link>
          ))}
        </nav>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-base">
            <thead className="bg-marine text-left text-white">
              <tr>
                <th className="px-4 py-3">Entreprise</th>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Inscrite le</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3 text-center">Active</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {entreprises.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-4 text-center text-slate-500">
                    Aucune entreprise.
                  </td>
                </tr>
              )}
              {entreprises.map((e) => (
                <tr key={e.entreprise_id}>
                  <td className="px-4 py-3">
                    <span className="block font-semibold text-marine">{e.nom}</span>
                    <span className="block text-slate-500">
                      {[e.email, e.activite, e.ville].filter(Boolean).join(" · ")}
                    </span>
                    {e.creations_ia_mois !== undefined && (
                      <span className="block text-slate-600">
                        🎨 {e.creations_ia_mois} / {quotaMembre(e)} créations IA ce mois
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">{e.code_partenaire || "—"}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{new Date(e.inscrite_le).toLocaleDateString("fr-FR")}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-3 py-1 text-sm font-bold whitespace-nowrap ${STATUTS[e.statut].classe}`}>
                      {STATUTS[e.statut].libelle}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">{e.active_30_jours ? "✅" : "—"}</td>
                  <td className="px-4 py-3">
                    <form action={changerStatut.bind(null, e.entreprise_id, e.statut === "valide" ? "en_attente" : "valide")}>
                      <button type="submit" className="min-h-12 text-base font-semibold text-marine underline whitespace-nowrap">
                        {e.statut === "valide" ? "Suspendre" : "Valider"}
                      </button>
                    </form>
                    <Link
                      href={`/pme/admin/entreprise/${e.entreprise_id}`}
                      className="block min-h-12 content-center text-base font-semibold whitespace-nowrap text-agri underline"
                    >
                      Modèles et IA{e.modeles_autorises || e.quota_ia != null ? " (personnalisés)" : ""}
                    </Link>
                    {e.statut !== "valide" && (
                      <BoutonSupprimer
                        action={archiverEntreprise.bind(null, e.entreprise_id, true)}
                        question={`Archiver « ${e.nom} » ? Le compte reste désactivé et part dans les Archives, d'où vous pourrez le restaurer.`}
                        libelle="🗄️ Archiver"
                        className="mt-1"
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <a href={`/pme/admin/export${filtre ? `?code=${filtre}` : ""}`} className={boutonSecondaire}>
          📊 Télécharger cette liste (CSV, Excel)
        </a>
      </section>

      {/* 4. Codes d'invitation */}
      <section className="space-y-3">
        <h2 className="text-xl font-black text-marine">Codes d&apos;invitation</h2>
        <p className="text-base text-slate-600">
          Sans code ✅ actif, personne ne peut s&apos;inscrire. Un code désactivé ou qui a atteint son maximum n&apos;est plus
          accepté ; les comptes déjà inscrits ne sont pas touchés.
        </p>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-base">
            <thead className="bg-marine text-left text-white">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3 text-right">Inscriptions</th>
                <th className="px-4 py-3">État</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {codes.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-4 text-center text-slate-500">
                    Aucun code : personne ne peut s&apos;inscrire.
                  </td>
                </tr>
              )}
              {codes.map((c) => (
                <tr key={c.code}>
                  <td className="px-4 py-3">
                    <span className="block font-mono font-bold text-marine">{c.code}</span>
                    {c.libelle && <span className="block text-slate-500">{c.libelle}</span>}
                    <span className="block text-slate-600">📄 {resumerModeles(c.modeles_autorises)}</span>
                    <span className="block text-slate-600">🎨 {resumerQuota(c.quota_ia ?? null)}</span>
                    <Link href={`/pme/admin/code/${c.code}`} className="block min-h-12 content-center font-semibold text-agri underline">
                      Choisir les modèles et l&apos;IA
                    </Link>
                    <span className="block font-mono text-sm break-all text-slate-500">
                      https://{hote}/pme/inscription?code={c.code}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {utilisations(c.code)}
                    {c.max_inscriptions ? ` / ${c.max_inscriptions}` : ""}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-3 py-1 text-sm font-bold whitespace-nowrap ${
                        c.actif ? "bg-green-100 text-agri-fonce" : "bg-red-100 text-red-800"
                      }`}
                    >
                      {c.actif ? "✅ Actif" : "⛔ Désactivé"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {c.actif ? (
                      <BoutonSupprimer
                        action={basculerCode.bind(null, c.code, false)}
                        question={`Désactiver le code ${c.code} ? Plus personne ne pourra s'inscrire avec.`}
                        libelle="Désactiver ce code"
                      />
                    ) : (
                      <div className="space-y-2">
                        <form action={basculerCode.bind(null, c.code, true)}>
                          <button
                            type="submit"
                            className="flex min-h-12 items-center justify-center rounded-xl bg-agri px-4 text-base font-bold whitespace-nowrap text-white hover:bg-agri-fonce"
                          >
                            Activer ce code
                          </button>
                        </form>
                        <BoutonSupprimer
                          action={archiverCode.bind(null, c.code, true)}
                          question={`Archiver le code ${c.code} ? Il part dans les Archives ; les comptes déjà inscrits ne sont pas touchés.`}
                          libelle="🗄️ Archiver"
                        />
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3 className="text-lg font-black text-marine">Créer un code</h3>
        <FormulaireCode />
      </section>
    </div>
  );
}
