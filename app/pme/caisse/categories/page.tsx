import Link from "next/link";
import { exigerEntreprise, type Categorie } from "@/lib/pme/session";
import { boutonSecondaire } from "@/components/pme/styles";
import { ajouterCategorie, modifierCategorie, supprimerCategorie } from "../actions";
import FormulaireCategorie from "./FormulaireCategorie";
import BoutonSupprimer from "@/components/pme/BoutonSupprimer";

export const metadata = { title: "Catégories de caisse" };

export default async function CategoriesPage() {
  const { supabase } = await exigerEntreprise();

  const { data: categories } = await supabase
    .from("categories_caisse")
    .select("id, nom, type")
    .order("created_at")
    .returns<Categorie[]>();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-marine">🏷️ Catégories</h1>
        <p className="mt-2 text-base text-slate-600">
          Renommez, ajoutez ou supprimez les catégories de votre caisse. Supprimer une catégorie
          ne supprime pas les opérations : elles passent « Sans catégorie ».
        </p>
      </div>

      <section className="space-y-2">
        <h2 className="text-xl font-black text-marine">Ajouter une catégorie</h2>
        <FormulaireCategorie action={ajouterCategorie} libelleBouton="Ajouter" viderSiSucces />
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-black text-marine">Mes catégories</h2>
        {(categories ?? []).map((c) => (
          <div key={c.id} className="space-y-2">
            <FormulaireCategorie action={modifierCategorie.bind(null, c.id)} categorie={c} libelleBouton="Enregistrer" />
            <BoutonSupprimer
              action={supprimerCategorie.bind(null, c.id)}
              question={`Supprimer la catégorie « ${c.nom} » ?`}
              libelle={`Supprimer « ${c.nom} »`}
              className="w-full"
            />
          </div>
        ))}
      </section>

      <Link href="/pme/caisse" className={boutonSecondaire}>
        ← Retour à la caisse
      </Link>
    </div>
  );
}
