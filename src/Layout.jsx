import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Plane, Menu, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function Layout({ children, currentPageName }) {
  const isHome = currentPageName === 'Home';
  const isAdmin = currentPageName === 'Admin';

  // Check if cart has items (for proper spacing)
  const [hasCart, setHasCart] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  
  React.useEffect(() => {
    const checkCart = () => {
      try {
        const cart = JSON.parse(localStorage.getItem('uae_visa_cart') || '[]');
        setHasCart(cart.length > 0);
      } catch {
        setHasCart(false);
      }
    };
    
    checkCart();
    window.addEventListener('storage', checkCart);
    // Check periodically for cart changes
    const interval = setInterval(checkCart, 500);
    
    return () => {
      window.removeEventListener('storage', checkCart);
      clearInterval(interval);
    };
  }, []);
  
  const navLinks = [
    { name: 'Home', page: 'Home' },
    { name: 'Track Application', page: 'Track' },
    { name: 'About Us', page: 'About' },
    { name: 'Terms & Conditions', page: 'Terms' },
  ];

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className={`${isHome ? `absolute ${hasCart ? 'top-[60px]' : 'top-0'} left-0 right-0 z-50 bg-transparent` : 'bg-white shadow-sm'}`}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to={createPageUrl('Home')} className="flex items-center gap-2">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6957a1f81f10f2f9a853595e/2e39d3c47_visaflowlogo.png" 
                alt="Visa Flow Logo" 
                className="w-12 h-12 object-contain rounded-lg"
              />
              <span className={`font-bold text-xl ${isHome ? 'text-white' : 'text-slate-800'}`}>
                Visa Flow UAE
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.page}
                  to={createPageUrl(link.page)}
                  className={`text-sm font-medium transition-colors ${
                    isHome 
                      ? 'text-white/80 hover:text-white' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              <Link to={createPageUrl('Cart')}>
                <Button 
                  size="sm" 
                  className={isHome 
                    ? 'bg-amber-500 hover:bg-amber-600 text-white' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }
                >
                  Apply Now
                </Button>
              </Link>
            </div>

            {/* Mobile Nav */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon" className={isHome ? 'text-white' : ''}>
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <div className="flex flex-col gap-4 mt-8">
                  {navLinks.map((link) => (
                    <Link
                      key={link.page}
                      to={createPageUrl(link.page)}
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-lg font-medium text-slate-700 hover:text-slate-900 py-2"
                    >
                      {link.name}
                    </Link>
                  ))}
                  <Link to={createPageUrl('Cart')} onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 mt-4">
                      Apply Now
                    </Button>
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className={isHome ? '' : 'pt-0'}>
        {children}
      </main>

      {/* Footer */}
      {!isHome && (
        <footer className="bg-slate-900 text-white py-12">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid md:grid-cols-4 gap-8">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <img 
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6957a1f81f10f2f9a853595e/2e39d3c47_visaflowlogo.png" 
                    alt="Visa Flow Logo" 
                    className="w-12 h-12 object-contain rounded-lg"
                  />
                  <span className="font-bold text-xl">Visa Flow UAE</span>
                </div>
                <p className="text-slate-400 text-sm">
                  Your trusted partner for UAE visa services.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-4">Quick Links</h4>
                <div className="space-y-2">
                  {navLinks.map((link) => (
                    <Link
                      key={link.page}
                      to={createPageUrl(link.page)}
                      onClick={() => window.scrollTo(0, 0)}
                      className="block text-slate-400 hover:text-white text-sm"
                    >
                      {link.name}
                    </Link>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-4">Contact</h4>
                <div className="space-y-2 text-sm text-slate-400">
                  <p>support@uaevisa.com</p>
                  <p>+971 50 122 4567</p>
                </div>
              </div>
            </div>
            
            <div className="border-t border-slate-800 mt-8 pt-8 text-center text-sm text-slate-400">
              <p>© 2026 VisaFlowUAE Services. All rights reserved. V0.1</p>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}