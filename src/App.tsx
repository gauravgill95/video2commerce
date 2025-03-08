
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "./components/Layout";
import Index from "./pages/Index";
import Process from "./pages/Process";
import Collections from "./pages/Collections";
import Settings from "./pages/Settings";
import Store from "./pages/Store";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ProductReview from "./pages/ProductReview";
import { AuthGuard } from "./components/AuthGuard";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <Routes>
            {/* Auth routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            
            {/* Protected routes */}
            <Route 
              path="/" 
              element={
                <AuthGuard>
                  <Layout>
                    <Index />
                  </Layout>
                </AuthGuard>
              } 
            />
            <Route 
              path="/process" 
              element={
                <AuthGuard>
                  <Layout>
                    <Process />
                  </Layout>
                </AuthGuard>
              } 
            />
            <Route 
              path="/review" 
              element={
                <AuthGuard>
                  <Layout>
                    <ProductReview />
                  </Layout>
                </AuthGuard>
              } 
            />
            <Route 
              path="/collections" 
              element={
                <AuthGuard>
                  <Layout>
                    <Collections />
                  </Layout>
                </AuthGuard>
              } 
            />
            <Route 
              path="/store" 
              element={
                <AuthGuard>
                  <Layout>
                    <Store />
                  </Layout>
                </AuthGuard>
              } 
            />
            <Route 
              path="/settings"
              element={
                <AuthGuard>
                  <Layout>
                    <Settings />
                  </Layout>
                </AuthGuard>
              } 
            />
            
            {/* 404 route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
