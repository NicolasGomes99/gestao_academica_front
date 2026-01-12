"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';
import Modal from 'react-modal';

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

interface CalendarProps {
  userRole: 'comum' | 'profissional' | any;
  cronogramas: MonthCronograma[];
  onAgendar: (data: string, horario: string) => void;
  onCancelar: (data: string, horario: string) => void;
  tipoAtendimento?: string;
}

// Função para formatar data para "dd/MM/yyyy"
const formatDate = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

// Função para converter uma data recebida no formato "dd/MM/yyyy" (apenas garante zero-padding)
const convertDateFormat = (dateStr: string): string => {
  const [day, month, year] = dateStr.split('/');
  return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
};

const Calendar: React.FC<CalendarProps> = ({
  userRole,
  cronogramas,
  onAgendar,
  onCancelar,
  tipoAtendimento
}) => {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDaySlots, setSelectedDaySlots] = useState<DaySlot[]>([]);
  const [selectedDayString, setSelectedDayString] = useState<string>('');
  const [selectedTipoAtendimento, setSelectedTipoAtendimento] = useState<string>('');
  const [selectedModalidade, setSelectedModalidade] = useState<"PRESENCIAL" | "REMOTO" | "">("");


  useEffect(() => {
    // Qualquer efeito extra ao mudar o mês pode ser implementado aqui.
  }, [currentDate]);

  // Altera o mês (Anterior / Próximo)
  const changeMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  // Retorna todos os dias do mês atual
  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const days: (Date | null)[] = [];

    let startWeekDay = firstDayOfMonth.getDay(); // 0=Dom, 1=Seg, ..., 6=Sáb
    if (startWeekDay === 0) startWeekDay = 7; // Domingo vira 7 para facilitar

    // Adiciona espaços vazios até a segunda-feira
    for (let i = 1; i < startWeekDay; i++) {
      days.push(null);
    }

    for (let d = 1; d <= lastDayOfMonth.getDate(); d++) {
      days.push(new Date(year, month, d));
    }
    return days;
  };

  // Busca o cronograma do dia usando o formato "dd/MM/yyyy"
  const findDayCronograma = (date: Date) => {
    const dateStr = formatDate(date);
    return cronogramas.find((c) => c.data === dateStr);
  };

  // Quando clica em um dia com vagas, abre o modal
  const handleDayClick = (date: Date) => {
    const cronogramaDay = findDayCronograma(date);
    if (!cronogramaDay || cronogramaDay.slots.length === 0) return;
    setSelectedDayString(formatDate(date));
    setSelectedDaySlots(cronogramaDay.slots);
    setSelectedTipoAtendimento(cronogramaDay.tipoAtendimentoNome); 
    setSelectedModalidade(cronogramaDay.modalidade);
    setIsModalOpen(true);
  };


  // Para usuários comuns: Agendar ou Cancelar um horário
  const handleAgendarSlot = (horario: string) => {
    onAgendar(selectedDayString, horario);
    setSelectedDaySlots((prev) =>
      prev.map((slot) =>
        slot.horario === horario ? { ...slot, userScheduled: true } : slot
      )
    );
  };

  const handleCancelarSlot = (horario: string) => {
    onCancelar(selectedDayString, horario);
  };

  // Para profissionais: ações adicionais serão realizadas através de navegação
  const handleEditarSlot = (horario: string) => {
    router.push(`/prae/cronogramas/editar/${selectedDayString}?horario=${horario}`);
  };

  // Fecha o modal
  const closeModal = () => {
    setIsModalOpen(false);
  };

  const daysInMonth = getDaysInMonth();

  // Função para saber se é hoje
  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Função para saber se o dia já passou
  const isPastDay = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    return compareDate < today;
  };

  return (
    <main className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => changeMonth('prev')}
          className="px-4 py-2 bg-extra-100 text-white rounded-md border"
        >
          Anterior
        </button>
        <h2 className="text-xl font-bold text-neutrals-900 capitalize">
          {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        </h2>
        <button
          onClick={() => changeMonth('next')}
          className="px-4 py-2 bg-extra-100 text-white rounded-md border"
        >
          Próximo
        </button>
      </div>

      {/* Grid de dias do mês */}
      <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
        {daysInMonth.map((day, index) => {
          if (!day) {
            return <div key={index} />;
          }
          const cronogramaDay = findDayCronograma(day);
          let vagasDisponiveis = 0;
          if (cronogramaDay) {
            vagasDisponiveis = cronogramaDay.slots.filter(s => !s.userScheduled).length;
          }
          const isCurrentDay = isToday(day);
          const pastDay = isPastDay(day);

          return (
            <div
              key={index}
              className={
                "border p-2 rounded-md flex flex-col items-center " +
                (isCurrentDay ? "border-extra-50 ring-2 ring-extra-150 " : "")
              }
            >
              <div
                className={
                  "text-xs font-bold " +
                  (pastDay ? "text-gray-300 line-through" : "text-neutrals-900")
                }
              >
                {day.toLocaleDateString('pt-BR', { weekday: 'short' })}
              </div>
              <div
                className={
                  "text-lg font-semibold " +
                  (pastDay ? "text-gray-300 line-through" : "text-neutrals-800")
                }
              >
                {day.getDate()}
              </div>

               {cronogramaDay && (
    <span
      className={`mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${
        cronogramaDay.modalidade === "REMOTO"
          ? "bg-blue-100 text-blue-800"
          : "bg-green-100 text-green-800"
      }`}
    >
      {cronogramaDay.modalidade === "REMOTO" ? "Remoto" : "Presencial"}
    </span>
  )}
              {cronogramaDay && cronogramaDay.slots.length > 0 ? (() => {
                const vagasDisponiveis = cronogramaDay.slots.filter(s => !s.userScheduled).length;
                const vagasAgendadas = cronogramaDay.slots.filter(s => s.userScheduled).length;

                if (vagasDisponiveis > 0) {
                  return (
                    <button
                      onClick={() => handleDayClick(day)}
                      className={
                        "mt-2 px-2 py-1 text-sm rounded-md " +
                        (pastDay
                          ? "text-gray-400 line-through bg-gray-200"
                          : "text-white bg-green-500")
                      }
                    >
                      {`${vagasDisponiveis} Vaga${vagasDisponiveis > 1 ? 's' : ''}`}
                    </button>
                  );
                } else if (vagasAgendadas > 0) {
                  return (
                    <button
                      onClick={() => handleDayClick(day)}
                      className="mt-2 px-2 py-1 text-sm text-white bg-red-500 rounded-md"
                    >
                      {`${vagasAgendadas} Agendamento${vagasAgendadas > 1 ? 's' : ''}`}
                    </button>
                  );
                } else {
                  return (
                    <p className={
                      "mt-2 text-sm " +
                      (pastDay ? "text-gray-400 line-through" : "text-gray-500")
                    }>
                      Sem vagas
                    </p>
                  );
                }
              })() : (
                <p className={
                  "mt-2 text-sm " +
                  (pastDay ? "text-gray-400 line-through" : "text-gray-500")
                }>
                  Sem vagas
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Botão para profissionais cadastrarem um novo cronograma */}
      {userRole === 'tecnico' && (
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button
            onClick={() => router.push('/prae/agendamentos/calendario/todos-agendamentos')}
            className="px-4 py-2 bg-primary-500 text-white rounded-md"
          >
            Todos os Agendamentos
          </button>
          <button
            onClick={() => router.push('/prae/agendamentos/calendario/agendamentos-por-aluno')}
            className="px-4 py-2 bg-primary-500 text-white rounded-md"
          >
            Agendamentos por Aluno
          </button>
          <button
            onClick={() => router.push('/prae/agendamentos/calendario/todos-cancelamentos')}
            className="px-4 py-2 bg-primary-500 text-white rounded-md"
          >
            Cancelamentos
          </button>
        </div>
      )}
      {userRole === 'aluno' && (
        <div className="mt-6 flex justify-end gap-x-4">
          <button
            onClick={() => router.push('/prae/agendamentos/calendario/meus-agendamentos')}
            className="px-4 py-2 bg-extra-150 text-white rounded-md hover:bg-extra-50 "
          >
            Meus Agendamentos
          </button>
          <button
            onClick={() => router.push('/prae/agendamentos/calendario/meus-cancelamentos')}
            className="px-4 py-2 bg-extra-150 text-white rounded-md hover:bg-extra-50 "
          >
            Meus Cancelamentos
          </button>
        </div>
      )}

      {/* Modal para exibir os horários do dia selecionado */}
      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        contentLabel="Agendamentos do dia"
        ariaHideApp={false}
        className="absolute bg-white rounded-md p-4 max-w-md top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
      >
        <h2 className="text-xl font-bold mb-4">Agendamentos para {selectedDayString}</h2>
        <p className="text-md text-gray-700 mb-4">
          Tipo de atendimento: <span className="font-semibold">{selectedTipoAtendimento}</span>
        </p>
        <p className="text-md text-gray-700 mb-4">
  Modalidade:&nbsp;
  <span
    className={`inline-block px-2 py-0.5 rounded-full text-sm font-semibold ${
      selectedModalidade === "REMOTO"
        ? "bg-blue-100 text-blue-800"
        : "bg-green-100 text-green-800"
    }`}
  >
    {selectedModalidade === "REMOTO" ? "Remoto" : "Presencial"}
  </span>
</p>
        <div className="flex flex-col gap-2">
          {selectedDaySlots.map((slot, idx) => {
            // Verifica se o slot é de um dia passado
            const slotDate = selectedDayString.split('/'); // dd/MM/yyyy
            const slotDay = Number(slotDate[0]);
            const slotMonth = Number(slotDate[1]) - 1;
            const slotYear = Number(slotDate[2]);
            const slotDateObj = new Date(slotYear, slotMonth, slotDay);

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            slotDateObj.setHours(0, 0, 0, 0);

            const isSlotPast = slotDateObj < today;

            return (
              <div key={idx} className="flex justify-between items-center border p-2 rounded">
                <span className={"font-semibold " + (isSlotPast ? "text-gray-300 line-through" : "")}>
                  {slot.horario}
                </span>
                {userRole === 'tecnico' ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push('/prae/agendamentos/tipo')}
                      className="bg-yellow-500 text-white px-2 py-1 text-sm rounded"
                    >
                      Editar
                    </button>
                  </div>
                ) : (
                  // Só mostra o botão Agendar se NÃO for passado e NÃO estiver agendado
                  !slot.userScheduled && !isSlotPast && (
                    <button
                      onClick={() => handleAgendarSlot(slot.horario)}
                      className="bg-green-500 text-white px-2 py-1 text-sm rounded"
                    >
                      Agendar
                    </button>
                  )
                )}
                {/* Se for passado e não agendado, mostra como indisponível */}
                {userRole !== 'tecnico' && !slot.userScheduled && isSlotPast && (
                  <span className="text-gray-300 line-through text-sm">Indisponível</span>
                )}
              </div>
            );
          })}
        </div>
        {userRole === 'tecnico' && (
          <div className="mt-4">
          </div>
        )}
        <button
          onClick={closeModal}
          className="mt-4 bg-danger-500 px-4 py-2 rounded text-white"
        >
          Fechar
        </button>
      </Modal>
    </main>
  );
};

export default Calendar;