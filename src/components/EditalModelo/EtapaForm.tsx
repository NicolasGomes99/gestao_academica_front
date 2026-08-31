"use client";
import React, { useState } from "react";
import { Controller, useFieldArray } from "react-hook-form";
import CampoPersonalizadoForm from "./CampoPersonalizadoForm";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import UnfoldLessIcon from "@mui/icons-material/UnfoldLess";
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";
import { CampoPersonalizado } from "@/types/editalTypes";

export type EtapaFormProps = {
  control: any;
  index: number;
  totalEtapas: number;
  onRemoveEtapa: (idx: number) => void;
  onMoveEtapa: (from: number, to: number) => void;
  onRemoveCampo?: (etapaIndex: number, campoIndex: number) => void;
  collapsed?: boolean;
  onToggleCollapse?: (idx: number) => void;
  isEditalMode?: boolean;

  onAddCampoEtapa?: (
    etapaIndex: number,
    campo: CampoPersonalizado,
  ) => Promise<number>;
};

const EtapaForm: React.FC<EtapaFormProps> = ({
  control,
  index,
  totalEtapas,
  onRemoveEtapa,
  onMoveEtapa,
  collapsed,
  onToggleCollapse,
  isEditalMode = false,
  onRemoveCampo,
  onAddCampoEtapa,
}) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `etapas.${index}.campos`,
  });
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const isCollapsed = collapsed ?? internalCollapsed;

  const toggle = () => {
    if (onToggleCollapse) {
      onToggleCollapse(index);
    } else {
      setInternalCollapsed((v) => !v);
    }
  };

  const handleRemoveCampo = (campoIndex: number) => {
    if (onRemoveCampo) {
      onRemoveCampo(index, campoIndex);
    }
    remove(campoIndex);
  };

  return (
    <div className="px-4 py-4 mb-4 bg-white shadow rounded-lg">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggle}
            className="p-1"
            aria-label={isCollapsed ? "Expandir etapa" : "Colapsar etapa"}
            title={isCollapsed ? "Expandir etapa" : "Colapsar etapa"}
          >
            {isCollapsed ? (
              <UnfoldMoreIcon fontSize="small" />
            ) : (
              <UnfoldLessIcon fontSize="small" />
            )}
          </button>
          <h3 className="text-lg font-semibold">Etapa {index + 1}</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onMoveEtapa(index, index - 1)}
            disabled={index === 0}
            className="p-1 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Subir etapa"
          >
            <KeyboardArrowUpIcon fontSize="small" />
          </button>
          <button
            type="button"
            onClick={() => onMoveEtapa(index, index + 1)}
            disabled={index >= totalEtapas - 1}
            className="p-1 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Descer etapa"
          >
            <KeyboardArrowDownIcon fontSize="small" />
          </button>
          <button
            type="button"
            onClick={() => onRemoveEtapa(index)}
            className="text-red-600 hover:text-red-800 font-semibold ml-4"
          >
            Remover Etapa
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Controller
              name={`etapas.${index}.nome`}
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  placeholder="Nome da Etapa"
                  className="border p-2 rounded-md w-full"
                />
              )}
            />
            <Controller
              name={`etapas.${index}.descricao`}
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  placeholder="Descrição da Etapa"
                  className="border p-2 rounded-md w-full"
                />
              )}
            />
            {isEditalMode && (
              <>
                <Controller
                  name={`etapas.${index}.dataInicio`}
                  control={control}
                  render={({ field }) => (
                    <input
                      type="datetime-local"
                      {...field}
                      className="border p-2 rounded-md w-full"
                    />
                  )}
                />
                <Controller
                  name={`etapas.${index}.dataFim`}
                  control={control}
                  render={({ field }) => (
                    <input
                      type="datetime-local"
                      {...field}
                      className="border p-2 rounded-md w-full"
                    />
                  )}
                />
              </>
            )}
            <div className="flex items-center gap-2">
              <Controller
                name={`etapas.${index}.obrigatoria`}
                control={control}
                render={({ field }) => (
                  <input
                    type="checkbox"
                    checked={!!field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    className="h-5 w-5"
                  />
                )}
              />
              <label>Obrigatória</label>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2 text-gray-700">
              Campos da Etapa
            </h4>
            {fields.map((item, k) => (
              <CampoPersonalizadoForm
                key={item.id}
                control={control}
                pathPrefix={`etapas.${index}.campos`}
                index={k}
                onRemove={handleRemoveCampo}
              />
            ))}
            <button
              type="button"
              onClick={async () => {
                const novoCampo: CampoPersonalizado = {
                  titulo: "",
                  obrigatorio: true,
                  tipoCampo: "TEXTO_CURTO",
                  configuracoes: "",
                };

                if (onAddCampoEtapa) {
                  const id = await onAddCampoEtapa(index, novoCampo);

                  append({
                    ...novoCampo,
                    id,
                  });
                } else {
                  append(novoCampo);
                }
              }}
              className="bg-green-500 text-white px-3 py-1 rounded-md text-sm hover:bg-green-600"
            >
              + Adicionar Campo à Etapa
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default EtapaForm;
