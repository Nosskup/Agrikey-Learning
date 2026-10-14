import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { utilisateurConnecte } from "@/lib/pme/session";

export const metadata = { title: "Statistiques partenaires" };

type Ligne = { code_partenaire: string; entreprises: number; actives_30_jours: number; documents: number };

// Réservé aux administrateurs (rôle « admin » d'AGRIKEY Learning) : nombres par code partenaire,
// sans aucune donnée d'entreprise.
export default async function AdminPmePage() {
  const { supabase, user } = await utilisateurConnecte();
  if (!user) redirect("/pme/connexion");

  const { data: profil } = await supabase.from("profiles").select("role").eq("user_id", user.id).maybeSingle();
  if (profil?.role !== "admin") redirect("/pme");

  const { data, error } = await supabase.rpc("pme_statistiques_partenaires");
  const lignes = (data ?? []) as Ligne[];
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

      <section className="space-y-2 rounded-2xl border border-slate-200 bg-white p-5 text-base">
        <h2 className="text-lg font-black text-marine">Lien d&apos;inscription à partager</h2>
        <p className="text-slate-600">Remplacez LIGUE par le code du partenaire :</p>
        <p className="rounded-lg bg-slate-100 p-3 font-mono break-all">https://{hote}/pme/inscription?code=LIGUE</p>
      </section>
    </div>
  );
}
