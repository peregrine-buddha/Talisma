// Reusable UI primitives following the High-Fidelity SaaS design system.
// Ghost borders, flat elevation, Inter, pill taxonomy, circular rings.

export function OutlinePill({ children, className = "" }) {
  return (
    <span
      className={`bg-white border border-gray-200 rounded-full px-3 py-1 text-xs font-medium text-gray-700 inline-flex items-center gap-1.5 ${className}`}
    >
      {children}
    </span>
  );
}

export function SoftActionPill({
  children,
  onClick,
  className = "",
  type = "button",
  disabled,
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`bg-blue-50 text-blue-600 rounded-full px-3 py-1.5 text-sm font-medium inline-flex items-center gap-1.5 transition-colors duration-150 hover:bg-blue-100 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${className}`}
    >
      {children}
    </button>
  );
}

const STATUS_DOT = {
  green: "bg-green-500",
  orange: "bg-orange-500",
  blue: "bg-blue-500",
  gray: "bg-gray-400",
  red: "bg-red-500",
};

export function StatusPill({ children, dot = "gray", className = "" }) {
  return (
    <span
      className={`bg-white border border-gray-200 rounded-full px-3 py-1 text-xs font-medium text-gray-700 inline-flex items-center gap-1.5 ${className}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[dot] || STATUS_DOT.gray}`}
      />
      {children}
    </span>
  );
}

export function PrimaryButton({
  children,
  onClick,
  type = "button",
  disabled,
  className = "",
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors duration-150 hover:bg-blue-700 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${className}`}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  onClick,
  type = "button",
  disabled,
  className = "",
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`bg-white text-gray-700 border border-gray-200 rounded-lg px-4 py-2 text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors duration-150 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${className}`}
    >
      {children}
    </button>
  );
}

export function Card({ children, className = "", onClick }) {
  const interactive = onClick
    ? "cursor-pointer hover:border-gray-300 transition-colors duration-150"
    : "";
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-gray-200 ${interactive} ${className}`}
    >
      {children}
    </div>
  );
}

export function StatCard({ label, value, sub }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className="text-2xl font-semibold text-gray-900 tracking-tight mt-2">
        {value}
      </p>
      {sub ? (
        <p className="text-xs font-normal text-gray-500 mt-1">{sub}</p>
      ) : null}
    </div>
  );
}

export function CircularRing({
  value = 0,
  size = 64,
  stroke = 3,
  color = "#EA580C",
  label,
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value));
  const offset = circumference - (clamped / 100) * circumference;
  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#F3F4F6"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-xs font-semibold text-gray-900">
        {label != null ? label : `${Math.round(clamped)}%`}
      </span>
    </div>
  );
}

export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex items-center gap-6 border-b border-gray-200 w-full">
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        const cls = isActive
          ? "text-gray-900 font-medium border-b-2 border-blue-600 pb-3 -mb-[1px]"
          : "text-gray-500 font-normal border-b-2 border-transparent hover:text-gray-700 pb-3";
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={`text-sm transition-colors duration-150 ${cls}`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export function HyphenList({ items }) {
  return (
    <div>
      {items.map((item, idx) => (
        <p key={idx} className="text-sm text-gray-600 py-1">
          <span className="text-gray-400 mr-2">-</span>
          {item}
        </p>
      ))}
    </div>
  );
}

export function Spinner({ className = "" }) {
  return (
    <div
      className={`inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${className}`}
    />
  );
}

export function EmptyState({ title, description, action }) {
  return (
    <div className="bg-white rounded-xl border border-dashed border-gray-300 p-10 text-center">
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      {description ? (
        <p className="text-sm font-normal text-gray-500 mt-1 max-w-md mx-auto">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function scoreColor(score) {
  if (score >= 80) return "#16A34A";
  if (score >= 55) return "#EA580C";
  return "#9CA3AF";
}

export function scoreDot(label) {
  if (label === "Strong") return "green";
  if (label === "Medium") return "orange";
  return "gray";
}

export const STAGE_META = {
  sourced: { label: "Sourced", dot: "gray" },
  screened: { label: "Screened", dot: "blue" },
  interviewing: { label: "Interviewing", dot: "orange" },
  offer: { label: "Offer", dot: "green" },
  hired: { label: "Hired", dot: "green" },
  rejected: { label: "Rejected", dot: "red" },
};
