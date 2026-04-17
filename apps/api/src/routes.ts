import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import {
  createPartner,
  getAllPartners,
  createRequest,
  getAllRequests,
  getRequestById,
  getPartnerByEmail,
  getPartnerById,
  getAdminByEmail,
  updateAdminCredentials,
  assignRequestToPartner,
  validatePartnerCredentials,
  validateAdminCredentials,
  getRequestsByPartnerId,
  updateRequestStatus
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

const adminEmail = process.env.ADMIN_EMAIL ?? 'admin';
const adminPassword = process.env.ADMIN_PASSWORD ?? 'admin';
const authSecret = process.env.JWT_SECRET ?? 'sos-secret-key';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function validateEmailFormat(email: string) {
  return emailPattern.test(email);
}

function validatePasswordStrength(password: string) {
  return password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password);
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

function authenticateAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authorization = String(req.headers.authorization ?? '');
  const token = authorization.replace(/^Bearer\s+/i, '');

  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido.' });
  }

  try {
    const decoded = jwt.verify(token, authSecret) as AuthTokenPayload;
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado para administrador.' });
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
    return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  if (!validateAdminCredentials(normalizedEmail, String(password))) {
    return res.status(401).json({ error: 'Credenciais de administrador inválidas.' });
  }

  const admin = getAdminByEmail(normalizedEmail);
  if (!admin) {
    return res.status(401).json({ error: 'Credenciais de administrador inválidas.' });
  }

  const token = jwt.sign({ role: 'admin', email: admin.email }, authSecret, { expiresIn: '8h' });
  return res.json({ token, email: admin.email, role: 'admin' });
});

router.post('/auth/partner/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  if (!validateEmailFormat(normalizedEmail)) {
    return res.status(400).json({ error: 'E-mail inválido.' });
  }

  const partner = getPartnerByEmail(normalizedEmail);
  if (!partner || !validatePartnerCredentials(normalizedEmail, String(password))) {
    return res.status(401).json({ error: 'Credenciais de parceiro inválidas.' });
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
    return res.status(400).json({ error: 'Dados incompletos para criação do parceiro.' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  if (!validateEmailFormat(normalizedEmail)) {
    return res.status(400).json({ error: 'E-mail inválido.' });
  }

  if (!validatePasswordStrength(String(password))) {
    return res.status(400).json({ error: 'Senha fraca. Use 8+ caracteres, letras maiúsculas, minúsculas e números.' });
  }

  const existingPartner = getPartnerByEmail(normalizedEmail);
  if (existingPartner) {
    return res.status(409).json({ error: 'Já existe um parceiro registrado com este e-mail.' });
  }

  const partner = createPartner({ name, email: normalizedEmail, phone, coverage, password });
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

router.get('/partner/available-requests', authenticatePartner, (req: AuthenticatedRequest, res: Response) => {
  const partnerId = String(req.user?.partnerId ?? '');
  if (!partnerId) {
    return res.status(400).json({ error: 'partnerId é obrigatório.' });
  }

  const partner = getPartnerById(partnerId);
  if (!partner) {
    return res.status(404).json({ error: 'Parceiro não encontrado.' });
  }

  const lowerCoverage = partner.coverage.toLowerCase();
  const availableRequests = getAllRequests().filter((request) => {
    const isUnassigned = !request.partner_id;
    const isPending = request.status === 'pendente';
    const matchesCoverage = request.address.toLowerCase().includes(lowerCoverage) || request.serviceType.toLowerCase().includes(lowerCoverage);
    return isUnassigned && isPending && matchesCoverage;
  });

  return res.json(availableRequests);
});

router.patch('/partner/requests/:id/claim', authenticatePartner, (req: AuthenticatedRequest, res: Response) => {
  const partnerId = String(req.user?.partnerId ?? '');
  const { id } = req.params;

  if (!partnerId || !id) {
    return res.status(400).json({ error: 'Dados de solicitação inválidos.' });
  }

  const partner = getPartnerById(partnerId);
  if (!partner) {
    return res.status(404).json({ error: 'Parceiro não encontrado.' });
  }

  const request = getRequestById(id);
  if (!request) {
    return res.status(404).json({ error: 'Solicitação não encontrada.' });
  }

  if (request.partner_id) {
    return res.status(409).json({ error: 'Solicitação já está atribuída.' });
  }

  const lowerCoverage = partner.coverage.toLowerCase();
  const matchesCoverage = request.address.toLowerCase().includes(lowerCoverage) || request.serviceType.toLowerCase().includes(lowerCoverage);

  if (!matchesCoverage) {
    return res.status(403).json({ error: 'Solicitação não está na região/cobertura do parceiro.' });
  }

  const assignedRequest = assignRequestToPartner(id, partnerId);
  if (!assignedRequest) {
    return res.status(409).json({ error: 'Não foi possível assumir a solicitação.' });
  }

  return res.json({ message: 'Solicitação atribuída com sucesso.', request: assignedRequest });
});

router.get('/admin/stats', authenticateAdmin, (_req, res) => {
  const requests = getAllRequests();
  const partners = getAllPartners();
  const totalPending = requests.filter((request) => request.status === 'pendente').length;
  const totalAssigned = requests.filter((request) => Boolean(request.partner_id)).length;
  const totalAvailable = requests.filter((request) => !request.partner_id && request.status === 'pendente').length;

  return res.json({
    partnersCount: partners.length,
    requestsCount: requests.length,
    pendingRequests: totalPending,
    assignedRequests: totalAssigned,
    availableRequests: totalAvailable
  });
});

router.patch('/requests/:id/assign', authenticateAdmin, (req, res) => {
  const { id } = req.params;
  const { partnerId } = req.body;

  if (!id || !partnerId) {
    return res.status(400).json({ error: 'ID da solicitação e ID do parceiro são obrigatórios.' });
  }

  const partner = getPartnerById(partnerId);
  if (!partner) {
    return res.status(404).json({ error: 'Parceiro não encontrado.' });
  }

  const updatedRequest = assignRequestToPartner(id, partnerId);
  if (!updatedRequest) {
    return res.status(404).json({ error: 'Solicitação não encontrada ou já atribuída.' });
  }

  return res.json({ message: 'Solicitação atribuída ao parceiro.', request: updatedRequest });
});

router.patch('/admin/settings', authenticateAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { email, password } = req.body;
  const oldEmail = String(req.user?.email ?? '');

  if (!email || !password) {
    return res.status(400).json({ error: 'E-mail e senha são obrigatórios para atualizar as configurações administrativas.' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const normalizedPassword = String(password);

  if (!validateEmailFormat(normalizedEmail)) {
    return res.status(400).json({ error: 'E-mail inválido.' });
  }

  if (!validatePasswordStrength(normalizedPassword)) {
    return res.status(400).json({ error: 'Senha fraca. Use 8+ caracteres, letras maiúsculas, minúsculas e números.' });
  }

  const existingAdmin = getAdminByEmail(oldEmail);
  if (!existingAdmin) {
    return res.status(404).json({ error: 'Administrador não encontrado.' });
  }

  updateAdminCredentials(oldEmail, normalizedEmail, normalizedPassword);
  const updatedAdmin = getAdminByEmail(normalizedEmail);
  return res.json({ message: 'Configurações administrativas atualizadas.', admin: updatedAdmin });
});

router.patch('/requests/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'Status é obrigatório.' });
  }

  const updatedRequest = updateRequestStatus(id, status);
  if (!updatedRequest) {
    return res.status(404).json({ error: 'Solicitação não encontrada.' });
  }

  return res.json({ message: 'Status atualizado.', request: updatedRequest });
});

export const apiRouter = router;
