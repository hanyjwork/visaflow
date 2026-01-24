import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import ApplicantForm from '@/components/forms/ApplicantForm';
import WhatsAppButton from '@/components/ui/WhatsAppButton';

export default function EditApplication() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const trackingNumber = urlParams.get('tracking');
  
  const [order, setOrder] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingIndex, setEditingIndex] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [hasEditedAny, setHasEditedAny] = useState(false);

  useEffect(() => {
    loadOrderAndApplications();
  }, []);

  const loadOrderAndApplications = async () => {
    if (!trackingNumber) {
      setError('No tracking number provided');
      setLoading(false);
      return;
    }

    const orders = await base44.entities.Order.filter({ tracking_number: trackingNumber });
    
    if (orders.length === 0 || orders[0].status !== 'returned_for_modification') {
      setError('Application not found or not available for editing');
      setLoading(false);
      return;
    }

    setOrder(orders[0]);
    const apps = await base44.entities.Application.filter({ order_id: orders[0].id });
    setApplications(apps);
    setLoading(false);
  };

  const updateApplicant = async (index, applicantData) => {
    const app = applications[index];
    await base44.entities.Application.update(app.id, applicantData);
    
    // Reload applications
    const apps = await base44.entities.Application.filter({ order_id: order.id });
    setApplications(apps);
    setHasEditedAny(true);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    
    // Update order status back to pending review
    await base44.entities.Order.update(order.id, {
      status: 'pending_review',
      modification_notes: null
    });

    // Update all applications status
    for (const app of applications) {
      await base44.entities.Application.update(app.id, {
        status: 'pending'
      });
    }

    navigate(createPageUrl('Confirmation') + `?tracking=${trackingNumber}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <Card className="max-w-md w-full border-0 shadow-lg">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Error</h2>
            <p className="text-slate-600 mb-6">{error}</p>
            <Link to={createPageUrl('Track')}>
              <Button>Go to Tracking</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link to={createPageUrl('Track') + `?tracking=${trackingNumber}`} className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Tracking
          </Link>
          <h1 className="text-3xl font-bold text-slate-800">Edit Application</h1>
          <p className="text-slate-500 mt-1">Update your application details as requested</p>
        </div>

        {/* Modification Notice */}
        {order.modification_notes && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-orange-800 mb-2">Modification Required</h3>
                    <p className="text-orange-700">{order.modification_notes}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Applications List */}
        <Card className="border-0 shadow-lg mb-6">
          <CardHeader>
            <CardTitle>Your Applications</CardTitle>
            <p className="text-sm text-slate-500">Click on any application to edit its details</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {applications.map((app, index) => (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <div>
                  <p className="font-medium text-slate-800">{app.applicant_name}</p>
                  <p className="text-sm text-slate-500">{app.service_name}</p>
                </div>
                <Button
                  onClick={() => setEditingIndex(index)}
                  className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white"
                >
                  Edit Details
                </Button>
              </motion.div>
            ))}
          </CardContent>
        </Card>

        {/* Submit Button */}
        {hasEditedAny && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100 shadow-xl">
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <div>
                    <p className="font-semibold text-lg text-blue-900">Ready to resubmit?</p>
                    <p className="text-sm text-blue-700">Make sure all details are correct before submitting</p>
                  </div>
                  <Button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg"
                    size="lg"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Resubmit Application
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
        
        {!hasEditedAny && (
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-800">Ready to resubmit?</p>
                  <p className="text-sm text-slate-500">Make sure all details are correct before submitting</p>
                </div>
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  variant="outline"
                  className="border-slate-300 text-slate-600"
                  size="lg"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Resubmit Application
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Applicant Form Modal */}
      {editingIndex !== null && (
        <ApplicantForm
          isOpen={true}
          onClose={() => setEditingIndex(null)}
          onSave={(data) => {
            updateApplicant(editingIndex, data);
            setEditingIndex(null);
          }}
          initialData={applications[editingIndex]}
          serviceName={applications[editingIndex]?.service_name}
        />
      )}

      <WhatsAppButton />
    </div>
  );
}