import { exigerEntreprise } from "@/lib/pme/session";
import EnConstruction from "@/components/pme/EnConstruction";

export const metadata = { title: "Projets" };

export default async function ProjetsPage() {
  await exigerEntreprise();

  return (
    <EnConstruction
      icone="📋"
      titre="Projets"
      description="Organisez vos projets en tâches et suivez ce qu'il reste à faire cette semaine."
    />
  );
}
