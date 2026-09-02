import axios from 'axios';
import { 
  User, Unit, MaintenanceTicket, TreasurySummary, 
  TreasuryTransaction, VisitorPass, SocietyNotice, AITriageResult 
} from '../types';

const api = axios.create({
  baseURL: '/api'
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const loginUser = (email: string, password: string) => api.post<{success: boolean; token: string; user: User}>('/auth/login', { email, password });
export const quickDemoLogin = (role?: string, email?: string) => api.post<{success: boolean; token: string; user: User}>('/auth/quick-demo-login', { role, email });
export const resetDatabase = () => api.post('/admin/reset-database');
export const getTechnicians = () => api.get<{success: boolean; technicians: User[]}>('/auth/technicians');

// Maintenance
export const getTickets = () => api.get<{success: boolean; tickets: MaintenanceTicket[]}>('/maintenance/tickets');
export const createTicket = (data: Partial<MaintenanceTicket>) => api.post<{success: boolean; ticket: MaintenanceTicket}>('/maintenance/tickets', data);
export const assignTicket = (id: string, technicianId: string) => api.put<{success: boolean; ticket: MaintenanceTicket}>(`/maintenance/tickets/${id}/assign`, { technicianId });
export const updateTicketStatus = (id: string, status: string, notes?: string, partsCost?: number, laborCost?: number, expenseNotes?: string) => api.put<{success: boolean; ticket: MaintenanceTicket}>(`/maintenance/tickets/${id}/status`, { status, resolutionNotes: notes, partsCost, laborCost, expenseNotes });
export const rateTicket = (id: string, rating: number) => api.put<{success: boolean; ticket: MaintenanceTicket}>(`/maintenance/tickets/${id}/rate`, { rating });
export const approveTicketExpense = (id: string) => api.post<{success: boolean; ticket: MaintenanceTicket}>(`/maintenance/tickets/${id}/approve-expense`);

// AI
export const triageIssue = (title: string, description: string) => api.post<{success: boolean; analysis: AITriageResult}>('/ai/triage-issue', { title, description });
export const auditFinances = () => api.post<{success: boolean; audit: string}>('/ai/audit-finances');
export const generateNotice = (rawNotes: string, category: string) => api.post<{success: boolean; notice: string}>('/ai/generate-notice', { rawNotes, category });

// Treasury
export const getTreasurySummary = () => api.get<{success: boolean; totalBalance: number; currentMonthInflow: number; currentMonthOutflow: number; categoryBreakdown: Record<string, number>}>('/treasury/summary');
export const getTransactions = () => api.get<{success: boolean; transactions: TreasuryTransaction[]}>('/treasury/transactions');
export const createTransaction = (data: Partial<TreasuryTransaction>) => api.post<{success: boolean; transaction: TreasuryTransaction}>('/treasury/transactions', data);
export const raiseFund = (data: { targetType: string, amount: number, description: string }) => api.post('/treasury/raise-fund', data);
export const getUnitLedger = (unitNumber: string) => api.get<{success: boolean; charges: any[] }>(`/treasury/unit-ledger/${unitNumber}`);
export const payDues = (unitNumber: string, amount: number) => api.post<{success: boolean}>('/treasury/pay-dues', { unitNumber, amount });
export const getUnitStatus = () => api.get<{success: boolean; units: Unit[]}>('/treasury/unit-status');

// Visitors
export const getVisitorPasses = () => api.get<{success: boolean; passes: VisitorPass[]}>('/visitors/passes');
export const createVisitorPass = (data: Partial<VisitorPass>) => api.post<{success: boolean; pass: VisitorPass}>('/visitors/create-pass', data);
export const verifyVisitorCode = (code: string) => api.post<{success: boolean; pass: VisitorPass}>('/visitors/verify-code', { code });
export const checkInVisitor = (passId: string) => api.post<{success: boolean; pass: VisitorPass}>('/visitors/check-in', { passId });
export const checkOutVisitor = (passId: string) => api.post<{success: boolean; pass: VisitorPass}>('/visitors/check-out', { passId });

// Notices
export const getNotices = () => api.get<{success: boolean; notices: SocietyNotice[]}>('/notices');

// Emergency
export const triggerSOS = () => api.post<{success: boolean}>('/emergency/sos');
export const getActiveSOS = () => api.get<{success: boolean; alerts: any[]}>('/emergency/sos/active');
export const resolveSOS = (id: string) => api.put<{success: boolean}>(`/emergency/sos/${id}/resolve`);

export default api;
