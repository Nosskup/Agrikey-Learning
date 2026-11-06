import { redirect } from "next/navigation";
import { ABONNEMENTS_VISIBLES } from "@/lib/pme/formules";
import { estAdmin, utilisateurConnecte } from "@/lib/pme/session";

// Abonnements masqués pour l'instant : les pages renvoient au tableau de bord,
// sauf pour les administrateurs, qui peuvent tester le paiement.
export default async function AbonnementLayout({ children }: { children: React.ReactNode }) {
  if (!ABONNEMENTS_VISIBLES) {
    const { supabase, user } = await utilisateurConnecte();
    if (!user || !(await estAdmin(supabase, user.id))) redirect("/pme");
  }
  return children;
}
