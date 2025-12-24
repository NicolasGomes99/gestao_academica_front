"use client";
import withAuthorization from "@/components/AuthProvider/withAuthorization";
import Cadastro from "@/components/Cadastro/Estrutura";
import Cabecalho from "@/components/Layout/Interno/Cabecalho";
import { generica } from "@/utils/api";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

const cadastro = () => {
    const router = useRouter();
    const { id } = useParams() as { id: string }; // garante que é string

    // Inicializamos com um objeto contendo 'endereco' para evitar problemas
    const [dadosPreenchidos, setDadosPreenchidos] = useState<DadosFormulario>();
    const [UnidadesPai, setUnidadesPai] = useState<any[]>([]);
    const [colaboradores, setColaboradores] = useState<any[]>([]);
    const [user, setUser] = useState<any[]>([]);

    const isEditMode = id && id !== "criar";
    const getOptions = (lista: any[], selecionado: any) => {
        if (!Array.isArray(lista)) return [];

        // Mapeia os itens considerando a estrutura do gestor
        const options = lista.map((gestor) => ({
            chave: gestor.id,
            valor: gestor.nome || gestor.email // Usa nome ou email como fallback
        }));

        if (isEditMode && selecionado) {
            const selectedOption = options.find((opt) => opt.chave === selecionado);
            if (selectedOption) {
                return [selectedOption, ...options.filter((opt) => opt.chave !== selecionado)];
            }
        }
        return options;
    };

    interface DadosFormulario {
        unidadePaiId?: number;
        usuarioId?: number;
        // Adicione aqui outros campos do seu formulário conforme necessário
    }
    const estrutura: any = {
        uri: "alocar-gestor",
        cabecalho: {
            titulo: isEditMode ? "Alocar Gestor" : "Alocar Gestor",
            migalha: [
                { nome: 'Início', link: '/home' },
                { nome: 'Gestão Acesso', link: '/gestao-acesso' },
                { nome: "Unidades Administrativas", link: "/gestao-acesso/unidades-administrativas" },
                {
                    nome: "Criar",
                    link: `/gestao-acesso/alocar-gestor/${isEditMode ? id : "criar"}`,
                },
            ],
        },
        cadastro: {
            campos: [
                {
                    line: 1,
                    colSpan: "md:col-span-1",
                    nome: "Gestor",
                    chave: "usuarioId",
                    tipo: "select",
                    mensagem: "Selecione o Gestor",
                    obrigatorio: false,
                    selectOptions: getOptions(colaboradores, dadosPreenchidos?.usuarioId),
                    //exibirPara: ["ALUNO"],
                },
            ],
            acoes: [
                { nome: "Cancelar", chave: "voltar", tipo: "botao" },
                { nome: isEditMode ? "Alocar Gestor" : "Cadastrar", chave: "salvar", tipo: "submit" },
            ],
        },
    };

    /**
     * Chama funções de acordo com o botão clicado
     */
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
        router.push("/gestao-acesso/unidades-administrativas");
    };

    /**
     * Salva o registro via POST, transformando os dados para que os itens de endereço
     * fiquem agrupados em um objeto 'endereco'.
     */
    interface DadosSalvamento {
        unidadeAdministrativaId?: number;
        usuarioId?: string;
    }

    const salvarRegistro = async (item: DadosSalvamento) => {
        try {
            // Verifica se estamos no modo de edição e pega o ID da URL
            const unidadeId = isEditMode ? id : null;

            if (!unidadeId) {
                toast.error("Nenhuma unidade administrativa selecionada", {
                    position: "top-left"
                });
                return;
            }

            if (!item.usuarioId) {
                toast.error("Selecione um gestor para alocar", {
                    position: "top-left"
                });
                return;
            }

            // Converte o ID para número (caso seja string)
            const unidadeIdNumber = Number(unidadeId);
            if (isNaN(unidadeIdNumber)) {
                toast.error("ID da unidade administrativa inválido", {
                    position: "top-left"
                });
                return;
            }

            // Payload no formato EXATO que a API espera
            const payload = {
                unidadeAdministrativaId: unidadeIdNumber,
                usuarioId: item.usuarioId
            };

            console.log("Payload sendo enviado:", payload); // Para debug

            const body = {
                metodo: "post",
                uri: "/auth/unidade-administrativa/" + id + "/gestores", // Endpoint correto
                params: {},
                data: payload,
            };

            const response = await generica(body);

            // Tratamento da resposta
            if (!response) {
                throw new Error("Sem resposta da API");
            }

            if (response.data?.error) {
                throw new Error(response.data.error.message || "Erro na API");
            }

            // Sucesso
            await Swal.fire({
                title: "Gestor alocado com sucesso!",
                icon: "success",
                confirmButtonText: "OK",
                confirmButtonColor: "#972E3F",
            });

            chamarFuncao("voltar");

        } catch (error: any) {
            console.error("Erro completo:", error);

            const errorMessage = error.response?.data?.message ||
                error.message ||
                "Erro desconhecido ao alocar gestor";

            toast.error(errorMessage, {
                position: "top-left",
                autoClose: 5000
            });
        }
    };
    /**
     * Localiza o registro para edição e preenche os dados
     */
    const editarRegistro = async (item: string | number) => { // 1. Tipo explícito para o parâmetro
        try {
            const body = {
                metodo: "get",
                uri: "/auth/" + estrutura.uri + "/" + item,
                params: {},
                data: {},
            };
            console.log("URI que será chamada para edição:", `/auth/${estrutura.uri}/${item}`);
            const response = await generica(body);

            if (!response) {
                throw new Error("Resposta inválida do servidor.");
            }

            if (response.data?.errors) {
                Object.keys(response.data.errors).forEach((campoErro) => {
                    toast(`Erro em ${campoErro}: ${response.data.errors[campoErro]}`, {
                        position: "top-left",
                    });
                });
                return;
            }

            if (response.data?.error) {
                toast(response.data.error.message, { position: "top-left" });
                return;
            }

            const data = response.data;
            setDadosPreenchidos(data);

            if (data?.unidadePaiId) {
                try {
                    const gestoresResponse = await generica({
                        metodo: 'get',
                        uri: `/auth/unidade-administrativa/${data.unidadePaiId}/gestores`,
                        params: { size: 25, page: 0 },
                        data: {}
                    });

                    if (gestoresResponse?.data?.errors) {
                        toast.error("Erro ao carregar gestores", { position: "bottom-left" }); // 2. Aspas fechadas
                    } else {
                        setColaboradores(gestoresResponse?.data || []);
                    }
                } catch (error) {
                    console.error('Erro ao carregar gestores:', error);
                    toast.error("Falha ao buscar gestores", { position: "bottom-left" }); // 2. Aspas fechadas
                }
            }

        } catch (error) {
            console.error("Erro ao localizar registro:", error);
            toast.error("Erro ao localizar registro. Tente novamente!", {
                position: "top-left",
                autoClose: 5000
            });
        }
    };

    const pesquisarTodosGestores = async () => {
        try {
            const response = await generica({
                metodo: 'get',
                uri: '/auth/gestor', // Endpoint que lista todos os usuários
                params: {
                    size: 20, // Pega todos de uma vez (ajuste conforme necessário)
                    page: 0,
                    // Adicione filtros se necessário (ex: perfil=GESTOR)
                },
                data: {}
            });

            if (response?.data?.errors) {
                toast.error("Erro ao carregar gestores", { position: "bottom-left" });
            } else {
                // Acessa o array 'content' da resposta
                const todosGestores = response?.data?.content || [];
                console.log('Gestores recebidos:', todosGestores); // Para debug
                setColaboradores(todosGestores);
            }
        } catch (error) {
            console.error('Erro ao carregar gestores:', error);
            toast.error("Falha ao buscar gestores", { position: "bottom-left" });
        }
    };
    const currentUser = async () => {
        try {
            const response = await generica(
                {
                    metodo: 'get',
                    uri: '/auth/usuario/current',
                    data: {}
                }
            );
            if (response?.data?.errors) {
                toast.error("Erro ao carregar dados do usuário!", { position: "top-left" });
            } else {
                setUser(response?.data);
            }
        } catch (error) {
            toast.error('Erro ao carregar dados!', { position: "top-left" });
        }
    };

    // Se estiver em modo de edição, carrega os dados ao montar
    useEffect(() => {
        pesquisarTodosGestores(); // Nova função para buscar todos os gestores
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

export default withAuthorization(cadastro);