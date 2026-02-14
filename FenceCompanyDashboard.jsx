import { useState, useMemo } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart, ComposedChart } from "recharts";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DEFAULT_MONTH_PCT = [0.09917,0.02976,0.03870,0.05619,0.05136,0.07146,0.16601,0.10298,0.11272,0.10247,0.09222,0.07685];
const PROD_DAYS = [22,20,20,22,21,19,21,19,20,20,18,22];

const DEFAULT_STATE = {
  overheadPct: 32, materialsPct: 40, revenuePerManHour: 145, commissionPct: 7,
  jobSuppliesPct: 2.5, nonDirectLaborPct: 2.0, teamMembers: 14, totalManHours: 11500,
  monthRevPct: [...DEFAULT_MONTH_PCT],
  crewsByMonth: [1,1,1,2.5,2.5,2.5,2.5,2.5,2.5,2.5,2.5,2.5],
  products: [
    { name: "Vinyl", pct: 22, avgSale: 8250, color: "#3b82f6" },
    { name: "Aluminum", pct: 6, avgSale: 5500, color: "#22c55e" },
    { name: "Wood", pct: 38, avgSale: 14300, color: "#eab308" },
    { name: "Chainlink", pct: 8, avgSale: 10450, color: "#ef4444" },
    { name: "Avimore", pct: 15, avgSale: 14850, color: "#a855f7" },
    { name: "Steel", pct: 1.5, avgSale: 11550, color: "#ec4899" },
    { name: "Bufftech", pct: 6, avgSale: 30800, color: "#06b6d4" },
    { name: "Gate Ops", pct: 1.25, avgSale: 12650, color: "#84cc16" },
    { name: "Prefirt", pct: 1.25, avgSale: 1.1, color: "#f97316" },
  ],
  overhead: {
    rent: 48000, advertising: 140000, insurance: 58000, ohPayroll: 200000,
    utilities: 30000, fuel: 20000, benefits: 42000, leases: 20000,
    repairs: 12000, smallTools: 10000, officeSupplies: 26000, profFees: 12000,
    payrollTaxRate: 13, badDebts: 7500, education: 1500, travel: 2000,
    uniforms: 2500, shopSupplies: 3000, shipping: 300, dumpFees: 500,
    meals: 800, entertainment: 1000, misc: 2000,
  },
  adMonthly: [12000,8000,10000,12000,14000,16000,18000,14000,14000,10000,8000,4000],
  crew: [
    { name: "Kyle Hall", annual: 60000, months: [1,1,1,1,1,1,1,1,1,1,1,1] },
    { name: "David Hall", annual: 52000, months: [0,0,0,0,0,0,1,1,1,1,1,1] },
    { name: "Crew Lead 3", annual: 38000, months: [1,1,1,1,1,1,1,1,1,1,1,1] },
    { name: "Crew Lead 4", annual: 38000, months: [1,1,1,1,1,1,1,1,1,1,1,1] },
    { name: "Installer 5", annual: 38000, months: [1,1,1,1,1,1,1,1,1,1,1,1] },
  ],
  shopManager: { name: "Tom (Shop)", annual: 40000 },
  debt: { blueF150: 9600, ram: 0, emmerLOC: 48000 },
};

function fmt(n) { return n >= 0 ? "$" + Math.round(n).toLocaleString() : "($" + Math.abs(Math.round(n)).toLocaleString() + ")"; }
function fmtK(n) { return n >= 0 ? "$" + (n/1000).toFixed(0) + "K" : "($" + (Math.abs(n)/1000).toFixed(0) + "K)"; }
function fmtPct(n) { return n.toFixed(1) + "%"; }

function KPI({ label, value, subtext, positive }) {
  const isNeg = typeof value === 'string' && value.startsWith('(');
  return (
    <div className={`rounded-xl p-3 ${isNeg ? 'bg-red-50 border border-red-200' : positive ? 'bg-green-50 border border-green-200' : 'bg-white border border-gray-200'}`}>
      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</div>
      <div className={`text-xl font-bold mt-1 ${isNeg ? 'text-red-600' : positive ? 'text-green-600' : 'text-gray-900'}`}>{value}</div>
      {subtext && <div className="text-xs text-gray-400 mt-1">{subtext}</div>}
    </div>
  );
}

function Slider({ label, value, onChange, min, max, step, suffix, prefix }) {
  return (
    <div className="mb-2">
      <div className="flex justify-between items-center mb-0.5">
        <span className="text-xs font-medium text-gray-600">{label}</span>
        <span className="text-xs font-bold text-blue-700">{prefix||""}{typeof value === 'number' ? value.toLocaleString() : value}{suffix||""}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(parseFloat(e.target.value))} className="w-full accent-blue-600" />
    </div>
  );
}

function Section({ title, children, color }) {
  const colors = { blue: "border-blue-500 bg-blue-50", green: "border-green-500 bg-green-50", amber: "border-amber-500 bg-amber-50", red: "border-red-500 bg-red-50", purple: "border-purple-500 bg-purple-50" };
  return (
    <div className={`border-l-4 ${colors[color||'blue']} rounded-r-xl p-4 mb-3`}>
      <h3 className="font-bold text-sm text-gray-800 mb-2">{title}</h3>
      {children}
    </div>
  );
}

export default function FenceCompanyDashboard() {
  const [s, setS] = useState(DEFAULT_STATE);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showStrategy, setShowStrategy] = useState(false);
  const update = (key, val) => setS(prev => ({ ...prev, [key]: val }));
  const updateOH = (key, val) => setS(prev => ({ ...prev, overhead: { ...prev.overhead, [key]: val } }));

  const calc = useMemo(() => {
    const oh = s.overhead;
    const directLabor = s.crew.reduce((sum, c) => sum + c.annual, 0) + s.shopManager.annual;
    const payrollTaxes = directLabor * (oh.payrollTaxRate / 100);
    const totalOverhead = oh.rent + oh.advertising + oh.insurance + oh.ohPayroll + oh.utilities + oh.fuel + oh.benefits + oh.leases + oh.repairs + oh.smallTools + oh.officeSupplies + oh.profFees + oh.badDebts + oh.education + oh.travel + oh.uniforms + oh.shopSupplies + oh.shipping + oh.dumpFees + oh.meals + oh.entertainment + oh.misc + payrollTaxes;
    const revenueGoal = totalOverhead / (s.overheadPct / 100);
    const totalCOGSLabor = directLabor + (revenueGoal * s.commissionPct / 100);
    const laborPct = (totalCOGSLabor / revenueGoal) * 100;
    const netProfitPct = 100 - s.overheadPct - laborPct - s.materialsPct;
    const netProfitDollars = revenueGoal * netProfitPct / 100;
    const materialsDollars = revenueGoal * s.materialsPct / 100;
    const grossMarginPct = 100 - laborPct - s.materialsPct - s.jobSuppliesPct - s.nonDirectLaborPct;
    const cogsTotal = revenueGoal * (laborPct + s.materialsPct + s.jobSuppliesPct + s.nonDirectLaborPct) / 100;
    const grossMargin = revenueGoal - cogsTotal;
    const numProjects = s.products.reduce((sum, p) => sum + (p.avgSale > 1 ? (revenueGoal * p.pct / 100) / p.avgSale : 0), 0);
    const avgSale = numProjects > 0 ? revenueGoal / numProjects : 0;

    const monthTotal = s.monthRevPct.reduce((a,b)=>a+b,0);
    const monthly = MONTHS.map((m, i) => {
      const revPct = s.monthRevPct[i] / monthTotal;
      const revenue = revenueGoal * revPct;
      const cogs = revenue * (laborPct + s.materialsPct + s.jobSuppliesPct + s.nonDirectLaborPct) / 100;
      const gm = revenue - cogs;
      const ohMonthly = totalOverhead * revPct - oh.advertising * revPct + s.adMonthly[i];
      return { month: m, revenue, cogs, grossMargin: gm, overhead: ohMonthly, netProfit: gm - ohMonthly, prodDays: PROD_DAYS[i], crews: s.crewsByMonth[i] };
    });
    let cum = 0; monthly.forEach(m => { cum += m.netProfit; m.cumProfit = cum; });
    const agg = ms => ({ revenue: ms.reduce((a,m)=>a+m.revenue,0), grossMargin: ms.reduce((a,m)=>a+m.grossMargin,0), netProfit: ms.reduce((a,m)=>a+m.netProfit,0) });
    const quarters = [{q:"Q1",...agg(monthly.slice(0,3))},{q:"Q2",...agg(monthly.slice(3,6))},{q:"Q3",...agg(monthly.slice(6,9))},{q:"Q4",...agg(monthly.slice(9,12))}];
    const productData = s.products.map(p => ({ name: p.name, value: Math.round(revenueGoal*p.pct/100), pct: p.pct, projects: p.avgSale>1?Math.round(revenueGoal*p.pct/100/p.avgSale):0, color: p.color }));
    const overheadBreakdown = [
      {name:"OH Payroll",value:oh.ohPayroll},{name:"Advertising",value:oh.advertising},{name:"Insurance",value:oh.insurance},{name:"Rent",value:oh.rent},{name:"Benefits",value:oh.benefits},{name:"Utilities",value:oh.utilities},{name:"Payroll Tax",value:Math.round(payrollTaxes)},{name:"Office",value:oh.officeSupplies},{name:"Fuel",value:oh.fuel},{name:"Leases",value:oh.leases},{name:"Repairs",value:oh.repairs},{name:"Tools",value:oh.smallTools},{name:"Other",value:oh.profFees+oh.badDebts+oh.education+oh.travel+oh.uniforms+oh.shopSupplies+oh.shipping+oh.dumpFees+oh.meals+oh.entertainment+oh.misc}
    ].sort((a,b)=>b.value-a.value);
    const debtService = s.debt.blueF150 + s.debt.ram + s.debt.emmerLOC;
    const prev2025 = { revenue: 1951097, netProfit: -254809, overheadPct: 37, materialsPct: 39, projects: 177 };
    return { revenueGoal, totalOverhead, totalCOGSLabor, laborPct, netProfitPct, netProfitDollars, materialsDollars, grossMarginPct, grossMargin, cogsTotal, numProjects, avgSale, monthly, quarters, productData, overheadBreakdown, debtService, cashAfterDebt: netProfitDollars-debtService, directLabor, payrollTaxes, prev2025 };
  }, [s]);

  const tabs = [{id:"dashboard",label:"Dashboard"},{id:"monthly",label:"Monthly"},{id:"products",label:"Products"},{id:"overhead",label:"Overhead"},{id:"crew",label:"Crew"}];

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white px-4 py-3">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div><h1 className="text-xl font-bold">The Fence Company</h1><p className="text-blue-200 text-xs">2026 Budget Matrix Dashboard</p></div>
          <div className="flex items-center gap-3">
            <div className={`px-3 py-1.5 rounded-full text-sm font-bold ${calc.netProfitDollars>=0?'bg-green-500':'bg-red-500'}`}>Net: {fmt(calc.netProfitDollars)}</div>
            <div className="text-right text-sm"><div className="text-blue-200 text-xs">Revenue Target</div><div className="text-lg font-bold">{fmt(calc.revenueGoal)}</div></div>
          </div>
        </div>
      </div>
      <div className="bg-white border-b sticky top-0 z-10"><div className="max-w-7xl mx-auto flex">
        {tabs.map(t => <button key={t.id} onClick={()=>setActiveTab(t.id)} className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab===t.id?'border-blue-600 text-blue-600':'border-transparent text-gray-500 hover:text-gray-700'}`}>{t.label}</button>)}
      </div></div>

      <div className="max-w-7xl mx-auto p-4">
        {activeTab==="dashboard" && (
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-4 space-y-3">
              <Section title="Key Business Levers" color="blue">
                <Slider label="Overhead %" value={s.overheadPct} onChange={v=>update('overheadPct',v)} min={25} max={45} step={0.5} suffix="%" />
                <Slider label="Materials %" value={s.materialsPct} onChange={v=>update('materialsPct',v)} min={25} max={50} step={0.5} suffix="%" />
                <Slider label="Revenue / Man Hour" value={s.revenuePerManHour} onChange={v=>update('revenuePerManHour',v)} min={100} max={200} step={5} prefix="$" />
                <Slider label="Commission %" value={s.commissionPct} onChange={v=>update('commissionPct',v)} min={3} max={12} step={0.5} suffix="%" />
                <Slider label="Job Supplies %" value={s.jobSuppliesPct} onChange={v=>update('jobSuppliesPct',v)} min={1} max={5} step={0.25} suffix="%" />
              </Section>
              <Section title="4 Buckets Breakdown" color="green">
                <div className="space-y-2">
                  {[{label:"Overhead",pct:s.overheadPct,val:calc.totalOverhead,color:"bg-blue-500"},{label:"Labor & Comm.",pct:calc.laborPct,val:calc.totalCOGSLabor,color:"bg-amber-500"},{label:"Materials",pct:s.materialsPct,val:calc.materialsDollars,color:"bg-red-500"},{label:"Net Profit",pct:calc.netProfitPct,val:calc.netProfitDollars,color:calc.netProfitPct>=0?"bg-green-500":"bg-red-600"}].map(b=>
                    <div key={b.label}><div className="flex justify-between text-xs mb-1"><span className="font-medium">{b.label}</span><span>{fmtPct(b.pct)} = {fmt(b.val)}</span></div><div className="w-full bg-gray-200 rounded-full h-2"><div className={`${b.color} h-2 rounded-full transition-all`} style={{width:`${Math.max(0,Math.min(100,b.pct))}%`}}/></div></div>
                  )}
                </div>
              </Section>
              <Section title="2025 vs 2026" color="purple">
                <div className="space-y-1.5 text-xs">
                  {[{label:"Revenue",v25:calc.prev2025.revenue,v26:calc.revenueGoal},{label:"Net Profit",v25:calc.prev2025.netProfit,v26:calc.netProfitDollars},{label:"Overhead %",v25:calc.prev2025.overheadPct,v26:s.overheadPct,isPct:true},{label:"Materials %",v25:calc.prev2025.materialsPct,v26:s.materialsPct,isPct:true},{label:"Projects",v25:calc.prev2025.projects,v26:Math.round(calc.numProjects),isNum:true}].map(r=>
                    <div key={r.label} className="flex justify-between items-center">
                      <span className="text-gray-600 w-20">{r.label}</span>
                      <span className="text-gray-400 w-20 text-right">{r.isPct?fmtPct(r.v25):r.isNum?r.v25:fmt(r.v25)}</span>
                      <span className="text-gray-900 font-medium w-20 text-right">{r.isPct?fmtPct(r.v26):r.isNum?Math.round(r.v26):fmt(r.v26)}</span>
                      <span className={`w-16 text-right font-bold ${(r.isPct?r.v26<r.v25:r.v26>r.v25)?'text-green-600':'text-red-600'}`}>{r.isPct?(r.v26-r.v25).toFixed(1)+"pp":r.isNum?(r.v26-r.v25>0?"+":"")+(r.v26-r.v25):(r.v26-r.v25>=0?"+":"")+fmtK(r.v26-r.v25)}</span>
                    </div>
                  )}
                </div>
              </Section>
            </div>
            <div className="col-span-8 space-y-4">
              <div className="grid grid-cols-4 gap-3">
                <KPI label="Revenue Goal" value={fmt(calc.revenueGoal)} subtext={Math.round(calc.numProjects)+" projects @ "+fmt(calc.avgSale)+" avg"} />
                <KPI label="Gross Margin" value={fmt(calc.grossMargin)} subtext={fmtPct(calc.grossMarginPct)} positive={calc.grossMarginPct>30} />
                <KPI label="Total Overhead" value={fmt(calc.totalOverhead)} subtext={fmtPct(s.overheadPct)} />
                <KPI label="Net Profit" value={fmt(calc.netProfitDollars)} subtext={fmtPct(calc.netProfitPct)} positive={calc.netProfitDollars>0} />
              </div>
              <div className="bg-white rounded-xl border p-4">
                <h3 className="font-bold text-sm text-gray-800 mb-2">Monthly Revenue vs Net Profit</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <ComposedChart data={calc.monthly}><CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/><XAxis dataKey="month" tick={{fontSize:11}}/><YAxis tickFormatter={fmtK} tick={{fontSize:10}}/><Tooltip formatter={fmt}/><Legend wrapperStyle={{fontSize:11}}/>
                    <Bar dataKey="revenue" name="Revenue" fill="#3b82f6" radius={[4,4,0,0]} opacity={0.7}/>
                    <Bar dataKey="overhead" name="Overhead" fill="#f59e0b" radius={[4,4,0,0]} opacity={0.5}/>
                    <Line dataKey="netProfit" name="Net Profit" stroke="#10b981" strokeWidth={3} dot={{r:4}}/>
                    <Line dataKey="cumProfit" name="Cumulative" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="5 5" dot={false}/>
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {calc.quarters.map(q=><div key={q.q} className={`rounded-xl p-3 border ${q.netProfit>=0?'bg-green-50 border-green-200':'bg-red-50 border-red-200'}`}><div className="text-xs font-bold text-gray-500">{q.q}</div><div className="text-sm font-bold text-gray-900 mt-1">{fmt(q.revenue)}</div><div className={`text-xs font-bold mt-1 ${q.netProfit>=0?'text-green-600':'text-red-600'}`}>Net: {fmt(q.netProfit)}</div><div className="text-xs text-gray-400">GM: {fmt(q.grossMargin)}</div></div>)}
              </div>
              <div className="bg-white rounded-xl border p-4"><h3 className="font-bold text-sm text-gray-800 mb-2">Cash Flow Summary</h3><div className="grid grid-cols-3 gap-4"><div><span className="text-xs text-gray-500">Net Operating Profit</span><div className="text-lg font-bold">{fmt(calc.netProfitDollars)}</div></div><div><span className="text-xs text-gray-500">Debt Service</span><div className="text-lg font-bold text-red-600">{fmt(-calc.debtService)}</div></div><div><span className="text-xs text-gray-500">Cash After Debt</span><div className={`text-lg font-bold ${calc.cashAfterDebt>=0?'text-green-600':'text-red-600'}`}>{fmt(calc.cashAfterDebt)}</div></div></div></div>
            </div>
          </div>
        )}

        {activeTab==="monthly" && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border p-4">
              <h3 className="font-bold text-sm text-gray-800 mb-2">Monthly Revenue Distribution</h3>
              <p className="text-xs text-gray-500 mb-3">Adjust each month's revenue weight using the sliders or type dollar amounts (in thousands). The total always equals your revenue goal.</p>
              <div className="grid grid-cols-12 gap-2">
                {MONTHS.map((m,i)=>{
                  const monthTot = s.monthRevPct.reduce((a,b)=>a+b,0);
                  const normPct = (s.monthRevPct[i]/monthTot*100);
                  const dollarVal = Math.round(calc.revenueGoal * s.monthRevPct[i] / monthTot);
                  return (
                    <div key={m} className="text-center">
                      <div className="text-xs font-bold text-gray-600 mb-1">{m}</div>
                      <input type="number" value={Math.round(dollarVal/1000)} onChange={e=>{
                        const target = (parseInt(e.target.value)||0)*1000;
                        const nm = [...s.monthRevPct];
                        nm[i] = Math.max(0.001, target / calc.revenueGoal);
                        update('monthRevPct', nm);
                      }} className="w-full text-xs text-center border rounded p-1" />
                      <div className="text-xs text-gray-400">{normPct.toFixed(1)}%</div>
                      <input type="range" min={0.005} max={0.30} step={0.005} value={s.monthRevPct[i]} onChange={e=>{const nm=[...s.monthRevPct];nm[i]=parseFloat(e.target.value);update('monthRevPct',nm);}} className="w-full mt-1 accent-blue-600" />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between items-center text-xs mt-2 pt-2 border-t">
                <span className="text-gray-500">Revenue Goal: <strong>{fmt(calc.revenueGoal)}</strong></span>
                <button onClick={()=>update('monthRevPct',[...DEFAULT_MONTH_PCT])} className="text-blue-600 hover:text-blue-800 font-medium">Reset to Default</button>
              </div>
            </div>

            <div className="bg-white rounded-xl border p-4">
              <h3 className="font-bold text-sm text-gray-800 mb-2">Monthly P&L Breakdown</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b-2 border-gray-300">
                      <th className="text-left py-2 px-2 font-bold">Month</th>
                      <th className="text-right py-2 px-2">Revenue</th>
                      <th className="text-right py-2 px-2">COGS</th>
                      <th className="text-right py-2 px-2">Gross Margin</th>
                      <th className="text-right py-2 px-2">GM %</th>
                      <th className="text-right py-2 px-2">Overhead</th>
                      <th className="text-right py-2 px-2 font-bold">Net Profit</th>
                      <th className="text-right py-2 px-2">Cumulative</th>
                      <th className="text-right py-2 px-2">Crews</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calc.monthly.map(m=>
                      <tr key={m.month} className={`border-b ${m.netProfit>=0?'bg-green-50':'bg-red-50'}`}>
                        <td className="py-2 px-2 font-bold">{m.month}</td>
                        <td className="text-right py-2 px-2">{fmt(m.revenue)}</td>
                        <td className="text-right py-2 px-2">{fmt(m.cogs)}</td>
                        <td className="text-right py-2 px-2">{fmt(m.grossMargin)}</td>
                        <td className="text-right py-2 px-2">{m.revenue>0?fmtPct(m.grossMargin/m.revenue*100):'-'}</td>
                        <td className="text-right py-2 px-2">{fmt(m.overhead)}</td>
                        <td className={`text-right py-2 px-2 font-bold ${m.netProfit>=0?'text-green-700':'text-red-700'}`}>{fmt(m.netProfit)}</td>
                        <td className={`text-right py-2 px-2 ${m.cumProfit>=0?'text-green-600':'text-red-600'}`}>{fmt(m.cumProfit)}</td>
                        <td className="text-right py-2 px-2">{m.crews}</td>
                      </tr>
                    )}
                    <tr className="border-t-2 border-gray-800 font-bold bg-gray-100">
                      <td className="py-2 px-2">TOTAL</td>
                      <td className="text-right py-2 px-2">{fmt(calc.revenueGoal)}</td>
                      <td className="text-right py-2 px-2">{fmt(calc.cogsTotal)}</td>
                      <td className="text-right py-2 px-2">{fmt(calc.grossMargin)}</td>
                      <td className="text-right py-2 px-2">{fmtPct(calc.grossMarginPct)}</td>
                      <td className="text-right py-2 px-2">{fmt(calc.totalOverhead)}</td>
                      <td className={`text-right py-2 px-2 ${calc.netProfitDollars>=0?'text-green-700':'text-red-700'}`}>{fmt(calc.netProfitDollars)}</td>
                      <td></td><td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-xl border p-4">
              <h3 className="font-bold text-sm text-gray-800 mb-2">Cumulative Net Profit</h3>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={calc.monthly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                  <XAxis dataKey="month" tick={{fontSize:11}}/>
                  <YAxis tickFormatter={fmtK} tick={{fontSize:10}}/>
                  <Tooltip formatter={fmt}/>
                  <defs><linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/></linearGradient></defs>
                  <Area dataKey="cumProfit" name="Cumulative" stroke="#8b5cf6" fill="url(#cg)" strokeWidth={3}/>
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl border p-4">
              <h3 className="font-bold text-sm text-gray-800 mb-2">Monthly Advertising Budget</h3>
              <div className="grid grid-cols-12 gap-2">
                {MONTHS.map((m,i)=>
                  <div key={m} className="text-center">
                    <div className="text-xs text-gray-500 mb-1">{m}</div>
                    <input type="number" value={s.adMonthly[i]} onChange={e=>{const a=[...s.adMonthly];a[i]=parseInt(e.target.value)||0;update('adMonthly',a);}} className="w-full text-xs text-center border rounded p-1"/>
                  </div>
                )}
              </div>
              <div className="text-right text-xs font-bold text-gray-600 mt-2">Total: {fmt(s.adMonthly.reduce((a,b)=>a+b,0))}</div>
            </div>
          </div>
        )}

        {activeTab==="products" && (
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-5">
              <div className="bg-white rounded-xl border p-4">
                <h3 className="font-bold text-sm text-gray-800 mb-2">Product Mix</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={calc.productData.filter(p=>p.value>0)} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({name,pct})=>name+" "+pct+"%"} labelLine={{strokeWidth:1}} style={{fontSize:10}}>
                      {calc.productData.map((p,i)=><Cell key={i} fill={p.color}/>)}
                    </Pie>
                    <Tooltip formatter={fmt}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="col-span-7">
              <div className="bg-white rounded-xl border p-4">
                <h3 className="font-bold text-sm text-gray-800 mb-2">Product Details</h3>
                <table className="w-full text-xs">
                  <thead><tr className="border-b-2"><th className="text-left py-2">Product</th><th className="text-right py-2">Mix %</th><th className="text-right py-2">Avg Sale</th><th className="text-right py-2">Revenue</th><th className="text-right py-2">Projects</th></tr></thead>
                  <tbody>
                    {s.products.map((p,i)=>
                      <tr key={p.name} className="border-b">
                        <td className="py-2 flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{backgroundColor:p.color}}/>{p.name}</td>
                        <td className="text-right py-2"><input type="number" value={p.pct} step={0.5} min={0} max={100} onChange={e=>{const np=[...s.products];np[i]={...p,pct:parseFloat(e.target.value)||0};update('products',np);}} className="w-14 text-right text-xs border rounded p-1"/>%</td>
                        <td className="text-right py-2"><input type="number" value={p.avgSale} step={100} onChange={e=>{const np=[...s.products];np[i]={...p,avgSale:parseFloat(e.target.value)||0};update('products',np);}} className="w-20 text-right text-xs border rounded p-1"/></td>
                        <td className="text-right py-2 font-medium">{fmt(calc.productData[i]?.value||0)}</td>
                        <td className="text-right py-2">{calc.productData[i]?.projects||0}</td>
                      </tr>
                    )}
                    <tr className="border-t-2 font-bold"><td className="py-2">TOTAL</td><td className="text-right py-2">{s.products.reduce((a,p)=>a+p.pct,0).toFixed(1)}%</td><td className="text-right py-2">{fmt(calc.avgSale)}</td><td className="text-right py-2">{fmt(calc.revenueGoal)}</td><td className="text-right py-2">{Math.round(calc.numProjects)}</td></tr>
                  </tbody>
                </table>
                {Math.abs(s.products.reduce((a,p)=>a+p.pct,0)-100)>0.1&&<div className="mt-2 text-xs text-red-600 font-medium bg-red-50 p-2 rounded">Product mix totals {s.products.reduce((a,p)=>a+p.pct,0).toFixed(1)}% — should be ~99-100%</div>}
              </div>
            </div>
          </div>
        )}

        {activeTab==="overhead" && (
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-5">
              <div className="bg-white rounded-xl border p-4">
                <h3 className="font-bold text-sm text-gray-800 mb-2">Overhead ({fmt(calc.totalOverhead)})</h3>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={calc.overheadBreakdown} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                    <XAxis type="number" tickFormatter={fmtK} tick={{fontSize:10}}/>
                    <YAxis type="category" dataKey="name" tick={{fontSize:10}} width={80}/>
                    <Tooltip formatter={fmt}/>
                    <Bar dataKey="value" fill="#3b82f6" radius={[0,4,4,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="col-span-7 space-y-3">
              <Section title="Major Overhead Items" color="amber">
                <div className="grid grid-cols-2 gap-x-6 gap-y-0">
                  <Slider label="OH Payroll" value={s.overhead.ohPayroll} onChange={v=>updateOH('ohPayroll',v)} min={100000} max={350000} step={5000} prefix="$"/>
                  <Slider label="Advertising" value={s.overhead.advertising} onChange={v=>updateOH('advertising',v)} min={50000} max={250000} step={5000} prefix="$"/>
                  <Slider label="Rent" value={s.overhead.rent} onChange={v=>updateOH('rent',v)} min={30000} max={80000} step={1200} prefix="$"/>
                  <Slider label="Insurance" value={s.overhead.insurance} onChange={v=>updateOH('insurance',v)} min={30000} max={80000} step={1000} prefix="$"/>
                  <Slider label="Benefits" value={s.overhead.benefits} onChange={v=>updateOH('benefits',v)} min={20000} max={70000} step={1000} prefix="$"/>
                  <Slider label="Utilities" value={s.overhead.utilities} onChange={v=>updateOH('utilities',v)} min={15000} max={40000} step={1000} prefix="$"/>
                  <Slider label="Fuel" value={s.overhead.fuel} onChange={v=>updateOH('fuel',v)} min={10000} max={35000} step={1000} prefix="$"/>
                  <Slider label="Leases" value={s.overhead.leases} onChange={v=>updateOH('leases',v)} min={5000} max={40000} step={1000} prefix="$"/>
                  <Slider label="Office" value={s.overhead.officeSupplies} onChange={v=>updateOH('officeSupplies',v)} min={10000} max={40000} step={1000} prefix="$"/>
                  <Slider label="Repairs" value={s.overhead.repairs} onChange={v=>updateOH('repairs',v)} min={5000} max={25000} step={1000} prefix="$"/>
                  <Slider label="Tools" value={s.overhead.smallTools} onChange={v=>updateOH('smallTools',v)} min={3000} max={20000} step={500} prefix="$"/>
                  <Slider label="Bad Debts" value={s.overhead.badDebts} onChange={v=>updateOH('badDebts',v)} min={0} max={20000} step={500} prefix="$"/>
                </div>
              </Section>
              <Section title="Smaller Items" color="green">
                <div className="grid grid-cols-3 gap-x-4 gap-y-0">
                  {[["Prof Fees","profFees",0,25000],["Education","education",0,10000],["Travel","travel",0,10000],["Uniforms","uniforms",0,8000],["Shop Supplies","shopSupplies",0,8000],["Meals","meals",0,5000],["Entertainment","entertainment",0,5000],["Dump Fees","dumpFees",0,3000],["Misc","misc",0,8000]].map(([l,k,mn,mx])=>
                    <Slider key={k} label={l} value={s.overhead[k]} onChange={v=>updateOH(k,v)} min={mn} max={mx} step={250} prefix="$"/>
                  )}
                </div>
              </Section>
            </div>
          </div>
        )}

        {activeTab==="crew" && (
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-7">
              <div className="bg-white rounded-xl border p-4">
                <h3 className="font-bold text-sm text-gray-800 mb-2">Crew Members</h3>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b-2"><th className="text-left py-2">Name</th><th className="text-right py-2">Annual</th><th className="text-center py-2" colSpan={12}>Active Months</th></tr>
                    <tr className="border-b text-gray-400"><th></th><th></th>{MONTHS.map(m=><th key={m} className="text-center py-1 px-0.5">{m.slice(0,1)}</th>)}</tr>
                  </thead>
                  <tbody>
                    {s.crew.map((c,ci)=>
                      <tr key={ci} className="border-b">
                        <td className="py-2"><input value={c.name} onChange={e=>{const nc=[...s.crew];nc[ci]={...c,name:e.target.value};update('crew',nc);}} className="text-xs border rounded p-1 w-28"/></td>
                        <td className="text-right py-2"><input type="number" value={c.annual} step={1000} onChange={e=>{const nc=[...s.crew];nc[ci]={...c,annual:parseInt(e.target.value)||0};update('crew',nc);}} className="text-xs border rounded p-1 w-20 text-right"/></td>
                        {c.months.map((m,mi)=>
                          <td key={mi} className="text-center py-2">
                            <button onClick={()=>{const nc=[...s.crew];const nm=[...c.months];nm[mi]=nm[mi]?0:1;nc[ci]={...c,months:nm};update('crew',nc);}} className={`w-5 h-5 rounded text-xs ${m?'bg-blue-500 text-white':'bg-gray-200'}`}>{m?"Y":""}</button>
                          </td>
                        )}
                      </tr>
                    )}
                    <tr className="border-b bg-blue-50">
                      <td className="py-2 font-medium">{s.shopManager.name}</td>
                      <td className="text-right py-2"><input type="number" value={s.shopManager.annual} step={1000} onChange={e=>update('shopManager',{...s.shopManager,annual:parseInt(e.target.value)||0})} className="text-xs border rounded p-1 w-20 text-right"/></td>
                      {MONTHS.map((_,i)=><td key={i} className="text-center py-2"><div className="w-5 h-5 rounded bg-blue-500 text-white text-xs flex items-center justify-center mx-auto">Y</div></td>)}
                    </tr>
                    <tr className="border-t-2 font-bold"><td className="py-2">TOTAL LABOR</td><td className="text-right py-2">{fmt(calc.directLabor)}</td><td colSpan={12}></td></tr>
                  </tbody>
                </table>
                <div className="mt-3 flex gap-2">
                  <button onClick={()=>update('crew',[...s.crew,{name:"New Hire "+(s.crew.length+1),annual:35000,months:[0,0,0,0,1,1,1,1,1,1,1,0]}])} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700">+ Add Crew</button>
                  {s.crew.length>1&&<button onClick={()=>update('crew',s.crew.slice(0,-1))} className="text-xs bg-red-100 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-200">Remove Last</button>}
                </div>
              </div>
            </div>
            <div className="col-span-5 space-y-3">
              <Section title="Crews / Month" color="blue">
                {MONTHS.map((m,i)=><Slider key={m} label={m} value={s.crewsByMonth[i]} onChange={v=>{const nc=[...s.crewsByMonth];nc[i]=v;update('crewsByMonth',nc);}} min={0} max={6} step={0.5}/>)}
              </Section>
              <Section title="Labor Summary" color="green">
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between"><span>Direct Labor</span><span className="font-bold">{fmt(calc.directLabor)}</span></div>
                  <div className="flex justify-between"><span>Commissions ({s.commissionPct}%)</span><span className="font-bold">{fmt(calc.revenueGoal*s.commissionPct/100)}</span></div>
                  <div className="flex justify-between"><span>Payroll Taxes</span><span className="font-bold">{fmt(calc.payrollTaxes)}</span></div>
                  <div className="flex justify-between border-t pt-2 font-bold"><span>Total Labor</span><span>{fmt(calc.totalCOGSLabor)}</span></div>
                  <div className="flex justify-between"><span>Labor %</span><span className="font-bold">{fmtPct(calc.laborPct)}</span></div>
                </div>
              </Section>
              <Section title="Debt Service" color="red">
                <Slider label="Blue F150" value={s.debt.blueF150} onChange={v=>update('debt',{...s.debt,blueF150:v})} min={0} max={15000} step={600} prefix="$"/>
                <Slider label="Ram" value={s.debt.ram} onChange={v=>update('debt',{...s.debt,ram:v})} min={0} max={10000} step={650} prefix="$"/>
                <Slider label="Emmer LOC" value={s.debt.emmerLOC} onChange={v=>update('debt',{...s.debt,emmerLOC:v})} min={0} max={80000} step={1000} prefix="$"/>
                <div className="text-xs font-bold text-right mt-2">Total: {fmt(calc.debtService)}/yr</div>
              </Section>
            </div>
          </div>
        )}

        <div className="mt-4 mb-4">
          <button onClick={()=>setShowStrategy(!showStrategy)} className="text-sm text-blue-600 hover:text-blue-800 font-medium">{showStrategy?"Hide":"Show"} Strategy Notes</button>
          {showStrategy&&<div className="mt-3 bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-gray-700 space-y-2">
            <p className="font-bold text-blue-800">Key levers to reach profitability in 2026:</p>
            <p><strong>1. Materials:</strong> Every 1% reduction on $2M revenue saves ~$20K. Negotiate bulk pricing, reduce waste.</p>
            <p><strong>2. Revenue per man hour:</strong> $130 to $145+ via better scheduling, less downtime between jobs.</p>
            <p><strong>3. Overhead payroll:</strong> Biggest single overhead item. Can roles be consolidated?</p>
            <p><strong>4. Advertising ROI:</strong> Spend more May-Aug, cut winter. Track cost-per-lead by channel.</p>
            <p><strong>5. Product mix:</strong> Push Avimore and Bufftech for higher margins.</p>
            <p><strong>6. Seasonal cash:</strong> Q1/Q2 losses are normal for fencing. Build reserves from Q3/Q4.</p>
          </div>}
        </div>
      </div>
    </div>
  );
}