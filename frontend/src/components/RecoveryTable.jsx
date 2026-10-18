import { ClipboardList } from "lucide-react";
import EmptyState from "./EmptyState";
import "./RecoveryTable.css";

const statusToneClass = {
  Recovered: "status-recovered",
  Pending: "status-pending",
  Lost: "status-lost",
};

export default function RecoveryTable({ actions }) {
  if (!actions || actions.length === 0) {
    return (
      <div className="recovery-table glass">
        <EmptyState
          icon={ClipboardList}
          title="No recovery activity yet"
          description="Recovery actions will show up here once the AI system starts working abandoned carts and failed payments."
        />
      </div>
    );
  }

  return (
    <div className="recovery-table glass">
      <div className="recovery-table-scroll">
        <table>
          <thead>
            <tr>
              <th>Customer</th>
              <th>Cart ID</th>
              <th>Amount</th>
              <th>Problem</th>
              <th>AI Action</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {actions.map((row, i) => (
              // One cart can have several recovery actions, so cartId alone
              // isn't a unique key.
              <tr key={row.id ?? `${row.cartId}-${i}`}>
                <td>{row.customer}</td>
                <td className="recovery-table-mono">{row.cartId}</td>
                <td className="recovery-table-mono">₹{row.amount.toLocaleString("en-IN")}</td>
                <td>{row.problem}</td>
                <td>{row.aiAction}</td>
                <td>
                  <span className={`recovery-status ${statusToneClass[row.status] || ""}`}>
                    {row.status}
                  </span>
                </td>
                <td className="recovery-table-date">{row.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
