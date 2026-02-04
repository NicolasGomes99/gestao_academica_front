'use client';

import React from "react";
import ClientWrapper from "@/components/AuthProvider/ClientWrapper";
import { useAuthService } from "../authentication/auth.hook";
import {
  School, PendingActions, Groups2, AccountCircleOutlined,
  CalendarMonth, EventNote, Schedule, Payment, VolunteerActivism,
  AccountBalance, Diversity3, Home, BusinessCenter,
  DoneAll,
  AccountBalanceWallet,
  Assessment,
  EventAvailable,
  EventBusy,
  Category,
  Work
} from "@mui/icons-material";
import { InternalLayoutConfig } from "@/types/InternalLayoutConf";

export default function PraeLayout({ children }: { children: React.ReactNode }) {
  const auth = useAuthService();
  const isAluno = auth.isAluno();
  const isPraeAccess = auth.isPraeAccess();

  const layoutConfig: InternalLayoutConfig = {
    header: {
      logo: {
        url: "/assets/SGU.png",
        width: 40,
        height: 40,
        alt: "Logo Auth",
        position: "left",
      },
      title: "PRAE",
      userActions: [
        {
          label: "Minha conta",
          route: "/conta/perfil",
          icon: <AccountCircleOutlined fontSize="small" className="text-white" />,
        },
        {
          label: "Sair",
          route: "/conta/sair",
          icon: <PendingActions fontSize="small" className="text-white" />,
        },
      ],
    },
    sidebar: {
      logo: {
        url: "",
        width: 32,
        height: 32,
        text: "",
      },
      menuItems: [
        {
          label: "Início",
          route: "/home",
          icon: <Home fontSize="small" className="text-white" />,
          roles: ["administrador", "gestor", "tecnico", "aluno", "visitante", "professor"],
        },
        {
          label: "Gerenciar Estudantes",
          route: "/prae/estudantes",
          icon: <School fontSize="small" className="text-white" />,
          roles: isPraeAccess ? ["gestor"] : [""],
        },
        {
          label: "Meu Cadastro",
          route: "/prae/estudantes/atual",
          icon: <School fontSize="small" className="text-white" />,
          roles: ["aluno"],
        },

        {
          label: "Meu Cadastro",
          route: "/prae/profissionais/atual",
          icon: <Work fontSize="small" className="text-white" />,
          roles: isPraeAccess ? ["tecnico", "professor"] : [""],
        },
        {
          label: "Gerenciar Benefícios",
          route: "/prae/beneficios",
          icon: <VolunteerActivism fontSize="small" className="text-white" />,
          roles: isPraeAccess ? ["gestor"] : [""],
          subItems: [
            {
              label: "Tipos",
              route: "/prae/beneficios/tipos",
              icon: <VolunteerActivism fontSize="small" className="text-white" />,
            },
            {
              label: "Benefícios",
              route: "/prae/beneficios/beneficios",
              icon: <VolunteerActivism fontSize="small" className="text-white" />,
            },
          ],
        },
        {
          label: isAluno ? "Pagamentos" : "Gerenciar Pagamentos",
          route: "/prae/pagamentos",
          icon: <Payment fontSize="small" className="text-white" />,
          roles: isPraeAccess ? ["gestor"] : ["aluno"],
          subItems: [
            {
              label: "Folha de pagamento",
              route: "/prae/pagamentos/folha-de-pagamento",
              icon: <PendingActions fontSize="small" className="text-white" />,
              roles: isPraeAccess ? ["gestor"] : [""],
            },
            {
              label: "Pagamentos Realizados",
              route: "/prae/pagamentos/pagamentos-realizados",
              icon: <DoneAll fontSize="small" className="text-white" />,
              roles: isPraeAccess ? ["gestor"] : [""],
            },
            {
              label: "Meus Recebimentos",
              route: "/prae/pagamentos/meus-recebimentos",
              icon: <AccountBalanceWallet fontSize="small" className="text-white" />,
              roles: ["aluno"],
            },
             {
              label: "Relatório Financeiro",
              route: "/prae/pagamentos/relatorio-financeiro",
              icon: <Assessment fontSize="small" className="text-white" />,
              roles: isPraeAccess ? ["gestor"] : [""],
            }, 
          ],
        },
        {
          label: isAluno ? "Agendamentos" : "Gerenciar Agendamentos",
          route: "/prae/agendamentos",
          icon: <EventNote fontSize="small" className="text-white" />,
          roles: isPraeAccess ? ["gestor", "Tecnico", "Professor"] : ["aluno"],
          subItems: [
            {
              label: "Tipo de Atendimento",
              route: "/prae/agendamentos/tipo",
              icon: <Category fontSize="small" className="text-white" />, // Ícone para categorias/tipos
              roles: isPraeAccess ? ["tecnico", "professor"] : [""],
            },
            {
              label: "Gerenciar Cronograma",
              route: "/prae/agendamentos/cronograma",
              icon: <Schedule fontSize="small" className="text-white" />, // Ícone de cronograma
              roles: isPraeAccess ? ["gestor", "tecnico", "professor"] : [""],
            },
            {
              label: "Calendário de Agendamentos",
              route: "/prae/agendamentos/calendario",
              icon: <CalendarMonth fontSize="small" className="text-white" />, // Ícone de calendário
              roles: isPraeAccess ? ["gestor"] : ["aluno"],
            },
            {
              label: "Meus Agendamentos",
              route: "/prae/agendamentos/calendario/meus-agendamentos",
              icon: <EventAvailable fontSize="small" className="text-white" />, // Ícone para eventos confirmados
              roles: isPraeAccess ? ["gestor", "Tecnico", "Professor"] : ["aluno"],
            },
            {
              label: "Meus Cancelamentos",
              route: "/prae/agendamentos/calendario/meus-cancelamentos",
              icon: <EventBusy fontSize="small" className="text-white" />, // Ícone para eventos cancelados
              roles: isPraeAccess ? ["gestor", "Tecnico", "Professor"] : ["aluno"],
            },
          ]
        }
      ],
    },
  };

  return <ClientWrapper layoutConfig={layoutConfig}>{children}</ClientWrapper>;
}
