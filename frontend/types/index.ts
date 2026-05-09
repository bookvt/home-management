export interface Maintenance {
  id: number;
  name: string;
  date: string;
  notes: string;
  next_due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Asset {
  id: number;
  name: string;
  category: string;
  purchase_date: string | null;
  price: number | null;
  warranty_expiry: string | null;
  notes: string;
  image_url: string;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: number;
  type: string;
  amount: number;
  month: string;
  is_one_off: boolean;
  date: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: number;
  title: string;
  category: string;
  file_url: string;
  expiry_date: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface MonthlyTrend {
  month: string;
  type: string;
  total: number;
}

export interface SearchResult {
  id: number;
  category: string;
  title: string;
  subtitle: string;
}

export interface DashboardData {
  upcoming_maintenance: Maintenance[];
  expiring_warranties: Asset[];
  expiring_documents: Document[];
  recent_expenses: Expense[];
  total_this_month: number;
}
