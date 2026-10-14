import Link from "next/link";
import { exigerEntreprise, type Categorie, type Operation, type Projet, type Tache } from "@/lib/pme/session";
import { LIBELLES_STATUT } from "@/lib/pme/libelles";
import { trouverModele } from "@/lib/pme/modeles";
import { dateNumerique, formatFCFA } from "@/lib/pme/format";
import BoutonImprimer from "@/components/pme/BoutonImprimer";
import EnTeteEntreprise from "@/components/pme/EnTeteEntreprise";
import { boutonSecondaire } from "@/components/pme/styles";

export const metadata = { title: "Mes données" };

const cellule = "border-b border-slate-200 py-1.5 pr-2 align-top";
const entete = "border-b-2 border-slate-900 py-1.5 pr-2 text-left";

function Titre({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-8 border-b-2 border-slate-300 pb-1 text-xl font-black text-marine">{children}</h2>;
}

// Toutes les données AGRIKEY PME de l'utilisateur, en document A4 lisible (PDF par l'impression).
export default async function MesDonneesPage() {
  const { supabase, user, entreprise } = await exigerEntreprise();

  const [{ data: categories }, { data: operations }, { data: projets }, { data: taches }, { data: documents }, { data: details }] =
    await Promise.all([
      supabase.from("categories_caisse").select("id, nom, type").order("created_at").returns<Categorie[]>(),
      supabase
        .from("operations_caisse")
        .select("id, type, montant, categorie_id, note, date")
        .order("date")
        .order("created_at")
        .returns<Operation[]>(),
      supabase.from("projets").select("id, nom, description, date_debut, date_fin").order("created_at").returns<Projet[]>(),
      supabase
        .from("taches")
        .select("id, projet_id, titre, responsable, echeance, statut")
        .order("echeance", { ascending: true, nullsFirst: false })
        .returns<Tache[]>(),
      supabase.from("documents").select("id, titre, modele_code, created_at").order("created_at"),
      supabase.from("entreprises").select("code_partenaire, conditions_acceptees_le").eq("user_id", user.id).maybeSingle(),
    ]);

  const noms = new Map((categories ?? []).map((c) => [c.id, c.nom]));
  const ops = operations ?? [];
  const recu = ops.filter((o) => o.type === "recu").reduce((t, o) => t + o.montant, 0);
  const depense = ops.filter((o) => o.type === "depense").reduce((t, o) => t + o.montant, 0);

  const infos: [string, string | null | undefined][] = [
    ["Nom", entreprise.nom],
    ["Activité", entreprise.activite],
    ["Adresse", entreprise.adresse],
    ["Ville", entreprise.ville],
    ["Téléphone", entreprise.telephone],
    ["E-mail de l'entreprise", entreprise.email],
    ["RCCM", entreprise.rccm],
    ["E-mail du compte", user.email],
    ["Code partenaire", details?.code_partenaire],
    [
      "Conditions acceptées le",
      details?.conditions_acceptees_le ? new Date(details.conditions_acceptees_le).toLocaleDateString("fr-FR") : null,
    ],
  ];

  return (
    <div className="space-y-6">
      <div className="no-print space-y-3">
        <h1 className="text-2xl font-black text-marine">Mes données</h1>
        <BoutonImprimer />
        <p className="text-base text-slate-600">
          Dans la fenêtre d&apos;impression, choisissez « Enregistrer au format PDF » comme imprimante.
        </p>
        <Link href="/pme/compte" className={boutonSecondaire}>
          ← Retour à Mon compte
        </Link>
      </div>

      <article className="feuille-a4 rounded-2xl border border-slate-200 bg-white p-6 text-base text-slate-900">
        <EnTeteEntreprise entreprise={entreprise} />

        <h1 className="mt-6 text-2xl font-black">Mes données AGRIKEY PME</h1>
        <p className="text-slate-600">Document édité le {new Date().toLocaleDateString("fr-FR")}.</p>

        <Titre>1. Mon entreprise</Titre>
        <table className="mt-2 w-full border-collapse">
          <tbody>
            {infos.map(([libelle, valeur]) => (
              <tr key={libelle}>
                <td className={`${cellule} w-2/5 font-semibold`}>{libelle}</td>
                <td className={cellule}>{valeur || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <Titre>2. Caisse</Titre>
        <p className="mt-2">
          {ops.length} opération{ops.length > 1 ? "s" : ""} · Total reçu : <strong>{formatFCFA(recu)}</strong> · Total
          dépensé : <strong>{formatFCFA(depense)}</strong> · Solde : <strong>{formatFCFA(recu - depense)}</strong>
        </p>
        {ops.length > 0 && (
          <table className="mt-2 w-full border-collapse">
            <thead>
              <tr>
                <th className={entete}>Date</th>
                <th className={entete}>Catégorie / note</th>
                <th className={`${entete} text-right`}>Reçu</th>
                <th className={`${entete} text-right`}>Dépensé</th>
              </tr>
            </thead>
            <tbody>
              {ops.map((o) => (
                <tr key={o.id}>
                  <td className={`${cellule} whitespace-nowrap`}>{dateNumerique(o.date)}</td>
                  <td className={cellule}>
                    {(o.categorie_id && noms.get(o.categorie_id)) || "Sans catégorie"}
                    {o.note && <span className="block text-slate-500">{o.note}</span>}
                  </td>
                  <td className={`${cellule} text-right whitespace-nowrap`}>{o.type === "recu" ? formatFCFA(o.montant) : ""}</td>
                  <td className={`${cellule} text-right whitespace-nowrap`}>
                    {o.type === "depense" ? formatFCFA(o.montant) : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="mt-2 text-slate-600">
          Catégories : {(categories ?? []).map((c) => c.nom).join(", ") || "aucune"}.
        </p>

        <Titre>3. Projets et tâches</Titre>
        {(projets ?? []).length === 0 && <p className="mt-2">Aucun projet.</p>}
        {(projets ?? []).map((p) => {
          const liste = (taches ?? []).filter((t) => t.projet_id === p.id);
          return (
            <section key={p.id} className="mt-4">
              <h3 className="text-lg font-bold">{p.nom}</h3>
              {(p.date_debut || p.date_fin) && (
                <p className="text-slate-600">
                  Du {p.date_debut ? dateNumerique(p.date_debut) : "…"} au {p.date_fin ? dateNumerique(p.date_fin) : "…"}
                </p>
              )}
              {p.description && <p>{p.description}</p>}
              {liste.length === 0 ? (
                <p className="text-slate-600">Aucune tâche.</p>
              ) : (
                <table className="mt-1 w-full border-collapse">
                  <thead>
                    <tr>
                      <th className={entete}>Tâche</th>
                      <th className={entete}>Responsable</th>
                      <th className={entete}>Échéance</th>
                      <th className={entete}>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {liste.map((t) => (
                      <tr key={t.id}>
                        <td className={cellule}>{t.titre}</td>
                        <td className={cellule}>{t.responsable || "—"}</td>
                        <td className={`${cellule} whitespace-nowrap`}>{t.echeance ? dateNumerique(t.echeance) : "—"}</td>
                        <td className={cellule}>{LIBELLES_STATUT[t.statut]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          );
        })}

        <Titre>4. Documents créés</Titre>
        {(documents ?? []).length === 0 ? (
          <p className="mt-2">Aucun document.</p>
        ) : (
          <>
            <table className="mt-2 w-full border-collapse">
              <thead>
                <tr>
                  <th className={entete}>Date</th>
                  <th className={entete}>Document</th>
                  <th className={entete}>Modèle</th>
                </tr>
              </thead>
              <tbody>
                {(documents ?? []).map((d) => (
                  <tr key={d.id}>
                    <td className={`${cellule} whitespace-nowrap`}>{new Date(d.created_at).toLocaleDateString("fr-FR")}</td>
                    <td className={cellule}>{d.titre}</td>
                    <td className={cellule}>{trouverModele(d.modele_code)?.titre ?? d.modele_code}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2 text-slate-600">
              Chaque document peut être retéléchargé en PDF depuis la rubrique Documents.
            </p>
          </>
        )}

        <p className="mt-8 text-slate-500">Édité avec AGRIKEY PME.</p>
      </article>
    </div>
  );
}
