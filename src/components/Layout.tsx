
import React from 'react';
import { SidebarProvider, Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { Home, Youtube, Box, Settings, Store as StoreIcon, LogOut, CheckSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StoreSelector from './StoreSelector';
import { Store } from '@/lib/store';
import { useAuthStore } from '@/lib/auth';
import { toast } from 'sonner';
import { Button } from './ui/button';

const Layout = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const currentStore = Store.useStore();
  const { logout, user } = useAuthStore();

  const handleMenuItemClick = (path: string) => {
    // Special handling for the review page to redirect to process page if direct access
    if (path === '/review') {
      navigate('/process');
      return;
    }
    
    // Normal navigation for other paths
    navigate(path);
  };

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const menuItems = [
    { title: 'Dashboard', icon: Home, path: '/' },
    { title: 'Process Video', icon: Youtube, path: '/process' },
    { title: 'Product Review', icon: CheckSquare, path: '/review' },
    { title: 'Collections', icon: Box, path: '/collections' },
    { title: 'Store Management', icon: StoreIcon, path: '/store' },
    { title: 'Settings', icon: Settings, path: '/settings' },
  ];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Sidebar>
          <SidebarContent>
            <div className="p-4">
              <StoreSelector />
            </div>
            
            {user && (
              <div className="px-3 py-2 mb-2">
                <p className="text-sm font-medium">Logged in as:</p>
                <p className="text-sm truncate">{user.username || user.email}</p>
              </div>
            )}
            
            <SidebarGroup>
              <SidebarGroupLabel>Menu</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton onClick={() => handleMenuItemClick(item.path)} className="flex items-center gap-2">
                        <item.icon size={20} />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            
            {currentStore && (
              <SidebarGroup>
                <SidebarGroupLabel>Current Store</SidebarGroupLabel>
                <SidebarGroupContent>
                  <div className="px-3 py-2">
                    <h3 className="font-medium">{currentStore.name}</h3>
                    <p className="text-xs text-muted-foreground truncate">{currentStore.url}</p>
                    <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                      <div>
                        <p className="text-muted-foreground">Collections</p>
                        <p className="font-medium">{currentStore.total_collections}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Products</p>
                        <p className="font-medium">{currentStore.total_products}</p>
                      </div>
                    </div>
                  </div>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
            
            <div className="mt-auto p-4">
              <Button 
                variant="outline" 
                className="w-full flex items-center gap-2" 
                onClick={handleLogout}
              >
                <LogOut size={16} />
                Logout
              </Button>
            </div>
          </SidebarContent>
        </Sidebar>
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Layout;
