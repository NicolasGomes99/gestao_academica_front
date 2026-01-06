"use client";
import React, { useEffect, useRef, useState } from 'react';
import Pagination from './Itens/Paginacao';
import { Delete, Edit, Visibility } from '@mui/icons-material';

const TabelaArvore = ({ dados = null, estrutura = null, chamarFuncao = null }: any) => {
  // Estados
  const [dropdownAberto, setDropdownAberto] = useState<any>({});
  const dropdownRef = useRef<any>(null);
  const [bodyParams, setBodyParams] = useState<any>({ size: 10 });
  const [showFilters, setShowFilters] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [treeData, setTreeData] = useState<any[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Record<number, boolean>>({});

  // Função auxiliar para gerar keys únicas
  const generateUniqueKey = (base: string, suffix?: string) => {
    return `${base || "key"}_${
      suffix || Math.random().toString(36).substr(2, 9)
    }`;
  };

  // Detecta se é desktop ou mobile
  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 768;
      setIsDesktop(desktop);
      if (desktop) {
        setShowFilters(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Converte dados planos em árvore (usando unidadePaiId)
  useEffect(() => {
    if (!dados || !Array.isArray(dados)) return;
    const dataMap = new Map<number, any>();
    dados.forEach((item: any) => {
      dataMap.set(item.id, { ...item, children: [] });
    });
    const tree: any[] = [];
    dataMap.forEach((item: any) => {
      if (item.unidadePaiId === null || !dataMap.has(item.unidadePaiId)) {
        tree.push(item);
      } else {
        const parent = dataMap.get(item.unidadePaiId);
        parent.children.push(item);
      }
    });
    setTreeData(tree);
  }, [dados]);

  // Atualiza filtros e chama função de pesquisa
  const paramsColuna = (chave: any = null, valor: any = null) => {
    if (chave != null && valor != null) {
      const updatedBodyParams = { ...bodyParams, [chave]: valor };
      setBodyParams(updatedBodyParams);
      chamarFuncao && chamarFuncao('pesquisar', updatedBodyParams);
    }
  };

  // Dropdown de ações
  const dropdownAbrirFechar = (id: any) => {
    setDropdownAberto((prevState: any) => ({ ...prevState, [id]: !prevState[id] }));
  };

  const dropdownCliqueiFora = (event: any) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setDropdownAberto({});
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', dropdownCliqueiFora);
    return () => document.removeEventListener('mousedown', dropdownCliqueiFora);
  }, []);

  // Formatação de datas (ISO8601)
  const verificaTexto = (texto: any) => {
    const iso8601Regex = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})\.(\d{3})[+-]\d{2}:\d{2}$/;
    if (texto != null && iso8601Regex.test(texto)) {
      const [dataStr, rest] = texto.split("T");
      const [hora] = rest.split(".");
      const [ano, mes, dia] = dataStr.split("-");
      return `${dia}/${mes}/${ano} ${hora}`;
    }
    return texto;
  };

  // Renderiza filtros se configurados
  const renderFiltros = () => {
    if (!estrutura?.tabela?.colunas) return null;
    
    // Função para abreviar textos longos no placeholder
    const abreviarTexto = (texto: string, maxLength: number = 15) => {
      if (!texto) return '';
      if (texto.length <= maxLength) return texto;
      
      const palavras = texto.split(' ');
      
      if (palavras.length === 1) {
        return texto.substring(0, maxLength - 3) + '...';
      }
      
      const primeiraPalavra = palavras[0];
      const palavrasRestantes = palavras.slice(1).join(' ');
      
      if (primeiraPalavra.length > 3) {
        const primeiraAbreviada = primeiraPalavra.substring(0, 1) + '.';
        const resultado = `${primeiraAbreviada} ${palavrasRestantes}`;
        
        return resultado.length <= maxLength 
          ? resultado 
          : resultado.substring(0, maxLength - 3) + '...';
      }
      
      return texto.substring(0, maxLength - 3) + '...';
    };

    const filters = estrutura.tabela.colunas.filter((col: any) => col.pesquisar);
    return (
      <div
        className={`${
          isDesktop ? "flex gap-4 items-end" : "flex flex-col gap-4"
        } w-full pt-2`}
      >
        {filters.map((item: any) => (
          <div
            key={generateUniqueKey("filtro", item.chave)}
            className="flex flex-col max-w-xs"
          >
            <label
              htmlFor={`filtro_${item.chave}`}
              className="mb-2 text-sm font-bold text-gray-700 truncate overflow-hidden whitespace-nowrap"
              title={item.nome}
            >
              {item.nome}
            </label>
            
            {(item.tipo === 'texto' || item.tipo === 'json') &&
              !(item.selectOptions && item.selectOptions.length > 0) && (
                <input
                  type="text"
                  id={`filtro_${item.chave}`}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-extra-50 focus:border-transparent w-full max-w-xs placeholder-gray-400 placeholder:truncate placeholder:overflow-hidden placeholder:whitespace-nowrap"
                  placeholder={`Filtrar por ${abreviarTexto(item.nome)}`}
                  onChange={(e) => paramsColuna(item.chave, e.target.value)}
                />
              )}
            
            {(item.tipo === 'booleano' ||
              item.tipo === 'status' ||
              (item.tipo === 'texto' && item.selectOptions && item.selectOptions.length > 0)) && (
                <select
                  id={`filtro_${item.chave}`}
                  className="min-w-[0px] px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-extra-50 focus:border-transparent text-gray-500 truncate"
                  onChange={(e) => paramsColuna(item.chave, e.target.value)}
                >
                  {!item.selectOptions?.some((option: any) => option.valor === "Todos") && (
                    <option value="" className="truncate">
                      {abreviarTexto(item.nome)}
                    </option>
                  )}
                  {item.selectOptions.map((option: { chave: any; valor: any }) => (
                    <option
                      key={generateUniqueKey(option.chave, "option")}
                      value={option.chave}
                      className="truncate"
                    >
                      {option.valor}
                    </option>
                  ))}
                </select>
              )}
          </div>
        ))}
      </div>
    );
  };

  // Renderiza o conteúdo de cada célula
  const renderCellContent = (node: any, col: any) => {
    if (col.tipo === 'json') {
      const [key, jsonKey] = col.chave.split('|');
      try {
        const jsonItem = JSON.parse(node[key]);
        if (jsonItem && typeof jsonItem[jsonKey] !== 'object') {
          return verificaTexto(jsonItem[jsonKey]);
        }
        return '';
      } catch {
        return '';
      }
    } else if (node[col.chave] !== undefined) {
      if (col.tipo === "status" && col.selectOptions) {
        const selectOption = col.selectOptions.find((option: any) => option.chave === node[col.chave]);
        if (selectOption) {
          switch (selectOption.valor) {
            case 'Finalizado':
              return (
                <span className="px-3 py-1.5 inline-flex text-xs font-medium rounded-full bg-green-100 text-green-800">
                  {selectOption.valor}
                </span>
              );
            case 'Erro':
              return (
                <span className="px-3 py-1.5 inline-flex text-xs font-medium rounded-full bg-red-100 text-red-800">
                  {selectOption.valor}
                </span>
              );
            default:
              return (
                <span className="px-3 py-1.5 inline-flex text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                  {selectOption.valor}
                </span>
              );
          }
        }
        return '';
      } else if (col.tipo === "booleano" || col.selectOptions) {
        const selectOption = col.selectOptions && col.selectOptions.find((option: any) => option.chave === node[col.chave]);
        if (selectOption) {
          return (
            <div className={`text-sm ${selectOption.chave === true || selectOption.chave === "APROVADA"
              ? "text-green-600"
              : selectOption.chave === "PENDENTE"
                ? "text-yellow-600"
                : "text-red-600"
              }`}
            >
              {selectOption.valor}
            </div>
          );
        }
        return '';
      } else if (typeof node[col.chave] !== 'object') {
        return verificaTexto(node[col.chave]);
      }
      return '';
    } else {
      // Trata campos aninhados (ex.: "tipoUnidade.nome")
      if (col.chave.indexOf('.') !== -1) {
        const keys = col.chave.split('.');
        let nestedValue = node;
        for (let k of keys) {
          if (nestedValue) nestedValue = nestedValue[k];
        }
        if (nestedValue !== undefined && typeof nestedValue !== 'object') {
          return verificaTexto(nestedValue);
        }
      }
      return '';
    }
  };

  // Helper para alinhamento
  const getAlinhamentoColuna = () => {
    return "text-center";
  };

  const getAlinhamentoConteudo = () => {
    return "justify-center";
  };

  const isColunaAcoes = (nomeColuna: string) => {
    return nomeColuna.toUpperCase() === "AÇÕES";
  };

  // --------------------------------------------------
  // RENDERIZAÇÃO DESKTOP
  // --------------------------------------------------

  const renderRow = (node: any, level: number = 0, ancestorsHaveNextSibling: boolean[] = []) => {
    const spacing = 30;
    const offset = 0;

    // Pega irmãos para saber se o nó atual tem um próximo
    const parentChildren = node.unidadePaiId != null
      ? dados.filter((item: any) => item.unidadePaiId === node.unidadePaiId)
      : treeData;

    const currentIndex = parentChildren.findIndex((item: any) => item.id === node.id);
    const hasNextSibling = currentIndex < parentChildren.length - 1;

    return (
      <React.Fragment key={node.id}>
        <tr className="hover:bg-gray-50 transition-colors duration-150">
          {estrutura.tabela.colunas.map((col: any, index: number) => {
            if (index === 0) {
              return (
                <td key={generateUniqueKey(`cell_${node.id}`, col.chave)} className="px-4 py-4 whitespace-nowrap relative">

                  {/* Linhas verticais dos ancestrais */}
                  {ancestorsHaveNextSibling.map((hasSibling, i) =>
                    hasSibling ? (
                      <div
                        key={i}
                        className="absolute inset-y-0"
                        style={{
                          left: `${(i + 1) * spacing - spacing / 111 + offset}px`,
                          width: "1px",
                          borderLeft: "1px dashed #666",
                        }}
                      />
                    ) : null
                  )}

                  {/* Linha horizontal (apenas no nível atual, se for filho) */}
                  {level > 0 && (
                    <div
                      className="absolute"
                      style={{
                        top: "50%",
                        left: `${level * spacing + offset}px`,
                        width: "20px",
                        height: "1px",
                        backgroundColor: "#666",
                      }}
                    />
                  )}

                  {/* Conteúdo com indentação */}
                  <div className="flex items-center" style={{ paddingLeft: `${level * spacing + offset}px` }}>
                    {node.children && node.children.length > 0 && (
                      <button 
                        onClick={() => toggleNode(node.id)} 
                        className="mr-2 focus:outline-none text-gray-600 hover:text-gray-900"
                      >
                        {expandedNodes[node.id] ? "▼" : "▶"}
                      </button>
                    )}
                    <span
                      className={`text-sm ${level === 0 ? "font-semibold text-gray-900" : "text-gray-700"}`}
                    >
                      {renderCellContent(node, col)}
                    </span>
                  </div>
                </td>
              );
            } else if (col.chave === 'acoes') {
              return (
                <td
                  key={generateUniqueKey(`cell_${node.id}`, col.chave)}
                  className="px-4 py-4 whitespace-nowrap text-center w-40"
                >
                  <div className="flex items-center justify-center gap-2">
                    {estrutura.tabela.acoes_dropdown &&
                      estrutura.tabela.acoes_dropdown.map((acao: any) => (
                        <button
                          key={generateUniqueKey(`acao_${node.id}`, acao.chave)}
                          className="inline-flex items-center justify-center p-1.5 text-gray-600 hover:text-blue-600 transition-colors duration-150"
                          title={acao.nome}
                          onClick={() => chamarFuncao(acao.chave, node)}
                        >
                          {acao.nome === 'Editar' && (
                            <Edit className="w-5 h-5" />
                          )}
                          {acao.nome === 'Visualizar' && (
                            <Visibility className="w-5 h-5" />
                          )}
                          {acao.nome === 'Deletar' && (
                            <Delete className="w-5 h-5 text-red-700" />
                          )}
                        </button>
                      ))}
                  </div>
                </td>
              );
            } else {
              return (
                <td 
                  key={generateUniqueKey(`cell_${node.id}`, col.chave)} 
                  className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-center"
                >
                  {renderCellContent(node, col)}
                </td>
              );
            }
          })}
        </tr>

        {/* Renderiza filhos se expandidos */}
        {node.children &&
          node.children.length > 0 &&
          expandedNodes[node.id] &&
          node.children.map((child: any, idx: number) =>
            renderRow(child, level + 1, [
              ...ancestorsHaveNextSibling,
              idx < node.children.length // só desenha linha se ainda houver irmãos depois
            ])
          )}
      </React.Fragment>
    );
  };

  // --------------------------------------------------
  // RENDERIZAÇÃO MOBILE
  // --------------------------------------------------
  const renderMobileRow = (node: any, level: number = 0) => {
    return (
      <div
        key={node.id}
        className="bg-white border border-gray-200 rounded-lg p-4 mb-4 shadow-sm"
        style={{
          // Linha-guia + indentação para filhos
          borderLeft: level >= 1 ? "0.05rem dashed #666" : "none",
          paddingLeft: level >= 1 ? `${level * 30}px` : "0",
        }}
      >
        {/* Cabeçalho do item (exibindo a primeira coluna) */}
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200">
          <div className="flex items-center">
            {node.children && node.children.length > 0 && (
              <button
                onClick={() => toggleNode(node.id)}
                className="mr-2 focus:outline-none text-gray-600 hover:text-gray-900"
              >
                {expandedNodes[node.id] ? "▼" : "▶"}
              </button>
            )}
            <span className="font-semibold text-sm text-gray-900">
              {renderCellContent(node, estrutura.tabela.colunas[0])}
            </span>
          </div>
        </div>

        {/* Demais colunas no "corpo" do card */}
        <div>
          {estrutura.tabela.colunas.slice(1).map((col: any) => {
            if (col.chave === "acoes") {
              return (
                <div key={generateUniqueKey(`mobile_actions_${node.id}`, col.chave)} className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap gap-2 justify-center">
                  {estrutura.tabela.acoes_dropdown &&
                    estrutura.tabela.acoes_dropdown.map(
                      (acao: any) => (
                        <button
                          key={generateUniqueKey(`mobile_acao_${node.id}`, acao.chave)}
                          className="px-4 py-2 text-sm text-white bg-extra-150 hover:bg-extra-50 rounded-md"
                          onClick={() => chamarFuncao(acao.chave, node)}
                        >
                          {acao.nome}
                        </button>
                      )
                    )}
                </div>
              );
            } else {
              return (
                <div key={generateUniqueKey(`mobile_${node.id}`, col.chave)} className="mb-3">
                  <span className="block text-xs font-medium text-gray-700 mb-1 text-center">
                    {col.nome}
                  </span>
                  <div className="flex justify-center">
                    <span className="block text-sm text-gray-900 text-center">
                      {renderCellContent(node, col)}
                    </span>
                  </div>
                </div>
              );
            }
          })}

          {/* Se tiver filhos e estiver expandido, renderiza recursivamente */}
          {node.children &&
            node.children.length > 0 &&
            expandedNodes[node.id] && (
              <div className="mt-4">
                {node.children.map((child: any) =>
                  renderMobileRow(child, level + 1)
                )}
              </div>
            )}
        </div>
      </div>
    );
  };

  // Alterna a expansão de um nó
  const toggleNode = (id: number) => {
    setExpandedNodes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="w-full">
      <div className="flex flex-col">
        {/* Cabeçalho com filtros e botões */}
        <div className="mb-6 pt-2">
          {/* Filtros e Botão de Toggle (Mobile) */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-4">
            {/* Área de Filtros */}
            {estrutura?.tabela?.configuracoes?.pesquisar && (
              <div className="flex-1">
                {/* Botão de toggle para mobile e botões de ação */}
                <div className="md:hidden mb-4 flex justify-between items-center gap-2">
                  <button
                    className="px-4 py-2 bg-white text-extra-50 text-sm rounded-md border border-extra-50 hover:bg-blue-50 transition-colors duration-200"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    {showFilters ? "▲" : "▼"} Filtrar
                  </button>

                  {/* Botões de Ação (Mobile) */}
                  <div className="flex items-center gap-2">
                    {estrutura.tabela.botoes &&
                      estrutura.tabela.botoes
                        .filter((botao: any) => botao.nome !== 'Filtrar')
                        .map((botao: any) => (
                        <button
                          key={generateUniqueKey("botao-mobile", botao.chave)}
                          className="px-6 py-2 text-sm font-medium text-white bg-extra-150 hover:bg-extra-50 rounded-lg shadow-sm transition-colors duration-200"
                          disabled={botao.bloqueado}
                          hidden={botao.oculto}
                          onClick={() => chamarFuncao(botao.chave, botao)}
                        >
                          {botao.nome}
                        </button>
                      ))}
                  </div>
                </div>

                {/* Filtros - Sempre visíveis no desktop */}
                <div
                  className={`${
                    isDesktop ? "block" : showFilters ? "block" : "hidden"
                  }`}
                >
                  {renderFiltros()}
                </div>
              </div>
            )}

            {/* Botões de Ação - Alinhados com os filtros (Desktop apenas) */}
            <div className="hidden md:flex items-end gap-2 flex-shrink-0 pt-2">
              {estrutura.tabela.botoes &&
                estrutura.tabela.botoes
                  .filter((botao: any) => botao.nome !== 'Filtrar')
                  .map((botao: any) => (
                  <button
                    key={generateUniqueKey("botao", botao.chave)}
                    className="px-6 py-2.5 text-sm font-medium text-white bg-extra-150 hover:bg-extra-50 rounded-lg shadow-sm transition-colors duration-200"
                    disabled={botao.bloqueado}
                    hidden={botao.oculto}
                    onClick={() => chamarFuncao(botao.chave, botao)}
                  >
                    {botao.nome}
                  </button>
                ))}
            </div>
          </div>
        </div>

        {/* Tabela (Desktop) */}
        <div className="overflow-x-auto bg-white rounded-lg border border-gray-200 hidden md:block">
          <table className="min-w-full divide-y divide-gray-200">
            <thead
              className="bg-gray-50"
              hidden={estrutura?.tabela?.configuracoes && !estrutura.tabela.configuracoes.cabecalho}
            >
              <tr>
                {estrutura.tabela.colunas.map((item: any) => (
                  <th
                    key={generateUniqueKey("cabecalho", item.chave)}
                    className={`px-6 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider ${getAlinhamentoColuna()} ${
                      isColunaAcoes(item.nome)
                        ? "w-40"
                        : item.nome.toUpperCase() === "STATUS"
                        ? "w-32"
                        : ""
                    }`}
                    title={item.hint || ''}
                  >
                    <div
                      className={`flex items-center gap-2 ${getAlinhamentoConteudo()}`}
                    >
                      {item.nome}
                      {item.hint && (
                        <div className="relative group">
                          <svg
                            className="w-4 h-4 text-gray-500 cursor-pointer"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                          >
                            <path
                              fillRule="evenodd"
                              d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12Zm9.408-5.5a1 1 0 1 0 0 2h.01a1 1 0 1 0 0-2h-.01ZM10 10a1 1 0 1 0 0 2h1v3h-1a1 1 0 1 0 0 2h4a1 1 0 1 0 0-2h-1v-4a1 1 0 0 0-1-1h-2Z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      )}
                      {item.sort && (
                        <button
                          className="ml-1"
                          onClick={() =>
                            paramsColuna(
                              'sort',
                              bodyParams.sort != null &&
                                bodyParams.sort.split(',')[1] === 'asc'
                                ? `${item.chave},desc`
                                : `${item.chave},asc`
                            )
                          }
                          hidden={!item.sort}
                        >
                          {bodyParams.sort != null &&
                            bodyParams.sort.split(',')[0] === item.chave &&
                            bodyParams.sort.split(',')[1] === 'asc'
                            ? '▲'
                            : '▼'}
                        </button>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {treeData && treeData.length > 0 ? (
                treeData.map((node: any) => renderRow(node))
              ) : (
                <tr>
                  <td colSpan={estrutura.tabela.colunas.length} className="px-6 py-12 text-center">
                    <p className="text-sm text-gray-500">
                      Nenhum registro encontrado.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Versão Mobile */}
        <div className="block md:hidden">
          {treeData && treeData.length > 0 ? (
            treeData.map((node: any) => renderMobileRow(node))
          ) : (
            <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-500">
                Nenhum registro encontrado.
              </p>
            </div>
          )}
        </div>
      </div>

      {estrutura?.tabela?.configuracoes?.rodape && (
        <Pagination dados={dados} paramsColuna={paramsColuna} />
      )}
    </div>
  );
};

export default TabelaArvore;