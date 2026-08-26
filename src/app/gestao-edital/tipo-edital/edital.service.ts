import { generica } from "@/utils/api";
import type {
  TipoEditalFormData,
  Etapa,
  CampoPersonalizado,
} from "@/types/editalTypes";


export type TipoEditalPayload = {
  nome: string;
  descricao?: string;
  moduloOrigem: string;
  modeloId: number;
};


export type EtapaPayload = {
  nome: string;
  descricao?: string;
  dataInicio?: string;
  dataFim?: string;
  ordem: number;
  configuracoes?: string | null;
  tipoEditalModeloId: number;
};


export type CampoPersonalizadoPayload = {
  titulo: string;
  obrigatorio: boolean;
  tipoCampo: string;
  configuracoes?: string | null;
  tipoEditalModeloId?: number;
  etapaId?: number;
};


export type DocumentoPayload = {
  nome: string;
  caminho: string;
  etapaId: number;
};



function ensureOk(resp: any, errorMessage: string) {

  const ok =
    resp &&
    typeof resp.status === "number" &&
    resp.status >= 200 &&
    resp.status < 300;

  if (!ok) {
    throw new Error(errorMessage);
  }
}





export class EditalService {


  static async criarTipoEdital(
    payload: TipoEditalPayload
  ): Promise<{ id:number; raw:any }> {


    const resp = await generica({

      metodo:"post",

      uri:"/editais/tipo-edital",

      data:payload,

    });


    console.log(
      "Resposta criação Tipo Edital:",
      resp
    );


    ensureOk(
      resp,
      "Falha ao criar Tipo de Edital"
    );


    return {

      id: resp.data.id,

      raw: resp.data ?? resp,

    };

  }






  static async criarEtapa(
    payload: EtapaPayload
  ): Promise<{id:number; raw:any}> {


    const resp = await generica({

      metodo:"post",

      uri:"/editais/etapa",

      data:payload,

    });


    ensureOk(
      resp,
      "Falha ao criar etapa"
    );


    return {

      id:resp.data.id,

      raw:resp.data ?? resp,

    };

  }







  static async criarCampoPersonalizado(
    payload:CampoPersonalizadoPayload
  ){


    const resp = await generica({

      metodo:"post",

      uri:"/editais/campo-personalizado",

      data:payload,

    });


    ensureOk(
      resp,
      "Falha ao criar campo personalizado"
    );


    return resp.data ?? resp;

  }






  static async criarDocumento(
    payload:DocumentoPayload
  ){


    const resp = await generica({

      metodo:"post",

      uri:"/editais/documento",

      data:payload,

    });


    ensureOk(
      resp,
      "Falha ao criar documento"
    );


    return resp.data ?? resp;

  }









  /**
   * Criação completa:
   *
   * Tipo Edital
   * └── Campos Gerais
   * └── Etapas
   *      └── Campos
   *      └── Documentos
   */
  static async criarTipoEditalCompleto(
    formData:TipoEditalFormData
  ){



    const {id:tipoId} =
      await this.criarTipoEdital({

        nome:formData.nome,

        descricao:formData.descricao,

        moduloOrigem:formData.moduloOrigem,

        modeloId:formData.modeloId,

      });






    // CAMPOS GERAIS

    const criarCamposGerais =
      formData.camposGerais.map(
        (campo:CampoPersonalizado)=>

          this.criarCampoPersonalizado({

            titulo:campo.titulo,

            obrigatorio:
              campo.obrigatorio,

            tipoCampo:
              campo.tipoCampo,

            configuracoes:
              campo.configuracoes ?? null,

            tipoEditalModeloId:
              tipoId,

          })

      );






    // ETAPAS

    const criarEtapas =
      formData.etapas.map(
        async (etapa:Etapa,index:number)=>{


          const etapaCriada =
            await this.criarEtapa({

              nome:etapa.nome,

              descricao:etapa.descricao,

              dataInicio:etapa.dataInicio,

              dataFim:etapa.dataFim,

              ordem:
                etapa.ordem ?? index + 1,

              configuracoes:
                etapa.configuracoes ?? null,

              tipoEditalModeloId:
                tipoId,

            });



          const etapaId =
            etapaCriada.id;





          await Promise.all(

            etapa.campos.map(
              (campo)=>

                this.criarCampoPersonalizado({

                  titulo:
                    campo.titulo,

                  obrigatorio:
                    campo.obrigatorio,

                  tipoCampo:
                    campo.tipoCampo,

                  configuracoes:
                    campo.configuracoes ?? null,

                  etapaId,

                })

            )

          );



          const documentos =
            etapa.documentos ?? [];



          await Promise.all(

            documentos.map(

              documento=>

                this.criarDocumento({

                  nome:
                    documento.nome,

                  caminho:
                    documento.caminho,

                  etapaId,

                })

            )

          );



          return etapaId;


        }

      );






    await Promise.all([

      Promise.all(criarCamposGerais),

      Promise.all(criarEtapas),

    ]);





    return {

      tipoEditalModeloId:tipoId,

    };

  }









  static async atualizarTipoEdital(
    tipoEditalId:number,
    formData:TipoEditalPayload
  ){


    const resp =
      await generica({

        metodo:"patch",

        uri:`/editais/tipo-edital/${tipoEditalId}`,

        data:formData,

      });



    ensureOk(
      resp,
      "Falha ao atualizar tipo edital"
    );


    return resp.data ?? resp;

  }








  static async atualizarEtapaTipoEdital(
    etapaId:number,
    etapa:Etapa
  ){


    const resp =
      await generica({

        metodo:"patch",

        uri:`/editais/etapa/${etapaId}`,

        data:{

          nome:etapa.nome,

          descricao:etapa.descricao,

          ordem:etapa.ordem,

          dataInicio:etapa.dataInicio,

          dataFim:etapa.dataFim,

          configuracoes:
            etapa.configuracoes,

        },

      });



    ensureOk(
      resp,
      "Falha ao atualizar etapa"
    );


    return resp.data ?? resp;

  }








  static async atualizarCampoPersonalizadoTipoEdital(
    campoId:number,
    campo:CampoPersonalizado
  ){


    const resp =
      await generica({

        metodo:"patch",

        uri:`/editais/campo-personalizado/${campoId}`,

        data:{

          titulo:
            campo.titulo,

          obrigatorio:
            campo.obrigatorio,

          tipoCampo:
            campo.tipoCampo,

          configuracoes:
            campo.configuracoes,

        },

      });



    ensureOk(
      resp,
      "Falha ao atualizar campo"
    );


    return resp.data ?? resp;

  }

}