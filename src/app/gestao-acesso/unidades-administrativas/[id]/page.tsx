"use client";
import withAuthorization from "@/components/AuthProvider/withAuthorization";
import Cadastro from "@/components/Cadastro/Estrutura";
import Cabecalho from "@/components/Layout/Interno/Cabecalho";
import Tabela from "@/components/Tabela/Estrutura";
import { useRole } from "@/context/roleContext";
import { generica } from "@/utils/api";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";
import { blob } from "stream/consumers";
import Swal from "sweetalert2";

const cadastro = () => {
  const router = useRouter();
  const { id } = useParams();

  const [dadosPreenchidos, setDadosPreenchidos] = useState<any>();
  const [dadosTabela, setDadosTabela] = useState<any>({});
  const [colaboradores, setColaboradores] = useState<any[]>([]);
  // 1) state for dynamic filters
  const [filtros, setFiltros] = useState<Record<string, string>>({});
  const [UnidadesPai, setUnidadesPai] = useState<any[]>([]);
  const [tipoUnidade, setTipoUnidade] = useState<any[]>([]);
  const { activeRole, userRoles } = useRole();
  const isPrivileged = userRoles.includes("administrador");

  const isEditMode = id && id !== "criar";

  const handleFilter = useCallback((field: string, value: string) => {
    const next = { ...filtros, [field]: value };
    setFiltros(next);
    // reinicia página em 0 ao filtrar
    pesquisarTodosColaboradores(id as string, next, 0);
  }, [filtros, id]);

  const getOptions = (lista: any[], selecionado: any) => {
    if (!Array.isArray(lista) || lista.length === 0) return [];
    const options = lista.map((item) => ({
      chave: item.id,
      valor: item.nome,
    }));
    if (isEditMode && selecionado) {
      const selectedId = Number(selecionado);
      const selectedOption = options.find((opt) => opt.chave === selectedId);
      if (selectedOption) {
        return [selectedOption, ...options.filter((opt) => opt.chave !== selectedId)];
      }
    }
    return options;
  };

  const estrutura: any = {
    uri: "unidade-administrativa",
    cabecalho: {
      titulo: isEditMode ? "Editar Unidade Administrativa" : "Cadastrar Unidade Administrativa",
      migalha: [
        { nome: 'Início', link: '/home' },
        { nome: 'Gestão de Acesso', link: '/gestao-acesso' },
        { nome: "Unidades Administrativas", link: "/gestao-acesso/unidades-administrativas" },
        {
          nome: isEditMode ? "Editar" : "Criar",
          link: `/gestao-acesso/unidades-administrativas/${isEditMode ? id : "criar"}`,
        },
      ],
    },
    tabela: {
      configuracoes: {
        pesquisar: true,
        cabecalho: true,
        rodape: true,
      },
      botoes: isEditMode ? [
        { nome: activeRole === "administrador" ? 'Alocar Novo Gestor' : 'Adicionar Colaborador', chave: 'adicionar', bloqueado: false },
      ] : [],
      colunas: [
        { nome: "CPF", chave: activeRole === "administrador" ? "gestor.usuario.cpf" : "colaborador.cpf", tipo: "texto", selectOptions: null, sort: false, pesquisar: true },
        { nome: "Nome", chave: activeRole === "administrador" ? "gestor.usuario.nome" : "colaborador.nome", tipo: "texto", selectOptions: null, sort: false, pesquisar: true },
        { nome: "E-mail", chave: activeRole === "administrador" ? "gestor.usuario.email" : "colaborador.email", tipo: "texto", selectOptions: null, sort: false, pesquisar: true },
        { nome: "Siape", chave: activeRole === "administrador" ? "gestor.siape" : "colaborador.siape", tipo: "texto", selectOptions: null, sort: false, pesquisar: true },
        { nome: "Telefone", chave: activeRole === "administrador" ? "gestor.usuario.telefone" : "colaborador.telefone", tipo: "texto", selectOptions: null, sort: false, pesquisar: true },
        { nome: "ações", chave: "acoes", tipo: "button", selectOptions: null, sort: false, pesquisar: false },
      ],
      acoes_dropdown: [
        { nome: 'Deletar', chave: 'deletar' },
      ],
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
          obrigatorio: false,
          maxLength: 50,
          bloqueado: isPrivileged ? false : true,
        },
        {
          line: 1,
          colSpan: "md:col-span-1",
          nome: "Código",
          chave: "codigo",
          tipo: "text",
          mensagem: "Digite",
          obrigatorio: false,
          bloqueado: isPrivileged ? false : true,
        },
        {
          line: 2,
          colSpan: "md:col-span-1",
          nome: (
            <>
              Tipo Unidade <span className="text-red-500">*</span>
            </>
          ),
          chave: "tipoUnidadeAdministrativaId",
          tipo: "select",
          mensagem: "Selecione um tipo",
          obrigatorio: false,
          selectOptions: getOptions(tipoUnidade, dadosPreenchidos?.tipoUnidadeAdministrativaId),
          bloqueado: isEditMode ? true : false,
        },
        {
          line: 2,
          colSpan: "md:col-span-1",
          nome: "Unidade Administrativa Responsavel",
          chave: "unidadePaiId",
          tipo: "select",
          mensagem: "Selecione uma unidade",
          obrigatorio: false,
          selectOptions: getOptions(UnidadesPai, dadosPreenchidos?.unidadePaiId),
          bloqueado: isEditMode ? true : false,
        }
      ],
      acoes: [
        { nome: "Cancelar", chave: "voltar", tipo: "botao" },
        ...(isPrivileged ? [
          { nome: isEditMode ? "Salvar" : "Cadastrar", chave: "salvar", tipo: "submit" }
        ] : [])
      ],
    },
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
      case 'adicionar':
        adicionarGestor(valor);
        break;
      case 'pesquisar':
        await pesquisarTodosColaboradores(id as string, valor);
        break;
      case "deletar":
        deletarRegistro(valor);
        break;
      default:
        break;
    }
  };

  const adicionarGestor = (idUnidade: string) => {
    if (!idUnidade) {
      console.error("ID da unidade não fornecido");
      return;
    }

    const rota = activeRole === "administrador"
      ? `/gestao-acesso/alocar-gestor/${isEditMode ? id : "criar"}`
      : `/gestao-acesso/alocar-colaborador/${isEditMode ? id : "criar"}`;

    router.push(rota);
  };

  const voltarRegistro = () => {
    router.push("/gestao-acesso/unidades-administrativas");
  };

  const salvarRegistro = async (item: any) => {
    try {
      // Converter para número (JavaScript number) - a maioria dos backends aceita
      const tipoUnidadeId = item.tipoUnidadeAdministrativaId ?
        Number(item.tipoUnidadeAdministrativaId) : null;

      const unidadePaiId = item.unidadePaiId ?
        Number(item.unidadePaiId) : null;

      const dadosParaEnviar = {
        nome: item.nome,
        codigo: item.codigo,
        tipoUnidadeAdministrativaId: tipoUnidadeId,
        unidadePaiId: unidadePaiId,
      };

      if (item.nome?.length > 30) {
        toast.warning("O nome deve ter no máximo 30 caracteres", { position: "top-left" });
        return;
      }

      const body = {
        metodo: `${isEditMode ? "patch" : "post"}`,
        uri: "/auth/" + (isEditMode ? `${estrutura.uri}/${id}` : estrutura.uri),
        params: {},
        data: dadosParaEnviar,
      };

      const response = await generica(body);

      if (!response || response.status < 200 || response.status >= 300) {
        console.error("Status de erro:", response?.status, (response as any)?.statusText || "Status text não disponível");
        if (response) {
          toast(`Erro na requisição (HTTP ${response.status})`, { position: "top-left" });
        } else {
          toast("Erro na requisição: resposta nula", { position: "top-left" });
        }
        return;
      }

      if (response.data?.errors) {
        Object.keys(response.data.errors).forEach((campoErro) => {
          toast(`Erro em ${campoErro}: ${response.data.errors[campoErro]}`, {
            position: "top-left",
          });
        });
      } else if (response.data?.error) {
        toast(response.data.error.message, { position: "top-left" });
      } else {
        Swal.fire({
          title: "Unidade gestora salvo com sucesso!",
          icon: "success",
          confirmButtonColor: "#972E3F",
          customClass: {
            popup: "my-swal-popup",
            title: "my-swal-title",
            htmlContainer: "my-swal-html",
          },
        }).then((result) => {
          if (result.isConfirmed) {
            chamarFuncao("voltar");
          }
        });
      }
    } catch (error) {
      console.error("Erro ao salvar registro:", error);
      toast.error("Erro ao salvar registro. Tente novamente!", { position: "top-left" });
    }
  };

  const editarRegistro = async (item: any) => {
    try {
      const body = {
        metodo: "get",
        uri: "/auth/" + estrutura.uri + "/" + item,
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
        let dados = response.data;
        dados.tipoUnidadeAdministrativaId = response.data.tipoUnidadeAdministrativa?.id;
        setDadosPreenchidos(dados);
      }
    } catch (error) {
      console.error("DEBUG: Erro ao localizar registro:", error);
      toast.error("Erro ao localizar registro. Tente novamente!", { position: "top-left" });
    }
  };

  const pesquisarUnidadesPai = async (params = null) => {
    try {
      let body = {
        metodo: 'get',
        uri: '/auth/' + estrutura.uri + "",
        params: params != null ? params : { size: 25, page: 0 },
        data: {}
      }
      const response = await generica(body);
      if (response && response.data.errors != undefined) {
        toast("Erro. Tente novamente!", { position: "bottom-left" });
      } else if (response && response.data.error != undefined) {
        toast(response.data.error.message, { position: "bottom-left" });
      } else if (response && response.data) {
        const ordenados = [...response.data].sort((a, b) =>
          a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" })
        );
        setUnidadesPai(ordenados);
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
        const ordenados = [...response.data.content].sort((a, b) =>
          a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" })
        );
        setTipoUnidade(ordenados);
      }
    } catch (error) {
      console.error('Erro ao carregar registros:', error);
    }
  };


  const pesquisarTodosColaboradores = async (
    unidadeId: string,
    filtrosObj: Record<string, string> = {},
    page = 0,
    size = 20
  ) => {
    try {
      const endpoint = activeRole === "administrador"
        ? `/auth/unidade-administrativa/${unidadeId}/gestores`
        : `/auth/unidade-administrativa/${unidadeId}/funcionarios`;

      // Combine pagination and dynamic filters
      const paramsObj = { size, page, ...filtrosObj };
      const response = await generica({
        metodo: 'get',
        uri: endpoint,
        params: paramsObj,
        data: {},
      });

      if (response?.data?.errors) {
        toast.error("Erro ao carregar dados", { position: "bottom-left" });
      } else if (response?.data) {
        const dadosMapeados = response.data.content.map((item: any) => {
          const pessoa = activeRole === "administrador" ? item.gestor : item;
          return {
            id: item.id,
            papel: item.papel,
            [activeRole === "administrador" ? "gestor" : "colaborador"]: {
              // For gestores, map to usuario structure for filter compatibility
              ...(activeRole === "administrador" ? {
                usuario: {
                  id: pessoa.id,
                  nome: pessoa.nome,
                  nomeSocial: pessoa.nomeSocial,
                  cpf: pessoa.cpf,
                  email: pessoa.email,
                  telefone: pessoa.telefone,
                },
                siape: pessoa.siape
              } : {
                // For colaboradores, keep flat structure
                id: pessoa.id,
                nome: pessoa.nome,
                nomeSocial: pessoa.nomeSocial,
                cpf: pessoa.cpf,
                email: pessoa.email,
                telefone: pessoa.telefone,
                siape: pessoa.siape
              })
            }
          };
        });

        setColaboradores(response.data.content);
        setDadosTabela({
          content: dadosMapeados,
          pageable: response.data.pageable,
          totalElements: response.data.totalElements,
          last: response.data.last,
          totalPages: response.data.totalPages,
          size: response.data.size,
          number: response.data.number,
          sort: response.data.sort,
          first: response.data.first,
          numberOfElements: response.data.numberOfElements,
          empty: response.data.empty
        });
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error("Falha ao buscar dados", { position: "bottom-left" });
    }
  };

  const deletarRegistro = async (item: any) => {
    try {
      const result = await Swal.fire({
        title: 'Tem certeza?',
        text: "Você está prestes a remover este gestor da unidade!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#393C47',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sim, desalocar!',
        cancelButtonText: 'Cancelar'
      });

      if (!result.isConfirmed) return;

      const unidadeId = id;

      const usuarioId = item?.gestor?.usuario?.id;

      if (!unidadeId || !usuarioId) {
        toast.error("IDs inválidos para a operação!", { position: "top-left" });
        return;
      }

      const endpoint = `/auth/unidade-administrativa/${unidadeId}/gestores`;

      const response = await generica({
        metodo: "delete",
        uri: endpoint,
        data: { usuarioId },
        params: {},
      });

      if (response?.status === 204) {
        toast.success("Gestor removido da unidade com sucesso!", { position: "top-left" });
        if (typeof id === 'string') {
          await pesquisarTodosColaboradores(id);
        }
      } else if (response?.data?.errors) {
        Object.keys(response.data.errors).forEach((campoErro) => {
          toast(`Erro em ${campoErro}: ${response.data.errors[campoErro]}`, {
            position: "top-left",
          });
        });
      } else if (response?.data?.error) {
        toast(response.data.error.message, { position: "top-left" });
      } else {
        toast.error("Erro ao desalocar gestor. Tente novamente!", { position: "top-left" });
      }
    } catch (error) {
      console.error("Erro ao desalocar gestor:", error);
      toast.error("Erro ao desalocar gestor. Tente novamente!", { position: "top-left" });
    }
  };

  useEffect(() => {
    const carregarDados = async () => {
      await pesquisarTipoUnidades();
      await pesquisarUnidadesPai();

      if (id && id !== "criar") {
        await chamarFuncao("editar", id);
        if (typeof id === 'string') {
          await pesquisarTodosColaboradores(id);
        }
      }
    };

    carregarDados();
  }, [id, activeRole]);

  return (
    <main className="flex flex-wrap justify-center mx-auto">
      <div className="w-full md:w-11/12 lg:w-10/12 2xl:w-3/4 max-w-6xl p-4 pt-10 md:pt-12 md:pb-12">
        <div className="rounded-lg shadow-sm p-4 md:p-6">
          <Cabecalho dados={estrutura.cabecalho} />
          <Cadastro
            estrutura={estrutura}
            dadosPreenchidos={dadosPreenchidos}
            setDadosPreenchidos={setDadosPreenchidos}
            chamarFuncao={chamarFuncao}
          />
        </div>

        {isEditMode && activeRole === "administrador" && (
          <div className="rounded-lg shadow-sm p-4 md:p-6 mt-6">
            <span className="block text-center text-2xl font-semibold mb-4">
              Gestores Alocados
            </span>
            <Tabela
              dados={dadosTabela}
              estrutura={estrutura}
              chamarFuncao={chamarFuncao}
              onSearch={handleFilter}
            />
          </div>
        )}
      </div>
    </main>
  );
};

export default withAuthorization(cadastro);