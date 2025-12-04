// Tipos relacionados ao cadastro dinâmico
export type Campo = {
  line?: number;
  colSpan?: string;
  nome: string;
  chave: string; // suporta notação a.b.c
  tipo: string;  // 'text','number','foto','documento','rich-text','multi-select','multi-select2', ...
  mensagem?: string;
  obrigatorio?: boolean;
  bloqueado?: boolean;
  oculto?: boolean;
  selectOptions?: { chave: any; valor: string; selecionado?: boolean }[] | null;
  max?: number;
  step?: number;
  allSelect?: boolean; // multi-select "selecionar tudo"
  mascara?: string;
  exibirPara?: string[]; // perfis que podem ver/editar este campo
  multiple?: boolean; // para documentos
  funcao?: string;    // para botões
  maxFileSize?: number;
  maxFileSizeMessage?: string;
  mode?: string;
  allowNegative?: boolean; // opcional para campos como money-brl
};

export type ChamarFuncao = (acao: string, dados?: any) => void;
