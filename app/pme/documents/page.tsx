import { exigerEntreprise } from "@/lib/pme/session";
import EnConstruction from "@/components/pme/EnConstruction";

export const metadata = { title: "Documents" };

export default async function DocumentsPage() {
  await exigerEntreprise();

  return (
    <EnConstruction
      icone="📄"
      titre="Documents"
      description="Devis, factures, reçus, lettres : remplissez un court formulaire et téléchargez le PDF."
    />
  );
}
