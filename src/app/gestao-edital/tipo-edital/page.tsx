"use client"
import withAuthorization from '@/components/AuthProvider/withAuthorization';
import Cabecalho from '@/components/Layout/Interno/Cabecalho';
import Tabela from '@/components/Tabela/Estrutura';
import { generica } from '@/utils/api';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const estrutura: any = {
    uri: "tipo-edital", 

    cabecalho: {
        titulo: "Tipos de Editais",
        migalha: [
            { nome: 'Início', link: '/home' },
            { nome: 'Gestão de Editais', link: '/gestao-edita/editais' },
            { nome: 'Tipos de Editais', link: '/gestao-edital/editais/tipo-editais' },
        ]
    },

    tabela: {
        configuracoes: {
            pesquisar: true,
            cabecalho: true,
            rodape: true,
        },
        botoes: [
            { nome: 'Adicionar', chave: 'adicionar', bloqueado: false },
        ],
        colunas: [
            { nome: "Nome", chave: "nome", tipo: "texto", selectOptions: null, sort: false, pesquisar: true },
            { nome: "Descrição", chave: "descricao", tipo: "texto", selectOptions: null, sort: false, pesquisar: true },
            { nome: "Ações", chave: "acoes", tipo: "button", selectOptions: null, sort: false, pesquisar: false },
        ],
        acoes_dropdown: [
            { nome: 'Editar', chave: 'editar' },
            { nome: 'Deletar', chave: 'deletar' },
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
            case 'deletar':
                deletarRegistro(valor);
                break;
            default:
                break;
        }
    }

    const pesquisarRegistro = async (params = null) => {
        try {
            let body = {
                metodo: 'get',
                uri: '/editais/' + estrutura.uri,
                params: params != null ? params : { size: 10, page: 0 },
                data: {}
            }
            const response = await generica(body);
            if (response && response.data) {
                setDados(response.data);
            }
        } catch (error) {
            console.error("Erro ao carregar os registros:", error);
        }
    };

    const adicionarRegistro = () => {
        router.push('/gestao-edital/tipo-edital/criar');
    };
    const editarRegistro = (item: any) => {
        router.push('/gestao-edital/editais/tipo-edital/' + item.id);
    };
    
    const deletarRegistro = async (item: any) => {
        try {
            const body = {
                metodo: 'delete',
                uri: '/editais/' + estrutura.uri + '/' + item.id,
                params: {},

            };
            const response = await generica(body);
            pesquisarRegistro();
        } catch (error) {
            console.error('Erro ao deletar registro:', error);
        }
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