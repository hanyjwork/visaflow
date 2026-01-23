import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, ArrowRight, Loader2, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function KnownCustomerLogin() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const authenticated = await base44.auth.isAuthenticated();
      
      if (authenticated) {
        const user = await base44.auth.me();
        
        // Check if user is a known customer
        if (user.customer_type !== 'known_customer') {
          setAuthError('not_known_customer');
          setIsAuthenticated(false);
          setChecking(false);
          return;
        }
        
        setIsAuthenticated(true);
        // Already logged in as known customer, redirect to home
        setTimeout(() => {
          navigate(createPageUrl('Home'));
        }, 1500);
      } else {
        setAuthError('not_logged_in');
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setAuthError('not_logged_in');
      setIsAuthenticated(false);
    } finally {
      setChecking(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  if (authError === 'not_logged_in') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full"
        >
          <Card className="border-0 shadow-2xl">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
              <CardTitle className="text-2xl text-slate-800">Authentication Required</CardTitle>
              <CardDescription>
                You must be logged in as a known customer to access this portal
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={() => base44.auth.redirectToLogin(window.location.href)}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Sign In
              </Button>
              <Button 
                onClick={() => navigate(createPageUrl('Home'))}
                variant="outline"
                className="w-full"
              >
                Return to Home
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (authError === 'not_known_customer') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full"
        >
          <Card className="border-0 shadow-2xl">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <ShieldAlert className="w-8 h-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl text-slate-800">Access Denied</CardTitle>
              <CardDescription>
                This portal is restricted to known customers only
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertTitle>Unauthorized Access</AlertTitle>
                <AlertDescription>
                  Your account does not have known customer status. Please contact support to upgrade your account or apply as a regular customer.
                </AlertDescription>
              </Alert>
              <div className="flex flex-col gap-2">
                <Button 
                  onClick={() => navigate(createPageUrl('Home'))}
                  variant="outline"
                  className="w-full"
                >
                  Apply as Regular Customer
                </Button>
                <Button 
                  onClick={() => base44.auth.logout()}
                  variant="ghost"
                  className="w-full"
                >
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
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

  // This code will never be reached because the page redirects if authenticated as known_customer
  return null;
}