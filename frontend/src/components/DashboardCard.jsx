import "./DashboardCard.css";

export default function DashboardCard({ label, value, icon: Icon, trend, tone = "default" }) {
  return (
    <div className={`dashboard-card glass tone-${tone}`}>
      <div className="dashboard-card-top">
        <span className="dashboard-card-label">{label}</span>
        {Icon && (
          <span className="dashboard-card-icon">
            <Icon size={16} />
          </span>
        )}
      </div>
      <span className="dashboard-card-value">{value}</span>
      {trend && <span className="dashboard-card-trend">{trend}</span>}
    </div>
  );
}
