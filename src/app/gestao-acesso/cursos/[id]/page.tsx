"use client";
import withAuthorization from "@/components/AuthProvider/withAuthorization";
import Cadastro from "@/components/Cadastro/Estrutura";
import Cabecalho from "@/components/Layout/Interno/Cabecalho";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { useEnderecoByCep } from "@/utils/brasilianStates";
import { generica } from "@/utils/api";

const cadastro = () => {
  const router = useRouter();
  const { id } = useParams();

  const [dadosPreenchidos, setDadosPreenchidos] = useState<any>({ 
    nome: "",
    numeroPeriodos: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = id && id !== "criar";
  
  // Referência para controlar toasts ativos
  const activeToastIds = useRef<Set<string>>(new Set());

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
    uri: "curso",
    cabecalho: {
      titulo: isEditMode ? "Editar Curso" : "Cadastrar Curso",
      migalha: [
        { nome: 'Início', link: '/home' },
        { nome: 'Gestão Acesso', link: '/gestao-acesso' },
        { nome: "Curso", link: "/gestao-acesso/cursos" },
        {
          nome: isEditMode ? "Editar" : "Criar",
          link: `/gestao-acesso/cursos/${isEditMode ? id : "criar"}`,
        },
      ],
    },
    cadastro: {
      campos: [
        {
          line: 1,
          colSpan: "md:col-span-1",
          nome: "Nome",
          chave: "nome",
          tipo: "text",
          mensagem: "Digite o nome do curso",
          obrigatorio: true,
          minLength: 1,
          maxLength: 100,
          placeholder: "Ex: Engenharia de Software",
          validacao: (valor: string) => {
            if (!valor || valor.trim().length === 0) {
              return "O nome do curso é obrigatório";
            }
            if (valor.length > 100) {
              return "O nome do curso deve ter no máximo 100 caracteres";
            }
            if (valor.length < 1) {
              return "O nome do curso deve ter pelo menos 1 caractere";
            }
            return null;
          }
        },
        {
          line: 1,
          colSpan: "md:col-span-1",
          nome: "Quantidade de Períodos",
          chave: "numeroPeriodos",
          tipo: "number",
          mensagem: "Digite a quantidade de períodos",
          obrigatorio: true,
          min: 1,
          step: 1,
          placeholder: "Ex: 8",
        },
      ],
      acoes: [
        { nome: "Cancelar", chave: "voltar", tipo: "botao" },
        { nome: isEditMode ? "Salvar" : "Cadastrar", chave: "salvar", tipo: "submit" },
      ],
    },
  };

  /**
   * Função auxiliar para mostrar toast com controle de duplicação
   */
  const showToast = (type: 'error' | 'success' | 'info' | 'warning', message: string, options?: any) => {
    const toastId = `${type}-${message.substring(0, 50)}-${Date.now()}`;
    
    // Remove toasts antigos do mesmo tipo
    activeToastIds.current.forEach(id => {
      if (id.startsWith(`${type}-`)) {
        toast.dismiss(id);
        activeToastIds.current.delete(id);
      }
    });

    // Adiciona novo toast
    activeToastIds.current.add(toastId);
    
    const toastOptions = {
      position: "top-left" as const,
      autoClose: type === 'error' ? 7000 : 5000,
      toastId,
      onClose: () => activeToastIds.current.delete(toastId),
      ...options
    };

    switch (type) {
      case 'error':
        toast.error(message, toastOptions);
        break;
      case 'success':
        toast.success(message, toastOptions);
        break;
      case 'info':
        toast.info(message, toastOptions);
        break;
      case 'warning':
        toast.warning(message, toastOptions);
        break;
    }
  };

  /**
   * Limpa todos os toasts
   */
  const clearAllToasts = () => {
    toast.dismiss();
    activeToastIds.current.clear();
  };

  const chamarFuncao = async (nomeFuncao = "", valor: any = null) => {
    clearAllToasts();
    
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
    clearAllToasts();
    router.push("/gestao-acesso/cursos");
  };


  const validarDados = (item: any): { isValid: boolean; message?: string } => {
    clearAllToasts();

    // Validação do nome
    if (!item.nome || item.nome.trim().length === 0) {
      return { isValid: false, message: "O nome do curso é obrigatório" };
    }

    const nomeTrimmed = item.nome.trim();
    
    if (nomeTrimmed.length > 100) {
      return { isValid: false, message: "O nome do curso deve ter no máximo 100 caracteres" };
    }

    if (nomeTrimmed.length < 2) {
      return { isValid: false, message: "O nome do curso deve ter pelo menos 2 caracteres" };
    }

    // Validação do número de períodos
    if (!item.numeroPeriodos && item.numeroPeriodos !== 0) {
      return { isValid: false, message: "A quantidade de períodos é obrigatória" };
    }

    const numero = Number(item.numeroPeriodos);
    
    if (isNaN(numero)) {
      return { isValid: false, message: "A quantidade de períodos deve ser um número válido" };
    }

    if (!Number.isInteger(numero)) {
      return { isValid: false, message: "A quantidade de períodos deve ser um número inteiro" };
    }

    if (numero <= 0) {
      return { isValid: false, message: "A quantidade de períodos deve ser maior que zero" };
    }

    if (numero > 20) {
      return { isValid: false, message: "A quantidade de períodos não pode exceder 20" };
    }

    return { isValid: true };
  };

  const salvarRegistro = async (item: any) => {
    // Evita múltiplos envios simultâneos
    if (isSubmitting) {
      showToast('info', 'Aguarde, processando sua solicitação...');
      return;
    }

    clearAllToasts();

    // Validação local
    const validacao = validarDados(item);
    if (!validacao.isValid) {
      showToast('error', validacao.message!);
      return;
    }

    setIsSubmitting(true);

    try {
      const dadosEnvio = {
        nome: item.nome.trim(),
        numeroPeriodos: Number(item.numeroPeriodos),
        ...(isEditMode && { id: item.id })
      };

      const body = {
        metodo: `${isEditMode ? "patch" : "post"}`,
        uri: "/auth/" + `${isEditMode ? estrutura.uri + "/" + item.id : estrutura.uri}`,
        params: {},
        data: dadosEnvio,
      };

      const response = await generica(body);

      if (!response || response.status < 200 || response.status >= 300) {
        let mensagemErro = `Erro ao ${isEditMode ? "editar" : "cadastrar"} curso.`;
        
        switch (response?.status) {
          case 400:
            mensagemErro = "Dados inválidos enviados. Verifique as informações.";
            break;
          case 401:
            mensagemErro = "Sessão expirada. Faça login novamente.";
            break;
          case 403:
            mensagemErro = "Você não tem permissão para realizar esta ação.";
            break;
          case 404:
            mensagemErro = isEditMode ? "Curso não encontrado." : "Recurso não encontrado.";
            break;
          case 409:
            mensagemErro = "Já existe um curso com este nome.";
            break;
          case 422:
            mensagemErro = "Dados inválidos. Verifique os campos obrigatórios.";
            break;
          case 500:
            mensagemErro = "Erro interno do servidor. Tente novamente em alguns minutos.";
            break;
          default:
            mensagemErro = response?.status ? `Erro HTTP ${response.status}` : "Erro de conexão com o servidor.";
        }

        showToast('error', mensagemErro);
        return;
      }

      if (response.data?.errors) {
        Object.keys(response.data.errors).forEach((campoErro) => {
          const mensagemErro = Array.isArray(response.data.errors[campoErro])
            ? response.data.errors[campoErro].join(', ')
            : response.data.errors[campoErro];

          showToast('error', `${campoErro}: ${mensagemErro}`);
        });
        return;
      }

      if (response.data?.error) {
        const mensagemErro = response.data.error.message || response.data.error;
        showToast('error', mensagemErro);
        return;
      }

      if (response.data?.message) {
        showToast('error', response.data.message);
        return;
      }

      clearAllToasts();
      
      await Swal.fire({
        title: isEditMode ? "Curso editado com sucesso!" : "Curso cadastrado com sucesso!",
        icon: "success",
        customClass: {
          popup: "my-swal-popup",
          title: "my-swal-title",
          htmlContainer: "my-swal-html",
        },
        confirmButtonColor: "#972E3F",
        confirmButtonText: "OK",
        showCancelButton: false,
        allowOutsideClick: false,
        allowEscapeKey: false,
        timer: 3000,
        timerProgressBar: true,
      }).then((result) => {
        if (result.isConfirmed || result.dismiss === Swal.DismissReason.timer) {
          clearAllToasts();
          chamarFuncao("voltar");
        }
      });

    } catch (error: any) {
      console.error("DEBUG: Erro ao salvar registro:", error);

      let mensagemErro = "Erro ao salvar registro. Tente novamente!";
      
      if (error.response?.data) {
        const errorData = error.response.data;

        if (errorData.errors) {
          Object.keys(errorData.errors).forEach((campoErro) => {
            const mensagemErro = Array.isArray(errorData.errors[campoErro])
              ? errorData.errors[campoErro].join(', ')
              : errorData.errors[campoErro];

            showToast('error', `${campoErro}: ${mensagemErro}`);
          });
          return;
        } else if (errorData.error) {
          mensagemErro = errorData.error.message || errorData.error;
        } else if (errorData.message) {
          mensagemErro = errorData.message;
        }
      } else if (error.message) {
        mensagemErro = `Erro: ${error.message}`;
      }

      showToast('error', mensagemErro);
    } finally {
      setIsSubmitting(false);
    }
  };

  const editarRegistro = async (item: any) => {
    clearAllToasts();
    
    try {
      const body = {
        metodo: "get",
        uri: "/auth/" + estrutura.uri + "/" + item,
        params: {},
        data: item,
      };
      
      const response = await generica(body);
      
      if (!response) {
        showToast('error', "Erro de conexão ao carregar curso.");
        return;
      }

      if (response.status < 200 || response.status >= 300) {
        let mensagemErro = "Erro ao carregar dados do curso.";
        
        switch (response.status) {
          case 404:
            mensagemErro = "Curso não encontrado.";
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
        
        showToast('error', mensagemErro);
        return;
      }

      if (response.data?.errors) {
        Object.keys(response.data.errors).forEach((campoErro) => {
          const mensagemErro = Array.isArray(response.data.errors[campoErro])
            ? response.data.errors[campoErro].join(', ')
            : response.data.errors[campoErro];

          showToast('error', `${campoErro}: ${mensagemErro}`);
        });
        return;
      }

      if (response.data?.error) {
        showToast('error', response.data.error.message || response.data.error);
        return;
      }

      setDadosPreenchidos({
        id: response.data.id,
        nome: response.data.nome || "",
        numeroPeriodos: response.data.numeroPeriodos || ""
      });

    } catch (error: any) {
      console.error("DEBUG: Erro ao localizar registro:", error);

      let mensagemErro = "Erro ao carregar curso. Tente novamente!";
      
      if (error.response?.data) {
        const errorData = error.response.data;
        if (errorData.error) {
          mensagemErro = errorData.error.message || errorData.error;
        } else if (errorData.message) {
          mensagemErro = errorData.message;
        }
      } else if (error.message) {
        mensagemErro = `Erro: ${error.message}`;
      }

      showToast('error', mensagemErro);
    }
  };

  useEffect(() => {
    clearAllToasts();
    
    if (id && id !== "criar") {
      chamarFuncao("editar", id);
    } else {
      setDadosPreenchidos({ 
        nome: "",
        numeroPeriodos: ""
      });
    }

    return () => {
      clearAllToasts();
    };
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