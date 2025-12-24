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
  const [dadosPreenchidos, setDadosPreenchidos] = useState<any>({ 
    tipo: "" 
  });
  const [unidadesGestoras, setUnidadesGestoras] = useState<any[]>([]);
  const [lastMunicipioQuery, setLastMunicipioQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = id && id !== "criar";

  const getOptions = (lista: any[], selecionado: any) => {
    if (!Array.isArray(lista) || lista.length === 0) return [];
    const options = lista.map((item) => ({
      chave: item.id, // ID do item (numérico, por exemplo)
      valor: item.nome, // Texto exibido no <option>
    }));
    if (isEditMode && selecionado) {
      const selectedId = Number(selecionado); // Converte para número, se necessário
      const selectedOption = options.find((opt) => opt.chave === selectedId);
      if (selectedOption) {
        // Coloca a opção selecionada na frente do array
        return [selectedOption, ...options.filter((opt) => opt.chave !== selectedId)];
      }
    }
    return options;
  };

  const estrutura: any = {
    uri: "tipoEtnia",
    cabecalho: {
      titulo: isEditMode ? "Editar Etnia" : "Cadastrar Etnia",
      migalha: [
        { nome: 'Home', link: '/home' },
        { nome: 'Gestão de Acesso', link: '/gestao-acesso' },
        { nome: 'Etnia', link: '/gestao-acesso/etnia' },
        {
          nome: isEditMode ? "Editar" : "Criar",
          link: `/auth/etnia/${isEditMode ? id : "criar"}`,
        },
      ],
    },
    cadastro: {
      campos: [
        // Linha 1
        {
          line: 1,
          colSpan: "md:col-span-1",
          nome: "Nome da Etnia",
          chave: "tipo",
          tipo: "text",
          mensagem: "Digite o nome da etnia",
          obrigatorio: true,
          placeholder: "Ex: Indígena, Afrodescendente, etc.",
        },
      ],
      acoes: [
        { nome: "Cancelar", chave: "voltar", tipo: "botao" },
        { nome: isEditMode ? "Salvar" : "Cadastrar", chave: "salvar", tipo: "submit" },
      ],
    },
  };

  const chamarFuncao = async (nomeFuncao = "", valor: any = null) => {
    toast.dismiss();
    
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
    toast.dismiss(); 
    router.push("/gestao-acesso/etnia");
  };

  const validarDados = (item: any) => {
    toast.dismiss();

    if (!item.tipo || item.tipo.trim() === '') {
      toast.error("O campo 'Nome da Etnia' é obrigatório.", {
        position: "top-left",
        autoClose: 5000,
        toastId: "nome-obrigatorio"
      });
      return false;
    }

    if (item.tipo.trim().length < 2) {
      toast.error("O nome da etnia deve ter pelo menos 2 caracteres.", {
        position: "top-left",
        autoClose: 5000,
        toastId: "nome-curto"
      });
      return false;
    }

    if (item.tipo.trim().length > 100) {
      toast.error("O nome da etnia não pode exceder 100 caracteres.", {
        position: "top-left",
        autoClose: 5000,
        toastId: "nome-longo"
      });
      return false;
    }

    return true;
  };

  const salvarRegistro = async (item: any) => {

    if (!validarDados(item)) {
      return;
    }

    if (isSubmitting) {
      toast.info("Aguarde, enviando dados...", {
        position: "top-left",
        toastId: "enviando-dados"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const body = {
        metodo: `${isEditMode ? "patch" : "post"}`,
        uri: "/auth/" + `${isEditMode ? estrutura.uri + "/" + item.id : estrutura.uri}`,
        params: {},
        data: {
          tipo: item.tipo.trim() 
        },
      };
      
      const response = await generica(body);
      
      if (!response) {
        toast.error("Erro de conexão com o servidor. Verifique sua internet e tente novamente.", {
          position: "top-left",
          autoClose: 5000,
          toastId: "erro-conexao"
        });
        return;
      }

      if (response.status < 200 || response.status >= 300) {
        let mensagemErro = `Erro ao ${isEditMode ? "editar" : "cadastrar"} etnia.`;
        
        switch (response.status) {
          case 400:
            mensagemErro = "Dados inválidos enviados ao servidor.";
            break;
          case 401:
            mensagemErro = "Sessão expirada. Faça login novamente.";
            break;
          case 403:
            mensagemErro = "Você não tem permissão para realizar esta ação.";
            break;
          case 404:
            mensagemErro = isEditMode ? "Etnia não encontrada." : "Recurso não encontrado.";
            break;
          case 409:
            mensagemErro = "Já existe uma etnia com este nome.";
            break;
          case 422:
            mensagemErro = "Dados inválidos. Verifique as informações enviadas.";
            break;
          case 500:
            mensagemErro = "Erro interno do servidor. Tente novamente em alguns minutos.";
            break;
          default:
            mensagemErro = `Erro HTTP ${response.status}`;
        }

        toast.error(mensagemErro, {
          position: "top-left",
          autoClose: 7000,
          toastId: `http-error-${response.status}`
        });
        return;
      }

      if (response.data?.errors) {
        toast.dismiss();
        
        Object.keys(response.data.errors).forEach((campoErro) => {
          toast.error(`Erro em ${campoErro}: ${response.data.errors[campoErro]}`, {
            position: "top-left",
            autoClose: 5000,
            toastId: `campo-error-${campoErro}`
          });
        });
      } else if (response.data?.error) {
        toast.error(response.data.error.message, {
          position: "top-left",
          autoClose: 5000,
          toastId: "erro-response"
        });
      } else {
        // Sucesso
        toast.dismiss(); 
        
        await Swal.fire({
          title: isEditMode ? "Etnia editada com sucesso!" : "Etnia cadastrada com sucesso!",
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
            chamarFuncao("voltar");
          }
        });
      }
    } catch (error: any) {
      console.error("DEBUG: Erro ao salvar registro:", error);
      
      toast.dismiss();
      
      let mensagemErro = "Erro ao salvar registro. Tente novamente!";
      
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
        toastId: "catch-error"
      });
    } finally {
      setIsSubmitting(false);
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
      
      if (!response) {
        toast.error("Erro de conexão ao carregar etnia.", {
          position: "top-left",
          autoClose: 5000,
          toastId: "editar-conexao-error"
        });
        return;
      }

      if (response.status < 200 || response.status >= 300) {
        let mensagemErro = "Erro ao carregar dados da etnia.";
        
        switch (response.status) {
          case 404:
            mensagemErro = "Etnia não encontrada.";
            break;
          case 401:
            mensagemErro = "Sessão expirada. Faça login novamente.";
            break;
          case 403:
            mensagemErro = "Você não tem permissão para acessar este recurso.";
            break;
          default:
            mensagemErro = `Erro HTTP ${response.status}`;
        }
        
        toast.error(mensagemErro, {
          position: "top-left",
          autoClose: 5000,
          toastId: `editar-http-error-${response.status}`
        });
        return;
      }

      if (response.data?.errors) {
        Object.keys(response.data.errors).forEach((campoErro) => {
          toast.error(`Erro em ${campoErro}: ${response.data.errors[campoErro]}`, {
            position: "top-left",
            autoClose: 5000,
            toastId: `editar-campo-error-${campoErro}`
          });
        });
      } else if (response.data?.error) {
        toast.error(response.data.error.message, {
          position: "top-left",
          autoClose: 5000,
          toastId: "editar-response-error"
        });
      } else {
        setDadosPreenchidos({
          id: response.data.id,
          tipo: response.data.tipo || ""
        });
      }
    } catch (error) {
      console.error("DEBUG: Erro ao localizar registro:", error);
      toast.error("Erro ao carregar etnia. Tente novamente!", {
        position: "top-left",
        autoClose: 5000,
        toastId: "editar-catch-error"
      });
    }
  };

  useEffect(() => {
    toast.dismiss();
    
    if (id && id !== "criar") {
      chamarFuncao("editar", id);
    } else {
      setDadosPreenchidos({ tipo: "" });
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
          isSubmitting={isSubmitting}
        />
      </div>
    </main>
  );
};

export default withAuthorization(cadastro);