"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api-client";
import {
  VehicleCreateFormFields,
  emptyVehicleDraft,
  type VehicleDraft,
} from "@/components/actions/vehicle-create-form-fields";

type Props = {
  customerId: string;
  customerName: string;
  size?: "default" | "sm";
};

export function AddVehicleButton({ customerId, customerName, size = "sm" }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<VehicleDraft>(() => emptyVehicleDraft());

  function patchDraft(patch: Partial<VehicleDraft>) {
    setDraft((d) => ({ ...d, ...patch }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await apiFetch("/api/v1/vehicles", {
        method: "POST",
        body: JSON.stringify({
          customerId,
          plate: draft.plate.trim().toUpperCase(),
          vehicleModel: draft.vehicleModel.trim(),
          vehicleYear: draft.vehicleYear.trim() ? Number(draft.vehicleYear) : undefined,
          color: draft.color.trim() || undefined,
          reportedIssue: draft.reportedIssue.trim() || undefined,
        }),
      });
      setOpen(false);
      setDraft(emptyVehicleDraft());
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao cadastrar veículo");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size={size}
        onClick={() => setOpen(true)}
      >
        + Veículo
      </Button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div
            className="absolute inset-0"
            role="presentation"
            onClick={() => !loading && setOpen(false)}
          />
          <form
            onSubmit={submit}
            className="relative z-10 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-xl"
          >
            <h2 className="mb-1 text-lg font-semibold">Novo veículo</h2>
            <p className="mb-4 text-xs text-muted-foreground">Cliente: {customerName}</p>
            {error && <p className="mb-3 text-sm text-danger">{error}</p>}
            <VehicleCreateFormFields draft={draft} onChange={patchDraft} />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" disabled={loading} onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
