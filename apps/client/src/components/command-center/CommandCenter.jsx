import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ComposedChart, ReferenceLine, ScatterChart, Scatter, Treemap
} from "recharts";

// ═══════════════════════════════════════════════════════════════════════════
// DIVINE LUMINANCE v5.3 — Extended Design Tokens (Unified)
// ═══════════════════════════════════════════════════════════════════════════
const DL = {
  void: "#05080d", deep: "#080c18", obsidian: "#0d1220", surface: "#121828",
  elevated: "#171e34", hover: "#1c2440", active: "#212b4c",
  glass: "rgba(255,255,255,0.02)", glassBorder: "rgba(255,255,255,0.055)",
  glassHover: "rgba(255,255,255,0.045)",
  gold: { 50:"#fefce8",100:"#fef3c7",200:"#fde68a",300:"#fcd34d",400:"#d4a853",500:"#b8860b",600:"#92400e" },
  fate: {
    focus: "#ef4444", authority: "#06b6d4", tribe: "#10b981", emotion: "#d4a853",
    predict: "#a78bfa", quality: "#f472b6", pipeline: "#38bdf8", insight: "#fbbf24",
    maturity: "#14b8a6", signal: "#f97316", decay: "#ec4899", graph: "#8b5cf6",
    exclusivity: "#06b6d4", regulatory: "#22d3ee", composite: "#e879f9",
  },
  text: { primary:"#f1f5f9", secondary:"#94a3b8", muted:"#64748b", accent:"#d4a853", dim:"#475569" },
  gradient: {
    gold: "linear-gradient(135deg, #d4a853 0%, #fcd34d 50%, #b8860b 100%)",
    cyber: "linear-gradient(135deg, #06b6d4 0%, #a78bfa 100%)",
    aurora: "linear-gradient(135deg, #10b981 0%, #06b6d4 50%, #a78bfa 100%)",
    fire: "linear-gradient(135deg, #ef4444 0%, #f59e0b 100%)",
    rose: "linear-gradient(135deg, #f472b6 0%, #a78bfa 100%)",
    maturity: "linear-gradient(135deg, #0d9488 0%, #14b8a6 50%, #5eead4 100%)",
    signal: "linear-gradient(135deg, #ea580c 0%, #f97316 50%, #fdba74 100%)",
    graph: "linear-gradient(135deg, #7c3aed 0%, #8b5cf6 50%, #c4b5fd 100%)",
    exclusive: "linear-gradient(135deg, #0891b2 0%, #06b6d4 50%, #67e8f9 100%)",
    composite: "linear-gradient(135deg, #c026d3 0%, #e879f9 50%, #f0abfc 100%)",
  },
};

const SEVERITY = { CRITICAL:"#ef4444", HIGH:"#f97316", MEDIUM:"#d4a853", LOW:"#10b981", INFO:"#06b6d4" };
const CATEGORY_COLORS = { operational:"#64748b", behavioral:"#8b5cf6", market:"#06b6d4", predictive:"#f59e0b", financial:"#10b981", geographic:"#ec4899" };
const MATURITY_COLORS = { raw:"#64748b", cleaned:"#f97316", enriched:"#a78bfa", actionable:"#10b981" };
const TIER_COLORS = { commodity:"#64748b", differentiated:"#06b6d4", proprietary:"#d4a853", synthetic:"#e879f9" };

// ═══════════════════════════════════════════════════════════════════════════
// SHARED UI COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════
const GlassCard = ({ children, style, hover, onClick, glow }) => {
  const [h, setH] = useState(false);
  return (
    <div onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)} onClick={onClick}
      style={{
        background: h && hover ? DL.elevated : DL.surface,
        border: `1px solid ${DL.glassBorder}`, borderRadius: 14, padding: 20, overflow:"hidden",
        transition: "all 0.3s cubic-bezier(.4,0,.2,1)",
        boxShadow: h && glow ? `0 0 30px ${glow}12, inset 0 1px 0 rgba(255,255,255,0.04)` : "inset 0 1px 0 rgba(255,255,255,0.03)",
        cursor: onClick ? "pointer" : "default", ...style,
      }}>{children}</div>
  );
};

const Pill = ({ children, bg, color, border, style }) => (
  <span style={{
    display:"inline-flex", alignItems:"center", padding:"3px 10px", borderRadius: 20,
    fontSize: 10, fontWeight: 600, fontFamily:"'JetBrains Mono',monospace",
    background: bg || "rgba(212,168,83,0.1)", color: color || DL.fate.emotion,
    border: `1px solid ${border || "rgba(212,168,83,0.2)"}`, letterSpacing: 0.5, ...style,
  }}>{children}</span>
);

const ScoreRing = ({ score, size=56, color, label, thickness=4 }) => {
  const c = color || (score >= 80 ? DL.fate.tribe : score >= 60 ? DL.fate.emotion : DL.fate.focus);
  const r = (size - thickness*2)/2, circ = 2*Math.PI*r;
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
      <svg width={size} height={size} style={{ transform:"rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(148,163,184,0.08)" strokeWidth={thickness} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={c} strokeWidth={thickness}
          strokeDasharray={circ} strokeDashoffset={circ*(1-score/100)} strokeLinecap="round"
          style={{ transition:"stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)" }} />
      </svg>
      <span style={{ position:"relative", marginTop:-(size/2+8), fontFamily:"'JetBrains Mono',monospace",
        fontSize: size>50?14:11, fontWeight:700, color:c }}>{score}%</span>
      {label && <span style={{ marginTop: size>50?14:10, fontSize:8, color:DL.text.muted,
        fontFamily:"'JetBrains Mono',monospace", letterSpacing:1.2, textTransform:"uppercase" }}>{label}</span>}
    </div>
  );
};

const SectionTitle = ({ icon, title, subtitle }) => (
  <div style={{ marginBottom:16 }}>
    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
      <span style={{ fontSize:16 }}>{icon}</span>
      <h3 style={{ fontFamily:"'DM Sans',sans-serif", fontSize:16, fontWeight:700, color:DL.text.primary, margin:0 }}>{title}</h3>
    </div>
    {subtitle && <p style={{ fontSize:11, color:DL.text.muted, margin:"4px 0 0 24px" }}>{subtitle}</p>}
  </div>
);

const TabButton = ({ children, active, onClick, count, color }) => (
  <button onClick={onClick} style={{
    background: active ? (color||DL.fate.emotion)+"12" : "transparent",
    border: `1px solid ${active ? (color||DL.fate.emotion)+"30" : "transparent"}`,
    color: active ? (color||DL.fate.emotion) : DL.text.muted,
    padding:"7px 14px", borderRadius:10, fontSize:11, fontWeight: active?700:500,
    fontFamily:"'DM Sans',sans-serif", cursor:"pointer", transition:"all 0.2s",
    display:"flex", alignItems:"center", gap:6,
  }}>
    {children}
    {count != null && <span style={{ background:(color||DL.fate.focus)+"20", color:color||DL.fate.focus,
      padding:"1px 6px", borderRadius:8, fontSize:9, fontWeight:700, fontFamily:"'JetBrains Mono',monospace" }}>{count}</span>}
  </button>
);

const MiniSparkline = ({ data, color=DL.fate.authority, width=80, height=24 }) => {
  if (!data?.length) return null;
  const min=Math.min(...data), max=Math.max(...data), range=max-min||1;
  const pts = data.map((v,i)=>`${(i/(data.length-1))*width},${height-((v-min)/range)*height}`).join(" ");
  return (
    <svg width={width} height={height} style={{ overflow:"visible" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <circle cx={width} cy={height-((data[data.length-1]-min)/range)*height} r={2.5} fill={color} />
    </svg>
  );
};

const ProgressBar = ({ value, max=100, color, height=6, showLabel, gradient }) => (
  <div style={{ display:"flex", alignItems:"center", gap:8, width:"100%" }}>
    <div style={{ flex:1, height, background:"rgba(148,163,184,0.06)", borderRadius:height, overflow:"hidden" }}>
      <div style={{ width:`${Math.min((value/max)*100,100)}%`, height:"100%",
        background: gradient||color||DL.fate.tribe, borderRadius:height,
        transition:"width 1s cubic-bezier(.4,0,.2,1)" }} />
    </div>
    {showLabel && <span style={{ fontSize:10, fontFamily:"'JetBrains Mono',monospace", color:color||DL.text.secondary, fontWeight:600, minWidth:32 }}>{Math.round(value)}%</span>}
  </div>
);

const StatusDot = ({ status }) => {
  const colors = { healthy:DL.fate.tribe, warning:DL.fate.emotion, error:DL.fate.focus, running:DL.fate.authority, idle:DL.text.muted };
  return <span style={{ width:8, height:8, borderRadius:"50%", background:colors[status]||DL.text.muted, display:"inline-block",
    boxShadow: status==="running" ? `0 0 8px ${colors.running}60` : "none" }} />;
};

// ═══════════════════════════════════════════════════════════════════════════
// MOCK DATA — 12 Data Assets
// ═══════════════════════════════════════════════════════════════════════════
const DATA_ASSETS = [
  { id:"DA-001", name:"Taux d'occupation", category:"operational", score:92, revenue:4200, pii:false, freshness:98, completeness:95, records:"2.4M", trend:[65,70,72,78,82,88,92] },
  { id:"DA-002", name:"Données tarifaires", category:"market", score:88, revenue:5800, pii:false, freshness:95, completeness:90, records:"1.8M", trend:[60,62,68,75,80,85,88] },
  { id:"DA-003", name:"Profils voyageurs", category:"behavioral", score:76, revenue:3400, pii:true, freshness:82, completeness:78, records:"890K", trend:[55,58,60,65,68,72,76] },
  { id:"DA-004", name:"Scores nettoyage", category:"operational", score:85, revenue:2900, pii:false, freshness:90, completeness:92, records:"3.1M", trend:[70,72,75,78,80,83,85] },
  { id:"DA-005", name:"Revenue par nuit", category:"financial", score:94, revenue:7200, pii:false, freshness:97, completeness:96, records:"1.2M", trend:[80,82,85,88,90,92,94] },
  { id:"DA-006", name:"Avis & sentiments", category:"behavioral", score:71, revenue:2100, pii:true, freshness:75, completeness:68, records:"540K", trend:[50,52,55,60,63,67,71] },
  { id:"DA-007", name:"Géolocalisation biens", category:"geographic", score:89, revenue:4600, pii:false, freshness:99, completeness:94, records:"45K", trend:[75,78,80,83,86,88,89] },
  { id:"DA-008", name:"Calendriers réservation", category:"predictive", score:91, revenue:6100, pii:false, freshness:96, completeness:93, records:"980K", trend:[72,75,80,83,87,89,91] },
  { id:"DA-009", name:"Consommation énergie", category:"operational", score:67, revenue:1800, pii:false, freshness:88, completeness:62, records:"280K", trend:[40,45,48,52,58,63,67] },
  { id:"DA-010", name:"Données concurrence", category:"market", score:73, revenue:3200, pii:false, freshness:70, completeness:65, records:"150K", trend:[45,50,55,58,63,68,73] },
  { id:"DA-011", name:"Patterns saisonniers", category:"predictive", score:86, revenue:5400, pii:false, freshness:85, completeness:88, records:"720K", trend:[65,68,72,75,79,83,86] },
  { id:"DA-012", name:"Coûts opérationnels", category:"financial", score:80, revenue:3800, pii:false, freshness:92, completeness:85, records:"410K", trend:[55,58,62,67,72,76,80] },
];

// ═══════════════════════════════════════════════════════════════════════════
// MOCK DATA — Architecture Violations
// ═══════════════════════════════════════════════════════════════════════════
const VIOLATIONS = [
  { id:"V-001", type:"Circular Dependency", severity:"HIGH", files:["multi-calendar.tsx","listings.tsx"], impact:"Bundle +34KB", autofix:true },
  { id:"V-002", type:"API Cascade", severity:"HIGH", files:["user-nav.tsx","auth-provider.tsx"], impact:"5 sequential calls", autofix:false },
  { id:"V-003", type:"Idempotence Violation", severity:"MEDIUM", files:["booking-sync.ts"], impact:"Duplicate entries risk", autofix:true },
  { id:"V-004", type:"N+1 Query", severity:"HIGH", files:["property-list.tsx","api/properties.ts"], impact:"Avg 340ms→45ms potential", autofix:true },
  { id:"V-005", type:"Unprotected Endpoint", severity:"CRITICAL", files:["api/export.ts"], impact:"Data leak risk", autofix:false },
  { id:"V-006", type:"PII in Logs", severity:"HIGH", files:["logger.ts","middleware/auth.ts"], impact:"RGPD non-compliance", autofix:true },
  { id:"V-007", type:"Memory Leak", severity:"MEDIUM", files:["realtime-socket.ts"], impact:"RAM +12MB/hr", autofix:false },
];

// ═══════════════════════════════════════════════════════════════════════════
// MOCK DATA — Predictive Analytics
// ═══════════════════════════════════════════════════════════════════════════
const FORECAST_DATA = [
  { month:"Sep 25", actual:38200 }, { month:"Oct 25", actual:41500 }, { month:"Nov 25", actual:35800 },
  { month:"Dec 25", actual:48900 }, { month:"Jan 26", actual:42100 },
  { month:"Fév 26", actual:44800, forecast:44200, lower:42000, upper:46500 },
  { month:"Mar 26", forecast:47300, lower:44100, upper:50500 },
  { month:"Avr 26", forecast:52100, lower:47800, upper:56400 },
  { month:"Mai 26", forecast:58700, lower:53200, upper:64200 },
  { month:"Jun 26", forecast:63400, lower:56800, upper:70000 },
  { month:"Jul 26", forecast:71200, lower:63500, upper:78900 },
  { month:"Aoû 26", forecast:68900, lower:61200, upper:76600 },
];

const SEASONALITY = [
  { day:"Lun", index:0.85 }, { day:"Mar", index:0.92 }, { day:"Mer", index:1.0 },
  { day:"Jeu", index:1.05 }, { day:"Ven", index:1.28 }, { day:"Sam", index:1.42 }, { day:"Dim", index:1.18 },
];

const ANOMALIES = [
  { date:"2026-01-15", metric:"Revenue/nuit", expected:142, actual:89, zscore:-3.2, severity:"HIGH", explanation:"Tempête neige → annulations massives" },
  { date:"2026-01-28", metric:"Taux occupation", expected:78, actual:96, zscore:2.8, severity:"MEDIUM", explanation:"Salon professionnel non anticipé" },
  { date:"2026-02-03", metric:"Coût nettoyage", expected:34, actual:58, zscore:3.5, severity:"HIGH", explanation:"Pic check-outs + intérimaires" },
  { date:"2026-02-07", metric:"Score avis", expected:4.6, actual:3.9, zscore:-2.4, severity:"MEDIUM", explanation:"Problème chauffage signalé x4" },
];

const CHURN_COHORTS = [
  { cohort:"Q1 2025", m1:100, m2:88, m3:82, m4:78, m5:75, m6:72, m7:70, m8:69, m9:68, risk:"low" },
  { cohort:"Q2 2025", m1:100, m2:85, m3:76, m4:71, m5:67, m6:64, m7:62, m8:60, m9:59, risk:"medium" },
  { cohort:"Q3 2025", m1:100, m2:82, m3:70, m4:63, m5:58, m6:54, m7:null, m8:null, m9:null, risk:"high" },
  { cohort:"Q4 2025", m1:100, m2:90, m3:84, m4:80, m5:null, m6:null, m7:null, m8:null, m9:null, risk:"low" },
];

// ═══════════════════════════════════════════════════════════════════════════
// MOCK DATA — Data Quality
// ═══════════════════════════════════════════════════════════════════════════
const QUALITY_DIMENSIONS = [
  { dimension:"Complétude", score:87, target:95, trend:[78,80,82,84,85,86,87], description:"Champs remplis vs attendus" },
  { dimension:"Exactitude", score:92, target:98, trend:[85,87,88,90,91,91,92], description:"Validations croisées réussies" },
  { dimension:"Fraîcheur", score:91, target:90, trend:[82,84,86,88,89,90,91], description:"Données < 24h en base" },
  { dimension:"Cohérence", score:78, target:90, trend:[68,70,72,74,75,77,78], description:"Pas de contradictions inter-tables" },
  { dimension:"Unicité", score:96, target:99, trend:[90,92,93,94,95,95,96], description:"Absence de doublons" },
  { dimension:"Validité", score:84, target:95, trend:[75,77,79,80,82,83,84], description:"Respect des schémas/formats" },
];

const QUALITY_RULES = [
  { id:"QR-001", rule:"Email format validation", table:"guests", status:"passing", lastRun:"2 min", failures:0, total:89420 },
  { id:"QR-002", rule:"Phone E.164 compliance", table:"guests", status:"warning", lastRun:"2 min", failures:342, total:89420 },
  { id:"QR-003", rule:"Price > 0 constraint", table:"bookings", status:"passing", lastRun:"5 min", failures:0, total:245100 },
  { id:"QR-004", rule:"Check-out > Check-in", table:"bookings", status:"passing", lastRun:"5 min", failures:3, total:245100 },
  { id:"QR-005", rule:"GPS bounds (France)", table:"properties", status:"failing", lastRun:"12 min", failures:7, total:1842 },
  { id:"QR-006", rule:"FK integrity: property→owner", table:"properties", status:"passing", lastRun:"12 min", failures:0, total:1842 },
  { id:"QR-007", rule:"Cleaning score [0-100]", table:"inspections", status:"warning", lastRun:"8 min", failures:12, total:31200 },
  { id:"QR-008", rule:"Currency ISO 4217", table:"transactions", status:"passing", lastRun:"3 min", failures:0, total:182400 },
  { id:"QR-009", rule:"IBAN checksum valid", table:"payouts", status:"failing", lastRun:"15 min", failures:23, total:4200 },
  { id:"QR-010", rule:"No future created_at", table:"*", status:"passing", lastRun:"1 min", failures:0, total:1245000 },
];

const DATA_DRIFT = [
  { field:"avg_night_price", baseline:128.5, current:142.3, drift:10.7, severity:"warning" },
  { field:"avg_stay_duration", baseline:3.2, current:3.1, drift:-3.1, severity:"ok" },
  { field:"guest_age_mean", baseline:34.8, current:36.2, drift:4.0, severity:"ok" },
  { field:"cleaning_duration_min", baseline:92, current:108, drift:17.4, severity:"alert" },
  { field:"booking_lead_days", baseline:21.5, current:14.8, drift:-31.2, severity:"alert" },
  { field:"cancellation_rate", baseline:0.08, current:0.12, drift:50.0, severity:"alert" },
];

// ═══════════════════════════════════════════════════════════════════════════
// MOCK DATA — ETL Pipelines
// ═══════════════════════════════════════════════════════════════════════════
const PIPELINES = [
  { id:"PL-001", name:"Airbnb Sync", source:"Airbnb API", dest:"bookings", schedule:"*/15 * * * *",
    status:"running", duration:"2m 34s", records:{ extracted:1240, transformed:1238, loaded:1238, rejected:2 },
    health:98, uptime:99.7, errors24h:3, history:[98,97,99,98,100,99,98] },
  { id:"PL-002", name:"Booking.com Import", source:"Booking API", dest:"bookings", schedule:"*/30 * * * *",
    status:"healthy", duration:"4m 12s", records:{ extracted:3420, transformed:3418, loaded:3418, rejected:2 },
    health:96, uptime:99.2, errors24h:5, history:[95,96,94,97,96,95,96] },
  { id:"PL-003", name:"Price Scraper", source:"AirDNA/Transparent", dest:"market_data", schedule:"0 */6 * * *",
    status:"warning", duration:"18m 45s", records:{ extracted:45200, transformed:44800, loaded:44800, rejected:400 },
    health:82, uptime:94.5, errors24h:12, history:[88,85,82,84,80,78,82] },
  { id:"PL-004", name:"Guest Reviews ETL", source:"Multi-platform", dest:"reviews", schedule:"0 2 * * *",
    status:"healthy", duration:"8m 21s", records:{ extracted:890, transformed:887, loaded:887, rejected:3 },
    health:94, uptime:99.8, errors24h:0, history:[92,93,94,95,94,93,94] },
  { id:"PL-005", name:"Energy Telemetry", source:"Shelly/Linky", dest:"energy_data", schedule:"*/5 * * * *",
    status:"error", duration:"0m 12s", records:{ extracted:0, transformed:0, loaded:0, rejected:0 },
    health:34, uptime:87.3, errors24h:28, history:[90,85,72,60,45,38,34] },
  { id:"PL-006", name:"Cleaning Reports", source:"CleanCheck App", dest:"inspections", schedule:"*/10 * * * *",
    status:"healthy", duration:"1m 08s", records:{ extracted:312, transformed:312, loaded:312, rejected:0 },
    health:100, uptime:99.9, errors24h:0, history:[100,100,99,100,100,100,100] },
];

// ═══════════════════════════════════════════════════════════════════════════
// MOCK DATA — AI Insights
// ═══════════════════════════════════════════════════════════════════════════
const AI_INSIGHTS = [
  { id:"INS-001", type:"revenue", priority:"high", confidence:89, title:"Opportunité pricing dynamique Février",
    insight:"Écart de +18% entre vos tarifs et le marché sur les week-ends. Ajuster pourrait générer +4.2K€/mois.",
    action:"Augmenter tarifs WE de 15-20%", impact:"+4,200€/mois", source:["DA-002","DA-005","DA-011"] },
  { id:"INS-002", type:"quality", priority:"critical", confidence:95, title:"Anomalie taux d'annulation",
    insight:"Taux d'annulation bondi de 8% à 12%, corrélé avec propriétés score nettoyage < 80.",
    action:"Audit prioritaire 8 propriétés < 80", impact:"Réduction annulations -25%", source:["DA-004","DA-006","DA-001"] },
  { id:"INS-003", type:"operational", priority:"medium", confidence:82, title:"Optimisation planning nettoyage",
    insight:"34% des check-outs entre 10h-11h le dimanche. Shift 9h-13h réduirait l'attente de 45 à 18 min.",
    action:"Restructurer shifts dimanche", impact:"-60% temps d'attente", source:["DA-004","DA-008","DA-012"] },
  { id:"INS-004", type:"predictive", priority:"high", confidence:91, title:"Prévision haute saison anticipée",
    insight:"Réservations Avril-Mai +28% vs 2025. Euro faible attire touristes US. Préparer capacité +30%.",
    action:"Recruter 4 agents supplémentaires", impact:"0 refus de réservation", source:["DA-008","DA-011","DA-001"] },
  { id:"INS-005", type:"compliance", priority:"medium", confidence:88, title:"Risque RGPD — données voyageurs",
    insight:"23 profils avec données de santé stockées en clair sans consentement granulaire spécifique.",
    action:"Implémenter consentement granulaire", impact:"Conformité RGPD Art.9", source:["DA-003"] },
];

const CORRELATION_MATRIX = [
  { x:"Occupation", y:"Revenue", r:0.94 }, { x:"Occupation", y:"Score nett.", r:0.72 },
  { x:"Occupation", y:"Avis", r:0.68 }, { x:"Revenue", y:"Score nett.", r:0.61 },
  { x:"Revenue", y:"Avis", r:0.78 }, { x:"Score nett.", y:"Avis", r:0.85 },
  { x:"Prix/nuit", y:"Occupation", r:-0.42 }, { x:"Prix/nuit", y:"Revenue", r:0.56 },
  { x:"Saisonnalité", y:"Occupation", r:0.88 }, { x:"Saisonnalité", y:"Prix/nuit", r:0.79 },
];

const COMPLIANCE_REGS = [
  { name:"RGPD", score:72, critical:3, articles:["Art.6","Art.9","Art.17","Art.25","Art.35"] },
  { name:"Data Act", score:65, critical:2, articles:["Art.3","Art.5","Art.14","Art.23"] },
  { name:"IA Act", score:58, critical:4, articles:["Art.6","Art.9","Art.13","Art.52"] },
  { name:"ALUR/ÉLAN", score:86, critical:0, articles:["Art.L324-1","Art.L631-7","Décret 2019-1104"] },
];

// ═══════════════════════════════════════════════════════════════════════════
// MOCK DATA — Classification Engine
// ═══════════════════════════════════════════════════════════════════════════
const MATURITY_ASSETS = [
  { id:"DA-001", name:"Taux d'occupation", stage:"actionable", stageNum:4, valueMultiplier:9.2, rawValue:0.5, currentValue:4.6,
    pipeline:[ { stage:"Raw", done:true, date:"2024-06", detail:"Scraping Airbnb/Booking brut" },
      { stage:"Cleaned", done:true, date:"2024-09", detail:"Dédup, normalisation, validation GPS" },
      { stage:"Enriched", done:true, date:"2025-01", detail:"+saisonnalité +événements +météo +concurrence" },
      { stage:"Actionable", done:true, date:"2025-06", detail:"Modèle prédictif J+30, alertes auto, pricing reco" }] },
  { id:"DA-002", name:"Données tarifaires", stage:"enriched", stageNum:3, valueMultiplier:6.8, rawValue:0.8, currentValue:5.4,
    pipeline:[ { stage:"Raw", done:true, date:"2024-06", detail:"Prix bruts multi-plateformes" },
      { stage:"Cleaned", done:true, date:"2024-08", detail:"Harmonisation devises, suppression outliers" },
      { stage:"Enriched", done:true, date:"2025-02", detail:"+benchmarks zone +élasticité prix +événements" },
      { stage:"Actionable", done:false, date:"Q2 2026", detail:"Dynamic pricing engine temps réel" }] },
  { id:"DA-003", name:"Profils voyageurs", stage:"cleaned", stageNum:2, valueMultiplier:3.1, rawValue:1.2, currentValue:3.7,
    pipeline:[ { stage:"Raw", done:true, date:"2024-07", detail:"Données réservation + préférences" },
      { stage:"Cleaned", done:true, date:"2025-01", detail:"Anonymisation RGPD, k-anonymat k=5" },
      { stage:"Enriched", done:false, date:"Q1 2026", detail:"+segments FATE +score lifetime value" },
      { stage:"Actionable", done:false, date:"Q3 2026", detail:"Recommandations personnalisées, churn prediction" }] },
  { id:"DA-004", name:"Scores nettoyage", stage:"enriched", stageNum:3, valueMultiplier:5.5, rawValue:0.6, currentValue:3.3,
    pipeline:[ { stage:"Raw", done:true, date:"2024-05", detail:"Photos + checklist CleanCheck" },
      { stage:"Cleaned", done:true, date:"2024-08", detail:"IA validation photos, scoring 0-100" },
      { stage:"Enriched", done:true, date:"2025-03", detail:"+corrélation avis +temps moyen +coût/m²" },
      { stage:"Actionable", done:false, date:"Q2 2026", detail:"Certification qualité auto, alertes prédictives" }] },
  { id:"DA-005", name:"Revenue par nuit", stage:"actionable", stageNum:4, valueMultiplier:11.4, rawValue:0.7, currentValue:8.0,
    pipeline:[ { stage:"Raw", done:true, date:"2024-06", detail:"Montants bruts par réservation" },
      { stage:"Cleaned", done:true, date:"2024-07", detail:"Normalisation TTC/HT, devise, commission" },
      { stage:"Enriched", done:true, date:"2024-11", detail:"+RevPAR +ADR +saisonnalité +segments" },
      { stage:"Actionable", done:true, date:"2025-04", detail:"Yield management, forecast revenue" }] },
  { id:"DA-006", name:"Avis & sentiments", stage:"raw", stageNum:1, valueMultiplier:1.0, rawValue:0.3, currentValue:0.3,
    pipeline:[ { stage:"Raw", done:true, date:"2024-08", detail:"Scraping multi-plateforme brut" },
      { stage:"Cleaned", done:false, date:"Q1 2026", detail:"NLP extraction, catégorisation, dédup" },
      { stage:"Enriched", done:false, date:"Q2 2026", detail:"+sentiment analysis +thèmes +corrélation" },
      { stage:"Actionable", done:false, date:"Q4 2026", detail:"Réponses auto, alertes réputation" }] },
  { id:"DA-007", name:"Géolocalisation biens", stage:"actionable", stageNum:4, valueMultiplier:8.7, rawValue:0.4, currentValue:3.5,
    pipeline:[ { stage:"Raw", done:true, date:"2024-05", detail:"Coordonnées GPS brutes" },
      { stage:"Cleaned", done:true, date:"2024-06", detail:"Validation bounds, reverse geocoding" },
      { stage:"Enriched", done:true, date:"2024-10", detail:"+POI proximity +transport +zones" },
      { stage:"Actionable", done:true, date:"2025-02", detail:"Score localisation, reco pricing par zone" }] },
  { id:"DA-008", name:"Calendriers réservation", stage:"enriched", stageNum:3, valueMultiplier:7.2, rawValue:0.9, currentValue:6.5,
    pipeline:[ { stage:"Raw", done:true, date:"2024-06", detail:"iCal sync multi-plateforme" },
      { stage:"Cleaned", done:true, date:"2024-08", detail:"Résolution conflits, normalisation" },
      { stage:"Enriched", done:true, date:"2025-01", detail:"+patterns booking window +lead time" },
      { stage:"Actionable", done:false, date:"Q1 2026", detail:"Prédiction dispo, optimisation gaps" }] },
];

const SIGNAL_BUNDLES = [
  { id:"SB-001", name:"Yield Maximizer Bundle", signalStrength:94,
    components:["DA-001","DA-002","DA-005","DA-008","DA-011"],
    inputs:["Occupation","Prix","Revenue/nuit","Calendriers","Saisonnalité"],
    output:"Recommandation tarifaire optimale J+1 à J+90",
    valueAlone:12400, valueBundled:68000, multiplier:5.5,
    buyers:["Propriétaires","Revenue Managers","Conciergeries"], accuracy:91, latency:"< 200ms" },
  { id:"SB-002", name:"Guest Experience Predictor", signalStrength:87,
    components:["DA-003","DA-004","DA-006","DA-007"],
    inputs:["Profils","Score nettoyage","Avis","Géolocalisation"],
    output:"Score satisfaction prédictif + actions préventives",
    valueAlone:8200, valueBundled:42000, multiplier:5.1,
    buyers:["Conciergeries","Hôtels","Plateformes"], accuracy:84, latency:"< 500ms" },
  { id:"SB-003", name:"Market Intelligence Engine", signalStrength:82,
    components:["DA-002","DA-010","DA-011","DA-007"],
    inputs:["Tarifs","Concurrence","Saisonnalité","Géoloc"],
    output:"Positionnement marché + opportunités par zone",
    valueAlone:9600, valueBundled:38000, multiplier:4.0,
    buyers:["Investisseurs","Fonds immobiliers","Promoteurs"], accuracy:79, latency:"< 1s" },
  { id:"SB-004", name:"Operational Excellence Score", signalStrength:78,
    components:["DA-004","DA-009","DA-012"],
    inputs:["Nettoyage","Énergie","Coûts opérationnels"],
    output:"Score efficience opérationnelle + optimisations",
    valueAlone:5800, valueBundled:21000, multiplier:3.6,
    buyers:["Entreprises ménage","Facility managers","Bailleurs"], accuracy:88, latency:"< 300ms" },
  { id:"SB-005", name:"Churn Prevention System", signalStrength:91,
    components:["DA-001","DA-003","DA-005","DA-006","DA-008"],
    inputs:["Occupation","Profils","Revenue","Avis","Calendriers"],
    output:"Probabilité churn propriétaire + interventions",
    valueAlone:10800, valueBundled:54000, multiplier:5.0,
    buyers:["Conciergeries","Property managers","Plateformes"], accuracy:86, latency:"< 400ms" },
];

const DECAY_PROFILES = [
  { asset:"Prix concurrent", halfLife:4, unit:"heures", category:"volatile", freshPrice:12.0, stalePrice:0.8, curve:[100,85,60,50,35,22,15,10,8,5] },
  { asset:"Taux occupation", halfLife:12, unit:"heures", category:"volatile", freshPrice:8.5, stalePrice:1.2, curve:[100,90,78,65,50,40,30,22,15,10] },
  { asset:"Score nettoyage", halfLife:3, unit:"jours", category:"moderate", freshPrice:5.0, stalePrice:1.5, curve:[100,95,88,78,65,55,45,35,28,20] },
  { asset:"Avis client", halfLife:14, unit:"jours", category:"moderate", freshPrice:3.5, stalePrice:0.8, curve:[100,96,92,85,78,70,62,55,48,40] },
  { asset:"Pattern saisonnier", halfLife:6, unit:"semaines", category:"stable", freshPrice:6.0, stalePrice:2.5, curve:[100,98,95,90,85,78,72,65,58,50] },
  { asset:"Profil voyageur", halfLife:3, unit:"mois", category:"stable", freshPrice:4.0, stalePrice:1.0, curve:[100,97,93,88,82,75,68,60,52,45] },
  { asset:"Géolocalisation", halfLife:12, unit:"mois", category:"durable", freshPrice:3.0, stalePrice:2.2, curve:[100,99,97,95,92,90,87,85,82,80] },
  { asset:"Données énergie", halfLife:24, unit:"heures", category:"volatile", freshPrice:4.5, stalePrice:0.5, curve:[100,88,72,55,42,30,20,14,9,5] },
];

const GRAPH_NODES = [
  { id:"property", label:"Propriété", connections:8, hubScore:95, records:"1,842", value:8.5, type:"entity" },
  { id:"booking", label:"Réservation", connections:7, hubScore:92, records:"245K", value:7.8, type:"entity" },
  { id:"guest", label:"Voyageur", connections:6, hubScore:88, records:"89K", value:6.2, type:"entity" },
  { id:"cleaning", label:"Nettoyage", connections:5, hubScore:78, records:"31K", value:4.8, type:"event" },
  { id:"review", label:"Avis", connections:4, hubScore:72, records:"54K", value:3.5, type:"feedback" },
  { id:"price", label:"Prix/Tarif", connections:6, hubScore:85, records:"1.8M", value:7.2, type:"metric" },
  { id:"calendar", label:"Calendrier", connections:5, hubScore:82, records:"980K", value:6.5, type:"temporal" },
  { id:"location", label:"Localisation", connections:4, hubScore:75, records:"1,842", value:4.2, type:"spatial" },
  { id:"energy", label:"Énergie", connections:3, hubScore:58, records:"280K", value:2.8, type:"telemetry" },
  { id:"agent", label:"Agent ménage", connections:4, hubScore:65, records:"420", value:3.2, type:"entity" },
];

const GRAPH_EDGES = [
  { from:"property", to:"booking", weight:0.95, label:"héberge" },
  { from:"booking", to:"guest", weight:0.92, label:"réservé par" },
  { from:"property", to:"cleaning", weight:0.88, label:"nettoyé via" },
  { from:"booking", to:"review", weight:0.75, label:"génère" },
  { from:"property", to:"price", weight:0.90, label:"tarifé à" },
  { from:"booking", to:"calendar", weight:0.85, label:"occupe" },
  { from:"property", to:"location", weight:1.0, label:"situé à" },
  { from:"property", to:"energy", weight:0.60, label:"consomme" },
  { from:"cleaning", to:"agent", weight:0.82, label:"réalisé par" },
  { from:"cleaning", to:"review", weight:0.72, label:"impacte" },
  { from:"guest", to:"review", weight:0.78, label:"rédige" },
  { from:"price", to:"calendar", weight:0.80, label:"varie selon" },
  { from:"location", to:"price", weight:0.70, label:"influence" },
  { from:"guest", to:"booking", weight:0.92, label:"effectue" },
];

const EXCLUSIVITY_ASSETS = [
  { name:"Taux occupation brut", tier:"commodity", tierNum:1, priceMultiplier:1.0, competitors:["AirDNA","Transparent","AllTheRooms"], moat:"Aucun", uniqueness:15 },
  { name:"Prix concurrence", tier:"commodity", tierNum:1, priceMultiplier:1.0, competitors:["AirDNA","PriceLabs","Beyond"], moat:"Aucun", uniqueness:20 },
  { name:"Occupation + événements locaux", tier:"differentiated", tierNum:2, priceMultiplier:2.8, competitors:["STR (partiel)"], moat:"Intégration événements", uniqueness:55 },
  { name:"Score nettoyage corrélé avis", tier:"proprietary", tierNum:3, priceMultiplier:8.5, competitors:[], moat:"Data terrain CleanCheck", uniqueness:92 },
  { name:"Patterns agents ménage", tier:"proprietary", tierNum:3, priceMultiplier:7.2, competitors:[], moat:"App terrain exclusive", uniqueness:96 },
  { name:"Profil FATE voyageur", tier:"proprietary", tierNum:3, priceMultiplier:9.0, competitors:[], moat:"Modèle comportemental propriétaire", uniqueness:98 },
  { name:"Prédiction churn propriétaire", tier:"synthetic", tierNum:4, priceMultiplier:14.0, competitors:[], moat:"8 signaux croisés + ML", uniqueness:99 },
  { name:"Yield optimization signal", tier:"synthetic", tierNum:4, priceMultiplier:18.0, competitors:["PriceLabs (basique)"], moat:"5 datasets fusionnés + ARIMA", uniqueness:94 },
  { name:"Index hospitalité VECTRYS", tier:"synthetic", tierNum:4, priceMultiplier:22.0, competitors:[], moat:"Indice composite propriétaire", uniqueness:100 },
];

const REGULATORY_ASSETS = [
  { regulation:"ALUR/ÉLAN", need:"Preuve conformité 120 jours", dataset:"Calendriers + déclarations", premium:35, demand:"haute", clients:["Mairies","Propriétaires","Conciergeries"], risk:"Amende 50K€" },
  { regulation:"RGPD Art.30", need:"Registre des traitements", dataset:"Cartographie data + PII mapping", premium:28, demand:"haute", clients:["DPO","Conciergeries","Hôtels"], risk:"Amende 4% CA" },
  { regulation:"Décret RSE 2024", need:"Bilan carbone activité", dataset:"Énergie + trajets + consommables", premium:42, demand:"croissante", clients:["ETI","Grands groupes hôteliers"], risk:"Non-publication rapport" },
  { regulation:"Anti-discrimination", need:"Preuve tarification équitable", dataset:"Prix + profils anonymisés + motifs refus", premium:38, demand:"émergente", clients:["Plateformes","Conciergeries"], risk:"Amende + réputation" },
  { regulation:"IA Act Art.52", need:"Transparence algorithmes pricing", dataset:"Logs décision + features + poids modèle", premium:45, demand:"émergente", clients:["Plateformes OTA","Revenue managers"], risk:"Retrait du marché" },
  { regulation:"Taxe séjour", need:"Reporting automatisé", dataset:"Nuitées + tarifs + communes", premium:22, demand:"haute", clients:["Communes","Propriétaires","Conciergeries"], risk:"Redressement fiscal" },
];

const COMPOSITE_INDICES = [
  { id:"VHI", name:"VECTRYS Hospitality Index", description:"Score global performance bien LCD",
    components:[ {name:"Occupation",weight:25,value:82},{name:"RevPAR",weight:20,value:88},{name:"Satisfaction",weight:20,value:76},{name:"Clean Score",weight:15,value:85},{name:"Localisation",weight:10,value:91},{name:"Énergie",weight:10,value:67} ],
    currentValue:82.4, trend:[74,76,78,79,80,81,82,82.4], benchmark:{marche:71,top10:89}, subscribers:142, priceMonth:299, revenueAnnual:509000 },
  { id:"VCI", name:"VECTRYS Clean Index", description:"Benchmark qualité nettoyage par zone",
    components:[ {name:"Score photo IA",weight:30,value:88},{name:"Temps/m²",weight:20,value:75},{name:"Satisfaction guest",weight:25,value:82},{name:"Taux re-clean",weight:15,value:91},{name:"Coût/prestation",weight:10,value:70} ],
    currentValue:83.1, trend:[78,79,80,81,81,82,83,83.1], benchmark:{marche:68,top10:92}, subscribers:87, priceMonth:199, revenueAnnual:207800 },
  { id:"VMI", name:"VECTRYS Market Pulse", description:"Dynamisme marché LCD par ville",
    components:[ {name:"Demande",weight:30,value:85},{name:"Offre",weight:20,value:72},{name:"Prix moyen",weight:20,value:78},{name:"Saisonnalité",weight:15,value:90},{name:"Événements",weight:15,value:68} ],
    currentValue:79.8, trend:[70,72,74,75,76,77,79,79.8], benchmark:{marche:65,top10:88}, subscribers:215, priceMonth:399, revenueAnnual:1029600 },
  { id:"VOI", name:"VECTRYS Operator Index", description:"Score efficience opérationnelle conciergeries",
    components:[ {name:"Marge nette",weight:25,value:72},{name:"Taux rotation",weight:20,value:85},{name:"Satisfaction",weight:20,value:80},{name:"Rétention team",weight:20,value:78},{name:"Tech adoption",weight:15,value:65} ],
    currentValue:76.5, trend:[68,70,71,72,73,75,76,76.5], benchmark:{marche:62,top10:86}, subscribers:64, priceMonth:249, revenueAnnual:191200 },
];

// ═══════════════════════════════════════════════════════════════════════════
// VIEW: DATA ASSETS
// ═══════════════════════════════════════════════════════════════════════════
const DataAssetsView = ({ assets, onSelect, selectedId }) => {
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("score");
  const cats = ["all", ...new Set(assets.map(a => a.category))];
  const filtered = useMemo(() => {
    let list = filter === "all" ? assets : assets.filter(a => a.category === filter);
    return list.sort((a, b) => b[sortBy] - a[sortBy]);
  }, [assets, filter, sortBy]);
  const totalRevenue = assets.reduce((s, a) => s + a.revenue, 0);
  const avgScore = Math.round(assets.reduce((s, a) => s + a.score, 0) / assets.length);

  return (
    <div>
      <div style={{ display:"flex", gap:12, marginBottom:20, flexWrap:"wrap", alignItems:"center" }}>
        <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
          {cats.map(c => (
            <button key={c} onClick={() => setFilter(c)} style={{
              padding:"5px 12px", borderRadius:8, fontSize:10, fontWeight:600, border:"none", cursor:"pointer",
              background: filter === c ? CATEGORY_COLORS[c] || DL.fate.emotion : "rgba(148,163,184,0.06)",
              color: filter === c ? "#fff" : DL.text.muted, fontFamily:"'JetBrains Mono',monospace",
              textTransform:"capitalize", transition:"all 0.2s",
            }}>{c === "all" ? "Tous" : c}</button>
          ))}
        </div>
        <div style={{ marginLeft:"auto", display:"flex", gap:4 }}>
          {[["score","Score"],["revenue","Revenue"],["freshness","Fraîcheur"]].map(([key,label]) => (
            <button key={key} onClick={() => setSortBy(key)} style={{
              padding:"4px 10px", borderRadius:6, fontSize:9, border:"none", cursor:"pointer",
              background: sortBy === key ? DL.fate.authority+"20" : "transparent",
              color: sortBy === key ? DL.fate.authority : DL.text.muted, fontFamily:"'JetBrains Mono',monospace", fontWeight:600,
            }}>{label}</button>
          ))}
        </div>
      </div>
      <div style={{ display:"flex", gap:12, marginBottom:20 }}>
        {[{l:"ASSETS",v:assets.length,c:DL.fate.authority},{l:"SCORE MOY.",v:avgScore,c:avgScore>=80?DL.fate.tribe:DL.fate.emotion},
          {l:"REVENUE POT.",v:`${(totalRevenue/1000).toFixed(1)}K€`,c:DL.fate.emotion},{l:"PII ASSETS",v:assets.filter(a=>a.pii).length,c:DL.fate.focus}
        ].map(k => (
          <GlassCard key={k.l} style={{ flex:1, padding:14, textAlign:"center" }}>
            <div style={{ fontSize:10, color:DL.text.muted, fontFamily:"'JetBrains Mono',monospace" }}>{k.l}</div>
            <div style={{ fontSize:24, fontWeight:800, color:k.c, fontFamily:"'JetBrains Mono',monospace" }}>{k.v}</div>
          </GlassCard>
        ))}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(280px, 1fr))", gap:12 }}>
        {filtered.map(asset => (
          <GlassCard key={asset.id} hover glow={CATEGORY_COLORS[asset.category]} onClick={() => onSelect(asset.id === selectedId ? null : asset.id)}
            style={{ borderLeft:`3px solid ${CATEGORY_COLORS[asset.category]}`, padding:16,
              outline: selectedId === asset.id ? `1px solid ${CATEGORY_COLORS[asset.category]}50` : "none" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
              <div>
                <div style={{ fontSize:9, color:DL.text.muted, fontFamily:"'JetBrains Mono',monospace", marginBottom:2 }}>{asset.id}</div>
                <div style={{ fontSize:14, fontWeight:700, color:DL.text.primary }}>{asset.name}</div>
              </div>
              <ScoreRing score={asset.score} size={42} thickness={3} />
            </div>
            <div style={{ display:"flex", gap:6, marginBottom:10, flexWrap:"wrap" }}>
              <Pill bg={CATEGORY_COLORS[asset.category]+"15"} color={CATEGORY_COLORS[asset.category]} border={CATEGORY_COLORS[asset.category]+"30"}>{asset.category}</Pill>
              {asset.pii && <Pill bg={DL.fate.focus+"15"} color={DL.fate.focus} border={DL.fate.focus+"30"}>PII</Pill>}
              <Pill>{asset.records} records</Pill>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <div style={{ fontSize:9, color:DL.text.muted, fontFamily:"'JetBrains Mono',monospace" }}>REVENUE</div>
                <div style={{ fontSize:16, fontWeight:700, color:DL.fate.emotion, fontFamily:"'JetBrains Mono',monospace" }}>{asset.revenue.toLocaleString()}€</div>
              </div>
              <MiniSparkline data={asset.trend} color={CATEGORY_COLORS[asset.category]} />
            </div>
            <div style={{ marginTop:10, display:"flex", gap:12 }}>
              <div style={{ flex:1 }}><div style={{ fontSize:8, color:DL.text.muted, marginBottom:3 }}>Fraîcheur</div><ProgressBar value={asset.freshness} color={DL.fate.authority} height={4} /></div>
              <div style={{ flex:1 }}><div style={{ fontSize:8, color:DL.text.muted, marginBottom:3 }}>Complétude</div><ProgressBar value={asset.completeness} color={DL.fate.tribe} height={4} /></div>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// VIEW: ARCHITECTURE
// ═══════════════════════════════════════════════════════════════════════════
const ArchitectureView = () => {
  const [subTab, setSubTab] = useState("violations");
  return (
    <div>
      <div style={{ display:"flex", gap:6, marginBottom:16 }}>
        {[["violations","Violations",VIOLATIONS.length],["monitoring","Monitoring",null],["refactoring","Suggestions",4]].map(([k,l,c]) => (
          <TabButton key={k} active={subTab===k} onClick={()=>setSubTab(k)} count={c} color={DL.fate.focus}>{l}</TabButton>
        ))}
      </div>
      {subTab === "violations" && (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {VIOLATIONS.map(v => (
            <GlassCard key={v.id} style={{ padding:14, borderLeft:`3px solid ${SEVERITY[v.severity]}` }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <Pill bg={SEVERITY[v.severity]+"15"} color={SEVERITY[v.severity]} border={SEVERITY[v.severity]+"30"}>{v.severity}</Pill>
                  <span style={{ fontSize:13, fontWeight:600, color:DL.text.primary }}>{v.type}</span>
                </div>
                <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                  {v.autofix && <Pill bg={DL.fate.tribe+"15"} color={DL.fate.tribe} border={DL.fate.tribe+"30"}>⚡ Autofix</Pill>}
                  <span style={{ fontSize:10, color:DL.text.muted, fontFamily:"'JetBrains Mono',monospace" }}>{v.id}</span>
                </div>
              </div>
              <div style={{ marginTop:8, display:"flex", gap:16 }}>
                <div><span style={{ fontSize:9, color:DL.text.muted }}>FILES</span>
                  <div style={{ display:"flex", gap:4, marginTop:2 }}>
                    {v.files.map(f => <span key={f} style={{ fontSize:10, color:DL.fate.authority, fontFamily:"'JetBrains Mono',monospace", background:DL.fate.authority+"10", padding:"2px 6px", borderRadius:4 }}>{f}</span>)}
                  </div>
                </div>
                <div><span style={{ fontSize:9, color:DL.text.muted }}>IMPACT</span>
                  <div style={{ fontSize:11, color:DL.text.secondary, marginTop:2 }}>{v.impact}</div></div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
      {subTab === "monitoring" && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:12 }}>
          {[{label:"API Latency",value:"45ms",trend:[52,48,45,47,44,45,45],status:"healthy",target:"<100ms"},
            {label:"Error Rate",value:"0.3%",trend:[0.5,0.4,0.35,0.3,0.32,0.31,0.3],status:"healthy",target:"<1%"},
            {label:"DB Connections",value:"24/50",trend:[18,20,22,23,24,24,24],status:"warning",target:"<40"},
            {label:"Memory Usage",value:"2.1GB",trend:[1.8,1.9,1.95,2.0,2.05,2.08,2.1],status:"warning",target:"<3GB"},
          ].map(m => (
            <GlassCard key={m.label} style={{ padding:16 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                <span style={{ fontSize:11, color:DL.text.muted, fontFamily:"'JetBrains Mono',monospace" }}>{m.label}</span>
                <StatusDot status={m.status} />
              </div>
              <div style={{ fontSize:22, fontWeight:800, color:DL.text.primary, fontFamily:"'JetBrains Mono',monospace" }}>{m.value}</div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:8 }}>
                <MiniSparkline data={m.trend} color={m.status==="healthy"?DL.fate.tribe:DL.fate.emotion} />
                <span style={{ fontSize:9, color:DL.text.muted }}>Target: {m.target}</span>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
      {subTab === "refactoring" && (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {[{title:"Extract Booking Service",impact:"HIGH",effort:"3 days",benefit:"Eliminate circular deps, -34KB bundle"},
            {title:"Implement API Gateway Cache",impact:"HIGH",effort:"2 days",benefit:"Reduce cascade calls by 80%"},
            {title:"Add DB Query Batching",impact:"MEDIUM",effort:"1 day",benefit:"N+1 → batch, 340ms→45ms"},
            {title:"PII Scrubber Middleware",impact:"HIGH",effort:"2 days",benefit:"Auto-redact PII from logs, RGPD compliance"},
          ].map((s,i) => (
            <GlassCard key={i} style={{ padding:14 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:13, fontWeight:600, color:DL.text.primary }}>{s.title}</span>
                <div style={{ display:"flex", gap:6 }}>
                  <Pill bg={SEVERITY[s.impact]+"15"} color={SEVERITY[s.impact]}>{s.impact}</Pill>
                  <Pill>{s.effort}</Pill>
                </div>
              </div>
              <p style={{ fontSize:11, color:DL.text.secondary, margin:"8px 0 0" }}>{s.benefit}</p>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// VIEW: PREDICTIVE ANALYTICS
// ═══════════════════════════════════════════════════════════════════════════
const PredictiveView = () => {
  const [subTab, setSubTab] = useState("forecast");
  return (
    <div>
      <div style={{ display:"flex", gap:6, marginBottom:16 }}>
        {[["forecast","📈 Prévisions"],["anomalies","⚠️ Anomalies"],["seasonality","🔄 Saisonnalité"],["cohorts","👥 Cohortes"]].map(([k,l]) => (
          <TabButton key={k} active={subTab===k} onClick={()=>setSubTab(k)} color={DL.fate.predict}>{l}</TabButton>
        ))}
      </div>
      {subTab === "forecast" && (
        <div>
          <SectionTitle icon="📈" title="Prévisions Revenue 8 mois" subtitle="ARIMA(2,1,1) + saisonnalité — IC 90%" />
          <GlassCard style={{ padding:20, marginBottom:16 }}>
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={FORECAST_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.06)" />
                <XAxis dataKey="month" tick={{ fontSize:10, fill:DL.text.muted }} />
                <YAxis tick={{ fontSize:10, fill:DL.text.muted }} tickFormatter={v=>`${(v/1000).toFixed(0)}K`} />
                <Tooltip contentStyle={{ background:DL.surface, border:`1px solid ${DL.glassBorder}`, borderRadius:8, fontSize:11 }}
                  formatter={(v,n) => [v?`${(v/1000).toFixed(1)}K€`:"—", n==="actual"?"Réel":n==="forecast"?"Prévu":"Borne"]} />
                <Area type="monotone" dataKey="upper" stroke="none" fill={DL.fate.predict} fillOpacity={0.08} />
                <Area type="monotone" dataKey="lower" stroke="none" fill={DL.void} fillOpacity={1} />
                <Line type="monotone" dataKey="actual" stroke={DL.fate.emotion} strokeWidth={2.5} dot={{ fill:DL.fate.emotion, r:4 }} connectNulls={false} />
                <Line type="monotone" dataKey="forecast" stroke={DL.fate.predict} strokeWidth={2} strokeDasharray="6 3" dot={{ fill:DL.fate.predict, r:3 }} connectNulls={false} />
                <ReferenceLine x="Fév 26" stroke={DL.text.muted} strokeDasharray="3 3" label={{ value:"Aujourd'hui", fontSize:9, fill:DL.text.muted }} />
              </ComposedChart>
            </ResponsiveContainer>
          </GlassCard>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
            {[{l:"Revenue prévu Jun",v:"63.4K€",s:"+41.5%",c:DL.fate.tribe},{l:"MAPE",v:"4.2%",s:"Excellent",c:DL.fate.authority},
              {l:"Croissance/mois",v:"+8.3%",s:"vs +5.1% N-1",c:DL.fate.predict},{l:"Pic prévu",v:"Jul 26",s:"71.2K€",c:DL.fate.emotion}
            ].map(k => (
              <GlassCard key={k.l} style={{ padding:14, textAlign:"center" }}>
                <div style={{ fontSize:9, color:DL.text.muted, fontFamily:"'JetBrains Mono',monospace", marginBottom:6 }}>{k.l}</div>
                <div style={{ fontSize:20, fontWeight:800, color:k.c, fontFamily:"'JetBrains Mono',monospace" }}>{k.v}</div>
                <div style={{ fontSize:10, color:DL.text.secondary, marginTop:4 }}>{k.s}</div>
              </GlassCard>
            ))}
          </div>
        </div>
      )}
      {subTab === "anomalies" && (
        <div>
          <SectionTitle icon="⚠️" title="Détection d'anomalies" subtitle="Z-score > |2.0| sur fenêtre 30j" />
          {ANOMALIES.map((a,i) => (
            <GlassCard key={i} style={{ padding:16, borderLeft:`3px solid ${SEVERITY[a.severity]}`, marginBottom:10 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <div>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                    <Pill bg={SEVERITY[a.severity]+"15"} color={SEVERITY[a.severity]} border={SEVERITY[a.severity]+"30"}>{a.severity}</Pill>
                    <span style={{ fontSize:13, fontWeight:600, color:DL.text.primary }}>{a.metric}</span>
                  </div>
                  <p style={{ fontSize:11, color:DL.text.secondary, margin:0 }}>{a.explanation}</p>
                </div>
                <div style={{ textAlign:"right", minWidth:120 }}>
                  <div style={{ fontSize:9, color:DL.text.muted, fontFamily:"'JetBrains Mono',monospace" }}>{a.date}</div>
                  <div style={{ display:"flex", gap:12, justifyContent:"flex-end", marginTop:6 }}>
                    <div><div style={{ fontSize:8, color:DL.text.muted }}>ATTENDU</div><div style={{ fontSize:14, fontWeight:700, color:DL.text.secondary, fontFamily:"'JetBrains Mono',monospace" }}>{a.expected}</div></div>
                    <div><div style={{ fontSize:8, color:DL.text.muted }}>RÉEL</div><div style={{ fontSize:14, fontWeight:700, color:SEVERITY[a.severity], fontFamily:"'JetBrains Mono',monospace" }}>{a.actual}</div></div>
                  </div>
                  <div style={{ fontSize:9, color:DL.fate.predict, fontFamily:"'JetBrains Mono',monospace", marginTop:4 }}>Z={a.zscore}</div>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
      {subTab === "seasonality" && (
        <div>
          <SectionTitle icon="🔄" title="Indices saisonniers" subtitle="Décomposition STL — Composante hebdomadaire (1.0 = moyenne)" />
          <GlassCard style={{ padding:20, marginBottom:16 }}>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={SEASONALITY}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.06)" />
                <XAxis dataKey="day" tick={{ fontSize:11, fill:DL.text.secondary }} />
                <YAxis domain={[0.5,1.6]} tick={{ fontSize:10, fill:DL.text.muted }} />
                <Tooltip contentStyle={{ background:DL.surface, border:`1px solid ${DL.glassBorder}`, borderRadius:8 }} />
                <ReferenceLine y={1} stroke={DL.text.muted} strokeDasharray="4 4" />
                <Bar dataKey="index" radius={[6,6,0,0]}>
                  {SEASONALITY.map((d,i) => <Cell key={i} fill={d.index>=1.2?DL.fate.emotion:d.index>=1.0?DL.fate.tribe:DL.fate.authority} fillOpacity={0.8} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </GlassCard>
        </div>
      )}
      {subTab === "cohorts" && (
        <div>
          <SectionTitle icon="👥" title="Rétention par cohorte" subtitle="Taux rétention (%) — Cohortes trimestrielles 2025" />
          <GlassCard style={{ padding:20, overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"separate", borderSpacing:3, fontFamily:"'JetBrains Mono',monospace", fontSize:11 }}>
              <thead><tr>
                <th style={{ padding:8, textAlign:"left", color:DL.text.muted, fontSize:9 }}>COHORTE</th>
                {["M1","M2","M3","M4","M5","M6","M7","M8","M9"].map(m => <th key={m} style={{ padding:8, textAlign:"center", color:DL.text.muted, fontSize:9 }}>{m}</th>)}
                <th style={{ padding:8, textAlign:"center", color:DL.text.muted, fontSize:9 }}>RISQUE</th>
              </tr></thead>
              <tbody>{CHURN_COHORTS.map(c => (
                <tr key={c.cohort}>
                  <td style={{ padding:8, color:DL.text.primary, fontWeight:600 }}>{c.cohort}</td>
                  {[c.m1,c.m2,c.m3,c.m4,c.m5,c.m6,c.m7,c.m8,c.m9].map((v,i) => {
                    if (v===null) return <td key={i} style={{ padding:8, textAlign:"center", color:DL.text.dim }}>—</td>;
                    const col = v>=80?DL.fate.tribe:v>=60?DL.fate.emotion:DL.fate.focus;
                    return <td key={i} style={{ padding:8, textAlign:"center", color:col, fontWeight:600, background:col+"12", borderRadius:4 }}>{v}%</td>;
                  })}
                  <td style={{ padding:8, textAlign:"center" }}>
                    <Pill bg={SEVERITY[c.risk==="high"?"HIGH":c.risk==="medium"?"MEDIUM":"LOW"]+"15"}
                      color={SEVERITY[c.risk==="high"?"HIGH":c.risk==="medium"?"MEDIUM":"LOW"]}>{c.risk}</Pill>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </GlassCard>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// VIEW: DATA QUALITY ENGINE
// ═══════════════════════════════════════════════════════════════════════════
const DataQualityView = () => {
  const [subTab, setSubTab] = useState("overview");
  const globalScore = Math.round(QUALITY_DIMENSIONS.reduce((s,d)=>s+d.score,0)/QUALITY_DIMENSIONS.length);

  return (
    <div>
      <div style={{ display:"flex", gap:6, marginBottom:16 }}>
        {[["overview","🎯 Vue globale"],["rules","📋 Règles ("+QUALITY_RULES.length+")"],["drift","📊 Data Drift"]].map(([k,l]) => (
          <TabButton key={k} active={subTab===k} onClick={()=>setSubTab(k)} color={DL.fate.quality}>{l}</TabButton>
        ))}
      </div>
      {subTab === "overview" && (
        <div>
          <div style={{ display:"flex", gap:16, marginBottom:20 }}>
            <GlassCard style={{ padding:20, flex:"0 0 160px", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
              <ScoreRing score={globalScore} size={80} thickness={5} label="GLOBAL" />
            </GlassCard>
            <div style={{ flex:1, display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
              {QUALITY_DIMENSIONS.map(d => {
                const col = d.score >= d.target ? DL.fate.tribe : d.score >= d.target-10 ? DL.fate.emotion : DL.fate.focus;
                return (
                  <GlassCard key={d.dimension} style={{ padding:14 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                      <span style={{ fontSize:12, fontWeight:600, color:DL.text.primary }}>{d.dimension}</span>
                      <span style={{ fontSize:14, fontWeight:800, color:col, fontFamily:"'JetBrains Mono',monospace" }}>{d.score}%</span>
                    </div>
                    <ProgressBar value={d.score} color={col} height={5} />
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:6 }}>
                      <span style={{ fontSize:9, color:DL.text.muted }}>{d.description}</span>
                      <MiniSparkline data={d.trend} color={col} width={50} height={16} />
                    </div>
                    <div style={{ fontSize:9, color:DL.text.dim, marginTop:4, fontFamily:"'JetBrains Mono',monospace" }}>
                      Target: {d.target}% {d.score >= d.target ? "✓" : `(${d.target - d.score}% restant)`}
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          </div>
          <GlassCard style={{ padding:20 }}>
            <SectionTitle icon="🕸" title="Radar Qualité" subtitle="Profil vs cibles" />
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={QUALITY_DIMENSIONS.map(d=>({dimension:d.dimension,score:d.score,target:d.target}))}>
                <PolarGrid stroke="rgba(148,163,184,0.08)" />
                <PolarAngleAxis dataKey="dimension" tick={{ fontSize:10, fill:DL.text.secondary }} />
                <PolarRadiusAxis domain={[0,100]} tick={{ fontSize:8, fill:DL.text.muted }} />
                <Radar name="Score" dataKey="score" stroke={DL.fate.quality} fill={DL.fate.quality} fillOpacity={0.15} strokeWidth={2} />
                <Radar name="Target" dataKey="target" stroke={DL.text.muted} fill="none" strokeDasharray="4 4" strokeWidth={1} />
              </RadarChart>
            </ResponsiveContainer>
          </GlassCard>
        </div>
      )}
      {subTab === "rules" && (
        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
          {QUALITY_RULES.map(r => {
            const col = r.status==="passing"?DL.fate.tribe:r.status==="warning"?DL.fate.emotion:DL.fate.focus;
            const icon = r.status==="passing"?"✓":r.status==="warning"?"⚠":"✗";
            return (
              <GlassCard key={r.id} style={{ padding:12, borderLeft:`3px solid ${col}` }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <span style={{ fontSize:14, color:col }}>{icon}</span>
                    <div>
                      <div style={{ fontSize:12, fontWeight:600, color:DL.text.primary }}>{r.rule}</div>
                      <div style={{ fontSize:9, color:DL.text.muted, fontFamily:"'JetBrains Mono',monospace", marginTop:2 }}>
                        Table: {r.table} · {r.id} · Last: {r.lastRun}</div>
                    </div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:12, fontWeight:700, color:r.failures>0?col:DL.text.secondary, fontFamily:"'JetBrains Mono',monospace" }}>
                      {r.failures>0?`${r.failures} failures`:"0 failures"}</div>
                    <div style={{ fontSize:9, color:DL.text.muted, fontFamily:"'JetBrains Mono',monospace" }}>/ {r.total.toLocaleString()} checked</div>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
      {subTab === "drift" && (
        <div>
          <SectionTitle icon="📊" title="Data Drift Detection" subtitle="Déviation vs baseline 90j — Seuil: ±15%" />
          {DATA_DRIFT.map(d => {
            const col = d.severity==="alert"?DL.fate.focus:d.severity==="warning"?DL.fate.emotion:DL.fate.tribe;
            return (
              <GlassCard key={d.field} style={{ padding:14, borderLeft:`3px solid ${col}`, marginBottom:8 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div>
                    <div style={{ fontSize:12, fontWeight:600, color:DL.text.primary, fontFamily:"'JetBrains Mono',monospace" }}>{d.field}</div>
                    <div style={{ display:"flex", gap:16, marginTop:6 }}>
                      <div><div style={{ fontSize:8, color:DL.text.muted }}>BASELINE</div><div style={{ fontSize:14, fontWeight:700, color:DL.text.secondary, fontFamily:"'JetBrains Mono',monospace" }}>{d.baseline}</div></div>
                      <div><div style={{ fontSize:8, color:DL.text.muted }}>ACTUEL</div><div style={{ fontSize:14, fontWeight:700, color:col, fontFamily:"'JetBrains Mono',monospace" }}>{d.current}</div></div>
                    </div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:18, fontWeight:800, color:col, fontFamily:"'JetBrains Mono',monospace" }}>{d.drift>0?"↑":"↓"}{Math.abs(d.drift).toFixed(1)}%</div>
                    <Pill bg={col+"15"} color={col} border={col+"30"} style={{ marginTop:4 }}>{d.severity}</Pill>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// VIEW: ETL PIPELINE MONITOR
// ═══════════════════════════════════════════════════════════════════════════
const PipelineView = () => {
  const [sel, setSel] = useState(null);
  const totalRec = PIPELINES.reduce((s,p)=>s+p.records.loaded,0);
  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:20 }}>
        {[{l:"PIPELINES",v:PIPELINES.length,c:DL.fate.pipeline},{l:"HEALTHY",v:`${PIPELINES.filter(p=>p.status==="healthy"||p.status==="running").length}/${PIPELINES.length}`,c:DL.fate.tribe},
          {l:"RECORDS/RUN",v:totalRec.toLocaleString(),c:DL.fate.authority},{l:"ERREURS 24H",v:PIPELINES.reduce((s,p)=>s+p.errors24h,0),c:DL.fate.focus}
        ].map(k => (
          <GlassCard key={k.l} style={{ padding:14, textAlign:"center" }}>
            <div style={{ fontSize:9, color:DL.text.muted, fontFamily:"'JetBrains Mono',monospace" }}>{k.l}</div>
            <div style={{ fontSize:24, fontWeight:800, color:k.c, fontFamily:"'JetBrains Mono',monospace" }}>{k.v}</div>
          </GlassCard>
        ))}
      </div>
      {PIPELINES.map(p => {
        const sc = p.status==="healthy"||p.status==="running"?DL.fate.tribe:p.status==="warning"?DL.fate.emotion:DL.fate.focus;
        const isSel = sel===p.id;
        return (
          <GlassCard key={p.id} hover glow={sc} onClick={()=>setSel(isSel?null:p.id)}
            style={{ padding:16, borderLeft:`3px solid ${sc}`, cursor:"pointer", marginBottom:10, outline:isSel?`1px solid ${sc}40`:"none" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
                  <StatusDot status={p.status==="healthy"?"healthy":p.status==="running"?"running":p.status==="warning"?"warning":"error"} />
                  <span style={{ fontSize:14, fontWeight:700, color:DL.text.primary }}>{p.name}</span>
                  <Pill>{p.id}</Pill>
                </div>
                <div style={{ display:"flex", gap:16, fontSize:10, color:DL.text.muted, fontFamily:"'JetBrains Mono',monospace" }}>
                  <span>{p.source} → {p.dest}</span><span>Cron: {p.schedule}</span><span>{p.duration}</span>
                </div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <MiniSparkline data={p.history} color={sc} width={60} height={20} />
                <ScoreRing score={p.health} size={44} thickness={3} />
              </div>
            </div>
            {isSel && (
              <div style={{ marginTop:16, paddingTop:16, borderTop:`1px solid ${DL.glassBorder}`, display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, animation:"fadeIn 0.3s" }}>
                {[{l:"Extracted",v:p.records.extracted,c:DL.fate.authority},{l:"Transformed",v:p.records.transformed,c:DL.fate.predict},
                  {l:"Loaded",v:p.records.loaded,c:DL.fate.tribe},{l:"Rejected",v:p.records.rejected,c:p.records.rejected>0?DL.fate.focus:DL.text.muted}
                ].map(s => (
                  <div key={s.l} style={{ textAlign:"center" }}>
                    <div style={{ fontSize:8, color:DL.text.muted, fontFamily:"'JetBrains Mono',monospace" }}>{s.l}</div>
                    <div style={{ fontSize:18, fontWeight:800, color:s.c, fontFamily:"'JetBrains Mono',monospace" }}>{s.v.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        );
      })}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// VIEW: AI INSIGHTS
// ═══════════════════════════════════════════════════════════════════════════
const InsightsView = () => {
  const [subTab, setSubTab] = useState("insights");
  const [exp, setExp] = useState(null);
  const cfg = { revenue:{icon:"💰",color:DL.fate.emotion,label:"Revenue"}, quality:{icon:"🔍",color:DL.fate.quality,label:"Qualité"},
    operational:{icon:"⚙️",color:DL.fate.authority,label:"Opérationnel"}, predictive:{icon:"🔮",color:DL.fate.predict,label:"Prédictif"},
    compliance:{icon:"🛡",color:DL.fate.tribe,label:"Compliance"} };

  return (
    <div>
      <div style={{ display:"flex", gap:6, marginBottom:16 }}>
        {[["insights","🧠 Insights ("+AI_INSIGHTS.length+")"],["correlations","🔗 Corrélations"],["actions","🎯 Actions"]].map(([k,l]) => (
          <TabButton key={k} active={subTab===k} onClick={()=>setSubTab(k)} color={DL.fate.insight}>{l}</TabButton>
        ))}
      </div>
      {subTab === "insights" && AI_INSIGHTS.sort((a,b)=>{const p={critical:0,high:1,medium:2,low:3};return(p[a.priority]||3)-(p[b.priority]||3);}).map(ins => {
        const c = cfg[ins.type]; const isE = exp===ins.id;
        return (
          <GlassCard key={ins.id} hover glow={c.color} onClick={()=>setExp(isE?null:ins.id)}
            style={{ padding:18, borderLeft:`3px solid ${c.color}`, cursor:"pointer", marginBottom:12 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
              <span style={{ fontSize:16 }}>{c.icon}</span>
              <Pill bg={c.color+"15"} color={c.color} border={c.color+"30"}>{c.label}</Pill>
              <Pill bg={SEVERITY[ins.priority==="critical"?"CRITICAL":ins.priority.toUpperCase()]+"15"}
                color={SEVERITY[ins.priority==="critical"?"CRITICAL":ins.priority.toUpperCase()]}>{ins.priority}</Pill>
              <span style={{ fontSize:9, color:DL.text.dim, fontFamily:"'JetBrains Mono',monospace", marginLeft:"auto" }}>Confiance: {ins.confidence}%</span>
            </div>
            <h4 style={{ fontSize:14, fontWeight:700, color:DL.text.primary, margin:"0 0 6px" }}>{ins.title}</h4>
            <p style={{ fontSize:12, color:DL.text.secondary, margin:0, lineHeight:1.6 }}>{ins.insight}</p>
            {isE && (
              <div style={{ marginTop:14, paddingTop:14, borderTop:`1px solid ${DL.glassBorder}`, display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, animation:"fadeIn 0.3s" }}>
                <div style={{ background:DL.elevated, padding:12, borderRadius:8 }}>
                  <div style={{ fontSize:9, color:DL.text.muted, fontFamily:"'JetBrains Mono',monospace", marginBottom:4 }}>ACTION</div>
                  <div style={{ fontSize:12, color:DL.fate.tribe, fontWeight:600 }}>{ins.action}</div>
                </div>
                <div style={{ background:DL.elevated, padding:12, borderRadius:8 }}>
                  <div style={{ fontSize:9, color:DL.text.muted, fontFamily:"'JetBrains Mono',monospace", marginBottom:4 }}>IMPACT</div>
                  <div style={{ fontSize:12, color:DL.fate.emotion, fontWeight:600 }}>{ins.impact}</div>
                </div>
                <div style={{ background:DL.elevated, padding:12, borderRadius:8 }}>
                  <div style={{ fontSize:9, color:DL.text.muted, fontFamily:"'JetBrains Mono',monospace", marginBottom:4 }}>SOURCES</div>
                  <div style={{ display:"flex", gap:4 }}>{ins.source.map(s=><Pill key={s} bg={DL.fate.authority+"15"} color={DL.fate.authority}>{s}</Pill>)}</div>
                </div>
              </div>
            )}
          </GlassCard>
        );
      })}
      {subTab === "correlations" && (
        <div>
          <SectionTitle icon="🔗" title="Corrélations Pearson" subtitle="|r| > 0.7 = forte corrélation" />
          <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:10 }}>
            {CORRELATION_MATRIX.filter(c=>Math.abs(c.r)>=0.5).sort((a,b)=>Math.abs(b.r)-Math.abs(a.r)).map((c,i) => {
              const col = c.r>0?DL.fate.tribe:DL.fate.focus;
              return (
                <GlassCard key={i} style={{ padding:12 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div style={{ fontSize:11 }}><span style={{ fontWeight:600, color:DL.text.primary }}>{c.x}</span> <span style={{ color:DL.text.muted }}>↔</span> <span style={{ fontWeight:600, color:DL.text.primary }}>{c.y}</span></div>
                    <span style={{ fontSize:16, fontWeight:800, color:col, fontFamily:"'JetBrains Mono',monospace" }}>{c.r>0?"+":""}{c.r.toFixed(2)}</span>
                  </div>
                  <ProgressBar value={Math.abs(c.r)*100} color={col} height={4} />
                </GlassCard>
              );
            })}
          </div>
        </div>
      )}
      {subTab === "actions" && (
        <div>
          <SectionTitle icon="🎯" title="Actions prioritaires" subtitle="Impact × effort — Fort ROI en premier" />
          {[{action:"Ajuster pricing WE",impact:95,effort:15,roi:"280€/h investi",cat:"revenue",dl:"Immédiat"},
            {action:"Audit propreté 8 propriétés",impact:88,effort:40,roi:"Rétention +25%",cat:"quality",dl:"Cette semaine"},
            {action:"Recruter 4 agents avant Avril",impact:82,effort:70,roi:"0 résa refusée",cat:"operational",dl:"Mars 2026"},
            {action:"Consentement RGPD granulaire",impact:75,effort:35,roi:"Compliance Art.9",cat:"compliance",dl:"2 semaines"},
            {action:"Restructurer shifts dimanche",impact:72,effort:25,roi:"-60% attente",cat:"operational",dl:"Ce mois"},
          ].map((a,i) => {
            const ac = cfg[a.cat];
            return (
              <GlassCard key={i} style={{ padding:16, borderLeft:`3px solid ${ac.color}`, marginBottom:8 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                      <span style={{ fontSize:16, fontWeight:800, color:DL.fate.emotion, fontFamily:"'JetBrains Mono',monospace" }}>#{i+1}</span>
                      <span style={{ fontSize:13, fontWeight:700, color:DL.text.primary }}>{a.action}</span>
                    </div>
                    <div style={{ display:"flex", gap:6 }}>
                      <Pill bg={ac.color+"15"} color={ac.color} border={ac.color+"30"}>{ac.label}</Pill>
                      <Pill>⏰ {a.dl}</Pill>
                      <Pill bg={DL.fate.tribe+"15"} color={DL.fate.tribe} border={DL.fate.tribe+"30"}>ROI: {a.roi}</Pill>
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:16, textAlign:"center" }}>
                    <div><div style={{ fontSize:8, color:DL.text.muted }}>IMPACT</div><div style={{ fontSize:16, fontWeight:800, color:DL.fate.tribe, fontFamily:"'JetBrains Mono',monospace" }}>{a.impact}</div></div>
                    <div><div style={{ fontSize:8, color:DL.text.muted }}>EFFORT</div><div style={{ fontSize:16, fontWeight:800, color:a.effort>50?DL.fate.focus:DL.fate.emotion, fontFamily:"'JetBrains Mono',monospace" }}>{a.effort}</div></div>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// VIEW: ANALYTICS
// ═══════════════════════════════════════════════════════════════════════════
const AnalyticsView = ({ assets }) => {
  const catData = Object.entries(assets.reduce((acc,a)=>{acc[a.category]=(acc[a.category]||0)+a.revenue;return acc;},{})).map(([cat,rev])=>({name:cat,value:rev}));
  const radarData = assets.slice(0,6).map(a=>({name:a.name.split(" ").slice(0,2).join(" "),score:a.score,freshness:a.freshness,completeness:a.completeness}));
  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
      <GlassCard style={{ padding:20 }}>
        <SectionTitle icon="📊" title="Revenue par catégorie" />
        <ResponsiveContainer width="100%" height={240}>
          <PieChart><Pie data={catData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} innerRadius={50}
            label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={{stroke:DL.text.muted,strokeWidth:0.5}}>
            {catData.map((d,i)=><Cell key={i} fill={CATEGORY_COLORS[d.name]||DL.fate.emotion} fillOpacity={0.8} />)}</Pie>
            <Tooltip contentStyle={{background:DL.surface,border:`1px solid ${DL.glassBorder}`,borderRadius:8}} formatter={v=>`${v.toLocaleString()}€`} />
          </PieChart>
        </ResponsiveContainer>
      </GlassCard>
      <GlassCard style={{ padding:20 }}>
        <SectionTitle icon="🕸" title="Radar Top 6 Assets" />
        <ResponsiveContainer width="100%" height={240}>
          <RadarChart data={radarData}><PolarGrid stroke="rgba(148,163,184,0.08)" />
            <PolarAngleAxis dataKey="name" tick={{fontSize:9,fill:DL.text.secondary}} />
            <PolarRadiusAxis domain={[0,100]} tick={{fontSize:8,fill:DL.text.muted}} />
            <Radar name="Score" dataKey="score" stroke={DL.fate.emotion} fill={DL.fate.emotion} fillOpacity={0.15} />
            <Radar name="Fraîcheur" dataKey="freshness" stroke={DL.fate.authority} fill={DL.fate.authority} fillOpacity={0.1} />
          </RadarChart>
        </ResponsiveContainer>
      </GlassCard>
      <GlassCard style={{ padding:20, gridColumn:"span 2" }}>
        <SectionTitle icon="📈" title="Distribution des scores" />
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={assets.sort((a,b)=>b.score-a.score)} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.06)" />
            <XAxis type="number" domain={[0,100]} tick={{fontSize:9,fill:DL.text.muted}} />
            <YAxis type="category" dataKey="name" width={120} tick={{fontSize:9,fill:DL.text.secondary}} />
            <Bar dataKey="score" radius={[0,4,4,0]}>{assets.map((a,i)=><Cell key={i} fill={CATEGORY_COLORS[a.category]} fillOpacity={0.7} />)}</Bar>
          </BarChart>
        </ResponsiveContainer>
      </GlassCard>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// VIEW: COMPLIANCE
// ═══════════════════════════════════════════════════════════════════════════
const ComplianceView = ({ assets }) => {
  const piiAssets = assets.filter(a=>a.pii);
  const global = Math.round(COMPLIANCE_REGS.reduce((s,r)=>s+r.score,0)/COMPLIANCE_REGS.length);
  return (
    <div>
      <div style={{ display:"flex", gap:16, marginBottom:20, alignItems:"flex-start" }}>
        <GlassCard style={{ padding:20, flex:"0 0 140px", display:"flex", flexDirection:"column", alignItems:"center" }}>
          <ScoreRing score={global} size={80} thickness={5} label="COMPLIANCE" />
        </GlassCard>
        <div style={{ flex:1, display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:10 }}>
          {COMPLIANCE_REGS.map(r => {
            const col = r.score>=80?DL.fate.tribe:r.score>=60?DL.fate.emotion:DL.fate.focus;
            return (
              <GlassCard key={r.name} style={{ padding:14 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                  <span style={{ fontSize:13, fontWeight:700, color:DL.text.primary }}>{r.name}</span>
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    {r.critical>0 && <Pill bg={DL.fate.focus+"15"} color={DL.fate.focus} border={DL.fate.focus+"30"}>{r.critical} critiques</Pill>}
                    <span style={{ fontSize:16, fontWeight:800, color:col, fontFamily:"'JetBrains Mono',monospace" }}>{r.score}%</span>
                  </div>
                </div>
                <ProgressBar value={r.score} color={col} height={5} />
                <div style={{ display:"flex", gap:4, marginTop:8, flexWrap:"wrap" }}>
                  {r.articles.map(a=><span key={a} style={{ fontSize:8, color:DL.text.dim, fontFamily:"'JetBrains Mono',monospace", background:"rgba(148,163,184,0.06)", padding:"2px 5px", borderRadius:3 }}>{a}</span>)}
                </div>
              </GlassCard>
            );
          })}
        </div>
      </div>
      {piiAssets.length > 0 && (
        <div>
          <SectionTitle icon="🔒" title="Assets PII" subtitle={`${piiAssets.length} assets contiennent des données personnelles`} />
          {piiAssets.map(a => (
            <GlassCard key={a.id} style={{ padding:14, borderLeft:`3px solid ${DL.fate.focus}`, marginBottom:8 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span>🔐</span><span style={{ fontSize:13, fontWeight:600, color:DL.text.primary }}>{a.name}</span>
                  <Pill bg={DL.fate.focus+"15"} color={DL.fate.focus}>PII</Pill>
                </div>
                <ScoreRing score={a.score} size={36} thickness={2.5} />
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// CLASSIFICATION: MATURITY PIPELINE
// ═══════════════════════════════════════════════════════════════════════════
const MaturityView = () => {
  const [sel, setSel] = useState(null);
  const stageDistribution = ["raw","cleaned","enriched","actionable"].map(s=>({stage:s,count:MATURITY_ASSETS.filter(a=>a.stage===s).length}));

  return (
    <div>
      <SectionTitle icon="🧬" title="Data Maturity Pipeline" subtitle="Chaque stade ×3 la valeur — Raw → Cleaned → Enriched → Actionable" />
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:20 }}>
        {stageDistribution.map(s => (
          <GlassCard key={s.stage} style={{ padding:14, textAlign:"center", borderTop:`3px solid ${MATURITY_COLORS[s.stage]}` }}>
            <div style={{ fontSize:9, color:DL.text.muted, fontFamily:"'JetBrains Mono',monospace", textTransform:"uppercase", letterSpacing:1 }}>{s.stage}</div>
            <div style={{ fontSize:28, fontWeight:800, color:MATURITY_COLORS[s.stage], fontFamily:"'JetBrains Mono',monospace" }}>{s.count}</div>
          </GlassCard>
        ))}
      </div>
      {MATURITY_ASSETS.map(asset => {
        const isSel = sel===asset.id;
        return (
          <GlassCard key={asset.id} hover glow={MATURITY_COLORS[asset.stage]} onClick={()=>setSel(isSel?null:asset.id)}
            style={{ padding:16, borderLeft:`3px solid ${MATURITY_COLORS[asset.stage]}`, cursor:"pointer", marginBottom:10 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <Pill bg={MATURITY_COLORS[asset.stage]+"18"} color={MATURITY_COLORS[asset.stage]} border={MATURITY_COLORS[asset.stage]+"35"} style={{ textTransform:"uppercase", fontSize:9 }}>{asset.stage}</Pill>
                <span style={{ fontSize:14, fontWeight:700, color:DL.text.primary }}>{asset.name}</span>
                <span style={{ fontSize:10, color:DL.text.dim, fontFamily:"'JetBrains Mono',monospace" }}>{asset.id}</span>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:16 }}>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:8, color:DL.text.muted }}>MULTI.</div>
                  <div style={{ fontSize:16, fontWeight:800, color:DL.fate.emotion, fontFamily:"'JetBrains Mono',monospace" }}>×{asset.valueMultiplier}</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:8, color:DL.text.muted }}>€/REC</div>
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <span style={{ fontSize:10, color:DL.text.dim, textDecoration:"line-through" }}>{asset.rawValue}€</span>
                    <span style={{ fontSize:16, fontWeight:800, color:DL.fate.tribe, fontFamily:"'JetBrains Mono',monospace" }}>{asset.currentValue}€</span>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ display:"flex", gap:4, marginTop:12, alignItems:"center" }}>
              {asset.pipeline.map((step,i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", flex:1 }}>
                  <div style={{ flex:1, height:8, borderRadius:4,
                    background: step.done ? MATURITY_COLORS[step.stage.toLowerCase()] : "rgba(148,163,184,0.08)",
                    position:"relative" }}>
                    {step.done && <div style={{ position:"absolute", right:-4, top:-3, width:14, height:14, borderRadius:"50%",
                      background:MATURITY_COLORS[step.stage.toLowerCase()], border:`2px solid ${DL.surface}`,
                      display:"flex", alignItems:"center", justifyContent:"center", fontSize:8, color:"#fff" }}>✓</div>}
                  </div>
                  {i<3 && <div style={{ width:12, height:1, background:"rgba(148,163,184,0.15)", margin:"0 2px" }} />}
                </div>
              ))}
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", marginTop:4 }}>
              {["Raw","Cleaned","Enriched","Actionable"].map(s=><span key={s} style={{ fontSize:8, color:DL.text.dim, fontFamily:"'JetBrains Mono',monospace", flex:1, textAlign:"center" }}>{s}</span>)}
            </div>
            {isSel && (
              <div style={{ marginTop:14, paddingTop:14, borderTop:`1px solid ${DL.glassBorder}`, animation:"fadeIn 0.3s" }}>
                {asset.pipeline.map((step,i) => (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"6px 0", borderBottom:i<3?`1px solid rgba(148,163,184,0.04)`:"none" }}>
                    <div style={{ width:20, height:20, borderRadius:"50%", background:step.done?MATURITY_COLORS[step.stage.toLowerCase()]:"rgba(148,163,184,0.08)",
                      display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, color:"#fff", flexShrink:0 }}>
                      {step.done?"✓":(i+1)}</div>
                    <div style={{ flex:1 }}>
                      <span style={{ fontSize:11, fontWeight:600, color:step.done?DL.text.primary:DL.text.muted }}>{step.stage}</span>
                      <span style={{ fontSize:10, color:DL.text.muted, marginLeft:8 }}>{step.detail}</span>
                    </div>
                    <span style={{ fontSize:9, color:step.done?DL.text.secondary:DL.fate.emotion, fontFamily:"'JetBrains Mono',monospace" }}>{step.date}</span>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        );
      })}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// CLASSIFICATION: SIGNAL STRENGTH BUNDLES
// ═══════════════════════════════════════════════════════════════════════════
const SignalView = () => {
  const [exp, setExp] = useState(null);
  const totalBV = SIGNAL_BUNDLES.reduce((s,b)=>s+b.valueBundled,0);
  return (
    <div>
      <SectionTitle icon="📡" title="Signal Strength Bundles" subtitle="Datasets combinés — Valeur bundlée vs isolée" />
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:20 }}>
        {[{l:"BUNDLES",v:SIGNAL_BUNDLES.length,c:DL.fate.signal},{l:"VALEUR BUNDLÉE",v:`${(totalBV/1000).toFixed(0)}K€`,c:DL.fate.emotion},
          {l:"MULTI. MOYEN",v:`×${(SIGNAL_BUNDLES.reduce((s,b)=>s+b.multiplier,0)/SIGNAL_BUNDLES.length).toFixed(1)}`,c:DL.fate.tribe}
        ].map(k => (
          <GlassCard key={k.l} style={{ padding:14, textAlign:"center" }}>
            <div style={{ fontSize:9, color:DL.text.muted, fontFamily:"'JetBrains Mono',monospace" }}>{k.l}</div>
            <div style={{ fontSize:28, fontWeight:800, color:k.c, fontFamily:"'JetBrains Mono',monospace" }}>{k.v}</div>
          </GlassCard>
        ))}
      </div>
      {SIGNAL_BUNDLES.map(b => {
        const isE = exp===b.id;
        return (
          <GlassCard key={b.id} hover glow={DL.fate.signal} onClick={()=>setExp(isE?null:b.id)}
            style={{ padding:18, cursor:"pointer", marginBottom:12 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                  <span style={{ fontSize:14, fontWeight:800, color:DL.fate.signal }}>{b.signalStrength}</span>
                  <div style={{ width:40, height:6, background:"rgba(148,163,184,0.08)", borderRadius:3, overflow:"hidden" }}>
                    <div style={{ width:`${b.signalStrength}%`, height:"100%", background:DL.gradient.signal, borderRadius:3 }} /></div>
                  <span style={{ fontSize:15, fontWeight:700, color:DL.text.primary }}>{b.name}</span>
                </div>
                <p style={{ fontSize:11, color:DL.text.secondary, margin:"0 0 8px" }}>{b.output}</p>
                <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                  {b.inputs.map(i=><Pill key={i} bg={DL.fate.authority+"12"} color={DL.fate.authority} border={DL.fate.authority+"25"}>{i}</Pill>)}
                </div>
              </div>
              <div style={{ display:"flex", gap:20, alignItems:"flex-start", marginLeft:20 }}>
                <div style={{ textAlign:"center" }}>
                  <div style={{ fontSize:8, color:DL.text.muted }}>ISOLÉ</div>
                  <div style={{ fontSize:14, color:DL.text.dim, fontFamily:"'JetBrains Mono',monospace", textDecoration:"line-through" }}>{(b.valueAlone/1000).toFixed(1)}K€</div>
                </div>
                <div style={{ textAlign:"center" }}>
                  <div style={{ fontSize:8, color:DL.text.muted }}>BUNDLÉ</div>
                  <div style={{ fontSize:20, fontWeight:800, color:DL.fate.emotion, fontFamily:"'JetBrains Mono',monospace" }}>{(b.valueBundled/1000).toFixed(0)}K€</div>
                </div>
                <div style={{ textAlign:"center" }}>
                  <div style={{ fontSize:8, color:DL.text.muted }}>×</div>
                  <div style={{ fontSize:20, fontWeight:800, color:DL.fate.tribe, fontFamily:"'JetBrains Mono',monospace" }}>{b.multiplier}</div>
                </div>
              </div>
            </div>
            {isE && (
              <div style={{ marginTop:16, paddingTop:16, borderTop:`1px solid ${DL.glassBorder}`, display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, animation:"fadeIn 0.3s" }}>
                <div style={{ background:DL.elevated, padding:12, borderRadius:8 }}>
                  <div style={{ fontSize:9, color:DL.text.muted, fontFamily:"'JetBrains Mono',monospace" }}>PRÉCISION</div>
                  <div style={{ fontSize:18, fontWeight:800, color:DL.fate.tribe }}>{b.accuracy}%</div>
                  <div style={{ fontSize:9, color:DL.text.dim }}>Latence: {b.latency}</div>
                </div>
                <div style={{ background:DL.elevated, padding:12, borderRadius:8 }}>
                  <div style={{ fontSize:9, color:DL.text.muted, fontFamily:"'JetBrains Mono',monospace" }}>COMPOSANTS</div>
                  <div style={{ display:"flex", gap:3, flexWrap:"wrap" }}>{b.components.map(c=><Pill key={c} style={{ fontSize:8, padding:"2px 6px" }}>{c}</Pill>)}</div>
                </div>
                <div style={{ background:DL.elevated, padding:12, borderRadius:8 }}>
                  <div style={{ fontSize:9, color:DL.text.muted, fontFamily:"'JetBrains Mono',monospace" }}>ACHETEURS</div>
                  <div style={{ display:"flex", gap:3, flexWrap:"wrap" }}>{b.buyers.map(x=><Pill key={x} bg={DL.fate.tribe+"12"} color={DL.fate.tribe} border={DL.fate.tribe+"25"} style={{ fontSize:8 }}>{x}</Pill>)}</div>
                </div>
              </div>
            )}
          </GlassCard>
        );
      })}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// CLASSIFICATION: TEMPORAL DECAY CURVES
// ═══════════════════════════════════════════════════════════════════════════
const DecayView = () => {
  const [cat, setCat] = useState("all");
  const catColors = { volatile:DL.fate.focus, moderate:DL.fate.emotion, stable:DL.fate.authority, durable:DL.fate.tribe };
  const filtered = cat==="all" ? DECAY_PROFILES : DECAY_PROFILES.filter(d=>d.category===cat);

  return (
    <div>
      <SectionTitle icon="⏳" title="Temporal Decay Curves" subtitle="Demi-vie par dataset — Fenêtre de monétisation optimale & pricing dynamique" />
      <div style={{ display:"flex", gap:4, marginBottom:16 }}>
        {["all","volatile","moderate","stable","durable"].map(c => (
          <button key={c} onClick={()=>setCat(c)} style={{
            padding:"5px 12px", borderRadius:8, fontSize:10, fontWeight:600, border:"none", cursor:"pointer",
            background: cat===c ? (catColors[c]||DL.fate.emotion) : "rgba(148,163,184,0.06)",
            color: cat===c ? "#fff" : DL.text.muted, fontFamily:"'JetBrains Mono',monospace", textTransform:"capitalize",
          }}>{c}</button>
        ))}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:10 }}>
        {filtered.map(d => {
          const col = catColors[d.category];
          return (
            <GlassCard key={d.asset} style={{ padding:14, borderLeft:`3px solid ${col}` }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:DL.text.primary, marginBottom:4 }}>{d.asset}</div>
                  <div style={{ display:"flex", gap:6 }}>
                    <Pill bg={col+"15"} color={col} border={col+"30"}>{d.category}</Pill>
                    <Pill>½ vie: {d.halfLife} {d.unit}</Pill>
                  </div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ display:"flex", gap:10 }}>
                    <div><div style={{ fontSize:8, color:DL.text.muted }}>FRAIS</div><div style={{ fontSize:16, fontWeight:800, color:DL.fate.tribe, fontFamily:"'JetBrains Mono',monospace" }}>{d.freshPrice}€</div></div>
                    <div><div style={{ fontSize:8, color:DL.text.muted }}>PÉRIMÉ</div><div style={{ fontSize:16, fontWeight:800, color:DL.text.dim, fontFamily:"'JetBrains Mono',monospace" }}>{d.stalePrice}€</div></div>
                  </div>
                </div>
              </div>
              <div style={{ marginTop:8 }}><MiniSparkline data={d.curve} color={col} width={200} height={28} /></div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// CLASSIFICATION: KNOWLEDGE GRAPH
// ═══════════════════════════════════════════════════════════════════════════
const GraphView = () => {
  const [selNode, setSelNode] = useState(null);
  const typeColors = { entity:"#8b5cf6", event:"#f97316", feedback:"#ef4444", metric:"#10b981", temporal:"#06b6d4", spatial:"#ec4899", telemetry:"#64748b" };
  const nodeLayout = useMemo(() => {
    const cx=300, cy=200, r=150;
    return GRAPH_NODES.map((n,i) => {
      const angle = (i/GRAPH_NODES.length)*2*Math.PI - Math.PI/2;
      return { ...n, x:cx+r*Math.cos(angle), y:cy+r*Math.sin(angle) };
    });
  }, []);
  const connEdges = selNode ? GRAPH_EDGES.filter(e=>e.from===selNode||e.to===selNode) : [];

  return (
    <div>
      <SectionTitle icon="🕸" title="Knowledge Graph" subtitle="Topologie des données — Hubs les plus connectés = valeur exponentielle" />
      <div style={{ display:"grid", gridTemplateColumns:"1fr 300px", gap:16 }}>
        <GlassCard style={{ padding:20 }}>
          <svg width="100%" viewBox="0 0 600 400" style={{ minHeight:340 }}>
            {GRAPH_EDGES.map((e,i) => {
              const from=nodeLayout.find(n=>n.id===e.from), to=nodeLayout.find(n=>n.id===e.to);
              if(!from||!to) return null;
              const hl = selNode && (e.from===selNode||e.to===selNode);
              return (<g key={i}>
                <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={hl?DL.fate.graph:"rgba(148,163,184,0.12)"}
                  strokeWidth={hl?e.weight*2.5:e.weight*1.2} strokeOpacity={hl?0.8:0.3} />
                {hl && <text x={(from.x+to.x)/2} y={(from.y+to.y)/2-6} fill={DL.text.muted} fontSize={8} textAnchor="middle" fontFamily="JetBrains Mono">{e.label}</text>}
              </g>);
            })}
            {nodeLayout.map(n => {
              const isSel=selNode===n.id, isConn=connEdges.some(e=>e.from===n.id||e.to===n.id);
              const nr=12+n.hubScore/15, col=typeColors[n.type];
              return (<g key={n.id} onClick={()=>setSelNode(isSel?null:n.id)} style={{ cursor:"pointer" }}>
                {isSel && <circle cx={n.x} cy={n.y} r={nr+8} fill="none" stroke={col} strokeWidth={1} strokeDasharray="3 3" opacity={0.5} />}
                <circle cx={n.x} cy={n.y} r={nr} fill={isSel?col:isConn?col+"80":col+"40"} stroke={isSel?col:"rgba(255,255,255,0.1)"} strokeWidth={isSel?2:1} />
                <text x={n.x} y={n.y+nr+14} fill={isSel?DL.text.primary:DL.text.secondary} fontSize={10} textAnchor="middle" fontFamily="DM Sans" fontWeight={isSel?700:500}>{n.label}</text>
                <text x={n.x} y={n.y+4} fill="#fff" fontSize={9} textAnchor="middle" fontFamily="JetBrains Mono" fontWeight={700}>{n.hubScore}</text>
              </g>);
            })}
          </svg>
        </GlassCard>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {selNode ? (() => {
            const nd = nodeLayout.find(n=>n.id===selNode);
            return (
              <GlassCard style={{ padding:16, borderLeft:`3px solid ${typeColors[nd.type]}` }}>
                <div style={{ fontSize:16, fontWeight:800, color:DL.text.primary, marginBottom:8 }}>{nd.label}</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
                  <div><div style={{ fontSize:8, color:DL.text.muted }}>HUB SCORE</div><div style={{ fontSize:20, fontWeight:800, color:typeColors[nd.type], fontFamily:"'JetBrains Mono',monospace" }}>{nd.hubScore}</div></div>
                  <div><div style={{ fontSize:8, color:DL.text.muted }}>CONNEXIONS</div><div style={{ fontSize:20, fontWeight:800, color:DL.fate.authority, fontFamily:"'JetBrains Mono',monospace" }}>{nd.connections}</div></div>
                  <div><div style={{ fontSize:8, color:DL.text.muted }}>RECORDS</div><div style={{ fontSize:14, fontWeight:700, color:DL.text.secondary, fontFamily:"'JetBrains Mono',monospace" }}>{nd.records}</div></div>
                  <div><div style={{ fontSize:8, color:DL.text.muted }}>VALEUR/NŒUD</div><div style={{ fontSize:14, fontWeight:700, color:DL.fate.emotion, fontFamily:"'JetBrains Mono',monospace" }}>{nd.value}€</div></div>
                </div>
                <div style={{ fontSize:10, color:DL.text.muted, marginBottom:6 }}>Relations:</div>
                {connEdges.map((e,i) => {
                  const other = e.from===selNode?e.to:e.from;
                  const otherN = GRAPH_NODES.find(n=>n.id===other);
                  return (<div key={i} style={{ display:"flex", alignItems:"center", gap:6, padding:"4px 0", fontSize:10,
                    borderBottom:i<connEdges.length-1?`1px solid rgba(148,163,184,0.05)`:"none" }}>
                    <span style={{ color:DL.fate.graph }}>→</span>
                    <span style={{ color:DL.text.primary, fontWeight:600 }}>{otherN?.label}</span>
                    <span style={{ color:DL.text.dim, fontFamily:"'JetBrains Mono',monospace", fontSize:9, marginLeft:"auto" }}>w={e.weight}</span>
                  </div>);
                })}
              </GlassCard>
            );
          })() : <GlassCard style={{ padding:16, textAlign:"center" }}><p style={{ fontSize:11, color:DL.text.muted }}>Cliquez un nœud pour explorer</p></GlassCard>}
          <GlassCard style={{ padding:14 }}>
            <div style={{ fontSize:10, color:DL.text.muted, marginBottom:8, fontFamily:"'JetBrains Mono',monospace" }}>LÉGENDE</div>
            {Object.entries(typeColors).map(([type,col]) => (
              <div key={type} style={{ display:"flex", alignItems:"center", gap:6, marginBottom:3 }}>
                <span style={{ width:10, height:10, borderRadius:"50%", background:col }} />
                <span style={{ fontSize:10, color:DL.text.secondary, textTransform:"capitalize" }}>{type}</span>
              </div>
            ))}
          </GlassCard>
          <GlassCard style={{ padding:14 }}>
            <div style={{ fontSize:10, color:DL.text.muted, marginBottom:6, fontFamily:"'JetBrains Mono',monospace" }}>TOP HUBS</div>
            {GRAPH_NODES.sort((a,b)=>b.hubScore-a.hubScore).slice(0,4).map(n => (
              <div key={n.id} style={{ display:"flex", justifyContent:"space-between", padding:"4px 0" }}>
                <span style={{ fontSize:11, color:DL.text.primary }}>{n.label}</span>
                <span style={{ fontSize:12, fontWeight:800, color:typeColors[n.type], fontFamily:"'JetBrains Mono',monospace" }}>{n.hubScore}</span>
              </div>
            ))}
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// CLASSIFICATION: EXCLUSIVITY TIERS
// ═══════════════════════════════════════════════════════════════════════════
const ExclusivityView = () => {
  const tiers = ["commodity","differentiated","proprietary","synthetic"];
  const tierLabels = { commodity:"Tier 1 · Commodity", differentiated:"Tier 2 · Differentiated", proprietary:"Tier 3 · Proprietary", synthetic:"Tier 4 · Synthetic" };
  const tierDesc = { commodity:"Données publiques — tous les concurrents", differentiated:"Enrichies avec angle unique", proprietary:"Terrain exclusif VECTRYS", synthetic:"Croisement IA multi-signaux" };

  return (
    <div>
      <SectionTitle icon="💎" title="Exclusivity Tiers" subtitle="Pricing exponentiel — Commodity (×1) → Synthetic (×22)" />
      <GlassCard style={{ padding:20, marginBottom:20 }}>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={EXCLUSIVITY_ASSETS.sort((a,b)=>b.priceMultiplier-a.priceMultiplier)}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.06)" />
            <XAxis dataKey="name" tick={{ fontSize:7, fill:DL.text.muted }} angle={-15} textAnchor="end" height={55} />
            <YAxis tick={{ fontSize:9, fill:DL.text.muted }} />
            <Tooltip contentStyle={{ background:DL.surface, border:`1px solid ${DL.glassBorder}`, borderRadius:8 }} formatter={v=>[`×${v}`,"Multi."]} />
            <Bar dataKey="priceMultiplier" radius={[6,6,0,0]}>
              {EXCLUSIVITY_ASSETS.sort((a,b)=>b.priceMultiplier-a.priceMultiplier).map((a,i)=><Cell key={i} fill={TIER_COLORS[a.tier]} fillOpacity={0.8} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </GlassCard>
      {tiers.map(tier => {
        const assets = EXCLUSIVITY_ASSETS.filter(a=>a.tier===tier);
        if(!assets.length) return null;
        return (
          <div key={tier} style={{ marginBottom:20 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
              <div style={{ width:12, height:12, borderRadius:3, background:TIER_COLORS[tier] }} />
              <span style={{ fontSize:14, fontWeight:700, color:DL.text.primary }}>{tierLabels[tier]}</span>
              <span style={{ fontSize:10, color:DL.text.muted }}>— {tierDesc[tier]}</span>
            </div>
            {assets.map(a => (
              <GlassCard key={a.name} style={{ padding:14, borderLeft:`3px solid ${TIER_COLORS[a.tier]}`, marginBottom:8 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:DL.text.primary, marginBottom:4 }}>{a.name}</div>
                    {a.competitors.length>0 ?
                      <span style={{ fontSize:9, color:DL.text.dim }}>Concurrents: {a.competitors.join(", ")}</span> :
                      <Pill bg={DL.fate.tribe+"12"} color={DL.fate.tribe} border={DL.fate.tribe+"25"} style={{ fontSize:8 }}>Aucun concurrent</Pill>}
                    <div style={{ fontSize:9, color:DL.text.muted, marginTop:4 }}>Moat: {a.moat}</div>
                  </div>
                  <div style={{ display:"flex", gap:16, alignItems:"center" }}>
                    <ScoreRing score={a.uniqueness} size={40} thickness={3} color={TIER_COLORS[a.tier]} />
                    <div style={{ textAlign:"center" }}>
                      <div style={{ fontSize:8, color:DL.text.muted }}>MULTI.</div>
                      <div style={{ fontSize:22, fontWeight:800, color:DL.fate.emotion, fontFamily:"'JetBrains Mono',monospace" }}>×{a.priceMultiplier}</div>
                    </div>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        );
      })}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// CLASSIFICATION: REGULATORY LEVERAGE
// ═══════════════════════════════════════════════════════════════════════════
const RegulatoryView = () => {
  const totalPremium = REGULATORY_ASSETS.reduce((s,r)=>s+r.premium,0);
  const demandColors = { haute:DL.fate.tribe, croissante:DL.fate.emotion, "émergente":DL.fate.predict };
  return (
    <div>
      <SectionTitle icon="⚖️" title="Regulatory Leverage" subtitle="Datasets compliance-ready — Prime 22-45% sur le prix standard" />
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:20 }}>
        {[{l:"RÉGULATIONS",v:REGULATORY_ASSETS.length,c:DL.fate.regulatory},{l:"PRIME MOY.",v:`+${Math.round(totalPremium/REGULATORY_ASSETS.length)}%`,c:DL.fate.emotion},
          {l:"DEMANDE ↑",v:`${REGULATORY_ASSETS.filter(r=>r.demand==="croissante"||r.demand==="émergente").length}/${REGULATORY_ASSETS.length}`,c:DL.fate.tribe}
        ].map(k => (
          <GlassCard key={k.l} style={{ padding:14, textAlign:"center" }}>
            <div style={{ fontSize:9, color:DL.text.muted, fontFamily:"'JetBrains Mono',monospace" }}>{k.l}</div>
            <div style={{ fontSize:28, fontWeight:800, color:k.c, fontFamily:"'JetBrains Mono',monospace" }}>{k.v}</div>
          </GlassCard>
        ))}
      </div>
      {REGULATORY_ASSETS.map((r,i) => (
        <GlassCard key={i} style={{ padding:16, borderLeft:`3px solid ${DL.fate.regulatory}`, marginBottom:10 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
            <div style={{ flex:1 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                <span style={{ fontSize:14, fontWeight:800, color:DL.fate.regulatory }}>{r.regulation}</span>
                <Pill bg={(demandColors[r.demand]||DL.text.muted)+"12"} color={demandColors[r.demand]||DL.text.muted}>Demande {r.demand}</Pill>
              </div>
              <div style={{ fontSize:12, color:DL.text.primary, fontWeight:600, marginBottom:4 }}>{r.need}</div>
              <div style={{ fontSize:11, color:DL.text.secondary, marginBottom:6 }}>Dataset: {r.dataset}</div>
              <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                {r.clients.map(c=><Pill key={c} bg={DL.fate.authority+"10"} color={DL.fate.authority} border={DL.fate.authority+"20"} style={{ fontSize:8 }}>{c}</Pill>)}
              </div>
            </div>
            <div style={{ display:"flex", gap:16, marginLeft:20 }}>
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:8, color:DL.text.muted }}>PRIME</div>
                <div style={{ fontSize:22, fontWeight:800, color:DL.fate.emotion, fontFamily:"'JetBrains Mono',monospace" }}>+{r.premium}%</div>
              </div>
              <div style={{ textAlign:"center", maxWidth:120 }}>
                <div style={{ fontSize:8, color:DL.text.muted }}>RISQUE SANS</div>
                <div style={{ fontSize:11, color:DL.fate.focus, fontWeight:600, marginTop:2 }}>{r.risk}</div>
              </div>
            </div>
          </div>
        </GlassCard>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// CLASSIFICATION: COMPOSITE INDICES
// ═══════════════════════════════════════════════════════════════════════════
const CompositeView = () => {
  const [selIdx, setSelIdx] = useState(COMPOSITE_INDICES[0].id);
  const totalARR = COMPOSITE_INDICES.reduce((s,i)=>s+i.revenueAnnual,0);
  const totalSubs = COMPOSITE_INDICES.reduce((s,i)=>s+i.subscribers,0);
  const cur = COMPOSITE_INDICES.find(i=>i.id===selIdx);

  return (
    <div>
      <SectionTitle icon="📊" title="Composite Indices" subtitle="Indices propriétaires VECTRYS — Références marché par abonnement" />
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:20 }}>
        {[{l:"INDICES",v:COMPOSITE_INDICES.length,c:DL.fate.composite},{l:"ABONNÉS",v:totalSubs,c:DL.fate.authority},
          {l:"ARR INDICES",v:`${(totalARR/1000000).toFixed(1)}M€`,c:DL.fate.emotion},{l:"ARPU",v:`${Math.round(totalARR/totalSubs/12)}€`,c:DL.fate.tribe}
        ].map(k => (
          <GlassCard key={k.l} style={{ padding:14, textAlign:"center" }}>
            <div style={{ fontSize:9, color:DL.text.muted, fontFamily:"'JetBrains Mono',monospace" }}>{k.l}</div>
            <div style={{ fontSize:24, fontWeight:800, color:k.c, fontFamily:"'JetBrains Mono',monospace" }}>{k.v}</div>
          </GlassCard>
        ))}
      </div>
      <div style={{ display:"flex", gap:6, marginBottom:16 }}>
        {COMPOSITE_INDICES.map(idx => (
          <TabButton key={idx.id} active={selIdx===idx.id} onClick={()=>setSelIdx(idx.id)} color={DL.fate.composite}>
            {idx.id} · {idx.name.split(" ").pop()}
          </TabButton>
        ))}
      </div>
      {cur && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
          <GlassCard style={{ padding:20 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
              <div>
                <div style={{ fontSize:10, color:DL.fate.composite, fontFamily:"'JetBrains Mono',monospace", letterSpacing:2, marginBottom:4 }}>{cur.id}</div>
                <div style={{ fontSize:18, fontWeight:800, color:DL.text.primary }}>{cur.name}</div>
                <p style={{ fontSize:11, color:DL.text.secondary, marginTop:4 }}>{cur.description}</p>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:32, fontWeight:800, color:DL.fate.composite, fontFamily:"'JetBrains Mono',monospace" }}>{cur.currentValue}</div>
                <div style={{ fontSize:10, color:DL.fate.tribe }}>▲ +{(cur.currentValue-cur.trend[0]).toFixed(1)} pts</div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={150}>
              <AreaChart data={cur.trend.map((v,i)=>({month:`M-${7-i}`,value:v}))}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.06)" />
                <XAxis dataKey="month" tick={{ fontSize:9, fill:DL.text.muted }} />
                <YAxis domain={['auto','auto']} tick={{ fontSize:9, fill:DL.text.muted }} />
                <ReferenceLine y={cur.benchmark.marche} stroke={DL.text.muted} strokeDasharray="4 4" label={{value:`Marché: ${cur.benchmark.marche}`,fontSize:8,fill:DL.text.muted}} />
                <Area type="monotone" dataKey="value" stroke={DL.fate.composite} fill={DL.fate.composite} fillOpacity={0.1} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
            <div style={{ display:"flex", gap:12, marginTop:12 }}>
              {[{l:"MARCHÉ",v:cur.benchmark.marche,c:DL.text.secondary},{l:"TOP 10%",v:cur.benchmark.top10,c:DL.fate.tribe},
                {l:"ABONNÉS",v:cur.subscribers,c:DL.fate.authority},{l:"PRIX/MOIS",v:`${cur.priceMonth}€`,c:DL.fate.emotion}
              ].map(k => (
                <div key={k.l} style={{ flex:1, background:DL.elevated, padding:10, borderRadius:8, textAlign:"center" }}>
                  <div style={{ fontSize:8, color:DL.text.muted }}>{k.l}</div>
                  <div style={{ fontSize:16, fontWeight:800, color:k.c, fontFamily:"'JetBrains Mono',monospace" }}>{k.v}</div>
                </div>
              ))}
            </div>
          </GlassCard>
          <GlassCard style={{ padding:20 }}>
            <div style={{ fontSize:12, fontWeight:700, color:DL.text.primary, marginBottom:16 }}>Composition de l'indice</div>
            <ResponsiveContainer width="100%" height={180}>
              <RadarChart data={cur.components}>
                <PolarGrid stroke="rgba(148,163,184,0.08)" />
                <PolarAngleAxis dataKey="name" tick={{ fontSize:9, fill:DL.text.secondary }} />
                <PolarRadiusAxis domain={[0,100]} tick={{ fontSize:8, fill:DL.text.muted }} />
                <Radar name="Score" dataKey="value" stroke={DL.fate.composite} fill={DL.fate.composite} fillOpacity={0.15} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
            {cur.components.map(c => (
              <div key={c.name} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                <span style={{ fontSize:10, color:DL.text.secondary, minWidth:90 }}>{c.name}</span>
                <ProgressBar value={c.value} color={c.value>=80?DL.fate.tribe:c.value>=60?DL.fate.emotion:DL.fate.focus} height={5} />
                <span style={{ fontSize:10, fontFamily:"'JetBrains Mono',monospace", color:DL.text.muted, minWidth:28 }}>{c.weight}%</span>
                <span style={{ fontSize:11, fontWeight:700, fontFamily:"'JetBrains Mono',monospace",
                  color:c.value>=80?DL.fate.tribe:c.value>=60?DL.fate.emotion:DL.fate.focus, minWidth:28 }}>{c.value}</span>
              </div>
            ))}
            <div style={{ marginTop:12, padding:10, background:DL.elevated, borderRadius:8, textAlign:"center" }}>
              <div style={{ fontSize:8, color:DL.text.muted }}>REVENUE ANNUEL</div>
              <div style={{ fontSize:20, fontWeight:800, color:DL.fate.emotion, fontFamily:"'JetBrains Mono',monospace" }}>{(cur.revenueAnnual/1000).toFixed(0)}K€</div>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT — VECTRYS COMMAND CENTER v5.0 UNIFIED
// ═══════════════════════════════════════════════════════════════════════════
export default function VECTRYSCommandCenter() {
  const [activeTab, setActiveTab] = useState("assets");
  const [selectedAsset, setSelectedAsset] = useState(null);

  const gData = Math.round(DATA_ASSETS.reduce((s,a)=>s+a.score,0)/DATA_ASSETS.length);
  const gArchi = Math.round(100-(VIOLATIONS.filter(v=>v.severity==="CRITICAL"||v.severity==="HIGH").length*12));
  const gQuality = Math.round(QUALITY_DIMENSIONS.reduce((s,d)=>s+d.score,0)/QUALITY_DIMENSIONS.length);
  const gCompliance = Math.round(COMPLIANCE_REGS.reduce((s,r)=>s+r.score,0)/COMPLIANCE_REGS.length);
  const totalRev = DATA_ASSETS.reduce((s,a)=>s+a.revenue,0);
  const totalBV = SIGNAL_BUNDLES.reduce((s,b)=>s+b.valueBundled,0);
  const totalARR = COMPOSITE_INDICES.reduce((s,i)=>s+i.revenueAnnual,0);

  const TABS = [
    ["assets","📊 Data Assets",DATA_ASSETS.length,DL.fate.authority],
    ["architecture","🏗 Architecture",VIOLATIONS.length,DL.fate.focus],
    ["predictive","🔮 Prédictif",ANOMALIES.length,DL.fate.predict],
    ["quality","✨ Qualité",QUALITY_RULES.filter(r=>r.status==="failing").length||null,DL.fate.quality],
    ["pipelines","🔄 Pipelines",PIPELINES.filter(p=>p.status==="error").length||null,DL.fate.pipeline],
    ["insights","🧠 Insights IA",AI_INSIGHTS.filter(i=>i.priority==="critical"||i.priority==="high").length,DL.fate.insight],
    ["analytics","📈 Analytics",null,DL.fate.emotion],
    ["compliance","🛡 Compliance",COMPLIANCE_REGS.reduce((s,r)=>s+r.critical,0)||null,DL.fate.tribe],
    ["sep1","─────",null,null],
    ["maturity","🧬 Maturity",null,DL.fate.maturity],
    ["signal","📡 Signal Bundles",null,DL.fate.signal],
    ["decay","⏳ Decay Curves",null,DL.fate.decay],
    ["graph","🕸 Knowledge Graph",null,DL.fate.graph],
    ["exclusivity","💎 Exclusivity",null,DL.fate.exclusivity],
    ["regulatory","⚖️ Regulatory",null,DL.fate.regulatory],
    ["composite","📊 Indices",null,DL.fate.composite],
  ];

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", background:DL.void, color:DL.text.primary, minHeight:"100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700;800&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        ::-webkit-scrollbar { width:6px; }
        ::-webkit-scrollbar-track { background:${DL.void}; }
        ::-webkit-scrollbar-thumb { background:rgba(148,163,184,0.15); border-radius:3px; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
      `}</style>

      {/* HEADER */}
      <header style={{ padding:"24px 32px", borderBottom:`1px solid ${DL.glassBorder}`,
        background:`linear-gradient(180deg, ${DL.deep} 0%, ${DL.void} 100%)` }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:DL.fate.emotion, letterSpacing:3, fontWeight:700 }}>VECTRYS</span>
              <span style={{ width:4, height:4, borderRadius:"50%", background:DL.fate.emotion }} />
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:DL.text.muted, letterSpacing:2 }}>COMMAND CENTER v5.0 UNIFIED</span>
            </div>
            <h1 style={{ fontSize:26, fontWeight:800, background:DL.gradient.gold,
              WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", letterSpacing:-0.5 }}>
              Data Intelligence & Classification Platform
            </h1>
            <p style={{ fontSize:11, color:DL.text.muted, marginTop:4 }}>
              15 modules · Analytics · Prédictions · Qualité · ETL · Insights IA · 7 Classification Engines · Compliance
            </p>
          </div>
          <div style={{ display:"flex", gap:14 }}>
            <ScoreRing score={gData} size={50} thickness={3.5} label="DATA" color={DL.fate.authority} />
            <ScoreRing score={gArchi} size={50} thickness={3.5} label="ARCHI" color={DL.fate.focus} />
            <ScoreRing score={gQuality} size={50} thickness={3.5} label="QUALITÉ" color={DL.fate.quality} />
            <ScoreRing score={gCompliance} size={50} thickness={3.5} label="COMPL." color={DL.fate.tribe} />
          </div>
        </div>
        <div style={{ display:"flex", gap:16, marginTop:16, flexWrap:"wrap" }}>
          {[{l:"Revenue pot.",v:`${(totalRev/1000).toFixed(1)}K€/m`,c:DL.fate.emotion},
            {l:"Bundle value",v:`${(totalBV/1000).toFixed(0)}K€`,c:DL.fate.signal},
            {l:"Index ARR",v:`${(totalARR/1e6).toFixed(1)}M€`,c:DL.fate.composite},
            {l:"Pipelines",v:`${PIPELINES.filter(p=>p.status==="healthy"||p.status==="running").length}/${PIPELINES.length}`,c:DL.fate.pipeline},
            {l:"Violations",v:VIOLATIONS.length,c:DL.fate.focus},
            {l:"Insights",v:AI_INSIGHTS.length,c:DL.fate.insight},
          ].map(k => (
            <div key={k.l} style={{ display:"flex", alignItems:"center", gap:6 }}>
              <span style={{ width:5, height:5, borderRadius:"50%", background:k.c }} />
              <span style={{ fontSize:9, color:DL.text.muted, fontFamily:"'JetBrains Mono',monospace" }}>{k.l}:</span>
              <span style={{ fontSize:11, fontWeight:700, color:k.c, fontFamily:"'JetBrains Mono',monospace" }}>{k.v}</span>
            </div>
          ))}
        </div>
      </header>

      {/* MAIN */}
      <main style={{ padding:"24px 32px", maxWidth:1440, margin:"0 auto" }}>
        <div style={{ display:"flex", gap:3, marginBottom:24, borderBottom:`1px solid ${DL.glassBorder}`, paddingBottom:12, flexWrap:"wrap" }}>
          {TABS.map(([key,label,count,color]) => {
            if (key.startsWith("sep")) return <div key={key} style={{ display:"flex", alignItems:"center", padding:"0 6px" }}>
              <span style={{ fontSize:9, color:DL.text.dim, fontFamily:"'JetBrains Mono',monospace" }}>│</span></div>;
            return <TabButton key={key} active={activeTab===key} onClick={()=>setActiveTab(key)} count={count} color={color}>{label}</TabButton>;
          })}
        </div>
        <div style={{ animation:"fadeIn 0.3s ease" }}>
          {activeTab==="assets" && <DataAssetsView assets={DATA_ASSETS} onSelect={setSelectedAsset} selectedId={selectedAsset} />}
          {activeTab==="architecture" && <ArchitectureView />}
          {activeTab==="predictive" && <PredictiveView />}
          {activeTab==="quality" && <DataQualityView />}
          {activeTab==="pipelines" && <PipelineView />}
          {activeTab==="insights" && <InsightsView />}
          {activeTab==="analytics" && <AnalyticsView assets={DATA_ASSETS} />}
          {activeTab==="compliance" && <ComplianceView assets={DATA_ASSETS} />}
          {activeTab==="maturity" && <MaturityView />}
          {activeTab==="signal" && <SignalView />}
          {activeTab==="decay" && <DecayView />}
          {activeTab==="graph" && <GraphView />}
          {activeTab==="exclusivity" && <ExclusivityView />}
          {activeTab==="regulatory" && <RegulatoryView />}
          {activeTab==="composite" && <CompositeView />}
        </div>
      </main>

      {/* FOOTER */}
      <footer style={{ borderTop:`1px solid ${DL.glassBorder}`, padding:"20px 32px", textAlign:"center", marginTop:40 }}>
        <p style={{ fontSize:11, color:DL.text.dim }}>VECTRYS Command Center v5.0 — Unified Data Intelligence & Classification Platform</p>
        <p style={{ fontSize:9, color:DL.text.muted, marginTop:4 }}>
          8 modules core (Assets · Architecture · Prédictif · Qualité · ETL · Insights · Analytics · Compliance) + 7 Classification Engines (Maturity · Signal · Decay · Graph · Exclusivity · Regulatory · Indices)
        </p>
        <p style={{ fontSize:8, color:DL.text.dim, marginTop:4 }}>
          ⚠️ Outil de pilotage stratégique. Conformité RGPD, Data Act (UE 2023/2854), IA Act (UE 2024/1689). Validation juridique requise avant monétisation.
        </p>
      </footer>
    </div>
  );
}
