import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import {
  Search, ArrowLeft, Loader2, AlertCircle,
  User, FileText, Calendar, CreditCard, Plane, Shield, Download } from
'lucide-react';
import OrderTracker from '@/components/tracking/OrderTracker';
import StatusBadge from '@/components/tracking/StatusBadge';
import WhatsAppButton from '@/components/ui/WhatsAppButton';

export default function Track() {
  const urlParams = new URLSearchParams(window.location.search);
  const initialTracking = urlParams.get('tracking') || '';

  const [trackingNumber, setTrackingNumber] = useState(initialTracking);
  const [order, setOrder] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (initialTracking) {
      handleSearch();
    }
  }, []);

  const handleSearch = async () => {
    if (!trackingNumber.trim()) {
      setError('Please enter a tracking number');
      return;
    }

    setLoading(true);
    setError('');
    setSearched(true);

    const orders = await base44.entities.Order.filter({ tracking_number: trackingNumber.trim() });

    if (orders.length === 0) {
      setError('No application found with this tracking number');
      setOrder(null);
      setApplications([]);
    } else {
      setOrder(orders[0]);
      const apps = await base44.entities.Application.filter({ order_id: orders[0].id });
      setApplications(apps);
    }

    setLoading(false);
  };

  const handleConfirmPayment = async () => {
    // Customer confirms payment was made
    await base44.entities.Order.update(order.id, {
      status: 'paid',
      payment_date: new Date().toISOString()
    });

    // Refresh order
    const updatedOrders = await base44.entities.Order.filter({ tracking_number: trackingNumber });
    setOrder(updatedOrders[0]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-900 to-blue-800 text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <Link to={createPageUrl('Home')} className="inline-flex items-center text-blue-200 hover:text-white mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Track Your Application</h1>
          <p className="text-blue-100 mb-8">Enter your tracking number to check the status of your visa application</p>
          
          <div className="flex gap-2 max-w-md mx-auto">
            <Input
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="Enter 10-digit tracking number"
              className="bg-white/10 border-white/20 text-white placeholder:text-blue-200 text-lg text-center tracking-widest"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />

            <Button
              onClick={handleSearch}
              disabled={loading}
              className="bg-amber-500 hover:bg-amber-600 px-6">

              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <AnimatePresence mode="wait">
          {error &&
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex items-center justify-center gap-3 p-6 bg-red-50 border border-red-200 rounded-xl">

              <AlertCircle className="w-6 h-6 text-red-500" />
              <p className="text-red-700">{error}</p>
            </motion.div>
          }

          {order &&
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6">

              {/* Order Status */}
              <OrderTracker currentStatus={order.status} />

              {/* Order Details */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">Application Details</CardTitle>
                    <p className="text-sm text-slate-500 mt-1">
                      Submitted on {format(new Date(order.created_date), 'MMMM d, yyyy')}
                    </p>
                  </div>
                  <StatusBadge status={order.status} size="lg" />
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-100">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Applicant</p>
                        <p className="font-medium">{order.customer_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-100">
                        <FileText className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Total Items</p>
                        <p className="font-medium">{applications.length} applicant{applications.length > 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-amber-100">
                        <CreditCard className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Total Amount</p>
                        <p className="font-medium">AED {order.total_amount?.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Payment CTA */}
                  {(order.status === 'ready_for_processing' || order.status === 'payment_pending') && order.payment_link && (
                    <div className="bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200 rounded-xl p-6 text-center">
                      <h3 className="font-semibold text-lg text-amber-800 mb-2">
                        Your Application is Approved!
                      </h3>
                      <p className="text-amber-700 mb-4">
                        Please complete the payment to start visa processing
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <a href={order.payment_link} target="_blank" rel="noopener noreferrer">
                          <Button className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700">
                            <CreditCard className="w-5 h-5 mr-2" />
                            Pay Now
                          </Button>
                        </a>
                        <Button 
                          onClick={handleConfirmPayment}
                          variant="outline"
                          className="border-amber-300 text-amber-700 hover:bg-amber-50"
                        >
                          I Have Completed Payment - AED {order.total_amount?.toFixed(2)}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Visa Download */}
                  {order.status === 'completed' && order.visa_document_url &&
                <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-xl p-6 text-center">
                      <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="font-semibold text-lg text-green-800 mb-2">
                        Your Visa is Ready!
                      </h3>
                      <p className="text-green-700 mb-4">
                        Your visa has been processed and is ready for download
                      </p>
                      <a href={order.visa_document_url} target="_blank" rel="noopener noreferrer" download>
                        <Button
                      className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800">

                          <FileText className="w-5 h-5 mr-2" />
                          Download Visa PDF
                        </Button>
                      </a>
                    </div>
                }

                  {order.status === 'returned_for_modification' &&
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 mt-4">
                      <h3 className="text-orange-800 font-semibold mb-2">Modification Required</h3>
                      <p className="text-orange-700 mb-4">{order.modification_notes}</p>
                      <Button
                    onClick={() => window.location.href = createPageUrl('EditApplication') + `?tracking=${order.tracking_number}`}
                    className="bg-orange-600 hover:bg-orange-700">

                        Edit Application
                      </Button>
                    </div>
                }

                  {order.rejection_reason &&
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mt-4">
                      <p className="text-red-800 font-medium">Rejection Reason:</p>
                      <p className="text-red-700">{order.rejection_reason}</p>
                    </div>
                }
                </CardContent>
              </Card>

              {/* Individual Applications */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">Applicants</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                {applications.map((app, index) => {
                  const Icon = app.service_name?.toLowerCase().includes('visa') ? Plane : Shield;

                  return (
                    <motion.div
                      key={app.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 bg-slate-50 rounded-xl">

                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-lg bg-white shadow-sm">
                            <Icon className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">{app.applicant_name}</p>
                            <p className="text-sm text-slate-500">{app.service_name}</p>
                          </div>
                        </div>
                        <StatusBadge status={app.status} />
                      </div>
                      <div className="flex items-center justify-between text-sm border-t pt-3">
                        <span className="text-slate-600">Service Fee:</span>
                        <span className="font-medium">AED {app.service_price?.toFixed(2)}</span>
                      </div>
                      {app.security_deposit > 0 &&
                      <div className="flex items-center justify-between text-sm border-t pt-2">
                          <span className="text-slate-600">Security Deposit:</span>
                          <span className="font-medium text-amber-600">AED {app.security_deposit?.toFixed(2)}</span>
                        </div>
                      }
                    </motion.div>);

                })}
                </CardContent>
              </Card>
            </motion.div>
          }

          {!order && !error && searched && !loading &&
          <div className="text-center py-12">
              <p className="text-slate-500">No results found</p>
            </div>
          }

          {!searched && !loading &&
          <div className="text-center py-12">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-slate-500">Enter your tracking number above to view your application status</p>
            </div>
          }
        </AnimatePresence>
      </div>

      <WhatsAppButton />
    </div>);

}