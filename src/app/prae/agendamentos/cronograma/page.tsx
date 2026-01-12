"use client";
import withAuthorization from "@/components/AuthProvider/withAuthorization";
import Cabecalho from "@/components/Layout/Interno/Cabecalho";
import Tabela from "@/app/prae/agendamentos/cronograma/tabela/tabela";
import { generica } from "@/utils/api";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

const estrutura: any = {
  uri: "cronograma",
  cabecalho: {
    titulo: "Cronogramas",
    migalha: [
      { nome: "Home", link: "/home" },
      { nome: "Prae", link: "/prae" },
      { nome: "Cronogramas", link: "/prae/agendamentos/cronograma" },
    ],
  },
  tabela: {
    configuracoes: {
      pesquisar: true,
      cabecalho: true,
      rodape: true,
    },
    botoes: [{ nome: "Adicionar", chave: "adicionar", bloqueado: false }],
    colunas: [
      {
        nome: "Tipo de Atendimento",
        chave: "tipoAtendimento.nome",
        tipo: "texto",
        selectOptions: null,
        sort: false,
        pesquisar: true,
      },
      {
        nome: "Modalidade",
        chave: "modalidade",
        tipo: "texto",
        sort: false,
        pesquisar: true,
      },
      {
        nome: "Dia de Atendimento",
        chave: "data",
        tipo: "texto",
        selectOptions: null,
        sort: false,
        pesquisar: true,
      },
      {
        nome: "Quantidade de Vagas",
        chave: "vagas",
        tipo: "quantidade",
        selectOptions: null,
        sort: false,
        pesquisar: false,
      },
      {
        nome: "Horários",
        chave: "horarios",
        tipo: "array",
        selectOptions: null,
        sort: false,
        pesquisar: false,
      },
      {
        nome: "ações",
        chave: "acoes",
        tipo: "button",
        selectOptions: null,
        sort: false,
        pesquisar: false,
      },
    ],
    acoes_dropdown: [
      { nome: "Editar", chave: "editar" },
      { nome: "Deletar", chave: "deletar" },
    ],
  },
};

const PageLista = () => {
  const router = useRouter();
  const [dados, setDados] = useState<any>({
    content: [],
    totalPages: 0,
    number: 0,
  });

  const chamarFuncao = (nomeFuncao = "", valor: any = null) => {
    switch (nomeFuncao) {
      case "pesquisar":
        pesquisarRegistro(valor);
        break;
      case "adicionar":
        adicionarRegistro();
        break;
      case "editar":
        editarRegistro(valor);
        break;
      case "deletar":
        deletarRegistro(valor);
        break;
      default:
        break;
    }
  };

  const pesquisarRegistro = async (params = null) => {
    try {
      let body = {
        metodo: "get",
        uri: "/prae/" + estrutura.uri,
        params: params != null ? params : { size: 10, page: 0 },
        data: {},
      };

      const response = await generica(body);

      if (response?.data?.errors) {
        toast("Erro. Tente novamente!", { position: "bottom-left" });
      } else if (response?.data?.error) {
        toast(response.data.error.message, { position: "bottom-left" });
      } else if (response?.data) {
        // Transforma os dados para adicionar o campo horarios, conforme a lógica que desejar
        const dadosTransformados = response.data.content.map((item: any) => ({
          ...item,
          modalidade: item.modalidade === "REMOTO" ? "Remoto" : "Presencial",
          horarios: item.vagas.map(
            (vaga: any) => `${vaga.horaInicio} - ${vaga.horaFim}`
          ),
        }));
        setDados({ ...response.data, content: dadosTransformados });
      }
    } catch (error) {
      console.error("Erro ao carregar registros:", error);
    }
  };

  const adicionarRegistro = () => {
    router.push("/prae/agendamentos/cronograma/criar");
  };

  const editarRegistro = (item: any) => {
    router.push("/prae/agendamentos/cronograma/" + item.id);
  };

  const formatarDataBR = (data: string) => {
    if (!data) return "";
    const [ano, mes, dia] = data.split("-");
    return `${dia}/${mes}/${ano}`;
  };

  const deletarRegistro = async (item: any) => {
    const confirmacao = await Swal.fire({
      title: `Você deseja deletar o cronograma do dia ${formatarDataBR(
        item.data
      )}?`,
      text: "Essa ação não poderá ser desfeita",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#393C47",
      cancelButtonColor: "#9F2A1A",
      confirmButtonText: "Sim, quero deletar!",
      cancelButtonText: "Cancelar",
      customClass: {
        popup: "my-swal-popup",
        title: "my-swal-title",
        htmlContainer: "my-swal-html",
      },
    });

    if (confirmacao.isConfirmed) {
      try {
        const body = {
          metodo: "delete",
          uri: "/prae/" + estrutura.uri + "/" + item.id,
          params: {},
          data: {},
        };

        const response = await generica(body);

        if (response?.data?.errors) {
          toast.error("Erro. Tente novamente!", { position: "top-left" });
        } else if (response?.data?.error) {
          toast.error(response.data.error.message, { position: "top-left" });
        } else {
          pesquisarRegistro();
          Swal.fire({
            title: "Cronograma deletado com sucesso!",
            icon: "success",
            confirmButtonColor: "#972E3F",
          });
        }
      } catch (error) {
        console.error("Erro ao deletar registro:", error);
        toast.error("Erro ao deletar registro. Tente novamente!", {
          position: "top-left",
        });
      }
    }
  };

  useEffect(() => {
    chamarFuncao("pesquisar");
  }, []);

  return (
    <main className="flex justify-center mx-auto ml-14">
      <div className="w-full max-w-screen-2xl px-4 sm:px-6 md:px-8 lg:px-10 py-6">
        <Cabecalho dados={estrutura.cabecalho} />
        <div className="rounded-lg shadow-sm p-4 md:p-6">
          <Tabela
            dados={dados}
            estrutura={estrutura}
            chamarFuncao={chamarFuncao}
          />
        </div>
      </div>
    </main>
  );
};

export default withAuthorization(PageLista);
