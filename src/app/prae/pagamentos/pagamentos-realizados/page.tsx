"use client"
import withAuthorization from '@/components/AuthProvider/withAuthorization';
import Cabecalho from '@/components/Layout/Interno/Cabecalho';
import Tabela from '@/components/Tabela/Estrutura';
import { generica } from '@/utils/api';
import { NoMeals } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

const estrutura: any = {

    uri: "/prae/pagamento",

    cabecalho: {
        titulo: "Pagamentos Realizados",
        migalha: [
            { nome: 'Home', link: '/home' },
            { nome: 'Prae', link: '/prae' },
            { nome: 'Pagamentos Realizados', link: '/prae/pagamentos-realizados' },
        ]
    },
    tabela: {
        configuracoes: {
            pesquisar: true,
            cabecalho: true,
            rodape: true,
        },
        botoes: [
        ],
        colunas: [
            { nome: "N° do Lote", chave: "numeroLote", tipo: "texto", pesquisar: true },
            { nome: "Nome do Estudante", chave: "beneficio.estudantes.aluno.nome", tipo: "texto", selectOptions: null, sort: false, pesquisar: true },
            { nome: "CPF", chave: "beneficio.estudantes.aluno.cpf", tipo: "texto", selectOptions: null, sort: false, pesquisar: true },
            { nome: "Tipo Pagamento", chave: "beneficio.tipoBeneficio.tipo", tipo: "texto", selectOptions: null, sort: false, pesquisar: true },
            { nome: "Valor Pago", chave: "valor", tipo: "texto", selectOptions: null, sort: false, pesquisar: true },
            { nome: "Data do Pagamento ", chave: "data", tipo: "texto", selectOptions: null, sort: false, pesquisar: true },
            { nome: "Mês de Referência", chave: "dataReferencia", tipo: "texto", selectOptions: null, sort: false, pesquisar: false },
            { nome: "ações", chave: "acoes", tipo: "button", selectOptions: null, sort: false, pesquisar: false },
        ],
        acoes_dropdown: [
            { nome: 'Editar', chave: 'editar' },
        ]
    }

}

const PageLista = () => {
    const router = useRouter();
    const [dados, setDados] = useState<any>({ content: [] });

    const chamarFuncao = (nomeFuncao = "", valor: any = null) => {
        switch (nomeFuncao) {
            case 'pesquisar':
                pesquisarRegistro(valor);
                break;
            case 'adicionar':
                adicionarRegistro();
                break;
            case 'editar':
                editarRegistro(valor);
                break;
            default:
                break;
        }
    }

    const formatarData = (data: string): string => {
      if (!data) return '';
      const [ano, mes, dia] = data.split('-');
      const d = new Date(Number(ano), Number(mes) - 1, Number(dia));
      return d.toLocaleDateString('pt-BR');
    };

    const pesquisarRegistro = async (params = null) => {
        try {
            let body = {
                metodo: 'get',
                uri: estrutura.uri,
                params: params != null ? params : { size: 10, page: 0 },
                data: {}
            };

            const response = await generica(body);

            if (response && response.data.errors != undefined) {
                    toast("Erro. Tente novamente!", { position: "bottom-left" });
                  } else if (response && response.data.error != undefined) {
                    toast(response.data.error.message, { position: "bottom-left" });
                  } else {
                    if (response && response.data) {
                        let processedContent = (response.data.content || []).map((item: any) => ({
                            ...item,
                            data: formatarData(item.data),
                            dataReferencia: `${item.mesReferencia}/${item.anoReferencia}`
                        }));
                        response.data.content = processedContent;
                      setDados(response.data);
                    }
                  }
        } catch (error) {
            toast.error("Erro ao carregar registros", { position: "top-left" });
        }
    };



    const adicionarRegistro = () => {
        router.push('');
    };

    const editarRegistro = (item: any) => {
        router.push('/prae/pagamentos/' + item.id);
    };

    useEffect(() => {
        chamarFuncao('pesquisar', null);
    }, []);

    return (
        <main className="flex flex-wrap justify-center mx-auto">
            <div className="w-full sm:w-11/12 2xl:w-10/12 p-4 sm:p-6 md:p-8 lg:p-12 :p-16 2xl:p-20 pt-7 md:pt-8 md:pb-8 ">
                <Cabecalho dados={estrutura.cabecalho} />
                <Tabela
                    dados={dados}
                    estrutura={estrutura}
                    chamarFuncao={chamarFuncao}
                />
            </div>
        </main>

    );
};

export default withAuthorization(PageLista);