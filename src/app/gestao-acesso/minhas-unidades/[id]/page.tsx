"use client";
import withAuthorization from "@/components/AuthProvider/withAuthorization";
import Cadastro from "@/components/Cadastro/Estrutura";
import Cabecalho from "@/components/Layout/Interno/Cabecalho";
import Tabela from "@/components/Tabela/Estrutura";
import { useRole } from "@/context/roleContext";
import { generica } from "@/utils/api";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

const cadastro = () => {
  const router = useRouter();
  const { id } = useParams();
  const { activeRole, userRoles } = useRole();

  const [dadosTabelaFuncionarios, setDadosTabelaFuncionarios] = useState<any>({ content: [] });
  const [dadosTabelaAlocados, setDadosTabelaAlocados] = useState<any>({ content: [] });
  const [dadosPreenchidos, setDadosPreenchidos] = useState<any>(null);
  const [UnidadesPai, setUnidadesPai] = useState<any[]>([]);
  const [tipoUnidade, setTipoUnidade] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isEditMode = id && id !== "criar";

  const carregarDadosUnidade = async () => {
    if (!isEditMode) {
      setDadosPreenchidos({});
      setLoading(false);
      return;
    }

    try {
      // Carrega os dados básicos da unidade
      const response = await generica({
        metodo: "get",
        uri: `/auth/unidade-administrativa/${id}`,
        params: {},
        data: {},
      });

      if (response?.data && !response.data.errors) {
        const dados = response.data;

        // Se tiver apenas o ID da unidade pai, carrega os detalhes
        if (dados.unidadePaiId && !dados.unidadePai) {
          const responsePai = await generica({
            metodo: "get",
            uri: `/auth/unidade-administrativa/${dados.unidadePaiId}`,
            params: {},
            data: {},
          });

          if (responsePai?.data && !responsePai.data.errors) {
            dados.unidadePai = {
              id: responsePai.data.id,
              nome: responsePai.data.nome
            };
          }
        }

        // Se tiver apenas o ID do tipo de unidade, carrega os detalhes
        if (dados.tipoUnidadeAdministrativaId && !dados.tipoUnidadeAdministrativa) {
          const responseTipo = await generica({
            metodo: "get",
            uri: `/auth/tipo-unidade-administrativa/${dados.tipoUnidadeAdministrativaId}`,
            params: {},
            data: {},
          });

          if (responseTipo?.data && !responseTipo.data.errors) {
            dados.tipoUnidadeAdministrativa = {
              id: responseTipo.data.id,
              nome: responseTipo.data.nome
            };
          }
        }
        let dadosMapeados = response.data;
        dados.tipoUnidadeAdministrativaId = response.data.tipoUnidadeAdministrativa?.id;
        setDadosPreenchidos(dadosMapeados);
      } else {
        toast.error("Erro ao carregar dados da unidade", { position: "top-left" });
      }
    } catch (error) {
      toast.error("Erro ao carregar dados da unidade", { position: "top-left" });
    } finally {
      setLoading(false);
    }
  };

  const getOptions = (lista: any[], selecionado: any, itemCompleto: any = null) => {
    if (!Array.isArray(lista)) return [];

    // Cria as opções baseadas na lista
    const options = lista.map((item) => ({
      chave: item.id,
      valor: item.nome,
    }));

    // Se estiver no modo de edição e tiver um valor selecionado
    if (isEditMode && selecionado) {
      const selectedId = Number(selecionado);

      // Verifica se o item selecionado está na lista
      const selectedInList = options.find(opt => opt.chave === selectedId);

      // Se não estiver na lista, mas temos o objeto completo (itemCompleto)
      if (!selectedInList && itemCompleto) {
        return [
          { chave: itemCompleto.id, valor: itemCompleto.nome },
          ...options
        ];
      }

      // Se estiver na lista, coloca como primeira opção
      if (selectedInList) {
        return [
          selectedInList,
          ...options.filter(opt => opt.chave !== selectedId)
        ];
      }
    }

    return options;
  };

  const estruturaEdicao: any = {
    uri: "edicao",
    cabecalho: {
      titulo: isEditMode ? "Editar Unidade Administrativa" : "Criar Unidade Administrativa",
      migalha: [],
    },
    cadastro: {
      campos: [
        {
          line: 1,
          colSpan: "md:col-span-2",
          nome: "Nome",
          chave: "nome",
          tipo: "text",
          mensagem: "Digite",
          obrigatorio: true,
          maxLength: 50,
          bloqueado: true,
        },
        {
          line: 1,
          colSpan: "md:col-span-1",
          nome: "Código",
          chave: "codigo",
          tipo: "text",
          mensagem: "Digite",
          obrigatorio: true,
          bloqueado: true,
        },
        {
          line: 2,
          colSpan: "md:col-span-1",
          nome: "Tipo Unidade",
          chave: "tipoUnidadeAdministrativaId",
          tipo: "select",
          mensagem: "Selecione o tipo de unidade",
          obrigatorio: false,
          bloqueado: true,
          selectOptions: getOptions(
            tipoUnidade,
            dadosPreenchidos?.tipoUnidadeAdministrativaId,
            dadosPreenchidos?.tipoUnidadeAdministrativa
          ),
          valorPadrao: dadosPreenchidos?.tipoUnidadeAdministrativaId
        },
        {
          line: 2,
          colSpan: "md:col-span-1",
          nome: "Unidade Administrativa Responsavel",
          chave: "unidadePaiId",
          tipo: "select",
          mensagem: "Selecione a unidade responsavel",
          obrigatorio: false,
          bloqueado: true,
          selectOptions: getOptions(
            UnidadesPai,
            dadosPreenchidos?.unidadePaiId,
            dadosPreenchidos?.unidadePai
          ),
          valorPadrao: dadosPreenchidos?.unidadePaiId
        }
      ],
      acoes_dropdown: isEditMode ? [{ nome: 'Deletar', chave: 'deletar' }] : [],
    }
  };

  const estruturaFuncionarios: any = {
    uri: "funcionarios",
    cabecalho: {
      titulo: "Funcionários Disponíveis",
      migalha: [],
    },
    tabela: {
      configuracoes: { pesquisar: true, cabecalho: true, rodape: true },
      botoes: [],
      colunas: [
        { nome: "Nome", chave: "nome", tipo: "texto", sort: false, pesquisar: true },
        { nome: "Tipo", chave: "tipo", tipo: "texto", sort: false, pesquisar: true },
        { nome: "Ações", chave: "acoes", tipo: "button", sort: false, pesquisar: false },
      ],
      acoes_dropdown: [{ nome: "AlocarFunc", chave: "alocar" }],
    },
  };

  const estruturaAlocados: any = {
    uri: "gestor",
    cabecalho: {
      titulo: "Alocar Funcionários",
      migalha: [
        { nome: "Início", link: "/home" },
        { nome: "Gestão Acesso", link: "/gestao-acesso" },
        { nome: "Minhas Unidades", link: "/gestao-acesso/minhas-unidades" },
        { nome: "Alocar Funcionário", link: `/gestao-acesso/minhas-unidades/${isEditMode ? id : "criar"}` },
      ],
    },
    tabela: {
      configuracoes: { pesquisar: true, cabecalho: true, rodape: true },
      botoes: [],
      colunas: [
        { nome: "CPF", chave: "cpf", tipo: "texto", sort: false, pesquisar: true },
        { nome: "Nome", chave: "nome", tipo: "texto", sort: false, pesquisar: true },
        { nome: "E-mail", chave: "email", tipo: "texto", sort: false, pesquisar: true },
        { nome: "Siape", chave: "siape", tipo: "texto", sort: false, pesquisar: true },
        { nome: "Telefone", chave: "telefone", tipo: "texto", sort: false, pesquisar: true },
        { nome: "Ações", chave: "acoes", tipo: "button", sort: false, pesquisar: false },
      ],
      acoes_dropdown: [{ nome: "Deletar", chave: "deletar" }],
    },
  };

  const chamarFuncao = async (nomeFuncao = "", valor: any = null) => {
    switch (nomeFuncao) {
      case "alocar":
        await salvarRegistro({ usuarioId: valor.id });
        break;
      case "editar":
        await editarRegistro(valor);
        break;
      case "deletar":
        await deletarRegistro(valor);
        break;
      default:
        break;
    }
  };

  const carregarAlocados = async () => {
    if (!isEditMode) {
      return { raw: { content: [] }, ids: new Set<number>() };
    }

    const unidadeId = Number(id);
    const response = await generica({
      metodo: "get",
      uri: `/auth/unidade-administrativa/${unidadeId}/funcionarios`,
      params: { size: 50, page: 0 },
      data: {},
    });

    const raw = response?.data ?? { content: [] };
    const lista = raw?.content ?? raw;
    const ids = new Set<number>(
      (Array.isArray(lista) ? lista : []).map(
        (a: any) => a.funcionario?.id ?? a.colaborador?.id ?? a.id
      )
    );
    return { raw, ids };
  };

  const carregarFuncionariosBase = async () => {
    let tecnicos: any[] = [];
    let professores: any[] = [];
    let totalTecnicos = 0;
    let totalProfessores = 0;

    const [responseTecnicos, responseProfessores] = await Promise.all([
      generica({ metodo: "get", uri: "/auth/tecnico", params: { size: 50, page: 0 }, data: {} }),
      generica({ metodo: "get", uri: "/auth/professor", params: { size: 50, page: 0 }, data: {} }),
    ]);

    if (responseTecnicos?.data && !responseTecnicos.data.errors) {
      tecnicos = (responseTecnicos.data.content ?? []);
      totalTecnicos = responseTecnicos.data.totalElements || 0;
    }

    if (responseProfessores?.data && !responseProfessores.data.errors) {
      professores = (responseProfessores.data.content ?? []);
      totalProfessores = responseProfessores.data.totalElements || 0;
    }

    const combined = [...tecnicos, ...professores].map(item => ({
      id: item.id,
      nome: item.nome,
      tipo: item.siape ? "Técnico" : "Professor",
    }));

    return {
      content: combined,
      totalElements: totalTecnicos + totalProfessores
    };
  };

  const sincronizarListas = async () => {
    try {
      const [alocados, base] = await Promise.all([carregarAlocados(), carregarFuncionariosBase()]);
      const disponiveis = base.content.filter((f: any) => !alocados.ids.has(f.id));

      setDadosTabelaAlocados(alocados.raw);
      setDadosTabelaFuncionarios({
        content: disponiveis,
        totalElements: base.totalElements - alocados.ids.size
      });
    } catch (error) {
      toast.error("Erro ao sincronizar listas!", { position: "top-left" });
    }
  };

  const salvarRegistro = async (item: any) => {
    try {
      const unidadeId = Number(id);
      const usuarioId = item.usuarioId;

      if (!unidadeId || !usuarioId) {
        toast.error("É necessário selecionar a unidade e o funcionário!", { position: "top-left" });
        return;
      }

      const response = await generica({
        metodo: "post",
        uri: `/auth/unidade-administrativa/${unidadeId}/funcionarios`,
        params: {},
        data: { usuarioId },
      });

      if (response?.data && !response.data.errors) {
        toast.success("Funcionário alocado com sucesso!", { position: "top-left" });
        await sincronizarListas();
      } else {
        toast.error("Erro ao alocar. Tente novamente!", { position: "top-left" });
      }
    } catch (error) {
      toast.error("Erro ao salvar registro!", { position: "top-left" });
    }
  };

  const pesquisarUnidadesPai = async (params = null) => {
    try {
      let body = {
        metodo: 'get',
        uri: '/auth/unidade-administrativa',
        params: params != null ? params : { size: 25, page: 0 },
        data: {}
      }
      const response = await generica(body);
      if (response && response.data.errors != undefined) {
        toast("Erro. Tente novamente!", { position: "bottom-left" });
      } else if (response && response.data.error != undefined) {
        toast(response.data.error.message, { position: "bottom-left" });
      } else if (response && response.data) {
        setUnidadesPai(response.data.content || response.data);
      }
    } catch (error) {

      console.error('Erro ao carregar registros:', error);
    }
  };

  const pesquisarTipoUnidades = async (params = null) => {
    try {
      let body = {
        metodo: 'get',
        uri: '/auth/tipo-unidade-administrativa',
        params: params != null ? params : { size: 25, page: 0 },
        data: {}
      };
      const response = await generica(body);

      if (response?.data?.errors) {
        toast("Erro. Tente novamente!", { position: "bottom-left" });
      } else if (response?.data?.error) {
        toast(response.data.error.message, { position: "bottom-left" });
      } else if (response?.data?.content) {
        setTipoUnidade(response.data.content);
      }
    } catch (error) {
      console.error('Erro ao carregar registros:', error);
    }
  };

  const editarRegistro = async (item: any) => {
    try {
      await carregarDadosUnidade();
    } catch (error) {
      console.error("Erro ao localizar registro:", error);
      toast.error("Erro ao localizar registro. Tente novamente!", { position: "top-left" });
    }
  };

  const deletarRegistro = async (item: any) => {
    const confirmacao = await Swal.fire({
      title: `Você deseja desalocar o funcionário ${item.funcionario?.nome ?? item.nome}?`,
      text: "Essa ação removerá o vínculo com a unidade administrativa",
      icon: "warning",
      iconColor: "#972E3F",
      showCancelButton: true,
      confirmButtonColor: "#393C47",
      cancelButtonColor: "#9F2A1A",
      confirmButtonText: "Sim, quero desalocar!",
      cancelButtonText: "Cancelar",
      customClass: {
        popup: "my-swal-popup",
        title: "my-swal-title",
        htmlContainer: "my-swal-html",
      },
    });

    if (!confirmacao.isConfirmed) return;

    try {
      const unidadeId = Number(id);
      const usuarioId = item.funcionario?.id ?? item.id;

      const response = await generica({
        metodo: "delete",
        uri: `/auth/unidade-administrativa/${unidadeId}/funcionarios`,
        params: {},
        data: { usuarioId },
      });

      const ok =
        response &&
        response.status >= 200 &&
        response.status < 300 &&
        !response?.data?.errors;

      if (ok) {
        await sincronizarListas();
        await Swal.fire({
          title: "Funcionário desalocado com sucesso!",
          icon: "success",
          confirmButtonColor: "#972E3F",
          customClass: {
            popup: "my-swal-popup",
            title: "my-swal-title",
            htmlContainer: "my-swal-html",
          },
        });
      } else {
        if (response?.data?.error?.message) {
          toast.error(response.data.error.message, { position: "top-left" });
        } else {
          toast.error("Erro ao desalocar. Tente novamente!", { position: "top-left" });
        }
      }
    } catch (error) {
      console.error("Erro ao desalocar funcionário:", error);
      toast.error("Erro ao desalocar funcionário!", { position: "top-left" });
    }
  };

  useEffect(() => {
    const carregarTudo = async () => {
      setLoading(true);
      try {
        await Promise.all([
          pesquisarTipoUnidades(),
          pesquisarUnidadesPai(),
          carregarDadosUnidade(),
          sincronizarListas(),
        ]);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoading(false);
      }
    };

    carregarTudo();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <main className="flex flex-wrap justify-center mx-auto">
      <div className="w-full md:w-11/12 lg:w-10/12 2xl:w-3/4 max-w-6xl p-4 pt-10 md:pt-12 md:pb-12">
        <Cabecalho dados={estruturaAlocados.cabecalho} />
        <div className="rounded-lg shadow-sm p-4 md:p-6">
          <Cadastro
            estrutura={estruturaEdicao}
            dadosPreenchidos={dadosPreenchidos}
            setDadosPreenchidos={setDadosPreenchidos}
            chamarFuncao={chamarFuncao}
          />
        </div>

        <Tabela
          dados={dadosTabelaFuncionarios}
          estrutura={estruturaFuncionarios}
          chamarFuncao={chamarFuncao}
        />

        <div className="rounded-lg shadow-sm p-4 md:p-6 mt-6">
          <span className="block text-center text-2xl font-semibold mb-4">Funcionários Alocados</span>
          <Tabela
            dados={dadosTabelaAlocados}
            estrutura={estruturaAlocados}
            chamarFuncao={chamarFuncao}
          />
        </div>
      </div>
    </main>
  );
};

export default withAuthorization(cadastro);