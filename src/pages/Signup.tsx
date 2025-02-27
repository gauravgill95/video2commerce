
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Eye, EyeOff, UserPlus } from 'lucide-react';

const Signup = () => {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    site_title: '',
    site_url: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  
  const { signup, isLoading, error, isAuthenticated, clearError } = useAuthStore();

  useEffect(() => {
    // If already authenticated, redirect to dashboard
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password || !formData.site_title || !formData.site_url) {
      toast.error('All fields are required');
      return;
    }
    
    try {
      await signup(formData);
      toast.success('Account created successfully!');
      navigate('/');
    } catch (error) {
      // Error is handled in the auth store and displayed via the useEffect above
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-purple-50 to-white px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md shadow-lg border-purple-100">
        <CardHeader className="space-y-1 pb-6 pt-8">
          <div className="flex justify-center mb-6">
            <div className="text-purple-600 font-bold text-2xl">CatalogHub</div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">Create your store</CardTitle>
          <CardDescription className="text-center">
            Turn your videos into shoppable catalogs
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                disabled={isLoading}
                required
                className="border-purple-200 focus-visible:ring-purple-500"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium">
                Username (optional)
              </label>
              <Input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleChange}
                placeholder="Choose a username"
                disabled={isLoading}
                className="border-purple-200 focus-visible:ring-purple-500"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a password"
                  disabled={isLoading}
                  required
                  className="pr-10 border-purple-200 focus-visible:ring-purple-500"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-0 flex items-center px-3"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-500" />
                  )}
                </button>
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="site_title" className="text-sm font-medium">
                Store Name
              </label>
              <Input
                id="site_title"
                name="site_title"
                type="text"
                value={formData.site_title}
                onChange={handleChange}
                placeholder="My Jewelry Store"
                disabled={isLoading}
                required
                className="border-purple-200 focus-visible:ring-purple-500"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="site_url" className="text-sm font-medium">
                Store URL
              </label>
              <div className="flex">
                <div className="flex items-center px-3 bg-gray-100 border border-r-0 rounded-l-md border-purple-200">
                  <span className="text-sm text-gray-500">https://</span>
                </div>
                <Input
                  id="site_url"
                  name="site_url"
                  type="text"
                  value={formData.site_url}
                  onChange={handleChange}
                  placeholder="mystore"
                  disabled={isLoading}
                  required
                  className="rounded-l-none border-purple-200 focus-visible:ring-purple-500"
                />
                <div className="flex items-center px-3 bg-gray-100 border border-l-0 rounded-r-md border-purple-200">
                  <span className="text-sm text-gray-500">.cataloghub.in</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                This will be the URL where your store is accessible.
              </p>
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4 px-6 pb-8">
            <Button 
              type="submit" 
              className="w-full bg-purple-600 hover:bg-purple-700" 
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Creating store...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Create store
                </span>
              )}
            </Button>
            
            <div className="text-center text-sm">
              Already have a store?{" "}
              <Button
                variant="link"
                className="p-0 text-purple-600"
                onClick={() => navigate('/login')}
              >
                Log in
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Signup;
