import React from 'react';
import { 
  LayoutDashboard, 
  Camera, 
  Map, 
  ShieldAlert, 
  FileSpreadsheet, 
  Cpu, 
  Smartphone, 
  Settings, 
  HardHat, 
  Radio, 
  Volume2, 
  VolumeX,
  X,
  Menu
} from 'lucide-react';
import { NavigationView } from '../types';
import { soundManager } from '../utils/audioAlert';

interface SidebarProps {
  currentView: NavigationView;
  onNavigate: (view: NavigationView) => void;
  isPhoneConnected: boolean;
  activeViolationsCount: number;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  isPhoneConnected,
  activeViolationsCount,
  mobileMenuOpen,
  setMobileMenuOpen,
}) => {
  const [muted, setMuted] = React.useState(soundManager.isMuted);

  const toggleMute = () => {
    const isNowMuted = soundManager.toggleMute();
    setMuted(isNowMuted);
    if (!isNowMuted) {
      soundManager.playWarning();
    }
  };

  const navItems = [
    {
      id: 'dashboard' as NavigationView,
      label: 'Safety Dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'camera' as NavigationView,
      label: 'Live AI Monitor',
      icon: <Camera className="w-4 h-4" />,
      badge: isPhoneConnected ? 'LIVE P2P' : undefined,
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    },
    {
      id: 'phone' as NavigationView,
      label: 'Connect Phone Cam',
      icon: <Smartphone className="w-4 h-4" />,
      badge: isPhoneConnected ? 'CONNECTED' : 'PAIR',
      badgeColor: isPhoneConnected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400',
    },
    {
      id: 'sitemap' as NavigationView,
      label: 'Site Blueprint Map',
      icon: <Map className="w-4 h-4" />,
    },
    {
      id: 'alerts' as NavigationView,
      label: 'Alerts & Incidents',
      icon: <ShieldAlert className="w-4 h-4" />,
      badge: activeViolationsCount > 0 ? String(activeViolationsCount) : undefined,
      badgeColor: 'bg-red-500 text-white animate-pulse',
    },
    {
      id: 'reports' as NavigationView,
      label: 'Reports & Audit Log',
      icon: <FileSpreadsheet className="w-4 h-4" />,
    },
    {
      id: 'training' as NavigationView,
      label: 'Model Training Lab',
      icon: <Cpu className="w-4 h-4" />,
    },
    {
      id: 'settings' as NavigationView,
      label: 'Settings & Privacy',
      icon: <Settings className="w-4 h-4" />,
    },
  ];

  const handleItemClick = (id: NavigationView) => {
    onNavigate(id);
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Main Sidebar Element */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between transition-transform duration-300 lg:static lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-slate-950 shadow-md shadow-orange-500/20 font-black">
              <HardHat className="w-5 h-5 stroke-[2.2]" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400"></span>
              </span>
            </div>

            <div>
              <div className="text-base font-extrabold text-white tracking-tight flex items-center gap-1">
                Site<span className="text-amber-400">Sentry</span>
                <span className="text-[9px] font-mono px-1.5 py-0.2 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded">
                  AI
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-medium">Smart Site Safety Monitor</div>
            </div>
          </div>

          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-white lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1 overflow-y-auto flex-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-2">
            Navigation Menu
          </div>

          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <span className={isActive ? 'text-slate-950' : 'text-slate-400'}>{item.icon}</span>
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md ${
                      item.badgeColor || 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Hardware Status & Controls */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/80 space-y-2">
          {/* WebRTC P2P Status Pill */}
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  isPhoneConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
              <span className="text-[11px] font-bold text-slate-300">
                {isPhoneConnected ? 'Phone: Connected' : 'Phone: Standby'}
              </span>
            </div>

            <button
              onClick={() => handleItemClick('phone')}
              className="text-[10px] font-bold text-amber-400 hover:underline"
            >
              {isPhoneConnected ? 'Stream' : 'Pair'}
            </button>
          </div>

          {/* Siren Audio Alarm Toggle */}
          <button
            onClick={toggleMute}
            className={`w-full py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
              muted
                ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
            }`}
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 animate-pulse" />}
            <span>{muted ? 'Alarm Siren: Muted' : 'Alarm Siren: Armed'}</span>
          </button>
        </div>
      </aside>
    </>
  );
};
