"use client";
import withAuthorization from "@/components/AuthProvider/withAuthorization";
import Cadastro from "@/components/Cadastro/Estrutura";
import Cabecalho from "@/components/Layout/Interno/Cabecalho";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { useEnderecoByCep } from "@/utils/brasilianStates";
import { generica } from "@/utils/api";

const cadastro = () => {
  const router = useRouter();
  const { id } = useParams();
  // Inicializamos com um objeto contendo 'endereco' para evitar problemas
  const [dadosPreenchidos, setDadosPreenchidos] = useState<any>({ endereco: {} });
  const isEditMode = id && id !== "criar";

  const getOptions = (lista: any[], selecionado: any) => {
    if (!Array.isArray(lista) || lista.length === 0) return [];
    const options = lista.map((item) => ({
      chave: item.id, // ID do item (numérico, por exemplo)
      valor: item.nome, // Texto exibido no <option>
      selecionado: selecionado !== undefined && item.nome === selecionado,
    }));
    console.log("DEBUG: Opções disponíveis:", options);
    return options;
  };

  const naturezasBeneficio = [
    { id: "BOLSA", nome: "Bolsa" },
    { id: "AUXILIO", nome: "Auxílio" },
    { id: "ISENCAO", nome: "Isenção" },
    { id: "OUTROS", nome: "Outros" },
  ];

  const estrutura: any = {
    uri: "tipo-beneficio",
    cabecalho: {
      titulo: isEditMode ? "Editar Tipo de Benefício" : "Cadastrar Tipo de Benefício",
      migalha: [
        { nome: 'Home', link: '/home' },
        { nome: 'PRAE', link: '/prae' },
        { nome: 'Tipo de Benefício', link: '/prae/beneficios/tipo' },
        {
          nome: isEditMode ? "Editar" : "Criar",
          link: `/prae/beneficios/tipo/${isEditMode ? id : "criar"}`,
        },
      ],
    },
    cadastro: {
      campos: [
        // Linha 1
        {
          line: 1,
          colSpan: "md:col-span-1",
          nome: "Tipo do Benefício",
          chave: "tipo",
          tipo: "text",
          mensagem: "Digite",
          obrigatorio: true,
        },
        {
          line: 1,
          colSpan: "md:col-span-1",
          nome: "Natureza do Benefício",
          chave: "naturezaBeneficio",
          tipo: "select",
          mensagem: "Selecione a natureza do benefício",
          obrigatorio: true,
          selectOptions: getOptions(naturezasBeneficio, dadosPreenchidos?.naturezaBeneficio),
        },
        {
          line: 2,
          colSpan: "md:col-span-1",
          nome: "Descrição",
          chave: "descricao",
          tipo: "text",
          mensagem: "Digite a descrição do benefício",
          obrigatorio: true,
        },
        {
          line: 2,
          colSpan: "md:col-span-1",
          nome: "Valor da Benefício",
          chave: "valorBeneficio",
          tipo: "money-brl",
          mensagem: "Digite o valor",
          obrigatorio: true,
          bloqueado: false,
          mode: "decimal",       // ou "cents" se preferir armazenar em centavos
          allowNegative: false,
        },
      ],
      acoes: [
        { nome: "Cancelar", chave: "voltar", tipo: "botao" },
        { nome: isEditMode ? "Salvar" : "Cadastrar", chave: "salvar", tipo: "submit" },
      ],
    },
  };


  /**
   * Chama funções de acordo com o botão clicado
   */
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
      default:
        break;
    }
  };

  const voltarRegistro = () => {
    router.push("/prae/beneficios/tipos");
  };

  function validarDadosPreenchidos() {
    let valido = true;

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
          valido = false;
        }
      }
    });

    if (dadosPreenchidos?.tipo && (dadosPreenchidos?.tipo.length > 50 || dadosPreenchidos?.tipo.length < 3)) {
      toast.error("Tipo deve ter entre 3 e 50 caracteres.", { position: "top-right" });
      valido = false;
    }
    if (dadosPreenchidos?.descricao && (dadosPreenchidos?.descricao.length > 200 || dadosPreenchidos?.descricao.length < 3)) {
      toast.error("Descrição deve ter entre 3 e 200 caracteres.", { position: "top-right" });
      valido = false;
    }

    if(dadosPreenchidos?.valorBeneficio !== undefined){
      const valor = parseFloat(dadosPreenchidos.valorBeneficio.toString().replace(',', '.'));
      if (isNaN(valor) || valor <= 0) {
        toast.error("Valor do benefício deve ser um número válido maior ou igual a zero.", { position: "top-right" });
        valido = false;
      }
    }


    return valido;
  }

  function transformarDados(item: any) {

    if (!item || !validarDadosPreenchidos()) return null;
    console.log("DEBUG: Transformando dados:", item.valorBeneficio.toString().replace(',', '.'));
    return {
      tipo: item.tipo,
      naturezaBeneficio: item.naturezaBeneficio,
      descricao: item.descricao,
      valorBeneficio: item.valorBeneficio ? parseFloat(item.valorBeneficio.toString().replace(',', '.')) : 0,
    };
  }

  const salvarRegistro = async (item: any) => {
    const dataToSend = transformarDados(item);
    console.log("DEBUG: Dados a enviar:", dataToSend);
    if (!dataToSend) {
      toast.error("Dados inválidos. Verifique os campos preenchidos.", { position: "top-left" });
      return;
    }
    try {
      const body = {
        metodo: `${isEditMode ? "patch" : "post"}`,
        uri: "/prae/" + `${isEditMode ? estrutura.uri + "/" + item.id : estrutura.uri}`,
        params: {},
        data: dataToSend,
      };
      const response = await generica(body);
      if (!response || response.status < 200 || response.status >= 300) {
        if (response) {
          console.error("DEBUG: Status de erro:", response.status, 'statusText' in response ? response.statusText : "Sem texto de status");
        }
        toast.error(`Erro na requisição (HTTP ${response?.status || "desconhecido"})`, { position: "top-left" });
        return;
      }
      if (response.data?.errors) {
        Object.keys(response.data.errors).forEach((campoErro) => {
          toast.error(`Erro em ${campoErro}: ${response.data.errors[campoErro]}`, {
            position: "top-left",
          });
        });
      } else if (response.data?.error) {
        toast(response.data.error.message, { position: "top-left" });
      } else {
        Swal.fire({
          title: "Tipo de benefício registrado com sucesso!",
          icon: "success",
        }).then((result) => {
          if (result.isConfirmed) {
            chamarFuncao("voltar");
          }
        });
      }
    } catch (error) {
      console.error("DEBUG: Erro ao salvar registro:", error);
      toast.error("Erro ao salvar registro. Tente novamente!", { position: "top-left" });
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
        setDadosPreenchidos(response.data);
      }
    } catch (error) {
      console.error("DEBUG: Erro ao localizar registro:", error);
      toast.error("Erro ao localizar registro. Tente novamente!", { position: "top-left" });
    }
  };

  // Efeito exclusivo para o modo de edição
  useEffect(() => {
    if (id && id !== "criar") {
      chamarFuncao("editar", id);
    }
  }, [id]);

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

export default withAuthorization(cadastro);


