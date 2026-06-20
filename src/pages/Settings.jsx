import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { LogOut, Trash2, User, AlertCircle } from 'lucide-react';
import MobileHeader from '@/components/MobileHeader';

export default function Settings() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => navigate('/'));
  }, []);

  const handleLogout = () => {
    base44.auth.logout();
  };

  const handleDeleteAccount = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    // Clear local data and logout
    localStorage.removeItem('uae_visa_cart');
    await base44.auth.logout();
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <MobileHeader title="Settings" />
      <div className="max-w-lg mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-6 hidden md:block">Settings</h1>

        <Card className="border-0 shadow-md mb-4">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="w-4 h-4" /> Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-slate-600">{user.full_name || 'No name set'}</p>
            <p className="text-sm text-slate-500">{user.email}</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="pt-6 space-y-4">
            <Button
              variant="outline"
              className="w-full justify-start gap-2 text-slate-700"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
              Log Out
            </Button>

            <Separator />

            <div className="space-y-2">
              {confirmDelete && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p>This will log you out and clear all local data. Are you sure?</p>
                </div>
              )}
              <Button
                variant={confirmDelete ? 'destructive' : 'outline'}
                className={`w-full justify-start gap-2 ${!confirmDelete ? 'text-red-600 border-red-200 hover:bg-red-50' : ''}`}
                onClick={handleDeleteAccount}
              >
                <Trash2 className="w-4 h-4" />
                {confirmDelete ? 'Confirm Delete Account' : 'Delete Account'}
              </Button>
              {confirmDelete && (
                <Button variant="ghost" className="w-full text-slate-500" onClick={() => setConfirmDelete(false)}>
                  Cancel
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}