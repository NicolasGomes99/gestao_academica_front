"use client";

import withAuthorization from "@/components/AuthProvider/withAuthorization";
import Cabecalho from "@/components/Layout/Interno/Cabecalho";

import CircleIcon from "@mui/icons-material/Circle";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import DoneAllIcon from "@mui/icons-material/DoneAll";

import { useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { generica } from "@/utils/api";

const estrutura: any = {
  cabecalho: {
    titulo: "Notificações",
    migalha: [
      { nome: "Home", link: "/home" },
      { nome: "Notificações", link: "/notificacoes" },
    ],
  },
};

interface NotificacaoEvent {
  id: string;
  titulo: string;
  mensagem: string;
  dataHoraGeracao: string;
}

interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  last: boolean;
}

const formatTime = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "Agora";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return new Date(iso).toLocaleDateString("pt-BR");
};

const PageNotificacoes = () => {
  const [notifications, setNotifications] = useState<NotificacaoEvent[]>([]);
  const [page, setPage] = useState(0);
  const [isLastPage, setIsLastPage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const router = useRouter();

  // ─── Busca notificações ───────────────────────────────────────────────────
  const fetchNotificacoes = useCallback(async (pageNum: number, append = false) => {
    try {
      append ? setLoadingMore(true) : setLoading(true);

      const response = await generica({
        metodo: "get",
        uri: "/auth/notificacoes/historico",
        params: { page: pageNum, size: 10 },
      });

      if (response?.data?.content) {
        const { content, last } = response.data as PageResponse<NotificacaoEvent>;
        setNotifications((prev) => (append ? [...prev, ...content] : content));
        setIsLastPage(last);
        setPage(pageNum);
      }
    } catch {
      toast.error("Erro ao carregar notificações.");
    } finally {
      append ? setLoadingMore(false) : setLoading(false);
    }
  }, []);

  // ─── Carga inicial ────────────────────────────────────────────────────────
  useEffect(() => {
    fetchNotificacoes(0);
  }, [fetchNotificacoes]);

  // ─── Marcar uma como lida ─────────────────────────────────────────────────
  const handleMarkAsRead = async (id: string) => {
    try {
      await generica({
        metodo: "delete",
        uri: `/auth/notificacoes/${id}/lida`,
      });
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch {
      toast.error("Erro ao marcar notificação como lida.");
    }
  };

  // ─── Limpar todas ─────────────────────────────────────────────────────────
  const handleMarkAllAsRead = async () => {
    try {
      await generica({
        metodo: "delete",
        uri: "/auth/notificacoes/limpar-todas",
      });
      setNotifications([]);
      setIsLastPage(true);
      toast.success("Todas as notificações foram marcadas como lidas!", {
        position: "top-right",
      });
    } catch {
      toast.error("Erro ao limpar notificações.");
    }
  };

  // ─── Carregar mais ────────────────────────────────────────────────────────
  const handleLoadMore = () => {
    fetchNotificacoes(page + 1, true);
  };

  const handleGoBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/home");
    }
  };

  return (
    <main className="flex flex-wrap justify-center mx-auto">
      <div className="w-full sm:w-11/12 2xl:w-10/12 p-4 sm:p-6 md:p-8 lg:p-12 2xl:p-20 pt-7 md:pt-8 md:pb-8">
        <Cabecalho dados={estrutura.cabecalho} />

        <div className="mt-4 mb-4">
          <button
            onClick={handleGoBack}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-extra-150 text-white hover:bg-extra-50 transition text-sm font-medium"
          >
            ← Voltar
          </button>
        </div>

        {/* CARD PRINCIPAL */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
          {/* HEADER */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-5 py-4 border-b">
            <div className="flex items-center gap-3">
              <div className="bg-red-50 p-3 rounded-xl">
                <NotificationsNoneOutlinedIcon className="text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  Todas as notificações
                </h2>
                <p className="text-sm text-gray-500">
                  {loading
                    ? "Carregando..."
                    : `Você possui ${notifications.length} notificações não lidas`}
                </p>
              </div>
            </div>

            {notifications.length > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="inline-flex items-center justify-center gap-2 bg-extra-150 hover:bg-extra-50 text-white px-4 py-2 rounded-lg transition text-sm font-medium"
              >
                <DoneAllIcon fontSize="small" />
                Marcar todas como lidas
              </button>
            )}
          </div>

          {/* LISTA */}
          <div className="divide-y divide-gray-100">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center text-center">
                <p className="text-sm text-gray-400">Carregando notificações...</p>
              </div>
            ) : notifications.length > 0 ? (
              <>
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 p-5 transition hover:bg-gray-50 bg-blue-50/40"
                  >
                    {/* ESQUERDA */}
                    <div className="flex gap-4 flex-1">
                      <div className="pt-1">
                        <CircleIcon style={{ fontSize: 12 }} className="text-blue-500" />
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                          <h3 className="font-semibold text-gray-800">
                            {notification.titulo}
                          </h3>
                          <span className="text-xs text-gray-400">
                            {formatTime(notification.dataHoraGeracao)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.mensagem}
                        </p>
                      </div>
                    </div>

                    {/* AÇÃO */}
                    <div className="flex items-center">
                      <button
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="text-sm font-medium text-red-700 hover:text-red-800 transition-colors duration-200"
                      >
                        Marcar como lida
                      </button>
                    </div>
                  </div>
                ))}

                {/* CARREGAR MAIS */}
                {!isLastPage && (
                  <div className="flex justify-center py-4">
                    <button
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg transition disabled:opacity-50"
                    >
                      {loadingMore ? "Carregando..." : "Carregar mais"}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="py-20 flex flex-col items-center justify-center text-center">
                <NotificationsNoneOutlinedIcon
                  style={{ fontSize: 60 }}
                  className="text-gray-300"
                />
                <h3 className="mt-4 text-lg font-semibold text-gray-700">
                  Nenhuma notificação
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Você não possui notificações no momento.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default withAuthorization(PageNotificacoes);