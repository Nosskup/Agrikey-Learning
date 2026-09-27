import { createClient } from "@supabase/supabase-js";

/**
 * Client Supabase "admin", avec la clé service_role.
 *
 * Cette clé contourne les policies RLS et les restrictions
 * d'exécution des fonctions (comme confirm_payment, désormais
 * réservée à ce client). À n'utiliser QUE dans du code serveur
 * de confiance (routes API), jamais dans un composant client.
 */
export function createSupabaseAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
