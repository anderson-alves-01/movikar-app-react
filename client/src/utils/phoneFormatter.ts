// Comprehensive phone formatter with international support for tourists
export const formatPhoneNumber = (value: string): string => {
  if (!value) return '';
  
  // Remove all non-numeric characters
  const cleaned = value.replace(/\D/g, '');
  
  // International format (DDI + DDD + number)
  if (cleaned.startsWith('55') && cleaned.length >= 12) {
    const ddi = cleaned.slice(0, 2);  // 55
    const ddd = cleaned.slice(2, 4);  // area code
    const number = cleaned.slice(4);
    
    if (number.length === 9) {
      // Mobile: +55 (11) 99999-9999
      return `+${ddi} (${ddd}) ${number.slice(0, 5)}-${number.slice(5)}`;
    } else if (number.length === 8) {
      // Landline: +55 (11) 9999-9999
      return `+${ddi} (${ddd}) ${number.slice(0, 4)}-${number.slice(4)}`;
    }
  }
  
  // Other international formats (just add + and group)
  if (cleaned.length > 11) {
    // Generic international: +XX XXXX XXXX XXXX
    return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 6)} ${cleaned.slice(6, 10)} ${cleaned.slice(10)}`;
  }
  
  // Brazilian domestic format
  if (cleaned.length === 11) {
    // Mobile: (11) 99999-9999
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  } else if (cleaned.length === 10) {
    // Landline: (11) 9999-9999
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  }
  
  // Partial formatting for typing
  if (cleaned.length >= 2) {
    if (cleaned.length <= 6) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
    } else if (cleaned.length <= 10) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    } else {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    }
  }
  
  return cleaned;
};

export const validatePhoneNumber = (phone: string): boolean => {
  const cleaned = phone.replace(/\D/g, '');
  
  // Brazilian mobile (11 digits)
  if (cleaned.length === 11 && cleaned[2] === '9') {
    return true;
  }
  
  // Brazilian landline (10 digits)
  if (cleaned.length === 10) {
    return true;
  }
  
  // International (12-15 digits)
  if (cleaned.length >= 12 && cleaned.length <= 15) {
    return true;
  }
  
  return false;
};

// City autocomplete data for Brazil
export const popularBrazilianCities = [
  'São Paulo, SP',
  'Rio de Janeiro, RJ', 
  'Brasília, DF',
  'Salvador, BA',
  'Fortaleza, CE',
  'Belo Horizonte, MG',
  'Manaus, AM',
  'Curitiba, PR',
  'Recife, PE',
  'Goiânia, GO',
  'Belém, PA',
  'Porto Alegre, RS',
  'Guarulhos, SP',
  'Campinas, SP',
  'São Luís, MA',
  'São Gonçalo, RJ',
  'Maceió, AL',
  'Duque de Caxias, RJ',
  'Natal, RN',
  'Teresina, PI',
  'Campo Grande, MS',
  'Nova Iguaçu, RJ',
  'São Bernardo do Campo, SP',
  'João Pessoa, PB',
  'Osasco, SP',
  'Santo André, SP',
  'Jaboatão dos Guararapes, PE',
  'Contagem, MG',
  'São José dos Campos, SP',
  'Uberlândia, MG',
  'Sorocaba, SP',
  'Aracaju, SE',
  'Feira de Santana, BA',
  'Cuiabá, MT',
  'Joinville, SC',
  'Juiz de Fora, MG',
  'Aparecida de Goiânia, GO',
  'Londrina, PR',
  'Ananindeua, PA',
  'Porto Velho, RO',
  'Serra, ES',
  'Niterói, RJ',
  'Caxias do Sul, RS',
  'Macapá, AP',
  'Mauá, SP',
  'São João de Meriti, RJ',
  'São José do Rio Preto, SP',
  'Mogi das Cruzes, SP',
  'Diadema, SP',
  'Jundiaí, SP',
  'Piracicaba, SP',
  'Carapicuíba, SP',
  'Olinda, PE',
  'Cariacica, ES',
  'Itaquaquecetuba, SP',
  'Canoas, RS',
  'Campos dos Goytacazes, RJ',
  'Florianópolis, SC',
  'Vila Velha, ES',
  'Bauru, SP',
  'São Vicente, SP',
  'Pelotas, RS',
  'Montes Claros, MG'
];

export const filterCities = (query: string): string[] => {
  if (!query || query.length < 2) return popularBrazilianCities.slice(0, 10);
  
  const filtered = popularBrazilianCities.filter(city =>
    city.toLowerCase().includes(query.toLowerCase())
  );
  
  return filtered.slice(0, 10);
};