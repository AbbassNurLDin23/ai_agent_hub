import { Link, useLocation } from 'react-router-dom';
import { Bot, MessageSquare, BarChart3, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', label: 'Agents', icon: Bot },
  { path: '/chat', label: 'Chat', icon: MessageSquare },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
];

export function Header() {
  const location = useLocation();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-border/50 px-6">
      <div className="flex h-16 items-center justify-between max-w-screen-2xl mx-auto">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="absolute inset-0 rounded-xl bg-gradient-primary opacity-50 blur-xl group-hover:opacity-75 transition-opacity" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-gradient">Agent Control</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
              AI Management Platform
            </span>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-1">
          {navItems.map(({ path, label, icon: Icon }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={cn(
                  'nav-link flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200',
                  isActive
                    ? 'bg-secondary text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Status indicator */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 border border-success/20">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-xs font-medium text-success">System Online</span>
          </div>
        </div>
      </div>
    </header>
  );
}
