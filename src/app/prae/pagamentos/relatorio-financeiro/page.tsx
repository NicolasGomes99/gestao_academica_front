"use client";
import withAuthorization from "@/components/AuthProvider/withAuthorization";
import Cabecalho from "@/components/Layout/Interno/Cabecalho";
import { generica } from "@/utils/api";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  Title,
  PointElement,
  LineElement,
  Filler,
} from "chart.js";
import { Bar, Pie } from "react-chartjs-2";

import {
  FilterAlt,
  CalendarMonth,
  AttachMoney,
  People,
  School,
  TrendingUp,
  ExpandMore,
  Payments,
  MenuBook,
} from "@mui/icons-material";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  Title,
  PointElement,
  LineElement,
  Filler,
);

type TipoBeneficio = {
  id: number;
  tipo: string;
  naturezaBeneficio: string;
  descricao: string;
  valorBeneficio: number;
};

type PagamentoItem = {
  id: number;
  valor: number;
  data: string;
  beneficio: {
    id: number;
    tipoBeneficio: TipoBeneficio;
    horasBeneficio: number;
    inicioBeneficio: string;
    fimBeneficio: string;
    parecerTermino: string | null;
    valorPagamento: number;
    status: boolean;
    estudantes: {
      id: number;
      aluno: {
        id: string;
        nome: string;
        nomeSocial: string;
        cpf: string;
        email: string;
        telefone: string;
        matricula: string;
        curso: {
          id: number;
          nome: string;
        };
        tipoEtnia: {
          id: number;
          tipo: string;
        };
      };
      rendaPercapta: number;
      contatoFamilia: string;
      deficiente: boolean;
      tipoDeficiencia: string | null;
      endereco: {
        id: number;
        rua: string;
        cep: string;
        bairro: string;
        cidade: string;
        estado: string;
        numero: string;
        complemento: string | null;
      };
      dadosBancarios: any | null;
    };
  };
};

type FiltrosRelatorio = {
  periodoInicio: string;
  periodoFim: string;
  tipo: string;
};

type RelatorioFinanceiroResponse = {
  totalGeral: number;
  quantidadePessoasAtendidas: number;
  quantidadeTiposBeneficio: number;
  quantidadeCursosDistintos: number;
  valorTotalPorTipoBeneficio: Array<{
    tipoBeneficioNome: string;
    tipoBeneficioId: number;
    valorTotal: number;
  }>;
  quantidadeBeneficiadosPorCurso: Array<{
    cursoNome: string;
    cursoId: number;
    quantidadeBeneficiados: number;
  }>;
};

type DadosCalculados = {
  totalRecurso: number;
  pessoasAtendidas: number;
  tiposBeneficio: number;
  cursosDistintos: number;
  recursoPorTipo: Array<{
    tipo: string;
    valor: number;
  }>;
  percentualPorCurso: Array<{
    curso: string;
    percentual: number;
    quantidade: number;
  }>;
  tiposUnicos: string[];
  cursosUnicos: string[];
};

const estrutura = {
  uri: "pagamento",
  cabecalho: {
    titulo: "Relatório Financeiro",
    migalha: [
      { nome: "Home", link: "/home" },
      { nome: "Financeiro", link: "/financeiro" },
      { nome: "Relatório Financeiro", link: "/financeiro/relatorio" },
    ],
  },
};

const cores = {
  primaria: {
    azul: "#2563eb",
    azulEscuro: "#1d4ed8",
    azulClaro: "#60a5fa",
    verde: "#059669",
    verdeEscuro: "#047857",
    roxo: "#7c3aed",
    roxoEscuro: "#6d28d9",
    laranja: "#f97316",
    laranjaEscuro: "#ea580c",
  },
  neutras: {
    cinza50: "#f9fafb",
    cinza100: "#f3f4f6",
    cinza200: "#e5e7eb",
    cinza300: "#d1d5db",
    cinza400: "#9ca3af",
    cinza500: "#6b7280",
    cinza600: "#4b5563",
    cinza700: "#374151",
    cinza800: "#1f2937",
    cinza900: "#111827",
  },
  status: {
    sucesso: "#10b981",
    alerta: "#f59e0b",
    erro: "#ef4444",
    info: "#3b82f6",
  },
};

const hoje = new Date();
const valorPadraoInicio = `01/${hoje.getFullYear()}`;
const mesFormatado = String(hoje.getMonth() + 1).padStart(2, "0");
const valorPadraoFim = `${mesFormatado}/${hoje.getFullYear()}`;

const PageLista = () => {
  const [dadosRelatorio, setDadosRelatorio] = useState<RelatorioFinanceiroResponse | null>(null);
  const [filtros, setFiltros] = useState<FiltrosRelatorio>({
    periodoInicio: valorPadraoInicio,
    periodoFim: valorPadraoFim,
    tipo: "todos",
  });
  const [carregando, setCarregando] = useState(false);
  const [tiposDisponiveis, setTiposDisponiveis] = useState<TipoBeneficio[]>([]);

  // Dados calculados para os gráficos
  const [dadosCalculados, setDadosCalculados] = useState<DadosCalculados>({
    totalRecurso: 0,
    pessoasAtendidas: 0,
    tiposBeneficio: 0,
    cursosDistintos: 0,
    recursoPorTipo: [],
    percentualPorCurso: [],
    tiposUnicos: [],
    cursosUnicos: [],
  });

  const opcoesGraficoBarra = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: cores.neutras.cinza800,
        titleColor: cores.neutras.cinza50,
        bodyColor: cores.neutras.cinza50,
        borderColor: cores.primaria.azul,
        borderWidth: 1,
        callbacks: {
          label: function (context: any) {
            return `R$ ${context.raw.toLocaleString("pt-BR")}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: cores.neutras.cinza200,
        },
        ticks: {
          color: cores.neutras.cinza600,
          callback: function (value: any) {
            if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`;
            if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}k`;
            return `R$ ${value}`;
          },
        },
      },
      x: {
        grid: {
          color: cores.neutras.cinza200,
        },
        ticks: {
          color: cores.neutras.cinza600,
        },
      },
    },
  };

  const opcoesGraficoPizza = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right" as const,
        labels: {
          color: cores.neutras.cinza700,
          padding: 20,
          font: {
            size: 13,
          },
        },
      },
      tooltip: {
        backgroundColor: cores.neutras.cinza800,
        titleColor: cores.neutras.cinza50,
        bodyColor: cores.neutras.cinza50,
        borderColor: cores.primaria.azul,
        borderWidth: 1,
        callbacks: {
          label: function (context: any) {
            return `${context.label}: ${context.raw.toFixed(1)}%`;
          },
        },
      },
    },
  };

  // Processar dados da API
  const processarDados = (relatorio: RelatorioFinanceiroResponse) => {
    if (!relatorio) {
      setDadosCalculados({
        totalRecurso: 0,
        pessoasAtendidas: 0,
        tiposBeneficio: 0,
        cursosDistintos: 0,
        recursoPorTipo: [],
        percentualPorCurso: [],
        tiposUnicos: [],
        cursosUnicos: [],
      });
      return;
    }

    // Preparar dados de recurso por tipo
    const recursoPorTipo = relatorio.valorTotalPorTipoBeneficio.map(item => ({
      tipo: item.tipoBeneficioNome,
      valor: item.valorTotal
    })).sort((a, b) => b.valor - a.valor);

    // Preparar dados de percentual por curso
    const totalBeneficiados = relatorio.quantidadePessoasAtendidas;
    const percentualPorCurso = relatorio.quantidadeBeneficiadosPorCurso.map(item => ({
      curso: item.cursoNome,
      quantidade: item.quantidadeBeneficiados,
      percentual: totalBeneficiados > 0 ? (item.quantidadeBeneficiados / totalBeneficiados) * 100 : 0
    })).sort((a, b) => b.quantidade - a.quantidade);

    // Extrair tipos e cursos únicos
    const tiposUnicos = relatorio.valorTotalPorTipoBeneficio.map(item => item.tipoBeneficioNome);
    const cursosUnicos = relatorio.quantidadeBeneficiadosPorCurso.map(item => item.cursoNome);

    setDadosCalculados({
      totalRecurso: relatorio.totalGeral,
      pessoasAtendidas: relatorio.quantidadePessoasAtendidas,
      tiposBeneficio: relatorio.quantidadeTiposBeneficio,
      cursosDistintos: relatorio.quantidadeCursosDistintos,
      recursoPorTipo,
      percentualPorCurso,
      tiposUnicos,
      cursosUnicos,
    });
  };

  // Dados para gráfico de barras (Recurso por tipo de benefício)
  const dadosGraficoBarra = {
    labels: dadosCalculados.recursoPorTipo.map((item) => item.tipo),
    datasets: [
      {
        label: "Valor em R$",
        data: dadosCalculados.recursoPorTipo.map((item) => item.valor),
        backgroundColor: [
          cores.primaria.azul,
          cores.primaria.verde,
          cores.primaria.roxo,
          cores.primaria.laranja,
          cores.primaria.azulClaro,
          "#f59e0b",
          "#ec4899",
          "#8b5cf6",
        ].slice(0, dadosCalculados.recursoPorTipo.length),
        borderColor: [
          cores.primaria.azulEscuro,
          cores.primaria.verdeEscuro,
          cores.primaria.roxoEscuro,
          cores.primaria.laranjaEscuro,
          cores.primaria.azul,
          "#d97706",
          "#db2777",
          "#7c3aed",
        ].slice(0, dadosCalculados.recursoPorTipo.length),
        borderWidth: 2,
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  // Dados para gráfico de pizza (Percentual por curso)
  const dadosGraficoPizza = {
    labels: dadosCalculados.percentualPorCurso
      .slice(0, 8)
      .map((item) => item.curso),
    datasets: [
      {
        label: "Percentual de Estudantes",
        data: dadosCalculados.percentualPorCurso
          .slice(0, 8)
          .map((item) => item.percentual),
        backgroundColor: [
          cores.primaria.azul,
          cores.primaria.verde,
          cores.primaria.roxo,
          cores.primaria.laranja,
          "#f59e0b",
          "#ec4899",
          "#8b5cf6",
          "#06b6d4",
        ].slice(0, dadosCalculados.percentualPorCurso.slice(0, 8).length),
        borderColor: [
          cores.primaria.azulEscuro,
          cores.primaria.verdeEscuro,
          cores.primaria.roxoEscuro,
          cores.primaria.laranjaEscuro,
          "#d97706",
          "#db2777",
          "#7c3aed",
          "#0891b2",
        ].slice(0, dadosCalculados.percentualPorCurso.slice(0, 8).length),
        borderWidth: 2,
      },
    ],
  };

  const buscarDados = async () => {
    setCarregando(true);
    try {
      const params: any = {
        size: 100,
        page: 0,
      };

      const dataInicioFinal = filtros.periodoInicio?.trim()
        ? filtros.periodoInicio
        : valorPadraoInicio;
      const dataFimFinal = filtros.periodoFim?.trim()
        ? filtros.periodoFim
        : valorPadraoFim;

      setFiltros((prev) => ({
        ...prev,
        periodoInicio: dataInicioFinal,
        periodoFim: dataFimFinal,
      }));

      params.inicio = formatarDataParaAPI(dataInicioFinal);
      params.fim = formatarDataParaAPI(dataFimFinal);

      if (filtros.tipo !== "todos") {
        params.tipoBeneficio = filtros.tipo;
      }

      // Buscar relatório financeiro
      const relatorioBody = {
        metodo: "get",
        uri: "/prae/beneficio/relatorio/financeiro",
        params,
        data: {},
      };

      const responseRelatorio = await generica(relatorioBody);

      if (responseRelatorio?.data?.errors || responseRelatorio?.data?.error) {
        toast.error("Erro ao carregar relatório financeiro. Tente novamente!", {
          position: "bottom-left",
        });
      } else if (responseRelatorio?.data) {
        const relatorioData: RelatorioFinanceiroResponse = responseRelatorio.data;
        
        buscarTipoBeneficio();
        setDadosRelatorio(relatorioData);
        processarDados(relatorioData);

        if (relatorioData.totalGeral === 0 && relatorioData.quantidadePessoasAtendidas === 0) {
          toast.info("Nenhum dado encontrado com os filtros aplicados", {
            position: "bottom-left",
          });
        }
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar dados", { position: "bottom-left" });
    } finally {
      setCarregando(false);
    }
  };

  const buscarTipoBeneficio = async () => {
    try {
      const response = await generica({
        metodo: "get",
        uri: "/prae/tipo-beneficio",
        params: {},
        data: {},
      });

      if (response?.data?.errors || response?.data?.error) {
        toast.error("Erro ao carregar tipos de benefício", {
          position: "bottom-left",
        });
      } else {
        setTiposDisponiveis(response.data.content);
      }
    } catch (error) {
      console.error("Erro ao carregar tipos de benefício:", error);
      toast.error("Erro ao carregar tipos de benefício", {
        position: "bottom-left",
      });
    }
  };

  const formatarDataParaAPI = (dataMMAAAA: string): string => {
    if (!dataMMAAAA) return "";
    const [mes, ano] = dataMMAAAA.split("/");
    // Retorna no formato YYYY-MM-DD (primeiro dia do mês)
    return `01-${mes.padStart(2, "0")}-${ano}`;
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  const handleFiltroChange = (campo: keyof FiltrosRelatorio, valor: string) => {
    setFiltros((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  };

  const handleAplicarFiltros = () => {
    // Validar formato das datas se preenchidas
    if (filtros.periodoInicio || filtros.periodoFim) {
      const formatoValido = /^\d{2}\/\d{4}$/;

      if (filtros.periodoInicio && !formatoValido.test(filtros.periodoInicio)) {
        toast.error("Use o formato MM/AAAA para a data inicial", {
          position: "bottom-left",
        });
        return;
      }

      if (filtros.periodoFim && !formatoValido.test(filtros.periodoFim)) {
        toast.error("Use o formato MM/AAAA para a data final", {
          position: "bottom-left",
        });
        return;
      }

      if (filtros.periodoInicio && filtros.periodoFim) {
        const [mesInicio, anoInicio] = filtros.periodoInicio
          .split("/")
          .map(Number);
        const [mesFim, anoFim] = filtros.periodoFim.split("/").map(Number);

        if (
          anoFim < anoInicio ||
          (anoFim === anoInicio && mesFim < mesInicio)
        ) {
          toast.error("A data final deve ser maior ou igual à data inicial", {
            position: "bottom-left",
          });
          return;
        }
      }
    }

    buscarDados();
  };

  const resetarFiltros = () => {
    setFiltros({
      periodoInicio: "",
      periodoFim: "",
      tipo: "todos",
    });
    toast.info("Filtros resetados", { position: "bottom-left" });
  };

  // Atualizar dados quando os filtros forem resetados
  useEffect(() => {
    if (
      !filtros.periodoInicio &&
      !filtros.periodoFim &&
      filtros.tipo === "todos"
    ) {
      buscarDados();
    }
  }, [filtros]);

  useEffect(() => {
    buscarDados();
  }, []);

  return (
    <main className="flex flex-wrap justify-center mx-auto">
      <div className="w-full sm:w-11/12 2xl:w-10/12 p-4 sm:p-6 md:p-8 lg:p-12 2xl:p-20 pt-7 md:pt-8 md:pb-8">
        <Cabecalho dados={estrutura.cabecalho} />

        {/* Filtros Modernos */}
        <div className="mb-8 p-6 bg-white rounded-xl shadow-lg border border-gray-100">
          <div className="flex items-center mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                Filtrar Dados
              </h3>
              <p className="text-sm text-gray-500">
                Selecione o período e tipo de benefício para análise
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Filtro de Período */}
            <div className="lg:col-span-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center">Período</div>
              </label>
              <div className="flex items-center space-x-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="MM/AAAA"
                    value={filtros.periodoInicio}
                    onChange={(e) =>
                      handleFiltroChange("periodoInicio", e.target.value)
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    maxLength={7}
                  />
                  <div className="absolute right-3 top-3 text-gray-400 text-sm">
                    Início
                  </div>
                </div>
                <span className="text-gray-400">até</span>
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="MM/AAAA"
                    value={filtros.periodoFim}
                    onChange={(e) =>
                      handleFiltroChange("periodoFim", e.target.value)
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    maxLength={7}
                  />
                  <div className="absolute right-3 top-3 text-gray-400 text-sm">
                    Fim
                  </div>
                </div>
              </div>
            </div>

            {/* Filtro de Tipo */}
            <div className="lg:col-span-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center">
                  <TrendingUp className="mr-2 text-green-500" />
                  Tipo de Benefício
                </div>
              </label>
              <div className="relative">
                <select
                  value={filtros.tipo}
                  onChange={(e) => handleFiltroChange("tipo", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 appearance-none bg-white transition-all duration-200"
                >
                  <option value="todos">Todos os tipos de benefício</option>
                  {tiposDisponiveis.map((tipo, index) => (
                    <option key={index} value={tipo.tipo}>
                      {tipo.tipo}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-3 pointer-events-none">
                  <ExpandMore className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="lg:col-span-3 flex items-end">
              <div className="flex space-x-3 w-full">
                <button
                  onClick={resetarFiltros}
                  className="flex-1 px-2 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 font-medium flex items-center justify-center"
                >
                  Limpar Filtros
                </button>
                <button
                  onClick={handleAplicarFiltros}
                  className="flex-1 px-4 py-3 text-white rounded-lg bg-extra-150 hover:bg-extra-50 transition-all duration-200 font-medium flex items-center justify-center shadow-md hover:shadow-lg"
                  disabled={carregando}
                >
                  {carregando ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Aplicando...
                    </>
                  ) : (
                    <>Aplicar Filtros</>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Indicador de Filtros Ativos */}
          <div
            className={`mt-6 pt-6 border-t ${filtros.periodoInicio || filtros.periodoFim || filtros.tipo !== "todos" ? "" : "border-gray-100"}`}
          >
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-600 mr-3">
                Filtros ativos:
              </span>
              <div className="flex flex-wrap gap-2">
                {!filtros.periodoInicio &&
                !filtros.periodoFim &&
                filtros.tipo === "todos" ? (
                  <span className="px-3 py-1.5 bg-gray-100 text-gray-500 rounded-full text-sm font-medium">
                    <FilterAlt className="inline mr-1" />
                    Nenhum filtro aplicado
                  </span>
                ) : (
                  <>
                    {filtros.periodoInicio && filtros.periodoFim && (
                      <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium flex items-center">
                        <CalendarMonth className="mr-1.5" />
                        {filtros.periodoInicio} → {filtros.periodoFim}
                      </span>
                    )}
                    {filtros.tipo !== "todos" && (
                      <span className="px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-sm font-medium flex items-center">
                        <TrendingUp className="mr-1.5" />
                        Tipo: {filtros.tipo}
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Card Total */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg transform transition-transform duration-300 hover:scale-[1.02]">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-lg">
                <AttachMoney className="h-6 w-6" />
              </div>
              <span className="text-sm font-semibold opacity-90 bg-white/10 px-3 py-1 rounded-full">
                {hoje.getFullYear()}
              </span>
            </div>
            <div className="text-2xl font-bold mb-2">TOTAL EM R$</div>
            <div className="text-3xl font-bold mb-4">
              {formatarMoeda(dadosCalculados.totalRecurso)}
            </div>
            <div className="text-sm opacity-90">
              {dadosRelatorio?.quantidadeTiposBeneficio || 0} tipo{dadosRelatorio?.quantidadeTiposBeneficio !== 1 ? 's' : ''} de benefício
            </div>
          </div>

          {/* Card Pessoas */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg transform transition-transform duration-300 hover:scale-[1.02]">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-lg">
                <People className="h-6 w-6" />
              </div>
            </div>
            <div className="text-2xl font-bold mb-2">PESSOAS ATENDIDAS</div>
            <div className="text-3xl font-bold mb-4">
              {dadosCalculados.pessoasAtendidas}
            </div>
            <div className="text-sm opacity-90">Estudantes beneficiados</div>
          </div>

          {/* Card Tipos */}
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg transform transition-transform duration-300 hover:scale-[1.02]">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-lg">
                <Payments className="h-6 w-6" />
              </div>
            </div>
            <div className="text-2xl font-bold mb-2">TIPOS DE BENEFÍCIOS</div>
            <div className="text-3xl font-bold mb-4">
              {dadosCalculados.tiposBeneficio}
            </div>
            <div className="text-sm opacity-90">Distintos</div>
          </div>

          {/* Card Cursos */}
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-xl shadow-lg transform transition-transform duration-300 hover:scale-[1.02]">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-lg">
                <School className="h-6 w-6" />
              </div>
            </div>
            <div className="text-2xl font-bold mb-2">CURSOS ATENDIDOS</div>
            <div className="text-3xl font-bold mb-4">
              {dadosCalculados.cursosDistintos}
            </div>
            <div className="text-sm opacity-90">Distintos</div>
          </div>
        </div>

        {/* Gráficos - Layout de 2 colunas removido, agora apenas um gráfico por linha */}
        {/* Gráfico de Barras - Recurso por Tipo */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">
              RECURSO UTILIZADO POR TIPO DE BENEFÍCIO
            </h3>
            <div className="text-sm px-3 py-1 bg-blue-50 text-blue-600 rounded-full font-medium">
              {dadosCalculados.recursoPorTipo.length} tipos
            </div>
          </div>
          {dadosCalculados.recursoPorTipo.length > 0 ? (
            <div className="h-80">
              <Bar data={dadosGraficoBarra} options={opcoesGraficoBarra} />
            </div>
          ) : (
            <div className="h-80 flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <AttachMoney className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-500">Nenhum dado disponível</p>
              <p className="text-sm text-gray-400 mt-1">
                Aplique filtros para visualizar dados
              </p>
            </div>
          )}
        </div>

        {/* Gráfico de Pizza - Percentual por Curso */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">
              DISTRIBUIÇÃO DE ESTUDANTES POR CURSO
            </h3>
            <div className="text-sm px-3 py-1 bg-green-50 text-green-600 rounded-full font-medium">
              {dadosCalculados.percentualPorCurso.length} cursos
            </div>
          </div>
          {dadosCalculados.percentualPorCurso.length > 0 ? (
            <div className="flex flex-col lg:flex-row">
              <div className="w-full lg:w-2/3 h-96">
                <Pie data={dadosGraficoPizza} options={opcoesGraficoPizza} />
              </div>
              <div className="w-full lg:w-1/3 mt-6 lg:mt-0 lg:ml-8">
                <div className="space-y-3 max-h-96 overflow-y-auto pr-4">
                  {dadosCalculados.percentualPorCurso
                    .slice(0, 8)
                    .map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                      >
                        <div className="flex items-center">
                          <div
                            className="w-3 h-3 rounded-full mr-3"
                            style={{
                              backgroundColor:
                                dadosGraficoPizza.datasets[0].backgroundColor[
                                  index
                                ],
                            }}
                          ></div>
                          <span className="font-medium text-gray-700 truncate max-w-[150px]">
                            {item.curso}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-gray-800 block">
                            {item.percentual.toFixed(1)}%
                          </span>
                          <span className="text-xs text-gray-500">
                            {item.quantidade} estudante
                            {item.quantidade !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-96 flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <MenuBook className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-500">Nenhum dado de curso disponível</p>
              <p className="text-sm text-gray-400 mt-1">
                Aplique filtros para visualizar dados
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default withAuthorization(PageLista);