'use client';

import { useEffect, useState } from 'react';
import {
  BarChart3,
  Bell,
  Check,
  ChevronDown,
  Clipboard,
  Clock3,
  FileText,
  Gauge,
  GitBranch,
  History,
  Inbox,
  LayoutDashboard,
  Link2,
  LogIn,
  LogOut,
  Menu,
  Minus,
  Plus,
  ReceiptText,
  Settings2,
  ShieldCheck,
  UserPlus,
  UserRound,
  Users,
  Wrench,
  X,
} from 'lucide-react';

type View =
  | 'Dashboard'
  | 'Time Clock'
  | 'New Invoice'
  | 'Invoice History'
  | 'Employees'
  | 'Join Team'
  | 'Reports'
  | 'Admin Controls';
type DamageLevel = { id: string; name: string; price: number };
type Invoice = {
  id: string;
  customer: string;
  date: string;
  total: number;
  lines: string[];
  message: string;
  damage?: DamageLevel;
  mechanicName?: string;
};
type Service = {
  id: string;
  name: string;
  price: number;
  unit: string;
  icon: string;
};
type Employee = {
  id?: number;
  name: string;
  role: string;
  week: string;
  month: string;
  status: string;
  initials: string;
  invoices: number;
  discord?: string;
  gameId?: string;
  mobile?: string;
  cid?: string;
  loginPassword?: string;
};
type AuthUser = {
  kind: 'admin' | 'employee';
  employeeId: number | null;
  name: string;
  role: string;
  initials: string;
};
type MechanicType = { id: string; name: string; level: number };
type Applicant = {
  id: string;
  discord: string;
  gameId: string;
  gameName: string;
  mobile: string;
  cid: string;
  status: 'pending';
  requestedAt: string;
  assignedRole: string;
};

const defaultServices: Service[] = [
  { id: 'door', name: 'Door', price: 100, unit: '1× Scrap', icon: 'DR' },
  { id: 'window', name: 'Window', price: 60, unit: '1× Glass', icon: 'WN' },
  { id: 'tyre', name: 'Tyre', price: 50, unit: '1× Rubber', icon: 'TY' },
  {
    id: 'repair-kit',
    name: 'Advance Repair Kit',
    price: 700,
    unit: 'Repair components',
    icon: 'RK',
  },
  {
    id: 'motor-oil',
    name: 'Motor Oil',
    price: 700,
    unit: 'Premium synthetic',
    icon: 'OL',
  },
  {
    id: 'brake-pad',
    name: 'Brake Pad',
    price: 400,
    unit: 'Front or rear set',
    icon: 'BP',
  },
  {
    id: 'tow',
    name: 'Tow Service',
    price: 250,
    unit: 'Citywide recovery',
    icon: 'TW',
  },
];

const defaultDamageLevels: DamageLevel[] = [
  { id: 'minor', name: 'Minor Damage', price: 450 },
  { id: 'moderate', name: 'Moderate Damage', price: 650 },
  { id: 'heavy', name: 'Heavy Damage', price: 950 },
  { id: 'severe', name: 'Severe Damage', price: 1050 },
  { id: 'extreme', name: 'Extreme Damage', price: 1200 },
];

const defaultEmployees: Employee[] = [
  {
    name: 'Vex Walker',
    role: 'Boss',
    week: '34h 20m',
    month: '138h 10m',
    status: 'On duty',
    initials: 'VW',
    invoices: 42,
  },
  {
    name: 'Mila Stone',
    role: 'Mechanic',
    week: '29h 05m',
    month: '121h 44m',
    status: 'On duty',
    initials: 'MS',
    invoices: 31,
  },
  {
    name: 'Rico Hale',
    role: 'Tow Operator',
    week: '21h 44m',
    month: '96h 08m',
    status: 'Off duty',
    initials: 'RH',
    invoices: 18,
  },
  {
    name: 'Avery Knox',
    role: 'Apprentice',
    week: '17h 30m',
    month: '72h 55m',
    status: 'Off duty',
    initials: 'AK',
    invoices: 12,
  },
];

const defaultMechanicTypes: MechanicType[] = [
  { id: 'boss', name: 'Boss', level: 1 },
  { id: 'manager', name: 'Manager', level: 2 },
  { id: 'lead', name: 'Lead Mechanic', level: 3 },
  { id: 'senior', name: 'Senior Mechanic', level: 4 },
  { id: 'mechanic', name: 'Mechanic', level: 5 },
  { id: 'tow', name: 'Tow Operator', level: 6 },
  { id: 'apprentice', name: 'Apprentice', level: 7 },
];

const money = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);

const formatDutyMinutes = (minutes: number) =>
  `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m`;

const parseDutyMinutes = (value: string) =>
  Number(value.match(/(\d+)\s*h/i)?.[1] || 0) * 60 +
  Number(value.match(/(\d+)\s*m/i)?.[1] || 0);

function Panel({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-[#1e3d48] bg-[#0b1820] shadow-[0_18px_50px_rgba(0,0,0,.16)] ${className}`}
    >
      {children}
    </section>
  );
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
  const [catalog, setCatalog] = useState<Service[]>(defaultServices);
  const [damageLevels, setDamageLevels] =
    useState<DamageLevel[]>(defaultDamageLevels);
  const [selectedDamageId, setSelectedDamageId] = useState('');
  const [staff, setStaff] = useState<Employee[]>([]);
  const [mechanicTypes, setMechanicTypes] =
    useState<MechanicType[]>(defaultMechanicTypes);
  const [applications, setApplications] = useState<Applicant[]>([]);
  const [applicationForm, setApplicationForm] = useState({
    discord: '',
    gameId: '',
    gameName: '',
    mobile: '',
    cid: '',
    password: '',
  });
  const [applicationStatus, setApplicationStatus] = useState('');
  const [businessName, setBusinessName] = useState('Mirror Park Mechanics');
  const [adminMessage, setAdminMessage] = useState(
    'Thank you for choosing Mirror Park Mechanics. Drive safe and visit us again.',
  );
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [copyStatus, setCopyStatus] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [employeePreview, setEmployeePreview] = useState(false);
  const [adminAuthenticated, setAdminAuthenticated] = useState(false);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [newAdminUsername, setNewAdminUsername] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [adminLoginStatus, setAdminLoginStatus] = useState('');
  const [authReady, setAuthReady] = useState(false);
  const [sessionToken, setSessionToken] = useState('');
  const [signedInUser, setSignedInUser] = useState<AuthUser | null>(null);
  const [showApplication, setShowApplication] = useState(false);
  const [weekMinutes, setWeekMinutes] = useState(0);
  const [monthMinutes, setMonthMinutes] = useState(0);
  const isAdmin = signedInUser?.kind === 'admin' && !employeePreview;

  const loadPrivateData = async (token: string, user: AuthUser) => {
    const headers = { authorization: `Bearer ${token}` };
    const [employeesResponse, invoicesResponse, clockResponse] =
      await Promise.all([
        fetch('/api/employees', { headers }),
        fetch('/api/invoices', { headers }),
        fetch('/api/clock', { headers }),
      ]);
    if (employeesResponse.ok) {
      const data = (await employeesResponse.json()) as {
        employees?: Employee[];
      };
      let employees = data.employees || [];
      if (user.kind === 'admin' && employees.length === 0) {
        const localStaff = window.localStorage.getItem('mp-employees');
        if (localStaff) {
          try {
            const previousEmployees = JSON.parse(localStaff) as Employee[];
            for (const previous of previousEmployees) {
              const createdResponse = await fetch('/api/employees', {
                method: 'POST',
                headers: {
                  ...headers,
                  'content-type': 'application/json',
                },
                body: JSON.stringify(previous),
              });
              if (!createdResponse.ok) continue;
              const created = (await createdResponse.json()) as { id: number };
              await fetch('/api/employees', {
                method: 'PATCH',
                headers: {
                  ...headers,
                  'content-type': 'application/json',
                },
                body: JSON.stringify({ ...previous, id: created.id }),
              });
            }
            const refreshed = await fetch('/api/employees', { headers });
            if (refreshed.ok) {
              const refreshedData = (await refreshed.json()) as {
                employees?: Employee[];
              };
              employees = refreshedData.employees || [];
            }
          } catch {
            /* ignore invalid legacy employee data */
          }
        }
      }
      setStaff(employees);
    }
    if (invoicesResponse.ok) {
      const data = (await invoicesResponse.json()) as {
        invoices?: Invoice[];
      };
      setInvoices(data.invoices || []);
    }
    if (clockResponse.ok) {
      const data = (await clockResponse.json()) as {
        checkedIn?: boolean;
        checkedInAt?: string | null;
        weekMinutes?: number;
        monthMinutes?: number;
      };
      setCheckedIn(Boolean(data.checkedIn));
      setWeekMinutes(Number(data.weekMinutes || 0));
      setMonthMinutes(Number(data.monthMinutes || 0));
      setSeconds(
        data.checkedInAt
          ? Math.max(
              0,
              Math.floor(
                (Date.now() - new Date(data.checkedInAt).getTime()) / 1000,
              ),
            )
          : 0,
      );
    }
    if (user.kind === 'admin') {
      const recruitmentResponse = await fetch('/api/recruitment', { headers });
      if (recruitmentResponse.ok) {
        const data = (await recruitmentResponse.json()) as {
          applications?: Applicant[];
        };
        setApplications(data.applications || []);
      }
    }
  };

  useEffect(() => {
    const savedMessage = window.localStorage.getItem('mp-admin-message');
    const savedCatalog = window.localStorage.getItem('mp-service-catalog');
    const savedDamageLevels = window.localStorage.getItem('mp-damage-levels');
    const savedTypes = window.localStorage.getItem('mp-mechanic-types');
    const savedBusinessName = window.localStorage.getItem('mp-business-name');
    if (savedMessage) setAdminMessage(savedMessage);
    if (savedBusinessName) setBusinessName(savedBusinessName);
    if (savedCatalog) {
      try {
        setCatalog(JSON.parse(savedCatalog));
      } catch {
        /* retain default catalog */
      }
    }
    if (savedDamageLevels) {
      try {
        setDamageLevels(JSON.parse(savedDamageLevels));
      } catch {
        /* retain default damage levels */
      }
    }
    if (savedTypes) {
      try {
        setMechanicTypes(JSON.parse(savedTypes));
      } catch {
        /* retain default hierarchy */
      }
    }
    const savedToken = window.sessionStorage.getItem('mp-session-token') || '';
    void fetch('/api/settings')
      .then(async (response) => {
        if (!response.ok) return;
        const data = (await response.json()) as {
          damageLevels?: DamageLevel[];
        };
        if (data.damageLevels?.length === defaultDamageLevels.length)
          setDamageLevels(data.damageLevels);
      })
      .catch(() => {
        /* retain locally cached damage levels */
      });
    void fetch('/api/auth', {
      headers: savedToken ? { authorization: `Bearer ${savedToken}` } : {},
    })
      .then(async (response) => {
        if (!response.ok) {
          window.sessionStorage.removeItem('mp-session-token');
          setAdminAuthenticated(false);
          setAuthReady(true);
          return;
        }
        const data = (await response.json()) as { user: AuthUser };
        setSessionToken(savedToken);
        setSignedInUser(data.user);
        setAdminAuthenticated(data.user.kind === 'admin');
        await loadPrivateData(savedToken, data.user);
        setAuthReady(true);
      })
      .catch(() => setAuthReady(true));
  }, []);

  useEffect(() => {
    if (!checkedIn) return;
    const timer = window.setInterval(
      () => setSeconds((value) => value + 1),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [checkedIn]);

  const selectedDamage = damageLevels.find(
    (damage) => damage.id === selectedDamageId,
  );
  const damagePrice = selectedDamage?.price || 0;
  const subtotal = catalog.reduce(
    (sum, service) => sum + service.price * (items[service.id] || 0),
    laborPrice + damagePrice,
  );
  const total = Math.max(0, subtotal * (1 - discount / 100));
  const currentUser =
    (signedInUser?.kind === 'employee'
      ? staff.find((employee) => employee.id === signedInUser.employeeId)
      : employeePreview
        ? staff[0]
        : null) ||
    (signedInUser
      ? {
          name: signedInUser.name,
          role: signedInUser.role,
          week: '0h 00m',
          month: '0h 00m',
          status: 'Off duty',
          initials: signedInUser.initials,
          invoices: 0,
        }
      : defaultEmployees[0]);
  const duration = `${String(Math.floor(seconds / 3600)).padStart(2, '0')}:${String(Math.floor((seconds % 3600) / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  const visibleWeekMinutes =
    signedInUser?.kind === 'employee'
      ? weekMinutes
      : parseDutyMinutes(currentUser.week);
  const visibleMonthMinutes =
    signedInUser?.kind === 'employee'
      ? monthMinutes
      : parseDutyMinutes(currentUser.month);
  const changeQty = (id: string, change: number) =>
    setItems((previous) => ({
      ...previous,
      [id]: Math.max(0, (previous[id] || 0) + change),
    }));

  const makeInvoiceText = (invoice: Invoice) =>
    [
      businessName.toUpperCase(),
      `INVOICE ${invoice.id}`,
      `Customer: ${invoice.customer}`,
      `Mechanic: ${invoice.mechanicName || currentUser.name}`,
      `Date: ${invoice.date}`,
      ...(invoice.damage
        ? [
            '',
            `DAMAGE ASSESSMENT: ${invoice.damage.name.toUpperCase()}`,
            `Assessment charge: ${money(invoice.damage.price)}`,
          ]
        : []),
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
      area.value = text;
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      area.remove();
    }
  };

  const submitInvoice = async () => {
    if (!selectedDamage) {
      setCopyStatus('Select one damage assessment before submitting.');
      return;
    }
    if (subtotal <= 0) {
      setCopyStatus('Add at least one item or labor charge.');
      return;
    }
    const lines = catalog
      .filter((service) => items[service.id])
      .map(
        (service) =>
          `${items[service.id]}× ${service.name} — ${money(service.price * items[service.id])}`,
      );
    if (laborPrice > 0)
      lines.push(
        `Custom labor: ${laborName.trim() || 'Labor charge'} — ${money(laborPrice)}`,
      );
    if (discount > 0) lines.push(`Discount: ${discount}%`);
    const draftInvoice = {
      customer: customer.trim() || 'Walk-in customer',
      total,
      lines,
      message: adminMessage,
      damage: selectedDamage,
    };
    const response = await fetch('/api/invoices', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${sessionToken}`,
      },
      body: JSON.stringify(draftInvoice),
    }).catch(() => null);
    if (!response?.ok) {
      setCopyStatus('Could not save this invoice. Please sign in again.');
      return;
    }
    const data = (await response.json()) as { invoice: Invoice };
    const invoice = data.invoice;
    const nextInvoices = [invoice, ...invoices];
    setInvoices(nextInvoices);
    await copyText(makeInvoiceText(invoice));
    setCopyStatus(`${invoice.id} saved and copied to clipboard.`);
  };

  const resetInvoice = () => {
    setItems({});
    setSelectedDamageId('');
    setCustomer('');
    setDiscount(0);
    setLaborName('');
    setLaborPrice(0);
    setCopyStatus('');
  };
  const authenticateAdmin = async () => {
    if (!adminUsername.trim() || !adminPassword.trim()) {
      setAdminLoginStatus('Enter the administrator username and password.');
      return;
    }
    const response = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        username: adminUsername,
        password: adminPassword,
      }),
    }).catch(() => null);
    if (!response?.ok) {
      setAdminAuthenticated(false);
      const data = (await response?.json().catch(() => ({}))) as {
        error?: string;
      };
      setAdminLoginStatus(data.error || 'Incorrect username or password.');
      return;
    }
    const data = (await response.json()) as {
      token: string;
      user: AuthUser;
    };
    window.sessionStorage.setItem('mp-session-token', data.token);
    setSessionToken(data.token);
    setSignedInUser(data.user);
    setAdminAuthenticated(data.user.kind === 'admin');
    setAdminLoginStatus('Signed in.');
    await loadPrivateData(data.token, data.user);
    setView(data.user.kind === 'admin' ? 'Admin Controls' : 'Dashboard');
  };
  const signOutAdmin = async () => {
    if (sessionToken) {
      await fetch('/api/auth', {
        method: 'DELETE',
        headers: { authorization: `Bearer ${sessionToken}` },
      }).catch(() => null);
    }
    window.sessionStorage.removeItem('mp-session-token');
    setSessionToken('');
    setSignedInUser(null);
    setAdminAuthenticated(false);
    setEmployeePreview(false);
    setAdminUsername('');
    setAdminPassword('');
    setNewAdminUsername('');
    setNewAdminPassword('');
    setStaff([]);
    setInvoices([]);
    setCheckedIn(false);
    setSeconds(0);
    setAdminLoginStatus('Signed out.');
    setMenuOpen(false);
    setView('Dashboard');
  };
  const adminRequestHeaders = {
    'content-type': 'application/json',
    authorization: `Bearer ${sessionToken}`,
  };
  const updateAdminCredentials = async () => {
    const response = await fetch('/api/recruitment', {
      method: 'PATCH',
      headers: adminRequestHeaders,
      body: JSON.stringify({
        action: 'update-credentials',
        username: newAdminUsername,
        password: newAdminPassword,
      }),
    });
    const data = (await response.json().catch(() => ({}))) as {
      error?: string;
      username?: string;
    };
    if (!response.ok) {
      setCopyStatus(data.error || 'Could not update administrator login.');
      return;
    }
    setNewAdminUsername('');
    setNewAdminPassword('');
    setCopyStatus('Administrator login updated.');
  };
  const saveAdminSettings = async () => {
    window.localStorage.setItem('mp-admin-message', adminMessage);
    window.localStorage.setItem('mp-service-catalog', JSON.stringify(catalog));
    window.localStorage.setItem(
      'mp-damage-levels',
      JSON.stringify(damageLevels),
    );
    window.localStorage.setItem(
      'mp-mechanic-types',
      JSON.stringify(mechanicTypes),
    );
    window.localStorage.setItem('mp-business-name', businessName);
    const responses = await Promise.all([
      fetch('/api/settings', {
        method: 'PATCH',
        headers: adminRequestHeaders,
        body: JSON.stringify({ damageLevels }),
      }).catch(() => null),
      ...staff
        .filter((employee) => employee.id)
        .map((employee) =>
          fetch('/api/employees', {
            method: 'PATCH',
            headers: adminRequestHeaders,
            body: JSON.stringify(employee),
          }).catch(() => null),
        ),
    ]);
    const response = responses[0];
    const employeesSaved = responses.slice(1).every((item) => item?.ok);
    setCopyStatus(
      response?.ok && employeesSaved
        ? 'All admin changes are live for everyone.'
        : 'Some changes could not be published. Please try again.',
    );
    if (response?.ok && employeesSaved && signedInUser)
      await loadPrivateData(sessionToken, signedInUser);
  };

  const toggleClock = async () => {
    if (signedInUser?.kind !== 'employee') {
      setCopyStatus('Only employee accounts can use the time clock.');
      return;
    }
    const response = await fetch('/api/clock', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${sessionToken}`,
      },
      body: JSON.stringify({ action: checkedIn ? 'check-out' : 'check-in' }),
    });
    if (!response.ok) {
      setCopyStatus('Could not update your duty status.');
      return;
    }
    const data = (await response.json()) as {
      checkedIn: boolean;
      checkedInAt?: string | null;
      weekMinutes: number;
      monthMinutes: number;
    };
    setCheckedIn(data.checkedIn);
    setSeconds(
      data.checkedInAt
        ? Math.max(
            0,
            Math.floor(
              (Date.now() - new Date(data.checkedInAt).getTime()) / 1000,
            ),
          )
        : 0,
    );
    setWeekMinutes(data.weekMinutes);
    setMonthMinutes(data.monthMinutes);
    await loadPrivateData(sessionToken, signedInUser);
  };

  const addEmployee = async () => {
    const response = await fetch('/api/employees', {
      method: 'POST',
      headers: adminRequestHeaders,
      body: JSON.stringify({ name: 'New Employee', role: 'Mechanic' }),
    });
    if (response.ok && signedInUser)
      await loadPrivateData(sessionToken, signedInUser);
  };

  const removeEmployee = async (employee: Employee) => {
    if (!employee.id) return;
    const response = await fetch(`/api/employees?id=${employee.id}`, {
      method: 'DELETE',
      headers: { authorization: `Bearer ${sessionToken}` },
    });
    if (response.ok)
      setStaff((current) => current.filter((item) => item.id !== employee.id));
  };

  const removeInvoice = async (invoice: Invoice) => {
    const response = await fetch(
      `/api/invoices?id=${encodeURIComponent(invoice.id)}`,
      {
        method: 'DELETE',
        headers: { authorization: `Bearer ${sessionToken}` },
      },
    );
    if (response.ok) {
      setInvoices((current) =>
        current.filter((item) => item.id !== invoice.id),
      );
      setCopyStatus(`${invoice.id} removed.`);
    }
  };

  const submitApplication = async () => {
    if (Object.values(applicationForm).some((value) => !value.trim())) {
      setApplicationStatus('Complete all six required fields.');
      return;
    }
    const response = await fetch('/api/recruitment', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(applicationForm),
    }).catch(() => null);
    if (!response?.ok) {
      setApplicationStatus(
        'Could not submit the application. Please try again.',
      );
      return;
    }
    if (isAdmin && signedInUser)
      await loadPrivateData(sessionToken, signedInUser);
    setApplicationForm({
      discord: '',
      gameId: '',
      gameName: '',
      mobile: '',
      cid: '',
      password: '',
    });
    setApplicationStatus(
      'Application submitted. An admin must approve your account.',
    );
  };

  const acceptApplication = async (application: Applicant) => {
    const response = await fetch('/api/recruitment', {
      method: 'PATCH',
      headers: adminRequestHeaders,
      body: JSON.stringify({
        action: 'accept',
        id: application.id,
        role: application.assignedRole,
      }),
    });
    if (!response.ok) {
      setCopyStatus('Could not approve this application.');
      return;
    }
    if (signedInUser) await loadPrivateData(sessionToken, signedInUser);
  };

  const rejectApplication = async (id: string) => {
    const response = await fetch('/api/recruitment', {
      method: 'PATCH',
      headers: adminRequestHeaders,
      body: JSON.stringify({ action: 'reject', id }),
    });
    if (!response.ok) return;
    setApplications((current) => current.filter((item) => item.id !== id));
  };

  const navigation: {
    label: View;
    icon: typeof LayoutDashboard;
    admin?: boolean;
  }[] = [
    { label: 'Dashboard', icon: LayoutDashboard },
    { label: 'Time Clock', icon: Clock3 },
    { label: 'New Invoice', icon: ReceiptText },
    { label: 'Invoice History', icon: History },
    { label: 'Employees', icon: Users },
    { label: 'Join Team', icon: UserPlus },
    { label: 'Reports', icon: BarChart3 },
    { label: 'Admin Controls', icon: ShieldCheck, admin: true },
  ];

  const renderHeader = (
    eyebrow: string,
    title: string,
    description: string,
  ) => (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-[11px] font-black uppercase tracking-[.22em] text-[#52e0c4]">
          {eyebrow}
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-[-.035em] text-white sm:text-4xl">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[#7897a4]">{description}</p>
      </div>
      <div className="flex items-center gap-2 rounded-full border border-[#1e3d48] bg-[#0b1820] px-3 py-2 text-xs text-[#88a3ad]">
        <span className="h-2 w-2 animate-pulse rounded-full bg-[#52e0c4]" /> Los
        Santos network online
      </div>
    </div>
  );

  const DutyCard = () => (
    <Panel className="p-5 sm:p-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[.08em]">
            <Clock3 className="text-[#52e0c4]" size={18} /> Duty status
          </div>
          <p className="mt-2 text-xs text-[#7897a4]">
            Current shift tracked in real time.
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${checkedIn ? 'bg-[#52e0c4]/10 text-[#52e0c4]' : 'bg-white/5 text-[#7897a4]'}`}
        >
          {checkedIn ? 'On duty' : 'Off duty'}
        </span>
      </div>
      <div className="mt-8 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[.18em] text-[#56727e]">
            This session
          </p>
          <p className="mt-1 font-mono text-4xl font-black text-white sm:text-5xl">
            {duration}
          </p>
        </div>
        {signedInUser?.kind === 'employee' ? (
          <button
            onClick={() => void toggleClock()}
            className={`flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-black uppercase tracking-[.08em] transition ${checkedIn ? 'bg-[#ef6b73] text-[#17080b] hover:bg-[#ff858c]' : 'bg-[#52e0c4] text-[#06221d] hover:bg-[#77ebd4]'}`}
          >
            {checkedIn ? <LogOut size={17} /> : <LogIn size={17} />}
            {checkedIn ? 'Check out' : 'Check in'}
          </button>
        ) : (
          <p className="max-w-56 text-right text-xs leading-5 text-[#7897a4]">
            Sign in as an employee to use the time clock.
          </p>
        )}
      </div>
    </Panel>
  );

  const EmployeeTable = () => (
    <Panel>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1e3d48] p-5">
        <div>
          <p className="font-black text-white">Employee profiles</p>
          <p className="mt-1 text-xs text-[#7897a4]">
            Weekly, monthly and invoice performance.
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setView('Admin Controls')}
            className="rounded-xl border border-[#2b5966] px-3 py-2 text-xs font-black text-[#b7d1da] hover:bg-[#102630]"
          >
            Manage employees
          </button>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[650px] text-left">
          <thead className="text-[10px] uppercase tracking-[.14em] text-[#56727e]">
            <tr>
              <th className="px-5 py-3">Employee</th>
              <th className="px-4 py-3">Weekly</th>
              <th className="px-4 py-3">Monthly</th>
              <th className="px-4 py-3">Invoices</th>
              <th className="px-5 py-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((employee) => (
              <tr
                key={employee.name}
                className="border-t border-[#142f39] hover:bg-[#0e2029]"
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#15333d] text-xs font-black text-[#52e0c4]">
                      {employee.initials}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-white">
                        {employee.name}
                      </p>
                      <p className="text-xs text-[#7897a4]">{employee.role}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 font-mono text-sm">{employee.week}</td>
                <td className="px-4 py-4 font-mono text-sm text-[#a8c0c8]">
                  {employee.month}
                </td>
                <td className="px-4 py-4 text-sm">{employee.invoices}</td>
                <td
                  className={`px-5 py-4 text-right text-xs ${employee.status === 'On duty' ? 'text-[#52e0c4]' : 'text-[#6c8791]'}`}
                >
                  ● {employee.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );

  const TeamDirectory = () => (
    <>
      <Panel className="p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <GitBranch className="text-[#52e0c4]" />
          <div>
            <p className="font-black text-white">Mechanic hierarchy</p>
            <p className="mt-1 text-xs text-[#7897a4]">
              Authority flows from Boss through the employee ranks.
            </p>
          </div>
        </div>
        <div className="mt-6 overflow-x-auto">
          <div className="flex min-w-max items-center gap-2">
            {[...mechanicTypes]
              .sort((a, b) => a.level - b.level)
              .map((type, index) => (
                <div key={type.id} className="flex items-center gap-2">
                  <div
                    className={`rounded-xl border px-4 py-3 text-center ${index === 0 ? 'border-[#52e0c4] bg-[#173a40]' : 'border-[#244b57] bg-[#0d222b]'}`}
                  >
                    <p className="text-[9px] font-black uppercase tracking-[.14em] text-[#56727e]">
                      Level {type.level}
                    </p>
                    <p
                      className={`mt-1 text-xs font-black uppercase ${index === 0 ? 'text-[#52e0c4]' : 'text-white'}`}
                    >
                      {type.name}
                    </p>
                    <p className="mt-1 text-[10px] text-[#7897a4]">
                      {
                        staff.filter((employee) => employee.role === type.name)
                          .length
                      }{' '}
                      staff
                    </p>
                  </div>
                  {index < mechanicTypes.length - 1 && (
                    <span className="text-[#31535e]">→</span>
                  )}
                </div>
              ))}
          </div>
        </div>
      </Panel>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[...staff]
          .sort(
            (a, b) =>
              (mechanicTypes.find((type) => type.name === a.role)?.level ||
                99) -
              (mechanicTypes.find((type) => type.name === b.role)?.level || 99),
          )
          .map((employee) => (
            <Panel
              key={`${employee.name}-${employee.cid || employee.initials}`}
              className="overflow-hidden"
            >
              <div className="relative grid h-40 place-items-center bg-[radial-gradient(circle_at_top_right,#19444a,#0b1e27_55%,#071219)]">
                <span className="text-5xl font-black tracking-[-.08em] text-[#52e0c4]/70">
                  {employee.initials}
                </span>
                <span
                  className={`absolute left-4 top-4 rounded-lg px-2 py-1 text-[9px] font-black uppercase ${employee.status === 'On duty' ? 'bg-[#52e0c4] text-[#06221d]' : 'bg-[#172f3a] text-[#9ab1b9]'}`}
                >
                  {employee.status}
                </span>
                <span className="absolute bottom-0 right-0 bg-[#52e0c4] px-3 py-1.5 text-[10px] font-black uppercase text-[#06221d]">
                  {employee.role}
                </span>
              </div>
              <div className="p-5">
                <p className="text-lg font-black uppercase text-white">
                  {employee.name}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-[#7897a4]">
                  <span>
                    Weekly <b className="block text-white">{employee.week}</b>
                  </span>
                  <span>
                    Invoices{' '}
                    <b className="block text-white">{employee.invoices}</b>
                  </span>
                </div>
                {employee.mobile && (
                  <p className="mt-4 border-t border-[#17323c] pt-3 font-mono text-xs text-[#52e0c4]">
                    ☎ {employee.mobile}
                  </p>
                )}
              </div>
            </Panel>
          ))}
      </div>
    </>
  );

  if (!authReady) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#061017] px-4 text-white">
        <div className="text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#52e0c4] text-sm font-black text-[#06221d]">
            MP
          </span>
          <p className="mt-4 text-sm font-bold text-[#7897a4]">
            Loading secure operations…
          </p>
        </div>
      </main>
    );
  }

  if (!signedInUser) {
    return (
      <main className="min-h-screen bg-[#061017] px-4 py-10 text-[#d7e5e9] sm:py-16">
        <div className="mx-auto max-w-xl">
          <div className="mb-8 text-center">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#52e0c4] text-base font-black text-[#06221d]">
              MP
            </span>
            <h1 className="mt-5 text-3xl font-black text-white">
              Mirror Park Operations
            </h1>
            <p className="mt-2 text-sm text-[#7897a4]">
              Sign in to access your employee account.
            </p>
          </div>
          {!showApplication ? (
            <Panel className="p-6 sm:p-8">
              <div className="flex items-center gap-3 border-b border-[#1e3d48] pb-5">
                <LogIn className="text-[#52e0c4]" />
                <div>
                  <p className="font-black text-white">Sign In</p>
                  <p className="mt-1 text-xs text-[#7897a4]">
                    Employees use their Discord Tag and private account
                    password.
                  </p>
                </div>
              </div>
              <label className="mt-6 block text-xs font-bold text-[#7897a4]">
                Username or Discord Tag
                <input
                  value={adminUsername}
                  onChange={(event) => setAdminUsername(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') void authenticateAdmin();
                  }}
                  autoComplete="username"
                  className="mt-2 w-full rounded-xl border border-[#244b57] bg-[#071219] px-4 py-3 text-sm text-white outline-none focus:border-[#52e0c4]"
                />
              </label>
              <label className="mt-4 block text-xs font-bold text-[#7897a4]">
                Password
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(event) => setAdminPassword(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') void authenticateAdmin();
                  }}
                  autoComplete="current-password"
                  className="mt-2 w-full rounded-xl border border-[#244b57] bg-[#071219] px-4 py-3 text-sm text-white outline-none focus:border-[#52e0c4]"
                />
              </label>
              <button
                onClick={() => void authenticateAdmin()}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#52e0c4] px-5 py-4 text-sm font-black uppercase tracking-[.1em] text-[#06221d]"
              >
                <LogIn size={17} /> Sign In
              </button>
              {adminLoginStatus && (
                <p className="mt-4 rounded-xl bg-[#311b24] p-3 text-center text-xs font-bold text-[#ef8490]">
                  {adminLoginStatus}
                </p>
              )}
              <button
                onClick={() => setShowApplication(true)}
                className="mt-5 w-full text-sm font-bold text-[#52e0c4]"
              >
                New employee? Apply for access
              </button>
            </Panel>
          ) : (
            <Panel className="p-6 sm:p-8">
              <div className="flex items-center gap-3 border-b border-[#1e3d48] pb-5">
                <UserPlus className="text-[#52e0c4]" />
                <div>
                  <p className="font-black text-white">Employee application</p>
                  <p className="mt-1 text-xs text-[#7897a4]">
                    Admin approval is required before you can sign in.
                  </p>
                </div>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {[
                  ['discord', 'Discord Tag'],
                  ['gameId', 'In Game ID'],
                  ['gameName', 'In Game Name'],
                  ['mobile', 'In Game Mobile Number'],
                  ['cid', 'In Game CID'],
                  ['password', 'Account Password (8+ characters)'],
                ].map(([field, label]) => (
                  <label
                    key={field}
                    className={`text-xs font-bold text-[#7897a4] ${field === 'password' ? 'sm:col-span-2' : ''}`}
                  >
                    {label}
                    <input
                      type={field === 'password' ? 'password' : 'text'}
                      minLength={field === 'password' ? 8 : undefined}
                      value={
                        applicationForm[field as keyof typeof applicationForm]
                      }
                      onChange={(event) =>
                        setApplicationForm((current) => ({
                          ...current,
                          [field]: event.target.value,
                        }))
                      }
                      className="mt-2 w-full rounded-xl border border-[#244b57] bg-[#071219] px-4 py-3 text-sm text-white outline-none focus:border-[#52e0c4]"
                    />
                  </label>
                ))}
              </div>
              <button
                onClick={() => void submitApplication()}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#52e0c4] px-5 py-4 text-sm font-black uppercase tracking-[.1em] text-[#06221d]"
              >
                <UserPlus size={17} /> Submit application
              </button>
              {applicationStatus && (
                <p className="mt-4 text-center text-xs font-bold text-[#52e0c4]">
                  {applicationStatus}
                </p>
              )}
              <button
                onClick={() => setShowApplication(false)}
                className="mt-5 w-full text-sm font-bold text-[#7897a4]"
              >
                Back to Sign In
              </button>
            </Panel>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#061016] text-[#d8e5e9]">
      <header className="sticky top-0 z-40 border-b border-[#18333d] bg-[#061016]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[74px] max-w-[1580px] items-center justify-between px-4 sm:px-7">
          <button
            onClick={() => setView('Dashboard')}
            className="flex items-center gap-3 text-left"
          >
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#52e0c4] text-sm font-black text-[#06221d] shadow-[0_0_30px_rgba(82,224,196,.2)]">
              MP
            </span>
            <span>
              <strong className="block max-w-[190px] truncate text-base font-black uppercase tracking-[.04em] text-white">
                {businessName}
              </strong>
              <span className="text-[10px] font-black uppercase tracking-[.22em] text-[#52e0c4]">
                Operations
              </span>
            </span>
          </button>
          <nav className="hidden items-center gap-6 lg:flex">
            {(
              ['Dashboard', 'New Invoice', 'Employees', 'Join Team'] as View[]
            ).map((label) => (
              <button
                key={label}
                onClick={() => setView(label)}
                className={`text-xs font-black uppercase tracking-[.12em] transition ${view === label ? 'text-[#52e0c4]' : 'text-[#688792] hover:text-white'}`}
              >
                {label}
              </button>
            ))}
          </nav>
          <div className="relative flex items-center gap-2">
            <button
              onClick={() => {
                if (isAdmin && applications.length) setView('Admin Controls');
              }}
              className="relative rounded-xl border border-[#1e3d48] p-2.5 text-[#7897a4] hover:text-white"
              aria-label="Notifications"
            >
              <Bell size={17} />
              {isAdmin && applications.length > 0 && (
                <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-[#ef6b73] px-1 text-[9px] font-black text-white">
                  {applications.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setMenuOpen((value) => !value)}
              className="flex items-center gap-2 rounded-xl border border-[#1e3d48] bg-[#0b1820] p-1.5 pr-2.5"
            >
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#173540] text-[10px] font-black text-[#52e0c4]">
                {currentUser.initials}
              </span>
              <span className="hidden text-left sm:block">
                <span className="block max-w-32 truncate text-xs font-bold text-white">
                  {currentUser.name}
                </span>
                <span className="block text-[9px] font-black uppercase tracking-[.1em] text-[#52e0c4]">
                  {isAdmin ? 'Administrator' : currentUser.role}
                </span>
              </span>
              <ChevronDown size={14} />
            </button>
            <button
              onClick={() => setMenuOpen((value) => !value)}
              className="rounded-xl border border-[#1e3d48] p-2.5 lg:hidden"
              aria-label="Open navigation"
            >
              <Menu size={17} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-14 w-64 rounded-2xl border border-[#244b57] bg-[#0b1820] p-2 shadow-2xl">
                <div className="border-b border-[#1e3d48] px-3 py-3">
                  <p className="text-sm font-bold text-white">
                    {currentUser.name}
                  </p>
                  <p className="mt-1 text-xs text-[#7897a4]">
                    {currentUser.role} · {isAdmin ? 'Admin' : 'Employee'}
                  </p>
                </div>
                {adminAuthenticated && (
                  <button
                    onClick={() => {
                      setEmployeePreview((value) => !value);
                      setMenuOpen(false);
                      setView('Dashboard');
                    }}
                    className="mt-2 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs hover:bg-[#102630]"
                  >
                    <UserRound size={15} />
                    {employeePreview
                      ? 'Return to admin view'
                      : 'Preview employee view'}
                  </button>
                )}
                {isAdmin && (
                  <button
                    onClick={() => {
                      setView('Admin Controls');
                      setMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs hover:bg-[#102630]"
                  >
                    <Settings2 size={15} />
                    Settings
                  </button>
                )}
                <button
                  onClick={() => void signOutAdmin()}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs text-[#ef8490] hover:bg-[#2a171c]"
                >
                  <LogOut size={15} />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1580px] grid-cols-1 lg:grid-cols-[238px_minmax(0,1fr)]">
        <aside className="hidden min-h-[calc(100vh-74px)] border-r border-[#18333d] px-4 py-6 lg:block">
          <p className="mb-3 px-3 text-[10px] font-black uppercase tracking-[.2em] text-[#46636e]">
            Operations
          </p>
          {navigation
            .filter((item) => !item.admin)
            .map(({ label, icon: Icon }) => (
              <button
                key={label}
                onClick={() => setView(label)}
                className={`mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${view === label ? 'bg-[#102a33] font-bold text-[#52e0c4]' : 'text-[#7897a4] hover:bg-[#0c1e26] hover:text-white'}`}
              >
                <Icon size={17} />
                {label}
              </button>
            ))}
          {isAdmin && (
            <>
              <p className="mb-3 mt-7 px-3 text-[10px] font-black uppercase tracking-[.2em] text-[#46636e]">
                Management
              </p>
              {navigation
                .filter((item) => item.admin)
                .map(({ label, icon: Icon }) => (
                  <button
                    key={label}
                    onClick={() => setView(label)}
                    className={`mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${view === label ? 'bg-[#102a33] font-bold text-[#52e0c4]' : 'text-[#7897a4] hover:bg-[#0c1e26] hover:text-white'}`}
                  >
                    <Icon size={17} />
                    {label}
                  </button>
                ))}
            </>
          )}
          <div className="mt-8 rounded-2xl border border-[#24515d] bg-[#0d222b] p-4">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[.1em] text-[#52e0c4]">
              <Link2 size={15} /> Discord ready
            </div>
            <p className="mt-2 text-xs leading-5 text-[#7897a4]">
              Bot hooks are reserved and can be connected later.
            </p>
            {isAdmin && (
              <button
                onClick={() => setView('Admin Controls')}
                className="mt-3 text-xs font-bold text-white"
              >
                Configure →
              </button>
            )}
          </div>
        </aside>

        <section className="min-w-0 p-4 sm:p-7 lg:p-8">
          {view === 'Dashboard' && (
            <>
              {renderHeader(
                'Operations console',
                `Welcome back, ${currentUser.name.split(' ')[0]}.`,
                'Track your shift, monitor the garage and jump straight into today’s work.',
              )}
              <div className="grid gap-5 xl:grid-cols-[1.35fr_.9fr]">
                <DutyCard />
                <Panel className="p-5 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="font-black text-white">Hours overview</div>
                    <span className="rounded-lg bg-[#102a33] px-2 py-1 text-[10px] font-black text-[#52e0c4]">
                      THIS WEEK
                    </span>
                  </div>
                  <div className="mt-6 flex items-end gap-2">
                    <span className="text-4xl font-black text-white">
                      {(visibleWeekMinutes / 60).toFixed(1)}
                    </span>
                    <span className="mb-1 text-sm text-[#7897a4]">hours</span>
                  </div>
                  <div className="mt-5 flex h-14 items-end gap-2">
                    {[34, 58, 42, 72, 51, 94, 28].map((height, index) => (
                      <span
                        key={index}
                        className="flex-1 rounded-t-md bg-gradient-to-t from-[#1b665f] to-[#52e0c4]"
                        style={{
                          height: `${height}%`,
                          opacity: index === 5 ? 1 : 0.55,
                        }}
                      />
                    ))}
                  </div>
                </Panel>
              </div>
              <div className="mt-5 grid gap-5 md:grid-cols-3">
                <button
                  onClick={() => setView('New Invoice')}
                  className="group rounded-2xl border border-[#1e3d48] bg-[#0b1820] p-5 text-left hover:border-[#52e0c4]/50"
                >
                  <ReceiptText className="text-[#52e0c4]" />
                  <p className="mt-5 font-black text-white">Create invoice</p>
                  <p className="mt-1 text-xs text-[#7897a4]">
                    Build, save and copy a customer bill.
                  </p>
                </button>
                <button
                  onClick={() => setView('Employees')}
                  className="rounded-2xl border border-[#1e3d48] bg-[#0b1820] p-5 text-left hover:border-[#52e0c4]/50"
                >
                  <Users className="text-[#52e0c4]" />
                  <p className="mt-5 font-black text-white">
                    Employee profiles
                  </p>
                  <p className="mt-1 text-xs text-[#7897a4]">
                    Review ranks and working hours.
                  </p>
                </button>
                <button
                  onClick={() =>
                    setView(
                      isAdmin && applications.length
                        ? 'Admin Controls'
                        : 'Join Team',
                    )
                  }
                  className="rounded-2xl border border-[#1e3d48] bg-[#0b1820] p-5 text-left hover:border-[#52e0c4]/50"
                >
                  {isAdmin ? (
                    <Inbox className="text-[#52e0c4]" />
                  ) : (
                    <UserPlus className="text-[#52e0c4]" />
                  )}
                  <p className="mt-5 font-black text-white">
                    {isAdmin && applications.length
                      ? `${applications.length} pending application${applications.length === 1 ? '' : 's'}`
                      : 'Join the team'}
                  </p>
                  <p className="mt-1 text-xs text-[#7897a4]">
                    {isAdmin && applications.length
                      ? 'Review new employee requests.'
                      : 'Submit an employee application.'}
                  </p>
                </button>
              </div>
              <div className="mt-5">
                <EmployeeTable />
              </div>
            </>
          )}

          {view === 'Time Clock' && (
            <>
              {renderHeader(
                'Duty management',
                'Time clock',
                'Check in and out, then review your working-hour totals.',
              )}
              <div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
                <DutyCard />
                <Panel className="p-6">
                  <p className="text-sm font-black uppercase tracking-[.08em] text-white">
                    Your totals
                  </p>
                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-[#0f252e] p-4">
                      <p className="text-xs text-[#7897a4]">This week</p>
                      <p className="mt-2 text-2xl font-black text-white">
                        {formatDutyMinutes(visibleWeekMinutes)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-[#0f252e] p-4">
                      <p className="text-xs text-[#7897a4]">This month</p>
                      <p className="mt-2 text-2xl font-black text-white">
                        {formatDutyMinutes(visibleMonthMinutes)}
                      </p>
                    </div>
                  </div>
                  <p className="mt-5 text-xs leading-5 text-[#7897a4]">
                    The session timer pauses when you check out. Admins can
                    review all employee shifts from Employee Profiles.
                  </p>
                </Panel>
              </div>
            </>
          )}

          {view === 'New Invoice' && (
            <>
              {renderHeader(
                'Billing workspace',
                'Create an invoice',
                'Select one damage assessment, choose repairs, add custom labor and submit. The completed invoice is saved and copied automatically.',
              )}
              <div className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_390px]">
                <Panel className="p-5 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-black text-white">Damage assessment</p>
                      <p className="mt-1 text-xs text-[#7897a4]">
                        Choose exactly one level for this repair invoice.
                      </p>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[.12em] text-[#52e0c4]">
                      Required
                    </span>
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                    {damageLevels.map((damage, index) => (
                      <button
                        type="button"
                        key={damage.id}
                        aria-pressed={selectedDamageId === damage.id}
                        onClick={() => setSelectedDamageId(damage.id)}
                        className={`rounded-2xl border p-4 text-left transition ${selectedDamageId === damage.id ? 'border-[#52e0c4] bg-[#12332f] shadow-[0_0_0_1px_rgba(82,224,196,.15)]' : 'border-[#1e3d48] bg-[#08141a] hover:border-[#34606c]'}`}
                      >
                        <span
                          className={`text-[10px] font-black uppercase tracking-[.12em] ${selectedDamageId === damage.id ? 'text-[#52e0c4]' : 'text-[#56727e]'}`}
                        >
                          Level {String(index + 1).padStart(2, '0')}
                        </span>
                        <p className="mt-3 text-sm font-black text-white">
                          {damage.name}
                        </p>
                        <p className="mt-2 font-mono text-sm text-[#a8c0c8]">
                          {money(damage.price)}
                        </p>
                      </button>
                    ))}
                  </div>
                  <div className="mt-6 flex items-center justify-between border-t border-[#1e3d48] pt-5">
                    <div>
                      <p className="font-black text-white">Parts & services</p>
                      <p className="mt-1 text-xs text-[#7897a4]">
                        Use the quantity controls to build the bill.
                      </p>
                    </div>
                    <Wrench className="text-[#52e0c4]" />
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {catalog.map((service) => (
                      <div
                        key={service.id}
                        className={`rounded-2xl border p-4 transition ${items[service.id] ? 'border-[#52e0c4]/50 bg-[#102a33]' : 'border-[#1e3d48] bg-[#08141a]'}`}
                      >
                        <div className="flex items-start justify-between">
                          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#15333d] text-[10px] font-black tracking-[.08em] text-[#52e0c4]">
                            {service.icon}
                          </span>
                          <span className="font-mono text-sm font-bold text-white">
                            {money(service.price)}
                          </span>
                        </div>
                        <p className="mt-4 text-sm font-black text-white">
                          {service.name}
                        </p>
                        <p className="mt-1 text-[11px] text-[#64818c]">
                          {service.unit}
                        </p>
                        <div className="mt-5 grid grid-cols-[40px_1fr_40px] items-center gap-2">
                          <button
                            onClick={() => changeQty(service.id, -1)}
                            className="grid h-9 place-items-center rounded-xl bg-[#311b24] text-[#ef8490] hover:bg-[#49202b]"
                            aria-label={`Remove ${service.name}`}
                          >
                            <Minus size={15} />
                          </button>
                          <span className="text-center font-mono text-lg font-black text-white">
                            {items[service.id] || 0}
                          </span>
                          <button
                            onClick={() => changeQty(service.id, 1)}
                            className="grid h-9 place-items-center rounded-xl bg-[#17443f] text-[#72ead5] hover:bg-[#1d5a51]"
                            aria-label={`Add ${service.name}`}
                          >
                            <Plus size={15} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 grid gap-3 border-t border-[#1e3d48] pt-5 md:grid-cols-2">
                    <label className="text-xs font-bold text-[#7897a4]">
                      Customer / character name{' '}
                      <span className="font-normal text-[#52e0c4]">
                        (optional)
                      </span>
                      <input
                        value={customer}
                        onChange={(event) => setCustomer(event.target.value)}
                        placeholder="Leave blank for walk-in customer"
                        className="mt-2 w-full rounded-xl border border-[#244b57] bg-[#071219] px-3 py-3 text-sm text-white outline-none focus:border-[#52e0c4]"
                      />
                    </label>
                    <label className="text-xs font-bold text-[#7897a4]">
                      Discount percentage
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={discount}
                        onChange={(event) =>
                          setDiscount(
                            Math.min(
                              100,
                              Math.max(0, Number(event.target.value)),
                            ),
                          )
                        }
                        className="mt-2 w-full rounded-xl border border-[#244b57] bg-[#071219] px-3 py-3 text-sm text-white outline-none focus:border-[#52e0c4]"
                      />
                    </label>
                    <label className="text-xs font-bold text-[#7897a4]">
                      Custom labor description
                      <input
                        value={laborName}
                        onChange={(event) => setLaborName(event.target.value)}
                        placeholder="e.g. Engine calibration"
                        className="mt-2 w-full rounded-xl border border-[#244b57] bg-[#071219] px-3 py-3 text-sm text-white outline-none focus:border-[#52e0c4]"
                      />
                    </label>
                    <label className="text-xs font-bold text-[#7897a4]">
                      Custom labor charge
                      <input
                        type="number"
                        min="0"
                        value={laborPrice || ''}
                        onChange={(event) =>
                          setLaborPrice(Math.max(0, Number(event.target.value)))
                        }
                        placeholder="$0"
                        className="mt-2 w-full rounded-xl border border-[#244b57] bg-[#071219] px-3 py-3 text-sm text-white outline-none focus:border-[#52e0c4]"
                      />
                    </label>
                  </div>
                </Panel>
                <Panel className="h-fit overflow-hidden">
                  <div className="border-b border-[#1e3d48] p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-black text-white">Live invoice</p>
                        <p className="mt-1 text-xs text-[#7897a4]">
                          Saved to shared invoice history
                        </p>
                      </div>
                      <FileText className="text-[#52e0c4]" size={20} />
                    </div>
                  </div>
                  <div className="min-h-52 p-5">
                    {subtotal <= 0 ? (
                      <div className="grid min-h-40 place-items-center text-center">
                        <div>
                          <ReceiptText className="mx-auto text-[#31535e]" />
                          <p className="mt-3 text-sm text-[#64818c]">
                            Your selected items will appear here.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {selectedDamage && (
                          <div className="mb-4 rounded-xl border border-[#2d645f] bg-[#12332f] p-3">
                            <p className="text-[10px] font-black uppercase tracking-[.12em] text-[#52e0c4]">
                              Damage assessment
                            </p>
                            <div className="mt-2 flex justify-between gap-3 text-sm">
                              <span className="font-black text-white">
                                {selectedDamage.name}
                              </span>
                              <span className="font-mono text-white">
                                {money(selectedDamage.price)}
                              </span>
                            </div>
                          </div>
                        )}
                        {catalog
                          .filter((service) => items[service.id])
                          .map((service) => (
                            <div
                              key={service.id}
                              className="flex justify-between gap-3 text-sm"
                            >
                              <span className="text-[#92abb4]">
                                {items[service.id]}× {service.name}
                              </span>
                              <span className="font-mono text-white">
                                {money(service.price * items[service.id])}
                              </span>
                            </div>
                          ))}
                        {laborPrice > 0 && (
                          <div className="flex justify-between gap-3 text-sm">
                            <span className="text-[#92abb4]">
                              Labor · {laborName || 'Custom labor'}
                            </span>
                            <span className="font-mono text-white">
                              {money(laborPrice)}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="border-t border-dashed border-[#2b4c57] p-5">
                    <div className="flex justify-between text-sm text-[#7897a4]">
                      <span>Subtotal</span>
                      <span>{money(subtotal)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="mt-2 flex justify-between text-sm text-[#52e0c4]">
                        <span>Discount ({discount}%)</span>
                        <span>−{money(subtotal - total)}</span>
                      </div>
                    )}
                    <div className="mt-5 flex items-end justify-between">
                      <span className="font-black text-white">Total</span>
                      <span className="font-mono text-4xl font-black text-[#52e0c4]">
                        {money(total)}
                      </span>
                    </div>
                    <div className="mt-5 rounded-xl bg-[#071219] p-3 text-xs leading-5 text-[#7897a4]">
                      <span className="font-bold text-[#a9c0c8]">
                        Admin message:
                      </span>{' '}
                      {adminMessage}
                    </div>
                  </div>
                  <button
                    onClick={submitInvoice}
                    className="flex w-full items-center justify-center gap-2 bg-[#52e0c4] px-5 py-4 text-sm font-black uppercase tracking-[.12em] text-[#06221d] hover:bg-[#77ebd4]"
                  >
                    <Clipboard size={17} /> Submit & copy invoice
                  </button>
                  <button
                    onClick={resetInvoice}
                    className="w-full py-3 text-xs font-black uppercase tracking-[.12em] text-[#64818c] hover:text-white"
                  >
                    Reset invoice
                  </button>
                  {copyStatus && (
                    <p
                      className={`border-t border-[#1e3d48] px-5 py-4 text-center text-xs font-bold ${copyStatus.includes('copied') ? 'text-[#52e0c4]' : 'text-[#ef8490]'}`}
                    >
                      {copyStatus}
                    </p>
                  )}
                </Panel>
              </div>
            </>
          )}

          {view === 'Invoice History' && (
            <>
              {renderHeader(
                'Billing archive',
                'Invoice history',
                'Every submitted invoice is stored here and can be copied again in one click.',
              )}
              <Panel>
                <div className="divide-y divide-[#17323c]">
                  {invoices.map((invoice) => (
                    <div
                      key={invoice.id}
                      className="grid gap-4 p-5 md:grid-cols-[110px_1fr_130px_auto] md:items-center"
                    >
                      <div>
                        <p className="font-mono text-sm font-black text-[#52e0c4]">
                          {invoice.id}
                        </p>
                        <p className="mt-1 text-[10px] text-[#64818c]">
                          {invoice.date}
                        </p>
                      </div>
                      <div>
                        <p className="font-bold text-white">
                          {invoice.customer}
                        </p>
                        {invoice.damage && (
                          <p className="mt-1 text-[10px] font-black uppercase tracking-[.1em] text-[#52e0c4]">
                            {invoice.damage.name} ·{' '}
                            {money(invoice.damage.price)}
                          </p>
                        )}
                        <p className="mt-1 truncate text-xs text-[#7897a4]">
                          {invoice.lines.join(' · ')}
                        </p>
                      </div>
                      <p className="font-mono text-lg font-black text-white">
                        {money(invoice.total)}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={async () => {
                            await copyText(makeInvoiceText(invoice));
                            setCopyStatus(`${invoice.id} copied to clipboard.`);
                          }}
                          className="flex items-center justify-center gap-2 rounded-xl border border-[#2a5663] px-3 py-2 text-xs font-black text-[#b7d1da] hover:bg-[#102a33]"
                        >
                          <Clipboard size={14} /> Copy
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => void removeInvoice(invoice)}
                            className="rounded-xl border border-[#64323a] px-3 py-2 text-xs font-black text-[#ef8490] hover:bg-[#2a171c]"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
              {copyStatus && (
                <p className="mt-4 text-sm font-bold text-[#52e0c4]">
                  {copyStatus}
                </p>
              )}
            </>
          )}

          {view === 'Employees' && (
            <>
              {renderHeader(
                'Our team',
                'Meet the crew',
                'The employee directory follows the administrator-defined mechanic hierarchy, beginning with the Boss.',
              )}
              <TeamDirectory />
            </>
          )}

          {view === 'Join Team' && (
            <>
              {renderHeader(
                'Employee registration',
                'Apply to join the garage',
                'Complete your identity details and choose a private password. Your account is created only after an admin approves it.',
              )}
              <Panel className="mx-auto max-w-3xl p-5 sm:p-7">
                <div className="flex items-center gap-3 border-b border-[#1e3d48] pb-5">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#15333d] text-[#52e0c4]">
                    <UserPlus size={20} />
                  </span>
                  <div>
                    <p className="font-black text-white">
                      New employee application
                    </p>
                    <p className="mt-1 text-xs text-[#7897a4]">
                      All identity fields and an account password are required.
                    </p>
                  </div>
                </div>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <label className="text-xs font-bold text-[#7897a4]">
                    Discord Tag
                    <input
                      value={applicationForm.discord}
                      onChange={(event) =>
                        setApplicationForm((current) => ({
                          ...current,
                          discord: event.target.value,
                        }))
                      }
                      placeholder="username or username#0000"
                      className="mt-2 w-full rounded-xl border border-[#244b57] bg-[#071219] px-3 py-3 text-sm text-white outline-none focus:border-[#52e0c4]"
                    />
                  </label>
                  <label className="text-xs font-bold text-[#7897a4]">
                    In Game ID
                    <input
                      value={applicationForm.gameId}
                      onChange={(event) =>
                        setApplicationForm((current) => ({
                          ...current,
                          gameId: event.target.value,
                        }))
                      }
                      placeholder="Server ID"
                      className="mt-2 w-full rounded-xl border border-[#244b57] bg-[#071219] px-3 py-3 text-sm text-white outline-none focus:border-[#52e0c4]"
                    />
                  </label>
                  <label className="text-xs font-bold text-[#7897a4]">
                    In Game Name
                    <input
                      value={applicationForm.gameName}
                      onChange={(event) =>
                        setApplicationForm((current) => ({
                          ...current,
                          gameName: event.target.value,
                        }))
                      }
                      placeholder="Character name"
                      className="mt-2 w-full rounded-xl border border-[#244b57] bg-[#071219] px-3 py-3 text-sm text-white outline-none focus:border-[#52e0c4]"
                    />
                  </label>
                  <label className="text-xs font-bold text-[#7897a4]">
                    In Game Mobile Number
                    <input
                      value={applicationForm.mobile}
                      onChange={(event) =>
                        setApplicationForm((current) => ({
                          ...current,
                          mobile: event.target.value,
                        }))
                      }
                      placeholder="555-0000"
                      className="mt-2 w-full rounded-xl border border-[#244b57] bg-[#071219] px-3 py-3 text-sm text-white outline-none focus:border-[#52e0c4]"
                    />
                  </label>
                  <label className="text-xs font-bold text-[#7897a4] sm:col-span-2">
                    In Game CID
                    <input
                      value={applicationForm.cid}
                      onChange={(event) =>
                        setApplicationForm((current) => ({
                          ...current,
                          cid: event.target.value,
                        }))
                      }
                      placeholder="Character CID"
                      className="mt-2 w-full rounded-xl border border-[#244b57] bg-[#071219] px-3 py-3 text-sm text-white outline-none focus:border-[#52e0c4]"
                    />
                  </label>
                  <label className="text-xs font-bold text-[#7897a4] sm:col-span-2">
                    Account Password
                    <input
                      type="password"
                      minLength={8}
                      value={applicationForm.password}
                      onChange={(event) =>
                        setApplicationForm((current) => ({
                          ...current,
                          password: event.target.value,
                        }))
                      }
                      placeholder="At least 8 characters"
                      className="mt-2 w-full rounded-xl border border-[#244b57] bg-[#071219] px-3 py-3 text-sm text-white outline-none focus:border-[#52e0c4]"
                    />
                  </label>
                </div>
                <button
                  onClick={submitApplication}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#52e0c4] px-5 py-4 text-sm font-black uppercase tracking-[.1em] text-[#06221d]"
                >
                  <UserPlus size={17} /> Submit for admin approval
                </button>
                {applicationStatus && (
                  <p
                    className={`mt-4 rounded-xl p-3 text-center text-xs font-bold ${applicationStatus.includes('submitted') ? 'bg-[#12342f] text-[#52e0c4]' : 'bg-[#311b24] text-[#ef8490]'}`}
                  >
                    {applicationStatus}
                  </p>
                )}
              </Panel>
            </>
          )}

          {view === 'Reports' && (
            <>
              {renderHeader(
                'Performance data',
                'Garage reports',
                'A quick look at hours, revenue and completed work.',
              )}
              <div className="grid gap-5 md:grid-cols-3">
                <Panel className="p-6">
                  <Gauge className="text-[#52e0c4]" />
                  <p className="mt-6 text-3xl font-black text-white">102.6h</p>
                  <p className="mt-1 text-xs text-[#7897a4]">
                    Team hours this week
                  </p>
                </Panel>
                <Panel className="p-6">
                  <ReceiptText className="text-[#52e0c4]" />
                  <p className="mt-6 text-3xl font-black text-white">
                    {invoices.length + 244}
                  </p>
                  <p className="mt-1 text-xs text-[#7897a4]">
                    Invoices completed
                  </p>
                </Panel>
                <Panel className="p-6">
                  <BarChart3 className="text-[#52e0c4]" />
                  <p className="mt-6 text-3xl font-black text-white">
                    {money(
                      invoices.reduce(
                        (sum, invoice) => sum + invoice.total,
                        0,
                      ) + 46820,
                    )}
                  </p>
                  <p className="mt-1 text-xs text-[#7897a4]">
                    Recorded revenue
                  </p>
                </Panel>
              </div>
            </>
          )}

          {view === 'Admin Controls' && isAdmin && (
            <>
              {renderHeader(
                'Full access management',
                'Admin controls',
                'Administrators can change business details, damage names and prices, service prices, invoice text and employee profiles.',
              )}
              <div className="space-y-5">
                <Panel className="p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="text-[#52e0c4]" />
                      <div>
                        <p className="font-black text-white">
                          Administrator login
                        </p>
                        <p className="mt-1 text-xs text-[#7897a4]">
                          Only an authenticated administrator can change this
                          website login.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={signOutAdmin}
                      className="flex items-center gap-2 rounded-xl border border-[#64323a] px-4 py-2.5 text-xs font-black text-[#ef8490] hover:bg-[#2a171c]"
                    >
                      <LogOut size={15} />
                      Sign out
                    </button>
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <input
                      value={newAdminUsername}
                      onChange={(event) =>
                        setNewAdminUsername(event.target.value)
                      }
                      placeholder="New administrator username"
                      className="rounded-xl border border-[#244b57] bg-[#071219] px-3 py-3 text-sm text-white outline-none focus:border-[#52e0c4]"
                    />
                    <input
                      type="password"
                      value={newAdminPassword}
                      onChange={(event) =>
                        setNewAdminPassword(event.target.value)
                      }
                      placeholder="New password (8+ characters)"
                      className="rounded-xl border border-[#244b57] bg-[#071219] px-3 py-3 text-sm text-white outline-none focus:border-[#52e0c4]"
                    />
                  </div>
                  <button
                    onClick={() => void updateAdminCredentials()}
                    className="mt-3 rounded-xl border border-[#2a5663] px-4 py-3 text-xs font-black text-[#b7d1da] hover:bg-[#102630]"
                  >
                    Update administrator login
                  </button>
                </Panel>
                <Panel className="overflow-hidden">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1e3d48] p-5">
                    <div className="flex items-center gap-3">
                      <span className="relative grid h-10 w-10 place-items-center rounded-xl bg-[#15333d] text-[#52e0c4]">
                        <Inbox size={19} />
                        {applications.length > 0 && (
                          <span className="absolute -right-2 -top-2 grid h-5 min-w-5 place-items-center rounded-full bg-[#ef6b73] px-1 text-[9px] font-black text-white">
                            {applications.length}
                          </span>
                        )}
                      </span>
                      <div>
                        <p className="font-black text-white">
                          Employee applications
                        </p>
                        <p className="mt-1 text-xs text-[#7897a4]">
                          Approve an applicant and choose their mechanic type.
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-[#52e0c4]">
                      {applications.length} pending
                    </span>
                  </div>
                  {applications.length === 0 ? (
                    <div className="p-8 text-center">
                      <Check className="mx-auto text-[#31535e]" />
                      <p className="mt-3 text-sm text-[#7897a4]">
                        No employee applications are waiting.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-[#17323c]">
                      {applications.map((application) => (
                        <div
                          key={application.id}
                          className="grid gap-4 p-5 xl:grid-cols-[1fr_1fr_210px_auto] xl:items-center"
                        >
                          <div>
                            <p className="font-black text-white">
                              {application.gameName}
                            </p>
                            <p className="mt-1 text-xs text-[#7897a4]">
                              Discord: {application.discord}
                            </p>
                            <p className="mt-1 text-xs text-[#7897a4]">
                              Submitted {application.requestedAt}
                            </p>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <span className="rounded-lg bg-[#0f252e] p-2 text-[#7897a4]">
                              ID
                              <b className="block text-white">
                                {application.gameId}
                              </b>
                            </span>
                            <span className="rounded-lg bg-[#0f252e] p-2 text-[#7897a4]">
                              CID
                              <b className="block text-white">
                                {application.cid}
                              </b>
                            </span>
                            <span className="rounded-lg bg-[#0f252e] p-2 text-[#7897a4]">
                              Mobile
                              <b className="block text-white">
                                {application.mobile}
                              </b>
                            </span>
                          </div>
                          <select
                            value={application.assignedRole}
                            onChange={(event) =>
                              setApplications((current) =>
                                current.map((item) =>
                                  item.id === application.id
                                    ? {
                                        ...item,
                                        assignedRole: event.target.value,
                                      }
                                    : item,
                                ),
                              )
                            }
                            className="rounded-xl border border-[#244b57] bg-[#071219] px-3 py-3 text-sm text-white outline-none"
                          >
                            {[...mechanicTypes]
                              .sort((a, b) => a.level - b.level)
                              .map((type) => (
                                <option key={type.id}>{type.name}</option>
                              ))}
                          </select>
                          <div className="flex gap-2">
                            <button
                              onClick={() => acceptApplication(application)}
                              className="rounded-xl bg-[#52e0c4] px-4 py-3 text-xs font-black text-[#06221d]"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => rejectApplication(application.id)}
                              className="grid h-10 w-10 place-items-center rounded-xl bg-[#311b24] text-[#ef8490]"
                              aria-label={`Reject ${application.gameName}`}
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Panel>
                <Panel className="p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <GitBranch className="text-[#52e0c4]" />
                      <div>
                        <p className="font-black text-white">
                          Mechanic type hierarchy
                        </p>
                        <p className="mt-1 text-xs text-[#7897a4]">
                          Boss remains first; add, rename, remove or reorder
                          every other type.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        setMechanicTypes((current) => [
                          ...current,
                          {
                            id: `type-${Date.now()}`,
                            name: 'New Mechanic Type',
                            level:
                              Math.max(
                                0,
                                ...current.map((type) => type.level),
                              ) + 1,
                          },
                        ])
                      }
                      className="flex items-center gap-2 rounded-xl border border-[#2a5663] px-3 py-2 text-xs font-black text-[#b7d1da]"
                    >
                      <Plus size={14} /> Add type
                    </button>
                  </div>
                  <div className="mt-5 space-y-2">
                    {[...mechanicTypes]
                      .sort((a, b) => a.level - b.level)
                      .map((type, index) => (
                        <div
                          key={type.id}
                          className="grid grid-cols-[56px_1fr_90px_auto] items-center gap-2 rounded-xl border border-[#17323c] bg-[#08141a] p-3"
                        >
                          <span
                            className={`grid h-9 w-9 place-items-center rounded-lg text-xs font-black ${index === 0 ? 'bg-[#52e0c4] text-[#06221d]' : 'bg-[#15333d] text-[#52e0c4]'}`}
                          >
                            {type.level}
                          </span>
                          <input
                            value={type.name}
                            disabled={index === 0}
                            onChange={(event) => {
                              const oldName = type.name;
                              const newName = event.target.value;
                              setMechanicTypes((current) =>
                                current.map((item) =>
                                  item.id === type.id
                                    ? { ...item, name: newName }
                                    : item,
                                ),
                              );
                              setStaff((current) =>
                                current.map((employee) =>
                                  employee.role === oldName
                                    ? { ...employee, role: newName }
                                    : employee,
                                ),
                              );
                            }}
                            className="rounded-lg border border-[#244b57] bg-[#061016] px-3 py-2 text-sm text-white outline-none disabled:opacity-70"
                          />
                          <input
                            type="number"
                            min={index === 0 ? 1 : 2}
                            value={type.level}
                            disabled={index === 0}
                            onChange={(event) =>
                              setMechanicTypes((current) =>
                                current.map((item) =>
                                  item.id === type.id
                                    ? {
                                        ...item,
                                        level: Math.max(
                                          index === 0 ? 1 : 2,
                                          Number(event.target.value),
                                        ),
                                      }
                                    : item,
                                ),
                              )
                            }
                            className="rounded-lg border border-[#244b57] bg-[#061016] px-3 py-2 text-sm text-white outline-none disabled:opacity-70"
                          />
                          {index === 0 ? (
                            <span className="text-center text-[10px] font-black uppercase text-[#52e0c4]">
                              Root
                            </span>
                          ) : (
                            <button
                              onClick={() => {
                                setMechanicTypes((current) =>
                                  current.filter((item) => item.id !== type.id),
                                );
                                setStaff((current) =>
                                  current.map((employee) =>
                                    employee.role === type.name
                                      ? { ...employee, role: 'Mechanic' }
                                      : employee,
                                  ),
                                );
                              }}
                              className="rounded-lg bg-[#311b24] px-3 py-2 text-xs font-black text-[#ef8490]"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ))}
                  </div>
                </Panel>
                <div className="grid gap-5 xl:grid-cols-[.75fr_1.25fr]">
                  <Panel className="p-6">
                    <div className="flex items-center gap-3">
                      <Settings2 className="text-[#52e0c4]" />
                      <div>
                        <p className="font-black text-white">
                          Business settings
                        </p>
                        <p className="mt-1 text-xs text-[#7897a4]">
                          Used in the navigation and copied invoices.
                        </p>
                      </div>
                    </div>
                    <label className="mt-5 block text-xs font-bold text-[#7897a4]">
                      Business name
                      <input
                        value={businessName}
                        onChange={(event) =>
                          setBusinessName(event.target.value)
                        }
                        className="mt-2 w-full rounded-xl border border-[#244b57] bg-[#071219] px-3 py-3 text-sm text-white outline-none focus:border-[#52e0c4]"
                      />
                    </label>
                    <label className="mt-4 block text-xs font-bold text-[#7897a4]">
                      Automatic invoice message
                      <textarea
                        value={adminMessage}
                        onChange={(event) =>
                          setAdminMessage(event.target.value)
                        }
                        rows={5}
                        className="mt-2 w-full resize-none rounded-xl border border-[#244b57] bg-[#071219] p-4 text-sm leading-6 text-white outline-none focus:border-[#52e0c4]"
                      />
                    </label>
                  </Panel>
                  <Panel className="p-6">
                    <div className="flex items-center gap-3">
                      <Wrench className="text-[#52e0c4]" />
                      <div>
                        <p className="font-black text-white">
                          Service catalog & prices
                        </p>
                        <p className="mt-1 text-xs text-[#7897a4]">
                          Changes update the invoice calculator immediately.
                        </p>
                      </div>
                    </div>
                    <div className="mt-5 space-y-3">
                      {catalog.map((service) => (
                        <div
                          key={service.id}
                          className="grid gap-2 rounded-xl border border-[#17323c] bg-[#08141a] p-3 sm:grid-cols-[1fr_1fr_120px]"
                        >
                          <label className="text-[10px] font-black uppercase tracking-[.1em] text-[#56727e]">
                            Service name
                            <input
                              value={service.name}
                              onChange={(event) =>
                                setCatalog((current) =>
                                  current.map((item) =>
                                    item.id === service.id
                                      ? { ...item, name: event.target.value }
                                      : item,
                                  ),
                                )
                              }
                              className="mt-1 w-full rounded-lg border border-[#244b57] bg-[#061016] px-3 py-2 text-sm normal-case tracking-normal text-white outline-none"
                            />
                          </label>
                          <label className="text-[10px] font-black uppercase tracking-[.1em] text-[#56727e]">
                            Description
                            <input
                              value={service.unit}
                              onChange={(event) =>
                                setCatalog((current) =>
                                  current.map((item) =>
                                    item.id === service.id
                                      ? { ...item, unit: event.target.value }
                                      : item,
                                  ),
                                )
                              }
                              className="mt-1 w-full rounded-lg border border-[#244b57] bg-[#061016] px-3 py-2 text-sm normal-case tracking-normal text-white outline-none"
                            />
                          </label>
                          <label className="text-[10px] font-black uppercase tracking-[.1em] text-[#56727e]">
                            Price
                            <input
                              type="number"
                              min="0"
                              value={service.price}
                              onChange={(event) =>
                                setCatalog((current) =>
                                  current.map((item) =>
                                    item.id === service.id
                                      ? {
                                          ...item,
                                          price: Math.max(
                                            0,
                                            Number(event.target.value),
                                          ),
                                        }
                                      : item,
                                  ),
                                )
                              }
                              className="mt-1 w-full rounded-lg border border-[#244b57] bg-[#061016] px-3 py-2 font-mono text-sm normal-case tracking-normal text-white outline-none"
                            />
                          </label>
                        </div>
                      ))}
                    </div>
                  </Panel>
                </div>
                <Panel className="p-6">
                  <div className="flex items-center gap-3">
                    <Gauge className="text-[#52e0c4]" />
                    <div>
                      <p className="font-black text-white">
                        Damage assessment names & prices
                      </p>
                      <p className="mt-1 text-xs text-[#7897a4]">
                        Exactly one assessment is applied to each invoice. Saved
                        changes publish to every user.
                      </p>
                    </div>
                  </div>
                  <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                    {damageLevels.map((damage, index) => (
                      <div
                        key={damage.id}
                        className="rounded-xl border border-[#17323c] bg-[#08141a] p-3"
                      >
                        <p className="text-[10px] font-black uppercase tracking-[.1em] text-[#52e0c4]">
                          Level {String(index + 1).padStart(2, '0')}
                        </p>
                        <label className="mt-3 block text-[10px] font-black uppercase tracking-[.1em] text-[#56727e]">
                          Display name
                          <input
                            value={damage.name}
                            onChange={(event) =>
                              setDamageLevels((current) =>
                                current.map((item) =>
                                  item.id === damage.id
                                    ? { ...item, name: event.target.value }
                                    : item,
                                ),
                              )
                            }
                            className="mt-1 w-full rounded-lg border border-[#244b57] bg-[#061016] px-3 py-2 text-sm normal-case tracking-normal text-white outline-none focus:border-[#52e0c4]"
                          />
                        </label>
                        <label className="mt-3 block text-[10px] font-black uppercase tracking-[.1em] text-[#56727e]">
                          Price
                          <input
                            type="number"
                            min="0"
                            value={damage.price}
                            onChange={(event) =>
                              setDamageLevels((current) =>
                                current.map((item) =>
                                  item.id === damage.id
                                    ? {
                                        ...item,
                                        price: Math.max(
                                          0,
                                          Number(event.target.value),
                                        ),
                                      }
                                    : item,
                                ),
                              )
                            }
                            className="mt-1 w-full rounded-lg border border-[#244b57] bg-[#061016] px-3 py-2 font-mono text-sm normal-case tracking-normal text-white outline-none focus:border-[#52e0c4]"
                          />
                        </label>
                      </div>
                    ))}
                  </div>
                </Panel>
                <Panel className="p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Users className="text-[#52e0c4]" />
                      <div>
                        <p className="font-black text-white">
                          Employee management
                        </p>
                        <p className="mt-1 text-xs text-[#7897a4]">
                          Edit names, roles, hours, invoice totals and duty
                          status.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => void addEmployee()}
                      className="flex items-center gap-2 rounded-xl border border-[#2a5663] px-3 py-2 text-xs font-black text-[#b7d1da]"
                    >
                      <Plus size={14} /> Add employee
                    </button>
                  </div>
                  <div className="mt-5 space-y-3">
                    {staff.map((employee, index) => (
                      <div
                        key={`${employee.initials}-${index}`}
                        className="grid gap-2 rounded-xl border border-[#17323c] bg-[#08141a] p-3 md:grid-cols-2 xl:grid-cols-4"
                      >
                        <input
                          aria-label="Employee name"
                          value={employee.name}
                          onChange={(event) =>
                            setStaff((current) =>
                              current.map((item, itemIndex) =>
                                itemIndex === index
                                  ? {
                                      ...item,
                                      name: event.target.value,
                                      initials:
                                        event.target.value
                                          .split(' ')
                                          .map((part) => part[0])
                                          .join('')
                                          .slice(0, 2)
                                          .toUpperCase() || 'NA',
                                    }
                                  : item,
                              ),
                            )
                          }
                          className="rounded-lg border border-[#244b57] bg-[#061016] px-3 py-2 text-sm text-white outline-none"
                        />
                        <input
                          aria-label="Employee role"
                          value={employee.role}
                          onChange={(event) =>
                            setStaff((current) =>
                              current.map((item, itemIndex) =>
                                itemIndex === index
                                  ? { ...item, role: event.target.value }
                                  : item,
                              ),
                            )
                          }
                          className="rounded-lg border border-[#244b57] bg-[#061016] px-3 py-2 text-sm text-white outline-none"
                        />
                        <input
                          aria-label="Discord Tag sign-in username"
                          value={employee.discord || ''}
                          placeholder="Discord Tag (sign-in username)"
                          onChange={(event) =>
                            setStaff((current) =>
                              current.map((item, itemIndex) =>
                                itemIndex === index
                                  ? { ...item, discord: event.target.value }
                                  : item,
                              ),
                            )
                          }
                          className="rounded-lg border border-[#244b57] bg-[#061016] px-3 py-2 text-sm text-white outline-none"
                        />
                        <input
                          aria-label="In Game CID"
                          value={employee.cid || ''}
                          placeholder="In Game CID (sign-in password)"
                          onChange={(event) =>
                            setStaff((current) =>
                              current.map((item, itemIndex) =>
                                itemIndex === index
                                  ? { ...item, cid: event.target.value }
                                  : item,
                              ),
                            )
                          }
                          className="rounded-lg border border-[#244b57] bg-[#061016] px-3 py-2 text-sm text-white outline-none"
                        />
                        <input
                          type="password"
                          minLength={8}
                          aria-label="Set a new employee account password"
                          value={employee.loginPassword || ''}
                          placeholder="New password (leave blank to keep)"
                          onChange={(event) =>
                            setStaff((current) =>
                              current.map((item, itemIndex) =>
                                itemIndex === index
                                  ? {
                                      ...item,
                                      loginPassword: event.target.value,
                                    }
                                  : item,
                              ),
                            )
                          }
                          className="rounded-lg border border-[#244b57] bg-[#061016] px-3 py-2 text-sm text-white outline-none xl:col-span-2"
                        />
                        <input
                          aria-label="Weekly hours"
                          value={employee.week}
                          onChange={(event) =>
                            setStaff((current) =>
                              current.map((item, itemIndex) =>
                                itemIndex === index
                                  ? { ...item, week: event.target.value }
                                  : item,
                              ),
                            )
                          }
                          className="rounded-lg border border-[#244b57] bg-[#061016] px-3 py-2 text-sm text-white outline-none"
                        />
                        <input
                          aria-label="Monthly hours"
                          value={employee.month}
                          onChange={(event) =>
                            setStaff((current) =>
                              current.map((item, itemIndex) =>
                                itemIndex === index
                                  ? { ...item, month: event.target.value }
                                  : item,
                              ),
                            )
                          }
                          className="rounded-lg border border-[#244b57] bg-[#061016] px-3 py-2 text-sm text-white outline-none"
                        />
                        <input
                          aria-label="Invoice count"
                          type="number"
                          min="0"
                          value={employee.invoices}
                          onChange={(event) =>
                            setStaff((current) =>
                              current.map((item, itemIndex) =>
                                itemIndex === index
                                  ? {
                                      ...item,
                                      invoices: Math.max(
                                        0,
                                        Number(event.target.value),
                                      ),
                                    }
                                  : item,
                              ),
                            )
                          }
                          className="rounded-lg border border-[#244b57] bg-[#061016] px-3 py-2 text-sm text-white outline-none"
                        />
                        <select
                          aria-label="Duty status"
                          value={employee.status}
                          onChange={(event) =>
                            setStaff((current) =>
                              current.map((item, itemIndex) =>
                                itemIndex === index
                                  ? { ...item, status: event.target.value }
                                  : item,
                              ),
                            )
                          }
                          className="rounded-lg border border-[#244b57] bg-[#061016] px-3 py-2 text-sm text-white outline-none"
                        >
                          <option>On duty</option>
                          <option>Off duty</option>
                          <option>On leave</option>
                        </select>
                        <button
                          onClick={() => void removeEmployee(employee)}
                          className="rounded-lg bg-[#311b24] px-3 py-2 text-xs font-black text-[#ef8490]"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </Panel>
                <div className="grid gap-5 xl:grid-cols-[1fr_.65fr]">
                  <Panel className="p-6">
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="text-[#52e0c4]" />
                      <div>
                        <p className="font-black text-white">
                          Administrator permissions
                        </p>
                        <p className="mt-1 text-xs text-[#7897a4]">
                          Admin accounts have full control. Employees cannot see
                          this area.
                        </p>
                      </div>
                    </div>
                    <div className="mt-5 grid gap-2 sm:grid-cols-2">
                      {[
                        'Change every damage name and price',
                        'Change every service price',
                        'Edit business and invoice text',
                        'Add, edit or remove employees',
                        'Review every shift and invoice',
                        'Change roles and duty status',
                        'Configure the Discord bot',
                      ].map((permission) => (
                        <div
                          key={permission}
                          className="flex items-center gap-2 rounded-xl bg-[#0f252e] p-3 text-xs text-[#a8c0c8]"
                        >
                          <Check size={14} className="text-[#52e0c4]" />
                          {permission}
                        </div>
                      ))}
                    </div>
                  </Panel>
                  <Panel className="p-6">
                    <div className="flex items-center gap-3">
                      <Link2 className="text-[#52e0c4]" />
                      <div>
                        <p className="font-black text-white">
                          Discord integration
                        </p>
                        <p className="mt-1 text-xs text-[#7897a4]">
                          Bot credentials and channel mapping can be added
                          later.
                        </p>
                      </div>
                    </div>
                  </Panel>
                </div>
                <div className="sticky bottom-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#2a5663] bg-[#0d222b]/95 p-4 shadow-2xl backdrop-blur">
                  <p className="text-xs text-[#91aab3]">
                    Save local business settings and publish damage options for
                    every user.
                  </p>
                  <button
                    onClick={() => void saveAdminSettings()}
                    className="flex items-center gap-2 rounded-xl bg-[#52e0c4] px-5 py-3 text-sm font-black text-[#06221d]"
                  >
                    <Check size={16} /> Save all changes
                  </button>
                  {copyStatus && (
                    <p className="w-full text-right text-xs font-bold text-[#52e0c4]">
                      {copyStatus}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}

          {view === 'Admin Controls' && !isAdmin && (
            <Panel className="mx-auto max-w-lg p-8 text-center">
              <ShieldCheck className="mx-auto text-[#ef8490]" />
              <h1 className="mt-4 text-xl font-black text-white">
                Administrator access required
              </h1>
              <p className="mt-2 text-sm text-[#7897a4]">
                Management controls are hidden from employee accounts.
              </p>
              <input
                value={adminUsername}
                onChange={(event) => setAdminUsername(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') void authenticateAdmin();
                }}
                placeholder="Administrator username"
                className="mt-6 w-full rounded-xl border border-[#244b57] bg-[#071219] px-4 py-3 text-sm text-white outline-none focus:border-[#52e0c4]"
              />
              <input
                type="password"
                value={adminPassword}
                onChange={(event) => setAdminPassword(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') void authenticateAdmin();
                }}
                placeholder="Administrator password"
                className="mt-3 w-full rounded-xl border border-[#244b57] bg-[#071219] px-4 py-3 text-sm text-white outline-none focus:border-[#52e0c4]"
              />
              <button
                onClick={() => void authenticateAdmin()}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#52e0c4] px-5 py-3 text-sm font-black uppercase tracking-[.08em] text-[#06221d]"
              >
                <LogIn size={16} /> Unlock admin controls
              </button>
              {adminLoginStatus && (
                <p
                  className={`mt-4 text-xs font-bold ${adminAuthenticated ? 'text-[#52e0c4]' : 'text-[#ef8490]'}`}
                >
                  {adminLoginStatus}
                </p>
              )}
            </Panel>
          )}
        </section>
      </div>
    </main>
  );
}
