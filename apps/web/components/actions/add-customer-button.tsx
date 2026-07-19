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
  variant?: "default" | "secondary";
  className?: string;
};

type CreatedCustomer = {
  id: string;
  name: string;
};

export function AddCustomerButton({ variant = "default", className }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"customer" | "vehicle">("customer");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [createdCustomer, setCreatedCustomer] = useState<CreatedCustomer | null>(null);
  const [vehicleDraft, setVehicleDraft] = useState<VehicleDraft>(() => emptyVehicleDraft());

  function patchVehicle(patch: Partial<VehicleDraft>) {
    setVehicleDraft((d) => ({ ...d, ...patch }));
  }

  function resetAndClose() {
    setOpen(false);
    setStep("customer");
    setName("");
    setPhone("");
    setEmail("");
    setCreatedCustomer(null);
    setVehicleDraft(emptyVehicleDraft());
    setError(null);
  }

  function openModal() {
    setStep("customer");
    setCreatedCustomer(null);
    setVehicleDraft(emptyVehicleDraft());
    setError(null);
    setOpen(true);
  }

  async function submitCustomer(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const customer = await apiFetch<CreatedCustomer>("/api/v1/customers", {
        method: "POST",
        body: JSON.stringify({
          name,
          phone: phone || undefined,
          email: email || undefined,
        }),
      });
      setCreatedCustomer(customer);
      setStep("vehicle");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao cadastrar");
    } finally {
      setLoading(false);
    }
  }

  async function submitVehicle(e: React.FormEvent) {
    e.preventDefault();
    if (!createdCustomer) return;
    setLoading(true);
    setError(null);
    try {
      await apiFetch("/api/v1/vehicles", {
        method: "POST",
        body: JSON.stringify({
          customerId: createdCustomer.id,
          plate: vehicleDraft.plate.trim().toUpperCase(),
          vehicleModel: vehicleDraft.vehicleModel.trim(),
          vehicleYear: vehicleDraft.vehicleYear.trim() ? Number(vehicleDraft.vehicleYear) : undefined,
          color: vehicleDraft.color.trim() || undefined,
          reportedIssue: vehicleDraft.reportedIssue.trim() || undefined,
        }),
      });
      resetAndClose();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao cadastrar veículo");
    } finally {
      setLoading(false);
    }
  }

  function skipVehicle() {
    resetAndClose();
    router.refresh();
  }

  return (
    <>
      <Button type="button" variant={variant} className={className} onClick={openModal}>
        Novo cliente
      </Button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div
            className="absolute inset-0"
            role="presentation"
            onClick={() => !loading && resetAndClose()}
          />
          {step === "customer" ? (
            <form
              onSubmit={submitCustomer}
              className="relative z-10 w-full max-w-md border border-line bg-bg-panel p-6 shadow-xl"
            >
              <h2 className="mb-4 text-lg font-semibold">Cadastrar cliente</h2>
              {error && <p className="mb-3 text-sm text-danger">{error}</p>}
              <label className="mb-2 block text-sm">
                Nome *
                <input
                  required
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
              <label className="mb-2 block text-sm">
                Telefone
                <input
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </label>
              <label className="mb-4 block text-sm">
                E-mail
                <input
                  type="email"
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" disabled={loading} onClick={resetAndClose}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Salvando..." : "Continuar"}
                </Button>
              </div>
            </form>
          ) : (
            <form
              onSubmit={submitVehicle}
              className="relative z-10 max-h-[90vh] w-full max-w-md overflow-y-auto border border-line bg-bg-panel p-6 shadow-xl"
            >
              <h2 className="mb-1 text-lg font-semibold">Veículo do cliente</h2>
              <p className="mb-4 text-xs text-muted-foreground">
                Cliente: <span className="font-medium text-foreground">{createdCustomer?.name}</span>
              </p>
              {error && <p className="mb-3 text-sm text-danger">{error}</p>}
              <VehicleCreateFormFields draft={vehicleDraft} onChange={patchVehicle} />
              <div className="flex flex-wrap justify-end gap-2">
                <Button type="button" variant="secondary" disabled={loading} onClick={skipVehicle}>
                  Pular por agora
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Salvando..." : "Salvar veículo"}
                </Button>
              </div>
            </form>
          )}
        </div>
      )}
    </>
  );
}
