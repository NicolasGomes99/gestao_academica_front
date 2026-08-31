import * as z from "zod";

/**
 * Tipos de campos disponíveis no formulário dinâmico
 * Compatível com o DTO do backend
 */
export const tipoCampoEnum = z.enum([
  "TEXTO_CURTO",
  "TEXTO_LONGO",
  "NUMERO",
  "DATA",
  "ARQUIVO",
  "SELECT",
  "CHECKBOX",
  "RADIO",
]);

export type TipoCampo = z.infer<typeof tipoCampoEnum>;


export const tipoCampoDisplay: Record<TipoCampo, string> = {
  TEXTO_CURTO: "Texto Curto",
  TEXTO_LONGO: "Texto Longo",
  NUMERO: "Número",
  DATA: "Data",
  ARQUIVO: "Arquivo",
  SELECT: "Seleção",
  CHECKBOX: "Caixa de seleção",
  RADIO: "Múltipla escolha",
};



/**
 * Campo personalizado
 *
 * DTO:
 *
 * {
 *   id: 1,
 *   titulo: "Qual sua renda?",
 *   tipoCampo: "TEXTO_CURTO",
 *   obrigatorio: true,
 *   configuracoes: "{}"
 * }
 */
export const campoSchema = z.object({

  id: z.number().int().optional(),

  titulo: z
    .string()
    .min(1, "O título do campo é obrigatório."),

  tipoCampo: tipoCampoEnum,

  obrigatorio: z.boolean(),

  configuracoes: z
    .string()
    .optional()
    .nullable(),

});


export type CampoPersonalizado =
  z.infer<typeof campoSchema>;




/**
 * Documento
 *
 * Mantido para compatibilidade com outras telas.
 */
export const documentoSchema = z.object({

  documentoId: z.number().int().optional(),

  nome: z
    .string()
    .min(1, "O nome do documento é obrigatório."),

  caminho: z
    .string()
    .min(1, "O caminho do documento é obrigatório."),

});


export type Documento =
  z.infer<typeof documentoSchema>;





/**
 * Etapa do tipo de edital
 *
 * DTO:
 *
 * {
 *   id,
 *   nome,
 *   descricao,
 *   ordem,
 *   dataInicio,
 *   dataFim,
 *   configuracoes,
 *   campos
 * }
 */
export const etapaSchema = z.object({

  etapaId: z.number().int().optional(),

  id: z.number().int().optional(),

  nome: z
    .string()
    .min(1, "O nome da etapa é obrigatório."),


  descricao: z
    .string()
    .optional(),


  ordem: z
    .number()
    .optional(),


  dataInicio: z
    .string()
    .optional(),


  dataFim: z
    .string()
    .optional(),


  configuracoes: z
    .string()
    .optional()
    .nullable(),


  campos: z
    .array(campoSchema)
    .default([]),


  documentos: z
    .array(documentoSchema)
    .optional(),

});


export type Etapa =
  z.infer<typeof etapaSchema>;






/**
 * Tipo de Edital Modelo
 *
 * DTO:
 *
 * {
 *   id,
 *   nome,
 *   descricao,
 *   moduloOrigem,
 *   estado,
 *   etapas,
 *   camposGerais
 * }
 */
export const tipoEditalSchema = z.object({

  id: z
    .number()
    .int()
    .optional(),


  nome: z
    .string()
    .min(1, "O nome do modelo é obrigatório."),


  descricao: z
    .string()
    .optional(),


  moduloOrigem: z
    .string()
    .min(1, "O módulo de origem é obrigatório."),


  estado: z
    .string()
    .optional(),


  etapas: z
    .array(etapaSchema)
    .default([]),


  camposGerais: z
    .array(campoSchema)
    .default([]),

});


export type TipoEditalFormData =
  z.infer<typeof tipoEditalSchema>;







/**
 * Status do edital
 * Mantido para compatibilidade
 */
export const statusSchema = z.object({

  id: z.number().int().optional(),

  nome: z.string(),

  tipoStatus: z.enum([
    "INSCRICAO",
    "EDITAL",
    "ETAPA",
  ]),

});


export type EditalStatus =
  z.infer<typeof statusSchema>;







/**
 * Respostas da API
 */

export interface CampoPersonalizadoResponse {

  id: number;

  titulo: string;

  tipoCampo: TipoCampo;

  obrigatorio: boolean;

  configuracoes?: string;

  tipoEditalId?: number | null;

  etapaModeloId?: number | null;

}



export interface EtapaResponse {

  id: number;

  nome: string;

  descricao?: string;

  ordem: number;

  dataInicio?: string;

  dataFim?: string;

  configuracoes?: string;

  campos?: CampoPersonalizadoResponse[];

}



export interface TipoEditalResponse {

  id: number;

  nome: string;

  descricao: string;

  moduloOrigem: string;

  estado: string;

  etapas: EtapaResponse[];

  camposGerais: CampoPersonalizadoResponse[];

}




/**
 * Mantido do sistema antigo
 */
export interface EditalExtraSisuResponse {

  id: number;

  titulo: string;

  descricao: string;

  pdf: string;

  dataInscricao: string;

  dataFinalizacao: string;

}