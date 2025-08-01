
import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

// User validation
export const validateUser = [
  body('name')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Nome deve ter entre 3 e 100 caracteres')
    .escape(),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email deve ser válido')
    .isLength({ max: 255 })
    .withMessage('Email muito longo'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Senha deve ter pelo menos 6 caracteres'),
];

// Vehicle validation
export const validateVehicle = [
  body('brand')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Marca é obrigatória e deve ter no máximo 50 caracteres')
    .escape(),
  body('model')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Modelo é obrigatório e deve ter no máximo 50 caracteres')
    .escape(),
  body('year')
    .isInt({ min: 1900, max: new Date().getFullYear() + 1 })
    .withMessage('Ano deve ser válido'),
  body('pricePerDay')
    .isFloat({ min: 0 })
    .withMessage('Preço por dia deve ser um número positivo'),
  body('licensePlate')
    .matches(/^[A-Z]{3}[-]?[0-9][A-Z0-9][0-9]{2}$/)
    .withMessage('Placa deve estar no formato válido (ABC-1234 ou ABC1D23)'),
  body('renavam')
    .isLength({ min: 11, max: 11 })
    .matches(/^[0-9]{11}$/)
    .withMessage('RENAVAM deve ter exatamente 11 dígitos'),
  body('location')
    .trim()
    .isLength({ min: 5, max: 255 })
    .withMessage('Localização é obrigatória')
    .escape(),
];

// Booking validation
export const validateBooking = [
  body('vehicleId')
    .isInt({ min: 1 })
    .withMessage('ID do veículo deve ser válido'),
  body('startDate')
    .isISO8601()
    .withMessage('Data de início deve ser válida'),
  body('endDate')
    .isISO8601()
    .withMessage('Data de fim deve ser válida'),
  body('totalPrice')
    .isFloat({ min: 0 })
    .withMessage('Preço total deve ser positivo'),
];

// Message validation
export const validateMessage = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Mensagem deve ter entre 1 e 1000 caracteres')
    .escape(),
  body('receiverId')
    .isInt({ min: 1 })
    .withMessage('ID do destinatário deve ser válido'),
];

// Handle validation errors
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg);
    return res.status(400).json({ 
      message: 'Dados inválidos',
      errors: errorMessages 
    });
  }
  next();
};

// Rate limiting for sensitive operations
export const createRateLimit = (windowMs: number, max: number, message: string) => {
  const requests = new Map();
  
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!requests.has(ip)) {
      requests.set(ip, []);
    }
    
    const ipRequests = requests.get(ip).filter((timestamp: number) => timestamp > windowStart);
    
    if (ipRequests.length >= max) {
      return res.status(429).json({ message });
    }
    
    ipRequests.push(now);
    requests.set(ip, ipRequests);
    
    next();
  };
};

// Sanitize input to prevent XSS
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      return obj.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                .replace(/javascript:/gi, '')
                .replace(/on\w+\s*=/gi, '');
    }
    if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
        obj[key] = sanitize(obj[key]);
      }
    }
    return obj;
  };
  
  req.body = sanitize(req.body);
  req.query = sanitize(req.query);
  req.params = sanitize(req.params);
  
  next();
};
