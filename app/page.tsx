'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  BarChart3, Bell, Check, ChevronDown, Clipboard, Clock3, FileText,
  Gauge, History, LayoutDashboard, Link2, LogIn, LogOut, Menu, Minus,
  Plus, ReceiptText, Settings2, ShieldCheck, UserRound, Users, Wrench,
} from 'lucide-react';

type View = 'Dashboard' | 'Time Clock' | 'New Invoice' | 'Invoice History' | 'Employees' | 'Reports' | 'Admin Controls';
type Invoice = { id: string; customer: string; date: string; total: number; lines: string[]; message: string };

const services = [
  { id: 'door', name: 'Door', price: 100, unit: '1× Scrap', icon: 'DR' },
  { id: 'window', name: 'Window', price: 60, unit: '1× Glass', icon: 'WN' },
  { id: 'tyre', name: 'Tyre', price: 50, unit: '1× Rubber', icon: 'TY' },
  { id: 'repair-kit', name: 'Advance Repair Kit', price: 700, unit: 'Repair components', icon: 'RK' },
  { id: 'motor-oil', name: 'Motor Oil', price: 700, unit: 'Premium synthetic', icon: 'OL' },
  { id: 'brake-pad', name: 'Brake Pad', price: 400, unit: 'Front or rear set', icon: 'BP' },
  { id: 'tow', name: 'Tow Service', price: 250, unit: 'Citywide recovery', icon: 'TW' },
];

const employees = [
  { name: 'Vex Walker', role: 'Lead Mechanic', week: '34h 20m', month: '138h 10m', status: 'On duty', initials: 'VW', invoices: 42 },
  { name: 'Mila Stone', role: 'Mechanic', week: '29h 05m', month: '121h 44m', status: 'On duty', initials: 'MS', invoices: 31 },
  { name: 'Rico Hale', role: 'Tow Operator', week: '21h 44m', month: '96h 08m', status: 'Off duty', initials: 'RH', invoices: 18 },
  { name: 'Avery Knox', role: 'Apprentice', week: '17h 30m', month: '72h 55m', status: 'Off duty', initials: 'AK', invoices: 12 },
];

const seedInvoices: Invoice[] = [
  { id: 'MP-1846', customer: 'J. Hernandez', date: '02 Sep 2026, 20:42', total: 860, lines: ['2× Door — $200', '1× Window — $60', 'Custom labor: Body alignment — $600'], message: 'Thank you for choosing Mirror Park Mechanics.' },
  { id: 'MP-1845', customer: 'N. Carter', date: '01 Sep 2026, 23:15', total: 950, lines: ['1× Advance Repair Kit — $700', '1× Tow Service — $250'], message: 'Thank you for choosing Mirror Park Mechanics.' },
  { id: 'MP-1844', customer: 'S. Price', date: '01 Sep 2026, 19:08', total: 800, lines: ['1× Motor Oil — $700', '1× Door — $100'], message: 'Thank you for choosing Mirror Park Mechanics.' },
];

const money = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);

function Panel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-[#1e3d48] bg-[#0b1820] shadow-[0_18px_50px_rgba(0,0,0,.16)] ${className}`}>{children}</section>;
}

export default function Home() {
  const [view, setView] = useState<View>('Dashboard');
  const [checkedIn, setCheckedIn] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [items, setItems] = useState<Record<string, number>>({});
  const [customer, setCustomer] = useState('');
  const [discount, setDiscount] = useState(0);
  const [laborName, setLaborName] = useState('');
  const [laborPrice, setLaborPrice] = useState(0);
  const [adminMessage, setAdminMessage] = useState('Thank you for choosing Mirror Park Mechanics. Drive safe and visit us again.');
  const [invoices, setInvoices] = useState<Invoice[]>(seedInvoices);
  const [copyStatus, setCopyStatus] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [employeePreview, setEmployeePreview] = useState(false);
  const isAdmin = !employeePreview;

  useEffect(() => {
    const savedMessage = window.localStorage.getItem('mp-admin-message');
    const savedInvoices = window.localStorage.getItem('mp-invoices');
    if (savedMessage) setAdminMessage(savedMessage);
    if (savedInvoices) { try { setInvoices(JSON.parse(savedInvoices)); } catch { /* retain demo history */ } }
  }, []);

  useEffect(() => {
    if (!checkedIn) return;
    const timer = window.setInterval(() => setSeconds(value => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [checkedIn]);

  const subtotal = useMemo(() => services.reduce((sum, service) => sum + service.price * (items[service.id] || 0), laborPrice), [items, laborPrice]);
  const total = Math.max(0, subtotal * (1 - discount / 100));
  const duration = `${String(Math.floor(seconds / 3600)).padStart(2, '0')}:${String(Math.floor((seconds % 3600) / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  const changeQty = (id: string, change: number) => setItems(previous => ({ ...previous, [id]: Math.max(0, (previous[id] || 0) + change) }));

  const makeInvoiceText = (invoice: Invoice) => [
    'MIRROR PARK MECHANICS',
    `INVOICE ${invoice.id}`,
    `Customer: ${invoice.customer}`,
    `Mechanic: Vex Walker`,
    `Date: ${invoice.date}`,
    '--------------------------------',
    ...invoice.lines,
    '--------------------------------',
    `TOTAL: ${money(invoice.total)}`,
    '',
    invoice.message,
  ].join('\n');

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const area = document.createElement('textarea');
      area.value = text; area.style.position = 'fixed'; area.style.opacity = '0';
      document.body.appendChild(area); area.select(); document.execCommand('copy'); area.remove();
    }
  };

  const submitInvoice = async () => {
    if (!customer.trim()) { setCopyStatus('Add a customer name first.'); return; }
    if (subtotal <= 0) { setCopyStatus('Add at least one item or labor charge.'); return; }
    const id = `MP-${1847 + invoices.length}`;
    const lines = services.filter(service => items[service.id]).map(service => `${items[service.id]}× ${service.name} — ${money(service.price * items[service.id])}`);
    if (laborPrice > 0) lines.push(`Custom labor: ${laborName.trim() || 'Labor charge'} — ${money(laborPrice)}`);
    if (discount > 0) lines.push(`Discount: ${discount}%`);
    const invoice: Invoice = { id, customer: customer.trim(), date: new Date().toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }), total, lines, message: adminMessage };
    const nextInvoices = [invoice, ...invoices];
    setInvoices(nextInvoices);
    window.localStorage.setItem('mp-invoices', JSON.stringify(nextInvoices));
    await copyText(makeInvoiceText(invoice));
    setCopyStatus(`${id} saved and copied to clipboard.`);
  };

  const resetInvoice = () => { setItems({}); setCustomer(''); setDiscount(0); setLaborName(''); setLaborPrice(0); setCopyStatus(''); };
  const saveAdminMessage = () => { window.localStorage.setItem('mp-admin-message', adminMessage); setCopyStatus('Invoice message saved for future invoices.'); };

  const navigation: { label: View; icon: typeof LayoutDashboard; admin?: boolean }[] = [
    { label: 'Dashboard', icon: LayoutDashboard }, { label: 'Time Clock', icon: Clock3 }, { label: 'New Invoice', icon: ReceiptText },
    { label: 'Invoice History', icon: History }, { label: 'Employees', icon: Users }, { label: 'Reports', icon: BarChart3 },
    { label: 'Admin Controls', icon: ShieldCheck, admin: true },
  ];

  const renderHeader = (eyebrow: string, title: string, description: string) => <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><p className="text-[11px] font-black uppercase tracking-[.22em] text-[#52e0c4]">{eyebrow}</p><h1 className="mt-2 text-3xl font-black tracking-[-.035em] text-white sm:text-4xl">{title}</h1><p className="mt-2 max-w-2xl text-sm text-[#7897a4]">{description}</p></div><div className="flex items-center gap-2 rounded-full border border-[#1e3d48] bg-[#0b1820] px-3 py-2 text-xs text-[#88a3ad]"><span className="h-2 w-2 animate-pulse rounded-full bg-[#52e0c4]" /> Los Santos network online</div></div>;

  const DutyCard = () => <Panel className="p-5 sm:p-6"><div className="flex items-start justify-between"><div><div className="flex items-center gap-2 text-sm font-black uppercase tracking-[.08em]"><Clock3 className="text-[#52e0c4]" size={18} /> Duty status</div><p className="mt-2 text-xs text-[#7897a4]">Current shift tracked in real time.</p></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${checkedIn ? 'bg-[#52e0c4]/10 text-[#52e0c4]' : 'bg-white/5 text-[#7897a4]'}`}>{checkedIn ? 'On duty' : 'Off duty'}</span></div><div className="mt-8 flex flex-wrap items-end justify-between gap-5"><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-[#56727e]">This session</p><p className="mt-1 font-mono text-4xl font-black text-white sm:text-5xl">{duration}</p></div><button onClick={() => setCheckedIn(value => !value)} className={`flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-black uppercase tracking-[.08em] transition ${checkedIn ? 'bg-[#ef6b73] text-[#17080b] hover:bg-[#ff858c]' : 'bg-[#52e0c4] text-[#06221d] hover:bg-[#77ebd4]'}`}>{checkedIn ? <LogOut size={17} /> : <LogIn size={17} />}{checkedIn ? 'Check out' : 'Check in'}</button></div></Panel>;

  const EmployeeTable = () => <Panel><div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1e3d48] p-5"><div><p className="font-black text-white">Employee profiles</p><p className="mt-1 text-xs text-[#7897a4]">Weekly, monthly and invoice performance.</p></div>{isAdmin && <button onClick={() => setView('Admin Controls')} className="rounded-xl border border-[#2b5966] px-3 py-2 text-xs font-black text-[#b7d1da] hover:bg-[#102630]">Manage employees</button>}</div><div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left"><thead className="text-[10px] uppercase tracking-[.14em] text-[#56727e]"><tr><th className="px-5 py-3">Employee</th><th className="px-4 py-3">Weekly</th><th className="px-4 py-3">Monthly</th><th className="px-4 py-3">Invoices</th><th className="px-5 py-3 text-right">Status</th></tr></thead><tbody>{employees.map(employee => <tr key={employee.name} className="border-t border-[#142f39] hover:bg-[#0e2029]"><td className="px-5 py-4"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#15333d] text-xs font-black text-[#52e0c4]">{employee.initials}</span><div><p className="text-sm font-bold text-white">{employee.name}</p><p className="text-xs text-[#7897a4]">{employee.role}</p></div></div></td><td className="px-4 py-4 font-mono text-sm">{employee.week}</td><td className="px-4 py-4 font-mono text-sm text-[#a8c0c8]">{employee.month}</td><td className="px-4 py-4 text-sm">{employee.invoices}</td><td className={`px-5 py-4 text-right text-xs ${employee.status === 'On duty' ? 'text-[#52e0c4]' : 'text-[#6c8791]'}`}>● {employee.status}</td></tr>)}</tbody></table></div></Panel>;

  return <main className="min-h-screen bg-[#061016] text-[#d8e5e9]">
    <header className="sticky top-0 z-40 border-b border-[#18333d] bg-[#061016]/95 backdrop-blur-xl"><div className="mx-auto flex h-[74px] max-w-[1580px] items-center justify-between px-4 sm:px-7"><button onClick={() => setView('Dashboard')} className="flex items-center gap-3 text-left"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#52e0c4] text-sm font-black text-[#06221d] shadow-[0_0_30px_rgba(82,224,196,.2)]">MP</span><span><strong className="block text-base font-black uppercase tracking-[.04em] text-white">Mirror Park</strong><span className="text-[10px] font-black uppercase tracking-[.22em] text-[#52e0c4]">Auto Lab</span></span></button><nav className="hidden items-center gap-6 lg:flex">{(['Dashboard', 'New Invoice', 'Invoice History', 'Employees'] as View[]).map(label => <button key={label} onClick={() => setView(label)} className={`text-xs font-black uppercase tracking-[.12em] transition ${view === label ? 'text-[#52e0c4]' : 'text-[#688792] hover:text-white'}`}>{label}</button>)}</nav><div className="relative flex items-center gap-2"><button className="rounded-xl border border-[#1e3d48] p-2.5 text-[#7897a4] hover:text-white" aria-label="Notifications"><Bell size={17} /></button><button onClick={() => setMenuOpen(value => !value)} className="flex items-center gap-2 rounded-xl border border-[#1e3d48] bg-[#0b1820] p-1.5 pr-2.5"><span className="grid h-8 w-8 place-items-center rounded-lg bg-[#173540] text-[10px] font-black text-[#52e0c4]">VW</span><span className="hidden text-left sm:block"><span className="block text-xs font-bold text-white">Vex Walker</span><span className="block text-[9px] font-black uppercase tracking-[.1em] text-[#52e0c4]">{employeePreview ? 'Employee preview' : 'Administrator'}</span></span><ChevronDown size={14} /></button><button onClick={() => setMenuOpen(value => !value)} className="rounded-xl border border-[#1e3d48] p-2.5 lg:hidden" aria-label="Open navigation"><Menu size={17} /></button>{menuOpen && <div className="absolute right-0 top-14 w-64 rounded-2xl border border-[#244b57] bg-[#0b1820] p-2 shadow-2xl"><div className="border-b border-[#1e3d48] px-3 py-3"><p className="text-sm font-bold text-white">Vex Walker</p><p className="mt-1 text-xs text-[#7897a4]">Lead Mechanic · Admin</p></div><button onClick={() => { setEmployeePreview(value => !value); setMenuOpen(false); setView('Dashboard'); }} className="mt-2 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs hover:bg-[#102630]"><UserRound size={15} />{employeePreview ? 'Return to admin view' : 'Preview employee view'}</button><button onClick={() => { setView('Admin Controls'); setMenuOpen(false); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs hover:bg-[#102630]"><Settings2 size={15} />Settings</button></div>}</div></div></header>

    <div className="mx-auto grid max-w-[1580px] grid-cols-1 lg:grid-cols-[238px_minmax(0,1fr)]"><aside className="hidden min-h-[calc(100vh-74px)] border-r border-[#18333d] px-4 py-6 lg:block"><p className="mb-3 px-3 text-[10px] font-black uppercase tracking-[.2em] text-[#46636e]">Operations</p>{navigation.filter(item => !item.admin).map(({ label, icon: Icon }) => <button key={label} onClick={() => setView(label)} className={`mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${view === label ? 'bg-[#102a33] font-bold text-[#52e0c4]' : 'text-[#7897a4] hover:bg-[#0c1e26] hover:text-white'}`}><Icon size={17} />{label}</button>)}{isAdmin && <><p className="mb-3 mt-7 px-3 text-[10px] font-black uppercase tracking-[.2em] text-[#46636e]">Management</p>{navigation.filter(item => item.admin).map(({ label, icon: Icon }) => <button key={label} onClick={() => setView(label)} className={`mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${view === label ? 'bg-[#102a33] font-bold text-[#52e0c4]' : 'text-[#7897a4] hover:bg-[#0c1e26] hover:text-white'}`}><Icon size={17} />{label}</button>)}</>}<div className="mt-8 rounded-2xl border border-[#24515d] bg-[#0d222b] p-4"><div className="flex items-center gap-2 text-xs font-black uppercase tracking-[.1em] text-[#52e0c4]"><Link2 size={15} /> Discord ready</div><p className="mt-2 text-xs leading-5 text-[#7897a4]">Bot hooks are reserved and can be connected later.</p>{isAdmin && <button onClick={() => setView('Admin Controls')} className="mt-3 text-xs font-bold text-white">Configure →</button>}</div></aside>

      <section className="min-w-0 p-4 sm:p-7 lg:p-8">
        {view === 'Dashboard' && <>{renderHeader('Operations console', 'Welcome back, Vex.', 'Track your shift, monitor the garage and jump straight into today’s work.')}<div className="grid gap-5 xl:grid-cols-[1.35fr_.9fr]"><DutyCard /><Panel className="p-5 sm:p-6"><div className="flex items-center justify-between"><div className="font-black text-white">Hours overview</div><span className="rounded-lg bg-[#102a33] px-2 py-1 text-[10px] font-black text-[#52e0c4]">THIS WEEK</span></div><div className="mt-6 flex items-end gap-2"><span className="text-4xl font-black text-white">34.3</span><span className="mb-1 text-sm text-[#7897a4]">hours</span></div><div className="mt-5 flex h-14 items-end gap-2">{[34, 58, 42, 72, 51, 94, 28].map((height, index) => <span key={index} className="flex-1 rounded-t-md bg-gradient-to-t from-[#1b665f] to-[#52e0c4]" style={{ height: `${height}%`, opacity: index === 5 ? 1 : .55 }} />)}</div></Panel></div><div className="mt-5 grid gap-5 md:grid-cols-3"><button onClick={() => setView('New Invoice')} className="group rounded-2xl border border-[#1e3d48] bg-[#0b1820] p-5 text-left hover:border-[#52e0c4]/50"><ReceiptText className="text-[#52e0c4]" /><p className="mt-5 font-black text-white">Create invoice</p><p className="mt-1 text-xs text-[#7897a4]">Build, save and copy a customer bill.</p></button><button onClick={() => setView('Employees')} className="rounded-2xl border border-[#1e3d48] bg-[#0b1820] p-5 text-left hover:border-[#52e0c4]/50"><Users className="text-[#52e0c4]" /><p className="mt-5 font-black text-white">Employee profiles</p><p className="mt-1 text-xs text-[#7897a4]">Review weekly and monthly hours.</p></button><button onClick={() => setView('Invoice History')} className="rounded-2xl border border-[#1e3d48] bg-[#0b1820] p-5 text-left hover:border-[#52e0c4]/50"><History className="text-[#52e0c4]" /><p className="mt-5 font-black text-white">Invoice history</p><p className="mt-1 text-xs text-[#7897a4]">Find and copy previous bills.</p></button></div><div className="mt-5"><EmployeeTable /></div></>}

        {view === 'Time Clock' && <>{renderHeader('Duty management', 'Time clock', 'Check in and out, then review your working-hour totals.')}<div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]"><DutyCard /><Panel className="p-6"><p className="text-sm font-black uppercase tracking-[.08em] text-white">Your totals</p><div className="mt-6 grid grid-cols-2 gap-3"><div className="rounded-xl bg-[#0f252e] p-4"><p className="text-xs text-[#7897a4]">This week</p><p className="mt-2 text-2xl font-black text-white">34h 20m</p></div><div className="rounded-xl bg-[#0f252e] p-4"><p className="text-xs text-[#7897a4]">This month</p><p className="mt-2 text-2xl font-black text-white">138h 10m</p></div></div><p className="mt-5 text-xs leading-5 text-[#7897a4]">The session timer pauses when you check out. Admins can review all employee shifts from Employee Profiles.</p></Panel></div></>}

        {view === 'New Invoice' && <>{renderHeader('Billing workspace', 'Create an invoice', 'Choose parts, add custom labor and submit. The completed invoice is saved and copied to your clipboard automatically.')}<div className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_390px]"><Panel className="p-5 sm:p-6"><div className="flex items-center justify-between"><div><p className="font-black text-white">Parts & services</p><p className="mt-1 text-xs text-[#7897a4]">Use the quantity controls to build the bill.</p></div><Wrench className="text-[#52e0c4]" /></div><div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{services.map(service => <div key={service.id} className={`rounded-2xl border p-4 transition ${items[service.id] ? 'border-[#52e0c4]/50 bg-[#102a33]' : 'border-[#1e3d48] bg-[#08141a]'}`}><div className="flex items-start justify-between"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#15333d] text-[10px] font-black tracking-[.08em] text-[#52e0c4]">{service.icon}</span><span className="font-mono text-sm font-bold text-white">{money(service.price)}</span></div><p className="mt-4 text-sm font-black text-white">{service.name}</p><p className="mt-1 text-[11px] text-[#64818c]">{service.unit}</p><div className="mt-5 grid grid-cols-[40px_1fr_40px] items-center gap-2"><button onClick={() => changeQty(service.id, -1)} className="grid h-9 place-items-center rounded-xl bg-[#311b24] text-[#ef8490] hover:bg-[#49202b]" aria-label={`Remove ${service.name}`}><Minus size={15} /></button><span className="text-center font-mono text-lg font-black text-white">{items[service.id] || 0}</span><button onClick={() => changeQty(service.id, 1)} className="grid h-9 place-items-center rounded-xl bg-[#17443f] text-[#72ead5] hover:bg-[#1d5a51]" aria-label={`Add ${service.name}`}><Plus size={15} /></button></div></div>)}</div><div className="mt-5 grid gap-3 border-t border-[#1e3d48] pt-5 md:grid-cols-2"><label className="text-xs font-bold text-[#7897a4]">Customer / character name<input value={customer} onChange={event => setCustomer(event.target.value)} placeholder="e.g. John Hernandez" className="mt-2 w-full rounded-xl border border-[#244b57] bg-[#071219] px-3 py-3 text-sm text-white outline-none focus:border-[#52e0c4]" /></label><label className="text-xs font-bold text-[#7897a4]">Discount percentage<input type="number" min="0" max="100" value={discount} onChange={event => setDiscount(Math.min(100, Math.max(0, Number(event.target.value))))} className="mt-2 w-full rounded-xl border border-[#244b57] bg-[#071219] px-3 py-3 text-sm text-white outline-none focus:border-[#52e0c4]" /></label><label className="text-xs font-bold text-[#7897a4]">Custom labor description<input value={laborName} onChange={event => setLaborName(event.target.value)} placeholder="e.g. Engine calibration" className="mt-2 w-full rounded-xl border border-[#244b57] bg-[#071219] px-3 py-3 text-sm text-white outline-none focus:border-[#52e0c4]" /></label><label className="text-xs font-bold text-[#7897a4]">Custom labor charge<input type="number" min="0" value={laborPrice || ''} onChange={event => setLaborPrice(Math.max(0, Number(event.target.value)))} placeholder="$0" className="mt-2 w-full rounded-xl border border-[#244b57] bg-[#071219] px-3 py-3 text-sm text-white outline-none focus:border-[#52e0c4]" /></label></div></Panel><Panel className="h-fit overflow-hidden"><div className="border-b border-[#1e3d48] p-5"><div className="flex items-center justify-between"><div><p className="font-black text-white">Live invoice</p><p className="mt-1 text-xs text-[#7897a4]">Next number · MP-{1847 + invoices.length}</p></div><FileText className="text-[#52e0c4]" size={20} /></div></div><div className="min-h-52 p-5">{subtotal <= 0 ? <div className="grid min-h-40 place-items-center text-center"><div><ReceiptText className="mx-auto text-[#31535e]" /><p className="mt-3 text-sm text-[#64818c]">Your selected items will appear here.</p></div></div> : <div className="space-y-3">{services.filter(service => items[service.id]).map(service => <div key={service.id} className="flex justify-between gap-3 text-sm"><span className="text-[#92abb4]">{items[service.id]}× {service.name}</span><span className="font-mono text-white">{money(service.price * items[service.id])}</span></div>)}{laborPrice > 0 && <div className="flex justify-between gap-3 text-sm"><span className="text-[#92abb4]">Labor · {laborName || 'Custom labor'}</span><span className="font-mono text-white">{money(laborPrice)}</span></div>}</div>}</div><div className="border-t border-dashed border-[#2b4c57] p-5"><div className="flex justify-between text-sm text-[#7897a4]"><span>Subtotal</span><span>{money(subtotal)}</span></div>{discount > 0 && <div className="mt-2 flex justify-between text-sm text-[#52e0c4]"><span>Discount ({discount}%)</span><span>−{money(subtotal - total)}</span></div>}<div className="mt-5 flex items-end justify-between"><span className="font-black text-white">Total</span><span className="font-mono text-4xl font-black text-[#52e0c4]">{money(total)}</span></div><div className="mt-5 rounded-xl bg-[#071219] p-3 text-xs leading-5 text-[#7897a4]"><span className="font-bold text-[#a9c0c8]">Admin message:</span> {adminMessage}</div></div><button onClick={submitInvoice} className="flex w-full items-center justify-center gap-2 bg-[#52e0c4] px-5 py-4 text-sm font-black uppercase tracking-[.12em] text-[#06221d] hover:bg-[#77ebd4]"><Clipboard size={17} /> Submit & copy invoice</button><button onClick={resetInvoice} className="w-full py-3 text-xs font-black uppercase tracking-[.12em] text-[#64818c] hover:text-white">Reset invoice</button>{copyStatus && <p className={`border-t border-[#1e3d48] px-5 py-4 text-center text-xs font-bold ${copyStatus.includes('copied') ? 'text-[#52e0c4]' : 'text-[#ef8490]'}`}>{copyStatus}</p>}</Panel></div></>}

        {view === 'Invoice History' && <>{renderHeader('Billing archive', 'Invoice history', 'Every submitted invoice is stored here and can be copied again in one click.')}<Panel><div className="divide-y divide-[#17323c]">{invoices.map(invoice => <div key={invoice.id} className="grid gap-4 p-5 md:grid-cols-[110px_1fr_130px_auto] md:items-center"><div><p className="font-mono text-sm font-black text-[#52e0c4]">{invoice.id}</p><p className="mt-1 text-[10px] text-[#64818c]">{invoice.date}</p></div><div><p className="font-bold text-white">{invoice.customer}</p><p className="mt-1 truncate text-xs text-[#7897a4]">{invoice.lines.join(' · ')}</p></div><p className="font-mono text-lg font-black text-white">{money(invoice.total)}</p><button onClick={async () => { await copyText(makeInvoiceText(invoice)); setCopyStatus(`${invoice.id} copied to clipboard.`); }} className="flex items-center justify-center gap-2 rounded-xl border border-[#2a5663] px-3 py-2 text-xs font-black text-[#b7d1da] hover:bg-[#102a33]"><Clipboard size={14} /> Copy</button></div>)}</div></Panel>{copyStatus && <p className="mt-4 text-sm font-bold text-[#52e0c4]">{copyStatus}</p>}</>}

        {view === 'Employees' && <>{renderHeader('People & performance', 'Employee profiles', isAdmin ? 'Review all staff hours, roles and invoice totals.' : 'View your personal profile and duty performance.')} {isAdmin ? <EmployeeTable /> : <Panel className="max-w-2xl p-6"><div className="flex items-center gap-4"><span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#15333d] font-black text-[#52e0c4]">VW</span><div><h2 className="text-xl font-black text-white">Vex Walker</h2><p className="text-sm text-[#7897a4]">Lead Mechanic</p></div></div><div className="mt-6 grid grid-cols-2 gap-3"><div className="rounded-xl bg-[#0f252e] p-4"><p className="text-xs text-[#7897a4]">Weekly hours</p><p className="mt-2 text-xl font-black text-white">34h 20m</p></div><div className="rounded-xl bg-[#0f252e] p-4"><p className="text-xs text-[#7897a4]">Monthly hours</p><p className="mt-2 text-xl font-black text-white">138h 10m</p></div></div></Panel>}</>}

        {view === 'Reports' && <>{renderHeader('Performance data', 'Garage reports', 'A quick look at hours, revenue and completed work.')}<div className="grid gap-5 md:grid-cols-3"><Panel className="p-6"><Gauge className="text-[#52e0c4]" /><p className="mt-6 text-3xl font-black text-white">102.6h</p><p className="mt-1 text-xs text-[#7897a4]">Team hours this week</p></Panel><Panel className="p-6"><ReceiptText className="text-[#52e0c4]" /><p className="mt-6 text-3xl font-black text-white">{invoices.length + 244}</p><p className="mt-1 text-xs text-[#7897a4]">Invoices completed</p></Panel><Panel className="p-6"><BarChart3 className="text-[#52e0c4]" /><p className="mt-6 text-3xl font-black text-white">{money(invoices.reduce((sum, invoice) => sum + invoice.total, 0) + 46820)}</p><p className="mt-1 text-xs text-[#7897a4]">Recorded revenue</p></Panel></div></>}

        {view === 'Admin Controls' && isAdmin && <>{renderHeader('Restricted management', 'Admin controls', 'These settings are visible only to administrators.')}<div className="grid gap-5 xl:grid-cols-[1fr_.8fr]"><Panel className="p-6"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#15333d] text-[#52e0c4]"><FileText size={19} /></span><div><p className="font-black text-white">Invoice message</p><p className="text-xs text-[#7897a4]">This text is added automatically to every invoice.</p></div></div><textarea value={adminMessage} onChange={event => setAdminMessage(event.target.value)} rows={6} className="mt-5 w-full resize-none rounded-xl border border-[#244b57] bg-[#071219] p-4 text-sm leading-6 text-white outline-none focus:border-[#52e0c4]" /><button onClick={saveAdminMessage} className="mt-3 flex items-center gap-2 rounded-xl bg-[#52e0c4] px-4 py-3 text-sm font-black text-[#06221d]"><Check size={16} /> Save invoice message</button>{copyStatus && <p className="mt-3 text-xs font-bold text-[#52e0c4]">{copyStatus}</p>}</Panel><div className="space-y-5"><Panel className="p-6"><div className="flex items-center gap-3"><ShieldCheck className="text-[#52e0c4]" /><div><p className="font-black text-white">Role permissions</p><p className="mt-1 text-xs text-[#7897a4]">Admin management is hidden for regular employees.</p></div></div><div className="mt-5 space-y-2">{['Manage employee profiles', 'Edit invoice message', 'Review all working hours', 'Configure Discord bot'].map(permission => <div key={permission} className="flex items-center gap-2 rounded-xl bg-[#0f252e] p-3 text-xs text-[#a8c0c8]"><Check size={14} className="text-[#52e0c4]" />{permission}</div>)}</div></Panel><Panel className="p-6"><div className="flex items-center gap-3"><Link2 className="text-[#52e0c4]" /><div><p className="font-black text-white">Discord integration</p><p className="mt-1 text-xs text-[#7897a4]">Ready for the bot token and server channel IDs later.</p></div></div><button className="mt-5 rounded-xl border border-[#2a5663] px-4 py-3 text-xs font-black text-[#b7d1da]">Bot setup coming next</button></Panel></div></div></>}

        {view === 'Admin Controls' && !isAdmin && <Panel className="mx-auto max-w-lg p-8 text-center"><ShieldCheck className="mx-auto text-[#ef8490]" /><h1 className="mt-4 text-xl font-black text-white">Administrator access required</h1><p className="mt-2 text-sm text-[#7897a4]">Management controls are hidden from employee accounts.</p></Panel>}
      </section>
    </div>
  </main>;
}
