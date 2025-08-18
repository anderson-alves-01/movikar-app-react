// Enhanced PIX key validation with user-friendly error messages

export interface PixValidationResult {
  isValid: boolean;
  type?: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';
  errorMessage?: string;
}

export const validatePixKey = (pixKey: string): PixValidationResult => {
  if (!pixKey || pixKey.trim().length === 0) {
    return {
      isValid: false,
      errorMessage: 'Por favor, digite sua chave PIX'
    };
  }

  const cleaned = pixKey.trim().replace(/\s+/g, '');

  // CPF (11 dígitos)
  if (/^\d{11}$/.test(cleaned)) {
    if (isValidCPF(cleaned)) {
      return { isValid: true, type: 'cpf' };
    } else {
      return {
        isValid: false,
        errorMessage: 'CPF inválido. Verifique os números digitados.'
      };
    }
  }

  // CNPJ (14 dígitos)
  if (/^\d{14}$/.test(cleaned)) {
    if (isValidCNPJ(cleaned)) {
      return { isValid: true, type: 'cnpj' };
    } else {
      return {
        isValid: false,
        errorMessage: 'CNPJ inválido. Verifique os números digitados.'
      };
    }
  }

  // E-mail
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned)) {
    return { isValid: true, type: 'email' };
  }

  // Telefone (+5511999999999 ou 11999999999)
  if (/^(\+55)?\d{10,11}$/.test(cleaned.replace(/\D/g, ''))) {
    return { isValid: true, type: 'phone' };
  }

  // Chave aleatória (UUID)
  if (/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(cleaned)) {
    return { isValid: true, type: 'random' };
  }

  // Se nenhum formato for reconhecido
  if (/^\d+$/.test(cleaned)) {
    if (cleaned.length < 11) {
      return {
        isValid: false,
        errorMessage: 'CPF deve ter 11 dígitos. Digite apenas números.'
      };
    } else if (cleaned.length === 12 || cleaned.length === 13) {
      return {
        isValid: false,
        errorMessage: 'CNPJ deve ter 14 dígitos. Digite apenas números.'
      };
    } else if (cleaned.length > 14) {
      return {
        isValid: false,
        errorMessage: 'Número muito longo. Verifique se é CPF (11) ou CNPJ (14).'
      };
    }
  }

  if (cleaned.includes('@')) {
    return {
      isValid: false,
      errorMessage: 'E-mail inválido. Verifique se está no formato correto (ex: nome@email.com).'
    };
  }

  return {
    isValid: false,
    errorMessage: 'Formato inválido. Use: CPF (11 números), e-mail, telefone, ou chave aleatória.'
  };
};

// CPF validation algorithm
function isValidCPF(cpf: string): boolean {
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  
  let sum = 0;
  let remainder: number;

  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.substring(9, 10))) return false;

  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.substring(10, 11))) return false;

  return true;
}

// CNPJ validation algorithm
function isValidCNPJ(cnpj: string): boolean {
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;
  
  let sum = 0;
  let remainder: number;
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  for (let i = 0; i < 12; i++) {
    sum += parseInt(cnpj[i]) * weights1[i];
  }
  remainder = sum % 11;
  const digit1 = remainder < 2 ? 0 : 11 - remainder;
  if (digit1 !== parseInt(cnpj[12])) return false;

  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cnpj[i]) * weights2[i];
  }
  remainder = sum % 11;
  const digit2 = remainder < 2 ? 0 : 11 - remainder;
  if (digit2 !== parseInt(cnpj[13])) return false;

  return true;
}

export const formatPixKey = (value: string, type?: string): string => {
  if (!value) return '';
  
  const cleaned = value.replace(/\D/g, '');
  
  // CPF format: 000.000.000-00
  if (type === 'cpf' || (cleaned.length <= 11 && /^\d+$/.test(value))) {
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}.${cleaned.slice(3)}`;
    if (cleaned.length <= 9) return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6)}`;
    return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9, 11)}`;
  }
  
  // CNPJ format: 00.000.000/0000-00
  if (type === 'cnpj' || (cleaned.length > 11 && cleaned.length <= 14 && /^\d+$/.test(value))) {
    if (cleaned.length <= 2) return cleaned;
    if (cleaned.length <= 5) return `${cleaned.slice(0, 2)}.${cleaned.slice(2)}`;
    if (cleaned.length <= 8) return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5)}`;
    if (cleaned.length <= 12) return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8)}`;
    return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8, 12)}-${cleaned.slice(12)}`;
  }
  
  return value;
};