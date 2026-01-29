"use client";
import withAuthorization from "@/components/AuthProvider/withAuthorization";
import Cadastro from "@/components/Cadastro/Estrutura";
import Cabecalho from "@/components/Layout/Interno/Cabecalho";
import { generica } from "@/utils/api";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

interface PagamentoSelecionado {
  id: string;
  nome: string;
  valor: number;
  tipo: string;
}

const PageConfirmarPagamento = () => {
  const router = useRouter();
  const [pagamentosSelecionados, setPagamentosSelecionados] = useState<
    PagamentoSelecionado[]
  >([]);

  const totalPagamentos = pagamentosSelecionados.reduce((total, item) => {
    return total + (item.valor || 0);
  }, 0);

  const [dadosPreenchidos, setDadosPreenchidos] = useState<any>({});

  const chamarFuncao = async (nomeFuncao = "", valor: any = null) => {
    switch (nomeFuncao) {
      case "salvar":
        await confirmarPagamentos();
        break;
      case "voltar":
        voltar();
        break;
      default:
        break;
    }
  };

  const estrutura: any = {
    uri: "pagamento",
    cabecalho: {
      titulo: "Confirmar Pagamentos",
      migalha: [
        { nome: "Home", link: "/home" },
        { nome: "Prae", link: "/prae" },
        { nome: "Pagamentos Pendentes", link: "/prae/pagamentos-pendentes" },
        {
          nome: "Confirmar Pagamento",
          link: "/prae/pagamentos/confirmar-pagamento",
        },
      ],
    },
    cadastro: {
      campos: [
        {
          line: 1,
          colSpan: "md:col-span-auto",
          nome: "N° do Lote",
          chave: "numeroLote",
          tipo: "text",
          mensagem: "Digite",
          obrigatorio: true
        },
        {
          line: 1,
          colSpan: "md:col-span-auto",
          nome: "Data de Referência",
          chave: "dataReferencia",
          tipo: "date",
          mensagem: "Digite a data de referência",
          obrigatorio: true
        }
      ],
      acoes:  [
        { nome: "Cancelar", chave: "voltar", tipo: "botao" },
        pagamentosSelecionados.length > 0 ? 
        { nome: `Confirmar Pagamentos (${pagamentosSelecionados.length})` , chave: "salvar", tipo: "submit" } :
        { nome: "Selecionar Pagamentos" , chave: "voltar", tipo: "reset"}
      ] 
    },
  };

  useEffect(() => {
    // Recuperar os pagamentos do sessionStorage
    const pagamentosSalvos = sessionStorage.getItem("pagamentosSelecionados");
    dadosPreenchidos.dataReferencia = new Date().toISOString().split("T")[0];
    if (pagamentosSalvos) {
      setPagamentosSelecionados(JSON.parse(pagamentosSalvos));
    } else {
      toast.error("Nenhum pagamento selecionado");
      router.push("/prae/pagamentos/folha-de-pagamento");
    }
  }, [router]);

  // Função para remover um pagamento da lista
  const removerPagamento = (id: string) => {
    const novosPagamentos = pagamentosSelecionados.filter(
      (pagamento) => pagamento.id !== id
    );
    setPagamentosSelecionados(novosPagamentos);

    sessionStorage.setItem(
      "pagamentosSelecionados",
      JSON.stringify(novosPagamentos)
    );

    toast.info("Pagamento removido da lista");

    // Se não houver mais pagamentos, voltar para a página anterior
    if (novosPagamentos.length === 0) {
      toast.info("Nenhum pagamento selecionado");
      voltar();
    }
  };

  // Função para remover todos os pagamentos
  const removerTodos = () => {
    setPagamentosSelecionados([]);
    sessionStorage.removeItem("pagamentosSelecionados");
    toast.info("Todos os pagamentos foram removidos");
    router.back();
  };

  const formatarDados = (pagamento: any) => {
    let mesReferencia = "";
    let anoReferencia = "";

    if (dadosPreenchidos.dataReferencia) {
      const data = new Date(dadosPreenchidos.dataReferencia);
      mesReferencia = (data.getMonth() + 1).toString().padStart(2, "0");
      anoReferencia = data.getFullYear().toString();
    }
    return {
        beneficioId: pagamento.id,
        valor: pagamento.valor,
        data: new Date().toISOString().split("T")[0],
        numeroLote: dadosPreenchidos.numeroLote,
        mesReferencia: mesReferencia,
        anoReferencia: anoReferencia
      }
  }

  const validarDados = () => {
    if (!dadosPreenchidos.numeroLote || dadosPreenchidos.numeroLote.trim() === '') {
      toast.error("O N° do Lote é obrigatório.");
      return false;
    }

    if (!dadosPreenchidos.dataReferencia) {
      toast.error("A Data de Referência é obrigatória.");
      return false;
    }

    return true;
  };

  const confirmarPagamentos = async () => {
    if (!validarDados()) {
      return;
    }
    try {
      const body = {
        metodo: "post",
        uri: "/prae/pagamento",
        data: pagamentosSelecionados.map((p) => formatarDados(p)),
      };

      const response = await generica(body);

      if (response && response.data.errors != undefined) {
        toast("Erro. Tente novamente!", { position: "bottom-left" });
      } else if (response && response.data.error != undefined) {
        toast(response.data.error.message, { position: "bottom-left" });
      } else {
         const mensagemSucesso = pagamentosSelecionados.length === 1
            ? "Pagamento processado!"
            : `${pagamentosSelecionados.length} pagamentos processados!`;

        toast.success(mensagemSucesso);

        // Limpar sessionStorage e voltar para a página anterior
        sessionStorage.removeItem("pagamentosSelecionados");
        router.push("/prae/pagamentos/pagamentos-realizados");
      }

     
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao processar pagamentos"
      );
    }
  };

  const voltar = () => {
    sessionStorage.removeItem("pagamentosSelecionados");
    router.back();
  };

  return (
    <main className="flex flex-wrap justify-center mx-auto">
      <div className="w-full sm:w-11/12 2xl:w-10/12 p-4 sm:p-6 md:p-8 lg:p-12 xl:p-16 2xl:p-20 pt-7 md:pt-8 md:pb-8">
        <Cabecalho dados={estrutura.cabecalho} />
        <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Resumo dos Pagamentos</h2>
            {pagamentosSelecionados.length > 0 && (
              <button
                onClick={removerTodos}
                className="px-4 py-2 bg-extra-150 text-white rounded-lg hover:bg-extra-50 transition duration-200 font-semibold text-sm"
              >
                Remover Todos
              </button>
            )}
          </div>

          {/* Lista de pagamentos */}
          <div className="max-h-96 overflow-y-auto mb-6 border rounded-lg">
            {pagamentosSelecionados.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p>Nenhum pagamento selecionado</p>
              </div>
            ) : (
              pagamentosSelecionados.map((item) => (
                <div key={item.id} className="p-4 border-b hover:bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                    <div>
                      <p className="font-semibold text-gray-700 text-sm">
                        Nome
                      </p>
                      <p className="text-gray-900">{item.nome}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-700 text-sm">
                        Valor
                      </p>
                      <p className="text-gray-900">
                        R$ {item.valor.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-700 text-sm">
                        Tipo
                      </p>
                      <p className="text-gray-900">{item.tipo}</p>
                    </div>
                    <div className="flex justify-end">
                      <button
                        onClick={() => removerPagamento(item.id)}
                        className="px-3 py-1 bg-extra-150 text-white rounded hover:bg-extra-50 transition duration-200 font-semibold text-sm"
                        title="Remover pagamento"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Total */}
          {pagamentosSelecionados.length > 0 && (
            <div className="mb-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-700">
                  Total de Pagamentos:
                </span>
                <span className="text-2xl font-bold text-blue-700">
                  R$ {totalPagamentos.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-md font-semibold text-gray-600">
                  Quantidade:
                </span>
                <span className="text-lg font-bold text-gray-800">
                  {pagamentosSelecionados.length} pagamento(s)
                </span>
              </div>
            </div>
          )}
          <Cadastro
            estrutura={estrutura}
            dadosPreenchidos={dadosPreenchidos}
            setDadosPreenchidos={setDadosPreenchidos}
            chamarFuncao={chamarFuncao}
          />
        </div>
      </div>
    </main>
  );
};

export default withAuthorization(PageConfirmarPagamento);
