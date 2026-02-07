import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Loader2, ShieldAlert, Search, Save } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const countriesWithFlags = [
  { name: "Afghanistan", flag: "af" },
  { name: "Albania", flag: "al" },
  { name: "Algeria", flag: "dz" },
  { name: "Argentina", flag: "ar" },
  { name: "Australia", flag: "au" },
  { name: "Austria", flag: "at" },
  { name: "Bangladesh", flag: "bd" },
  { name: "Belgium", flag: "be" },
  { name: "Brazil", flag: "br" },
  { name: "Canada", flag: "ca" },
  { name: "China", flag: "cn" },
  { name: "Colombia", flag: "co" },
  { name: "Egypt", flag: "eg" },
  { name: "France", flag: "fr" },
  { name: "Germany", flag: "de" },
  { name: "Greece", flag: "gr" },
  { name: "India", flag: "in" },
  { name: "Indonesia", flag: "id" },
  { name: "Iran", flag: "ir" },
  { name: "Iraq", flag: "iq" },
  { name: "Ireland", flag: "ie" },
  { name: "Italy", flag: "it" },
  { name: "Japan", flag: "jp" },
  { name: "Jordan", flag: "jo" },
  { name: "Kenya", flag: "ke" },
  { name: "Kuwait", flag: "kw" },
  { name: "Lebanon", flag: "lb" },
  { name: "Malaysia", flag: "my" },
  { name: "Mexico", flag: "mx" },
  { name: "Morocco", flag: "ma" },
  { name: "Nepal", flag: "np" },
  { name: "Netherlands", flag: "nl" },
  { name: "New Zealand", flag: "nz" },
  { name: "Nigeria", flag: "ng" },
  { name: "Norway", flag: "no" },
  { name: "Oman", flag: "om" },
  { name: "Pakistan", flag: "pk" },
  { name: "Philippines", flag: "ph" },
  { name: "Poland", flag: "pl" },
  { name: "Portugal", flag: "pt" },
  { name: "Qatar", flag: "qa" },
  { name: "Russia", flag: "ru" },
  { name: "Saudi Arabia", flag: "sa" },
  { name: "Singapore", flag: "sg" },
  { name: "South Africa", flag: "za" },
  { name: "South Korea", flag: "kr" },
  { name: "Spain", flag: "es" },
  { name: "Sri Lanka", flag: "lk" },
  { name: "Sweden", flag: "se" },
  { name: "Switzerland", flag: "ch" },
  { name: "Syria", flag: "sy" },
  { name: "Thailand", flag: "th" },
  { name: "Tunisia", flag: "tn" },
  { name: "Turkey", flag: "tr" },
  { name: "UAE", flag: "ae" },
  { name: "UK", flag: "gb" },
  { name: "Ukraine", flag: "ua" },
  { name: "USA", flag: "us" },
  { name: "Vietnam", flag: "vn" },
  { name: "Yemen", flag: "ye" }
];

export default function ManageNationalities() {
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [localStates, setLocalStates] = useState({});

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await base44.auth.me();
        if (user.role !== 'admin') {
          setAuthError('unauthorized');
        } else {
          setCurrentUser(user);
        }
      } catch (error) {
        setAuthError('not_logged_in');
      } finally {
        setAuthLoading(false);
      }
    };
    checkAuth();
  }, []);

  const { data: nationalities = [], isLoading } = useQuery({
    queryKey: ['nationalities'],
    queryFn: async () => {
      const data = await base44.entities.Nationality.list('name');
      if (data.length === 0) {
        // Initialize with all countries
        const created = [];
        for (const country of countriesWithFlags) {
          const nat = await base44.entities.Nationality.create({
            name: country.name,
            flag: country.flag,
            is_enabled: true,
            sort_order: countriesWithFlags.indexOf(country)
          });
          created.push(nat);
        }
        return created;
      }
      return data;
    },
    enabled: !authLoading && !authError,
  });

  const updateNationalityMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Nationality.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nationalities'] });
    },
  });

  const toggleEnabled = (nat) => {
    const newState = !nat.is_enabled;
    setLocalStates(prev => ({ ...prev, [nat.id]: newState }));
    updateNationalityMutation.mutate({
      id: nat.id,
      data: { is_enabled: newState }
    });
  };

  const filteredNationalities = nationalities.filter(nat =>
    nat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (authError === 'not_logged_in') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <ShieldAlert className="w-8 h-8 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">Authentication Required</h2>
                <p className="text-slate-600 mt-2">
                  You must be logged in to access this page.
                </p>
              </div>
              <Button 
                onClick={() => base44.auth.redirectToLogin(window.location.href)}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Sign In
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (authError === 'unauthorized') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <ShieldAlert className="w-8 h-8 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">Access Denied</h2>
                <p className="text-slate-600 mt-2">
                  You do not have permission to access this page. Admin access required.
                </p>
              </div>
              <Alert variant="destructive" className="text-left">
                <AlertTitle>Unauthorized Access</AlertTitle>
                <AlertDescription>
                  If you believe you should have admin access, please contact the system administrator.
                </AlertDescription>
              </Alert>
              <div className="flex flex-col gap-2">
                <Button 
                  onClick={() => window.location.href = '/'}
                  variant="outline"
                  className="w-full"
                >
                  Return to Home
                </Button>
                <Button 
                  onClick={() => base44.auth.logout()}
                  variant="ghost"
                  className="w-full"
                >
                  Sign Out
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Manage Nationalities</h1>
          <p className="text-slate-500">Enable or disable nationalities available in the application form</p>
        </div>

        <Card className="border-0 shadow-md">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search nationalities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : (
              <div className="space-y-2">
                {filteredNationalities.map((nat) => {
                  const isEnabled = localStates[nat.id] !== undefined ? localStates[nat.id] : nat.is_enabled;
                  return (
                    <div
                      key={nat.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-white hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <img 
                          src={`https://flagsapi.com/${nat.flag.toUpperCase()}/flat/64.png`}
                          alt={`${nat.name} flag`}
                          className="w-8 h-6 object-cover rounded shadow-sm"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                        <span className="font-medium text-slate-800">{nat.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-medium px-2 py-1 rounded ${
                          isEnabled 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {isEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                        <Switch
                          checked={isEnabled}
                          onCheckedChange={() => toggleEnabled(nat)}
                          disabled={updateNationalityMutation.isPending}
                        />
                      </div>
                    </div>
                  );
                })}
                {filteredNationalities.length === 0 && (
                  <div className="text-center py-12 text-slate-500">
                    No nationalities found matching "{searchQuery}"
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center gap-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex-1 text-sm text-blue-700">
            <p className="font-medium">Changes are saved automatically</p>
            <p className="text-blue-600 text-xs mt-1">
              Disabled nationalities will not appear in the application form
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}