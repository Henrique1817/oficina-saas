"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
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

type TeamMember = {
  id: string;
  fullName: string;
  role: string;
  active: boolean;
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

function toDatetimeLocalValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function CreateServiceOrderForm({
  initialCustomerId = "",
  initialVehicleId = "",
}: {
  initialCustomerId?: string;
  initialVehicleId?: string;
}) {
  const router = useRouter();
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [vehicles, setVehicles] = useState<VehicleRow[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [customerId, setCustomerId] = useState(initialCustomerId);
  const [vehicleId, setVehicleId] = useState(initialVehicleId);
  const [assignedMechanicId, setAssignedMechanicId] = useState("");
  const [description, setDescription] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [dueAt, setDueAt] = useState("");
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

  const selectedVehicle = useMemo(
    () => vehicles.find((v) => v.id === vehicleId) ?? null,
    [vehicles, vehicleId],
  );

  const mechanics = useMemo(
    () => team.filter((u) => u.active && ["MECHANIC", "MANAGER", "ADMIN"].includes(u.role)),
    [team],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [custRes, users] = await Promise.all([
          apiFetch<{
            data: CustomerRow[];
            nextCursor: string | null;
            hasMore: boolean;
          }>("/api/v1/customers?limit=100"),
          apiFetch<TeamMember[]>("/api/v1/users").catch(() => [] as TeamMember[]),
        ]);
        if (!cancelled) {
          setCustomers(custRes.data ?? []);
          setTeam(Array.isArray(users) ? users : []);
        }
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
          const rows = Array.isArray(list) ? list : [];
          setVehicles(rows);
          setVehicleId((current) =>
            current && rows.some((v) => v.id === current) ? current : "",
          );
        }
      } catch {
        if (!cancelled) setVehicles([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [customerId]);

  useEffect(() => {
    if (!selectedVehicle?.reportedIssue) return;
    setDescription((prev) => (prev.trim() ? prev : selectedVehicle.reportedIssue!));
  }, [selectedVehicle]);

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
          internalNotes: internalNotes.trim() || undefined,
          assignedMechanicId: assignedMechanicId || undefined,
          dueAt: dueAt ? new Date(dueAt).toISOString() : undefined,
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
    return <p className="text-ink-mute">Carregando clientes...</p>;
  }

  return (
    <form onSubmit={submit} className="max-w-xl space-y-5 border border-line bg-bg-panel p-6 md:p-8">
      {error && <p className="text-sm text-alert">{error}</p>}

      {customers.length === 0 && (
        <p className="border border-signal/40 bg-signal/10 px-3 py-2 text-sm text-ink-dim">
          Nenhum cliente cadastrado.{" "}
          <Link href="/manager/customers" className="font-semibold text-signal hover:underline">
            Cadastrar cliente
          </Link>
        </p>
      )}

      <div>
        <div className="mb-1 flex items-center justify-between gap-2">
          <label htmlFor="os-customer">Cliente *</label>
          <Link href="/manager/customers" className="text-xs text-signal hover:underline">
            + Novo cliente
          </Link>
        </div>
        <select
          id="os-customer"
          required
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
      </div>

      {customerId && (
        <>
          <div>
            <label htmlFor="os-vehicle">Veículo *</label>
            <select
              id="os-vehicle"
              required
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
          </div>

          {selectedVehicle?.reportedIssue && (
            <div className="border border-line bg-bg/60 px-4 py-3">
              <p className="mono-label text-ink-mute">Problema do veículo</p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-ink-dim">
                {selectedVehicle.reportedIssue}
              </p>
            </div>
          )}

          <button
            type="button"
            className="text-sm text-signal underline-offset-2 hover:underline"
            onClick={() => setShowNewVehicle((s) => !s)}
          >
            {showNewVehicle ? "Cancelar novo veículo" : "+ Cadastrar veículo deste cliente"}
          </button>

          {showNewVehicle && (
            <div className="space-y-3 border border-line p-4">
              <p className="mono-label text-ink-mute">Novo veículo</p>
              <div>
                <label htmlFor="new-plate">Placa *</label>
                <input
                  id="new-plate"
                  required={showNewVehicle}
                  className="uppercase"
                  value={newPlate}
                  onChange={(e) => setNewPlate(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="new-model">Modelo *</label>
                <input
                  id="new-model"
                  required={showNewVehicle}
                  placeholder="Marca / modelo"
                  value={newModel}
                  onChange={(e) => setNewModel(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="new-year">Ano</label>
                  <input
                    id="new-year"
                    type="number"
                    min={1900}
                    max={2100}
                    value={newYear}
                    onChange={(e) => setNewYear(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="new-color">Cor</label>
                  <input
                    id="new-color"
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="new-issue">Problema apresentado</label>
                <textarea
                  id="new-issue"
                  rows={2}
                  value={newReportedIssue}
                  onChange={(e) => setNewReportedIssue(e.target.value)}
                />
              </div>
              <Button type="button" disabled={newVehicleLoading} onClick={() => void addVehicleClick()}>
                {newVehicleLoading ? "Salvando..." : "Adicionar veículo"}
              </Button>
            </div>
          )}
        </>
      )}

      <div>
        <label htmlFor="os-mechanic">Mecânico responsável</label>
        <select
          id="os-mechanic"
          value={assignedMechanicId}
          onChange={(e) => setAssignedMechanicId(e.target.value)}
        >
          <option value="">Sem atribuição</option>
          {mechanics.map((m) => (
            <option key={m.id} value={m.id}>
              {m.fullName} ({m.role})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="os-due">Prazo prometido</label>
        <input
          id="os-due"
          type="datetime-local"
          value={dueAt}
          onChange={(e) => setDueAt(e.target.value)}
          min={toDatetimeLocalValue(new Date())}
        />
      </div>

      <div>
        <label htmlFor="os-desc">Descrição do serviço</label>
        <textarea
          id="os-desc"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Serviços a realizar nesta OS"
        />
      </div>

      <div>
        <label htmlFor="os-notes">Notas internas</label>
        <textarea
          id="os-notes"
          rows={2}
          value={internalNotes}
          onChange={(e) => setInternalNotes(e.target.value)}
          placeholder="Só a equipe vê — não vai no orçamento ao cliente"
        />
      </div>

      <div className="flex flex-wrap gap-2 pt-2">
        <Button type="submit" disabled={loading || customers.length === 0}>
          {loading ? "Criando..." : "Criar ordem de serviço"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Voltar
        </Button>
      </div>
    </form>
  );
}
