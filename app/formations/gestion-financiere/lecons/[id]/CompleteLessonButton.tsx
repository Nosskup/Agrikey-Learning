"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../../../lib/supabase";

type Props = {
  lessonId: number;
};

export default function CompleteLessonButton({
  lessonId,
}: Props) {
  const router = useRouter();

  const [chargement, setChargement] = useState(false);
  const [message, setMessage] = useState("");

  async function handleComplete() {
    setChargement(true);
    setMessage("");

    const { data: userData } =
      await supabase.auth.getUser();

    if (!userData.user) {
      router.push("/connexion");
      return;
    }

    const userId = userData.user.id;

    const { data: existingProgress, error: searchError } =
      await supabase
        .from("lesson_progress")
        .select("id")
        .eq("user_id", userId)
        .eq("lesson_id", lessonId)
        .maybeSingle();

    if (searchError) {
      setMessage(
        "Impossible de vérifier votre progression."
      );
      setChargement(false);
      return;
    }

    if (existingProgress) {
      const { error } = await supabase
        .from("lesson_progress")
        .update({
          completed: true,
        })
        .eq("id", existingProgress.id);

      if (error) {
        setMessage(
          "Impossible d'enregistrer votre progression."
        );
        setChargement(false);
        return;
      }
    } else {
      const { error } = await supabase
        .from("lesson_progress")
        .insert({
          user_id: userId,
          lesson_id: lessonId,
          completed: true,
        });

      if (error) {
        setMessage(
          "Impossible d'enregistrer votre progression."
        );
        setChargement(false);
        return;
      }
    }

    setMessage("Leçon terminée !");
    setChargement(false);
  }

  return (
    <div>
      <button
        onClick={handleComplete}
        disabled={chargement}
      >
        {chargement
          ? "Enregistrement..."
          : "Marquer comme terminée"}
      </button>

      {message && <p>{message}</p>}
    </div>
  );
}