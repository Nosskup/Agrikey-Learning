/** Barre de progression : tâches terminées sur total. */
export default function BarreProgression({ terminees, total }: { terminees: number; total: number }) {
  const pourcentage = total === 0 ? 0 : Math.round((terminees / total) * 100);

  return (
    <div>
      <div
        className="h-3 overflow-hidden rounded-full bg-slate-200"
        role="progressbar"
        aria-valuenow={pourcentage}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="h-full rounded-full bg-agri" style={{ width: `${pourcentage}%` }} />
      </div>
      <p className="mt-1 text-base text-slate-600">
        {total === 0 ? "Aucune tâche" : `${terminees} sur ${total} terminée${terminees > 1 ? "s" : ""} (${pourcentage} %)`}
      </p>
    </div>
  );
}
