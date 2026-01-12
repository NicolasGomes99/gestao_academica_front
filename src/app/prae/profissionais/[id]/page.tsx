"use client";
import withAuthorization from "@/components/AuthProvider/withAuthorization";
import Cadastro from "@/components/Cadastro/Estrutura";
import Cabecalho from "@/components/Layout/Interno/Cabecalho";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { generica } from "@/utils/api";
import React from "react";
import { useAuthService } from "../../../authentication/auth.hook";

const cadastro = () => {
  const auth = useAuthService();
  const router = useRouter();
  const { id } = useParams();
  const [isTecnico, setIsTecnico] = useState<boolean>(auth.isTecnico());
  const [isProfessor, setIsProfessor] = useState<boolean>(auth.isProfessor());
  const [isProfissional, setIsProfissional] = useState<boolean>(isTecnico || isProfessor);
  const [isGestor, setIsGestor] = useState<boolean>(auth.isGestor());

  const [dadosPreenchidos, setDadosPreenchidos] = useState<any>({});

  const isCreateMode = id == "criar";
  const isEditMode = !isCreateMode;

  const getOptions = (lista: any[], selecionado: any) => {
    if (!Array.isArray(lista)) return [];
    const options = lista.map((item) => ({
      chave: item.id,       // ID (valor salvo no formulário)
      valor: item.nome || item.tipo     // Nome (exibido no select)
    }));
    return options;
  };

  const estrutura: any = {
    uri: "profissional",
    cabecalho: {
      titulo: isEditMode ? "Editar Profissional" : "Cadastrar Profissional",
      migalha: [
        { nome: 'Home', link: '/home' },
        { nome: 'Prae', link: '/prae' },
        isProfissional ? { nome: 'Meu Cadastro', link: '/prae/profissionais/atual' } :
          { nome: 'Profissionais', link: '/prae/profissionais' },
        {
          nome: isEditMode ? "Editar" : "Criar",
          link: `/prae/profissionais/${isEditMode ? id : "criar"}`,
        }
      ],
    },
    cadastro: {
      campos: [
        {
          line: 2,
          colSpan: "md:col-span-1",
          nome: "Nome do Profissional",
          chave: "nome",
          tipo: "text",
          mensagem: "Digite",
          obrigatorio: isEditMode ? false : true,
          bloqueado: true,
        },
        {
          line: 2,
          colSpan: "md:col-span-1",
          nome: "Nome Social",
          chave: "nomeSocial",
          tipo: "text",
          mensagem: "Digite o nome social",
          obrigatorio: false,
          bloqueado: true,
        },
        {
          line: 2,
          colSpan: "md:col-span-1",
          nome: "E-mail",
          chave: "email",
          tipo: "text",
          mensagem: "Digite",
          obrigatorio: isEditMode ? false : true,
          bloqueado: true,
        },
        {
          line: 3,
          colSpan: "md:col-span-1",
          nome: "CPF",
          chave: "cpf",
          tipo: "text",
          mensagem: "Digite",
          obrigatorio: isEditMode ? false : true,
          bloqueado: true,
          mascara: "cpf",
        },
        {
          line: 3,
          colSpan: "md:col-span-1",
          nome: "Telefone",
          chave: "telefone",
          tipo: "text",
          mensagem: "Digite",
          obrigatorio: isEditMode ? false : true,
          bloqueado: true,
          mascara: "celular",
        },
        {
          line: 3,
          colSpan: "md:col-span-1",
          nome: "Siape",
          chave: "siape",
          tipo: "text",
          mensagem: "Digite",
          bloqueado: true,
          exibirPara: ["PROFESSOR"],
        },
        {
          line: 4,
          colSpan: "md:col-span-1",
          nome: "Especialidade",
          chave: "especialidade",
          tipo: "text",
          obrigatorio: true,
          mensagem: "Digite",
        },
      ],
      acoes: isTecnico || isProfessor ? [
        { nome: "Cancelar", chave: "voltar", tipo: "botao" },
        { nome: isEditMode ? "Salvar" : "Cadastrar", chave: "salvar", tipo: "submit" }
      ] :
        [],
    },
  };


  const currentUser = async (params = null) => {
    try {
      let body = {
        metodo: 'get',
        uri: '/auth/usuario/current',
        params: params != null ? params : { size: 25, page: 0 },
        data: {}
      };
      const response = await generica(body);
      if (response && response.data) {
        setDadosPreenchidos(response.data);
      }
    } catch (error) {
      console.error('Erro ao carregar registros:', error);
    }
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
    if (isProfissional)
      router.push("/prae");
    else
      router.push("/prae/estudantes");
  };

  const transformarDados = (item: any) => {
    const { especialidade } = item;
    return {
      especialidade
    };
  };

  const checarObrigatorios = () => {
    let retorno = true;
    for (const campo of estrutura.cadastro.campos) {
      if (campo.obrigatorio) {
        const valor = dadosPreenchidos[campo.chave];
        if (valor === null || valor === undefined || valor === "") {
          toast.error(`O campo ${campo.nome} é obrigatório`, { position: "top-left" });
          retorno = false;
        }
      }
    }
    return retorno;
  };

  const salvarRegistro = async (item: any) => {
    try {
      if (!checarObrigatorios()) return;
      const dataToSend = transformarDados(item);
      const body = {
        metodo: `${isEditMode ? "patch" : "post"}`,
        uri: "/prae/" + `${estrutura.uri}`,
        params: {},
        data: dataToSend,
      };
      const response = await generica(body);
      if (!response || response.status < 200 || response.status >= 300) {
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
          title: "Profissional registrado com sucesso!",
          icon: "success",
          confirmButtonText: "OK",
          confirmButtonColor: "#972E3F",
        }).then((result) => {
          if (result.isConfirmed) {
            window.location.reload();
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
        uri: `/prae/${estrutura.uri}/${item}`,
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
        setDadosPreenchidos({
          ...response.data,
          nome: response.data.tecnico.nome,
          nomeSocial: response.data.tecnico.nomeSocial,
          email: response.data.tecnico.email,
          cpf: response.data.tecnico.cpf,
          telefone: response.data.tecnico.telefone,
          especialidade: response.data.especialidade,
        });
      }
    } catch (error) {
      console.error("DEBUG: Erro ao localizar registro:", error);
      toast.error("Erro ao localizar registro. Tente novamente!", { position: "top-left" });
    }
  };

  useEffect(() => {
    if (isEditMode) {
      if (!isProfissional && !id)
        chamarFuncao("voltar");
      else if (isProfissional)
        chamarFuncao("editar", "current");
      else
        chamarFuncao("editar", id);
    } else {
      currentUser();
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