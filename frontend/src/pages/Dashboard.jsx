import { useEffect, useState } from "react";
import {
  Wallet,
  TrendingUp,
  Percent,
  CircleX,
  ShoppingCart,
} from "lucide-react";
import DashboardCard from "../components/DashboardCard";
import RevenueChart from "../components/RevenueChart";
import RecoveryTable from "../components/RecoveryTable";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import { getDashboardMetrics, getRecoveryActions } from "../services/api";
import { mockMetrics, mockRecoveryActions } from "../data/dashboardMock";
import "./Dashboard.css";

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [actions, setActions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usingMockData, setUsingMockData] = useState(false);

  async function loadDashboard() {
    setLoading(true);
    setError(null);
    try {
      const [metricsRes, actionsRes] = await Promise.all([
        getDashboardMetrics(),
        getRecoveryActions(),
      ]);
      setMetrics(metricsRes);
      setActions(actionsRes);
      setUsingMockData(false);
    } catch (err) {
      if (err.status === 0) {
        // Backend isn't reachable at all (not running yet) — fall back to
        // mock data so the dashboard is still reviewable end-to-end.
        setMetrics(mockMetrics);
        setActions(mockRecoveryActions);
        setUsingMockData(true);
      } else {
        // The backend answered with an error — show it instead of hiding a
        // real problem behind sample numbers.
        setError(err.message || "The dashboard API returned an error.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="container dashboard-page">
        <LoadingSpinner label="Loading dashboard" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container dashboard-page">
        <ErrorMessage title="Couldn't load dashboard" message={error} onRetry={loadDashboard} />
      </div>
    );
  }

  return (
    <div className="container dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1>Revenue Recovery Dashboard</h1>
          <p>What the AI recovery system caught, and what it's still working on.</p>
        </div>
        {usingMockData && (
          <span className="dashboard-mock-badge">Showing sample data — backend not connected</span>
        )}
      </div>

      <div className="dashboard-cards">
        <DashboardCard
          label="Total Revenue"
          value={`₹${metrics.totalRevenue.toLocaleString("en-IN")}`}
          icon={Wallet}
        />
        <DashboardCard
          label="Recovered Revenue"
          value={`₹${metrics.recoveredRevenue.toLocaleString("en-IN")}`}
          icon={TrendingUp}
          tone="positive"
        />
        <DashboardCard
          label="Recovery Rate"
          value={`${metrics.recoveryRate}%`}
          icon={Percent}
          tone="positive"
        />
        <DashboardCard
          label="Failed Payments"
          value={metrics.failedPayments}
          icon={CircleX}
          tone="negative"
        />
        <DashboardCard
          label="Abandoned Carts"
          value={metrics.abandonedCarts}
          icon={ShoppingCart}
          tone="warning"
        />
      </div>

      <RevenueChart data={metrics.revenueOverTime} />

      <div className="dashboard-table-heading">
        <h2>Recovery activity</h2>
      </div>
      <RecoveryTable actions={actions} />
    </div>
  );
}
