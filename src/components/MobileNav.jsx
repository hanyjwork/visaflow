import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Search, ShoppingCart } from 'lucide-react';
import { createPageUrl } from '@/utils';

export default function MobileNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const update = () => {
      try { setCartCount(JSON.parse(localStorage.getItem('uae_visa_cart') || '[]').length); } catch { setCartCount(0); }
    };
    update();
    window.addEventListener('storage', update);
    const iv = setInterval(update, 500);
    return () => { window.removeEventListener('storage', update); clearInterval(iv); };
  }, []);

  const tabs = [
    { label: 'Home', icon: Home, path: '/' },
    { label: 'Track', icon: Search, path: createPageUrl('Track') },
    { label: 'Cart', icon: ShoppingCart, path: createPageUrl('Cart'), badge: cartCount },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.toLowerCase().includes(path.toLowerCase().replace(/^\//, ''));
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 bottom-nav shadow-lg">
      <div className="flex items-stretch">
        {tabs.map(({ label, icon: Icon, path, badge }) => {
          const active = isActive(path);
          return (
            <button
              key={label}
              onClick={() => {
                navigate(path);
                window.scrollTo(0, 0);
              }}
              className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors no-select ${
                active ? 'text-blue-600' : 'text-slate-500'
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 1.8} />
                {badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-medium ${active ? 'text-blue-600' : 'text-slate-500'}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}