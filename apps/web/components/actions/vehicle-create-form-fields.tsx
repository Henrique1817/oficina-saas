"use client";

export type VehicleDraft = {
  plate: string;
  color: string;
  vehicleModel: string;
  vehicleYear: string;
  reportedIssue: string;
};

export function emptyVehicleDraft(): VehicleDraft {
  return {
    plate: "",
    color: "",
    vehicleModel: "",
    vehicleYear: "",
    reportedIssue: "",
  };
}

type Props = {
  draft: VehicleDraft;
  onChange: (patch: Partial<VehicleDraft>) => void;
};

export function VehicleCreateFormFields({ draft, onChange }: Props) {
  return (
    <>
      <label className="mb-2 block text-sm">
        Placa *
        <input
          required
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 uppercase"
          value={draft.plate}
          onChange={(e) => onChange({ plate: e.target.value })}
        />
      </label>
      <label className="mb-2 block text-sm">
        Modelo *
        <input
          required
          placeholder="Ex.: Honda Civic, Nissan Skyline GT-R"
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
          value={draft.vehicleModel}
          onChange={(e) => onChange({ vehicleModel: e.target.value })}
        />
      </label>
      <div className="mb-2 grid grid-cols-2 gap-2">
        <label className="block text-sm">
          Ano
          <input
            type="number"
            min={1900}
            max={2100}
            placeholder="Ex.: 2018"
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
            value={draft.vehicleYear}
            onChange={(e) => onChange({ vehicleYear: e.target.value })}
          />
        </label>
        <label className="block text-sm">
          Cor
          <input
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
            value={draft.color}
            onChange={(e) => onChange({ color: e.target.value })}
          />
        </label>
      </div>
      <label className="mb-4 block text-sm">
        Problema apresentado
        <textarea
          rows={3}
          placeholder="Relato do cliente ou sintomas observados"
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
          value={draft.reportedIssue}
          onChange={(e) => onChange({ reportedIssue: e.target.value })}
        />
      </label>
    </>
  );
}
