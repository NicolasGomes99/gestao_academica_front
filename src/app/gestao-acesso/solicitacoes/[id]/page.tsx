"use client";
import withAuthorization from "@/components/AuthProvider/withAuthorization";
import Cabecalho from "@/components/Layout/Interno/Cabecalho";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { useEnderecoByCep } from "@/utils/brasilianStates";
import { generica, genericaMultiForm } from "@/utils/api";
import Cadastro from "@/components/Cadastro/Estrutura";
import AplicarMascara from "@/utils/mascaras";
import { useRole } from "@/context/roleContext";

const cadastro = () => {
  const router = useRouter();
  const { id } = useParams();

  const { activeRole, userRoles } = useRole();

  const isPrivileged = activeRole === "administrador" || activeRole === "gestor";

  const [dadosPreenchidos, setDadosPreenchidos] = useState<any>({
    solicitante: {
      nome: '',
      nomeSocial: '',
      email: '',
      cpf: '',
      telefone: '',
    },
    perfil: {
      fotoPerfil: null,
      tipo: '',
      matricula: '',
      curso: { id: '', nome: '' },
      cursos: [],
      siape: '',

    },
    perfilSolicitado: '',
    tipoUsuario: '',
    matricula: '',
    cursoId: '',
    cursoIds: [],
    siape: '',
    documentos: [],
  });
  const [cursos, setCursos] = useState<any[]>([]);
  const [documentos, setDocumentos] = useState<any[]>([]);
  const isEditMode = id && id !== "criar";
  const isUserSolic = useState<any>([]);
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

  const validateFileSize = (files: File[], maxSize: number) => {
    for (const file of files) {
      if (file.size > maxSize) {
        return false;
      }
    }
    return true;
  };

  const validarParecer = (parecer: string) => {
    if (isPrivileged && (!parecer || parecer.trim() === '')) {
      // Limpa toasts anteriores antes de mostrar novo
      toast.dismiss();
      toast.error("O campo parecer é obrigatório para avaliar a solicitação", {
        position: "top-left",
        autoClose: 5000,
        toastId: "parecer-error" // ID único para evitar duplicação
      });
      return false;
    }
    return true;
  };

  const estrutura: any = {
    uri: "solicitacao",
    cabecalho: {
      titulo: isEditMode ? "Visualizar Solicitação" : "Solicitar Perfil",
      migalha: [
        { nome: 'Início', link: '/home' },
        { nome: 'Gestão Acesso', link: '/gestao-acesso' },
        { nome: "Solicitações", link: "/gestao-acesso/solicitacoes" },
        {
          nome: isEditMode ? "visualizar" : "Criar",
          link: `/gestao-acesso/solicitacoes/${isEditMode ? id : "criar"}`,
        },
      ],
    },
    cadastro: {
      campos: [
        {
          line: 2,
          colSpan: "md:col-span-1",
          nome: "Tipo de Perfil",
          chave: isEditMode ? "perfilSolicitado" : "tipoUsuario",
          tipo: isEditMode ? "text" : "select",
          mensagem: "Selecione o tipo de usuário",
          selectOptions: isEditMode ? null : [
            { chave: "GESTOR", valor: "GESTOR" },
            { chave: "TECNICO", valor: "TECNICO" },
            { chave: "PROFESSOR", valor: "PROFESSOR" },
            { chave: "ALUNO", valor: "ALUNO" },

          ],
          obrigatorio: true,
          bloqueado: isEditMode,
        },
        {
          line: 2,
          colSpan: "md:col-span-1",
          nome: "Nome Social",
          chave: "solicitante.nomeSocial",
          tipo: "text",
          mensagem: "Digite o nome social",
          obrigatorio: false,
          bloqueado: true,
        },
        {
          line: 3,
          colSpan: "md:col-span-1",
          nome: "Nome do Solicitante",
          chave: "solicitante.nome",
          tipo: "text",
          mensagem: "Digite",
          obrigatorio: true,
          bloqueado: true,
          pesquisar: true,
        },
        {
          line: 3,
          colSpan: "md:col-span-1",
          nome: "E-mail",
          chave: "solicitante.email",
          tipo: "text",
          mensagem: "Digite",
          obrigatorio: true,
          bloqueado: true,
        },
        {
          line: 3,
          colSpan: "md:col-span-1",
          nome: "CPF",
          chave: "solicitante.cpf",
          tipo: "text",
          mensagem: "Digite",
          obrigatorio: true,
          bloqueado: true,
          mascara: "cpf",
        },
        {
          line: 4,
          colSpan: "md:col-span-1",
          nome: "Telefone",
          chave: "solicitante.telefone",
          tipo: "text",
          mensagem: "Digite",
          obrigatorio: true,
          bloqueado: true,
          mascara: "celular",
        },
        {
          line: 4,
          colSpan: "md:col-span-1",
          nome: "Matrícula",
          chave: isEditMode ? "perfil.matricula" : "matricula",
          tipo: "text",
          mensagem: "Digite a matrícula",
          obrigatorio: true,
          exibirPara: ["ALUNO"],
          bloqueado: isEditMode,
        },
        {
          line: 4,
          colSpan: "md:col-span-1",
          nome: "Curso",
          chave: isEditMode ? "perfil.curso.nome" : "cursoId",
          tipo: isEditMode ? "text" : "select",
          mensagem: "Selecione o curso",
          obrigatorio: true,
          selectOptions: isEditMode ? null : getOptions(cursos, dadosPreenchidos[0]?.cursoId),
          exibirPara: ["ALUNO"],
          bloqueado: isEditMode,

        },
        {
          line: 4,
          colSpan: "md:col-span-1",
          nome: "Cursos",
          chave: isEditMode ? "perfil.cursos" : "cursoIds",
          tipo: "multi-select",
          mensagem: "Selecione cursos",
          obrigatorio: true,
          exibirPara: ["PROFESSOR"],
          selectOptions: isEditMode ? null : getOptions(cursos, Array.isArray(dadosPreenchidos) && dadosPreenchidos[0]?.cursoIds),
          multiple: true, // Permite selecionar múltiplos cursos
          bloqueado: isEditMode,

        },
        {
          line: 4,
          colSpan: "md:col-span-1",
          nome: "SIAPE",
          chave: isEditMode ? "perfil.siape" : "siape",
          tipo: "text",
          mensagem: "Digite o SIAPE",
          obrigatorio: true,
          exibirPara: ["ADMINISTRADOR", "GESTOR", "TECNICO", "PROFESSOR"],
          bloqueado: isEditMode,

        },
        ...(isEditMode && isPrivileged ? [{
          line: 5,
          colSpan: "md:col-span-1",
          nome: "Parecer",
          chave: "parecer",
          tipo: "text",
          mensagem: "Digite o parecer da avaliação",
          obrigatorio: true,
          bloqueado: false,
        }] : []),
        {
          line: 6,
          colSpan: "md:col-span-1",
          nome: "Documentos (tamanho máximo 2MB)",
          chave: "documentos",
          tipo: "documento",
          mensagem: "Anexe os documentos",
          obrigatorio: true,
          bloqueado: isEditMode,
          maxFileSize: 2 * 1024 * 1024, // 2MB em bytes
          maxFileSizeMessage: "O tamanho máximo permitido por arquivo é 2MB",
        }

      ],
      acoes: isEditMode
        ? isPrivileged && !dadosPreenchidos?.solicitadoPorProprioUsuario
          ? [
            { nome: "Rejeitar", chave: "rejeitar", tipo: "submit" },
            { nome: "Aprovar", chave: "aprovar", tipo: "submit" },
          ]
          : [
            { nome: "Voltar", chave: "voltar", tipo: "botao" },
          ]
        : [
          { nome: "Cancelar", chave: "voltar", tipo: "botao" },
          { nome: "Solicitar", chave: "salvar", tipo: "submit" },
        ],
    },
  };

  const chamarFuncao = async (nomeFuncao = "", valor: any = null) => {
    // Limpa todos os toasts antes de executar qualquer ação
    toast.dismiss();
    
    switch (nomeFuncao) {
      case "salvar":
        await salvarRegistro(valor);
        break;
      case "voltar":
        voltarRegistro();
        break;
      case "visualizar":
        editarRegistro(valor);
        break;
      case "aprovar":
        aprovarRegistro(valor);
        break;
      case "rejeitar":
        rejeitarRegistro(valor);
        break;
      default:
        break;
    }
  };

  const voltarRegistro = () => {
    toast.dismiss(); // Limpa toasts antes de navegar
    router.push("/gestao-acesso/solicitacoes");
  };

  const pesquisarRegistroCursos = async (params = null) => {
    try {
      let body = {
        metodo: 'get',
        uri: '/auth/curso',
        params: params != null ? params : { size: 25, page: 0 },
        data: {}
      }
      const response = await generica(body);
      //tratamento dos erros
      if (response && response.data.errors != undefined) {
        toast.dismiss();
        toast.error("Erro. Tente novamente!", { 
          position: "bottom-left",
          autoClose: 3000,
          toastId: "curso-error"
        });
      } else if (response && response.data.error != undefined) {
        toast.dismiss();
        toast.error(response.data.error.message, { 
          position: "bottom-left",
          autoClose: 3000,
          toastId: "curso-error"
        });
      } else {
        if (response && response.data) {
          setCursos(response.data.content);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar registros:', error);
    }
  };

  const rejeitarRegistro = async (item: any) => {
    // Validação do parecer apenas para usuários privilegiados
    if (isPrivileged && !validarParecer(item.parecer)) {
      return;
    }

    try {
      const formData = {
        parecer: item.parecer ? item.parecer.trim() : '',
      }
      const body = {
        metodo: "post",
        uri: "/auth/" + estrutura.uri + "/" + item.id + "/rejeitar",
        params: {},
        data: formData,
      };
      const response = await generica(body);
      if (!response || response.status < 200 || response.status >= 300) {
        if (response) {
          console.error("DEBUG: Status de erro:", response.status, 'statusText' in response ? response.statusText : "Sem texto de status");
        }
        toast.dismiss();
        toast.error(`Erro na requisição (HTTP ${response?.status || "desconhecido"})`, { 
          position: "top-left",
          autoClose: 5000,
          toastId: "rejeitar-error"
        });
        return;
      }
      if (response.data?.errors) {
        // Limpa toasts anteriores
        toast.dismiss();
        
        Object.keys(response.data.errors).forEach((campoErro) => {
          toast.error(`Erro em ${campoErro}: ${response.data.errors[campoErro]}`, {
            position: "top-left",
            autoClose: 5000,
            toastId: `error-${campoErro}`
          });
        });
      } else if (response.data?.error) {
        toast.dismiss();
        toast.error(response.data.error.message, { 
          position: "top-left",
          autoClose: 5000,
          toastId: "rejeitar-error"
        });
      } else {
        Swal.fire({
          title: "Solicitação rejeitada!",
          icon: "error",
          customClass: {
            popup: "my-swal-popup",
            title: "my-swal-title",
            htmlContainer: "my-swal-html",
          },
        }).then((result) => {
          if (result.isConfirmed) {
            toast.dismiss(); 
            chamarFuncao("voltar");
          }
        });
      }
    } catch (error) {
      console.error("DEBUG: Erro ao salvar registro:", error);
      toast.dismiss();
      toast.error("Erro ao salvar registro. Tente novamente!", { 
        position: "top-left",
        autoClose: 5000,
        toastId: "rejeitar-catch-error"
      });
    }
  };

  const aprovarRegistro = async (item: any) => {
    if (isPrivileged && !validarParecer(item.parecer)) {
      return;
    }

    try {
      const body = {
        metodo: "post",
        uri: `/auth/${estrutura.uri}/${item.id}/aprovar`,
        params: {},
        data: { parecer: item.parecer ? item.parecer.trim() : '' },
      };

      const response = await generica(body);

      if (!response || response.status < 200 || response.status >= 300) {
        toast.dismiss();
        toast.error(`Erro na aprovação (HTTP ${response?.status || "desconhecido"})`, {
          toastId: "aprovar-error"
        });
        return;
      }

      Swal.fire({
        title: "Solicitação aprovada!",
        icon: "success",
        confirmButtonText: "OK",
        confirmButtonColor: "#972E3F",
        customClass: {
          popup: "my-swal-popup",
          title: "my-swal-title",
          htmlContainer: "my-swal-html",
        },
      }).then(() => {
        toast.dismiss(); // Limpa toasts antes de voltar
        chamarFuncao("voltar");
      });

    } catch (error) {
      console.error("DEBUG: Erro ao aprovar solicitação:", error);
      toast.dismiss();
      toast.error("Erro ao aprovar. Tente novamente!", {
        toastId: "aprovar-catch-error"
      });
    }
  };


  /**
 * Monta um FormData de acordo com item.tipoUsuario:
 * - ALUNO    → matricula + cursoId
 * - PROFESSOR → siape + vários cursoIds
 * - TECNICO  → siape
 * - GESTOR   → siape
 * E em todos os casos anexa os arquivos em documentos[]
 */
  function buildSolicitacaoFormData(item: {
    tipoUsuario: 'ALUNO' | 'PROFESSOR' | 'TECNICO' | 'GESTOR';
    matricula?: string;
    cursoId?: number;
    cursoIds?: number[];
    siape?: string;
    documentos?: File[];
  }): FormData {

    const fd = new FormData();

    switch (item.tipoUsuario) {
      case 'ALUNO':
        if (item.matricula) {
          fd.append('matricula', item.matricula);
        }
        if (item.cursoId != null) {
          fd.append('cursoId', String(item.cursoId));
        }
        break;

      case 'PROFESSOR':
        if (item.siape) {
          fd.append('siape', item.siape);
        }
        if (Array.isArray(item.cursoIds)) {
          item.cursoIds.forEach(id =>
            fd.append('cursoIds', String(id))
          );
        }
        break;

      case 'TECNICO':
      case 'GESTOR':
        if (item.siape) {
          fd.append('siape', item.siape);
        }
        break;
    }

    if (Array.isArray(item.documentos)) {
      item.documentos.forEach(file =>
        fd.append('documentos', file)
      );
    }

    return fd;
  }


  const validateFiles = (files: File[], maxSize: number, allowedTypes: string[] = ["application/pdf"]) => {
    for (const file of files) {

      if (!allowedTypes.includes(file.type)) {
        return { valid: false, message: `O arquivo "${file.name}" não é um PDF válido.` };
      }

      if (file.size > maxSize) {
        return { valid: false, message: `O arquivo "${file.name}" excede o tamanho máximo de 2MB.` };
      }
    }
    return { valid: true, message: "" };
  };


  const salvarRegistro = async (item: any) => {
    try {
      // Limpa toasts anteriores
      toast.dismiss();

      if (!item.documentos || !Array.isArray(item.documentos) || item.documentos.length === 0) {
        toast.error("É obrigatório anexar pelo menos um documento para solicitar o perfil.", {
          position: "top-left",
          autoClose: 5000,
          toastId: "documento-obrigatorio"
        });
        return;
      }

      if (!item.tipoUsuario) {
        toast.error("É obrigatório selecionar o tipo de perfil desejado.", {
          position: "top-left",
          autoClose: 5000,
          toastId: "tipo-usuario-obrigatorio"
        });
        return;
      }

      const tipoUsuario = item.tipoUsuario.toUpperCase();

      switch (tipoUsuario) {
        case 'ALUNO':
          if (!item.matricula || item.matricula.trim() === '') {
            toast.error("É obrigatório informar a matrícula para perfil de Aluno.", {
              position: "top-left",
              autoClose: 5000,
              toastId: "matricula-obrigatoria"
            });
            return;
          }
          if (!item.cursoId) {
            toast.error("É obrigatório selecionar um curso para perfil de Aluno.", {
              position: "top-left",
              autoClose: 5000,
              toastId: "curso-obrigatorio"
            });
            return;
          }
          break;

        case 'PROFESSOR':
          if (!item.siape || item.siape.trim() === '') {
            toast.error("É obrigatório informar o SIAPE para perfil de Professor.", {
              position: "top-left",
              autoClose: 5000,
              toastId: "siape-obrigatorio"
            });
            return;
          }
          if (!item.cursoIds || !Array.isArray(item.cursoIds) || item.cursoIds.length === 0) {
            toast.error("É obrigatório selecionar pelo menos um curso para perfil de Professor.", {
              position: "top-left",
              autoClose: 5000,
              toastId: "cursos-obrigatorios"
            });
            return;
          }
          break;

        case 'TECNICO':
        case 'GESTOR':
          if (!item.siape || item.siape.trim() === '') {
            toast.error(`É obrigatório informar o SIAPE para perfil de ${tipoUsuario}.`, {
              position: "top-left",
              autoClose: 5000,
              toastId: "siape-perfil-obrigatorio"
            });
            return;
          }
          break;
      }

      if (item.documentos && item.documentos.length > 0) {
        const maxSize = 2 * 1024 * 1024; // 2MB
        const validation = validateFiles(item.documentos, maxSize);

        if (!validation.valid) {
          toast.error(validation.message, {
            position: "top-left",
            autoClose: 5000,
            toastId: "validacao-arquivo"
          });
          return;
        }
      }

      const formData = buildSolicitacaoFormData(item);

      const response = await genericaMultiForm({
        metodo: 'post',
        uri: `/auth/solicitacao/${item.tipoUsuario.toLowerCase()}`,
        params: {},
        data: formData,
      });

      if (!response) {
        toast.error('Erro de conexão com o servidor. Verifique sua internet e tente novamente.', {
          position: "top-left",
          autoClose: 5000,
          toastId: "erro-conexao"
        });
        return;
      }

      if (response.status < 200 || response.status >= 300) {
        let mensagemErro = `Erro HTTP ${response.status}`;

        switch (response.status) {
          case 400:
            mensagemErro = "Dados inválidos ou incompletos. Verifique se todos os campos obrigatórios foram preenchidos corretamente.";
            break;
          case 401:
            mensagemErro = "Sessão expirada. Faça login novamente.";
            break;
          case 403:
            mensagemErro = "Você não tem permissão para realizar esta ação.";
            break;
          case 409:
            mensagemErro = "Já existe uma solicitação pendente ou um usuário com esses dados.";
            break;
          case 413:
            mensagemErro = "Um ou mais arquivos excedem o tamanho máximo permitido (2MB).";
            break;
          case 415:
            mensagemErro = "Formato de arquivo não suportado. Utilize apenas arquivos PDF.";
            break;
          case 500:
            mensagemErro = "Erro interno do servidor. Tente novamente em alguns minutos.";
            break;
        }

        toast.error(mensagemErro, {
          position: "top-left",
          autoClose: 7000,
          toastId: `http-error-${response.status}`
        });
        return;
      }

      if (response.data?.errors) {
        const erros = response.data.errors;

        if (typeof erros === 'object') {
          // Limpa toasts anteriores antes de mostrar novos
          toast.dismiss();
          
          Object.entries(erros).forEach(([campo, mensagem]: [string, any]) => {
            let mensagemFormatada = mensagem;

            switch (campo.toLowerCase()) {
              case 'matricula':
                mensagemFormatada = `Matrícula: ${mensagem}`;
                break;
              case 'siape':
                mensagemFormatada = `SIAPE: ${mensagem}`;
                break;
              case 'cursoid':
              case 'curso':
                mensagemFormatada = `Curso: ${mensagem}`;
                break;
              case 'cursoIds':
              case 'cursos':
                mensagemFormatada = `Cursos: ${mensagem}`;
                break;
              case 'documentos':
                mensagemFormatada = `Documentos: ${mensagem}`;
                break;
              default:
                mensagemFormatada = `${campo}: ${mensagem}`;
            }

            toast.error(mensagemFormatada, {
              position: "top-left",
              autoClose: 6000,
              toastId: `campo-error-${campo}`
            });
          });
        } else {
          toast.error(`Erro: ${erros}`, {
            position: "top-left",
            autoClose: 5000,
            toastId: "erro-generico"
          });
        }
        return;
      }


      if (response.data?.error) {
        let mensagemErro = response.data.error.message || response.data.error;

        if (mensagemErro.includes('documento')) {
          mensagemErro = "Erro com os documentos anexados. Verifique si são arquivos PDF válidos e não excedem 2MB cada.";
        } else if (mensagemErro.includes('matricula')) {
          mensagemErro = "Matrícula inválida ou já cadastrada no sistema.";
        } else if (mensagemErro.includes('siape')) {
          mensagemErro = "SIAPE inválido ou já cadastrado no sistema.";
        }

        toast.error(mensagemErro, {
          position: "top-left",
          autoClose: 6000,
          toastId: "erro-response"
        });
        return;
      }

      // Limpa todos os toasts antes de mostrar sucesso
      toast.dismiss();
      
      await Swal.fire({
        title: "Solicitação enviada com sucesso!",
        text: "Sua solicitação será analisada pela administração. Você receberá uma notificação sobre o resultado.",
        icon: "success",
        confirmButtonText: "OK",
        confirmButtonColor: "#972E3F",
        customClass: {
          popup: "my-swal-popup",
          title: "my-swal-title",
          htmlContainer: "my-swal-html",
        },
        timer: 3000,
        timerProgressBar: true
      });

      toast.dismiss(); // Limpa qualquer toast residual
      router.push('/gestao-acesso/solicitacoes');

    } catch (err: any) {
      console.error('=== ERRO NO CATCH ===', err);
      
      // Limpa toasts anteriores antes de mostrar erro
      toast.dismiss();

      let mensagemErro = 'Erro inesperado ao enviar solicitação. Tente novamente.';

      if (err.response?.data?.message) {
        mensagemErro = err.response.data.message;
      } else if (err.response?.data?.error) {
        mensagemErro = err.response.data.error;
      } else if (err.message) {
        mensagemErro = `Erro técnico: ${err.message}`;
      }

      toast.error(mensagemErro, {
        position: "top-left",
        autoClose: 7000,
        toastId: "catch-error"
      });
    }
  };



  /**
   * Localiza o registro para edição e preenche os dados
   */
  const editarRegistro = async (item: any) => {
    try {
      // 1) Carrega a solicitação principal
      const responseSolicitacao = await generica({
        metodo: "get",
        uri: `/auth/${estrutura.uri}/${item}`,
        params: {},
        data: {},
      });
      const dto = responseSolicitacao?.data;

      // 2) Carrega o usuário atual para verificar se é o solicitante
      const responseUsuario = await generica({
        metodo: "get",
        uri: "/auth/usuario/current",
        params: {},
        data: {},
      });
      const usuarioAtual = responseUsuario?.data;

      // Verifica se o usuário atual é o solicitante
      const solicitadoPorProprioUsuario = usuarioAtual?.id === dto.solicitante?.id;

      // Clareza: perfilSolicitado pode vir de dto.perfilSolicitado ou dto.tipoUsuario
      const perfilReq = (dto.perfilSolicitado ?? dto.tipoUsuario ?? "").toUpperCase();

      // 3) Atualiza o estado com tudo que veio do servidor
      setDadosPreenchidos({
        id: dto.id,
        solicitante: {
          nome: dto.solicitante.nome,
          nomeSocial: dto.solicitante.nomeSocial,
          email: dto.solicitante.email,
          cpf: dto.solicitante.cpf,
          telefone: dto.solicitante.telefone,
        },
        perfil: {
          fotoPerfil: dto.perfil?.fotoPerfil ?? null,
          tipo: perfilReq,
          matricula: dto.perfil?.matricula ?? "",
          curso: dto.perfil?.curso
            ? { id: dto.perfil.curso.id, nome: dto.perfil.curso.nome }
            : { id: "", nome: "" },
          cursos: Array.isArray(dto.perfil?.cursos)
            ? dto.perfil.cursos.map((c: any) => ({ id: c.id, nome: c.nome }))
            : [],
          siape: dto.perfil?.siape ?? "",
        },
        parecer: dto.parecer ?? "",
        perfilSolicitado: perfilReq,
        tipoUsuario: perfilReq,
        matricula: dto.perfil?.matricula ?? "",
        cursoId: dto.perfil?.curso?.id ?? "",
        cursoIds: Array.isArray(dto.perfil?.cursos)
          ? dto.perfil.cursos.map((c: any) => c.id)
          : [],
        siape: dto.perfil?.siape ?? "",
        documentos: [],
        solicitadoPorProprioUsuario, // Flag indicando se o usuário atual é o solicitante
      });

      // 4) Busca e converte documentos (se houver)
      const responseDocumentos = await generica({
        metodo: "get",
        uri: `/auth/${estrutura.uri}/${item}/documentos`,
        params: {},
        data: {},
      });

      const docList = responseDocumentos && Array.isArray(responseDocumentos.data)
        ? responseDocumentos.data
        : responseDocumentos?.data
          ? [responseDocumentos.data]
          : [];

      const arquivosConvertidos = docList
        .map((doc: any): File | null => {
          if (doc.base64) {
            const bytes = atob(doc.base64);
            const arr = new Uint8Array(bytes.length);
            for (let i = 0; i < bytes.length; i++) {
              arr[i] = bytes.charCodeAt(i);
            }
            const blob = new Blob([arr], {
              type:
                doc.tipo ??
                (doc.nome?.toLowerCase().endsWith(".pdf")
                  ? "application/pdf"
                  : "application/octet-stream"),
            });
            return new File([blob], doc.nome ?? "documento", { type: blob.type });
          }
          return null;
        })
        .filter((f: File | null): f is File => f !== null);

      // 5) Finaliza preenchendo os docs
      setDadosPreenchidos((prev: any) => ({
        ...prev,
        documentos: arquivosConvertidos,
      }));

    } catch (error) {
      console.error("DEBUG: Erro ao localizar registro:", error);
      toast.dismiss();
      toast.error("Erro ao localizar registro. Tente novamente!", {
        position: "top-left",
        autoClose: 5000,
        toastId: "editar-error"
      });
    }
  };

  // 2) Refatore currentUser para mapear o response.data nesse shape:
  const currentUser = async () => {
    try {
      const response = await generica({
        metodo: 'get',
        uri: '/auth/usuario/current',
        data: {}
      });

      if (!response) {
        toast.dismiss();
        toast.error('Erro de conexão. Tente novamente.', {
          toastId: "current-user-error"
        });
        return;
      }

      const user = response.data;
      const upperProfile = (user.tipoUsuario ?? '').toUpperCase();

      const mappedData = {
        solicitante: {
          nome: user.nome || '',
          nomeSocial: user.nomeSocial || '',
          email: user.email || '',
          cpf: user.cpf || '',
          telefone: user.telefone || '',
        },
        perfil: {
          fotoPerfil: user.fotoPerfil || null,
          tipo: user.tipoUsuario || user.perfil?.tipo || '',
          matricula: user.perfil?.matricula || '',
          curso: user.perfil?.curso || {
            id: user.cursoId || '',
            nome: user.perfil?.curso?.nome || ''
          },
          cursos: user.perfil?.cursos || [],  // array de { id, nome }
          siape: user.perfil?.siape || '',

        },
        perfilSolicitado: upperProfile,  // ← aqui
        // para os campos que não estão dentro de "perfil"
        tipoUsuario: user.tipoUsuario || '',
        matricula: user.perfil?.matricula || '',
        cursoId: user.perfil?.curso?.id || '',
        cursoIds: user.perfil?.cursos?.map((c: any) => c.id) || [],
        siape: user.perfil?.siape || '',
        documentos: [],  // continua vazio aqui, você carrega depois em editarRegistro
      };

      setDadosPreenchidos(mappedData);
    } catch (error) {
      console.error('Erro ao carregar usuário atual:', error);
      toast.dismiss();
      toast.error('Não foi possível carregar o usuário atual.', {
        toastId: "current-user-catch-error"
      });
    }
  };

  // Efeito exclusivo para o modo de edição
  useEffect(() => {
    pesquisarRegistroCursos();
    if (id === "criar") {
      currentUser();
    }
    if (id && id !== "criar") {
      chamarFuncao("visualizar", id);
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