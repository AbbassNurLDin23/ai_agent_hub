import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { ConnectionStatus } from '@/hooks/useMetricsStream';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ConnectionStatusBadgeProps {
  status: ConnectionStatus;
}

export function ConnectionStatusBadge({ status }: ConnectionStatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          icon: <Wifi className="w-4 h-4" />,
          label: 'Connected',
          color: 'text-success',
          bgColor: 'bg-success/10 border-success/20',
          dotColor: 'bg-success',
          animate: false,
        };
      case 'reconnecting':
        return {
          icon: <RefreshCw className="w-4 h-4 animate-spin" />,
          label: 'Reconnecting...',
          color: 'text-warning',
          bgColor: 'bg-warning/10 border-warning/20',
          dotColor: 'bg-warning',
          animate: true,
        };
      case 'disconnected':
        return {
          icon: <WifiOff className="w-4 h-4" />,
          label: 'Disconnected',
          color: 'text-destructive',
          bgColor: 'bg-destructive/10 border-destructive/20',
          dotColor: 'bg-destructive',
          animate: false,
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border cursor-help transition-colors ${config.bgColor}`}
        >
          <span className={`${config.color}`}>{config.icon}</span>
          <span className={`text-xs font-medium ${config.color}`}>
            {config.label}
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-xs">
        <p className="text-sm">
          Live metrics powered by Server-Sent Events (SSE)
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
