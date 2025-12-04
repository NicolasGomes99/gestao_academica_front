// Funções de máscara
function maskCPF(value: string) {
  // Remove tudo que não for número
  value = value.replace(/\D/g, "");

  // Limita o número máximo de caracteres a 11 (CPF sem máscara)
  value = value.substring(0, 11);

  // Aplica a máscara formatando corretamente
  return value
    .replace(/^(\d{3})(\d)/, "$1.$2") // Insere o primeiro ponto
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3") // Insere o segundo ponto
    .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4"); // Insere o traço antes dos dois últimos números
}


function maskCNPJ(value: string) {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2")
    .substring(0, 18);
}


function maskTelefoneFixo(value: string) {
  // Exemplo para número fixo: (XX) XXXX-XXXX
  return value
    .replace(/\D/g, "")
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{4})(\d)/, "$1-$2")
    .substring(0, 14);
}

function maskTelefoneCelular(value: string) {
  // Exemplo para celular: (XX) XXXXX-XXXX
  return value
    .replace(/\D/g, "")
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2")
    .substring(0, 15);
}


function maskCEP(value: string) {
  // Formato 99999-999
  return value
    .replace(/\D/g, "")
    .replace(/(\d{5})(\d)/, "$1-$2")
    .substring(0, 9);
}

function maskRG(value: string) {
  // Exemplo genérico de RG: 12.345.678-9 (pode variar)
  return value
    .replace(/\D/g, "")
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1-$2")
    .substring(0, 12);
}
function maskCNH(value: string) {
  return value
    .replace(/\D/g, "") // Remove tudo que não for número
    .substring(0, 11) // Limita a 11 dígitos
    .replace(/(\d{3})(\d)/, "$1 $2") // Primeiro espaço após 3 dígitos
    .replace(/(\d{3}) (\d{3})(\d)/, "$1 $2 $3") // Segundo espaço após 6 dígitos
    .replace(/(\d{3}) (\d{3}) (\d{3})(\d{1,2})/, "$1 $2 $3 $4"); // Último espaço antes dos dois últimos dígitos
}

function maskHora(value: string) {
  // Remove tudo que não for dígito e considera apenas os 4 primeiros dígitos
  let digits = value.replace(/\D/g, '').substring(0, 4);

  // Separa os dígitos em hora e minuto
  let hour = digits.substring(0, 2);
  let minute = digits.substring(2, 4);

  // Valida e ajusta a hora se necessário (máximo 23)
  if (hour.length === 2) {
    const h = parseInt(hour, 10);
    if (h > 23) {
      hour = '23';
    }
  }

  // Valida e ajusta os minutos se necessário (máximo 59)
  if (minute.length === 2) {
    const m = parseInt(minute, 10);
    if (m > 59) {
      minute = '59';
    }
  }

  // Se houver minutos, insere o separador ":"
  return minute ? `${hour}:${minute}` : hour;
}

/**
 * Função principal que decide qual máscara usar com base em `tipoMascara`.
 */
function maskValorMonetario(valor: number | string): string {
  // Garante que o valor seja convertido corretamente
  let numero: number;

  if (typeof valor === "string") {
    // Remove qualquer ponto usado como separador de milhar e substitui vírgula decimal por ponto
    const normalizado = valor.replace(",", ".");
    numero = parseFloat(normalizado);
  } else {
    numero = valor;
  }

  if (isNaN(numero)) return "R$ 0,00";

  return numero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/** 
 * Função para converter data do formato ISO (YYYY-MM-DD) para o formato brasileiro (DD/MM/YYYY)
 */

function maskDataIsoBr(value: string): string {
  // Padrão brasileiro DD/MM/YYYY
  if (!value) return value;

  let partes: string[] = [];
  partes = value.split("-");
  if (partes.length !== 3) return value;
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

/**
 * Função principal que decide qual máscara usar com base em `tipoMascara`.
 */
export default function aplicarMascara(value: string, tipoMascara?: string): string {
  if (!tipoMascara) return value; // se não tiver máscara, não faz nada
  switch (tipoMascara.toLowerCase()) {
    case "cpf":
      return maskCPF(value);
    case "cnpj":
      return maskCNPJ(value);
    case "telefone":
      return maskTelefoneFixo(value);
    case "celular":
      return maskTelefoneCelular(value);
    case "cep":
      return maskCEP(value);
    case "rg":
      return maskRG(value);
    case "cnh":
      return maskCNH(value);
    case "valor":
      return maskValorMonetario(value);
    case "hora":  // Adicionando a máscara de hora
      return maskHora(value);
    case "dataisobr":
      return maskDataIsoBr(value);
    default:
      return value; // se não for nenhum dos acima, retorna sem formatação
  }
}
