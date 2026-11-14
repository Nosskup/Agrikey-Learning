import type { Metadata } from "next";
import Jeu from "./Jeu";

export const metadata: Metadata = {
  title: "Dakan : destin — une vie au Mali",
  description:
    "Un jeu de choix de vie : grandis au Mali, fille ou garçon, et fais les choix qui façonneront ton avenir jusqu'à tes 25 ans.",
};

export default function PageJeu() {
  return <Jeu />;
}
