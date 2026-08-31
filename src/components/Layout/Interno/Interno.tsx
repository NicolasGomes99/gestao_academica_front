"use client";

import React, { ReactNode, useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider/AuthProvider";

// Ícones do Material-UI
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import HomeOutlined from "@mui/icons-material/HomeOutlined";
import AccountCircleOutlined from "@mui/icons-material/AccountCircleOutlined";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import CircleIcon from "@mui/icons-material/Circle";

// Serviço de autenticação
import { useAuthService } from "@/app/authentication/auth.hook";
import SidebarMenuItem from "./MenuItem";
import { generica } from "@/utils/api";

// Contexto de roles
import { RoleProvider } from "@/context/roleContext";

// Tipos
export interface HeaderConfig {
  logo: { url: string; width?: number; height?: number; alt?: string };
  title: string;
  userActions?: Array<{ label: string; route: string; icon: React.ReactNode }>;
}

export interface MenuItem {
  label: string;
  route: string;
  icon: React.ReactNode;
  roles?: string[];
  subItems?: MenuItem[];
}

export interface SidebarConfig {
  logo: { url: string; width?: number; height?: number; text?: string };
  menuItems: MenuItem[];
}

export interface InternalLayoutConfig {
  header: HeaderConfig;
  sidebar: SidebarConfig;
}

interface LayoutProps {
  children: ReactNode;
  layoutConfig?: InternalLayoutConfig;
}

interface NotificacaoEvent {
  id: string;
  titulo: string;
  mensagem: string;
  dataHoraGeracao: string;
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

export default function Layout({ children, layoutConfig }: LayoutProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const pathname = usePathname();
  const [isLogin, setIsLogin] = useState(false);

  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [openSubMenus, setOpenSubMenus] = useState<Record<string, boolean>>({});
  const [usuarioLogado, setUsuarioLogado] = useState<string | null>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [activeRole, setActiveRole] = useState<string>("");

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const dropdownRef = useRef<any>(null);
  const sidebarRef = useRef<any>(null);

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationsRef = useRef<any>(null);

  const [notifications, setNotifications] = useState<NotificacaoEvent[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  // ─── Busca as notificações ao abrir o dropdown ────────────────────────────
  const fetchNotificacoes = useCallback(async () => {
    try {
      setLoadingNotifications(true);

      const response = await generica({
        metodo: "get",
        uri: "/auth/notificacoes/historico",
        params: { page: 0, size: 10 },
      });

      if (response?.data?.content) {
        setNotifications(response.data.content);
      }
    } catch {
      // silencioso no dropdown
    } finally {
      setLoadingNotifications(false);
    }
  }, []);

  useEffect(() => {
    if (isNotificationsOpen && isAuthenticated) {
      fetchNotificacoes();
    }
  }, [isNotificationsOpen, isAuthenticated, fetchNotificacoes]);

  // ─── Marcar todas como lidas ──────────────────────────────────────────────
  const handleMarkAllAsRead = async () => {
    try {
      await generica({
        metodo: "delete",
        uri: "/auth/notificacoes/limpar-todas",
      });

      setNotifications([]);
    } catch {
      // silencioso no dropdown
    }
  };

  useEffect(() => {
    setIsLogin(
      pathname === "/home" ||
        pathname === "/conta/perfil" ||
        pathname === "/perfil",
    );
  }, [pathname]);

  const defaultConfig: InternalLayoutConfig = {
    header: {
      logo: {
        url: "/assets/SGU.png",
        width: 50,
        height: 50,
        alt: "Logo Padrão",
      },
      title: "Sistema de Gestão Universitária",
      userActions: [],
    },
    sidebar: {
      logo: {
        url: "/assets/default-sidebar-logo.png",
        width: 32,
        height: 32,
        text: "SGU",
      },
      menuItems: [
        {
          label: "Início",
          route: "/home",
          icon: <HomeOutlined fontSize="medium" />,
        },
      ],
    },
  };

  const config = layoutConfig || defaultConfig;
  const auth = useAuthService();
  const { session } = useAuth();

  useEffect(() => {
    if (auth.isLoading) return;

    if (auth.isAuthenticated) {
      const newRoles: string[] = [];
      if (auth.isAdmin()) newRoles.push("administrador");
      if (auth.isGestor()) newRoles.push("gestor");
      if (auth.isTecnico()) newRoles.push("tecnico");
      if (auth.isProfessor()) newRoles.push("professor");
      if (auth.isAluno()) newRoles.push("aluno");
      if (auth.isVisitante()) newRoles.push("visitante");

      setUserRoles(newRoles);

      if (!activeRole || !newRoles.includes(activeRole)) {
        setActiveRole(newRoles[0] || "");
      }

      setUsuarioLogado(session?.email || "");
    } else {
      setUsuarioLogado(null);
      setUserRoles([]);
      setActiveRole("");
    }
  }, [auth.isAuthenticated, auth.isLoading]);

  useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }

      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target)
      ) {
        setIsNotificationsOpen(false);
      }

      if (
        window.innerWidth < 640 &&
        isMenuOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target) &&
        !event.target.closest(".mobile-menu-button")
      ) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  const handleMouseEnter = () => {
    if (window.innerWidth >= 640) setIsMenuOpen(true);
  };

  const handleMouseLeave = () => {
    if (window.innerWidth >= 640) {
      setIsMenuOpen(false);
      setOpenSubMenus({});
    }
  };

  const handleToggleMenu = () => {
    setIsMenuOpen((prev) => {
      if (!prev) setOpenSubMenus({});
      return !prev;
    });
  };

  const toggleSubMenu = (key: string) =>
    setOpenSubMenus((prev) => ({ ...prev, [key]: !prev[key] }));

  const closeMenu = () => {
    setIsMenuOpen(false);
    setOpenSubMenus({});
  };

  const handleLogout = () => router.push("/conta/sair");

  const handleLogin = () => {
    if (location.pathname !== "/login") router.push("/login");
  };

  const handleAutenticacao = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (isAuthenticated) {
      handleLogout();
      setIsOpen(false);
    } else {
      handleLogin();
    }
  };

  const shouldShowMenuControls =
    !isLogin && pathname !== "/perfil" && pathname !== "/conta/perfil";

  const unreadCount = notifications.length;

  return (
    <>
      {/* ======== HEADER ======== */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white shadow-md h-14">
        <div className="grid grid-cols-3 items-center px-2 h-full">

          {/* ===== ESQUERDA ===== */}
          <div className="flex items-center space-x-3">
            {/* Botão mobile */}
            {shouldShowMenuControls && (
              <button
                onClick={handleToggleMenu}
                className="sm:hidden mobile-menu-button p-2 rounded-md hover:bg-gray-100 focus:outline-none"
              >
                {isMenuOpen ? (
                  <CloseIcon className="text-primary-600" />
                ) : (
                  <MenuIcon className="text-primary-600" />
                )}
              </button>
            )}

            {/* Logo */}
            <div className="flex items-center">
              <img
                src={config.header.logo.url}
                alt={config.header.logo.alt || "Logo"}
                className="h-10 w-auto object-contain"
                style={{ maxHeight: "15px" }}
              />
            </div>

            {/* Título */}
            <span className="hidden sm:block text-body-small text-neutrals-900 font-medium">
              {config.header.title}
            </span>
          </div>

          {/* ===== CENTRO ===== */}
          <div className="flex justify-center">
            {userRoles.length > 1 && (
              <select
                className="border rounded px-2 py-1 text-sm max-w-[100px] sm:max-w-[140px]"
                value={activeRole}
                onChange={(e) => setActiveRole(e.target.value)}
              >
                {userRoles.map((role) => (
                  <option key={role} value={role}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* ===== DIREITA ===== */}
          <div className="flex items-center justify-end gap-2">

            {/* Notificações */}
            {isAuthenticated && (
              <div className="relative" ref={notificationsRef}>
                <button
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className="relative inline-flex items-center justify-center p-2 rounded-full hover:bg-gray-100 transition"
                >
                  <NotificationsNoneOutlinedIcon />

                  {unreadCount > 0 && (
                    <span className="absolute notification_numbers bg-red-500 text-white text-[10px] min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full font-semibold">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </button>

                {isNotificationsOpen && (
                  <div className="absolute right-0 mt-2 w-[95vw] sm:w-[380px] bg-white border border-gray-200 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.12)] overflow-hidden z-50">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b">
                      <h3 className="font-semibold text-gray-800">
                        Notificações
                      </h3>

                      {notifications.length > 0 && (
                        <button
                          onClick={handleMarkAllAsRead}
                          className="text-sm text-red-600 hover:text-red-700"
                        >
                          Marcar todas
                        </button>
                      )}
                    </div>

                    {/* Lista */}
                    <div className="max-h-[420px] overflow-y-auto">
                      {loadingNotifications ? (
                        <div className="py-10 px-4 text-center text-gray-400 text-sm">
                          Carregando...
                        </div>
                      ) : notifications.length > 0 ? (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className="w-full text-left px-4 py-3 border-b bg-blue-50/40 hover:bg-gray-50 transition flex gap-3"
                          >
                            <div className="pt-1">
                              <CircleIcon
                                style={{ fontSize: 10 }}
                                className="text-blue-500"
                              />
                            </div>

                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-semibold text-gray-800">
                                  {notification.titulo}
                                </p>

                                <span className="text-xs text-gray-400">
                                  {formatTime(notification.dataHoraGeracao)}
                                </span>
                              </div>

                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                {notification.mensagem}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-10 px-4 text-center text-gray-500 text-sm">
                          Nenhuma notificação
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="p-3 border-t bg-gray-50">
                      <button
                        onClick={() => {
                          setIsNotificationsOpen(false);
                          router.push("/notificacoes");
                        }}
                        className="w-full text-sm font-medium text-red-600 hover:text-red-700"
                      >
                        Ver todas as notificações
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Usuário */}
            {isAuthenticated && (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  className="inline-flex items-center p-2 rounded-md hover:bg-gray-100"
                >
                  <AccountCircleOutlined fontSize="medium" />

                  <span className="hidden sm:inline ml-2 text-sm">
                    {usuarioLogado}
                  </span>

                  {isOpen ? (
                    <ExpandLessIcon fontSize="small" className="ml-1" />
                  ) : (
                    <ExpandMoreIcon fontSize="small" className="ml-1" />
                  )}
                </button>

                {isOpen && (
                  <div className="absolute right-0 w-48 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg">
                    <Link
                      href="/conta/perfil"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Minha conta
                    </Link>

                    <button
                      onClick={handleAutenticacao}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Sair
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ======== SIDEBAR ======== */}
      {shouldShowMenuControls && (
        <>
          {/* Overlay no mobile */}
          {isMenuOpen && (
            <div
              className="fixed inset-0 bg-black bg-opacity-40 z-20 sm:hidden"
              onClick={closeMenu}
            />
          )}

          <aside
            ref={sidebarRef}
            className={`fixed top-14 left-0 h-[calc(100%-3.5rem)] bg-extra-50 shadow-lg transition-all duration-300 z-30
              ${
                isMenuOpen
                  ? "w-60"
                  : "w-0 overflow-hidden sm:w-12 sm:hover:w-60 sm:overflow-visible"
              }`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <div className="flex flex-col h-full">
              <div className="pt-4 px-2 flex-1 overflow-y-auto">
                <ul className="space-y-4 text-white">
                  {config.sidebar.menuItems.map((item, idx) => (
                    <SidebarMenuItem
                      key={idx}
                      item={item}
                      isMenuOpen={isMenuOpen}
                      openSubMenus={openSubMenus}
                      toggleSubMenu={toggleSubMenu}
                      activeRole={activeRole}
                      closeMenu={closeMenu}
                    />
                  ))}
                </ul>
              </div>
            </div>
          </aside>
        </>
      )}

      {/* ======== CONTEÚDO PRINCIPAL ======== */}
      <main
        className={`pt-12 min-h-screen transition-all duration-300 ${
          shouldShowMenuControls ? (isMenuOpen ? "sm:pl-60" : "sm:pl-4") : ""
        }`}
      >
        <RoleProvider activeRole={activeRole} userRoles={userRoles}>
          {children}
        </RoleProvider>
      </main>
    </>
  );
}