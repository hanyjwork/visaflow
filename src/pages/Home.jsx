import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plane, Shield, ShoppingCart, Search, ArrowRight,
  Clock, CheckCircle, Globe, Star, ChevronRight, FileText,
  UserCheck, Send, Eye, CreditCard, Package, Award } from
'lucide-react';
import ServiceCard from '@/components/services/ServiceCard';
import WhatsAppButton from '@/components/ui/WhatsAppButton';

export default function Home() {
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('uae_visa_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [category, setCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: services = [], isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: () => base44.entities.Service.filter({ is_active: true })
  });

  useEffect(() => {
    localStorage.setItem('uae_visa_cart', JSON.stringify(cart));
  }, [cart]);

  const filteredServices = services.filter((service) => {
    const matchesCategory = category === 'all' || service.category === category;
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categoryOrder = { visa: 1, express_visa: 2, insurance: 3 };
  const sortedServices = [...filteredServices].sort((a, b) => {
    const categoryDiff = (categoryOrder[a.category] || 999) - (categoryOrder[b.category] || 999);
    if (categoryDiff !== 0) return categoryDiff;
    return a.price - b.price;
  });

  const addToCart = (service) => {
    setCart((prev) => [...prev, { service, applicant: null }]);
  };

  const visaServices = services.filter((s) => s.category === 'visa');
  const insuranceServices = services.filter((s) => s.category === 'insurance');

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 text-white">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1920')] bg-cover bg-center opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 to-blue-800/80" />
        
        <div className="relative max-w-7xl mx-auto px-4 py-20 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl">

            <Badge className="bg-amber-500/20 text-amber-300 border-amber-400/30 mb-6">
              <Star className="w-3 h-3 mr-1" /> Trusted by thousands
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Your UAE Visa <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-300">
                Made Simple
              </span>
            </h1>
            <p className="text-lg md:text-xl text-blue-100 mb-8 leading-relaxed">
              Fast, reliable visa processing for Dubai and the UAE. 
              Complete your application in minutes, track your status in real-time.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold shadow-lg shadow-amber-500/25"
                onClick={() => document.getElementById('services').scrollIntoView({ behavior: 'smooth' })}>

                Start Application
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Link to={createPageUrl('Track')}>
                <Button size="lg" variant="outline" className="bg-background text-amber-500 px-8 text-sm font-medium rounded-md inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border shadow-sm h-10 border-white/30 hover:bg-white/10 hover:text-amber-200 w-full">
                  <Search className="w-5 h-5 mr-2" />
                  Track Application
                </Button>
              </Link>
            </div>
          </motion.div>
          
          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">

            {[
            { value: '50K+', label: 'Visas Processed' },
            { value: '98%', label: 'Success Rate' },
            { value: '24-48h', label: 'Processing Time' },
            { value: '4.9★', label: 'Customer Rating' }].
            map((stat, index) =>
            <div key={index} className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-blue-200 mt-1">{stat.label}</p>
              </div>
            )}
          </motion.div>
        </div>
        
        {/* Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#f8fafc" />
          </svg>
        </div>
      </section>

      {/* Cart Banner */}
      <AnimatePresence>
        {cart.length > 0 &&
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="sticky top-0 z-40 bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg">

            <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-full">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <span className="font-medium">
                  {cart.length} item{cart.length > 1 ? 's' : ''} in cart
                </span>
                <span className="hidden md:inline text-amber-100">|</span>
                <span className="hidden md:inline text-amber-100">
                  Total: AED {cart.reduce((sum, item) => sum + item.service.price, 0).toFixed(2)}
                </span>
              </div>
              <Link to={createPageUrl('Cart')}>
                <Button size="sm" className="bg-white text-amber-600 hover:bg-amber-50">
                  View Cart
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </motion.div>
        }
      </AnimatePresence>

      {/* Features */}
      <section className="py-16 max-w-7xl mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-6">
          {[
          { icon: Clock, title: 'Fast Processing', desc: 'Get your visa in as little as 24 hours' },
          { icon: CheckCircle, title: '100% Online', desc: 'No embassy visits required' },
          { icon: Globe, title: 'All Nationalities', desc: 'We process visas for all countries' }].
          map((feature, index) =>
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            viewport={{ once: true }}>

              <Card className="border-0 shadow-md hover:shadow-lg transition-shadow bg-white">
                <CardContent className="p-6 flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">{feature.title}</h3>
                    <p className="text-sm text-slate-500 mt-1">{feature.desc}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Simple Process</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
              How It Works
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Get your UAE visa in 5 simple steps. Our streamlined process makes it easy and hassle-free.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
            {
              step: '1',
              icon: Send,
              title: 'Submit Application',
              description: 'Browse services, complete the application form, upload required documents, and submit to receive your tracking number',
              color: 'from-blue-500 to-blue-600'
            },
            {
              step: '2',
              icon: Eye,
              title: 'Admin Review',
              description: 'Our team reviews your application and documents for accuracy',
              color: 'from-purple-500 to-purple-600'
            },
            {
              step: '3',
              icon: CreditCard,
              title: 'Payment',
              description: 'Once approved, make your payment securely through our platform',
              color: 'from-amber-500 to-amber-600'
            },
            {
              step: '4',
              icon: Package,
              title: 'Processing',
              description: 'We process your visa with UAE immigration authorities',
              color: 'from-green-500 to-green-600'
            },
            {
              step: '5',
              icon: Award,
              title: 'Receive Visa',
              description: 'Track your application status and receive your approved visa',
              color: 'from-pink-500 to-pink-600'
            }].
            map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  viewport={{ once: true }}
                  className="relative">

                  {/* Connecting line for desktop */}
                  {index < 4 &&
                  <div className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-slate-200 to-transparent -translate-y-1/2 z-0" />
                  }
                  
                  <div className="relative bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 group h-full">
                    {/* Step number badge */}
                    <div className={`absolute -top-3 -left-3 w-10 h-10 rounded-full bg-gradient-to-br ${item.color} text-white font-bold flex items-center justify-center text-lg shadow-lg`}>
                      {item.step}
                    </div>
                    
                    {/* Icon */}
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    
                    {/* Content */}
                    <h3 className="text-lg font-bold text-slate-800 mb-2">
                      {item.title}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </motion.div>);

            })}
          </div>

          {/* CTA below steps */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mt-12">

            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg"
              onClick={() => document.getElementById('services').scrollIntoView({ behavior: 'smooth' })}>

              Get Started Now
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Services Catalog */}
      <section id="services" className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">Our Services</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
              Choose Your Service
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Select from our range of visa and insurance options tailored for your UAE visit
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8 items-center justify-between">
            <Tabs value={category} onValueChange={setCategory}>
              <TabsList className="bg-white shadow-sm">
                <TabsTrigger value="all" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  All Services
                </TabsTrigger>
                <TabsTrigger value="visa" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  <Plane className="w-4 h-4 mr-2" />
                  Visas
                </TabsTrigger>
                <TabsTrigger value="express_visa" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  <Plane className="w-4 h-4 mr-2" />
                  Express Visas
                </TabsTrigger>
                <TabsTrigger value="insurance" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  <Shield className="w-4 h-4 mr-2" />
                  Insurance
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white" />

            </div>
          </div>

          {/* Services Grid */}
          {isLoading ?
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) =>
            <div key={i} className="h-72 bg-white rounded-xl animate-pulse" />
            )}
            </div> :

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {sortedServices.map((service) =>
            <ServiceCard
              key={service.id}
              service={service}
              onAddToCart={addToCart} />

            )}
            </AnimatePresence>
          </div>
          }

          {sortedServices.length === 0 && !isLoading &&
          <div className="text-center py-12">
              <p className="text-slate-500">No services found. Try adjusting your filters.</p>
            </div>
          }
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-blue-900 to-blue-800">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Start Your UAE Journey?
          </h2>
          <p className="text-blue-100 text-lg mb-8">
            Get your visa approved quickly and hassle-free. Our team is here to help you every step of the way.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-amber-500 hover:bg-amber-600 text-white"
              onClick={() => document.getElementById('services').scrollIntoView({ behavior: 'smooth' })}>

              Apply Now
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Link to={createPageUrl('Terms')}>
              <Button size="lg" variant="outline" className="bg-background text-amber-500 px-8 text-sm font-medium rounded-md inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border shadow-sm hover:text-accent-foreground h-10 border-white/30 hover:bg-white/10 w-full">
                View Terms & Conditions
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <WhatsAppButton />
    </div>);

}