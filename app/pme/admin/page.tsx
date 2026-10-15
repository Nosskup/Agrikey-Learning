import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { estAdmin, utilisateurConnecte } from "@/lib/pme/session";
import { boutonSecondaire } from "@/components/pme/styles";

export const metadata = { title: "Statistiques partenaires" };

type Ligne = { code_partenaire: string; entreprises: number; actives_30_jours: number; documents: number };
type EntrepriseInscrite = {
  nom: string;
  ville: string | null;
  activite: string | null;
  code_partenaire: string | null;
  inscrite_le: string;
  active_30_jours: boolean;
  documents: number;
};

// Réservé aux administrateurs (rôle « admin » d'AGRIKEY Learning) : nombres par code partenaire,
// sans aucune donnée d'entreprise.
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
        <h1 className="text-3xl font-black text-marine">Statistiques partenaires</h1>
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

  const [{ data, error }, { data: liste, error: erreurListe }] = await Promise.all([
    supabase.rpc("pme_statistiques_partenaires"),
    supabase.rpc("pme_liste_entreprises"),
  ]);
  const lignes = (data ?? []) as Ligne[];
  const entreprises = ((liste ?? []) as EntrepriseInscrite[]).filter(
    (e) => !filtre || (e.code_partenaire ?? "AUCUN") === filtre
  );
  const total = lignes.reduce((t, l) => t + Number(l.entreprises), 0);

  const hote = (await headers()).get("host") ?? "agrikey-learning.vercel.app";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-marine">Statistiques partenaires</h1>
        <p className="mt-2 text-base text-slate-600">
          {total} entreprise{total > 1 ? "s" : ""} inscrite{total > 1 ? "s" : ""} au total. « Actives » = au moins une
          opération de caisse ces 30 derniers jours.
        </p>
      </div>

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-base font-semibold text-red-700">
          Les statistiques n&apos;ont pas pu être chargées. Vérifiez que le script SQL 20261015 a été exécuté dans Supabase.
        </p>
      )}

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

      <section className="space-y-3">
        <h2 className="text-xl font-black text-marine">Entreprises inscrites</h2>

        {erreurListe && (
          <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-base font-semibold text-red-700">
            La liste n&apos;a pas pu être chargée. Vérifiez que le script SQL 20261016 a été exécuté dans Supabase.
            <span className="mt-2 block font-mono text-sm font-normal break-all">Détail : {erreurListe.message}</span>
          </p>
        )}

        <nav aria-label="Filtrer par code" className="flex flex-wrap gap-2">
          <Link
            href="/pme/admin"
            className={`min-h-12 content-center rounded-full border px-4 text-base font-semibold ${!filtre ? "border-agri bg-agri text-white" : "border-slate-300 bg-white text-marine"}`}
          >
            Toutes
          </Link>
          {lignes.map((l) => (
            <Link
              key={l.code_partenaire}
              href={`/pme/admin?code=${l.code_partenaire}`}
              className={`min-h-12 content-center rounded-full border px-4 text-base font-semibold ${filtre === l.code_partenaire ? "border-agri bg-agri text-white" : "border-slate-300 bg-white text-marine"}`}
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
                <th className="px-4 py-3">Ville</th>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Inscrite le</th>
                <th className="px-4 py-3 text-center">Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {entreprises.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-4 text-center text-slate-500">
                    Aucune entreprise.
                  </td>
                </tr>
              )}
              {entreprises.map((e, i) => (
                <tr key={`${e.nom}-${e.inscrite_le}-${i}`}>
                  <td className="px-4 py-3">
                    <span className="block font-semibold text-marine">{e.nom}</span>
                    {e.activite && <span className="block text-slate-500">{e.activite}</span>}
                  </td>
                  <td className="px-4 py-3">{e.ville || "—"}</td>
                  <td className="px-4 py-3">{e.code_partenaire || "—"}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{new Date(e.inscrite_le).toLocaleDateString("fr-FR")}</td>
                  <td className="px-4 py-3 text-center">{e.active_30_jours ? "✅" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <a href={`/pme/admin/export${filtre ? `?code=${filtre}` : ""}`} className={boutonSecondaire}>
          📊 Télécharger cette liste (CSV, Excel)
        </a>
      </section>

      <section className="space-y-2 rounded-2xl border border-slate-200 bg-white p-5 text-base">
        <h2 className="text-lg font-black text-marine">Lien d&apos;inscription à partager</h2>
        <p className="text-slate-600">Remplacez LIGUE par le code du partenaire :</p>
        <p className="rounded-lg bg-slate-100 p-3 font-mono break-all">https://{hote}/pme/inscription?code=LIGUE</p>
      </section>
    </div>
  );
}
