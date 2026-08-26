import React from "react";
import ClientWrapper from "@/components/AuthProvider/ClientWrapper";
import { Article, PendingActions, Description, AccountCircleOutlined, Home, List, Folder, Timeline, Assignment } from "@mui/icons-material";
import { InternalLayoutConfig } from "@/types/InternalLayoutConf";

export default function EditaisLayout({ children }: { children: React.ReactNode }) {
  const layoutConfig: InternalLayoutConfig = {
    header: {
      logo: {
        url: "/assets/SGU.png",
        width: 40,
        height: 40,
        alt: "Logo Auth",
        position: "left",
      },
      title: "Gestão de Editais",
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
        url: "/assets/LogoUfape.svg",
        width: 32,
        height: 32,
        text: "SGU",
      },
      menuItems: [
        {
          label: "Início",
          route: "/home",
          icon: <Home fontSize="small" className="text-white" />,
          roles: ["administrador", "gestor", "tecnico"],
        },
        {
          label: "Tipo Edital",
          route: "/gestao-edital/tipo-edital",
          icon: <Article fontSize="small" className="text-white" />,
          roles: ["administrador", "gestor", "tecnico"],
        },
        {
          label: "Editais",
          route: "/gestao-edital/editais",
          icon: <Description fontSize="small" className="text-white" />,
          roles: ["administrador", "gestor", "tecnico"],
        },  
        /* {
          label: "Status",
          route: "/gestao-edital/editais/status-personalizado",
          icon: <Article fontSize="small" className="text-white" />,
          roles: ["administrador", "gestor", "tecnico"],
        }, */
      ],
    },
  };
  return (
    <ClientWrapper layoutConfig={layoutConfig}>{children}</ClientWrapper>
  )
}