import React from 'react';
import { SidebarProvider, Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { Home, Youtube, Box, Settings, Store as StoreIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StoreSelector from './StoreSelector';
import { Store } from '@/lib/store';

const Layout = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const currentStore = Store.useStore();

  const menuItems = [
    { title: 'Dashboard', icon: Home, path: '/' },
    { title: 'Process Video', icon: Youtube, path: '/process' },
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
            <SidebarGroup>
              <SidebarGroupLabel>Menu</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton onClick={() => navigate(item.path)} className="flex items-center gap-2">
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