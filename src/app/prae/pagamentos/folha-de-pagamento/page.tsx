"use client"
import withAuthorization from '@/components/AuthProvider/withAuthorization';
import Cabecalho from '@/components/Layout/Interno/Cabecalho';
import Tabela from '@/app/prae/pagamentos/folha-de-pagamento/tabela/tabela';
import { generica } from '@/utils/api';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

interface Pagamento {
  id: string;
  estudantes: {
    aluno: {
      nome: string;
    };
  };
  tipoBeneficio: {
    tipo: string;
  };
  valorPagamento: number;
  inicioBeneficio: string;
  fimBeneficio: string;
}

const estrutura = {
  uri: "/pagamento",
  cabecalho: {
    titulo: "Folha de pagamento",
    migalha: [
      { nome: 'Home', link: '/home' },
      { nome: 'Prae', link: '/prae' },
      { nome: 'Folha de pagamento', link: '/prae/folha-de-pagamento' },
    ]
  },
  tabela: {
    configuracoes: {
      pesquisar: true,
      cabecalho: true,
      rodape: true,
    },
    botoes: [
      { nome: 'Fazer Pagamento', chave: 'pagarLote', bloqueado: false },
    ],
    colunas: [
      { nome: "Nome", chave: "estudantes.aluno.nome", tipo: "texto", pesquisar: true },
      { nome: "Tipo de Benefício", chave: "tipoBeneficio.tipo", tipo: "texto", pesquisar: true },
      { nome: "Valor", chave: "valorPagamento", tipo: "texto", pesquisar: true },
      { nome: "Período", chave: "periodo", tipo: "texto", pesquisar: false },
      { nome: "ações", chave: "acoes", tipo: "checkbox", pesquisar: false },
    ],
    acoes_dropdown: [
      { nome: 'Editar', chave: 'editar' },
      { nome: 'Deletar', chave: 'deletar' },
    ]
  }
};

const PageLista = () => {
  const router = useRouter();
  const [dados, setDados] = useState<{ content: Pagamento[]; totalElements?: number }>({ content: [], totalElements: 0 });
  const [itensSelecionados, setItensSelecionados] = useState<Set<string>>(new Set());

  const chamarFuncao = (nomeFuncao: string, valor: any = null) => {
    switch (nomeFuncao) {
      case 'pesquisar':
        pesquisarRegistro(valor);
        break;
      case 'pagarLote':
        prepararPagamentoLote();
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

  const pesquisarRegistro = async (params: any = null) => {
  try {
    const response = await generica({
      metodo: 'get',
      uri: '/prae/beneficio/pendentes',
      params: params || {},
      data: {}
    });

    const page = response?.data;

    const formatarData = (dataISO: string) => {
      if (!dataISO) return '';
      return new Date(dataISO).toLocaleDateString('pt-BR');
    };

    const processado = (page?.content || []).map((item: Pagamento) => ({
      ...item,
      periodo: `${formatarData(item.inicioBeneficio)} até ${formatarData(item.fimBeneficio)}`
    }));

    setDados({
      content: processado,
      totalElements: page?.totalElements ?? 0
    });
  } catch (error) {
    toast.error(
      error instanceof Error ? error.message : "Erro ao carregar registros"
    );
  }
};


  const prepararPagamentoLote = () => {
    if (itensSelecionados.size === 0) {
      toast.error("Selecione pelo menos um pagamento");
      return;
    }

    const hoje = new Date();

    const selecionados = dados.content
      .filter(item => itensSelecionados.has(item.id))
      .map(item => {
        const fim = item.fimBeneficio ? new Date(item.fimBeneficio) : null;
        return {
          id: item.id,
          nome: item.estudantes?.aluno?.nome || 'Nome não disponível',
          valor: item.valorPagamento || 0,
          tipo: item.tipoBeneficio?.tipo || 'Tipo não disponível',
          fimBeneficio: fim
        };
      });

    // Bloquear pagamentos vencidos
    const vencidos = selecionados.filter(p => p.fimBeneficio && p.fimBeneficio < hoje);
    if (vencidos.length > 0) {
      toast.error("Não é possível pagar benefícios vencidos.");
      return;
    }

    // Salvar no sessionStorage e navegar para a página de confirmação
    sessionStorage.setItem('pagamentosSelecionados', JSON.stringify(selecionados));
    router.push('/prae/pagamentos/confirmar-pagamento');
  };

  const editarRegistro = (item: Pagamento) => {
    router.push(`/prae/pagamentos/${item.id}`);
  };

  const deletarRegistro = async (item: Pagamento) => {
    const result = await Swal.fire({
      title: `Deletar pagamento ${item.id}?`,
      text: "Esta ação não pode ser desfeita",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#1A759F",
      cancelButtonColor: "#9F2A1A",
      confirmButtonText: "Confirmar",
      cancelButtonText: "Cancelar"
    });

    if (result.isConfirmed) {
      try {
        const response = await generica({
          metodo: 'delete',
          uri: `/prae/${estrutura.uri}/${item.id}`,
          params: {},
          data: {}
        });

        if (response?.data?.error) {
          throw new Error(response.data.error.message);
        }

        toast.success("Pagamento deletado com sucesso!");
        pesquisarRegistro();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erro ao deletar pagamento");
      }
    }
  };

  useEffect(() => {
    pesquisarRegistro();
  }, []);

  return (
    <main className="flex flex-wrap justify-center mx-auto">
      <div className="w-full sm:w-11/12 2xl:w-10/12 p-4 sm:p-6 md:p-8 lg:p-12 xl:p-16 2xl:p-20 pt-7 md:pt-8 md:pb-8">
        <Cabecalho dados={estrutura.cabecalho} />
        <Tabela
          dados={dados}
          estrutura={estrutura}
          chamarFuncao={chamarFuncao}
          itensSelecionados={itensSelecionados}
          onSelecionarItens={setItensSelecionados}
        />
      </div>
    </main>
  );
};

export default withAuthorization(PageLista);