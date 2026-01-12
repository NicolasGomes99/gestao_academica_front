"use client";
import withAuthorization from '@/components/AuthProvider/withAuthorization';
import Calendar from '@/components/Calendar/calendar';
import Cabecalho from '@/components/Layout/Interno/Cabecalho';
import { useRole } from '@/context/roleContext';
import { generica } from '@/utils/api';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

interface TipoAtendimento {
  id: number;
  nome: string;
  tempoAtendimento: string;
  horarios: string[];
}

interface DaySlot {
  id: number;
  horario: string;
  userScheduled: boolean;
  agendamentoId?: number | null;
}

interface MonthCronograma {
  data: string;
  slots: DaySlot[];
  tipoAtendimentoId: number;
  tipoAtendimentoNome: string;
   modalidade: "PRESENCIAL" | "REMOTO";
}

const transformCronogramas = (data: any[]): MonthCronograma[] => {
  return data.map(item => ({
    data: item.data ? item.data.split('-').reverse().join('/') : '',
    modalidade: item.modalidade || "PRESENCIAL",
    slots: (item.vagas || []).map((vaga: any) => {
      const agendamento = (item.agendamentos || []).find((a: any) => a.vaga.id === vaga.id);
      return {
        id: vaga.id,
        horario: vaga.horaInicio,
        userScheduled: !vaga.disponivel,
        agendamentoId: agendamento ? agendamento.id : null
      };
    }),
    tipoAtendimentoId: item.tipoAtendimento?.id,
    tipoAtendimentoNome: item.tipoAtendimento?.nome
  }));
};


const estrutura = {
  uri: "agendamento",
  cabecalho: {
    titulo: "Calendário de Agendamentos",
    migalha: [
      { nome: 'Home', link: '/home' },
      { nome: 'Prae', link: '/prae' },
      { nome: 'Agendamento', link: '/prae/agendamentos/calendario' },
    ]
  }
};

const PageLista = () => {
  const router = useRouter();
  const { activeRole } = useRole();
  const [tiposAtendimento, setTiposAtendimento] = useState<TipoAtendimento[]>([]);
  const [cronogramas, setCronogramas] = useState<MonthCronograma[]>([]);
  const [tipoFiltro, setTipoFiltro] = useState<number | ''>('');
  const [filtroVagas, setFiltroVagas] = useState<'todas' | 'disponiveis' | 'agendadas'>('todas');
  const [showModal, setShowModal] = useState(true);

  const isPrivileged = activeRole;

  useEffect(() => {
    carregarTiposAtendimento();
  }, []);

  const carregarTiposAtendimento = async () => {
    try {
      const body = {
        metodo: 'get',
        uri: '/prae/tipo-atendimento',
        params: { size: 100, page: 0 },
        data: {}
      };
      const response = await generica(body);
      if (response?.data?.content) {
        setTiposAtendimento(response.data.content);
      } else {
        toast.error("Erro ao carregar tipos de atendimento");
      }
    } catch (err) {
      toast.error("Erro inesperado ao buscar tipos de atendimento.");
      console.error(err);
    }
  };

  const carregarCronogramas = async (tipoId: number) => {
    try {
      const body = {
        metodo: 'get',
        uri: `/prae/cronograma`,
        params: { tipoAtendimentoId: tipoId },
        data: {}
      };
      const response = await generica(body);
      if (response?.data?.content) {
        const transformado = transformCronogramas(response.data.content);
        setCronogramas(transformado);
      } else {
        setCronogramas([]);
        toast.warn("Nenhum cronograma encontrado para este tipo de atendimento.");
      }
    } catch (err) {
      toast.error("Erro ao carregar cronogramas.");
      console.error(err);
    }
  };

  const handleSelecionarTipo = (id: number) => {
    setTipoFiltro(id);
    setShowModal(false);
    carregarCronogramas(id);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    // Se já existe um tipo selecionado, mantemos ele
    // Caso contrário, o usuário poderá selecionar depois pelo filtro
  };

  const cronogramasFiltrados = tipoFiltro !== ''
    ? cronogramas.map(c => ({
        ...c,
        slots:
          filtroVagas === 'todas'
            ? c.slots
            : filtroVagas === 'disponiveis'
              ? c.slots.filter(s => !s.userScheduled)
              : c.slots.filter(s => s.userScheduled)
      }))
    : [];

  const handleAgendar = async (data: string, horario: string) => {
  const cronograma = cronogramas.find(c => c.data === data);
  const slot = cronograma?.slots.find(s => s.horario === horario);

  if (!slot || !cronograma)
    return toast.error("Vaga não encontrada!");

  try {
    const body = {
      metodo: 'post',
      uri: `/prae/agendamento/agendar`,
      params: {},
      data: {
        vagaId: slot.id,
        modalidade: cronograma.modalidade // PRESENCIAL | REMOTO
      }
    };

    const response = await generica(body);

    if (!response?.data?.errors && !response?.data?.error) {
      toast.success("Agendamento realizado com sucesso!");
      carregarCronogramas(Number(tipoFiltro));
    } else {
      toast.error(response?.data?.error?.message || "Erro ao agendar.");
    }
  } catch (err) {
    toast.error("Erro ao agendar.");
    console.error(err);
  }
};


  const handleCancelar = async (data: string, horario: string) => {
    const cronograma = cronogramas.find(c => c.data === data);
    const slot = cronograma?.slots.find(s => s.horario === horario);
    if (!slot) return toast.error("Vaga não encontrada!");

    try {
      const body = {
        metodo: 'post',
        uri: `/prae/agendamento/${slot.id}/cancelar`,
        params: {},
        data: {}
      };
      const response = await generica(body);
      if (!response?.data?.errors && !response?.data?.error) {
        toast.success("Agendamento cancelado com sucesso!");
        carregarCronogramas(Number(tipoFiltro));
      } else {
        toast.error(response?.data?.error?.message || "Erro ao cancelar.");
      }
    } catch (err) {
      toast.error("Erro ao cancelar.");
    }
  };

  return (
    <main className="flex flex-wrap justify-center mx-auto">
      <div className="w-full sm:w-11/12 2xl:w-10/12 p-4 pt-7">
        <Cabecalho dados={estrutura.cabecalho} />

        {/* MODAL DE SELEÇÃO */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-11/12 max-w-md relative">
              {/* Botão X para fechar */}
              <button
                onClick={handleCloseModal}
                className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              <h2 className="text-xl font-semibold mb-4 text-center">Selecione o tipo de atendimento</h2>
              <select
                className="w-full border px-3 py-2 rounded mb-4"
                onChange={(e) => {
                  const value = e.target.value;
                  if (value) handleSelecionarTipo(Number(value));
                }}
                defaultValue=""
              >
                <option value="" disabled>Escolha uma opção</option>
                {tiposAtendimento.map((t) => (
                  <option key={t.id} value={t.id}>{t.nome}</option>
                ))}
              </select>
              <p className="text-sm text-gray-500 text-center">
                Selecione um tipo de atendimento para visualizar o calendário
              </p>
            </div>
          </div>
        )}

        {/* FILTROS - Aparecem sempre que o modal não está visível */}
        {!showModal && (
          <div className="mb-4 flex flex-wrap items-center gap-4">
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1">Tipo de atendimento:</label>
              <select
                value={tipoFiltro}
                onChange={e => {
                  const id = e.target.value ? Number(e.target.value) : '';
                  setTipoFiltro(id);
                  if (id !== '') {
                    carregarCronogramas(id);
                  } else {
                    setCronogramas([]);
                  }
                }}
                className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-700 transition-colors"
              >
                <option value="">Selecione um tipo</option>
                {tiposAtendimento.map((t) => (
                  <option key={t.id} value={t.id}>{t.nome}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1">Filtrar vagas:</label>
              <select
                value={filtroVagas}
                onChange={e => setFiltroVagas(e.target.value as any)}
                className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-700 transition-colors"
              >
                <option value="todas">Todas</option>
                <option value="disponiveis">Disponíveis</option>
                <option value="agendadas">Agendadas</option>
              </select>
            </div>
          </div>
        )}

        {/* CALENDÁRIO - Aparece quando há um tipo selecionado */}
        {tipoFiltro !== '' && (
          <Calendar
            userRole={isPrivileged}
            cronogramas={cronogramasFiltrados}
            onAgendar={handleAgendar}
            onCancelar={handleCancelar}
          />
        )}

        {/* MENSAGEM QUANDO NÃO HÁ TIPO SELECIONADO E O MODAL ESTÁ FECHADO */}
        {!showModal && tipoFiltro === '' && (
          <div className="text-center py-8">
            <div className="bg-gray-50 rounded-lg p-6 max-w-md mx-auto">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Selecione um tipo de atendimento</h3>
              <p className="text-gray-500">
                Escolha um tipo de atendimento no filtro acima para visualizar o calendário de agendamentos disponíveis.
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default withAuthorization(PageLista);