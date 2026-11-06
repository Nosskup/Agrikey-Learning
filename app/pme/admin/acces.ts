/** Accès d'un membre, en une ligne : abonnement, période gratuite ou accès terminé. */
export function resumerAcces(finEssai: string | null, abonnement: string | null): string {
  const maintenant = new Date().toISOString();
  const date = (iso: string) => new Date(iso).toLocaleDateString("fr-FR");
  if (abonnement && abonnement > maintenant) return `💳 Abonné jusqu'au ${date(abonnement)}`;
  if (finEssai && finEssai > maintenant) return `🎁 Gratuit jusqu'au ${date(finEssai)}`;
  if (!finEssai) return "⏸ Pas encore validé";
  return "⛔ Accès terminé (abonnement à payer)";
}
