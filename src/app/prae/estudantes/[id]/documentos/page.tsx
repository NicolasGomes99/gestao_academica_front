"use client";

import withAuthorization from "@/components/AuthProvider/withAuthorization";
import Cabecalho from "@/components/Layout/Interno/Cabecalho";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { genericaMultiForm } from "@/utils/api";
import { useAuthService } from "@/app/authentication/auth.hook";

const EnvioDocumentos = () => {
  const router = useRouter();
  const auth = useAuthService();

  const [documentos, setDocumentos] = useState<any>({
    cpf: null,
    identidade: null,
    comprovante: null,
  });

  const documentosRequeridos = [
    { chave: "cpf", nome: "CPF" },
    { chave: "identidade", nome: "Identidade (RG ou CNH)" },
    { chave: "comprovante", nome: "Comprovante de Matrícula ou Histórico Escolar" },
  ];

  const handleDocumentoChange = (chave: string, files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    const maxSize = 10 * 1024 * 1024;
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];

    if (file.size > maxSize) {
      toast.error("O arquivo não pode ser maior que 10MB");
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      toast.error("Apenas arquivos PDF, JPG ou PNG são permitidos");
      return;
    }

    setDocumentos((prev: any) => ({
      ...prev,
      [chave]: file,
    }));

    toast.success(`${file.name} anexado`);
  };

  const removerDocumento = (chave: string) => {
    setDocumentos((prev: any) => ({
      ...prev,
      [chave]: null,
    }));
  };

  const validarObrigatorios = () => {
    for (const doc of documentosRequeridos) {
      if (!documentos[doc.chave]) {
        toast.error(`O documento "${doc.nome}" é obrigatório`);
        return false;
      }
    }
    return true;
  };

  const enviarDocumentos = async () => {
    try {
      if (!validarObrigatorios()) return;

      const formData = new FormData();

      Object.entries(documentos).forEach(([chave, arquivo]: any) => {
        if (arquivo) {
          formData.append(`documentos[${chave}]`, arquivo);
        }
      });

      const body = {
        metodo: "post",
        uri: "/prae/estudantes/documentos",
        params: {},
        data: formData,
      };

      const response = await genericaMultiForm(body);

      if (!response || response.status < 200 || response.status >= 300) {
        toast.error("Erro ao enviar documentos");
        return;
      }

      Swal.fire({
        title: "Documentos enviados!",
        text: "Seu cadastro PRAE foi finalizado com sucesso.",
        icon: "success",
        confirmButtonColor: "#972E3F",
      }).then(() => {
        router.push("/prae");
      });

    } catch (error) {
      console.error("Erro ao enviar documentos:", error);
      toast.error("Erro inesperado ao enviar documentos");
    }
  };

  return (
    <main className="flex justify-center mx-auto">
      <div className="w-full md:w-11/12 lg:w-10/12 max-w-5xl p-4 pt-10">
        <Cabecalho
          dados={{
            titulo: "Envio de Documentos",
            migalha: [
              { nome: "Home", link: "/home" },
              { nome: "PRAE", link: "/prae" },
              { nome: "Envio de Documentos", link: "" },
            ],
          }}
        />

        <div className="mt-8 bg-gray-50 p-6 rounded-lg space-y-6">
          <p className="text-gray-700 text-sm">
            Para finalizar seu cadastro PRAE, envie os documentos abaixo.
            Aceitamos arquivos PDF, JPG ou PNG com tamanho máximo de 10MB.
          </p>

          {documentosRequeridos.map((doc) => (
            <div key={doc.chave} className="bg-white p-4 rounded-lg border">
              <div className="flex justify-between items-center mb-2">
                <label className="font-medium text-gray-900">
                  {doc.nome} <span className="text-red-500">*</span>
                </label>

                {documentos[doc.chave] && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                    ✓ Anexado
                  </span>
                )}
              </div>

              <div className="flex gap-3 items-center">
                <label className="flex-1 cursor-pointer">
                  <input
                    type="file"
                    className="hidden"
                    accept="application/pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleDocumentoChange(doc.chave, e.target.files)}
                  />
                  <div className="border-2 border-dashed rounded-lg p-4 text-center hover:border-blue-500 transition">
                    <p className="text-sm text-gray-600">
                      {documentos[doc.chave]
                        ? documentos[doc.chave].name
                        : "Clique para selecionar o arquivo"}
                    </p>
                  </div>
                </label>

                {documentos[doc.chave] && (
                  <button
                    type="button"
                    onClick={() => removerDocumento(doc.chave)}
                    className="px-3 py-2 bg-red-700 hover:bg-red-800 text-white rounded-md text-sm"
                  >
                    Remover
                  </button>
                )}
              </div>
            </div>
          ))}

          <div className="flex justify-end gap-4 pt-6">
            <button
              type="button"
              onClick={() => router.push("/prae")}
              className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md"
            >
              Voltar
            </button>

            <button
              type="button"
              onClick={enviarDocumentos}
              className="px-6 py-2 bg-extra-150 hover:bg-extra-50 text-white rounded-md font-medium"
            >
              Enviar documentos
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default withAuthorization(EnvioDocumentos);
