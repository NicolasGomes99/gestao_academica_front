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
import { useAuthService } from "@/app/authentication/auth.hook";
import React from "react";
import { EnderecoFields } from "@/components/EnderecoAutoComplete/EnderecoFields";
import { genericaMultiForm } from "@/utils/api";

const cadastro = () => {
  const router = useRouter();
  const { id } = useParams();
  const auth = useAuthService(); // Add auth service
  
  // Inicializamos com um objeto contendo 'endereco' para evitar problemas
  const [dadosPreenchidos, setDadosPreenchidos] = useState<any>({ endereco: {} });
  const [dadosBancariosPreenchidos, setDadosBancariosPreenchidos] = useState<any>({});
  const [isDeficiente, setIsDeficiente] = useState<boolean>(false);
  const isCreateMode = id == "criar";
  const isEditMode = !isCreateMode;
  // Controle de CEP para evitar busca automática ao carregar edição
  const [initialCep, setInitialCep] = useState<string | null>(null);
  const [cepParaBusca, setCepParaBusca] = useState<string>("");

  const getOptions = (lista: any[], selecionado: any) => {
    if (!Array.isArray(lista)) return [];
    const options = lista.map((item) => ({
      chave: item.id,       // ID (valor salvo no formulário)
      valor: item.nome || item.tipo     // Nome (exibido no select)
    }));
    return options;
  };

  const estrutura: any = {
    uri: "estudantes",
    cabecalho: {
      titulo: isEditMode ? "Editar Estudante" : "Cadastrar Estudante",
      migalha: [
        { nome: 'Home', link: '/home' },
        { nome: 'Prae', link: '/prae' },
        auth.isAluno() ? { nome: 'Meu Cadastro', link: '/prae/estudantes/atual' } :
          { nome: 'Estudantes', link: '/prae/estudantes' },
        {
          nome: isEditMode ? "Editar" : "Criar",
          link: `/prae/estudantes/${isEditMode ? id : "criar"}`,
        }
      ],
    },
    cadastro: {
      campos: [
        {
          line: 2,
          colSpan: "md:col-span-auto",
          nome: "Nome",
          chave: "nome",
          tipo: "text",
          mensagem: "Digite",
          obrigatorio: true,
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
          obrigatorio: true,
          bloqueado: true,
        },
        {
          line: 2,
          colSpan: "md:col-span-1",
          nome: "CPF",
          chave: "cpf",
          tipo: "text",
          mensagem: "Digite",
          obrigatorio: true,
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
          obrigatorio:  true,
          bloqueado: true,
          mascara: "celular",
        },
        {
          line: 3,
          colSpan: "md:col-span-1",
          nome: "Matrícula",
          chave: "matricula",
          tipo: "text",
          mensagem: "Digite a matrícula",
          obrigatorio: true,
          bloqueado: true,
        },
        {
          line: 3,
          colSpan: "md:col-span-auto",
          nome: "Curso",
          chave: "curso",
          tipo: "text",
          obrigatorio: true,
          bloqueado: true,
        },
        {
          line: 4,
          colSpan: "md:col-span-1",
          nome: "Renda Per Capita",
          chave: "rendaPercapta",
          tipo: "money-brl",
          mode: "decimal",       // ou "cents" se preferir armazenar em centavos
          allowNegative: false,
          mensagem: "Digite a renda per capita",
          obrigatorio: isCreateMode,
          bloqueado: !auth.isAluno(),
        },
        {
          line: 4,
          colSpan: "md:col-span-1",
          nome: "CEP",
          chave: "cep",
          tipo: "text",
          mensagem: "Digite o CEP",
          obrigatorio: true,
          bloqueado: !auth.isAluno(),
          mascara: "CEP",
        },
        {
          line: 5,
          colSpan: "md:col-span-1",
          nome: "Rua",
          chave: "rua",
          tipo: "text",
          mensagem: "Digite o nome da rua",
          obrigatorio: true,
          bloqueado: !auth.isAluno(),
        },
        {
          line: 5,
          colSpan: "md:col-span-1",
          nome: "Bairro",
          chave: "bairro",
          tipo: "text",
          mensagem: "Digite o bairro",
          obrigatorio: true,
          bloqueado: !auth.isAluno(),
        },
        {
          line: 5,
          colSpan: "md:col-span-1",
          nome: "Cidade",
          chave: "cidade",
          tipo: "text",
          mensagem: "Digite a cidade",
          obrigatorio: true,
          bloqueado: !auth.isAluno(),
        },
        {
          line: 6,
          colSpan: "md:col-span-1",
          nome: "Estado",
          chave: "estado",
          tipo: "text",
          mensagem: "Digite o estado",
          obrigatorio: true,
          bloqueado: !auth.isAluno(),
        },
        {
          line: 6,
          colSpan: "md:col-span-1",
          nome: "Número",
          chave: "numero",
          tipo: "text",
          mensagem: "Digite o numero",
          obrigatorio: true,
          bloqueado: !auth.isAluno(),
        },
        {
          line: 6,
          colSpan: "md:col-span-1",
          nome: "Complemento",
          chave: "complemento",
          tipo: "text",
          mensagem: "Digite o complemento",
          obrigatorio: false,
          bloqueado: !auth.isAluno(),
        },
        {
          line: 7,
          colSpan: "md:col-span-1",
          nome: "Contato Familiar",
          chave: "contatoFamilia",
          tipo: "text",
          mensagem: "Digite o contato familiar",
          obrigatorio: isCreateMode,
          bloqueado: !auth.isAluno(),
          mascara: "celular",
        },
        {
          line: 7,
          colSpan: "md:col-span-1",
          nome: "É portador de Deficiência",
          chave: "deficiente",
          tipo: "select",
          selectOptions: [
            { chave: true, valor: "Sim" },
            { chave: false, valor: "Não" },
          ],
          mensagem: "Selecione a opção",
          obrigatorio: isCreateMode,
          bloqueado: !auth.isAluno(),
          mascara: "valor",
        },
        {
          line: 7,
          colSpan: "md:col-span-1",
          nome: "Se sim, qual deficiência",
          chave: "tipoDeficiencia",
          tipo: "text",
          mensagem: "Qual o tipo da deficiência",
          obrigatorio: isDeficiente,
          bloqueado: !auth.isAluno(),
        }
      ],
      acoes: auth.isAluno() ? [
        { nome: "Cancelar", chave: "voltar", tipo: "botao" },
        { nome: isEditMode ? "Salvar" : "Cadastrar", chave: "salvar", tipo: "submit" },
      ] :
        [],
    },
  };

  const estruturaDadosBancarios: any = {
    uri: "dadosBancarios",
    cabecalho: {
      titulo: isEditMode ? "Editar Dados Bancários" : "Cadastrar Dados Bancários",
      migalha: [
        { nome: 'Home', link: '/home' },
        { nome: 'Prae', link: '/prae' },
        { nome: 'Dados Bancários', link: '/prae/dados-bancarios' },
        {
          nome: isEditMode ? "Editar" : "Criar",
          link: `/prae/dados-bancarios/${isEditMode ? id : "criar"}`,
        },
      ],
    },
    cadastro: {
      campos: [
        {
          line: 1,
          colSpan: "md:col-span-1",
          nome: "Titular",
          chave: "nomeTitular",
          tipo: "text",
          mensagem: "Digite",
          obrigatorio: true,
        },
        {
          line: 1,
          colSpan: "md:col-span-1",
          nome: "Banco",
          chave: "banco",
          tipo: "text",
          mensagem: "Digite",
          obrigatorio: true,
        },
        {
          line: 1,
          colSpan: "md:col-span-1",
          nome: "Tipo de Conta",
          chave: "tipoConta",
          tipo: "text",
          mensagem: "Digite",
          obrigatorio: true,
        },
        {
          line: 2,
          colSpan: "md:col-span-1",
          nome: "Conta Bancária",
          chave: "conta",
          tipo: "text",
          mensagem: "Digite",
          obrigatorio: true,
        },
        {
          line: 2,
          colSpan: "md:col-span-1",
          nome: "Agencia Bancária",
          chave: "agencia",
          tipo: "text",
          mensagem: "Digite",
          obrigatorio: true,
        },
      ],
      acoes: auth.isGestor() ? [
        { nome: "Cancelar", chave: "voltar", tipo: "botao" },
        { nome: dadosPreenchidos?.dadosBancarios ? "Salvar" : "Cadastrar", chave: "salvarDadosBancarios", tipo: "submit" }
      ] :
        [{ nome: "Voltar", chave: "voltar", tipo: "botao" }],
    },
  };

  // Sincroniza isDeficiente com o valor selecionado em dadosPreenchidos.deficiente
  useEffect(() => {
    setIsDeficiente(
      dadosPreenchidos.deficiente === true ||
      dadosPreenchidos.deficiente === "true"
    );
  }, [dadosPreenchidos.deficiente]);

  // Filtra os campos 'tipoDeficiencia' e 'laudo' com base em isDeficiente
  const camposFiltrados = estrutura.cadastro.campos.filter((campo: any) => {
    if (campo.chave === "tipoDeficiencia" || campo.chave === "laudo") {
      return isDeficiente;
    }
    return true;
  });

  const currentUser = async (params = null) => {
    try {
      let body = {
        metodo: 'get',
        uri: '/auth/aluno/current',
        params: params != null ? params : { size: 25, page: 0 },
        data: {}
      };
      const response = await generica(body);
      if (response && response.data) {
        response.data.curso = response.data.curso.nome;
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
      case "salvarDadosBancarios":
        await salvarRegistroDadosBancarios(valor);
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
    if (auth.isAluno())
      router.push("/prae");
    else
      router.push("/prae/estudantes");
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
  }

  const transformarDados = (item: any) => {
    const { cep, rua, complemento, numero, bairro, cidade, estado, rendaPercapta, ...rest } = item;
    return {
      ...rest,
      endereco: { cep, rua, complemento, numero, bairro, cidade, estado },
      rendaPercapta: Number(rendaPercapta)
    };
  };

  // Substitui chamada direta: só busca quando cepParaBusca definido pelo usuário
  const endereco = useEnderecoByCep(cepParaBusca);

  useEffect(() => {
    const cepAtual = dadosPreenchidos?.cep;
    if (!cepAtual) return;
    if (initialCep === null) {
      // Primeira vez que recebemos um CEP (carregamento de dados)
      setInitialCep(cepAtual);
      // Em modo criação podemos já buscar; em edição não buscamos ainda
      if (isCreateMode) setCepParaBusca(cepAtual);
      return;
    }
    // Se usuário alterou o CEP (diferente do inicial) disparamos busca
    if (cepAtual !== initialCep) {
      setCepParaBusca(cepAtual);
    }
  }, [dadosPreenchidos?.cep, initialCep, isCreateMode]);

  useEffect(() => {
    if (endereco) {
      setDadosPreenchidos((prev: any) => ({
        ...prev,
        endereco: {
          ...prev.endereco,
          cep: endereco.cep || prev.endereco?.cep || '',
          rua: prev.endereco?.rua || '',
          bairro: endereco.bairro || prev.endereco?.bairro || '',
          cidade: prev.endereco?.cidade || '',
          estado: endereco.estado || prev.endereco?.estado || '',
          complemento: prev.endereco?.complemento || '',
          numero: prev.endereco?.numero || '',
        }
      }));
    }
  }, [endereco]);

  const salvarRegistro = async (item: any) => {
  try {
    if (!checarObrigatorios()) return;
    
    let dataToSend: any = transformarDados(item);
    let useMultiForm = false;

    if (isCreateMode) {
      const formData = new FormData();
      formData.append(
        "dados",
        new Blob([JSON.stringify(dataToSend)], { type: "application/json" })
      );
      dataToSend = formData;
      useMultiForm = true;
    }

    const body = {
      metodo: isEditMode ? "patch" : "post",
      uri: "/prae/" + estrutura.uri,
      params: {},
      data: dataToSend,
    };

    const response = useMultiForm ? await genericaMultiForm(body) : await generica(body);
    
    if (!response || response.status < 200 || response.status >= 300) {
      toast.error(`Erro na requisição (HTTP ${response?.status || "desconhecido"})`, { 
        position: "top-left" 
      });
      return;
    }

    if (response.data?.errors) {
      Object.keys(response.data.errors).forEach((campoErro) => {
        toast.error(`Erro em ${campoErro}: ${response.data.errors[campoErro]}`, {
          position: "top-left",
        });
      });
    } else if (response.data?.error) {
      toast.error(response.data.error.message || response.data.error, { 
        position: "top-left" 
      });
    } else {
      Swal.fire({
        title: "Aluno registrado com sucesso!",
        icon: "success",
        confirmButtonText: "OK"
      }).then(() => {
        if (auth.isAluno()) {
          router.push("/prae");
        } else {
          router.push("/prae/estudantes");
        }
      });
    }
  } catch (error) {
    console.error("DEBUG: Erro ao salvar registro:", error);
    toast.error("Erro ao salvar registro. Tente novamente!", { 
      position: "top-left" 
    });
  }
};

  const salvarRegistroDadosBancarios = async (item: any) => {
    try {
      const dataToSend = dadosBancariosPreenchidos;
      const body = {
        metodo: `${dadosPreenchidos?.dadosBancarios ? "patch" : "post"}`,
        uri: "/prae/" + `${dadosPreenchidos?.dadosBancarios ? estruturaDadosBancarios.uri + "/" + item.id : estruturaDadosBancarios.uri + "/" + dadosPreenchidos.id}`,
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
          title: "Dados bancarios salvo com sucesso!",
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
      let uri;
      if (auth.isAluno()) {
        uri = '/prae/estudantes/current';
      } else {
        uri = `/prae/${estrutura.uri}/${item}`;
      }
      
      const body = {
        metodo: "get",
        uri: uri,
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
          nome: response.data.aluno.nome,
          nomeSocial: response.data.aluno.nomeSocial,
          email: response.data.aluno.email,
          cpf: response.data.aluno.cpf,
          matricula: response.data.aluno.matricula,
          curso: response.data.aluno.curso.nome,
          telefone: response.data.aluno.telefone,
          rendaPercapta: response.data.rendaPercapta,
          cep: response.data.endereco.cep,
          rua: response.data.endereco.rua,
          cidade: response.data.endereco.cidade,
          estado: response.data.endereco.estado,
          numero: response.data.endereco.numero,
          complemento: response.data.endereco.complemento,
          bairro: response.data.endereco.bairro,
          deficiente: response.data.deficiente,
          tipoDeficiencia: response.data.tipoDeficiencia,
        });
        setIsDeficiente(response.data.deficiente);
        if (response.data?.dadosBancarios) {
          setDadosBancariosPreenchidos(response.data.dadosBancarios);
        }
      }
    } catch (error) {
      console.error("DEBUG: Erro ao localizar registro:", error);
      toast.error("Erro ao localizar registro. Tente novamente!", { position: "top-left" });
    }
  };

  useEffect(() => {
    // Wait for auth to load
    if (auth.isLoading) return;
    if (isEditMode) {
      if (!auth.isAluno() && !id)
        chamarFuncao("voltar");
      else if (auth.isAluno())
        chamarFuncao("editar", "current");
      else
        chamarFuncao("editar", id);
    } else {
      currentUser();
    }
  }, [id, auth.isLoading]);

  return (
    <main className="flex flex-wrap justify-center mx-auto">
      <div className="w-full md:w-11/12 lg:w-10/12 2xl:w-3/4 max-w-6xl p-4 pt-10 md:pt-12 md:pb-12">
        <Cabecalho dados={estrutura.cabecalho} />
        <Cadastro
          estrutura={{
            ...estrutura,
            cadastro: {
              ...estrutura.cadastro,
              campos: camposFiltrados
            }
          }}
          dadosPreenchidos={dadosPreenchidos}
          setDadosPreenchidos={setDadosPreenchidos}
          chamarFuncao={chamarFuncao}
        />
        {/* Auto-complete endereço via CEP (reutilizável) */}
        <EnderecoFields
          cepValue={dadosPreenchidos?.cep || ''}
          values={dadosPreenchidos}
          onFieldChange={(name, value) =>
            setDadosPreenchidos((prev: any) => ({ ...prev, [name]: value }))
          }
          disabled={!auth.isAluno()}
        />
        {auth.isGestor() && (
          <div className="mt-10">
            <h2 className='text-3xl'>Dados Bancários</h2>
            <Cadastro
              estrutura={estruturaDadosBancarios}
              dadosPreenchidos={dadosBancariosPreenchidos}
              setDadosPreenchidos={setDadosBancariosPreenchidos}
              chamarFuncao={chamarFuncao}
            />
          </div>
        )}
      </div>
    </main>
  );
};

export default withAuthorization(cadastro);
