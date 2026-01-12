"use client"; 
import withAuthorization from "@/components/AuthProvider/withAuthorization"; 
import Cadastro from "@/components/Cadastro/Estrutura"; 
import Cabecalho from "@/components/Layout/Interno/Cabecalho"; 
import Calendar from "@/components/CalendarioCronograma/calendar"; 
import { useParams, useRouter } from "next/navigation"; 
import { useEffect, useState } from "react"; 
import { toast } from "react-toastify"; 
import Swal from "sweetalert2"; 
import { generica } from "@/utils/api";  

interface TipoAtendimento { 
  chave: number; 
  valor: string; 
} 

interface CronogramaData { 
  id?: number; 
  datas: string[]; // sempre em formato ISO (YYYY-MM-DD) 
  tipoAtendimentoId: number; 
  modalidade: "PRESENCIAL" | "REMOTO"; 
  endereco?: any; 
} 

interface CronogramaExistente { 
  id: number; 
  data: string; // Formato ISO (YYYY-MM-DD)
  tipoAtendimentoId: number; 
  modalidade: "PRESENCIAL" | "REMOTO"; 
} 

// Converte de DD/MM/YYYY para YYYY-MM-DD 
const convertToISODate = (brDate: string): string => { 
  if (!brDate || !brDate.includes("/")) return ""; 
  
  const [dia, mes, ano] = brDate.split("/"); 
  return `${ano}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`; 
}; 

// Converte de YYYY-MM-DD para DD/MM/YYYY 
const formatDateToAPI = (dateString: string): string => { 
  if (!dateString || typeof dateString !== "string") return ""; 
  
  const [year, month, day] = dateString.split("-").map(Number); 
  const date = new Date(year, month - 1, day); 
  if (isNaN(date.getTime())) throw new Error(`Data inválida: ${dateString}`); 
  
  const dia = String(date.getDate()).padStart(2, "0"); 
  const mes = String(date.getMonth() + 1).padStart(2, "0"); 
  const ano = date.getFullYear(); 
  
  return `${dia}/${mes}/${ano}`; 
}; 

const parseDateLocal = (isoDate: string): Date => { 
  const [year, month, day] = isoDate.split("-").map(Number); 
  return new Date(year, month - 1, day); 
}; 

const cadastro = () => { 
  const router = useRouter(); 
  const { id } = useParams(); 
  const [dadosPreenchidos, setDadosPreenchidos] = useState<CronogramaData>({ 
    datas: [], 
    tipoAtendimentoId: 0, 
    modalidade: "PRESENCIAL",
  }); 
  const [tiposAtendimento, setTiposAtendimento] = useState<TipoAtendimento[]>([]); 
  const [cronogramasExistentes, setCronogramasExistentes] = useState<CronogramaExistente[]>([]); 
  const [cronogramaOriginal, setCronogramaOriginal] = useState<CronogramaData | null>(null); 
  const isEditMode = id && id !== "criar"; 

  const fetchTiposAtendimento = async () => { 
    console.log("Buscando tipos de atendimento..."); 
    try { 
      const response = await generica({ 
        metodo: "get", 
        uri: "/prae/tipo-atendimento", 
        params: {}, 
      }); 

      console.log("Resposta recebida:", response); 
      const tipos = response?.data?.data || response?.data?.content || []; 

      setTiposAtendimento( 
        tipos.map((tipo: any) => ({ 
          chave: tipo.id, 
          valor: tipo.nome, 
        })) 
      ); 
    } catch (error) { 
      console.error("Erro ao buscar tipos de atendimento:", error); 
    } 
  }; 

  const fetchCronogramasExistentes = async () => { 
    try { 
      const response = await generica({ 
        metodo: "get", 
        uri: "/prae/cronograma", 
        params: {}, 
      }); 

      const cronogramas = response?.data?.data || response?.data?.content || []; 

      const cronogramasFormatados: CronogramaExistente[] = cronogramas.map((cronograma: any) => { 
        // Garantir que a data esteja sempre em formato ISO
        let dataISO = cronograma.data;
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(cronograma.data)) {
          dataISO = convertToISODate(cronograma.data);
        }
        
        return {
          id: cronograma.id,
          data: dataISO,
          tipoAtendimentoId: cronograma.tipoAtendimento?.id || cronograma.tipoAtendimentoId,
          modalidade: cronograma.modalidade || "PRESENCIAL",
        };
      }); 

      setCronogramasExistentes(cronogramasFormatados); 
    } catch (error) { 
      console.error("Erro ao buscar cronogramas existentes:", error); 
    } 
  }; 

  const estrutura = { 
    uri: "cronograma", 
    cabecalho: { 
      titulo: isEditMode ? "Editar Cronograma" : "Cadastrar Cronograma", 
      migalha: [ 
        { nome: "Home", link: "/home" }, 
        { nome: "Prae", link: "/prae" }, 
        { nome: "Cronogramas", link: "/prae/agendamentos/cronograma" }, 
        { 
          nome: isEditMode ? "Editar" : "Criar", 
          link: `/prae/agendamentos/cronograma/${isEditMode ? id : "criar"}`, 
        }, 
      ], 
    }, 
    cadastro: { 
      campos: [], 
      acoes: [ 
        { nome: "Cancelar", chave: "voltar", tipo: "botao" }, 
        { nome: isEditMode ? "Salvar" : "Cadastrar", chave: "salvar", tipo: "submit" }, 
      ], 
    }, 
  }; 

  const handleDateChange = (diasSelecionados: string[]) => { 
    setDadosPreenchidos((prev) => ({ 
      ...prev, 
      datas: diasSelecionados, 
    })); 
  }; 

  const verificarCronogramaExistente = (data: string, tipoAtendimentoId: number, modalidade: "PRESENCIAL" | "REMOTO"): boolean => { 
    if (!tipoAtendimentoId) return false;
    
    return cronogramasExistentes.some(cronograma => {
      // Verifica se já existe cronograma com mesma data, mesmo tipo e mesma modalidade
      const conflito = cronograma.data === data && 
                      cronograma.tipoAtendimentoId === tipoAtendimentoId &&
                      cronograma.modalidade === modalidade;
      
      // Em modo edição, ignora os registros que fazem parte do cronograma original
      if (isEditMode && cronogramaOriginal) {
        const pertenceAoOriginal = cronogramaOriginal.datas.includes(data) && 
                                  cronogramaOriginal.tipoAtendimentoId === tipoAtendimentoId &&
                                  cronogramaOriginal.modalidade === modalidade;
        if (pertenceAoOriginal) return false;
      }
      
      return conflito;
    }); 
  }; 

  const verificarConflitos = (): string[] => {
    const conflitos: string[] = [];
    
    if (!dadosPreenchidos.tipoAtendimentoId) return conflitos;

    dadosPreenchidos.datas.forEach(data => {
      if (verificarCronogramaExistente(data, dadosPreenchidos.tipoAtendimentoId, dadosPreenchidos.modalidade)) {
        const dataFormatada = parseDateLocal(data).toLocaleDateString("pt-BR");
        conflitos.push(dataFormatada);
      }
    });

    return conflitos;
  };

  const chamarFuncao = async (nomeFuncao = "", valor: any = null) => { 
    try { 
      switch (nomeFuncao) { 
        case "salvar": 
          await salvarRegistro(); 
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
    } catch (error) { 
      console.error(`Erro na função ${nomeFuncao}:`, error); 
    } 
  }; 

  const voltarRegistro = () => { 
    router.push("/prae/agendamentos/cronograma"); 
  }; 

  const salvarRegistro = async () => { 
  if (!dadosPreenchidos.tipoAtendimentoId) { 
    toast.error("Selecione um tipo de atendimento"); 
    return; 
  } 

  if (!dadosPreenchidos.modalidade) { 
    toast.error("Selecione uma modalidade de atendimento"); 
    return; 
  } 

  if (dadosPreenchidos.datas.length === 0) { 
    toast.error("Selecione pelo menos uma data no calendário"); 
    return; 
  } 

  const conflitos = verificarConflitos();

  if (conflitos.length > 0) { 
    toast.error(`Já existem cronogramas com o mesmo tipo e modalidade para as seguintes datas: ${conflitos.join(", ")}`); 
    return; 
  } 

  try { 
    if (isEditMode) { 
      // MODO EDIÇÃO: Atualizar completamente o cronograma
      const datasOriginais = cronogramaOriginal?.datas || [];
      const novasDatas = dadosPreenchidos.datas.filter(data => !datasOriginais.includes(data));
      const datasRemovidas = datasOriginais.filter(data => !dadosPreenchidos.datas.includes(data));

      for (const data of datasRemovidas) {
        const cronogramaParaRemover = cronogramasExistentes.find(c => 
          c.data === data && 
          c.tipoAtendimentoId === cronogramaOriginal?.tipoAtendimentoId &&
          c.modalidade === cronogramaOriginal?.modalidade
        );
        
        if (cronogramaParaRemover) {
          await generica({
            metodo: "delete",
            uri: `/prae/${estrutura.uri}/${cronogramaParaRemover.id}`,
            params: {},
          });
        }
      }

      // Depois criar novos registros para as datas adicionadas
      if (novasDatas.length > 0) {
        const payload = {
          datas: novasDatas.map(formatDateToAPI),
          tipoAtendimentoId: Number(dadosPreenchidos.tipoAtendimentoId),
          modalidade: dadosPreenchidos.modalidade,
        };
        
        console.log("POST - Criando novas datas, payload:", payload);
        
        await generica({
          metodo: "post",
          uri: `/prae/${estrutura.uri}`,
          params: {},
          data: payload,
        });
      }

      // Atualizar modalidade ou tipo se mudou
      if (dadosPreenchidos.tipoAtendimentoId !== cronogramaOriginal?.tipoAtendimentoId || 
          dadosPreenchidos.modalidade !== cronogramaOriginal?.modalidade) {
        const datasRestantes = dadosPreenchidos.datas.filter(data => !novasDatas.includes(data));
        
        for (const data of datasRestantes) {
          const cronogramaParaAtualizar = cronogramasExistentes.find(c => 
            c.data === data && 
            c.tipoAtendimentoId === cronogramaOriginal?.tipoAtendimentoId &&
            c.modalidade === cronogramaOriginal?.modalidade
          );
          
          if (cronogramaParaAtualizar) {
            const payload = {
              data: formatDateToAPI(data),
              tipoAtendimentoId: Number(dadosPreenchidos.tipoAtendimentoId),
              modalidade: dadosPreenchidos.modalidade,
            };
            
            console.log(`PATCH - Atualizando ID ${cronogramaParaAtualizar.id}, payload:`, payload);
            
            await generica({
              metodo: "patch",
              uri: `/prae/${estrutura.uri}/${cronogramaParaAtualizar.id}`,
              params: {},
              data: payload,
            });
          }
        }
      }
    } else { 
      // MODO CRIAÇÃO: Criar todos os registros de uma vez 
      const payloadData = {
        datas: dadosPreenchidos.datas.map(formatDateToAPI),
        tipoAtendimentoId: Number(dadosPreenchidos.tipoAtendimentoId),
        modalidade: dadosPreenchidos.modalidade,
      };
      
      console.log("POST - Criando cronograma, payload:", payloadData);
      console.log("Modalidade antes de enviar:", dadosPreenchidos.modalidade);
      
      await generica({ 
        metodo: "post", 
        uri: `/prae/${estrutura.uri}`, 
        params: {}, 
        data: payloadData,
      }); 
    } 

    Swal.fire({ 
      title: "Sucesso!", 
      text: `Cronograma ${isEditMode ? "atualizado" : "criado"} com sucesso.`, 
      icon: "success", 
      confirmButtonColor: "#972E3F",
    }).then(() => { 
      router.push("/prae/agendamentos/cronograma"); 
    }); 
  } catch (error: any) { 
    console.error("Erro ao salvar registro:", error); 
    toast.error("Erro ao salvar o registro."); 
  } 
}; 

  const editarRegistro = async (item: any) => { 
    try { 
      const response = await generica({ 
        metodo: "get", 
        uri: `/prae/${estrutura.uri}/${item}`, 
        params: {}, 
      }); 

      if (!response) throw new Error("Resposta inválida do servidor"); 

      const dados = response.data; 

      let dataFormatada: string = ""; 

      if (dados.data) { 
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(dados.data)) { 
          dataFormatada = convertToISODate(dados.data); 
        } else if (/^\d{4}-\d{2}-\d{2}$/.test(dados.data)) { 
          dataFormatada = dados.data; 
        } 
      } 

      // Buscar todos os cronogramas do mesmo tipo e modalidade para preencher as datas 
      const cronogramasDoMesmoTipo = cronogramasExistentes.filter(c => 
        c.tipoAtendimentoId === dados.tipoAtendimento?.id &&
        c.modalidade === (dados.modalidade || "PRESENCIAL")
      ); 

      const datasDoCronograma = cronogramasDoMesmoTipo.map(c => c.data); 

      const dadosCronograma = { 
        tipoAtendimentoId: dados.tipoAtendimento?.id || 0,
        modalidade: dados.modalidade || "PRESENCIAL",
        datas: dataFormatada ? [dataFormatada, ...datasDoCronograma.filter(d => d !== dataFormatada)] : datasDoCronograma, 
      }; 

      setDadosPreenchidos(dadosCronograma); 
      setCronogramaOriginal(dadosCronograma); 

    } catch (error: any) { 
      console.error("Erro ao localizar registro:", error); 
      toast.error("Erro ao carregar dados para edição."); 
    } 
  }; 

  useEffect(() => { 
    fetchTiposAtendimento(); 
    fetchCronogramasExistentes(); 
    if (isEditMode && id) { 
      chamarFuncao("editar", id); 
    } 
  }, [id]); 

  // Atualizar verificação de conflitos quando dados mudam
  useEffect(() => {
    if (dadosPreenchidos.tipoAtendimentoId && dadosPreenchidos.datas.length > 0) {
      const conflitos = verificarConflitos();
      if (conflitos.length > 0) {
        // Feedback visual imediato para o usuário
        console.log("Conflitos detectados:", conflitos);
      }
    }
  }, [dadosPreenchidos.tipoAtendimentoId, dadosPreenchidos.datas, dadosPreenchidos.modalidade]);

  return ( 
    <main className="flex flex-wrap justify-center mx-auto"> 
      <div className="w-full md:w-11/12 lg:w-10/12 2xl:w-3/4 max-w-6xl p-4 pt-10 md:pt-12 md:pb-12"> 
        <Cabecalho dados={estrutura.cabecalho} /> 

        <div className="mb-6"> 
          <label className="block font-bold mb-2">Tipo de Atendimento</label> 
          <select 
            className="w-full border rounded p-2" 
            value={dadosPreenchidos.tipoAtendimentoId || ""} 
            onChange={(e) => 
              setDadosPreenchidos((prev) => ({ 
                ...prev, 
                tipoAtendimentoId: Number(e.target.value), 
              })) 
            } 
          > 
            <option value="">Selecione...</option> 
            {tiposAtendimento.map((tipo) => ( 
              <option key={tipo.chave} value={tipo.chave}> 
                {tipo.valor} 
              </option> 
            ))} 
          </select> 
        </div>

        <div className="mb-6">
          <label className="block font-bold mb-2">Modalidade de Atendimento</label>
          <select
            className="w-full border rounded p-2"
            value={dadosPreenchidos.modalidade}
            onChange={(e) =>
              setDadosPreenchidos((prev) => ({
                ...prev,
                modalidade: e.target.value as "PRESENCIAL" | "REMOTO",
              }))
            }
          >
            <option value="">Selecione...</option>
            <option value="PRESENCIAL">Presencial</option>
            <option value="REMOTO">Remoto</option>
          </select>
        </div>

        <div className="mb-6"> 
          <label className="block font-bold mb-2"> 
            {isEditMode ? "Datas do Cronograma (Editar)" : "Datas de Atendimento"} 
          </label> 
          {isEditMode && ( 
            <p className="text-sm text-gray-600 mb-3"> 
              <strong>Modo edição:</strong> Você pode adicionar ou remover datas deste cronograma. 
              A data original está marcada e você pode selecionar datas adicionais. 
            </p> 
          )} 

          <div className="mb-6 border rounded-lg p-4 bg-white shadow-sm"> 
            <Calendar 
              selectedDates={dadosPreenchidos.datas} 
              onChange={handleDateChange} 
            /> 
          </div> 

          {dadosPreenchidos.datas.length > 0 && ( 
            <div className="mt-4 p-3 bg-gray-50 rounded"> 
              <p className="font-medium mb-2"> 
                {isEditMode ? "Datas do cronograma:" : "Datas selecionadas:"} 
              </p> 
              <div className="flex flex-wrap gap-2"> 
                {dadosPreenchidos.datas.map((date, index) => { 
                  const isDataOriginal = cronogramaOriginal?.datas.includes(date); 
                  const existeConflito = verificarCronogramaExistente(date, dadosPreenchidos.tipoAtendimentoId, dadosPreenchidos.modalidade); 

                  return ( 
                    <span 
                      key={index} 
                      className={`px-3 py-1 rounded-full text-sm ${existeConflito 
                          ? "bg-red-100 text-red-800 border border-red-300" 
                          : isDataOriginal 
                            ? "bg-green-100 text-green-800 border border-green-300" 
                            : "bg-blue-100 text-blue-800" 
                        }`} 
                    > 
                      {parseDateLocal(date).toLocaleDateString("pt-BR")} 
                      {isDataOriginal && " (Original)"} 
                      {existeConflito && " (Conflito)"} 
                    </span> 
                  ); 
                })} 
              </div> 
            </div> 
          )} 
        </div> 

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