// Illustrations du jeu, dessinées en SVG : pas d'images à télécharger,
// le jeu reste léger et fonctionne même avec une petite connexion.

import { useId } from "react";
import type { Etat, NomScene } from "./moteur";

// ---------------------------------------------------------------------------
// Palette
// ---------------------------------------------------------------------------

const C = {
  banco: "#c98a55",
  bancoFonce: "#a8693a",
  bancoClair: "#ddb07f",
  paille: "#d9b55b",
  pailleFonce: "#b8923c",
  terre: "#d8a46c",
  terreFonce: "#b97f47",
  feuille: "#3f7d3a",
  feuilleClair: "#5fa34f",
  tronc: "#6b4a2f",
  eau: "#3b82a6",
  peau: ["#5a3825", "#6e4430", "#4a2e1e"],
  tissus: ["#1f6feb", "#e0a100", "#c2410c", "#7c3aed", "#0f766e", "#be185d", "#16834b"],
  vert: "#14b53a",
  jaune: "#fcd116",
  rouge: "#ce1126",
};

type Moment = "jour" | "soir" | "nuit";

const CIELS: Record<Moment, [string, string]> = {
  jour: ["#8fd3f4", "#fde7c2"],
  soir: ["#f59e5b", "#fde68a"],
  nuit: ["#0f1d3a", "#33416b"],
};

// ---------------------------------------------------------------------------
// Éléments de décor
// ---------------------------------------------------------------------------

function Ciel({ moment, id }: { moment: Moment; id: string }) {
  const [haut, bas] = CIELS[moment];
  return (
    <>
      <defs>
        <linearGradient id={`ciel-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={haut} />
          <stop offset="1" stopColor={bas} />
        </linearGradient>
      </defs>
      <rect width="400" height="170" fill={`url(#ciel-${id})`} />
      {moment === "nuit" ? (
        <>
          <circle cx="330" cy="34" r="14" fill="#fef3c7" />
          <circle cx="336" cy="30" r="12" fill="#1c2b52" />
          {[
            [40, 20], [90, 45], [150, 15], [210, 38], [260, 18], [370, 60], [120, 70], [300, 75],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="1.3" fill="#fff" opacity="0.85">
              <animate attributeName="opacity" values="0.3;1;0.3" dur={`${2 + (i % 3)}s`} repeatCount="indefinite" />
            </circle>
          ))}
        </>
      ) : (
        <circle cx={moment === "soir" ? 300 : 340} cy={moment === "soir" ? 92 : 34} r="18" fill={moment === "soir" ? "#fb923c" : "#fde047"} opacity="0.95" />
      )}
      {moment === "jour" && (
        <g fill="#fff" opacity="0.8">
          <g>
            <animateTransform attributeName="transform" type="translate" values="0 0; 30 0; 0 0" dur="40s" repeatCount="indefinite" />
            <ellipse cx="80" cy="30" rx="22" ry="7" />
            <ellipse cx="96" cy="26" rx="14" ry="7" />
          </g>
          <g>
            <animateTransform attributeName="transform" type="translate" values="0 0; -25 0; 0 0" dur="50s" repeatCount="indefinite" />
            <ellipse cx="220" cy="22" rx="18" ry="5" />
            <ellipse cx="232" cy="19" rx="10" ry="5" />
          </g>
        </g>
      )}
    </>
  );
}

function Sol({ couleur = C.terre, y = 125 }: { couleur?: string; y?: number }) {
  return (
    <>
      <rect y={y} width="400" height={170 - y} fill={couleur} />
      <path d={`M0 ${y} Q100 ${y - 4} 200 ${y} T400 ${y}`} fill={couleur} />
    </>
  );
}

function Case({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="-18" y="-26" width="36" height="26" fill={C.banco} />
      <rect x="-18" y="-26" width="8" height="26" fill={C.bancoFonce} opacity="0.35" />
      <path d="M-24 -24 L0 -50 L24 -24 Z" fill={C.paille} />
      <path d="M-24 -24 L0 -50 L0 -24 Z" fill={C.pailleFonce} opacity="0.4" />
      <rect x="-5" y="-15" width="10" height="15" rx="5" fill="#4a2f1d" />
    </g>
  );
}

function MaisonBanco({ x, y, l = 60, h = 34, s = 1 }: { x: number; y: number; l?: number; h?: number; s?: number }) {
  const torons = Array.from({ length: Math.floor(l / 12) }, (_, i) => -l / 2 + 6 + i * 12);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-l / 2} y={-h} width={l} height={h} fill={C.bancoClair} />
      <rect x={-l / 2} y={-h - 4} width={l} height="5" fill={C.banco} />
      {torons.map((tx) => (
        <rect key={tx} x={tx} y={-h + 6} width="2" height="4" fill={C.tronc} />
      ))}
      <rect x="-6" y="-18" width="12" height="18" fill="#2f5d8a" />
      <rect x={l / 2 - 16} y={-h + 10} width="9" height="9" fill="#3f6e98" />
    </g>
  );
}

function Baobab({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-9 0 Q-11 -30 -6 -46 L6 -46 Q11 -30 9 0 Z" fill="#8b6b4a" />
      <path d="M-6 -44 Q-24 -56 -32 -52 M6 -44 Q22 -60 34 -54 M0 -46 Q2 -62 -4 -68" stroke="#8b6b4a" strokeWidth="5" fill="none" strokeLinecap="round" />
      <ellipse cx="-30" cy="-56" rx="12" ry="6" fill={C.feuille} opacity="0.9" />
      <ellipse cx="32" cy="-58" rx="13" ry="6" fill={C.feuille} opacity="0.9" />
      <ellipse cx="-3" cy="-70" rx="12" ry="6" fill={C.feuilleClair} opacity="0.9" />
    </g>
  );
}

function Manguier({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="-4" y="-30" width="8" height="30" fill={C.tronc} />
      <circle cx="0" cy="-44" r="24" fill={C.feuille} />
      <circle cx="-14" cy="-36" r="14" fill={C.feuilleClair} />
      <circle cx="14" cy="-38" r="15" fill={C.feuilleClair} />
      <circle cx="-6" cy="-30" r="2.5" fill="#f59e0b" />
      <circle cx="10" cy="-28" r="2.5" fill="#f59e0b" />
    </g>
  );
}

type PropsPerso = {
  x: number;
  y: number;
  s?: number;
  tissu?: string;
  peau?: string;
  femme?: boolean;
  porte?: "seau" | "livre" | "houe" | "rien";
};

function Personnage({ x, y, s = 1, tissu = C.tissus[0], peau = C.peau[0], femme, porte = "rien" }: PropsPerso) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="-5" y="-10" width="3.5" height="10" fill={peau} />
      <rect x="1.5" y="-10" width="3.5" height="10" fill={peau} />
      <path d={femme ? "M-9 -6 L-6 -30 L6 -30 L9 -6 Z" : "M-8 -9 L-6 -30 L6 -30 L8 -9 Z"} fill={tissu} />
      <path d="M-6 -29 L-11 -14 M6 -29 L11 -14" stroke={peau} strokeWidth="3" strokeLinecap="round" />
      <circle cx="0" cy="-36" r="6.5" fill={peau} />
      {femme ? (
        <path d="M-7.5 -38 Q0 -50 7.5 -38 Q8 -44 3 -46 Q0 -48 -3 -46 Q-8 -44 -7.5 -38 Z" fill={tissu} stroke="#00000022" />
      ) : (
        <path d="M-6.5 -38 Q0 -45 6.5 -38 L6.5 -40 Q0 -46 -6.5 -40 Z" fill="#1f1610" />
      )}
      {porte === "seau" && <rect x="-6" y="-52" width="12" height="7" rx="2" fill="#94a3b8" />}
      {porte === "livre" && <rect x="9" y="-20" width="8" height="10" fill="#f8fafc" stroke="#475569" strokeWidth="0.8" />}
      {porte === "houe" && <path d="M11 -14 L20 -40 M17 -42 L24 -36" stroke="#5b4636" strokeWidth="2" />}
    </g>
  );
}

function Sotrama({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g>
        <animateTransform attributeName="transform" type="translate" values="0 0; -14 0; 0 0" dur="6s" repeatCount="indefinite" />
        <rect x="-34" y="-30" width="68" height="24" rx="5" fill="#15803d" />
        <rect x="-34" y="-30" width="68" height="7" rx="3" fill="#facc15" />
        {[-26, -12, 2, 16].map((wx) => (
          <rect key={wx} x={wx} y="-22" width="10" height="8" fill="#bae6fd" />
        ))}
        <circle cx="-20" cy="-5" r="6" fill="#1f2937" />
        <circle cx="20" cy="-5" r="6" fill="#1f2937" />
        <circle cx="-20" cy="-5" r="2.5" fill="#9ca3af" />
        <circle cx="20" cy="-5" r="2.5" fill="#9ca3af" />
        <rect x="-30" y="-40" width="40" height="8" fill="#a16207" />
      </g>
    </g>
  );
}

function Moto({ x, y, tissu = C.tissus[2] }: { x: number; y: number; tissu?: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g>
        <animateTransform attributeName="transform" type="translate" values="0 0; 40 0; 0 0" dur="5s" repeatCount="indefinite" />
        <circle cx="-12" cy="-5" r="6" fill="none" stroke="#111827" strokeWidth="2.5" />
        <circle cx="12" cy="-5" r="6" fill="none" stroke="#111827" strokeWidth="2.5" />
        <path d="M-12 -5 L-2 -14 L10 -14 L12 -5" stroke="#dc2626" strokeWidth="3" fill="none" />
        <Personnage x={-1} y={-12} s={0.6} tissu={tissu} />
      </g>
    </g>
  );
}

function Mosquee({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  const torons = [-46, -34, -22, -10, 2, 14, 26, 38];
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="-56" y="-48" width="112" height="48" fill={C.banco} />
      {[-48, 0, 48].map((tx) => (
        <g key={tx}>
          <rect x={tx - 9} y="-80" width="18" height="80" fill={C.bancoFonce} />
          <path d={`M${tx - 9} -80 L${tx} -92 L${tx + 9} -80 Z`} fill={C.bancoFonce} />
          <circle cx={tx} cy="-94" r="3" fill="#f5e6c8" />
          {[-70, -56, -42].map((ty) => (
            <rect key={ty} x={tx - 12} y={ty} width="24" height="2.2" fill={C.tronc} />
          ))}
        </g>
      ))}
      {torons.map((tx) => (
        <rect key={tx} x={tx} y="-34" width="10" height="2.2" fill={C.tronc} />
      ))}
      <rect x="-8" y="-24" width="16" height="24" rx="8" fill="#4a2f1d" />
    </g>
  );
}

function Ecole({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="-70" y="-44" width="140" height="44" fill="#f1e3c8" />
      <path d="M-78 -44 L78 -44 L70 -54 L-70 -54 Z" fill="#9a3412" />
      {[-52, -22, 8, 38].map((wx) => (
        <rect key={wx} x={wx} y="-34" width="18" height="16" fill="#1e3a5f" />
      ))}
      <text x="0" y="-46.5" textAnchor="middle" fontSize="6.5" fill="#fff" fontFamily="Arial" fontWeight="bold">
        ÉCOLE FONDAMENTALE
      </text>
      <rect x="86" y="-80" width="2" height="80" fill="#6b7280" />
      <rect x="88" y="-80" width="8" height="14" fill={C.vert} />
      <rect x="96" y="-80" width="8" height="14" fill={C.jaune} />
      <rect x="104" y="-80" width="8" height="14" fill={C.rouge} />
    </g>
  );
}

function Tableau() {
  return (
    <g>
      <rect x="40" y="30" width="190" height="80" rx="3" fill="#7c4a24" />
      <rect x="46" y="36" width="178" height="68" fill="#1f3b2d" />
      <text x="58" y="58" fontSize="11" fill="#e5e7eb" fontFamily="Georgia">a + b = c</text>
      <text x="58" y="78" fontSize="10" fill="#e5e7eb" fontFamily="Georgia">I ni ce ! Bonjour !</text>
      <text x="58" y="96" fontSize="9" fill="#fde68a" fontFamily="Georgia">Mali ka di !</text>
    </g>
  );
}

function Etal({ x, y, toile }: { x: number; y: number; toile: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M-26 -40 L26 -40 L32 -30 L-32 -30 Z" fill={toile} />
      <rect x="-24" y="-30" width="2" height="30" fill="#6b4a2f" />
      <rect x="22" y="-30" width="2" height="30" fill="#6b4a2f" />
      <rect x="-26" y="-14" width="52" height="6" fill="#92400e" />
      {[-18, -9, 0, 9, 18].map((fx, i) => (
        <circle key={fx} cx={fx} cy="-17" r="3.5" fill={["#f97316", "#dc2626", "#facc15", "#16a34a", "#f97316"][i]} />
      ))}
    </g>
  );
}

function Pirogue({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g>
        <animateTransform attributeName="transform" type="translate" values="0 0; 0 2; 0 0" dur="3s" repeatCount="indefinite" />
        <path d="M-40 0 Q0 12 40 0 L34 -4 L-34 -4 Z" fill="#7c2d12" />
        <path d="M-30 -4 L30 -4" stroke="#facc15" strokeWidth="1.5" />
        <Personnage x={10} y={-4} s={0.7} tissu={C.tissus[4]} />
        <path d="M18 -26 L30 6" stroke="#5b4636" strokeWidth="1.5" />
      </g>
    </g>
  );
}

function Champ() {
  return (
    <g>
      {Array.from({ length: 22 }, (_, i) => 10 + i * 18).map((x) => (
        <g key={x}>
          <path d={`M${x} 160 L${x} 112`} stroke="#7a8f2b" strokeWidth="1.6" />
          <path d={`M${x} 130 Q${x - 8} 124 ${x - 10} 116 M${x} 138 Q${x + 8} 132 ${x + 10} 124`} stroke="#8fae35" strokeWidth="1.6" fill="none" />
          <ellipse cx={x} cy="108" rx="2.4" ry="7" fill="#c8a24a" />
        </g>
      ))}
    </g>
  );
}

function Pluie() {
  return (
    <g stroke="#bfdbfe" strokeWidth="1.2" opacity="0.8">
      {Array.from({ length: 40 }, (_, i) => (
        <line key={i} x1={(i * 37) % 400} y1={(i * 23) % 120} x2={((i * 37) % 400) - 4} y2={((i * 23) % 120) + 10}>
          <animateTransform attributeName="transform" type="translate" values="0 -20; 0 60" dur={`${0.6 + (i % 4) * 0.15}s`} repeatCount="indefinite" />
        </line>
      ))}
    </g>
  );
}

function Guirlande() {
  const couleurs = [C.vert, C.jaune, C.rouge, "#2563eb", "#db2777"];
  return (
    <g>
      <path d="M0 18 Q100 44 200 18 T400 18" stroke="#6b7280" strokeWidth="0.8" fill="none" />
      {Array.from({ length: 16 }, (_, i) => {
        const x = 12 + i * 25;
        const y = 22 + Math.sin((i / 15) * Math.PI * 2) * 0 + (i % 8 < 4 ? (i % 4) * 4 : (4 - (i % 4)) * 4);
        return <path key={i} d={`M${x - 5} ${y} L${x + 5} ${y} L${x} ${y + 10} Z`} fill={couleurs[i % couleurs.length]} />;
      })}
    </g>
  );
}

function Djembe({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M-10 -34 L10 -34 L6 -16 L8 0 L-8 0 L-6 -16 Z" fill="#7c2d12" />
      <ellipse cx="0" cy="-34" rx="10" ry="3" fill="#f5e6c8" />
      <path d="M-9 -30 L7 -18 M9 -30 L-7 -18" stroke="#fde68a" strokeWidth="0.8" />
    </g>
  );
}

function Mortier({ x, y, peau, tissu }: { x: number; y: number; peau: string; tissu: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M-9 -18 L9 -18 L6 0 L-6 0 Z" fill="#7c4a24" />
      <g>
        <animateTransform attributeName="transform" type="translate" values="0 0; 0 -10; 0 0" dur="1s" repeatCount="indefinite" />
        <rect x="-1.5" y="-56" width="3" height="40" fill="#a16207" />
      </g>
      <Personnage x={20} y={0} s={0.9} femme tissu={tissu} peau={peau} />
    </g>
  );
}

function Lampe({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle cx="0" cy="-10" r="40" fill="#fde68a" opacity="0.18">
        <animate attributeName="r" values="36;42;36" dur="2s" repeatCount="indefinite" />
      </circle>
      <rect x="-5" y="-6" width="10" height="6" fill="#78350f" />
      <path d="M-4 -6 Q0 -22 4 -6 Z" fill="#fbbf24" />
    </g>
  );
}

function CroixSante({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="-60" y="-50" width="120" height="50" fill="#f8fafc" />
      <rect x="-60" y="-56" width="120" height="8" fill="#0f766e" />
      <rect x="-6" y="-44" width="12" height="30" fill="#16a34a" />
      <rect x="-15" y="-35" width="30" height="12" fill="#16a34a" />
      <rect x="30" y="-22" width="14" height="22" fill="#94a3b8" />
      <text x="0" y="-50" textAnchor="middle" fontSize="6.5" fill="#fff" fontFamily="Arial" fontWeight="bold">CSCOM</text>
    </g>
  );
}

function Dunes() {
  return (
    <g>
      <path d="M0 110 Q60 80 130 105 T260 100 T400 96 L400 170 L0 170 Z" fill="#e9c58b" />
      <path d="M0 135 Q90 112 190 132 T400 126 L400 170 L0 170 Z" fill="#dcae6c" />
    </g>
  );
}

function Camion({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g>
        <animateTransform attributeName="transform" type="translate" values="0 0; -60 0; 0 0" dur="16s" repeatCount="indefinite" />
        <rect x="-40" y="-34" width="56" height="26" fill="#475569" />
        <rect x="16" y="-26" width="18" height="18" rx="2" fill="#b91c1c" />
        <rect x="22" y="-23" width="9" height="7" fill="#bae6fd" />
        {[-34, -24, -14, -4, 6].map((px) => (
          <Personnage key={px} x={px} y={-34} s={0.45} tissu={C.tissus[(px + 40) % 7]} />
        ))}
        <circle cx="-28" cy="-6" r="6" fill="#111827" />
        <circle cx="22" cy="-6" r="6" fill="#111827" />
      </g>
    </g>
  );
}

function Mine() {
  return (
    <g>
      {[60, 150, 250, 340].map((x, i) => (
        <g key={x}>
          <ellipse cx={x} cy="140" rx="22" ry="7" fill="#5b3a1e" />
          <path d={`M${x - 14} 140 L${x} ${110 - i * 2} L${x + 14} 140`} stroke="#8b5a2b" strokeWidth="2" fill="none" />
          <rect x={x - 2} y={110 - i * 2} width="4" height="4" fill="#78350f" />
        </g>
      ))}
      <path d="M0 100 Q50 90 100 102 T200 98 T300 104 T400 98" stroke="#b97f47" strokeWidth="3" fill="none" />
    </g>
  );
}

function Diplome({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g>
        <animateTransform attributeName="transform" type="rotate" values="-4;4;-4" dur="4s" repeatCount="indefinite" />
        <rect x="-36" y="-26" width="72" height="44" rx="2" fill="#fffbeb" stroke="#b45309" strokeWidth="1.5" />
        <text x="0" y="-10" textAnchor="middle" fontSize="8" fontFamily="Georgia" fill="#78350f" fontWeight="bold">DIPLÔME</text>
        <path d="M-24 0 L24 0 M-24 6 L16 6" stroke="#d6b48a" strokeWidth="1.2" />
        <circle cx="22" cy="12" r="6" fill={C.rouge} />
        <path d="M18 16 L16 26 L22 22 L28 26 L26 16" fill={C.rouge} />
      </g>
      <path d="M-26 -42 L0 -54 L26 -42 L0 -32 Z" fill="#111827" />
      <path d="M18 -40 L20 -28" stroke={C.jaune} strokeWidth="1.5" />
    </g>
  );
}

function Atelier() {
  return (
    <g>
      <rect x="40" y="58" width="220" height="67" fill="#f1e3c8" />
      <rect x="30" y="50" width="240" height="10" fill="#1d4ed8" />
      <text x="150" y="58" textAnchor="middle" fontSize="7" fill="#fff" fontFamily="Arial" fontWeight="bold">ATELIER — BARIKA</text>
      {/* machine à coudre */}
      <rect x="70" y="96" width="44" height="6" fill="#4b5563" />
      <path d="M76 96 L76 80 L108 80 L108 88 L100 88 L100 96" fill="#111827" />
      <rect x="66" y="102" width="52" height="4" fill="#78350f" />
      {/* pagnes suspendus */}
      {[140, 162, 184, 206, 228].map((x, i) => (
        <rect key={x} x={x} y="66" width="16" height="30" fill={C.tissus[i]} opacity="0.9" />
      ))}
      <path d="M134 66 L250 66" stroke="#6b4a2f" strokeWidth="1.5" />
      {/* moto en réparation */}
      <circle cx="310" cy="118" r="8" fill="none" stroke="#111827" strokeWidth="3" />
      <circle cx="345" cy="118" r="8" fill="none" stroke="#111827" strokeWidth="3" />
      <path d="M310 118 L322 104 L338 104 L345 118" stroke="#2563eb" strokeWidth="4" fill="none" />
      <path d="M296 124 L356 124" stroke="#6b7280" strokeWidth="1" />
    </g>
  );
}

// ---------------------------------------------------------------------------
// Les scènes
// ---------------------------------------------------------------------------

function contenuScene(scene: NomScene, id: string, peau: string) {
  switch (scene) {
    case "village":
      return (
        <>
          <Ciel moment="jour" id={id} />
          <Sol />
          <Baobab x={60} y={125} s={1.1} />
          <Case x={150} y={126} />
          <Case x={200} y={128} s={0.85} />
          <Case x={300} y={126} s={1.05} />
          <rect x="230" y="110" width="12" height="16" fill="#6b7280" />
          <Personnage x={252} y={140} femme porte="seau" tissu={C.tissus[1]} peau={peau} />
          <Personnage x={350} y={145} tissu={C.tissus[0]} peau={peau} s={0.8} />
        </>
      );
    case "ville":
      return (
        <>
          <Ciel moment="jour" id={id} />
          <MaisonBanco x={40} y={118} l={70} h={50} />
          <MaisonBanco x={120} y={118} l={60} h={38} />
          <rect x="170" y="44" width="56" height="74" fill="#e5d3b3" />
          {[52, 66, 80, 94].map((wy) => (
            <g key={wy}>
              <rect x="178" y={wy} width="10" height="8" fill="#1e3a5f" />
              <rect x="208" y={wy} width="10" height="8" fill="#1e3a5f" />
            </g>
          ))}
          <MaisonBanco x={280} y={118} l={80} h={44} />
          <rect x="340" y="60" width="2" height="58" fill="#6b7280" />
          <rect x="300" y="56" width="44" height="18" fill="#ea580c" />
          <text x="322" y="68" textAnchor="middle" fontSize="7" fill="#fff" fontFamily="Arial" fontWeight="bold">ORANGE</text>
          <rect y="118" width="400" height="52" fill="#6b6b6b" />
          <path d="M0 144 L400 144" stroke="#e5e7eb" strokeWidth="2" strokeDasharray="14 10" />
          <Sotrama x={250} y={150} />
          <Moto x={90} y={162} tissu={C.tissus[3]} />
        </>
      );
    case "ecole":
      return (
        <>
          <Ciel moment="jour" id={id} />
          <Sol />
          <Ecole x={170} y={126} />
          <Manguier x={340} y={128} />
          {[60, 80, 100].map((x, i) => (
            <Personnage key={x} x={x} y={150 + (i % 2) * 4} s={0.75} tissu="#b8a272" peau={peau} femme={i === 1} porte="livre" />
          ))}
        </>
      );
    case "classe":
      return (
        <>
          <rect width="400" height="170" fill="#efe2c6" />
          <rect y="0" width="400" height="12" fill="#9a3412" />
          <Tableau />
          <rect x="270" y="30" width="90" height="56" fill="#bae6fd" stroke="#7c4a24" strokeWidth="5" />
          <path d="M315 30 L315 86 M270 58 L360 58" stroke="#7c4a24" strokeWidth="3" />
          <rect y="128" width="400" height="42" fill="#c8a679" />
          {[30, 140, 250].map((x) => (
            <g key={x}>
              <rect x={x} y="134" width="100" height="8" fill="#7c4a24" />
              <rect x={x + 6} y="142" width="4" height="22" fill="#5b3a1e" />
              <rect x={x + 90} y="142" width="4" height="22" fill="#5b3a1e" />
            </g>
          ))}
          {[55, 95, 170, 205, 280, 320].map((x, i) => (
            <Personnage key={x} x={x} y={140} s={0.7} femme={i % 2 === 1} tissu="#b8a272" peau={peau} />
          ))}
        </>
      );
    case "mosquee":
      return (
        <>
          <Ciel moment="soir" id={id} />
          <Sol couleur="#d9a066" />
          <Mosquee x={200} y={128} s={1.1} />
          <Personnage x={70} y={152} tissu="#f8fafc" peau={peau} />
          <Personnage x={330} y={152} tissu="#e0f2fe" peau={peau} femme />
        </>
      );
    case "champ":
      return (
        <>
          <Ciel moment="jour" id={id} />
          <Sol couleur="#b98b4f" y={100} />
          <Champ />
          <Case x={350} y={100} s={0.7} />
          <Personnage x={180} y={150} porte="houe" tissu={C.tissus[4]} peau={peau} />
        </>
      );
    case "fleuve":
      return (
        <>
          <Ciel moment="soir" id={id} />
          <rect y="105" width="400" height="65" fill={C.eau} />
          <path d="M0 105 Q200 98 400 105 L400 112 L0 112 Z" fill={C.terre} />
          <Pirogue x={200} y={140} />
        </>
      );
    case "marche":
      return (
        <>
          <Ciel moment="jour" id={id} />
          <Sol couleur="#cfa06a" />
          <MaisonBanco x={330} y={122} l={90} h={46} />
          <Etal x={60} y={135} toile={C.tissus[0]} />
          <Etal x={150} y={138} toile={C.tissus[2]} />
          <Etal x={240} y={135} toile={C.tissus[1]} />
          <Personnage x={105} y={158} femme tissu={C.tissus[5]} peau={peau} porte="seau" />
          <Personnage x={200} y={160} tissu={C.tissus[6]} peau={peau} />
        </>
      );
    case "sante":
      return (
        <>
          <Ciel moment="jour" id={id} />
          <Sol />
          <CroixSante x={190} y={126} />
          <Personnage x={300} y={150} femme tissu={C.tissus[3]} peau={peau} />
          <Personnage x={320} y={152} s={0.6} tissu={C.tissus[1]} peau={peau} />
          <Manguier x={60} y={128} s={0.9} />
        </>
      );
    case "nuit":
      return (
        <>
          <Ciel moment="nuit" id={id} />
          <Sol couleur="#3b2f2a" />
          <MaisonBanco x={110} y={126} l={110} h={50} />
          <Lampe x={250} y={138} />
          <rect x="265" y="132" width="20" height="3" fill="#f8fafc" />
          <Personnage x={280} y={152} s={0.85} tissu="#475569" peau={peau} porte="livre" />
        </>
      );
    case "desert":
      return (
        <>
          <Ciel moment="soir" id={id} />
          <Dunes />
          <Camion x={220} y={140} />
        </>
      );
    case "fete":
      return (
        <>
          <Ciel moment="soir" id={id} />
          <Sol couleur="#cf9a62" />
          <Guirlande />
          <rect x="40" y="60" width="320" height="8" fill="#2563eb" opacity="0.8" />
          {[70, 120, 170, 230, 280, 330].map((x, i) => (
            <g key={x}>
              <animateTransform attributeName="transform" type="translate" values={`0 0; 0 ${i % 2 ? -4 : -2}; 0 0`} dur={`${0.6 + i * 0.07}s`} repeatCount="indefinite" />
              <Personnage x={x} y={150} femme={i % 2 === 0} tissu={C.tissus[i]} peau={peau} />
            </g>
          ))}
          <Djembe x={200} y={160} />
        </>
      );
    case "mine":
      return (
        <>
          <Ciel moment="jour" id={id} />
          <Sol couleur="#a8743f" y={100} />
          <Mine />
          <Personnage x={110} y={150} tissu="#78716c" peau={peau} porte="seau" />
          <Personnage x={200} y={156} tissu="#57534e" peau={peau} porte="houe" />
        </>
      );
    case "concession":
      return (
        <>
          <Ciel moment="soir" id={id} />
          <Sol />
          <rect x="0" y="84" width="400" height="42" fill={C.banco} />
          <rect x="0" y="80" width="400" height="5" fill={C.bancoFonce} />
          <Manguier x={300} y={128} s={1.2} />
          <Mortier x={80} y={150} peau={peau} tissu={C.tissus[5]} />
          <Personnage x={300} y={152} s={0.95} femme tissu="#f1f5f9" peau={peau} />
          <Personnage x={260} y={156} s={0.6} tissu={C.tissus[0]} peau={peau} />
          <Personnage x={334} y={156} s={0.6} femme tissu={C.tissus[1]} peau={peau} />
          <ellipse cx="200" cy="150" rx="14" ry="4" fill="#6b4a2f" />
          <path d="M194 148 Q200 132 206 148" fill="#f97316">
            <animate attributeName="d" values="M194 148 Q200 132 206 148;M194 148 Q201 128 206 148;M194 148 Q200 132 206 148" dur="0.8s" repeatCount="indefinite" />
          </path>
        </>
      );
    case "pluie":
      return (
        <>
          <Ciel moment="nuit" id={id} />
          <rect width="400" height="170" fill="#475569" opacity="0.5" />
          <MaisonBanco x={110} y={130} l={90} h={46} />
          <MaisonBanco x={290} y={134} l={70} h={36} />
          <rect y="128" width="400" height="42" fill="#5b7f95" />
          <path d="M0 136 Q50 132 100 136 T200 136 T300 136 T400 136" stroke="#94b8cc" strokeWidth="2" fill="none" />
          <Pluie />
          <Personnage x={210} y={160} tissu={C.tissus[2]} peau={peau} />
        </>
      );
    case "diplome":
      return (
        <>
          <Ciel moment="jour" id={id} />
          <Sol couleur="#d9b07a" />
          <Diplome x={200} y={82} />
          {[120, 280].map((x, i) => (
            <Personnage key={x} x={x} y={152} femme={i === 1} tissu={C.tissus[i + 3]} peau={peau} />
          ))}
        </>
      );
    case "atelier":
      return (
        <>
          <Ciel moment="jour" id={id} />
          <Sol couleur="#c79a66" />
          <Atelier />
          <Personnage x={140} y={150} tissu={C.tissus[0]} peau={peau} />
        </>
      );
  }
}

export function Illustration({
  scene,
  etat,
  className = "",
}: {
  scene: NomScene;
  etat?: Etat;
  className?: string;
}) {
  const id = useId().replace(/:/g, "");
  const peau = C.peau[(etat?.prenom.length ?? 0) % C.peau.length];
  return (
    <svg
      viewBox="0 0 400 170"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      role="img"
      aria-hidden="true"
    >
      {contenuScene(scene, id, peau)}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Avatar : le personnage grandit et change de tenue au fil de sa vie
// ---------------------------------------------------------------------------

export function Avatar({ etat, taille = 64 }: { etat: Etat; taille?: number }) {
  const fille = etat.sexe === "fille";
  const peau = C.peau[etat.prenom.length % C.peau.length];
  const age = etat.age;
  const d = etat.drapeaux;
  const enfant = age < 12;
  const ado = age >= 12 && age < 18;

  // Tenue selon la situation
  let tissu = C.tissus[etat.nomFamille.length % C.tissus.length];
  if (d.enEcole && age < 19) tissu = "#b8a272"; // uniforme kaki
  if (d.metier && String(d.metier).includes("militaire")) tissu = "#4d5b2e";
  if (d.marie) tissu = fille ? "#be185d" : "#f8fafc"; // bazin de cérémonie

  const echelle = enfant ? 0.82 : ado ? 0.92 : 1;

  return (
    <svg viewBox="0 0 64 64" width={taille} height={taille} aria-hidden="true">
      <circle cx="32" cy="32" r="31" fill="#fdf1e4" stroke="#e8d9c4" />
      <g transform={`translate(32 ${enfant ? 36 : 34}) scale(${echelle})`}>
        {/* corps */}
        <path d={fille ? "M-17 30 Q-16 6 0 5 Q16 6 17 30 Z" : "M-18 30 Q-17 5 0 4 Q17 5 18 30 Z"} fill={tissu} />
        {d.marie && !fille && <path d="M-6 6 L0 16 L6 6" stroke="#cbd5e1" strokeWidth="1.5" fill="none" />}
        {/* cou + tête */}
        <rect x="-3.5" y="-2" width="7" height="8" fill={peau} />
        <ellipse cx="0" cy="-10" rx="11" ry="12.5" fill={peau} />
        {/* yeux et sourire */}
        <circle cx="-4" cy="-11" r="1.4" fill="#1f1610" />
        <circle cx="4" cy="-11" r="1.4" fill="#1f1610" />
        <path d={etat.jauges.moral >= 40 ? "M-4 -4 Q0 -1 4 -4" : "M-4 -2.5 Q0 -5 4 -2.5"} stroke="#1f1610" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        {/* cheveux / coiffe */}
        {fille ? (
          age >= 18 ? (
            <path d="M-13 -13 Q-14 -28 0 -27 Q14 -28 13 -13 Q8 -20 0 -20 Q-8 -20 -13 -13 Z M8 -26 Q16 -32 14 -20" fill={tissu} stroke="#00000020" />
          ) : (
            <>
              <path d="M-11 -14 Q0 -27 11 -14 Q6 -19 0 -19 Q-6 -19 -11 -14 Z" fill="#1f1610" />
              <path d="M-9 -18 L-15 -6 M9 -18 L15 -6" stroke="#1f1610" strokeWidth="2.4" strokeLinecap="round" />
              <circle cx="-15" cy="-5" r="1.6" fill={C.jaune} />
              <circle cx="15" cy="-5" r="1.6" fill={C.rouge} />
            </>
          )
        ) : age >= 18 ? (
          <path d="M-11 -16 Q-11 -26 0 -26 Q11 -26 11 -16 L11 -18 Q0 -22 -11 -18 Z" fill={d.marie ? "#f8fafc" : "#7c2d12"} stroke="#00000020" />
        ) : (
          <path d="M-11 -14 Q0 -26 11 -14 Q6 -20 0 -20 Q-6 -20 -11 -14 Z" fill="#1f1610" />
        )}
        {/* barbe naissante */}
        {!fille && age >= 21 && <path d="M-7 -3 Q0 4 7 -3" stroke="#1f1610" strokeWidth="1.5" fill="none" opacity="0.6" />}
      </g>
    </svg>
  );
}
