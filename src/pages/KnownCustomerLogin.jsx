import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function KnownCustomerLogin() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const authenticated = await base44.auth.isAuthenticated();
      setIsAuthenticated(authenticated);
      
      if (authenticated) {
        // Already logged in, redirect to cart
        setTimeout(() => {
          navigate(createPageUrl('Cart'));
        }, 1500);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setChecking(false);
    }
  };

  const handleLogin = () => {
    // Redirect to Base44 login with return URL to cart
    base44.auth.redirectToLogin(window.location.origin + createPageUrl('Cart'));
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="max-w-md w-full border-0 shadow-2xl">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Shield className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl">Welcome Back!</CardTitle>
              <CardDescription>
                Redirecting you to start your application...
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Loader2 className="w-6 h-6 mx-auto text-blue-600 animate-spin" />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full"
      >
        <Card className="border-0 shadow-2xl">
          <CardHeader className="text-center space-y-4 pb-4">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <div>
              <CardTitle className="text-3xl font-bold text-slate-800">Known Customer Portal</CardTitle>
              <CardDescription className="text-base mt-2">
                Secure access for registered business partners
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Benefits of Known Customer Status:</h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">✓</span>
                  <span>Priority processing for all applications</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">✓</span>
                  <span>Streamlined approval workflow</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">✓</span>
                  <span>Dedicated support from our team</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">✓</span>
                  <span>Access to application history</span>
                </li>
              </ul>
            </div>

            <Button 
              onClick={handleLogin}
              size="lg"
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold shadow-lg"
            >
              Sign In as Known Customer
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>

            <div className="text-center">
              <p className="text-sm text-slate-500 mb-3">Not a known customer yet?</p>
              <Button
                variant="outline"
                onClick={() => navigate(createPageUrl('Home'))}
                className="text-slate-600"
              >
                Apply as Regular Customer
              </Button>
            </div>

            <div className="pt-4 border-t text-center">
              <p className="text-xs text-slate-400">
                This portal is exclusively for authorized business partners.<br />
                For inquiries about known customer status, contact support.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}