"use client";
import withAuthorization from "@/components/AuthProvider/withAuthorization";
import Cadastro from "@/components/Cadastro/Estrutura";
import Cabecalho from "@/components/Layout/Interno/Cabecalho";
import aplicarMascara from "@/utils/mascaras";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { generica } from "@/utils/api";
import TabelaEstudantes from "@/components/Tabela/Estudantes/TabelaEstudante";
import { set } from "zod";
import Tabela from "@/components/Tabela/Estrutura";
import { PagamentosBeneficio } from "@/types/pagamentoBeneficio.interface";
import { all } from "axios";
import Modal from "@/components/Modal/Modal"; // Adicione este import se tiver um componente Modal

const cadastro = () => {
  const router = useRouter();
  const { id } = useParams();
  const [dadosPreenchidos, setDadosPreenchidos] = useState<any>({});
  const [tipoBeneficioSelecionado, setTipoBeneficioSelecionado] = useState<any | null>(null);
  const [estudanteSelecionado, setEstudanteSelecionado] = useState<Object | null>(null);
  const [estudantes, setEstudantes] = useState<any>({ content: [] });
  const [tipoBeneficio, setTipoBeneficio] = useState<any[]>([]);
  const [pagamentosEfetuados, setPagamentosEfetuados] = useState<PagamentosBeneficio[]>([]);
  const [showCancelModal, setShowCancelModal] = useState(false); // Estado para controlar o modal de cancelamento
  const [cancelamentoData, setCancelamentoData] = useState({
    parecerTermino: "",
    motivoEncerramento: ""
  });
  const acoesEstudante: Array<Object> = [{ nome: "Selecionar", chave: "selecionarEstudante" }];

  const motivosEncerramentoOptions = [
    { chave: "CONCLUSAO_CURSO", valor: "Conclusão do curso" },
    { chave: "MIGRACAO_OUTRO_BENEFICIO", valor: "Migração para outro benefício" },
    { chave: "TRANCAMENTO_MATRICULA", valor: "Trancamento de matrícula" },
    { chave: "DESISTENCIA_CURSO", valor: "Desistência do curso" },
    { chave: "REPROVACAO_POR_FALTA", valor: "Reprovação por falta" },
    { chave: "RENDIMENTO_INSUFICIENTE", valor: "Rendimento insuficiente" },
    { chave: "OMISSAO_DADOS", valor: "Omissão de dados" },
    { chave: "OUTRO", valor: "Outro" },
  ];

  const isEditMode = id && id !== "criar";

  useEffect(() => {
    setTipoBeneficioSelecionado(
      dadosPreenchidos?.tipoBeneficioId
        ? tipoBeneficio?.filter((tipo) => tipo.id == dadosPreenchidos?.tipoBeneficioId)[0]
        : null
    );
  }, [dadosPreenchidos.tipoBeneficioId]);

  useEffect(() => {
    if (dadosPreenchidos.tipoBeneficioId) {
      let valor = tipoBeneficio?.filter((tipo) => tipo.id == dadosPreenchidos?.tipoBeneficioId)[0]?.valorBeneficio;
      setDadosPreenchidos((prev: any) => ({ ...prev, valorBeneficio: valor }));
    } else {
      setDadosPreenchidos((prev: any) => ({
        ...prev,
        valorBeneficio: undefined,
      }));
    }
  }, [dadosPreenchidos.tipoBeneficioId]);

  useEffect(() => {
    pesquisarTipoBeneficio();
    if (isEditMode) {
      chamarFuncao("editar", id);
    } else {
      chamarFuncao("pesquisar", null);
    }
  }, []);

  useEffect(() => {
    if (dadosPreenchidos.motivoEncerramento) {
      Swal.fire({
        icon: "warning",
        title: "Encerramento do benefício",
        text: "Ao definir um motivo de encerramento, o benefício será finalizado.",
        confirmButtonColor: "#972E3F",
      });
    }
  }, [dadosPreenchidos.motivoEncerramento]);

  const getOptions = (lista: any[], selecionado: any) => {
    if (!Array.isArray(lista)) return [];
    const options = lista.map((item) => ({
      chave: item.id,
      valor: item.nome || item.descricao || item.tipo || item.aluno.nome,
    }));
    return options;
  };

  const estrutura: any = {
    uri: "beneficio",
    cabecalho: {
      titulo: isEditMode ? "Editar Benefício" : "Registrar Benefício",
      migalha: [
        { nome: "Home", link: "/home" },
        { nome: "Prae", link: "/prae" },
        { nome: "Benefícios", link: "/prae/beneficio/beneficios" },
        {
          nome: isEditMode ? "Editar" : "Criar",
          link: `/prae/beneficio/beneficios/${isEditMode ? id : "criar"}`,
        },
      ],
    },
    cadastro: {
      campos: [
        {
          line: 1,
          colSpan: "md:col-span-3",
          nome: "Aluno",
          chave: "estudante",
          tipo: "text",
          bloqueado: true,
          visivel: estudanteSelecionado,
          obrigatorio: true,
        },
        {
          line: 1,
          colSpan: "md:col-span-1",
          nome: "Remover Estudante",
          tipo: "button",
          funcao: "desselecionarEstudante",
          visivel: !isEditMode && estudanteSelecionado, 
        },
        {
          chave: "estudanteId",
          tipo: "number",
          visivel: false,
        },
        {
          line: 2,
          colSpan: "md:col-span-1",
          nome: "Tipo do Benefício",
          chave: "tipoBeneficioId",
          tipo: "select",
          selectOptions: getOptions(
            tipoBeneficio,
            dadosPreenchidos?.tipoBeneficioId
          ),
          mensagem: "Selecione",
          obrigatorio: true,
          bloqueado: isEditMode,
        },
        {
          line: 2,
          colSpan: "md:col-span-1",
          nome: "Valor do Benefício",
          chave: "valorBeneficio",
          tipo: "money-brl",
          visivel: tipoBeneficioSelecionado !== null,
          obrigatorio: false,
          bloqueado: true,
          mode: "decimal",
        },
        {
          line: 3,
          colSpan: "md:col-span-1",
          nome: "Início do Benefício",
          chave: "inicioBeneficio",
          tipo: "date",
          mensagem: "Digite",
          obrigatorio: true,
        },
        {
          line: 3,
          colSpan: "md:col-span-1",
          nome: "Fim do Benefício",
          chave: "fimBeneficio",
          tipo: "date",
          mensagem: "Digite",
          obrigatorio: true,
        },
        {
          line: 4,
          colSpan: "md:col-span-1",
          nome: "Termo",
          chave: "documentos",
          tipo: "documento",
          mensagem: "Anexe o documento",
          obrigatorio: true,
          multiple: false,
          bloqueado: isEditMode,
        },
        {
          line: 1,
          colSpan: "md:col-span-1",
          nome: "Cancelar Benefício",
          tipo: "button",
          funcao: "abrirModalCancelamento",
          visivel: isEditMode,
        },
      ],
      acoes: [
        { nome: "Cancelar", chave: "voltar", tipo: "botao" },
        {
          nome: isEditMode ? "Salvar" : "Cadastrar",
          chave: "salvar",
          tipo: "submit",
        },
      ],
    },
    tabela: {
      configuracoes: {
        pesquisar: false,
        cabecalho: true,
        rodape: false,
      },
      botoes: [],
      colunas: [
        {
          nome: "CPF",
          chave: "beneficio.estudantes.aluno.cpf",
          tipo: "texto",
          selectOptions: null,
          sort: false,
          pesquisar: true,
        },
        {
          nome: "Tipo Pagamento",
          chave: "beneficio.tipoBeneficio.tipo",
          tipo: "texto",
          selectOptions: null,
          sort: false,
          pesquisar: true,
        },
        {
          nome: "Valor Pago",
          chave: "beneficio.tipoBeneficio.valorBeneficio",
          tipo: "texto",
          selectOptions: null,
          sort: false,
          pesquisar: true,
        },
        {
          nome: "Data Pagamento",
          chave: "data",
          tipo: "texto",
          selectOptions: null,
          sort: true,
          pesquisar: true,
        },
      ],
    },
  };

  const verificarCamposObrigatorios = (): boolean => {
    let camposValidos = true;
    estrutura.cadastro.campos.forEach((campo: any) => {
      if (campo?.obrigatorio) {
        const valorCampo = dadosPreenchidos[campo.chave];
        if (
          valorCampo === undefined ||
          valorCampo === null ||
          (typeof valorCampo === "string" && valorCampo.trim() === "") ||
          (Array.isArray(valorCampo) && valorCampo.length === 0)
        ) {
          toast.error(`O campo "${campo.nome}" é obrigatório.`, {
            position: "top-right",
          });
          camposValidos = false;
        }
      }
    });
    if (dadosPreenchidos.fimBeneficio && dadosPreenchidos.inicioBeneficio) {
      const dataInicio = new Date(dadosPreenchidos.inicioBeneficio);
      const dataFim = new Date(dadosPreenchidos.fimBeneficio);
      if (dataFim < dataInicio) {
        toast.error(
          `A data de fim do benefício não pode ser anterior à data de início.`,
          {
            position: "top-right",
          }
        );
        camposValidos = false;
      }
    }
    return camposValidos;
  };

  const chamarFuncao = async (nomeFuncao = "", valor: any = null) => {
    switch (nomeFuncao) {
      case "salvar":
        await salvarRegistro(valor);
        break;
      case "voltar":
        voltarRegistro();
        break;
      case "editar":
        editarRegistro(valor);
        break;
      case "pesquisar":
        if (!isEditMode) {
          pesquisarEstudantes(valor);
        }
        pesquisarTipoBeneficio();
        break;
      case "selecionarEstudante":
        setEstudanteSelecionado(valor);
        setDadosPreenchidos((prev: any) => ({
          ...prev,
          estudanteId: valor.id,
          estudante: `${valor.aluno.nome} (${valor.aluno.cpf})`,
        }));
        break;
      case "desselecionarEstudante":
        setEstudanteSelecionado(null);
        setDadosPreenchidos((prev: any) => ({
          ...prev,
          estudanteId: null,
          estudante: "",
        }));
        break;
      case "abrirModalCancelamento":
        abrirModalCancelamento();
        break;
      case "confirmarCancelamento":
        await confirmarCancelamento();
        break;
      default:
        break;
    }
  };

  function monthYearToBrDate(value?: string | null): string {
    if (!value) return "";
    const [mes, ano] = value.split("/");
    if (!mes || !ano) return "";
    return `01/${mes}/${ano}`;
  }

  function brDateToYearMonth(date?: string | null): string {
    if (!date) return "";

    // yyyy-MM-dd (input type="date")
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const [ano, mes] = date.split("-");
      return `${ano}-${mes}`;
    }

    // dd/MM/yyyy
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
      const [, mes, ano] = date.split("/");
      return `${ano}-${mes}`;
    }

    return "";
  }

  function brlToBigDecimal(valor?: string | number | null): string {
    if (valor === null || valor === undefined || valor === "") {
      return "0.00";
    }
    
    if (typeof valor === "number") {
      return valor.toFixed(2);
    }

    if (typeof valor === "string") {
      // Remove espaços
      let cleanValue = valor.trim();

      cleanValue = cleanValue.replace(/R\$\s?/g, "");
      
      cleanValue = cleanValue.replace(/\./g, "").replace(",", ".");
      
      const numValue = parseFloat(cleanValue);
      
      if (isNaN(numValue)) {
        return "0.00";
      }
      
      return numValue.toFixed(2);
    }

    return "0.00";
  }

  function buildFormData(): any {
    if (!verificarCamposObrigatorios()) return undefined;

    const fd = new FormData();

    if (!dadosPreenchidos.estudanteId) {
      toast.error("Selecione um estudante antes de salvar o benefício.", {
        position: "top-right",
      });
      return undefined;
    }

    if (dadosPreenchidos.motivoEncerramento) {
      fd.append("motivoEncerramento", dadosPreenchidos.motivoEncerramento);
    }

    fd.append("estudanteId", dadosPreenchidos.estudanteId.toString());

    if (Array.isArray(dadosPreenchidos.documentos)) {
      dadosPreenchidos.documentos.forEach((file: File) =>
        fd.append("termo", file)
      );
    }

    fd.append(
      "tipoBeneficioId",
      dadosPreenchidos.tipoBeneficioId?.toString() || ""
    );

    fd.append("parecerTermino", dadosPreenchidos.parecerTermino || "");

    fd.append("inicioBeneficio", brDateToYearMonth(dadosPreenchidos.inicioBeneficio));

    fd.append("fimBeneficio", brDateToYearMonth(dadosPreenchidos.fimBeneficio));

    // CORREÇÃO: Usar o valor armazenado em dadosPreenchidos.valorBeneficio
    const valorParaEnviar = dadosPreenchidos.valorBeneficio || tipoBeneficioSelecionado?.valorBeneficio;
    fd.append("valorPagamento", brlToBigDecimal(valorParaEnviar));

    console.log("DEBUG: valorPagamento enviado:", brlToBigDecimal(valorParaEnviar));

    return fd;
  }

  const voltarRegistro = () => {
    router.push("/prae/beneficios/beneficios");
  };

  const pesquisarEstudantes = async (params = null) => {
    try {
      let body = {
        metodo: "get",
        uri: "/prae/estudantes",
        params: params != null ? params : { size: 10, page: 0 },
        data: {},
      };
      const response = await generica(body);
      if (response && response.data.errors != undefined) {
        toast("Erro. Tente novamente!", { position: "bottom-left" });
      } else if (response && response.data.error != undefined) {
        toast(response.data.error.message, { position: "bottom-left" });
      } else {
        if (response && response.data) {
          setEstudantes(response.data);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar registros:", error);
    }
  };

  const pesquisarEstudante = async (estudanteId: any) => {
    try {
      let body = {
        metodo: "get",
        uri: `/prae/estudantes/${estudanteId}`,
        data: {},
      };

      const response = await generica(body);
      if (response && response.data.errors != undefined) {
        toast("Erro. Tente novamente!", { position: "bottom-left" });
      } else if (response && response.data.error != undefined) {
        toast(response.data.error.message, { position: "bottom-left" });
      } else {
        if (response && response.data) {
          setEstudantes({ content: [response.data] });
          chamarFuncao("selecionarEstudante", response.data);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar registros:", error);
    }
  };

  const pesquisarPagamentosEfetuados = async (
    beneficioId: string,
    estudanteId: string
  ): Promise<void> => {
    try {
      const response = await generica({
        metodo: "get",
        uri: `/prae/pagamento/beneficio/${beneficioId}`,
        data: {},
      });

      if (response?.data?.errors != undefined) {
        toast("Erro. Tente novamente!", { position: "bottom-left" });
      } else if (response?.data?.error != undefined) {
        toast(response.data.error.message, { position: "bottom-left" });
      } else if (response?.data) {
        const filteredData = response?.data
          .filter(
            (data: PagamentosBeneficio) =>
              data?.beneficio?.estudantes?.aluno?.id === estudanteId &&
              data?.beneficio?.tipoBeneficio?.id === Number(beneficioId)
          )
          .map((item: PagamentosBeneficio) => ({
            ...item,
            beneficio: {
              ...item.beneficio,
              tipoBeneficio: {
                ...item.beneficio.tipoBeneficio,
                valorBeneficio: aplicarMascara(
                  String(item.beneficio.tipoBeneficio.valorBeneficio),
                  "valor"
                ),
              },
            },
            data: aplicarMascara(item.data, "dataIsoBr"),
          }));
        setPagamentosEfetuados(filteredData);
      }
    } catch (error) {
      console.log(`Erro ao pesquisar pagamentos efetuados:`, error);
    }
  };

  const pesquisarTipoBeneficio = async (params = null) => {
    try {
      let body = {
        metodo: "get",
        uri: "/prae/tipo-beneficio",
        params: params != null ? params : { size: 200, page: 0 },
        data: {},
      };
      const response = await generica(body);
      if (response && response.data.errors != undefined) {
        toast("Erro. Tente novamente!", { position: "bottom-left" });
      } else if (response && response.data.error != undefined) {
        toast(response.data.error.message, { position: "bottom-left" });
      } else {
        if (response && response.data) {
          setTipoBeneficio(response.data.content);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar registros:", error);
    }
  };

  const salvarRegistro = async (item: any) => {
    const dataToSend = buildFormData();
    if (!dataToSend) {
      return;
    }
    try {
      const body = {
        metodo: `${isEditMode ? "patch" : "post"}`,
        uri:
          "/prae/" + `${isEditMode ? estrutura.uri + "/" + id : estrutura.uri}`,
        params: {},
        data: dataToSend,
      };
      const response = await generica(body, "multipart/form-data");
      if (!response || response.status < 200 || response.status >= 300) {
        if (response) {
          console.error(
            "DEBUG: Status de erro:",
            response.status,
            "statusText" in response
              ? response.statusText
              : "Sem texto de status"
          );
        }
        toast.error(
          `Erro na requisição (HTTP ${response?.status || "desconhecido"})`,
          { position: "top-left" }
        );
        return;
      }
      if (response.data?.errors) {
        Object.keys(response.data.errors).forEach((campoErro) => {
          toast.error(
            `Erro em ${campoErro}: ${response.data.errors[campoErro]}`,
            {
              position: "top-left",
            }
          );
        });
      } else if (response.data?.error) {
        toast(response.data.error.message, { position: "top-left" });
      } else {
        Swal.fire({
          title: "Benefício salvo com sucesso!",
          icon: "success",
          confirmButtonText: "OK",
          confirmButtonColor: "#972E3F",
        }).then((result) => {
          if (result.isConfirmed) {
            chamarFuncao("voltar");
          }
        });
      }
    } catch (error) {
      console.error("DEBUG: Erro ao salvar registro:", error);
      toast.error("Erro ao salvar registro. Tente novamente!", {
        position: "top-left",
      });
    }
  };

  const editarRegistro = async (item: any) => {
    try {
      const body = {
        metodo: "get",
        uri: "/prae/" + estrutura.uri + "/" + item,
        params: {},
        data: item,
      };
      const response = await generica(body);
      if (!response) throw new Error("Resposta inválida do servidor.");
      if (response.data?.errors) {
        Object.keys(response.data.errors).forEach((campoErro) => {
          toast(`Erro em ${campoErro}: ${response.data.errors[campoErro]}`, {
            position: "top-left",
          });
        });
      } else if (response.data?.error) {
        toast.error(response.data.error.message, { position: "top-left" });
      } else {
        const beneficio = response.data;
        setDadosPreenchidos({
          tipoBeneficioId: beneficio.tipoBeneficio?.id,
          valorBeneficio: beneficio.tipoBeneficio?.valorBeneficio,
          inicioBeneficio: monthYearToBrDate(beneficio.inicioBeneficio),
          fimBeneficio: monthYearToBrDate(beneficio.fimBeneficio),
          estudanteId: beneficio.estudantes?.id,
          parecerTermino: beneficio.parecerTermino,
          motivoEncerramento: beneficio.motivoEncerramento ?? "",
        });

        setTipoBeneficioSelecionado(beneficio?.tipoBeneficio);
        pesquisarEstudante(beneficio?.estudantes?.id);
        pesquisarPagamentosEfetuados(
          beneficio?.tipoBeneficio?.id,
          beneficio?.estudantes?.aluno?.id
        );
        buscarTermo(Number(id));
      }
    } catch (error) {
      console.error("DEBUG: Erro ao localizar registro:", error);
      toast.error("Erro ao localizar registro. Tente novamente!", {
        position: "top-left",
      });
    }
  };

  const buscarTermo = async (id: number) => {
    const responseDocumentos = await generica({
      metodo: "get",
      uri: `/prae/${estrutura.uri}/${id}/termo`,
      params: {},
      data: {},
    });
    const docList =
      responseDocumentos && Array.isArray(responseDocumentos.data)
        ? responseDocumentos.data
        : responseDocumentos?.data
        ? [responseDocumentos.data]
        : [];
    const arquivosConvertidos = docList
      .map((doc: any): File | null => {
        if (doc.base64) {
          const bytes = atob(doc.base64);
          const arr = new Uint8Array(bytes.length);
          for (let i = 0; i < bytes.length; i++) {
            arr[i] = bytes.charCodeAt(i);
          }
          const blob = new Blob([arr], {
            type:
              doc.tipo ??
              (doc.nome?.toLowerCase().endsWith(".pdf")
                ? "application/pdf"
                : "application/octet-stream"),
          });
          return new File([blob], doc.nome ?? "documento", { type: blob.type });
        }
        return null;
      })
      .filter((f: File | null): f is File => f !== null);
    setDadosPreenchidos((prev: any) => ({
      ...prev,
      documentos: arquivosConvertidos,
    }));
  };

  const abrirModalCancelamento = () => {
    setShowCancelModal(true);
  };

  const fecharModalCancelamento = () => {
    setShowCancelModal(false);
    setCancelamentoData({
      parecerTermino: "",
      motivoEncerramento: ""
    });
  };

  const confirmarCancelamento = async () => {
    const result = await Swal.fire({
      title: "Tem certeza?",
      text: "Tem certeza que pretende realizar essa ação? Ela cancelará o benefício deste usuário.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#972E3F",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Sim, cancelar benefício",
      cancelButtonText: "Não, cancelar"
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      const dataToSend = {
        parecerTermino: cancelamentoData.parecerTermino,
        motivoEncerramento: cancelamentoData.motivoEncerramento
      };

      const body = {
        metodo: "patch",
        uri: `/prae/${estrutura.uri}/${id}/cancelar`, 
        params: {},
        data: dataToSend,
      };

      const response = await generica(body);
      
      if (!response || response.status < 200 || response.status >= 300) {
        toast.error(`Erro ao cancelar benefício (HTTP ${response?.status || "desconhecido"})`, {
          position: "top-left"
        });
        return;
      }

      if (response.data?.errors) {
        Object.keys(response.data.errors).forEach((campoErro) => {
          toast.error(`Erro em ${campoErro}: ${response.data.errors[campoErro]}`, {
            position: "top-left",
          });
        });
      } else if (response.data?.error) {
        toast.error(response.data.error.message, { position: "top-left" });
      } else {
        Swal.fire({
          title: "Benefício cancelado com sucesso!",
          icon: "success",
          confirmButtonText: "OK",
          confirmButtonColor: "#972E3F",
        }).then((result) => {
          if (result.isConfirmed) {
            fecharModalCancelamento();
            chamarFuncao("voltar");
          }
        });
      }
    } catch (error) {
      console.error("Erro ao cancelar benefício:", error);
      toast.error("Erro ao cancelar benefício. Tente novamente!", {
        position: "top-left",
      });
    }
  };

  const camposFiltrados = estrutura.cadastro.campos.filter((campo: any) => {
    return campo.visivel || campo.visivel === undefined;
  });

  return (
    <main className="flex flex-wrap justify-center mx-auto">
      <div className="w-full md:w-11/12 lg:w-10/12 2xl:w-3/4 max-w-6xl p-4 pt-10 md:pt-12 md:pb-12">
        <Cabecalho dados={estrutura.cabecalho} />
        {!dadosPreenchidos?.estudanteId && (
          <>
            <h2 className="text-3xl">Estudantes</h2>
            <TabelaEstudantes
              botoes={[]}
              acoes={acoesEstudante}
              dados={estudantes}
              chamarFuncao={chamarFuncao}
            />
          </>
        )}
        {pagamentosEfetuados.length > 0 && isEditMode && (
          <>
            <h2 className="text-3xl mt-10 mb-4">Pagamentos Efetuados</h2>
            <Tabela dados={pagamentosEfetuados} estrutura={estrutura} />
          </>
        )}
        <Cadastro
          key={`${isEditMode}-${dadosPreenchidos?.inicioBeneficio || "novo"}`}
          estrutura={{
            ...estrutura,
            cadastro: {
              ...estrutura.cadastro,
              campos: camposFiltrados,
            },
          }}
          dadosPreenchidos={dadosPreenchidos}
          setDadosPreenchidos={setDadosPreenchidos}
          chamarFuncao={chamarFuncao}
        />
      </div>

      {/* Modal de Cancelamento */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                Cancelar Benefício
              </h3>
              
              <div className="mt-2">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Parecer de Término
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    rows={3}
                    value={cancelamentoData.parecerTermino}
                    onChange={(e) => setCancelamentoData(prev => ({
                      ...prev,
                      parecerTermino: e.target.value
                    }))}
                    placeholder="Digite o parecer de término"
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Motivo do Encerramento
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    value={cancelamentoData.motivoEncerramento}
                    onChange={(e) => setCancelamentoData(prev => ({
                      ...prev,
                      motivoEncerramento: e.target.value
                    }))}
                  >
                    <option value="">Selecione um motivo</option>
                    {motivosEncerramentoOptions.map((option) => (
                      <option key={option.chave} value={option.chave}>
                        {option.valor}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={fecharModalCancelamento}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => chamarFuncao("confirmarCancelamento")}
                    className="px-4 py-2 bg-extra-150 text-white rounded-md hover:bg-extra-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  >
                    Confirmar Cancelamento
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default withAuthorization(cadastro);