import { VERDICTS, type Rythme } from "@/lib/pme/avancement";

function Barre({ libelle, valeur, couleur }: { libelle: string; valeur: number; couleur: string }) {
  return (
    <div>
      <div className="flex items-baseline justify-between text-base">
        <span className="text-slate-700">{libelle}</span>
        <span className="font-black text-marine">{valeur} %</span>
      </div>
      <div className="mt-1 h-3 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
        <div className="h-full rounded-full" style={{ width: `${valeur}%`, background: couleur }} />
      </div>
    </div>
  );
}

/** Temps écoulé comparé au travail fait : le projet avance-t-il au bon rythme ? */
export default function RythmeProjet({ rythme }: { rythme: Rythme }) {
  const verdict = VERDICTS[rythme.verdict];
  const restant =
    rythme.verdict === "termine"
      ? null
      : rythme.joursRestants < 0
        ? `Fin prévue dépassée de ${-rythme.joursRestants} jour${rythme.joursRestants < -1 ? "s" : ""}`
        : rythme.joursRestants === 0
          ? "Fin prévue aujourd'hui"
          : `${rythme.joursRestants} jour${rythme.joursRestants > 1 ? "s" : ""} avant la fin prévue`;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-3 py-1 text-base font-bold ${verdict.classe}`}>
          {verdict.icone} {verdict.libelle}
        </span>
        {restant && <span className="text-base text-slate-500">{restant}</span>}
      </div>
      <Barre libelle="⏳ Temps écoulé" valeur={rythme.temps} couleur="#1d4166" />
      <Barre libelle="✅ Travail fait" valeur={rythme.travail} couleur="#16834b" />
    </div>
  );
}
