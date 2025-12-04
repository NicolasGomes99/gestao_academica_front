"use client";
import React, { useEffect, useMemo, useState } from "react";

// === Utilidades que você já usava ===
import aplicarMascara from "@/utils/mascaras";

import { Campo } from "./campoTypes";
import { getNestedValue, setNestedValue, updateNestedField, asArray, normalizarLinhas, findCampoByChave, getColSpanValue, flattenCampos } from "./utilsCampo";
import RenderCampo from "./RenderCampo";
import { useAuthService } from "@/app/authentication/auth.hook";

const Cadastro = ({
  estrutura = null,
  dadosPreenchidos = null,
  setDadosPreenchidos = null,
  chamarFuncao = null,
}: any) => {
  const [expandedDocUrl, setExpandedDocUrl] = useState<string | null>(null);
  const [expandedDocType, setExpandedDocType] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const auth = useAuthService();

  // Responsividade
  const [isMobile, setIsMobile] = useState<boolean>(false);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Inicialização dos multi-selects e foto
  useEffect(() => {
    if (estrutura?.cadastro?.campos && !dadosPreenchidos?._initialized) {
      const flat = flattenCampos(estrutura.cadastro.campos);
      const updates: Record<string, any> = {};

      // Processar multi-selects
      flat.forEach((campo: Campo) => {
        if (campo.tipo === "multi-select" || campo.tipo === "multi-select2") {
          const curr = getNestedValue(dadosPreenchidos, campo.chave);
          if (!Array.isArray(curr)) updates[campo.chave] = [];
          if (campo.allSelect && campo.selectOptions?.length) {
            updates[campo.chave] = campo.selectOptions.map((o) => o.chave.toString());
          }
        }

        // Processar foto
        if (campo.tipo === "foto") {
          const valor = getNestedValue(dadosPreenchidos, campo.chave);
          if (valor && typeof valor === "string" && valor !== photoPreview) {
            setPhotoPreview(valor);
          }
        }
      });

      if (Object.keys(updates).length > 0) {
        updates._initialized = true;
        setDadosPreenchidos((prev: any) => ({ ...prev, ...updates }));
      }
    }
  }, [dadosPreenchidos, estrutura, photoPreview]);

  // Função para determinar o perfil atual de forma robusta
  const getPerfilAtual = useMemo(() => {
    // Detecta se estamos na página de solicitações (modo criação)
    const isSolicitacaoPage = estrutura?.uri === "solicitacao";
    const isCreateMode = !dadosPreenchidos?.id; // Se não tem ID, está criando

    // Na página de solicitações em modo de criação, só usar o valor selecionado pelo usuário
    if (isSolicitacaoPage && isCreateMode) {
      const perfilSelecionado = dadosPreenchidos?.tipoUsuario || dadosPreenchidos?.perfilSolicitado || "";
      return perfilSelecionado.toString().toUpperCase();
    }

    // Para outras páginas ou modo de edição, usar a lógica completa
    let perfil = dadosPreenchidos?.perfilSolicitado ||
      dadosPreenchidos?.tipoUsuario ||
      dadosPreenchidos?.perfil?.tipo ||
      "";

    // Se não encontrou nos dados, tenta pegar do contexto de auth
    if (!perfil && auth) {
      try {
        // Tenta os métodos específicos primeiro (mais seguro)
        if (auth.isAdmin && typeof auth.isAdmin === 'function' && auth.isAdmin()) {
          perfil = "ADMINISTRADOR";
        } else if (auth.isGestor && typeof auth.isGestor === 'function' && auth.isGestor()) {
          perfil = "GESTOR";
        } else if (auth.isProfessor && typeof auth.isProfessor === 'function' && auth.isProfessor()) {
          perfil = "PROFESSOR";
        } else if (auth.isTecnico && typeof auth.isTecnico === 'function' && auth.isTecnico()) {
          perfil = "TECNICO";
        } else if (auth.isAluno && typeof auth.isAluno === 'function' && auth.isAluno()) {
          perfil = "ALUNO";
        }

        // Se ainda não encontrou, tenta acessar roles (com proteção)
        if (!perfil && auth && "roles" in auth && auth.roles) {
          if (typeof (auth as any).roles === "function") {
            try {
              const rolesResult = (auth as any).roles();
              perfil = Array.isArray(rolesResult) ? rolesResult[0] || "" : rolesResult || "";
            } catch (err) {
              console.warn("Erro ao executar auth.roles():", err);
              perfil = "";
            }
          } else if (typeof auth.roles === "string") {
            perfil = auth.roles;
          } else if (Array.isArray(auth.roles) && auth.roles.length > 0) {
            perfil = auth.roles[0] || "";
          } else if (typeof auth.roles === "object" && auth.roles !== null) {
            perfil = String(auth.roles);
          }
        }
      } catch (error) {
        console.warn('Erro ao acessar informações de auth:', error);
        perfil = "";
      }
    }

    return perfil ? perfil.toString().toUpperCase() : "";
  }, [dadosPreenchidos, auth, estrutura]);

  // ======= Handlers genéricos =======
  const alterarInput = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> | { target: { name: string; value: any } }
  ) => {
    const { name, value } = (event as any).target;
    const campoMeta: Campo | undefined = findCampoByChave(estrutura?.cadastro?.campos, name);
    let finalValue: any = value;

    if (campoMeta?.tipo === 'select' && campoMeta.selectOptions?.some(o => typeof o.chave === 'boolean')) {
      if (value === 'true') finalValue = true;
      else if (value === 'false') finalValue = false;
      else finalValue = value;
    }

    const masked = campoMeta?.mascara ? aplicarMascara(finalValue, campoMeta.mascara) : finalValue;
    setDadosPreenchidos((prev: any) => updateNestedField(prev ?? {}, name, masked));
  };

  const alterarRatio = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    const ratioValue = value !== "" ? parseFloat(value) / 100 : null;
    setDadosPreenchidos((prev: any) => updateNestedField(prev ?? {}, name, ratioValue));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    chamarFuncao?.("salvar", dadosPreenchidos);
  };

  const linhasNormalizadas = useMemo(() => normalizarLinhas(estrutura?.cadastro?.campos), [estrutura]);

  // Função melhorada para verificar se um campo deve ser exibido
  const deveMostrarCampo = (campo: Campo): boolean => {
    if (campo.oculto) return false;

    if (campo.exibirPara && Array.isArray(campo.exibirPara)) {
      const perfilAtual = getPerfilAtual?.toUpperCase() || "";
      const perfisPermitidos = campo.exibirPara.map(p => p.toUpperCase());

      console.log("=== DEBUG EXIBIÇÃO ===");
      console.log("Campo:", campo.nome);
      console.log("Perfil Atual:", perfilAtual);
      console.log("Perfis Permitidos:", perfisPermitidos);
      console.log("Deve Exibir:", perfisPermitidos.includes(perfilAtual));
      console.log("==================");

      return perfilAtual !== "" && perfisPermitidos.includes(perfilAtual);
    }

    return true;
  };

  return (
    <div className="rounded-md p-6">
      <form onSubmit={handleSubmit} className="w-full">
        {/* ID oculto */}
        <input type="hidden" name="id" value={dadosPreenchidos?.id || ""} />

        {linhasNormalizadas.map((linha, idxLinha) => {
          // Filtra campos com a função melhorada
          const camposFiltrados = linha.filter(deveMostrarCampo);

          if (camposFiltrados.length === 0) return null;

          const totalCols = isMobile
            ? 1
            : camposFiltrados.reduce((acc, c) => acc + getColSpanValue(c), 0);
          const gridColumns = isMobile
            ? "repeat(1, minmax(0, 1fr))"
            : `repeat(${totalCols}, minmax(0, 1fr))`;

          return (
            <div
              key={idxLinha}
              className="grid gap-4 mb-6"
              style={{ gridTemplateColumns: gridColumns }}
            >
              {camposFiltrados.map((campo: Campo, idx) => (
                <RenderCampo
                  key={idx}
                  campo={campo}
                  dados={dadosPreenchidos}
                  setDados={setDadosPreenchidos}
                  perfilAtual={getPerfilAtual}
                  isMobile={isMobile}
                  photoPreview={photoPreview}
                  setPhotoPreview={setPhotoPreview}
                  expandedDocUrl={expandedDocUrl}
                  setExpandedDocUrl={setExpandedDocUrl}
                  expandedDocType={expandedDocType}
                  setExpandedDocType={setExpandedDocType}
                  alterarInput={alterarInput}
                  alterarRatio={alterarRatio}
                  onClickFuncao={() => chamarFuncao(campo?.funcao)}
                />
              ))}
            </div>
          );
        })}

        {/* Ações */}
        <div className="flex justify-end mt-4 gap-2">
          {estrutura?.cadastro?.acoes?.map((botao: any, index: number) => {
            const isSubmit = botao.tipo === "submit";
            return (
              <button
                key={index}
                type="button"
                name={botao.chave}
                className={
                  isSubmit
                    ? "bg-extra-150 hover:bg-extra-50 text-white px-4 py-2 rounded text-body-medium"
                    : "bg-extra-100 hover:bg-gray-600 text-white px-4 py-2 rounded text-body-medium"
                }
                onClick={() => chamarFuncao?.(botao.chave, dadosPreenchidos)}
              >
                {botao.nome}
              </button>
            );
          })}
        </div>
      </form>
    </div>
  );
};

export default Cadastro;