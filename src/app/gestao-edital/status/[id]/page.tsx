"use client";
import withAuthorization from "@/components/AuthProvider/withAuthorization";
import Cabecalho from "@/components/Layout/Interno/Cabecalho";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { generica } from "@/utils/api";
import Cadastro from "@/components/Cadastro/Estrutura";

const cadastroStatusPersonalizado = () => {
  const router = useRouter();
  const { id } = useParams();

  const [dadosPreenchidos, setDadosPreenchidos] = useState<any>({
    nome: "",
    tipoStatus: "",
  });

  const isEditMode = id && id !== "criar";

  const estrutura: any = {
    uri: "status-personalizado",
    cabecalho: {
      titulo: isEditMode ? "Editar Status Personalizado" : "Cadastrar Status Personalizado",
      migalha: [
        { nome: "Início", link: "/home" },
        { nome: "Gestão de Editais", link: "/gestao-edital/editais" },
        { nome: "Status Personalizado", link: "/gestao-edital/editais/status-personalizado" },
        {
          nome: isEditMode ? "Editar" : "Criar",
          link: `/gestao-edital/editais/status-personalizado/${isEditMode ? id : "criar"}`,
        },
      ],
    },
    cadastro: {
      campos: [
        {
          line: 1,
          colSpan: "md:col-span-1",
          nome: "Nome do Status",
          chave: "nome",
          tipo: "text",
          mensagem: "Digite o nome do status",
          obrigatorio: true,
        },
        {
          line: 2,
          colSpan: "md:col-span-1",
          nome: "Tipo",
          chave: "tipoStatus",
          tipo: "select",
          mensagem: "Selecione o tipo do status",
          selectOptions: [
            { chave: "INSCRICAO", valor: "INSCRICAO" },
            { chave: "EDITAL", valor: "EDITAL" },
            { chave: "ETAPA", valor: "ETAPA" },
          ],
          obrigatorio: true,
          bloqueado: isEditMode,
        },
      ],
      acoes: isEditMode
        ? [
            { nome: "Cancelar", chave: "voltar", tipo: "botao" },
            { nome: "Salvar", chave: "salvar", tipo: "submit" },
          ]
        : [
            { nome: "Cancelar", chave: "voltar", tipo: "botao" },
            { nome: "Cadastrar", chave: "salvar", tipo: "submit" },
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
        await editarRegistro(valor);
        break;
      default:
        break;
    }
  };

  const voltarRegistro = () => {
    router.push("/gestao-edital/editais/status-personalizado");
  };

  const salvarRegistro = async (item: any) => {
    if (!item.tipoStatus || item.tipoStatus === "") {
      console.log("Por favor, selecione um tipo válido.");
      return;
    }

    try {
      const body = {
        metodo: isEditMode ? "patch" : "post",
        uri: `/editais/${estrutura.uri}${isEditMode ? `/${item.id}` : ""}`,
        params: {},
        data: item,
      };
      const response = await generica(body);
      if (!response) throw new Error("Resposta inválida do servidor.");
      voltarRegistro();
    } catch (error: any) {
      console.error("DEBUG: Erro ao salvar registro:", error);
    }
  };

  const editarRegistro = async (idParaEditar: any) => {
    try {
      const body = {
        metodo: "get",
        uri: `/editais/${estrutura.uri}/${idParaEditar}`,
      };
      const response = await generica(body);

      if (response && response.data) {
        setDadosPreenchidos(response.data);
      }
    } catch (error) {
      console.error("DEBUG: Erro ao localizar registro:", error);
    }
  };

  useEffect(() => {
    if (isEditMode) {
      chamarFuncao("editar", id);
    }
  }, [id, isEditMode]);

  return (
    <main className="flex flex-wrap justify-center mx-auto">
      <div className="w-full md:w-11/12 lg:w-10/12 2xl:w-3/4 max-w-6xl p-4 pt-10 md:pt-12 md:pb-12">
        <Cabecalho dados={estrutura.cabecalho} />
        <Cadastro
          estrutura={estrutura}
          dadosPreenchidos={dadosPreenchidos}
          setDadosPreenchidos={setDadosPreenchidos}
          chamarFuncao={chamarFuncao}
        />
      </div>
    </main>
  );
};

export default withAuthorization(cadastroStatusPersonalizado);