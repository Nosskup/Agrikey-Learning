import type { StatutTache } from "./session";

// Libellés partagés entre le serveur et le navigateur
// (session.ts ne peut pas être importé côté navigateur).
export const LIBELLES_STATUT: Record<StatutTache, string> = {
  a_faire: "À faire",
  en_cours: "En cours",
  termine: "Terminé",
};
