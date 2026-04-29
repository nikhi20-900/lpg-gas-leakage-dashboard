import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  AlarmClockCheck,
  Bell,
  CheckCircle2,
  ChevronRight,
  CircuitBoard,
  Cloud,
  Gauge,
  Home,
  Info,
  LockKeyhole,
  Radio,
  ShieldCheck,
  Siren,
  Thermometer,
  TriangleAlert,
  Wrench,
  XCircle,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useLpgRealtime } from "./hooks/useLpgRealtime";

const THRESHOLD = 400;
const MAX_VALUE = 1023;

function getZone(value) {
  if (!Number.isFinite(value)) {
    return {
      label: "Waiting",
      color: "text-muted",
      bg: "bg-slate-100",
      border: "border-slate-200",
      accent: "#1677c8",
      helper: "Live data will appear as soon as Firebase sends /LPG.",
    };
  }

  if (value > THRESHOLD) {
    return {
      label: "Danger",
      color: "text-danger",
      bg: "bg-red-50",
      border: "border-red-200",
      accent: "#d92d20",
      helper: "Gas is above the shutdown threshold.",
    };
  }

  if (value > 300) {
    return {
      label: "Caution",
      color: "text-caution",
      bg: "bg-amber-50",
      border: "border-amber-200",
      accent: "#c27803",
      helper: "Gas is near the danger threshold.",
    };
  }

  return {
    label: "Safe",
    color: "text-safe",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    accent: "#0c9f62",
    helper: "Gas level is within the safe range.",
  };
}

function useRoute() {
  const [route, setRoute] = useState(() => window.location.hash.replace("#", "") || "/");

  useEffect(() => {
    const onHashChange = () => setRoute(window.location.hash.replace("#", "") || "/");
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const navigate = (nextRoute) => {
    window.location.hash = nextRoute;
  };

  return [route, navigate];
}

function App() {
  const lpg = useLpgRealtime();
  const [route, navigate] = useRoute();
  const activePage = route === "/overview" ? "overview" : "dashboard";

  return (
    <div className="soft-grid min-h-screen">
      <Shell activePage={activePage} navigate={navigate} lpg={lpg}>
        {activePage === "overview" ? <OverviewPage /> : <DashboardPage lpg={lpg} />}
      </Shell>
    </div>
  );
}

function Shell({ activePage, navigate, lpg, children }) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
      <header className="sticky top-3 z-20 rounded-2xl border border-white/80 bg-white/90 p-3 shadow-soft backdrop-blur">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex min-w-0 items-center gap-3 text-left"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-skyline text-white shadow-sm">
              <ShieldCheck size={23} />
            </span>
            <span className="min-w-0">
              <span className="block truncate font-display text-lg font-bold text-ink">
                LPG Safety Monitor
              </span>
              <span className="block text-sm text-muted">MQ-2 + ESP8266 automatic shutoff system</span>
            </span>
          </button>

          <nav className="flex flex-wrap items-center gap-2">
            <NavButton active={activePage === "dashboard"} icon={Home} onClick={() => navigate("/")}>
              Dashboard
            </NavButton>
            <NavButton active={activePage === "overview"} icon={Info} onClick={() => navigate("/overview")}>
              Project Overview
            </NavButton>
            <ConnectionPill connected={lpg.connected} permissionError={lpg.permissionError} />
          </nav>
        </div>
      </header>

      <main className="flex-1 py-6">{children}</main>
    </div>
  );
}

function NavButton({ active, icon: Icon, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-10 items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition ${
        active
          ? "bg-ink text-white shadow-sm"
          : "border border-slate-200 bg-white text-ink hover:border-slate-300 hover:bg-slate-50"
      }`}
    >
      <Icon size={17} />
      {children}
    </button>
  );
}

function ConnectionPill({ connected, permissionError }) {
  const state = permissionError ? "error" : connected ? "connected" : "offline";
  const label = permissionError ? "Firebase blocked" : connected ? "Firebase connected" : "Connecting";
  const Icon = permissionError ? XCircle : connected ? Cloud : Radio;
  const styles =
    state === "error"
      ? "border-red-200 bg-red-50 text-danger"
      : state === "connected"
        ? "border-emerald-200 bg-emerald-50 text-safe"
        : "border-amber-200 bg-amber-50 text-caution";

  return (
    <span className={`inline-flex min-h-10 items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold ${styles}`}>
      <Icon size={17} />
      {label}
    </span>
  );
}

function DashboardPage({ lpg }) {
  const value = lpg.reading?.value;
  const zone = getZone(value);
  const isAlert = Boolean(lpg.reading?.isAlert);
  const system = lpg.reading?.system || "Waiting for Firebase";
  const status = lpg.reading?.status || "Waiting for Firebase";
  const lastUpdated = lpg.reading?.timestamp
    ? lpg.reading.timestamp.toLocaleString([], {
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "Not received yet";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      className="space-y-5"
    >
      <HeroStatus reading={lpg.reading} waitingMessage={lpg.waitingMessage} permissionError={lpg.permissionError} />

      <section className="grid min-w-0 gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <Card className="p-5 sm:p-6">
          <SectionTitle icon={Gauge} title="Live gas level" detail="From Firebase /LPG/GasValue" />
          <div className="mt-6 grid gap-6 md:grid-cols-[minmax(230px,330px)_1fr] md:items-center">
            <GasGauge value={value} zone={zone} />
            <div className="space-y-4">
              <div>
                <p className={`font-display text-5xl font-bold ${zone.color}`}>{Number.isFinite(value) ? value : "--"}</p>
                <p className="mt-1 text-sm font-medium text-muted">Current sensor reading in ppm scale</p>
              </div>
              <div className={`rounded-2xl border p-4 ${zone.bg} ${zone.border}`}>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-bold text-ink">Safety zone</span>
                  <span className={`rounded-full bg-white px-3 py-1 text-sm font-bold ${zone.color}`}>{zone.label}</span>
                </div>
                <p className="mt-2 text-sm text-muted">{zone.helper}</p>
              </div>
              <ThresholdBar value={value} />
            </div>
          </div>
        </Card>

        <div className="grid gap-5">
          <StatusCard status={status} isAlert={isAlert} />
          <SystemCard system={system} isAlert={isAlert} lastUpdated={lastUpdated} />
        </div>
      </section>

      <section className="grid min-w-0 gap-5 xl:grid-cols-[1.4fr_0.8fr]">
        <Card className="p-5 sm:p-6">
          <SectionTitle icon={Activity} title="Gas history" detail="Last 30 Firebase updates" />
          <GasChart history={lpg.history} />
        </Card>
        <Card className="p-5 sm:p-6">
          <SectionTitle icon={AlarmClockCheck} title="Status log" detail="Last 10 changes" />
          <StatusLog events={lpg.events} />
        </Card>
      </section>
    </motion.div>
  );
}

function HeroStatus({ reading, waitingMessage, permissionError }) {
  const isAlert = Boolean(reading?.isAlert);
  const isSafe = reading && !isAlert;
  const Icon = permissionError ? LockKeyhole : isAlert ? Siren : isSafe ? CheckCircle2 : Radio;
  const title = permissionError
    ? "Firebase read permission is blocked"
    : isAlert
      ? "Gas leak detected"
      : isSafe
        ? "System is safe"
        : "Waiting for live sensor data";
  const body = permissionError
    ? "The dashboard is using the API key and listening to /LPG, but Realtime Database rules are denying reads."
    : isAlert
      ? "The reading crossed 400 ppm or Firebase reported Gas Leak Detected. Check the valve and ventilate the area."
      : isSafe
        ? "The latest Firebase reading is below the danger threshold and the system is reporting normal operation."
        : waitingMessage;
  const styles = permissionError || isAlert
    ? "border-red-200 bg-red-50"
    : isSafe
      ? "border-emerald-200 bg-emerald-50"
      : "border-sky-200 bg-sky-50";

  return (
    <Card className={`p-5 sm:p-6 ${styles} ${isAlert ? "alert-pulse" : ""}`}>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white ${isAlert || permissionError ? "text-danger" : isSafe ? "text-safe" : "text-skyline"}`}>
            <Icon size={24} />
          </span>
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-muted">Live safety state</p>
            <h1 className="mt-1 font-display text-2xl font-bold text-ink sm:text-3xl">{title}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">{body}</p>
          </div>
        </div>
        <div className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-ink shadow-sm">
          Threshold: <span className="text-danger">400 ppm</span>
        </div>
      </div>
    </Card>
  );
}

function GasGauge({ value, zone }) {
  const radius = 76;
  const circumference = 2 * Math.PI * radius;
  const progress = Number.isFinite(value) ? Math.max(0, Math.min(value / MAX_VALUE, 1)) : 0;
  const dashOffset = circumference * (1 - progress);
  const angle = -130 + progress * 260;

  return (
    <div className="mx-auto w-full max-w-[330px]">
      <svg viewBox="0 0 200 200" className="h-auto w-full" aria-label="Gas value gauge">
        <circle cx="100" cy="100" r={radius} fill="#f8fafc" stroke="#e5e7eb" strokeWidth="16" />
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="16"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * 0.08}
          strokeLinecap="round"
          transform="rotate(135 100 100)"
        />
        <circle
          className="gauge-arc"
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke={zone.accent}
          strokeWidth="16"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform="rotate(135 100 100)"
        />
        <line
          className="needle"
          x1="100"
          y1="100"
          x2="100"
          y2="42"
          stroke="#102033"
          strokeWidth="5"
          strokeLinecap="round"
          style={{ transform: `rotate(${angle}deg)` }}
        />
        <circle cx="100" cy="100" r="9" fill="#102033" />
        <text x="100" y="134" textAnchor="middle" className="fill-slate-500 text-[10px] font-bold">
          0 - 1023 ppm
        </text>
      </svg>
    </div>
  );
}

function ThresholdBar({ value }) {
  const percent = Number.isFinite(value) ? Math.max(0, Math.min((value / MAX_VALUE) * 100, 100)) : 0;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm font-bold">
        <span className="text-muted">Danger threshold</span>
        <span className="text-danger">400 ppm</span>
      </div>
      <div className="relative h-4 rounded-full bg-slate-100">
        <div className="h-4 rounded-full bg-gradient-to-r from-safe via-caution to-danger" style={{ width: `${percent}%` }} />
        <span className="absolute top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-danger" style={{ left: `${(THRESHOLD / MAX_VALUE) * 100}%` }} />
      </div>
    </div>
  );
}

function StatusCard({ status, isAlert }) {
  const Icon = isAlert ? TriangleAlert : CheckCircle2;

  return (
    <Card className={`p-5 ${isAlert ? "border-red-200 bg-red-50" : "border-emerald-200 bg-white"}`}>
      <SectionTitle icon={Icon} title="Status" detail="Firebase /LPG/Status" />
      <p className={`mt-5 font-display text-3xl font-bold ${isAlert ? "text-danger" : "text-safe"}`}>
        {isAlert ? "Gas Leak Detected" : status}
      </p>
      <p className="mt-2 text-sm leading-6 text-muted">
        {isAlert ? "Buzzer should be active and the shutoff sequence should run." : "Latest status exactly as received from Firebase."}
      </p>
    </Card>
  );
}

function SystemCard({ system, isAlert, lastUpdated }) {
  const valveClosed = system.toLowerCase().includes("closed");
  const valveOpen = system.toLowerCase().includes("open");

  return (
    <Card className="p-5">
      <SectionTitle icon={Wrench} title="Valve & buzzer" detail="Firebase /LPG/System" />
      <div className="mt-5 grid gap-3">
        <InfoRow label="Valve" value={valveClosed ? "Closed" : valveOpen ? "Open" : system} strong={valveClosed ? "text-danger" : "text-safe"} />
        <InfoRow label="Buzzer" value={isAlert ? "Active" : "Inactive"} strong={isAlert ? "text-danger" : "text-safe"} />
        <InfoRow label="Last update" value={lastUpdated} />
      </div>
    </Card>
  );
}

function GasChart({ history }) {
  const hasData = history.length > 0;
  const [chartRef, chartWidth] = useElementWidth();
  const data = useMemo(
    () =>
      history.map((item) => ({
        time: item.timeLabel,
        value: item.value,
      })),
    [history]
  );

  return (
    <div ref={chartRef} className="mt-5 h-[310px] min-w-0">
      {hasData ? (
        <AreaChart width={chartWidth} height={310} data={data} margin={{ top: 12, right: 12, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="gasFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1677c8" stopOpacity={0.24} />
              <stop offset="100%" stopColor="#1677c8" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#e6edf4" strokeDasharray="3 3" />
          <XAxis dataKey="time" tick={{ fontSize: 12, fill: "#667085" }} />
          <YAxis domain={[0, MAX_VALUE]} tick={{ fontSize: 12, fill: "#667085" }} />
          <Tooltip
            contentStyle={{ borderRadius: 14, border: "1px solid #e5e7eb", boxShadow: "0 16px 35px rgba(16,32,51,0.12)" }}
            formatter={(displayValue) => [`${displayValue} ppm`, "Gas level"]}
          />
          <ReferenceLine y={THRESHOLD} stroke="#d92d20" strokeDasharray="7 6" label={{ value: "400 ppm", fill: "#d92d20", fontSize: 12 }} />
          <Area type="monotone" dataKey="value" fill="url(#gasFill)" stroke="none" />
          <Line type="monotone" dataKey="value" stroke="#1677c8" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
        </AreaChart>
      ) : (
        <div className="grid h-full place-items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-center">
          <div className="max-w-sm px-5">
            <Radio className="mx-auto text-skyline" size={28} />
            <p className="mt-3 font-bold text-ink">Waiting for Firebase readings</p>
            <p className="mt-1 text-sm text-muted">The chart will fill only when /LPG sends real updates.</p>
          </div>
        </div>
      )}
    </div>
  );
}

function useElementWidth() {
  const ref = useRef(null);
  const [width, setWidth] = useState(640);

  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;

    const updateWidth = () => {
      setWidth(Math.max(300, Math.floor(element.getBoundingClientRect().width)));
    };

    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(element);
    window.addEventListener("resize", updateWidth);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateWidth);
    };
  }, []);

  return [ref, width];
}

function StatusLog({ events }) {
  if (!events.length) {
    return (
      <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center">
        <p className="font-bold text-ink">No status changes yet</p>
        <p className="mt-1 text-sm text-muted">Entries appear only after Firebase sends a real status.</p>
      </div>
    );
  }

  return (
    <div className="mt-5 space-y-3">
      {events.map((event) => (
        <div key={event.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className={`font-bold ${event.isAlert ? "text-danger" : "text-safe"}`}>{event.status}</p>
            <span className="text-xs font-bold text-muted">{event.timeLabel}</span>
          </div>
          <p className="mt-1 text-sm text-muted">
            {event.value} ppm · {event.system}
          </p>
        </div>
      ))}
    </div>
  );
}

function OverviewPage() {
  const components = [
    ["MQ-2 Gas Sensor", "Reads the LPG gas concentration as an analog value from 0 to 1023.", Thermometer],
    ["ESP8266 NodeMCU", "Connects to WiFi and writes GasValue, Status, and System to Firebase.", CircuitBoard],
    ["Active Buzzer", "Gives an immediate local warning when gas crosses the threshold.", Bell],
    ["MG996R Servo", "Turns the mechanical gas valve into the closed position during alert.", Wrench],
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      className="space-y-5"
    >
      <Card className="overflow-hidden">
        <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="p-6 sm:p-8">
            <p className="text-sm font-bold uppercase tracking-wide text-skyline">Project overview</p>
            <h1 className="mt-3 font-display text-3xl font-bold text-ink sm:text-5xl">
              LPG leakage detection with automatic valve shutoff
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted">
              This dashboard explains and monitors a real hardware prototype. The ESP8266 sends the latest gas reading and system state to Firebase, while the web app listens in realtime and presents the result in a simple control-room interface.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Badge>Threshold: 400 ppm</Badge>
              <Badge>Realtime Database</Badge>
              <Badge>Automatic servo shutoff</Badge>
            </div>
          </div>
          <div className="bg-ink p-6 text-white sm:p-8">
            <p className="font-display text-lg font-bold">Data contract</p>
            <pre className="mt-4 overflow-auto rounded-2xl bg-white/10 p-4 text-sm leading-6 text-slate-100">{`{
  "LPG": {
    "GasValue": 312,
    "Status": "Safe",
    "System": "Valve Open"
  }
}`}</pre>
            <p className="mt-4 text-sm leading-6 text-slate-300">
              The dashboard does not create sample readings. Every chart point and status label comes from this Firebase node.
            </p>
          </div>
        </div>
      </Card>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {components.map(([title, body, Icon]) => (
          <Card key={title} className="p-5">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-sky-50 text-skyline">
              <Icon size={22} />
            </span>
            <h2 className="mt-4 font-display text-lg font-bold text-ink">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
          </Card>
        ))}
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <Card className="p-6">
          <SectionTitle icon={Activity} title="How the system reacts" detail="Arduino logic" />
          <div className="mt-5 space-y-4">
            <Step number="01" title="Normal condition" body="GasValue is 400 or below. Firebase reports Safe and Valve Open." />
            <Step number="02" title="Leak detected" body="GasValue rises above 400. The buzzer turns on and the servo moves the valve shut." />
            <Step number="03" title="Dashboard update" body="Firebase pushes the new values. The website updates the status, gauge, chart, and history log." />
          </div>
        </Card>

        <Card className="p-6">
          <SectionTitle icon={Cloud} title="Deployment-ready stack" detail="React app" />
          <div className="mt-5 grid gap-3">
            <InfoRow label="Frontend" value="React.js with Vite" />
            <InfoRow label="Styling" value="Tailwind CSS" />
            <InfoRow label="Animations" value="Framer Motion, minimal page transitions" />
            <InfoRow label="Backend" value="Firebase Realtime Database" />
            <InfoRow label="Charts" value="Recharts" />
            <InfoRow label="Hosting" value="Vercel or Firebase Hosting" />
          </div>
        </Card>
      </section>
    </motion.div>
  );
}

function Step({ number, title, body }) {
  return (
    <div className="flex gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-sm font-bold text-skyline shadow-sm">
        {number}
      </span>
      <div>
        <h3 className="font-bold text-ink">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-muted">{body}</p>
      </div>
    </div>
  );
}

function Badge({ children }) {
  return <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-ink shadow-sm">{children}</span>;
}

function SectionTitle({ icon: Icon, title, detail }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sky-50 text-skyline">
          <Icon size={20} />
        </span>
        <div>
          <h2 className="font-display text-lg font-bold text-ink">{title}</h2>
          <p className="text-sm text-muted">{detail}</p>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, strong = "text-ink" }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <span className="text-sm font-bold text-muted">{label}</span>
      <span className={`text-right text-sm font-bold ${strong}`}>{value}</span>
    </div>
  );
}

function Card({ children, className = "" }) {
  return <section className={`min-w-0 rounded-3xl border border-white/90 bg-white shadow-soft ${className}`}>{children}</section>;
}

export default App;
