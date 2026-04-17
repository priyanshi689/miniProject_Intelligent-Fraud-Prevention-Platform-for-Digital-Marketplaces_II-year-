// frontend/src/components/AlertToast.jsx
// Drop this file into your frontend/src/components/ folder

import { useEffect, useState, useCallback } from "react";
import { useSocket } from "../context/SocketContext"; // adjust path if needed

// ─── Individual Toast ────────────────────────────────────────────────────────
function Toast({ alert, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(alert.id), 6000);
    return () => clearTimeout(timer);
  }, [alert.id, onDismiss]);

  const config = {
    critical: {
      bg: "bg-red-900 border-red-500",
      icon: "🚨",
      label: "AUTO-BLOCKED",
      bar: "bg-red-500",
    },
    high: {
      bg: "bg-orange-900 border-orange-500",
      icon: "⚠️",
      label: "HIGH RISK",
      bar: "bg-orange-500",
    },
    medium: {
      bg: "bg-yellow-900 border-yellow-500",
      icon: "🔍",
      label: "REVIEW",
      bar: "bg-yellow-400",
    },
    low: {
      bg: "bg-green-900 border-green-600",
      icon: "✅",
      label: "APPROVED",
      bar: "bg-green-500",
    },
  };

  const level = alert.riskLevel || "medium";
  const c = config[level] || config.medium;

  return (
    <div
      className={`relative flex items-start gap-3 border rounded-lg p-4 shadow-2xl text-white w-80 overflow-hidden animate-slide-in ${c.bg}`}
      style={{ animation: "slideIn 0.3s ease-out" }}
    >
      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 h-0.5 w-full bg-white/10">
        <div
          className={`h-full ${c.bar} animate-shrink`}
          style={{ animation: "shrink 6s linear forwards" }}
        />
      </div>

      <span className="text-2xl">{c.icon}</span>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-xs font-bold tracking-widest opacity-80">
            FRAUD ALERT · {c.label}
          </span>
          <button
            onClick={() => onDismiss(alert.id)}
            className="text-white/50 hover:text-white text-lg leading-none ml-2"
          >
            ×
          </button>
        </div>
        <p className="text-sm font-semibold truncate">
          Txn #{alert.transactionId?.slice(-8) || "Unknown"}
        </p>
        <div className="flex gap-3 mt-1 text-xs text-white/70">
          <span>Risk: {((alert.riskScore || 0) * 100).toFixed(0)}%</span>
          {alert.amount && <span>Amount: ${alert.amount?.toLocaleString()}</span>}
        </div>
        {alert.explanation?.topFeatures?.[0] && (
          <p className="text-xs text-white/60 mt-1 truncate">
            Top signal: {alert.explanation.topFeatures[0].feature}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Toast Container ──────────────────────────────────────────────────────────
export default function AlertToastContainer() {
  const [toasts, setToasts] = useState([]);
  const { socket } = useSocket();

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleAlert = (data) => {
      // Only show high/critical by default (you can remove this filter)
      if (!["critical", "high"].includes(data.riskLevel)) return;

      const toast = {
        ...data,
        id: `${Date.now()}-${Math.random()}`,
      };
      setToasts((prev) => [toast, ...prev].slice(0, 5)); // max 5 toasts
    };

    socket.on("fraud_alert", handleAlert);
    socket.on("transaction_flagged", handleAlert); // handle both event names

    return () => {
      socket.off("fraud_alert", handleAlert);
      socket.off("transaction_flagged", handleAlert);
    };
  }, [socket]);

  return (
    <>
      {/* Keyframe styles — injected once */}
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);   opacity: 1; }
        }
        @keyframes shrink {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>

      {/* Fixed overlay — top-right corner */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <Toast alert={t} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </>
  );
}
