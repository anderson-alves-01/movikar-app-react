
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { storage } from '../storage';

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

interface AuthRequest extends Request {
  user?: any;
}

// Enhanced authentication middleware
export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Try to get token from cookies first, then fallback to Authorization header
    let token = req.cookies?.token;
    
    if (!token) {
      const authHeader = req.headers['authorization'];
      token = authHeader && authHeader.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Token de acesso obrigatório' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    const user = await storage.getUser(decoded.userId);
    
    if (!user) {
      return res.status(403).json({ message: 'Token inválido' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: 'Token expirado' });
    }
    return res.status(403).json({ message: 'Token inválido' });
  }
};

// Admin authorization middleware
export const requireAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Usuário não autenticado' });
  }
  
  if (req.user.role !== 'admin') {
    console.log(`⚠️ Tentativa de acesso admin negada para usuário ${req.user.email} (role: ${req.user.role})`);
    return res.status(403).json({ error: 'Acesso negado: privilégios de administrador necessários' });
  }
  
  next();
};

// Owner verification middleware
export const requireOwnership = (resourceType: 'vehicle' | 'booking') => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const resourceId = parseInt(req.params.id);
      const userId = req.user.id;
      
      let resource;
      if (resourceType === 'vehicle') {
        resource = await storage.getVehicle(resourceId);
        if (!resource || resource.ownerId !== userId) {
          return res.status(403).json({ message: 'Acesso negado: você não é o proprietário deste veículo' });
        }
      } else if (resourceType === 'booking') {
        resource = await storage.getBooking(resourceId);
        if (!resource || (resource.renterId !== userId && resource.ownerId !== userId)) {
          return res.status(403).json({ message: 'Acesso negado: você não está envolvido nesta reserva' });
        }
      }
      
      next();
    } catch (error) {
      return res.status(500).json({ message: 'Erro ao verificar propriedade' });
    }
  };
};

// Refresh token middleware
export const refreshToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    
    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token não encontrado' });
    }

    const decoded = jwt.verify(refreshToken, JWT_SECRET + '_refresh') as { userId: number };
    const user = await storage.getUser(decoded.userId);
    
    if (!user) {
      return res.status(403).json({ message: 'Refresh token inválido' });
    }
    
    // Generate new access token
    const newToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '15m' });
    
    res.cookie('token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000
    });
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Refresh token inválido' });
  }
};
