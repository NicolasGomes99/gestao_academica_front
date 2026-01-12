"use client";
import withAuthorization from '@/components/AuthProvider/withAuthorization';
import Cabecalho from '@/components/Layout/Interno/Cabecalho';
import Tabela from '@/components/Tabela/Estrutura';
import { generica } from '@/utils/api';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

const estrutura: any = {
  uri: "tipo-atendimento",
  cabecalho: {
    titulo: "Tipo de Atendimento",
    migalha: [
      { nome: 'Home', link: '/home' },
      { nome: 'Prae', link: '/prae' },
      { nome: 'Tipo de Atendimento', link: '/prae/agendamentos/tipo' },
    ]
  },
  tabela: {
    configuracoes: {
      pesquisar: true,
      cabecalho: true,
      rodape: true,
    },
    botoes: [
      { nome: 'Adicionar', chave: 'adicionar', bloqueado: false },
    ],
    colunas: [
      { nome: "Tipo de Atendimento", chave: "nome", tipo: "texto", selectOptions: null, sort: false, pesquisar: true },
      { nome: "Tempo de Atendimento", chave: "tempoAtendimento", tipo: "texto", selectOptions: null, sort: false, pesquisar: true },
      { nome: "ações", chave: "acoes", tipo: "button", selectOptions: null, sort: false, pesquisar: false },
    ],
    acoes_dropdown: [
      { nome: 'Editar', chave: 'editar' },
      { nome: 'Deletar', chave: 'deletar' },
    ]
  }
};

const PageLista = () => {
  const router = useRouter();
  const [dados, setDados] = useState<any>({ content: [] });

  const chamarFuncao = (nomeFuncao = "", valor: any = null) => {
    switch (nomeFuncao) {
      case 'pesquisar':
        pesquisarRegistro(valor);
        break;
      case 'adicionar':
        adicionarRegistro();
        break;
      case 'editar':
        editarRegistro(valor);
        break;
      case 'deletar':
        deletarRegistro(valor);
        break;
      default:
        break;
    }
  };

  const pesquisarRegistro = async (params = null) => {
    try {
      let body = {
        metodo: 'get',
        uri: '/prae/' + estrutura.uri,
        params: params != null ? params : { size: 10, page: 0 },
        data: {}
      };
      const response = await generica(body);

      if (response && response.data.errors !== undefined) {
        toast.error("Erro. Tente novamente!", { position: "bottom-left" });
      } else if (response && response.data.error !== undefined) {
        toast.error(response.data.error.message, { position: "bottom-left" });
      } else if (response && response.data) {
        setDados(response.data);
      }
    } catch (error) {
      console.error('Erro ao carregar registros:', error);
    }
  };

  const adicionarRegistro = () => {
    router.push('/prae/agendamentos/tipo/criar');
  };

  const editarRegistro = (item: any) => {
    router.push('/prae/agendamentos/tipo/' + item.id);
  };

  const deletarRegistro = async (item: any) => {
    const confirmacao = await Swal.fire({
      title: `Você deseja deletar o tipo de atendimento: ${item.nome}?`,
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
          metodo: 'delete',
          uri: '/prae/' + estrutura.uri + '/' + item.id,
          params: {},
          data: {}
        };

        const response = await generica(body);

        if (response?.status && response.status >= 200 && response.status < 300) {
          pesquisarRegistro();
          Swal.fire({
            title: "Tipo de atendimento deletado com sucesso!",
            icon: "success",
            confirmButtonColor: "#972E3F",
          });
          return;
        }

        const mensagemErro = response?.data?.error?.message?.toLowerCase();

        if (
          response?.status === 409 ||
          response?.status === 500 || 
          mensagemErro?.includes("atendimento") ||
          mensagemErro?.includes("associad")
        ) {
          toast.error(
            "Não é possível excluir este tipo de atendimento, pois existem atendimentos associados a ele.",
            { position: "top-left" }
          );
        } else {
          toast.error("Erro ao deletar registro. Tente novamente!", { position: "top-left" });
        }

      } catch (error: any) {
        console.error('Erro ao deletar registro:', error);

        const mensagemErro = error?.response?.data?.error?.message?.toLowerCase();

        if (
          error?.response?.status === 409 ||
          error?.response?.status === 500 || 
          mensagemErro?.includes("atendimento") ||
          mensagemErro?.includes("associad")
        ) {
          toast.error(
            "Não é possível excluir este tipo de atendimento, pois existem atendimentos associados a ele.",
            { position: "top-left" }
          );
        } else {
          toast.error("Erro ao deletar registro. Tente novamente!", { position: "top-left" });
        }
      }
    }
  };


  useEffect(() => {
    chamarFuncao('pesquisar', null);
  }, []);

  return (
    <main className="flex flex-wrap justify-center mx-auto">
      <div className="w-full sm:w-11/12 2xl:w-10/12 p-4 sm:p-6 md:p-8 lg:p-12 :p-16 2xl:p-20 pt-7 md:pt-8 md:pb-8 ">
        <Cabecalho dados={estrutura.cabecalho} />
        <Tabela
          dados={dados}
          estrutura={estrutura}
          chamarFuncao={chamarFuncao}
        />
      </div>
    </main>
  );
};

export default withAuthorization(PageLista);
