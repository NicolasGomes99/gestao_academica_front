"use client";
/**
 * Caminho sugerido dentro do projeto: app/auth/tipo-edital/[id]/page.tsx
 *
 * Página de cadastro de "Tipo de Edital", seguindo o mesmo padrão da página de
 * cadastro de Etnia enviada como referência (withAuthorization, Cabecalho,
 * toast + Swal para feedback, tratamento de erro por status HTTP, etc.).
 *
 * Diferença principal: o cadastro de um Tipo de Edital não é um formulário
 * "flat" com um único POST/PATCH final. Ele é composto por várias chamadas
 * separadas, na ordem definida pelo backend:
 *
 *   1) POST  {{editais_url}}/modelo                          -> cria o modelo (obtém o ID)
 *   2) POST  {{editais_url}}/modelo/:id/campos                -> "Adicionar Campo" (campo geral)
 *   3) POST  {{editais_url}}/modelo/:id/etapas                -> "Adicionar Etapa"
 *   4) POST  {{editais_url}}/modelo/:id/etapas/:etapaId/campos-> "Adicionar Campo" (dentro de uma etapa)
 *   5) POST  {{editais_url}}/modelo/:id/finalizar              -> "Finalizar Cadastro"
 *
 * Cada uma dessas chamadas é disparada no momento em que o respectivo botão é
 * confirmado (e não no submit final da página), exatamente como pedido.
 *
 * OBS. IMPORTANTE: a coleção enviada não incluiu nenhum endpoint de
 * consulta/edição (GET) de um modelo já existente. Por isso, esta página
 * implementa apenas o fluxo de CRIAÇÃO. Se a rota for acessada com um :id
 * diferente de "criar", o usuário é avisado e redirecionado — para não
 * inventar um contrato de API que não foi fornecido.
 *
 * OBS. IMPORTANTE 2: o valor "{{editais_url}}" da coleção Postman é a base do
 * serviço de editais. Ajuste a constante EDITAIS_URI abaixo para bater com o
 * prefixo de rota real usado por `generica()` no seu gateway (aqui assumi
 * "/editais", no mesmo padrão em que a página de Etnia usava "/auth").
 */
import withAuthorization from "@/components/AuthProvider/withAuthorization";
import Cabecalho from "@/components/Layout/Interno/Cabecalho";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { generica } from "@/utils/api";

// ------------------------------------------------------------------
// Ajuste este prefixo conforme a configuração de rotas do seu gateway.
// Equivale à variável {{editais_url}} da coleção Postman enviada.
// ------------------------------------------------------------------
const EDITAIS_URI = "/editais";

// ------------------------------------------------------------------
// Tipos
// ------------------------------------------------------------------
type TipoCampo =
  | "TEXTO_CURTO"
  | "TEXTO_LONGO"
  | "NUMERO"
  | "DATA"
  | "ARQUIVO"
  | "SELECT"
  | "CHECKBOX"
  | "EMAIL";

const TIPOS_CAMPO: { chave: TipoCampo; valor: string }[] = [
  { chave: "TEXTO_CURTO", valor: "Texto Curto" },
  { chave: "TEXTO_LONGO", valor: "Texto Longo" },
  { chave: "NUMERO", valor: "Número" },
  { chave: "DATA", valor: "Data" },
  { chave: "ARQUIVO", valor: "Arquivo" },
  { chave: "SELECT", valor: "Seleção (Select)" },
  { chave: "CHECKBOX", valor: "Caixa de Seleção" },
  { chave: "EMAIL", valor: "E-mail" },
];

const tipoCampoLabel = (tipo: TipoCampo) =>
  TIPOS_CAMPO.find((t) => t.chave === tipo)?.valor || tipo;

interface CampoModelo {
  id?: number;
  titulo: string;
  tipoCampo: TipoCampo;
  obrigatorio: boolean;
}

interface EtapaModelo {
  id?: number;
  nome: string;
  descricao: string;
  ordem: number; 
  campos: CampoModelo[];
}

interface ModeloEdital {
  nome: string;
  descricao: string;
  moduloOrigem: string;
}

const CAMPO_VAZIO: CampoModelo = {
  titulo: "",
  tipoCampo: "TEXTO_CURTO",
  obrigatorio: false,
};

const ETAPA_VAZIA = {
  nome: "",
  descricao: "",
  ordem: 1,
};

const CampoFormFields = ({
  campo,
  setCampo,
}: {
  campo: CampoModelo;
  setCampo: (c: CampoModelo) => void;
}) => {
  const inputClass =
    "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#972E3F] disabled:bg-gray-100 disabled:text-gray-500";

  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="md:col-span-1">
        <label className={labelClass}>Título do Campo *</label>

        <input
          type="text"
          className={inputClass}
          placeholder="Ex: Qual a sua renda familiar per capita?"
          value={campo.titulo}
          onChange={(e) =>
            setCampo({
              ...campo,
              titulo: e.target.value,
            })
          }
        />
      </div>

      <div className="md:col-span-1">
        <label className={labelClass}>Tipo do Campo *</label>

        <select
          className={inputClass}
          value={campo.tipoCampo}
          onChange={(e) =>
            setCampo({
              ...campo,
              tipoCampo: e.target.value as TipoCampo,
            })
          }
        >
          {TIPOS_CAMPO.map((t) => (
            <option key={t.chave} value={t.chave}>
              {t.valor}
            </option>
          ))}
        </select>
      </div>

      <div className="md:col-span-2 flex items-center gap-2">
        <input
          id={`obrigatorio-${campo.titulo}`}
          type="checkbox"
          checked={campo.obrigatorio}
          onChange={(e) =>
            setCampo({
              ...campo,
              obrigatorio: e.target.checked,
            })
          }
        />

        <label
          htmlFor={`obrigatorio-${campo.titulo}`}
          className="text-sm text-gray-700"
        >
          Campo obrigatório
        </label>
      </div>
    </div>
  );
};

const cadastroTipoEdital = () => {
  const router = useRouter();
  const { id } = useParams();
  const isEditMode = id && id !== "criar";

  // Modelo (edital base)
  const [modelo, setModelo] = useState<ModeloEdital>({
    nome: "",
    descricao: "",
    moduloOrigem: "",
  });
  const [modeloId, setModeloId] = useState<number | null>(null);
  const [modeloCriado, setModeloCriado] = useState(false);
  const [isSubmittingModelo, setIsSubmittingModelo] = useState(false);

  // Campos gerais do modelo
  const [camposGerais, setCamposGerais] = useState<CampoModelo[]>([]);
  const [mostrarFormCampo, setMostrarFormCampo] = useState(false);
  const [novoCampo, setNovoCampo] = useState<CampoModelo>({ ...CAMPO_VAZIO });
  const [salvandoCampo, setSalvandoCampo] = useState(false);

  // Etapas do modelo
  const [etapas, setEtapas] = useState<EtapaModelo[]>([]);
  const [mostrarFormEtapa, setMostrarFormEtapa] = useState(false);
  const [novaEtapa, setNovaEtapa] = useState({ ...ETAPA_VAZIA });
  const [salvandoEtapa, setSalvandoEtapa] = useState(false);

  // Campo dentro de uma etapa específica
  const [etapaFormAberta, setEtapaFormAberta] = useState<number | null>(null);
  const [novoCampoEtapa, setNovoCampoEtapa] = useState<CampoModelo>({ ...CAMPO_VAZIO });
  const [salvandoCampoEtapa, setSalvandoCampoEtapa] = useState(false);

  // Finalização
  const [isFinalizando, setIsFinalizando] = useState(false);

  const estrutura = {
    cabecalho: {
      titulo: "Cadastrar Tipo de Edital",
      migalha: [
        { nome: "Home", link: "/home" },
        { nome: "Gestão de Editais", link: "/gestao-editais" },
        { nome: "Tipo de Edital", link: "/gestao-editais/tipo-edital" },
        { nome: "Criar", link: "/auth/tipo-edital/criar" },
      ],
    },
  };

  // ------------------------------------------------------------------
  // Helper genérico de chamada à API, seguindo o mesmo tratamento de
  // erros (conexão, status HTTP, response.data.errors, response.data.error,
  // catch) usado na página de referência — só que centralizado, já que
  // aqui existem várias chamadas diferentes.
  // ------------------------------------------------------------------
  const mensagemErroPorStatus = (status: number, contexto: string) => {
    switch (status) {
      case 400:
        return "Dados inválidos enviados ao servidor.";
      case 401:
        return "Sessão expirada. Faça login novamente.";
      case 403:
        return "Você não tem permissão para realizar esta ação.";
      case 404:
        return "Recurso não encontrado.";
      case 409:
        return `Já existe um registro conflitante ao ${contexto}.`;
      case 422:
        return "Dados inválidos. Verifique as informações enviadas.";
      case 500:
        return "Erro interno do servidor. Tente novamente em alguns minutos.";
      default:
        return `Erro HTTP ${status} ao ${contexto}.`;
    }
  };

  const chamarApi = async (
    body: { metodo: string; uri: string; params?: any; data?: any },
    contexto: string
  ): Promise<{ data: any } | null> => {
    try {
      const response = await generica(body);

      if (!response) {
        toast.error(
          `Erro de conexão ao ${contexto}. Verifique sua internet e tente novamente.`,
          { position: "top-left", autoClose: 5000, toastId: `conexao-${contexto}` }
        );
        return null;
      }

      if (response.status < 200 || response.status >= 300) {
        toast.error(mensagemErroPorStatus(response.status, contexto), {
          position: "top-left",
          autoClose: 7000,
          toastId: `http-error-${contexto}-${response.status}`,
        });
        return null;
      }

      if (response.data?.errors) {
        Object.keys(response.data.errors).forEach((campoErro) => {
          toast.error(`Erro em ${campoErro}: ${response.data.errors[campoErro]}`, {
            position: "top-left",
            autoClose: 5000,
            toastId: `campo-error-${contexto}-${campoErro}`,
          });
        });
        return null;
      }

      if (response.data?.error) {
        toast.error(response.data.error.message, {
          position: "top-left",
          autoClose: 5000,
          toastId: `erro-response-${contexto}`,
        });
        return null;
      }

      return { data: response.data };
    } catch (error: any) {
      console.error(`DEBUG: Erro ao ${contexto}:`, error);

      let mensagemErro = `Erro ao ${contexto}. Tente novamente!`;
      if (error.response?.data?.message) {
        mensagemErro = error.response.data.message;
      } else if (error.response?.data?.error) {
        mensagemErro = error.response.data.error;
      } else if (error.message) {
        mensagemErro = `Erro de conexão: ${error.message}`;
      }

      toast.error(mensagemErro, {
        position: "top-left",
        autoClose: 7000,
        toastId: `catch-error-${contexto}`,
      });
      return null;
    }
  };

  // ------------------------------------------------------------------
  // Validações
  // ------------------------------------------------------------------
  const validarModelo = () => {
    toast.dismiss();

    if (!modelo.nome || modelo.nome.trim() === "") {
      toast.error("O campo 'Nome' é obrigatório.", {
        position: "top-left",
        autoClose: 5000,
        toastId: "modelo-nome-obrigatorio",
      });
      return false;
    }
    if (modelo.nome.trim().length < 3) {
      toast.error("O nome do modelo deve ter pelo menos 3 caracteres.", {
        position: "top-left",
        autoClose: 5000,
        toastId: "modelo-nome-curto",
      });
      return false;
    }
    if (!modelo.descricao || modelo.descricao.trim() === "") {
      toast.error("O campo 'Descrição' é obrigatório.", {
        position: "top-left",
        autoClose: 5000,
        toastId: "modelo-descricao-obrigatoria",
      });
      return false;
    }
    if (!modelo.moduloOrigem || modelo.moduloOrigem.trim() === "") {
      toast.error("O campo 'Módulo de Origem' é obrigatório.", {
        position: "top-left",
        autoClose: 5000,
        toastId: "modelo-modulo-obrigatorio",
      });
      return false;
    }
    return true;
  };

  const validarCampo = (campo: CampoModelo) => {
    toast.dismiss();

    if (!campo.titulo || campo.titulo.trim() === "") {
      toast.error("O título do campo é obrigatório.", {
        position: "top-left",
        autoClose: 5000,
        toastId: "campo-titulo-obrigatorio",
      });
      return false;
    }
    if (campo.titulo.trim().length < 3) {
      toast.error("O título do campo deve ter pelo menos 3 caracteres.", {
        position: "top-left",
        autoClose: 5000,
        toastId: "campo-titulo-curto",
      });
      return false;
    }
    if (!campo.tipoCampo) {
      toast.error("Selecione o tipo do campo.", {
        position: "top-left",
        autoClose: 5000,
        toastId: "campo-tipo-obrigatorio",
      });
      return false;
    }

    return true;
  };

  const validarEtapa = (etapa: typeof ETAPA_VAZIA) => {
    toast.dismiss();

    if (!etapa.nome || etapa.nome.trim() === "") {
      toast.error("O nome da etapa é obrigatório.", {
        position: "top-left",
        autoClose: 5000,
        toastId: "etapa-nome-obrigatorio",
      });
      return false;
    }
    if (!etapa.descricao || etapa.descricao.trim() === "") {
      toast.error("A descrição da etapa é obrigatória.", {
        position: "top-left",
        autoClose: 5000,
        toastId: "etapa-descricao-obrigatoria",
      });
      return false;
    }
    if (!etapa.ordem || Number(etapa.ordem) <= 0) {
      toast.error("A ordem da etapa deve ser um número maior que zero.", {
        position: "top-left",
        autoClose: 5000,
        toastId: "etapa-ordem-invalida",
      });
      return false;
    }
    return true;
  };

  // ------------------------------------------------------------------
  // Ações — cada uma corresponde a um botão da tela e dispara sua
  // própria requisição, na ordem exigida pelo backend.
  // ------------------------------------------------------------------

  // 1) POST {{editais_url}}/modelo
  const salvarModelo = async () => {
    if (!validarModelo()) return;
    if (isSubmittingModelo) return;

    setIsSubmittingModelo(true);
    const body = {
      metodo: "post",
      uri: `${EDITAIS_URI}/modelo`,
      params: {},
      data: {
        nome: modelo.nome.trim(),
        descricao: modelo.descricao.trim(),
        moduloOrigem: modelo.moduloOrigem.trim(),
      },
    };
    const resultado = await chamarApi(body, "criar o modelo de edital");
    setIsSubmittingModelo(false);

    if (resultado) {
      setModeloId(resultado.data.id);
      setModeloCriado(true);
      toast.success(
        "Modelo criado com sucesso! Agora adicione os campos gerais e as etapas.",
        { position: "top-left", autoClose: 5000, toastId: "modelo-criado" }
      );
    }
  };

  // 2) POST {{editais_url}}/modelo/:id/campos  -> botão "Adicionar Campo" (geral)
  const adicionarCampoGeral = async () => {
    if (!modeloId) {
      toast.error("Crie o modelo antes de adicionar campos.", {
        position: "top-left",
        autoClose: 5000,
        toastId: "modelo-nao-criado-campo",
      });
      return;
    }
    if (!validarCampo(novoCampo)) return;
    if (salvandoCampo) return;

    setSalvandoCampo(true);
    const body = {
      metodo: "post",
      uri: `${EDITAIS_URI}/modelo/${modeloId}/campos`,
      params: {},
      data: {
        titulo: novoCampo.titulo.trim(),
        tipoCampo: novoCampo.tipoCampo,
        obrigatorio: novoCampo.obrigatorio,
      },
    };
    const resultado = await chamarApi(body, "adicionar campo ao modelo");
    setSalvandoCampo(false);

    if (resultado) {
      setCamposGerais((prev) => [...prev, { ...novoCampo, id: resultado.data.id }]);
      setNovoCampo({ ...CAMPO_VAZIO });
      setMostrarFormCampo(false);
      toast.success("Campo adicionado com sucesso!", {
        position: "top-left",
        autoClose: 3000,
        toastId: "campo-geral-adicionado",
      });
    }
  };

  // 3) POST {{editais_url}}/modelo/:id/etapas  -> botão "Adicionar Etapa"
  const adicionarEtapa = async () => {
    if (!modeloId) {
      toast.error("Crie o modelo antes de adicionar etapas.", {
        position: "top-left",
        autoClose: 5000,
        toastId: "modelo-nao-criado-etapa",
      });
      return;
    }
    if (!validarEtapa(novaEtapa)) return;
    if (salvandoEtapa) return;

    setSalvandoEtapa(true);
    const body = {
      metodo: "post",
      uri: `${EDITAIS_URI}/modelo/${modeloId}/etapas`,
      params: {},
      data: {
        nome: novaEtapa.nome.trim(),
        descricao: novaEtapa.descricao.trim(),
        ordem: Number(novaEtapa.ordem),
      },
    };
    const resultado = await chamarApi(body, "adicionar etapa ao modelo");
    setSalvandoEtapa(false);

    if (resultado) {
      setEtapas((prev) => [
        ...prev,
        {
          ...novaEtapa,
          ordem: Number(novaEtapa.ordem),
          id: resultado.data.id,
          campos: [],
        },
      ]);
      setNovaEtapa({ ...ETAPA_VAZIA, ordem: etapas.length + 2 });
      setMostrarFormEtapa(false);
      toast.success("Etapa adicionada com sucesso!", {
        position: "top-left",
        autoClose: 3000,
        toastId: "etapa-adicionada",
      });
    }
  };

  // 4) POST {{editais_url}}/modelo/:id/etapas/:etapaId/campos -> botão "Adicionar Campo" (dentro da etapa)
  const adicionarCampoEtapa = async (etapaId: number) => {
    if (!modeloId) return;
    if (!validarCampo(novoCampoEtapa)) return;
    if (salvandoCampoEtapa) return;

    setSalvandoCampoEtapa(true);
    const body = {
      metodo: "post",
      uri: `${EDITAIS_URI}/modelo/${modeloId}/etapas/${etapaId}/campos`,
      params: {},
      data: {
        titulo: novoCampoEtapa.titulo.trim(),
        tipoCampo: novoCampoEtapa.tipoCampo,
        obrigatorio: novoCampoEtapa.obrigatorio,
      },
    };
    const resultado = await chamarApi(body, "adicionar campo à etapa");
    setSalvandoCampoEtapa(false);

    if (resultado) {
      setEtapas((prev) =>
        prev.map((etapa) =>
          etapa.id === etapaId
            ? { ...etapa, campos: [...etapa.campos, { ...novoCampoEtapa, id: resultado.data.id }] }
            : etapa
        )
      );
      setNovoCampoEtapa({ ...CAMPO_VAZIO });
      setEtapaFormAberta(null);
      toast.success("Campo adicionado à etapa com sucesso!", {
        position: "top-left",
        autoClose: 3000,
        toastId: "campo-etapa-adicionado",
      });
    }
  };

  // 5) POST {{editais_url}}/modelo/:id/finalizar -> botão "Finalizar Cadastro"
  const finalizarCadastro = async () => {
    toast.dismiss();

    if (!modeloId) {
      toast.error("Crie o modelo antes de finalizar o cadastro.", {
        position: "top-left",
        autoClose: 5000,
        toastId: "modelo-nao-criado-finalizar",
      });
      return;
    }
    if (etapas.length === 0) {
      toast.error("Adicione ao menos uma etapa antes de finalizar o cadastro.", {
        position: "top-left",
        autoClose: 5000,
        toastId: "sem-etapas-finalizar",
      });
      return;
    }
    if (isFinalizando) return;

    setIsFinalizando(true);
    const body = {
      metodo: "patch",
      uri: `${EDITAIS_URI}/modelo/${modeloId}/finalizar`,
      params: {},
      data: {},
    };
    const resultado = await chamarApi(body, "finalizar o cadastro do modelo");
    setIsFinalizando(false);

    if (resultado) {
      await Swal.fire({
        title: "Tipo de edital cadastrado com sucesso!",
        icon: "success",
        confirmButtonText: "OK",
        confirmButtonColor: "#972E3F",
        customClass: {
          popup: "my-swal-popup",
          title: "my-swal-title",
          htmlContainer: "my-swal-html",
        },
        timer: 3000,
        timerProgressBar: true,
        willClose: () => {
          toast.dismiss();
          router.push("/gestao-edital/tipo-edital");
        },
      });
    }
  };

  // ------------------------------------------------------------------
  // Guarda de rota: não há endpoint de consulta/edição fornecido.
  // ------------------------------------------------------------------
  useEffect(() => {
    toast.dismiss();
    if (isEditMode) {
      toast.error("A edição de tipos de edital ainda não é suportada por esta tela.", {
        position: "top-left",
        autoClose: 5000,
        toastId: "edicao-nao-suportada",
      });
      router.push("/gestao-editais/tipo-edital");
    }
  }, [id]);

  const inputClass =
    "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#972E3F] disabled:bg-gray-100 disabled:text-gray-500";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";
  const btnPrimary =
    "bg-[#972E3F] text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-[#7a2533] disabled:opacity-50 disabled:cursor-not-allowed transition-colors";
  const btnSecondary =
    "border border-gray-300 text-gray-700 text-sm font-medium px-4 py-2 rounded-md hover:bg-gray-50 transition-colors";

  return (
    <main className="flex flex-wrap justify-center mx-auto">
      <div className="w-full md:w-11/12 lg:w-10/12 2xl:w-3/4 max-w-6xl p-4 pt-10 md:pt-12 md:pb-12">
        <Cabecalho dados={estrutura.cabecalho} />

        {/* Bloco 1: dados do modelo */}
        <section className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Dados do Tipo de Edital</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Nome *</label>
              <input
                type="text"
                className={inputClass}
                placeholder="Ex: Edital de Assistência Estudantil 2026"
                value={modelo.nome}
                disabled={modeloCriado}
                onChange={(e) => setModelo({ ...modelo, nome: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass}>Módulo de Origem *</label>
              <input
                type="text"
                className={inputClass}
                placeholder="Ex: sgu-prae"
                value={modelo.moduloOrigem}
                disabled={modeloCriado}
                onChange={(e) => setModelo({ ...modelo, moduloOrigem: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Descrição *</label>
              <textarea
                className={inputClass}
                rows={2}
                placeholder="Ex: Modelo base para auxílios da PRAE"
                value={modelo.descricao}
                disabled={modeloCriado}
                onChange={(e) => setModelo({ ...modelo, descricao: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end mt-4">
            {!modeloCriado ? (
              <button className={btnPrimary} onClick={salvarModelo} disabled={isSubmittingModelo}>
                {isSubmittingModelo ? "Salvando..." : "Salvar Modelo"}
              </button>
            ) : (
              <span className="text-green-700 text-sm font-medium">
                ✓ Modelo criado
              </span>
            )}
          </div>
        </section>

        {/* Bloco 2: campos gerais */}
        <section
          className={`bg-white rounded-lg shadow p-6 mb-6 ${
            !modeloCriado ? "opacity-50 pointer-events-none" : ""
          }`}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Campos Gerais</h2>
            <button className={btnSecondary} onClick={() => setMostrarFormCampo(true)}>
              + Adicionar Campo
            </button>
          </div>

          {camposGerais.length === 0 && (
            <p className="text-gray-500 text-sm">Nenhum campo geral adicionado.</p>
          )}

          {camposGerais.length > 0 && (
            <ul className="space-y-1 mb-2">
              {camposGerais.map((c) => (
                <li key={c.id} className="text-sm text-gray-700 border-b border-gray-100 py-1">
                  <span className="font-medium">{c.titulo}</span> — {tipoCampoLabel(c.tipoCampo)}
                  {c.obrigatorio && <span className="text-[#972E3F]"> (obrigatório)</span>}
                </li>
              ))}
            </ul>
          )}

          {mostrarFormCampo && (
            <div className="border rounded-md p-4 mt-4 bg-gray-50">
              <CampoFormFields campo={novoCampo} setCampo={setNovoCampo} />
              <div className="flex gap-2 justify-end mt-3">
                <button
                  className={btnSecondary}
                  onClick={() => {
                    setMostrarFormCampo(false);
                    setNovoCampo({ ...CAMPO_VAZIO });
                  }}
                >
                  Cancelar
                </button>
                <button className={btnPrimary} onClick={adicionarCampoGeral} disabled={salvandoCampo}>
                  {salvandoCampo ? "Salvando..." : "Confirmar"}
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Bloco 3: etapas */}
        <section
          className={`bg-white rounded-lg shadow p-6 mb-6 ${
            !modeloCriado ? "opacity-50 pointer-events-none" : ""
          }`}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Etapas</h2>
            <button className={btnSecondary} onClick={() => setMostrarFormEtapa(true)}>
              + Adicionar Etapa
            </button>
          </div>

          {etapas.length === 0 && (
            <p className="text-gray-500 text-sm">Nenhuma etapa adicionada.</p>
          )}

          <div className="space-y-4">
            {etapas.map((etapa) => (
              <div key={etapa.id} className="border rounded-md p-4">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {etapa.ordem}. {etapa.nome}
                    </h3>
                    <p className="text-sm text-gray-600">{etapa.descricao}</p>
                  </div>
                  <button
                    className={btnSecondary}
                    onClick={() => setEtapaFormAberta(etapa.id ?? null)}
                  >
                    + Campo
                  </button>
                </div>

                {etapa.campos.length > 0 && (
                  <ul className="mt-3 pl-4 list-disc text-sm text-gray-700 space-y-1">
                    {etapa.campos.map((c) => (
                      <li key={c.id}>
                        {c.titulo} — {tipoCampoLabel(c.tipoCampo)}
                        {c.obrigatorio && <span className="text-[#972E3F]"> (obrigatório)</span>}
                      </li>
                    ))}
                  </ul>
                )}

                {etapaFormAberta === etapa.id && (
                  <div className="border rounded-md p-3 mt-3 bg-gray-50">
                    <CampoFormFields campo={novoCampoEtapa} setCampo={setNovoCampoEtapa} />
                    <div className="flex gap-2 justify-end mt-3">
                      <button
                        className={btnSecondary}
                        onClick={() => {
                          setEtapaFormAberta(null);
                          setNovoCampoEtapa({ ...CAMPO_VAZIO });
                        }}
                      >
                        Cancelar
                      </button>
                      <button
                        className={btnPrimary}
                        onClick={() => adicionarCampoEtapa(etapa.id as number)}
                        disabled={salvandoCampoEtapa}
                      >
                        {salvandoCampoEtapa ? "Salvando..." : "Confirmar"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {mostrarFormEtapa && (
            <div className="border rounded-md p-4 mt-4 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className={labelClass}>Nome da Etapa *</label>
                  <input
                    type="text"
                    className={inputClass}
                    placeholder="Ex: Fase 1 - Análise Documental"
                    value={novaEtapa.nome}
                    onChange={(e) => setNovaEtapa({ ...novaEtapa, nome: e.target.value })}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>Descrição *</label>
                  <textarea
                    className={inputClass}
                    rows={2}
                    placeholder="Ex: Fase eliminatória de checagem de documentos"
                    value={novaEtapa.descricao}
                    onChange={(e) => setNovaEtapa({ ...novaEtapa, descricao: e.target.value })}
                  />
                </div>
                <div>
                  <label className={labelClass}>Ordem *</label>
                  <input
                    type="number"
                    min={1}
                    className={inputClass}
                    value={novaEtapa.ordem}
                    onChange={(e) =>
                      setNovaEtapa({ ...novaEtapa, ordem: Number(e.target.value) })
                    }
                  />
                </div>
                <div />
              </div>
              <div className="flex gap-2 justify-end mt-3">
                <button
                  className={btnSecondary}
                  onClick={() => {
                    setMostrarFormEtapa(false);
                    setNovaEtapa({ ...ETAPA_VAZIA, ordem: etapas.length + 1 });
                  }}
                >
                  Cancelar
                </button>
                <button className={btnPrimary} onClick={adicionarEtapa} disabled={salvandoEtapa}>
                  {salvandoEtapa ? "Salvando..." : "Confirmar"}
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Ações finais */}
        <div className="flex justify-between mt-6">
          <button
            className={btnSecondary}
            onClick={() => {
              toast.dismiss();
              router.push("/gestao-editais/tipo-edital");
            }}
          >
            Cancelar
          </button>
          <button
            className={btnPrimary}
            onClick={finalizarCadastro}
            disabled={!modeloCriado || isFinalizando}
          >
            {isFinalizando ? "Finalizando..." : "Finalizar Cadastro"}
          </button>
        </div>
      </div>
    </main>
  );
};

export default withAuthorization(cadastroTipoEdital);