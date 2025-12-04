"use client";
import React from 'react';
import { Campo } from './campoTypes';
import { getNestedValue, setNestedValue, asArray } from './utilsCampo';
import aplicarMascara from '@/utils/mascaras';
import EditorRichText from './EditorRichText';
import Select from './Inputs/Select';
import MultiSelectString from './Inputs/MultiSelectString';
import MultiSelectObject from './Inputs/MultiSelectObject';
import Email from './Inputs/Email';
import Text from './Inputs/Text';
import Password from './Inputs/Password';
import Cpf from './Inputs/Cpf';
import TextArea from './Inputs/TextArea';
import DateInput from './Inputs/Date';
import NumberInput from './Inputs/Number';
import CheckBox from './Inputs/CheckBox';
import Year from './Inputs/Year';
import FileInput from './Inputs/File';
import MoneyBRL from './Inputs/MoneyBRL';
import { Edit, PersonOutlineOutlined } from '@mui/icons-material';

interface RenderCampoProps {
  campo: Campo;
  dados: any;
  setDados: React.Dispatch<React.SetStateAction<any>>;
  perfilAtual: string;
  isMobile: boolean;
  photoPreview: string;
  setPhotoPreview: (v: string) => void;
  expandedDocUrl: string | null;
  setExpandedDocUrl: (v: string | null) => void;
  expandedDocType: string | null;
  setExpandedDocType: (v: string | null) => void;
  alterarInput: (e: any) => void;
  alterarRatio: (e: any) => void;
  onClickFuncao?: () => void;
}

const RenderCampo: React.FC<RenderCampoProps> = ({ campo: e, dados, setDados, photoPreview, setPhotoPreview, expandedDocUrl, setExpandedDocUrl, expandedDocType, setExpandedDocType, alterarInput, alterarRatio, onClickFuncao }) => {
  const valor = (chave: string) => getNestedValue(dados, chave);

  const handleFileChangeFoto = (event: React.ChangeEvent<HTMLInputElement>, chave: string) => {
    const file = event.target.files?.[0] || null;
    if (file) setPhotoPreview(URL.createObjectURL(file));
    setDados((prev: any) => setNestedValue(prev ?? {}, chave, file));
  };

  const handleExpand = (docUrl: string, docType: string) => {
    setExpandedDocUrl(docUrl);
    setExpandedDocType(docType);
  };
  const closeModal = () => {
    setExpandedDocUrl(null);
    setExpandedDocType(null);
  };

  // filtros de exibição já feitos antes (mantidos fora deste componente se quiser)

  return (
    <div className={`flex flex-col ${e.colSpan ?? ''}`}>
      {e.tipo === 'subtitulo' && (
        <h2 className="text-2xl" style={{ color: '#5F84A1' }}>{e.nome}</h2>
      )}

      {e.tipo === 'text' && (
        <Text name={e.chave} onChange={alterarInput} label={e.nome} required={!!e.obrigatorio} message={e.mensagem ?? ''} value={valor(e.chave) ?? ''} disabled={!!e.bloqueado} />
      )}

      {e.tipo === 'boolean' && (
        <CheckBox name={e.chave} onChange={alterarInput} label={e.nome} required={!!e.obrigatorio} message={e.mensagem ?? ''} value={!!valor(e.chave)} disabled={!!e.bloqueado} />
      )}

      {e.tipo === 'email' && (
        <Email name={e.chave} onChange={alterarInput} label={e.nome} required={!!e.obrigatorio} message={e.mensagem ?? ''} value={valor(e.chave) ?? ''} disabled={!!e.bloqueado} />
      )}

      {e.tipo === 'password' && (
        <Password name={e.chave} onChange={alterarInput} label={e.nome} required={!!e.obrigatorio} message={e.mensagem ?? ''} value={valor(e.chave) ?? ''} disabled={!!e.bloqueado} />
      )}

      {e.tipo === 'cpf' && (
        <Cpf name={e.chave} onChange={alterarInput} label={e.nome} required={!!e.obrigatorio} message={e.mensagem ?? ''} value={valor(e.chave) ?? ''} disabled={!!e.bloqueado} />
      )}

      {e.tipo === 'textarea' && (
        <TextArea name={e.chave} onChange={alterarInput} label={e.nome} required={!!e.obrigatorio} message={e.mensagem ?? ''} value={valor(e.chave) ?? ''} disabled={!!e.bloqueado} />
      )}

      {e.tipo === 'date' && (
        <DateInput name={e.chave} onChange={alterarInput} label={e.nome} required={!!e.obrigatorio} value={valor(e.chave) ?? ''} disabled={!!e.bloqueado} />
      )}

      {e.tipo === 'number' && (
        <NumberInput name={e.chave} onChange={alterarInput} label={e.nome} required={!!e.obrigatorio} message={e.mensagem ?? ''} value={valor(e.chave) ?? ''} disabled={!!e.bloqueado} />
      )}

      {e.tipo === 'select' && (
        <Select name={e.chave} onChange={alterarInput} label={e.nome} required={!!e.obrigatorio} message={e.mensagem ?? 'Selecione...'} value={(() => { const v = valor(e.chave); return v && (v as any).id ? (v as any).id : v ?? ''; })()} disabled={!!e.bloqueado} options={e.selectOptions ?? []} />
      )}

      {e.tipo === 'rich-text' && (
        <>
          <label htmlFor={e.chave} className="block text-gray-700 uppercase">{e.nome}{e.obrigatorio && <span className="text-red-500 ml-1">*</span>}</label>
          <EditorRichText initialContent={valor(e.chave) ?? ''} onContentChange={(value: any) => setDados((prev: any) => setNestedValue(prev ?? {}, e.chave, value))} />
        </>
      )}

      {e.tipo === 'multi-select2' && (
        <MultiSelectString name={e.chave} availableItems={e.selectOptions?.map(o => o.valor) ?? []} selectedItems={Array.isArray(valor(e.chave)) ? valor(e.chave) : []} onChange={alterarInput} label={e.nome} required={!!e.obrigatorio} />
      )}

      {e.tipo === 'money-brl' && (
        <MoneyBRL name={e.chave} label={e.nome} value={valor(e.chave) ?? null} onChange={alterarInput} required={!!e.obrigatorio} disabled={!!e.bloqueado} message={e.mensagem ?? ''} mode={e.mode === 'cents' ? 'cents' : 'decimal'} allowNegative={!!e.allowNegative} />
      )}

      {e.tipo === 'multi-select' && (
        <MultiSelectObject name={e.chave} options={e.selectOptions ?? []} selected={Array.isArray(valor(e.chave)) ? valor(e.chave) : []} onChange={alterarInput} label={e.nome} required={!!e.obrigatorio} />
      )}

      {e.tipo === 'year' && (
        <Year name={e.chave} onChange={alterarInput} label={e.nome} required={!!e.obrigatorio} message={e.mensagem ?? ''} value={(() => { const v = valor(e.chave); return v && (v as any).id ? (v as any).id : v ?? ''; })()} disabled={!!e.bloqueado} />
      )}

      {e.tipo === 'foto' && (
        <div className="flex flex-col">
          <label className="block mb-1 text-label-medium text-extra-50">{e.nome}{e.obrigatorio && <span className="text-danger-500 ml-1">*</span>}</label>
          <div className="relative w-24 h-24">
            <div className="absolute inset-0 border-2 border-gray-300 rounded-full overflow-hidden flex items-center justify-center">
              {photoPreview ? (
                <img src={photoPreview} alt="Pré-visualização" className="w-full h-full object-cover" />
              ) : (
                <PersonOutlineOutlined style={{ fontSize: 64, color: '#999999' }} aria-label="Foto de Perfil Padrão" />
              )}
            </div>
            {!e.bloqueado && (
              <>
                <label htmlFor={`fotoInput-${e.chave}`} className="absolute bottom-0 right-0 mb-1 mr-1 bg-white p-1 rounded-full cursor-pointer shadow-sm z-10">
                  <Edit fontSize="small" className="text-extra-50" />
                </label>
                <input id={`fotoInput-${e.chave}`} type="file" accept="image/*" className="hidden" onChange={(ev) => handleFileChangeFoto(ev, e.chave)} disabled={!!e.bloqueado} required={!!e.obrigatorio} />
              </>
            )}
          </div>
        </div>
      )}

      {e.tipo === 'documento' && (
        <div className="flex flex-col">
          <label className="block mb-1 text-label-medium text-extra-50">{e.nome}{e.obrigatorio && <span className="text-danger-500 ml-1">*</span>}</label>
          {!e.bloqueado && (
            <>
              <label htmlFor={`docInput-${e.chave}`} className="bg-white p-2 rounded cursor-pointer shadow-sm inline-block text-sm text-extra-50 mt-2">Adicionar Documento(s)</label>
              <input id={`docInput-${e.chave}`} type="file" accept=".pdf,.png,.jpeg,.jpg" className="hidden" multiple={!!e.multiple} onChange={(ev) => {
                const files = (ev.target as HTMLInputElement).files;
                if (files && files.length > 0) {
                  const fileArray = Array.from(files);
                  setDados((prev: any) => {
                    const curr = valor(e.chave) ?? [];
                    return setNestedValue(prev ?? {}, e.chave, [...curr, ...fileArray]);
                  });
                }
              }} disabled={!!e.bloqueado} required={!!e.obrigatorio && !(valor(e.chave)?.length > 0)} />
            </>
          )}
          {Array.isArray(valor(e.chave)) && valor(e.chave).length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-2">
              {valor(e.chave).map((doc: any, index: number) => {
                const docUrl = typeof doc === 'string' ? doc : URL.createObjectURL(doc);
                const isPdf = doc instanceof File ? doc.type === 'application/pdf' : docUrl.toLowerCase().endsWith('.pdf');
                const isImage = doc instanceof File ? doc.type.startsWith('image/') : /\.(png|jpe?g)$/i.test(docUrl);
                const docType = isPdf ? 'pdf' : isImage ? 'image' : 'other';
                return (
                  <div key={index} className="relative border border-gray-300 rounded cursor-pointer hover:shadow-lg transition-all p-1" onClick={() => handleExpand(docUrl, docType)}>
                    <div className="pointer-events-none w-full h-40 md:h-48 overflow-hidden rounded">
                      {isPdf ? (
                        <iframe src={docUrl} title={`Documento ${index}`} className="w-full h-full" style={{ border: 'none' }} />
                      ) : isImage ? (
                        <img src={docUrl} alt={`Documento ${index}`} className="w-full h-full object-cover" />
                      ) : (
                        <p className="p-2 text-sm text-gray-700 break-words">{typeof doc === 'string' ? doc.split('/').pop() : doc.name}</p>
                      )}
                    </div>
                    {!e.bloqueado && (
                      <div className="absolute top-2 right-2 z-10">
                        <button type="button" onClick={(ev) => { ev.stopPropagation(); setDados((prev: any) => { const arr = [...(valor(e.chave) || [])]; arr.splice(index, 1); return setNestedValue(prev ?? {}, e.chave, arr); }); }} className="px-2 py-1 bg-danger-500 text-white text-sm rounded transition-colors hover:bg-danger-700">Deletar</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-500 mt-2">Nenhum documento anexado.</p>
          )}
          {expandedDocUrl && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4" onClick={closeModal}>
              <div className="bg-white rounded shadow-lg w-full max-w-5xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b">
                  <button onClick={closeModal} className="text-danger-500 font-bold">Fechar</button>
                  <div className="flex space-x-2">
                    <a href={expandedDocUrl} download className="px-2 py-1 bg-extra-150 text-white text-sm rounded hover:bg-extra-50">Baixar</a>
                    <a href={expandedDocUrl} target="_blank" rel="noopener noreferrer" className="px-2 py-1 bg-extra-150 text-white text-sm rounded hover:bg-extra-50">Visualizar</a>
                  </div>
                </div>
                <div className="flex-1 overflow-auto flex items-center justify-center p-2">
                  {expandedDocType === 'pdf' ? (
                    <iframe src={expandedDocUrl} title="Documento expandido" className="w-full h-full" style={{ minHeight: '600px', border: 'none' }} scrolling="auto" />
                  ) : expandedDocType === 'image' ? (
                    <img src={expandedDocUrl} alt="Documento expandido" className="max-w-full max-h-full" />
                  ) : (
                    <p className="text-sm text-gray-700 p-4">{expandedDocUrl.split('/').pop()}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {e.tipo === 'radio-group' && (
        <div className={`flex flex-col ${e.colSpan ?? ''}`}>
          <label className="block mb-1 text-label-medium text-extra-50">{e.nome}{e.obrigatorio && <span className="text-danger-500 ml-1">*</span>}</label>
          <div className="flex gap-4">
            {e.selectOptions?.map((option, oIdx) => (
              <label key={oIdx} className="flex items-center gap-1">
                <input type="radio" name={e.chave} value={String(option.chave)} checked={(valor(e.chave)?.toString?.() || '') === String(option.chave)} onChange={alterarInput} className="w-4 h-4 text-primary-600" disabled={!!e.bloqueado} />
                <span className="text-body-medium text-neutrals-900">{option.valor}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {e.tipo === 'date-multiple' && (
        <div className="flex flex-col">
          <label className="block mb-1 text-label-medium text-extra-50">{e.nome}{e.obrigatorio && <span className="text-danger-500 ml-1">*</span>}</label>
          {(Array.isArray(valor(e.chave)) ? valor(e.chave) : ['']).map((data: string, idData: number) => (
            <div key={idData} className="flex items-center gap-2 mb-1">
              <input type="date" name={e.chave} value={data} onChange={(evt) => { const arr = asArray<string>(valor(e.chave)); arr[idData] = (evt.target as HTMLInputElement).value; setDados((prev: any) => setNestedValue(prev ?? {}, e.chave, arr)); }} className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary-300 text-body-medium text-neutrals-900" required={!!e.obrigatorio} disabled={!!e.bloqueado} />
              {asArray(valor(e.chave)).length > 1 && (
                <button type="button" className="text-danger-500" onClick={() => { const arr = asArray<string>(valor(e.chave)); arr.splice(idData, 1); setDados((prev: any) => setNestedValue(prev ?? {}, e.chave, arr)); }}>Remover</button>
              )}
            </div>
          ))}
          <button type="button" className="bg-extra-150 hover:bg-extra-50 text-white px-2 py-1 rounded text-sm mt-1" onClick={() => { const arr = asArray<string>(valor(e.chave)); arr.push(''); setDados((prev: any) => setNestedValue(prev ?? {}, e.chave, arr)); }}>Adicionar data</button>
        </div>
      )}

      {e.tipo === 'ratio' && (
        <div className="flex flex-col">
          <label className="block mb-1 text-label-medium text-extra-50">{e.nome}{e.obrigatorio && <span className="text-danger-500 ml-1">*</span>}</label>
          <input type="number" name={e.chave} placeholder={e.mensagem} className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary-300 text-body-medium text-neutrals-900" value={(() => { const v = valor(e.chave); return v != null ? Number(v) * 100 : ''; })()} onChange={alterarRatio} disabled={!!e.bloqueado} required={!!e.obrigatorio} min={0} max={e.max ?? 100} step={e.step ?? 1} />
          <span className="text-sm text-neutrals-500 mt-1">Máximo: {e.max ?? 100}%</span>
        </div>
      )}

      {e.tipo === 'file' && (
        <FileInput dir="importacao" name={e.chave} onChange={alterarInput} label={e.nome} required={!!e.obrigatorio} message={e.mensagem ?? ''} disabled={!!e.bloqueado} />
      )}

      {e.tipo === 'button' && (
        <button type="button" name={e.chave} onClick={onClickFuncao ? () => { onClickFuncao(); } : undefined} className="bg-primary-500 hover:bg-primary-700 text-white px-4 py-2 rounded text-body-medium disabled:opacity-50 mt-6 mb-0" disabled={!!e.bloqueado}>{e.nome}</button>
      )}

      {[ 'text','select','boolean','date','year','multi-select','multi-select2','cpf','password','email','display-crimes-list','file','textarea','number','rich-text','foto','documento','radio-group','date-multiple','ratio','subtitulo','money-brl'].indexOf(e.tipo) === -1 && <div className="mt-1 p-2 w-full" />}
    </div>
  );
};

export default RenderCampo;
