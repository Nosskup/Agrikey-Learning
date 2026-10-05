"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { PARTNER_TYPES } from "@/lib/partner-request";

type Status = "new" | "contacted" | "closed";

type PartnerRequest = {
  id: number;
  created_at: string;
  full_name: string;
  organization: string | null;
  partner_type: string;
  email: string;
  phone: string | null;
  message: string;
  status: Status;
  admin_notes: string | null;
};

const STATUS_LABEL: Record<Status, string> = {
  new: "Nouvelle",
  contacted: "Contactée",
  closed: "Clôturée",
};

const STATUS_STYLE: Record<Status, string> = {
  new: "bg-amber-100 text-amber-800",
  contacted: "bg-blue-100 text-blue-800",
  closed: "bg-gray-200 text-gray-700",
};

type Filter = "all" | Status;

function typeLabel(value: string) {
  return PARTNER_TYPES.find((t) => t.value === value)?.label ?? value;
}

export default function AdminPartnersPage() {
  const [requests, setRequests] = useState<PartnerRequest[]>([]);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          throw new Error("Vous devez être connecté.");
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("user_id", user.id)
          .single();

        if (profileError || profile?.role !== "admin") {
          throw new Error("Accès réservé aux administrateurs.");
        }

        const { data, error: listError } = await supabase
          .from("partner_requests")
          .select(
            "id, created_at, full_name, organization, partner_type, email, phone, message, status, admin_notes"
          )
          .order("created_at", { ascending: false });

        if (listError) {
          throw listError;
        }

        const loaded = (data || []) as PartnerRequest[];
        setRequests(loaded);
        setNotes(
          Object.fromEntries(loaded.map((r) => [r.id, r.admin_notes || ""]))
        );
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Une erreur est survenue."
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const counts = useMemo(
    () => ({
      all: requests.length,
      new: requests.filter((r) => r.status === "new").length,
      contacted: requests.filter((r) => r.status === "contacted").length,
      closed: requests.filter((r) => r.status === "closed").length,
    }),
    [requests]
  );

  const visible = useMemo(
    () => (filter === "all" ? requests : requests.filter((r) => r.status === filter)),
    [requests, filter]
  );

  async function save(
    id: number,
    changes: Partial<Pick<PartnerRequest, "status" | "admin_notes">>,
    success: string
  ) {
    try {
      setBusyId(id);
      setError("");
      setMessage("");

      const { error: updateError } = await supabase
        .from("partner_requests")
        .update(changes)
        .eq("id", id);

      if (updateError) {
        throw updateError;
      }

      setRequests((current) =>
        current.map((r) => (r.id === id ? { ...r, ...changes } : r))
      );
      setMessage(success);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "L'enregistrement a échoué."
      );
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: number) {
    try {
      setBusyId(id);
      setError("");
      setMessage("");

      const { error: deleteError } = await supabase
        .from("partner_requests")
        .delete()
        .eq("id", id);

      if (deleteError) {
        throw deleteError;
      }

      setRequests((current) => current.filter((r) => r.id !== id));
      setConfirmDeleteId(null);
      setMessage("La demande a été supprimée.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "La suppression a échoué."
      );
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 p-8">
        <div className="mx-auto max-w-5xl">
          <p>Chargement des demandes...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/admin"
          className="text-sm font-semibold text-green-700 hover:text-green-800"
        >
          ← Retour à l'administration
        </Link>

        <h1 className="mt-3 text-3xl font-bold text-gray-900">
          Demandes de partenariat
        </h1>

        <p className="mt-2 text-gray-600">
          Les demandes envoyées depuis la page « Devenir partenaire ». Aucune
          notification n'est envoyée automatiquement : consultez cette page
          régulièrement.
        </p>

        {message && (
          <div className="mt-6 rounded-lg bg-green-100 p-4 text-green-800">
            {message}
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-lg bg-red-100 p-4 text-red-800">
            {error}
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-2">
          {(
            [
              ["all", "Toutes"],
              ["new", "Nouvelles"],
              ["contacted", "Contactées"],
              ["closed", "Clôturées"],
            ] as [Filter, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              aria-pressed={filter === key}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                filter === key
                  ? "bg-green-700 text-white"
                  : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              {label} ({counts[key]})
            </button>
          ))}
        </div>

        {visible.length === 0 && !error && (
          <div className="mt-8 rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500">
            {requests.length === 0
              ? "Aucune demande reçue pour le moment."
              : "Aucune demande dans cette catégorie."}
          </div>
        )}

        <div className="mt-8 space-y-5">
          {visible.map((request) => (
            <article
              key={request.id}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    {request.full_name}
                    {request.organization && (
                      <span className="font-medium text-gray-500">
                        {" "}
                        · {request.organization}
                      </span>
                    )}
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    {typeLabel(request.partner_type)} ·{" "}
                    {new Date(request.created_at).toLocaleString("fr-FR", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_STYLE[request.status]}`}
                >
                  {STATUS_LABEL[request.status]}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                <a
                  href={`mailto:${request.email}`}
                  className="font-semibold text-green-700 hover:text-green-800"
                >
                  {request.email}
                </a>

                {request.phone && (
                  <a
                    href={`tel:${request.phone.replace(/\s+/g, "")}`}
                    className="font-semibold text-green-700 hover:text-green-800"
                  >
                    {request.phone}
                  </a>
                )}
              </div>

              {/* Texte brut : le contenu saisi par un visiteur n'est jamais interprété comme du HTML. */}
              <p className="mt-4 whitespace-pre-wrap rounded-xl bg-gray-50 p-4 text-sm leading-6 text-gray-800">
                {request.message}
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {(["new", "contacted", "closed"] as Status[]).map((s) => (
                  <button
                    key={s}
                    disabled={busyId === request.id || request.status === s}
                    onClick={() =>
                      save(
                        request.id,
                        { status: s },
                        `Statut changé : ${STATUS_LABEL[s].toLowerCase()}.`
                      )
                    }
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                  >
                    Marquer « {STATUS_LABEL[s].toLowerCase()} »
                  </button>
                ))}
              </div>

              <label
                htmlFor={`note-${request.id}`}
                className="mt-5 block text-sm font-semibold text-gray-700"
              >
                Notes internes (invisibles du demandeur)
              </label>

              <textarea
                id={`note-${request.id}`}
                rows={3}
                maxLength={4000}
                value={notes[request.id] ?? ""}
                onChange={(e) =>
                  setNotes((current) => ({
                    ...current,
                    [request.id]: e.target.value,
                  }))
                }
                placeholder="Échanges, rendez-vous, suites à donner..."
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-600"
              />

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <button
                  disabled={
                    busyId === request.id ||
                    (notes[request.id] ?? "") === (request.admin_notes ?? "")
                  }
                  onClick={() =>
                    save(
                      request.id,
                      { admin_notes: (notes[request.id] ?? "").trim() || null },
                      "Notes enregistrées."
                    )
                  }
                  className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-40"
                >
                  Enregistrer les notes
                </button>

                {confirmDeleteId === request.id ? (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold text-red-700">
                      Supprimer définitivement ?
                    </span>
                    <button
                      disabled={busyId === request.id}
                      onClick={() => remove(request.id)}
                      className="rounded-lg bg-red-600 px-3 py-1.5 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      Oui, supprimer
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="rounded-lg border border-gray-300 px-3 py-1.5 font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      Annuler
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteId(request.id)}
                    className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-50"
                  >
                    Supprimer
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
