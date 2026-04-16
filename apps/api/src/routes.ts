import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import {
  createPartner,
  getAllPartners,
  createRequest,
  getAllRequests,
  getPartnerByEmail,
  updateRequestStatus,
  getRequestsByPartnerId,
  validatePartnerCredentials
} from './db.js';

interface AuthTokenPayload {
  role: 'admin' | 'partner';
  email: string;
  partnerId?: string;
}

interface AuthenticatedRequest extends Request {
  user?: AuthTokenPayload;
}

const router = Router();

const sampleServices = [
  { id: 's1', name: 'Vazamento', description: 'Reparo de vazamentos em tubula��es e conex�es.' },
  { id: 's2', name: 'Entupimento', description: 'Desentupimento de ralos, sanit�rios e caixas.' },
  { id: 's3', name: 'Instala��o', description: 'Instala��o de torneiras, chuveiros e lou�as sanit�rias.' },
  { id: 's4', name: 'Reparo', description: 'Reparos hidr�ulicos e solu��es de baixa press�o.' }
];

const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@sos.com';
const adminPassword = process.env.ADMIN_PASSWORD ?? 'admin123';
const authSecret = process.env.JWT_SECRET ?? 'sos-secret-key';

interface AuthTokenPayload {
  role: 'admin' | 'partner';
  email: string;
  partnerId?: string;
}

function authenticatePartner(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authorization = String(req.headers.authorization ?? '');
  const token = authorization.replace(/^Bearer\s+/i, '');

  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido.' });
  }

  try {
    const decoded = jwt.verify(token, authSecret) as AuthTokenPayload;
    if (decoded.role !== 'partner') {
      return res.status(403).json({ error: 'Acesso negado para parceiro.' });
    }

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
}

router.post('/auth/admin/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'E-mail e senha s�o obrigat�rios.' });
  }

  if (email !== adminEmail || password !== adminPassword) {
    return res.status(401).json({ error: 'Credenciais de administrador inv�lidas.' });
  }

  const token = jwt.sign({ role: 'admin', email }, authSecret, { expiresIn: '8h' });
  return res.json({ token, email, role: 'admin' });
});

router.post('/auth/partner/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'E-mail e senha s�o obrigat�rios.' });
  }

  const partner = getPartnerByEmail(email);
  if (!partner || !validatePartnerCredentials(email, password)) {
    return res.status(401).json({ error: 'Credenciais de parceiro inv�lidas.' });
  }

  const token = jwt.sign({ role: 'partner', partnerId: partner.id, email: partner.email }, authSecret, { expiresIn: '8h' });
  return res.json({ token, partner });
});

router.get('/services', (_req, res) => {
  res.json(sampleServices);
});

router.get('/partners', (_req, res) => {
  res.json(getAllPartners());
});

router.post('/partners', (req, res) => {
  const { name, email, phone, coverage, password } = req.body;

  if (!name || !email || !phone || !coverage || !password) {
    return res.status(400).json({ error: 'Dados incompletos para cria��o do parceiro.' });
  }

  const existingPartner = getPartnerByEmail(email);
  if (existingPartner) {
    return res.status(409).json({ error: 'J� existe um parceiro registrado com este e-mail.' });
  }

  const partner = createPartner({ name, email, phone, coverage, password });
  return res.status(201).json({ message: 'Parceiro criado com sucesso.', partner });
});

router.post('/requests', (req, res) => {
  const { name, email, phone, address, serviceType, preferredDate, preferredTime, details, partner_id } = req.body;

  if (!name || !email || !phone || !address || !serviceType || !details) {
    return res.status(400).json({ error: 'Dados incompletos na solicita��o.' });
  }

  const request = createRequest({
    name,
    email,
    phone,
    address,
    serviceType,
    preferredDate: preferredDate ?? null,
    preferredTime: preferredTime ?? null,
    details,
    partner_id: partner_id ?? null
  });

  return res.status(201).json({ message: 'Solicita��o registrada com sucesso.', request });
});

router.get('/requests', (_req, res) => {
  res.json(getAllRequests());
});

router.get('/partner/requests', authenticatePartner, (req: AuthenticatedRequest, res: Response) => {
  const partnerId = String(req.user?.partnerId ?? '');

  if (!partnerId) {
    return res.status(400).json({ error: 'partnerId é obrigatório.' });
  }

  const partnerRequests = getRequestsByPartnerId(partnerId);
  return res.json(partnerRequests);
});

router.patch('/requests/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'Status � obrigat�rio.' });
  }

  const updatedRequest = updateRequestStatus(id, status);
  if (!updatedRequest) {
    return res.status(404).json({ error: 'Solicita��o n�o encontrada.' });
  }

  return res.json({ message: 'Status atualizado.', request: updatedRequest });
});

export const apiRouter = router;
