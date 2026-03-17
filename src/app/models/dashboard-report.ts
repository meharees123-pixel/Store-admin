export interface DashboardMonthlySales {
  year: number;
  month: number;
  totalSales: number;
  orderCount: number;
}

export interface DashboardTopStore {
  storeId?: string | null;
  store?: {
    _id: string;
    name?: string;
    location?: string;
  } | null;
  totalSales: number;
  orderCount: number;
}

export interface DashboardTopProduct {
  productId?: string | null;
  product?: {
    _id: string;
    name?: string;
  } | null;
  totalSales: number;
  quantity: number;
}

export interface DashboardReport {
  totalStores: number;
  totalUsers: number;
  totalOrders: number;
  totalSales: number;
  monthlySales: DashboardMonthlySales[];
  topStores: DashboardTopStore[];
  topProducts: DashboardTopProduct[];
}
