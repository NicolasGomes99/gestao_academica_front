"use client";
import withAuthorization from "@/components/AuthProvider/withAuthorization";
import Cadastro from "@/components/Cadastro/Estrutura";
import Cabecalho from "@/components/Layout/Interno/Cabecalho";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { generica } from "@/utils/api";

const CadastroTipoAtendimento = () => {
  const router = useRouter();
  const { id } = useParams();
  const [dadosPreenchidos, setDadosPreenchidos] = useState<any>({
    endereco: {},
    horarios: []
  });
  const [horariosDisponiveis, setHorariosDisponiveis] = useState<any[]>([]);
  const isEditMode = id && id !== "criar";

  // Gera horários com base no tempo de atendimento
  // resetarSelecionados: controla se deve limpar os horários já escolhidos
  const gerarHorariosDisponiveis = (tempoAtendimento: string, resetarSelecionados: boolean = true) => {
    if (!tempoAtendimento || !tempoAtendimento.match(/^[0-9]{2}:[0-9]{2}$/)) {
      setHorariosDisponiveis([]);
      return;
    }

    const [horasStr, minutosStr] = tempoAtendimento.split(":");
    const horas = parseInt(horasStr, 10);
    const minutos = parseInt(minutosStr, 10);
    const intervaloMinutos = horas * 60 + minutos;

    if (intervaloMinutos <= 0) {
      setHorariosDisponiveis([]);
      return;
    }

    const novosHorarios = [];
    const horaInicio = 8; // 08:00
    const horaFim = 16;   // 16:00

    for (let minutosTotais = horaInicio * 60; minutosTotais <= horaFim * 60; minutosTotais += intervaloMinutos) {
      const h = Math.floor(minutosTotais / 60);
      const m = minutosTotais % 60;
      const horaFormatada = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

      novosHorarios.push({
        chave: horaFormatada,
        valor: horaFormatada,
      });
    }

    setHorariosDisponiveis(novosHorarios);

    if (resetarSelecionados) {
      setDadosPreenchidos((prev: { [key: string]: any }) => ({
        ...prev,
        horarios: [],
      }));
    }
  };

  // Atualiza horários quando o tempo de atendimento muda manualmente
  useEffect(() => {
    if (dadosPreenchidos.tempoAtendimento) {
      gerarHorariosDisponiveis(dadosPreenchidos.tempoAtendimento, true);
    } else {
      setHorariosDisponiveis([]);
    }
  }, [dadosPreenchidos.tempoAtendimento]);

  const estrutura: any = {
    uri: "tipo-atendimento",
    cabecalho: {
      titulo: isEditMode ? "Editar Tipo de Atendimento" : "Cadastrar Tipo de Atendimento",
      migalha: [
        { nome: "Home", link: "/home" },
        { nome: "Prae", link: "/prae" },
        { nome: "Tipo de Atendimento", link: "/prae/agendamentos/tipo" },
        {
          nome: isEditMode ? "Editar" : "Criar",
          link: `/prae/agendamentos/tipo/${isEditMode ? id : "criar"}`,
        },
      ],
    },
    cadastro: {
      campos: [
        {
          line: 1,
          colSpan: "md:col-span-1",
          nome: "Tipo de Atendimento",
          chave: "nome",
          tipo: "text",
          mensagem: "Digite o tipo de atendimento",
          obrigatorio: true,
        },
        {
          line: 1,
          colSpan: "md:col-span-1",
          nome: "Tempo de Atendimento",
          chave: "tempoAtendimento",
          tipo: "text",
          mensagem: "Digite no padrão hh:mm",
          mascara: "hora",
          obrigatorio: true,
        },
        {
          line: 1,
          colSpan: "md:col-span-1",
          nome: "Horários",
          chave: "horarios",
          tipo: "multi-select",
          selectOptions: horariosDisponiveis,
          mensagem: "Selecione os horários",
          obrigatorio: true,
        },
      ],
      acoes: [
        { nome: "Cancelar", chave: "voltar", tipo: "botao" },
        { nome: isEditMode ? "Salvar" : "Cadastrar", chave: "salvar", tipo: "submit" },
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
        editarRegistro(valor);
        break;
      default:
        break;
    }
  };

  const voltarRegistro = () => {
    router.push("/prae/agendamentos/tipo");
  };

  const salvarRegistro = async (item: any) => {
    // Validação do campo nome (Tipo de Atendimento)
    if (!item.nome || item.nome.trim().length < 1 || item.nome.trim().length > 100) {
      toast.error("O campo 'Tipo de Atendimento' deve ter entre 1 e 100 caracteres.", {
        position: "top-left",
      });
      return;
    }

    // Validação do tempo de atendimento
    if (!item.tempoAtendimento || !item.tempoAtendimento.match(/^[0-9]{2}:[0-9]{2}$/)) {
      toast.error("Formato de tempo inválido. Use hh:mm", {
        position: "top-left",
      });
      return;
    }

    // Verifica se há horários selecionados
    if (!item.horarios || item.horarios.length === 0) {
      toast.error("Selecione pelo menos um horário", {
        position: "top-left",
      });
      return;
    }

    try {
      const { id, ...dadosParaEnviar } = item;

      const body = {
        metodo: `${isEditMode ? "patch" : "post"}`,
        uri: "/prae/" + `${isEditMode ? estrutura.uri + "/" + id : estrutura.uri}`,
        params: {},
        data: dadosParaEnviar,
      };

      const response = await generica(body);

      if (!response || response.status < 200 || response.status >= 300) {
        toast.error(`Erro na requisição (HTTP ${response?.status || "desconhecido"})`, {
          position: "top-left",
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
        toast.error(response.data.error.message, { position: "top-left" });
      } else {
        Swal.fire({
          title: "Sucesso!",
          text: "Tipo de atendimento salvo com sucesso",
          icon: "success",
          confirmButtonText: "OK",
          confirmButtonColor: "#972E3F",
        }).then(() => {
          chamarFuncao("voltar");
        });
      }
    } catch (error) {
      console.error("Erro ao salvar registro:", error);
      toast.error("Erro ao salvar registro. Tente novamente!", {
        position: "top-left",
      });
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

      if (!response) throw new Error("Resposta inválida do servidor");

      if (response.data?.errors) {
        Object.keys(response.data.errors).forEach((campoErro) => {
          toast.error(`Erro em ${campoErro}: ${response.data.errors[campoErro]}`, {
            position: "top-left",
          });
        });
      } else {
        const dados = response.data;

        const dadosFormatados = {
          ...dados,
          tempoAtendimento: dados.tempoAtendimento?.slice(0, 5) || "",
          horarios: Array.isArray(dados.horarios)
            ? dados.horarios.map((h: string) => h.slice(0, 5))
            : [],
        };

        // Primeiro gera os horários disponíveis sem resetar
        if (dadosFormatados.tempoAtendimento) {
          gerarHorariosDisponiveis(dadosFormatados.tempoAtendimento, false);
        }

        // Depois aplica os dados preenchidos
        setDadosPreenchidos(dadosFormatados);
      }
    } catch (error) {
      console.error("Erro ao carregar registro:", error);
      toast.error("Erro ao carregar registro. Tente novamente!", {
        position: "top-left",
      });
    }
  };

  useEffect(() => {
    if (isEditMode) {
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

export default withAuthorization(CadastroTipoAtendimento);
