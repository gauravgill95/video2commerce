import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { 
  createBrowserRouter, 
  RouterProvider,
  createRoutesFromElements,
  Route,
  Outlet
} from "react-router-dom";
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

// Create a root layout component that includes the AuthGuard and Layout
const RootLayout = () => {
  return (
    <AuthGuard>
      <Layout>
        <Outlet />
      </Layout>
    </AuthGuard>
  );
};

// Create routes using createRoutesFromElements
const routes = createRoutesFromElements(
  <>
    {/* Auth routes */}
    <Route path="/login" element={<Login />} />
    <Route path="/signup" element={<Signup />} />
    
    {/* Protected routes - nested under RootLayout */}
    <Route element={<RootLayout />}>
      <Route path="/" element={<Index />} />
      <Route path="/process" element={<Process />} />
      <Route path="/review" element={<ProductReview />} />
      <Route path="/collections" element={<Collections />} />
      <Route path="/store" element={<Store />} />
      <Route path="/settings" element={<Settings />} />
    </Route>
    
    {/* 404 route */}
    <Route path="*" element={<NotFound />} />
  </>
);

// Create the router with basename option
const router = createBrowserRouter(routes, {
  basename: '/' // Add this if your app is not served from root
});

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <RouterProvider router={router} />
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
