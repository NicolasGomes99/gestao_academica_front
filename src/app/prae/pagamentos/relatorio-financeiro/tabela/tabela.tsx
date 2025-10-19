import { useEffect, useRef, useState } from 'react';
import Pagination from '@/components/Tabela/Itens/Paginacao';
import { Delete, Edit, Visibility } from '@mui/icons-material';

const Tabela = ({ dados = null, estrutura = null, chamarFuncao = null }: any) => {
  const [dropdownAberto, setDropdownAberto] = useState<any>({});
  const dropdownRef = useRef<any>(null);
  const [bodyParams, setBodyParams] = useState<any>({ size: 10 });
  const [showFilters, setShowFilters] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // NORMALIZA os dados recebidos:
  const linhas = Array.isArray(dados) ? dados : (dados?.content ?? []);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const paramsColuna = (chave: any = null, valor: any = null) => {
    if (chave != null && valor != null) {
      let updatedBodyParams;

      // Caso especial para ordenação - mantém outros parâmetros
      if (chave === "sort") {
        updatedBodyParams = {
          ...bodyParams,
          sort: valor,
          page: 0 // Resetar paginação quando ordenar
        };
      } else {
        updatedBodyParams = {
          ...bodyParams,
          [chave]: valor,
          page: 0 // Resetar paginação quando filtrar
        };

        // Remover ordenação se estiver filtrando por outra coluna
        if (chave !== "sort" && bodyParams.sort) {
          delete updatedBodyParams.sort;
        }
      }

      setBodyParams(updatedBodyParams);
      chamarFuncao('pesquisar', updatedBodyParams);
    }
  };

  const dropdownAbrirFechar = (id: any) => {
    setDropdownAberto((prevState: any) => ({ ...prevState, [id]: !prevState[id] }));
  };

  const dropdownCliqueiFora = (event: any) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setDropdownAberto({});
    }
  };

  const handleSort = (field: string) => {
    // Se clicarmos no mesmo campo, invertemos a direção
    if (sortField === field) {
      const newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
      setSortDirection(newDirection);
    } else {
      // Se for um campo diferente, definimos como ascendente por padrão
      setSortField(field);
      setSortDirection('asc');
    }

    // Chamamos a função pai para notificar a ordenação
    if (chamarFuncao) {
      chamarFuncao('ordenar', { campo: field, direcao: sortField === field ? (sortDirection === 'asc' ? 'desc' : 'asc') : 'asc' });
    }
  };

  const verificaTexto = (texto: any) => {
    const iso8601Regex = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})\.(\d{3})[+-]\d{2}:\d{2}$/;
    if (texto != null && iso8601Regex.test(texto)) {
      let dataString = texto;
      let data = dataString.split("T")[0];
      let hora = dataString.split("T")[1].split(".")[0];
      let dia = data.split('-')[2];
      let mes = data.split('-')[1];
      let ano = data.split('-')[0];
      return `${dia}/${mes}/${ano} ${hora}`;
    } else {
      return texto;
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', dropdownCliqueiFora);
    return () => {
      document.removeEventListener('mousedown', dropdownCliqueiFora);
    };
  }, []);

  // Renderiza os filtros em um grid responsivo:
  const renderFiltros = () => {
    const filters = estrutura.tabela.colunas.filter((col: any) => col.pesquisar);
    return (
      <div className="flex flex-wrap gap-4 w-full">
        {filters?.map((item: any, index: any) => (
          <div
            key={`filtro_${index}`}
            className="w-full sm:w-auto flex-1 min-w-[200px] flex flex-col"
          >
            <label
              htmlFor={`filtro_${index}`}
              className="mb-1 text-sm font-bold text-neutrals-900"
            >
              {item.nome}
            </label>

            {(item.tipo === 'texto' || item.tipo === 'json') &&
              !(item.selectOptions && item.selectOptions.length > 0) && (
                <input
                  type="text"
                  id={`filtro_${index}`}
                  className="pl-2 py-1 border rounded-md text-sm"
                  placeholder="Pesquisar"
                  onChange={(e) => paramsColuna(item.chave, e.target.value)}
                />
              )}

            {(item.tipo === 'booleano' ||
              (item.tipo === 'texto' && item.selectOptions && item.selectOptions.length > 0)) && (
                <select
                  id={`filtro_${index}`}
                  className="pl-2 py-1 border rounded-md text-sm bg-white"
                  onChange={(e) => paramsColuna(item.chave, e.target.value)}
                >
                  {!item.selectOptions?.some((option: any) => option.valor === "Todos") && (
                    <option value="">Selecionar</option>
                  )}
                  {item.selectOptions.map((option: { chave: any; valor: any }) => (
                    <option key={option.chave} value={option.chave}>
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

  return (
    <div>
      <div className="flex flex-col">
        {/* Linha de botões */}
        <div className="flex justify-between items-center overflow-x-auto mt-2.5">
          {/* Lado Esquerdo: Botão de Filtrar */}
          <div className="flex items-center">
            {estrutura.tabela.configuracoes?.pesquisar && (
              <div className="relative ml-2">
                <button
                  className="mb-2 px-4 py-2 bg-neutrals-100 text-primary-500 text-sm rounded-md border border-primary-500 hover:bg-primary-700 hover:text-white hover:border-primary-700 transition-colors duration-200"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  {showFilters ? '▲' : '▼'} Filtrar
                </button>
              </div>
            )}
          </div>
          {/* Lado Direito: Outros botões */}
          <div className="flex items-center">
            {estrutura.tabela.botoes &&
              estrutura.tabela.botoes
                .filter((botao: any) => botao.nome !== 'Filtrar')
                .map((botao: any, index: number) => (
                  <button
                    key={index}
                    className="ml-2 mb-2 px-4 py-2 text-sm text-neutrals-50 bg-primary-500 hover:bg-primary-700 border rounded-md"
                    disabled={botao.bloqueado}
                    hidden={botao.oculto}
                    onClick={() => chamarFuncao(botao.chave, botao)}
                  >
                    {botao.nome}
                  </button>
                ))}
          </div>
        </div>
        {showFilters && (
          <div className="mb-4 p-4 bg-neutrals-50 rounded-md shadow">
            {renderFiltros()}
          </div>
        )}

        {/* Tabela (Desktop) */}
        <div className="overflow-x-auto rounded-md border-2 border-neutrals-200 hidden md:block">
          <div className="min-w-full inline-block align-middle">
            <div className="rounded-md overflow-hidden">
              <table className="min-w-full divide-y divide-neutrals-200">
                <thead className="bg-neutrals-50" hidden={estrutura.tabela.configuracoes && !estrutura.tabela.configuracoes.cabecalho}>
                  <tr>
                    {estrutura.tabela.colunas.map((item: any, index: any) => (
                      <td
                        key={"menu_" + index}
                        className={
                          item.nome.toUpperCase() === "AÇÕES"
                            ? "w-24 px-2 py-3 whitespace-nowrap text-sm font-bold uppercase text-neutrals-900 text-right"
                            : "px-6 py-3 whitespace-nowrap text-sm font-bold uppercase text-neutrals-900 text-center"
                        }
                      >
                        <div className="flex items-center justify-center gap-2">
                          {item.nome}
                          {item.hint && (
                            <div className="ml-2 relative group">
                              <svg
                                className="w-5 h-5 text-neutrals-800 cursor-pointer"
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
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
                              className="ml-2 flex flex-col items-center"
                              onClick={() => {
                                const currentSort = bodyParams.sort?.split(',') || [];
                                let newSort;

                                if (currentSort[0] === item.chave) {
                                  newSort = currentSort[1] === 'asc'
                                    ? `${item.chave},desc`
                                    : `${item.chave},asc`;
                                } else {
                                  newSort = `${item.chave},asc`;
                                }

                                paramsColuna("sort", newSort);
                              }}
                            >
                              <span className={`text-xs ${bodyParams.sort?.startsWith(`${item.chave},`) && bodyParams.sort?.endsWith('asc') ? 'text-primary-500' : 'text-neutrals-400'}`}>
                                ▲
                              </span>
                              <span className={`text-xs ${bodyParams.sort?.startsWith(`${item.chave},`) && bodyParams.sort?.endsWith('desc') ? 'text-primary-500' : 'text-neutrals-400'}`}>
                                ▼
                              </span>
                            </button>
                          )}
                        </div>
                      </td>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutrals-200">
                  {linhas.length > 0 ? (
                    linhas.map((item: any) => (
                      <tr key={item.id} className="hover:bg-neutrals-100">
                        {estrutura.tabela.colunas.map(({ chave, tipo, selectOptions }: any) => {
                          if (chave === 'acoes') {
                            return (
                              <td
                                key="acoes"
                                className="px-2 py-2 whitespace-nowrap relative border-l border-neutrals-200 flex items-center justify-center"
                              >
                                {estrutura.tabela.acoes_dropdown.map((acao: any, index_acao: any) => (
                                  <button
                                    key={index_acao}
                                    className={`block px-3 py-2 text-sm w-full text-center justify-center
  ${acao.nome === 'Selecionar' || acao.nome === 'Alocar'
                                        ? 'bg-primary-100 text-primary-700 font-bold rounded hover:bg-primary-100'
                                        : acao.nome === 'Remover'
                                          ? 'bg-danger-50 text-danger-500 font-bold rounded hover:bg-danger-50'
                                          : 'text-neutrals-700 hover:bg-neutrals-100'}`}
                                    role="menuitem"
                                    onClick={() => chamarFuncao(acao.chave, item)}
                                  >
                                    {acao.nome === 'Editar' && (
                                      <Edit className='text-primary-700' />
                                    )}
                                    {acao.nome === 'Visualizar' && (
                                      <Visibility className='text-primary-700' />
                                    )}
                                    {acao.nome === 'Deletar' && (
                                      <Delete className='text-danger-500' />
                                    )}
                                    {acao.nome === 'Selecionar' && (
                                      <span>Selecionar</span>
                                    )}
                                    {acao.nome === 'Alocar' && (
                                      <span>Alocar Colaborador</span>
                                    )}
                                    {acao.nome === 'Remover' && (
                                      <span>Remover Colaborador</span>
                                    )}
                                  </button>
                                ))}
                              </td>
                            );
                          } else if (item[chave] !== undefined && tipo === "status") {
                            const selectOption = selectOptions.find(
                              (option: any) => option.chave === item[chave]
                            );
                            if (selectOption) {
                              let element;
                              switch (selectOption.valor) {
                                case 'Finalizado':
                                  element = (
                                    <td
                                      key={chave}
                                      className="px-6 py-2 whitespace-nowrap flex justify-center items-center font-normal"
                                    >
                                      <span className="px-2 inline-flex text-sm leading-5 font-normal rounded-full bg-green-100 text-green-800">
                                        {selectOption.valor}
                                      </span>
                                    </td>
                                  );
                                  break;
                                case 'Erro':
                                  element = (
                                    <td
                                      key={chave}
                                      className="px-6 py-2 whitespace-nowrap flex justify-center items-center font-normal"
                                    >
                                      <span className="px-2 inline-flex text-sm leading-5 font-normal rounded-full bg-red-100 text-red-800">
                                        {selectOption.valor}
                                      </span>
                                    </td>
                                  );
                                  break;
                                default:
                                  element = (
                                    <td
                                      key={chave}
                                      className="px-6 py-2 whitespace-nowrap flex justify-center items-center font-normal"
                                    >
                                      <span className="px-3 inline-flex text-sm leading-6 font-normal rounded-full bg-neutrals-100 text-neutrals-800">
                                        {selectOption.valor}
                                      </span>
                                    </td>
                                  );
                              }
                              return element;
                            }
                          } else if (item[chave] !== undefined && (tipo === "booleano" || selectOptions)) {
                            const selectOption = selectOptions.find(
                              (option: any) => option.chave === item[chave]
                            );
                            if (selectOption) {
                              return (
                                <td key={chave} className="px-4 py-3 whitespace-nowrap text-center">
                                  <span className={`text-sm ${selectOption.chave === true || selectOption.chave === "APROVADA"
                                    ? "text-green-600"
                                    : selectOption.chave === "PENDENTE"
                                      ? "text-yellow-600"
                                      : "text-red-600"}`}>
                                    {selectOption.valor}
                                  </span>
                                </td>
                              );
                            } else {
                              return null;
                            }
                          } else if (tipo === "json") {
                            const partes = chave.split('|');
                            let key = partes[0];
                            let jsonKey = partes[1];
                            let jsonItem = JSON.parse(item[key]);
                            if (jsonItem && typeof jsonItem[jsonKey] !== 'object') {
                              return (
                                <td key={chave} className="px-6 py-2 whitespace-nowrap font-normal text-center">
                                  {verificaTexto(jsonItem[jsonKey])}
                                </td>
                              );
                            } else {
                              return <td key={chave} className="px-6 py-2 whitespace-nowrap font-normal"></td>;
                            }
                          } else if (item[chave] !== undefined) {
                            if (typeof item[chave] !== 'object') {
                              return (
                                <td key={chave} className="px-6 py-2 whitespace-nowrap font-normal text-center">
                                  {verificaTexto(item[chave])}
                                </td>
                              );
                            } else if (chave === 'beneficios') { // gambiarra especificamente para beneficios retornando do back como array, (detalhe se for corrigido no back remover)
                              const beneficio = item.beneficios?.[0];
                              return (
                                <td key={beneficio?.tipoAuxilio?.id || 'sem-id'} className="px-6 py-2 whitespace-nowrap font-normal text-center">
                                  {verificaTexto(beneficio?.tipoAuxilio?.tipo)}
                                </td>

                              );
                            } else {
                              return <td key={chave} className="px-6 py-2 whitespace-nowrap font-normal"></td>;
                            }
                          } else if (item[chave] === undefined) {
                            const keys = chave.split('.');
                            let nestedValue = item;
                            for (let key of keys) {
                              if (nestedValue) {
                                nestedValue = nestedValue[key];
                                if (nestedValue === undefined) break;
                              }
                            }
                            if (typeof nestedValue !== 'object' && nestedValue !== undefined) {
                              return (
                                <td key={chave} className="px-6 py-2 whitespace-nowrap font-normal text-center">
                                  {verificaTexto(nestedValue)}
                                </td>
                              );
                            } else {
                              return <td key={chave} className="px-6 py-2 whitespace-nowrap font-normal text-center"></td>;
                            }
                          }
                          return null;
                        })}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={estrutura.tabela.colunas.length} className="text-center py-4 font-normal">
                        <h6 className="text-neutrals-600">Nenhum registro encontrado.</h6>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Layout Stacked (Mobile) */}
        <div className="block md:hidden">
          {linhas.length > 0 ? (
            linhas.map((item: any) => (
              <div
                key={item.id}
                className="bg-white border border-neutrals-200 rounded-md p-4 mb-4 shadow"
              >
                {estrutura.tabela.colunas.map((col: any, index: number) => {
                  if (col.chave === 'acoes') {
                    return (
                      <div key={col.chave} className="mt-2 flex justify-end gap-2">
                        {estrutura.tabela.acoes_dropdown.map((acao: any, index_acao: any) => (
                          <button
                            key={index_acao}
                            className="px-4 py-2 text-sm text-neutrals-50 bg-primary-500 hover:bg-primary-700 border rounded-md"
                            onClick={() => chamarFuncao(acao.chave, item)}
                          >
                            {acao.nome}
                          </button>
                        ))}
                      </div>
                    );
                  } else {
                    let label = col.nome;
                    let value: any = '';
                    if (item[col.chave] !== undefined) {
                      if (typeof item[col.chave] !== 'object') {
                        value = verificaTexto(item[col.chave]);
                      }
                    } else {
                      const keys = col.chave.split('.');
                      let nestedValue = item;
                      for (let key of keys) {
                        if (nestedValue) {
                          nestedValue = nestedValue[key];
                        }
                      }
                      if (nestedValue !== undefined && typeof nestedValue !== 'object') {
                        value = verificaTexto(nestedValue);
                      }
                    }
                    if (col.tipo === "status" && col.selectOptions) {
                      const selectOption = col.selectOptions.find((option: any) => option.chave === item[col.chave]);
                      if (selectOption) {
                        value = (
                          <span
                            className={
                              selectOption.valor === 'Finalizado'
                                ? 'px-2 inline-flex text-sm leading-5 font-normal rounded-full bg-green-100 text-green-800'
                                : selectOption.valor === 'Erro'
                                  ? 'px-2 inline-flex text-sm leading-5 font-normal rounded-full bg-red-100 text-red-800'
                                  : 'px-3 inline-flex text-sm leading-6 font-normal rounded-full bg-neutrals-100 text-neutrals-800'
                            }
                          >
                            {selectOption.valor}
                          </span>
                        );
                      }
                    } else if (item[col.chave] !== undefined && (col.tipo === "booleano" || col.selectOptions)) {
                      const selectOption = col.selectOptions.find((option: any) => option.chave === item[col.chave]);
                      if (selectOption) {
                        value = selectOption.valor;
                      }
                    } else if (col.tipo === "json") {
                      const partes = col.chave.split('|');
                      let key = partes[0];
                      let jsonKey = partes[1];
                      let jsonItem = JSON.parse(item[key]);
                      if (jsonItem && typeof jsonItem[jsonKey] !== 'object') {
                        value = verificaTexto(jsonItem[jsonKey]);
                      }
                    }
                    return (
                      <div key={index} className="mb-2">
                        <span className="block text-sm font-bold text-neutrals-900">
                          {label}:
                        </span>
                        <span className="block text-sm text-neutrals-700 font-normal">{value}</span>
                      </div>
                    );
                  }
                })}
              </div>
            ))
          ) : (
            <div className="text-center py-4 font-normal">
              <h6 className="text-neutrals-600">Nenhum registro encontrado.</h6>
            </div>
          )}
        </div>
      </div>
      {estrutura.tabela.configuracoes.rodape && (
        <Pagination dados={dados} paramsColuna={paramsColuna} />
      )}
    </div>
  );
};

export default Tabela;