// Montant en lettres (français) pour les factures, devis et reçus.

const UNITES = [
  "zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf",
  "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize",
];
const DIZAINES = ["", "dix", "vingt", "trente", "quarante", "cinquante", "soixante"];

function moinsDeCent(n: number): string {
  if (n < 17) return UNITES[n];
  if (n < 20) return `dix-${UNITES[n - 10]}`;
  if (n < 70) {
    const unite = n % 10;
    const dizaine = DIZAINES[Math.floor(n / 10)];
    if (unite === 0) return dizaine;
    return unite === 1 ? `${dizaine} et un` : `${dizaine}-${UNITES[unite]}`;
  }
  if (n < 80) return n === 71 ? "soixante et onze" : `soixante-${moinsDeCent(n - 60)}`;
  return n === 80 ? "quatre-vingts" : `quatre-vingt-${moinsDeCent(n - 80)}`;
}

function moinsDeMille(n: number): string {
  const centaines = Math.floor(n / 100);
  const reste = n % 100;
  if (centaines === 0) return moinsDeCent(reste);

  const cent = centaines === 1 ? "cent" : `${UNITES[centaines]} cent`;
  if (reste === 0) return centaines > 1 ? `${cent}s` : cent;
  return `${cent} ${moinsDeCent(reste)}`;
}

/** 1250000 -> "un million deux cent cinquante mille" */
export function nombreEnLettres(nombre: number): string {
  let n = Math.floor(Math.abs(nombre));
  if (n === 0) return "zéro";

  const morceaux: string[] = [];
  const milliards = Math.floor(n / 1e9);
  n %= 1e9;
  const millions = Math.floor(n / 1e6);
  n %= 1e6;
  const milliers = Math.floor(n / 1e3);
  const reste = n % 1e3;

  if (milliards) morceaux.push(`${moinsDeMille(milliards)} milliard${milliards > 1 ? "s" : ""}`);
  if (millions) morceaux.push(`${moinsDeMille(millions)} million${millions > 1 ? "s" : ""}`);
  if (milliers) {
    // « mille » est invariable et « cents / vingts » perdent leur s devant lui.
    morceaux.push(milliers === 1 ? "mille" : `${moinsDeMille(milliers).replace(/(cent|vingt)s$/, "$1")} mille`);
  }
  if (reste) morceaux.push(moinsDeMille(reste));

  return morceaux.join(" ");
}
