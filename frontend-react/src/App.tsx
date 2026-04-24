import { DashboardPage } from '@/pages/DashboardPage';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/utils/cn';

export default function App() {
  const theme = useUIStore((s) => s.theme);

  return (
    // Apply theme class to root so CSS vars switch
    <div className={cn('h-full', theme === 'light' && 'light')}>
      <DashboardPage />
    </div>
  );
}
