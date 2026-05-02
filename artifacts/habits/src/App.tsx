import { Switch, Route, Router as WouterRouter } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ThemeProvider } from '@/components/theme-provider';
import { NotificationProvider } from '@/lib/notifications';
import { FamilySyncProvider } from '@/lib/family-sync';
import { KidsProvider } from '@/lib/kids-context';
import NotFound from '@/pages/not-found';

import Home from '@/pages/home';
import Brush from '@/pages/brush';
import Kids from '@/pages/kids';
import Settings from '@/pages/settings';

import { BottomNav } from '@/components/bottom-nav';

const queryClient = new QueryClient();

function Router() {
  return (
    <div className="min-h-screen bg-background relative">
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/brush" component={Brush} />
        <Route path="/kids" component={Kids} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
      <BottomNav />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="brush-theme">
      <NotificationProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
              <FamilySyncProvider>
                <KidsProvider>
                  <Router />
                </KidsProvider>
              </FamilySyncProvider>
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </QueryClientProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;
