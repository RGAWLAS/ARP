import { NavLink, Outlet } from 'react-router-dom';
import { FolderOpen, DollarSign } from 'lucide-react';

const navItems = [
  { to: '/projects', label: 'Projekty', icon: FolderOpen },
  { to: '/pricing', label: 'Cennik', icon: DollarSign },
];

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-[#29417a] text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center font-bold text-lg">
              ARP
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">PromoAgency</h1>
              <p className="text-xs text-blue-200">Mini-RFQ Management</p>
            </div>
          </div>
          <nav className="flex gap-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'text-blue-200 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                <Icon size={18} />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
