"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api-client";

type CustomerRow = {
  id: string;
  name: string;
  phone: string | null;
};

type VehicleRow = {
  id: string;
  plate: string;
  vehicleModel: string;
  vehicleYear: number | null;
  color: string | null;
  reportedIssue: string | null;
};

function vehicleLabel(v: VehicleRow) {
  const bits = [
    v.plate,
    v.vehicleModel,
    v.vehicleYear != null ? String(v.vehicleYear) : null,
    v.color ? v.color : null,
  ].filter(Boolean);
  return bits.join(" · ");
}

export function CreateServiceOrderForm() {
  const router = useRouter();
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [vehicles, setVehicles] = useState<VehicleRow[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showNewVehicle, setShowNewVehicle] = useState(false);
  const [newPlate, setNewPlate] = useState("");
  const [newColor, setNewColor] = useState("");
  const [newModel, setNewModel] = useState("");
  const [newYear, setNewYear] = useState("");
  const [newReportedIssue, setNewReportedIssue] = useState("");
  const [newVehicleLoading, setNewVehicleLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch<{
          data: CustomerRow[];
          nextCursor: string | null;
          hasMore: boolean;
        }>("/api/v1/customers?limit=100");
        if (!cancelled) setCustomers(res.data ?? []);
      } catch {
        if (!cancelled) setError("Não foi possível carregar clientes");
      } finally {
        if (!cancelled) setLoadingCustomers(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!customerId) {
      setVehicles([]);
      setVehicleId("");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const list = await apiFetch<VehicleRow[]>(`/api/v1/vehicles?customerId=${customerId}`);
        if (!cancelled) {
          setVehicles(Array.isArray(list) ? list : []);
          setVehicleId("");
        }
      } catch {
        if (!cancelled) setVehicles([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [customerId]);

  async function addVehicleClick() {
    if (!customerId || !newPlate.trim() || !newModel.trim()) return;
    setNewVehicleLoading(true);
    setError(null);
    try {
      const created = await apiFetch<VehicleRow>("/api/v1/vehicles", {
        method: "POST",
        body: JSON.stringify({
          customerId,
          plate: newPlate.trim().toUpperCase(),
          vehicleModel: newModel.trim(),
          vehicleYear: newYear.trim() ? Number(newYear) : undefined,
          color: newColor.trim() || undefined,
          reportedIssue: newReportedIssue.trim() || undefined,
        }),
      });
      setVehicles((v) => [...v, created]);
      setVehicleId(created.id);
      setNewPlate("");
      setNewColor("");
      setNewModel("");
      setNewYear("");
      setNewReportedIssue("");
      setShowNewVehicle(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao cadastrar veículo");
    } finally {
      setNewVehicleLoading(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!customerId || !vehicleId) {
      setError("Selecione cliente e veículo");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const order = await apiFetch<{ id: string }>("/api/v1/service-orders", {
        method: "POST",
        body: JSON.stringify({
          customerId,
          vehicleId,
          description: description.trim() || undefined,
        }),
      });
      router.push(`/workshop/service-orders/${order.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar OS");
    } finally {
      setLoading(false);
    }
  }

  if (loadingCustomers) {
    return <p className="text-muted-foreground">Carregando clientes...</p>;
  }

  return (
    <form onSubmit={submit} className="max-w-lg space-y-4">
      {error && <p className="text-sm text-danger">{error}</p>}

      <label className="block text-sm">
        Cliente *
        <select
          required
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
        >
          <option value="">Selecione...</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
              {c.phone ? ` — ${c.phone}` : ""}
            </option>
          ))}
        </select>
      </label>

      {customerId && (
        <>
          <label className="block text-sm">
            Veículo *
            <select
              required
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
            >
              <option value="">Selecione...</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {vehicleLabel(v)}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            className="text-sm text-primary underline"
            onClick={() => setShowNewVehicle((s) => !s)}
          >
            {showNewVehicle ? "Cancelar novo veículo" : "+ Cadastrar veículo deste cliente"}
          </button>

          {showNewVehicle && (
            <div className="space-y-3 rounded-lg border border-border p-4">
              <p className="text-sm text-muted-foreground">Novo veículo do cliente</p>
              <label className="block text-sm">
                Placa *
                <input
                  required={showNewVehicle}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 uppercase"
                  value={newPlate}
                  onChange={(e) => setNewPlate(e.target.value)}
                />
              </label>
              <label className="block text-sm">
                Modelo *
                <input
                  required={showNewVehicle}
                  placeholder="Marca / modelo"
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
                  value={newModel}
                  onChange={(e) => setNewModel(e.target.value)}
                />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="block text-sm">
                  Ano
                  <input
                    type="number"
                    min={1900}
                    max={2100}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
                    value={newYear}
                    onChange={(e) => setNewYear(e.target.value)}
                  />
                </label>
                <label className="block text-sm">
                  Cor
                  <input
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value)}
                  />
                </label>
              </div>
              <label className="block text-sm">
                Problema apresentado
                <textarea
                  rows={2}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
                  value={newReportedIssue}
                  onChange={(e) => setNewReportedIssue(e.target.value)}
                />
              </label>
              <Button type="button" disabled={newVehicleLoading} onClick={() => void addVehicleClick()}>
                {newVehicleLoading ? "Salvando..." : "Adicionar veículo"}
              </Button>
            </div>
          )}
        </>
      )}

      <label className="block text-sm">
        Descrição da ordem de serviço
        <textarea
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Serviços a realizar nesta OS"
        />
      </label>

      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Criando..." : "Criar ordem de serviço"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Voltar
        </Button>
      </div>
    </form>
  );
}
