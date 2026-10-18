// Mock data matching the shape expected from GET /api/dashboard/metrics and
// GET /api/dashboard/recovery-actions. Swap these out once the backend is
// live — Dashboard.jsx already tries the real endpoints first and falls
// back to this only on failure.

export const mockMetrics = {
  totalRevenue: 124500,
  recoveredRevenue: 38500,
  recoveryRate: 30.9,
  failedPayments: 24,
  abandonedCarts: 47,
  revenueOverTime: [
    { month: "Mar", total: 68000, recovered: 12000 },
    { month: "Apr", total: 81000, recovered: 18000 },
    { month: "May", total: 94000, recovered: 22500 },
    { month: "Jun", total: 108000, recovered: 29000 },
    { month: "Jul", total: 116500, recovered: 33500 },
    { month: "Aug", total: 124500, recovered: 38500 },
  ],
};

export const mockRecoveryActions = [
  {
    customer: "Rahul Sharma",
    cartId: "cart_001",
    amount: 4500,
    problem: "Abandoned Cart",
    aiAction: "Email Recovery",
    status: "Recovered",
    date: "2026-08-29",
  },
  {
    customer: "Priya Nair",
    cartId: "cart_002",
    amount: 3200,
    problem: "Payment Failed",
    aiAction: "Retry Link Sent",
    status: "Recovered",
    date: "2026-08-28",
  },
  {
    customer: "Aman Verma",
    cartId: "cart_003",
    amount: 6500,
    problem: "Abandoned Cart",
    aiAction: "Email Recovery",
    status: "Pending",
    date: "2026-08-27",
  },
  {
    customer: "Sneha Kapoor",
    cartId: "cart_004",
    amount: 1800,
    problem: "Payment Failed",
    aiAction: "Discount Offer",
    status: "Lost",
    date: "2026-08-25",
  },
  {
    customer: "Vikram Rao",
    cartId: "cart_005",
    amount: 2800,
    problem: "Abandoned Cart",
    aiAction: "Email Recovery",
    status: "Recovered",
    date: "2026-08-24",
  },
];
