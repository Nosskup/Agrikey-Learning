import { exigerEntreprise } from "@/lib/pme/session";
import EnConstruction from "@/components/pme/EnConstruction";

export const metadata = { title: "Caisse" };

export default async function CaissePage() {
  await exigerEntreprise();

  return (
    <EnConstruction
      icone="💰"
      titre="Caisse"
      description="Notez l'argent reçu et l'argent dépensé, et voyez votre solde du mois."
    />
  );
}
