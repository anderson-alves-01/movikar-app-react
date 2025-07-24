import { z } from "zod";

// Lista de modelos de carros válidos organizados por marca
export const VALID_VEHICLE_MODELS: Record<string, string[]> = {
  "Honda": [
    "Civic", "Accord", "CR-V", "HR-V", "Fit", "City", "Pilot", "Ridgeline", 
    "Passport", "Insight", "CR-Z", "Element", "S2000", "NSX", "Odyssey"
  ],
  "Toyota": [
    "Corolla", "Camry", "RAV4", "Highlander", "Prius", "Yaris", "Avalon",
    "4Runner", "Tacoma", "Tundra", "Sienna", "Sequoia", "Land Cruiser", "C-HR",
    "Supra", "86", "Prius Prime", "Venza", "GR Supra", "GR 86"
  ],
  "Ford": [
    "Focus", "Fiesta", "Mustang", "F-150", "Explorer", "Escape", "Fusion",
    "Edge", "Expedition", "Ranger", "Bronco", "EcoSport", "Transit", "Maverick"
  ],
  "Chevrolet": [
    "Cruze", "Malibu", "Impala", "Camaro", "Corvette", "Silverado", "Tahoe",
    "Suburban", "Traverse", "Equinox", "Blazer", "Colorado", "Spark", "Sonic",
    "Trax", "Volt", "Bolt"
  ],
  "Volkswagen": [
    "Golf", "Jetta", "Passat", "Tiguan", "Atlas", "Arteon", "Beetle", "CC",
    "Touareg", "ID.4", "Polo", "Up!", "T-Cross", "Virtus", "Nivus"
  ],
  "Nissan": [
    "Sentra", "Altima", "Maxima", "Versa", "Rogue", "Murano", "Pathfinder",
    "Armada", "Frontier", "Titan", "370Z", "GT-R", "LEAF", "Kicks", "March"
  ],
  "Hyundai": [
    "Elantra", "Sonata", "Accent", "Genesis", "Tucson", "Santa Fe", "Palisade",
    "Venue", "Kona", "Nexo", "Veloster", "Ioniq", "HB20", "Creta"
  ],
  "Kia": [
    "Forte", "Optima", "Rio", "Soul", "Sportage", "Sorento", "Telluride",
    "Stinger", "Niro", "Seltos", "Carnival", "Picanto", "Cerato"
  ],
  "BMW": [
    "Series 1", "Series 2", "Series 3", "Series 4", "Series 5", "Series 6",
    "Series 7", "Series 8", "X1", "X2", "X3", "X4", "X5", "X6", "X7", "Z4", "i3", "i4", "iX"
  ],
  "Mercedes": [
    "A-Class", "B-Class", "C-Class", "E-Class", "S-Class", "CLA", "CLS",
    "GLA", "GLB", "GLC", "GLE", "GLS", "G-Class", "SL", "AMG GT"
  ],
  "Audi": [
    "A1", "A3", "A4", "A5", "A6", "A7", "A8", "Q2", "Q3", "Q5", "Q7", "Q8",
    "TT", "R8", "e-tron GT"
  ],
  "Fiat": [
    "Uno", "Palio", "Siena", "Strada", "Toro", "Argo", "Cronos", "Mobi",
    "500", "Ducato", "Fiorino", "Doblo"
  ],
  "Renault": [
    "Sandero", "Logan", "Duster", "Captur", "Kwid", "Oroch", "Master",
    "Kangoo", "Clio", "Megane", "Fluence"
  ],
  "Peugeot": [
    "208", "2008", "308", "3008", "408", "508", "5008", "Partner", "Expert",
    "Boxer", "206", "207"
  ],
  "Citroen": [
    "C3", "C4", "C4 Cactus", "Aircross", "Berlingo", "Jumper", "C5", "DS3"
  ],
  "Jeep": [
    "Renegade", "Compass", "Cherokee", "Grand Cherokee", "Wrangler", "Gladiator",
    "Commander", "Wagoneer"
  ],
  "Land Rover": [
    "Discovery", "Range Rover", "Defender", "Freelander", "Evoque", "Velar",
    "Sport"
  ],
  "Mitsubishi": [
    "Lancer", "Outlander", "Eclipse", "Pajero", "L200", "ASX", "Mirage"
  ],
  "Subaru": [
    "Impreza", "Legacy", "Outback", "Forester", "Ascent", "Crosstrek", "WRX", "BRZ"
  ],
  "Mazda": [
    "Mazda3", "Mazda6", "CX-3", "CX-5", "CX-9", "MX-5", "CX-30"
  ]
};

// Função para validar se o modelo é válido para a marca
export function isValidModelForBrand(brand: string, model: string): boolean {
  const brandModels = VALID_VEHICLE_MODELS[brand];
  if (!brandModels) return true; // Se a marca não está na lista, permite qualquer modelo
  
  return brandModels.some(validModel => 
    validModel.toLowerCase() === model.toLowerCase()
  );
}

// Schema de validação para modelo de veículo
export const vehicleModelValidation = z.string()
  .min(1, "Modelo é obrigatório")
  .max(50, "Modelo não pode ter mais de 50 caracteres")
  .regex(/^[a-zA-Z0-9\s\-\.\/]+$/, "Modelo contém caracteres inválidos. Use apenas letras, números, espaços, hífens e pontos")
  .refine((val) => val.trim().length > 0, "Modelo não pode estar vazio")
  .refine((val) => !/^\s+|\s+$/.test(val), "Modelo não pode começar ou terminar com espaços")
  .refine((val) => !/\s{2,}/.test(val), "Modelo não pode ter espaços duplos")
  .refine((val) => !/^[0-9]+$/.test(val), "Modelo não pode ser apenas números")
  .refine((val) => !/(test|teste|lixo|xxx|aaa|zzz|qwe|asdf|spam|fake|invalid)/i.test(val), 
    "Modelo contém palavras inválidas ou de teste")
  .refine((val) => val.length >= 2, "Modelo deve ter pelo menos 2 caracteres")
  .transform((val) => val.trim().replace(/\s+/g, ' ')); // Normaliza espaços

// Schema de validação para marca de veículo
export const vehicleBrandValidation = z.string()
  .min(1, "Marca é obrigatória")
  .max(30, "Marca não pode ter mais de 30 caracteres")
  .regex(/^[a-zA-Z0-9\s\-]+$/, "Marca contém caracteres inválidos. Use apenas letras, números, espaços e hífens")
  .refine((val) => val.trim().length > 0, "Marca não pode estar vazia")
  .refine((val) => !/(test|teste|lixo|xxx|aaa|zzz)/i.test(val), "Marca contém palavras inválidas")
  .transform((val) => val.trim().replace(/\s+/g, ' '));

// Validação cruzada de marca e modelo
export const vehicleBrandModelValidation = z.object({
  brand: vehicleBrandValidation,
  model: vehicleModelValidation
}).refine((data) => {
  return isValidModelForBrand(data.brand, data.model);
}, {
  message: "Modelo não é válido para a marca selecionada. Verifique se o modelo está correto.",
  path: ["model"] // Erro aparece no campo modelo
});

export type VehicleBrandModel = z.infer<typeof vehicleBrandModelValidation>;