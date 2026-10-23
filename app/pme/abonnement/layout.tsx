import { redirect } from "next/navigation";
import { ABONNEMENTS_VISIBLES } from "@/lib/pme/formules";

// Abonnements masqués pour l'instant : les pages renvoient au tableau de bord.
export default function AbonnementLayout({ children }: { children: React.ReactNode }) {
  if (!ABONNEMENTS_VISIBLES) redirect("/pme");
  return children;
}
