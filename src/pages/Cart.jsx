import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingCart, ArrowLeft, Trash2, AlertCircle, 
  Check, Loader2, FileText
} from 'lucide-react';
import CartItem from '@/components/cart/CartItem';
import ApplicantForm from '@/components/forms/ApplicantForm';
import WhatsAppButton from '@/components/ui/WhatsAppButton';

export default function Cart() {
  const navigate = useNavigate();
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('uae_visa_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [isKnownCustomer, setIsKnownCustomer] = useState(false);
  const [knownCustomerEmail, setKnownCustomerEmail] = useState(null);
  
  const [customerInfo, setCustomerInfo] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
  });
  
  const [editingIndex, setEditingIndex] = useState(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    localStorage.setItem('uae_visa_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    window.scrollTo(0, 0);
    checkKnownCustomerStatus();
  }, []);

  const checkKnownCustomerStatus = async () => {
    try {
      const authenticated = await base44.auth.isAuthenticated();
      if (authenticated) {
        const user = await base44.auth.me();
        // Only set as known customer if user has customer_type = 'known_customer'
        if (user.customer_type === 'known_customer') {
          setIsKnownCustomer(true);
          setKnownCustomerEmail(user.email);
          // Pre-fill customer info if known customer
          setCustomerInfo(prev => ({
            ...prev,
            customer_email: user.email,
            customer_name: user.full_name || prev.customer_name,
          }));
        }
      }
    } catch (error) {
      console.error('Error checking authentication:', error);
    }
  };

  const removeItem = (index) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const updateApplicant = (index, applicantData) => {
    setCart(prev => prev.map((item, i) => 
      i === index ? { ...item, applicant: applicantData } : item
    ));
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.service.price, 0);
  const allApplicantsFilled = cart.every(item => item.applicant?.applicant_name);

  const generateTrackingNumber = () => {
    // Generate a 6-digit tracking number
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const validateCustomerInfo = () => {
    const newErrors = {};
    if (!customerInfo.customer_name) newErrors.customer_name = 'Name is required';
    if (!customerInfo.customer_email) newErrors.customer_email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(customerInfo.customer_email)) newErrors.customer_email = 'Invalid email';
    if (!customerInfo.customer_phone) newErrors.customer_phone = 'Phone is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateCustomerInfo()) return;
    if (!allApplicantsFilled) return;
    if (!termsAccepted) return;

    setSubmitting(true);

    const trackingNumber = generateTrackingNumber();
    
    // Create order
    const order = await base44.entities.Order.create({
      tracking_number: trackingNumber,
      ...customerInfo,
      total_amount: totalAmount,
      status: 'pending_review',
      terms_accepted: true,
      terms_accepted_date: new Date().toISOString(),
      is_known_customer: isKnownCustomer,
      customer_user_email: knownCustomerEmail || undefined,
    });

    // Create applications
    for (const item of cart) {
      await base44.entities.Application.create({
        order_id: order.id,
        service_id: item.service.id,
        service_name: item.service.name,
        service_price: item.service.price,
        ...item.applicant,
        status: 'pending',
        is_known_customer: isKnownCustomer,
        customer_user_email: knownCustomerEmail || undefined,
      });
    }

    // Clear cart
    localStorage.removeItem('uae_visa_cart');
    
    // Navigate to confirmation
    navigate(createPageUrl('Confirmation') + `?tracking=${trackingNumber}`);
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingCart className="w-10 h-10 text-slate-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Your cart is empty</h2>
          <p className="text-slate-500 mb-6">Add some services to get started with your visa application</p>
          <Link to={createPageUrl('Home')}>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Browse Services
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link to={createPageUrl('Home')} className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Services
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Your Cart</h1>
              <p className="text-slate-500 mt-1">{cart.length} item{cart.length > 1 ? 's' : ''} in your application</p>
            </div>
            {isKnownCustomer && (
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg shadow-md flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span className="text-sm font-semibold">Known Customer</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Application Items
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <AnimatePresence>
                  {cart.map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                    >
                      <CartItem
                        item={item}
                        index={index}
                        onRemove={removeItem}
                        onEdit={setEditingIndex}
                        isComplete={!!item.applicant?.applicant_name}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </CardContent>
            </Card>

            {/* Customer Information */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">Contact Information</CardTitle>
                <p className="text-sm text-slate-500">We'll use this to send you updates about your application</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={customerInfo.customer_name}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, customer_name: e.target.value }))}
                      placeholder="Your full name"
                      className={errors.customer_name ? 'border-red-500' : ''}
                    />
                    {errors.customer_name && <p className="text-xs text-red-500">{errors.customer_name}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={customerInfo.customer_email}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, customer_email: e.target.value }))}
                      placeholder="your@email.com"
                      className={errors.customer_email ? 'border-red-500' : ''}
                    />
                    {errors.customer_email && <p className="text-xs text-red-500">{errors.customer_email}</p>}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={customerInfo.customer_phone}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, customer_phone: e.target.value }))}
                    placeholder="+971 50 123 4567"
                    className={errors.customer_phone ? 'border-red-500' : ''}
                  />
                  {errors.customer_phone && <p className="text-xs text-red-500">{errors.customer_phone}</p>}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="border-0 shadow-lg sticky top-4">
              <CardHeader>
                <CardTitle className="text-lg">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cart.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-slate-600">{item.service.name}</span>
                    <span className="font-medium">AED {item.service.price}</span>
                  </div>
                ))}
                
                <Separator />
                
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>AED {totalAmount.toFixed(2)}</span>
                </div>

                {!allApplicantsFilled && (
                  <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-amber-700">
                      Please fill in details for all applicants before submitting.
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="terms"
                      checked={termsAccepted}
                      onCheckedChange={setTermsAccepted}
                    />
                    <label htmlFor="terms" className="text-sm text-slate-600 leading-tight">
                      I agree to the{' '}
                      <Link to={createPageUrl('Terms')} className="text-blue-600 hover:underline" target="_blank">
                        Terms & Conditions
                      </Link>
                      {' '}and confirm all information provided is accurate.
                    </label>
                  </div>

                  <Button 
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                    size="lg"
                    onClick={handleSubmit}
                    disabled={!allApplicantsFilled || !termsAccepted || submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Check className="w-5 h-5 mr-2" />
                        Submit Application - No payment now
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-center text-slate-500">
                    Payment will be requested after our team reviews your application
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Applicant Form Modal */}
      {editingIndex !== null && (
        <ApplicantForm
          isOpen={true}
          onClose={() => setEditingIndex(null)}
          onSave={(data) => updateApplicant(editingIndex, data)}
          initialData={cart[editingIndex]?.applicant}
          serviceName={cart[editingIndex]?.service.name}
          serviceCategory={cart[editingIndex]?.service.category}
        />
      )}

      <WhatsAppButton />
    </div>
  );
}