export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'RESIDENT' | 'SECURITY' | 'TECHNICIAN';
  residentType?: 'OWNER' | 'TENANT';
  unitNumber: string | null;
  isDemoUser: boolean;
  phone: string;
}

export interface Unit {
  _id: string;
  unitNumber: string;
  block: string;
  ownerName: string;
  monthlyMaintenanceFee: number;
  currentDueStatus: 'PAID' | 'PENDING' | 'OVERDUE';
  lastPaidDate: string | null;
  totalDue?: number;
  hasPendingCharges?: boolean;
}

export interface MaintenanceTicket {
  _id: string;
  ticketId: string;
  unitNumber: string;
  reportedBy: string | User;
  title: string;
  description: string;
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';
  issueScope?: 'PRIVATE' | 'COMMON';
  partsCost?: number;
  laborCost?: number;
  expenseNotes?: string;
  paymentStatus?: 'UNBILLED' | 'BILLED_TO_RESIDENT' | 'PAID_BY_TREASURY';
  aiEstimatedCost?: string;
  aiEstimatedTime?: string;
  aiTriageAnalysis?: string;
  status: 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  assignedTo?: string | User | null;
  resolutionNotes?: string;
  residentRating?: number;
  photoUrl?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface TreasuryTransaction {
  _id: string;
  transactionType: 'INFLOW' | 'OUTFLOW';
  category: string;
  amount: number;
  description: string;
  unitNumber?: string;
  loggedBy: string | User;
  vendorName?: string;
  date: string;
  receiptUrl?: string;
}

export interface TreasurySummary {
  totalBalance: number;
  monthlyInflow: number;
  monthlyOutflow: number;
  currentMonthInflow: number;
  currentMonthOutflow: number;
  categoryBreakdown: Record<string, number>;
}

export interface VisitorPass {
  _id: string;
  passCode: string;
  unitNumber: string;
  hostUserId: string | User;
  visitorName: string;
  visitorPhone: string;
  purpose: 'GUEST' | 'DELIVERY' | 'CAB' | 'SERVICE' | 'OTHER';
  vehicleNumber?: string;
  expectedDate: string;
  status: 'PRE_APPROVED' | 'INSIDE' | 'COMPLETED' | 'REJECTED';
  checkInTime?: string;
  checkOutTime?: string;
  verifiedByGuard?: string | User;
  createdAt: string;
}

export interface SocietyNotice {
  _id: string;
  title: string;
  content: string;
  category: 'GENERAL' | 'EMERGENCY' | 'MAINTENANCE' | 'EVENT';
  isEmergency: boolean;
  createdBy: string | User;
  createdAt: string;
}

export interface AITriageResult {
  category: string;
  priority: string;
  estimatedCost: string;
  estimatedTime: string;
  reasoning: string;
}
