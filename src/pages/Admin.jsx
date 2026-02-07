import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from 'date-fns';
import { 
  Search, FileText, Clock, CheckCircle, 
  XCircle, Eye, CreditCard, Loader2, RefreshCw, Download, Upload, ExternalLink, Image as ImageIcon, ShieldAlert, Shield, AlertCircle, Send, Settings
} from 'lucide-react';
import StatusBadge from '@/components/tracking/StatusBadge';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function Admin() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [applications, setApplications] = useState([]);
  const [actionDialog, setActionDialog] = useState({ open: false, type: '', order: null });
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [modificationNotes, setModificationNotes] = useState('');
  const [securityDeposits, setSecurityDeposits] = useState({});
  const [paymentLink, setPaymentLink] = useState('');
  const [uploadingVisa, setUploadingVisa] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [editingPaymentLink, setEditingPaymentLink] = useState(false);
  const [editedPaymentLink, setEditedPaymentLink] = useState('');
  const [visaActionDialog, setVisaActionDialog] = useState({ open: false, order: null, applications: [] });
  const [applicantVisaActions, setApplicantVisaActions] = useState({});

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

  const { data: orders = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => base44.entities.Order.list('-created_date'),
  });

  const updateOrderMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Order.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      setActionDialog({ open: false, type: '', order: null });
    },
  });

  const updateApplicationsMutation = useMutation({
    mutationFn: async ({ orderId, status }) => {
      const apps = await base44.entities.Application.filter({ order_id: orderId });
      for (const app of apps) {
        await base44.entities.Application.update(app.id, { status });
      }
    },
  });

  // Helper function to update order status based on all applications
  const updateOrderStatusBasedOnApplications = async (orderId) => {
    const allApps = await base44.entities.Application.filter({ order_id: orderId });
    
    if (allApps.length === 0) return;

    // Check if all applications are fully processed (completed or rejected)
    const allProcessed = allApps.every(app => 
      app.status === 'completed' || app.status === 'rejected'
    );

    // If all applications are processed, mark the order as completed
    // Order status reflects processing state, not individual outcomes
    if (allProcessed) {
      await base44.entities.Order.update(orderId, {
        status: 'completed'
      });
    }
  };

  const loadApplications = async (order) => {
    const apps = await base44.entities.Application.filter({ order_id: order.id });
    setApplications(apps);
    setSelectedOrder(order);
    setEditedPaymentLink(order.payment_link || '');
    setEditingPaymentLink(false);
    
    // Initialize security deposits
    const deposits = {};
    apps.forEach(app => {
      deposits[app.id] = app.security_deposit || 0;
    });
    setSecurityDeposits(deposits);
  };

  const handleApprove = async () => {
    if (!paymentLink) {
      alert('Please provide a payment link');
      return;
    }

    // Update applications with security deposits
    const apps = await base44.entities.Application.filter({ order_id: actionDialog.order.id });
    for (const app of apps) {
      await base44.entities.Application.update(app.id, { 
        security_deposit: securityDeposits[app.id] || 0 
      });
    }
    
    // Calculate new total with security deposits
    const totalDeposits = Object.values(securityDeposits).reduce((sum, val) => sum + (Number(val) || 0), 0);
    const newTotal = actionDialog.order.total_amount + totalDeposits;
    
    await updateOrderMutation.mutateAsync({
      id: actionDialog.order.id,
      data: { 
        status: 'payment_pending', 
        admin_notes: adminNotes,
        total_amount: newTotal,
        payment_link: paymentLink
      }
    });
    await updateApplicationsMutation.mutateAsync({
      orderId: actionDialog.order.id,
      status: 'ready_for_processing'
    });
    setAdminNotes('');
    setSecurityDeposits({});
    setPaymentLink('');
  };

  const handleReject = async () => {
    await updateOrderMutation.mutateAsync({
      id: actionDialog.order.id,
      data: { 
        status: 'cannot_process_application', 
        rejection_reason: rejectionReason,
        admin_notes: adminNotes 
      }
    });
    await updateApplicationsMutation.mutateAsync({
      orderId: actionDialog.order.id,
      status: 'cannot_process_application'
    });
    setRejectionReason('');
    setAdminNotes('');
  };

  const handleReturnForModification = async () => {
    await updateOrderMutation.mutateAsync({
      id: actionDialog.order.id,
      data: { 
        status: 'returned_for_modification',
        modification_notes: modificationNotes,
        admin_notes: adminNotes 
      }
    });
    await updateApplicationsMutation.mutateAsync({
      orderId: actionDialog.order.id,
      status: 'returned_for_modification'
    });
    setModificationNotes('');
    setAdminNotes('');
  };

  const handleMarkProcessing = async (order) => {
    await updateOrderMutation.mutateAsync({
      id: order.id,
      data: { status: 'processing' }
    });
    await updateApplicationsMutation.mutateAsync({
      orderId: order.id,
      status: 'processing'
    });
  };

  const handleVisaUpload = async (applicationId, file) => {
    setUploadingVisa(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      // Update individual application status to completed
      await base44.entities.Application.update(applicationId, {
        visa_document_url: file_url,
        status: 'completed'
      });

      // Update order status based on all applications
      await updateOrderStatusBasedOnApplications(visaActionDialog.order.id);

      // Refresh the applications list
      const updatedApps = await base44.entities.Application.filter({ order_id: visaActionDialog.order.id });
      setVisaActionDialog(prev => ({ ...prev, applications: updatedApps }));
      
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    } catch (error) {
      alert('Failed to upload visa document');
    } finally {
      setUploadingVisa(false);
    }
  };

  const handleGovernmentRejection = async (applicationId, reason) => {
    if (!reason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    // Update individual application status to rejected
    await base44.entities.Application.update(applicationId, {
      status: 'rejected',
      government_rejection_reason: reason
    });

    // Update order status based on all applications
    await updateOrderStatusBasedOnApplications(visaActionDialog.order.id);

    // Refresh the applications list
    const updatedApps = await base44.entities.Application.filter({ order_id: visaActionDialog.order.id });
    setVisaActionDialog(prev => ({ ...prev, applications: updatedApps }));
    setApplicantVisaActions(prev => {
      const updated = { ...prev };
      delete updated[applicationId];
      return updated;
    });

    queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
  };

  const handleMarkCompleted = async (order) => {
    await updateOrderMutation.mutateAsync({
      id: order.id,
      data: { status: 'completed' }
    });
    await updateApplicationsMutation.mutateAsync({
      orderId: order.id,
      status: 'completed'
    });
  };

  const handleUpdateOrder = async (orderId, data) => {
    await updateOrderMutation.mutateAsync({ id: orderId, data });
    const updatedOrders = await base44.entities.Order.filter({ id: orderId });
    if (updatedOrders[0]) {
      setSelectedOrder(updatedOrders[0]);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.tracking_number?.includes(searchQuery) ||
      order.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending_review').length,
    approved: orders.filter(o => o.status === 'ready_for_processing' || o.status === 'payment_pending').length,
    awaiting_verification: orders.filter(o => o.status === 'customer_confirmed_payment').length,
    paid: orders.filter(o => o.status === 'paid' || o.status === 'processing').length,
  };

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
                  You must be logged in to access the admin dashboard.
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
                  You do not have permission to access the admin dashboard. This area is restricted to administrators only.
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
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Admin Dashboard</h1>
            <p className="text-slate-500">Manage visa applications</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="px-3 py-2 bg-slate-100 rounded-lg">
              <span className="text-xs font-medium text-slate-600 block mb-1">Application Settings:</span>
              <a 
                href="/ManageNationalities" 
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
              >
                <Settings className="w-4 h-4" />
                Manage Nationalities
              </a>
              <a 
                href="/ManageServices" 
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 mt-1"
              >
                <Settings className="w-4 h-4" />
                Manage Services
              </a>
            </div>
            <Button onClick={() => refetch()} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Orders', value: stats.total, icon: FileText, color: 'blue' },
            { label: 'Pending Review', value: stats.pending, icon: Clock, color: 'amber' },
            { label: 'Awaiting Verification', value: stats.awaiting_verification, icon: AlertCircle, color: 'purple' },
            { label: 'Paid/Processing', value: stats.paid, icon: CreditCard, color: 'green' },
          ].map((stat, index) => (
            <Card key={index} className="border-0 shadow-md">
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`p-3 rounded-xl bg-${stat.color}-100`}>
                  <stat.icon className={`w-5 h-5 text-${stat.color}-600`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
                  <p className="text-sm text-slate-500">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by tracking number, name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending_review">Pending Review</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="ready_for_processing">Ready for Processing</SelectItem>
                <SelectItem value="payment_pending">Payment Pending</SelectItem>
                <SelectItem value="customer_confirmed_payment">Customer Confirmed Payment</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cannot_process_application">Cannot Process Application</SelectItem>
                <SelectItem value="returned_for_modification">Returned for Modification</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>Applications</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tracking #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => (
                      <TableRow key={order.id} className="hover:bg-slate-50">
                        <TableCell className="font-mono font-medium">
                          {order.tracking_number}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{order.customer_name}</p>
                            <p className="text-sm text-slate-500">{order.customer_email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {format(new Date(order.created_date), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell className="font-medium">
                          AED {order.total_amount?.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={order.status} />
                        </TableCell>
                        <TableCell>
                          {order.is_known_customer ? (
                            <Badge className="bg-blue-100 text-blue-700 border-blue-300">
                              <Shield className="w-3 h-3 mr-1" />
                              Known Customer
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-slate-500">
                              Regular
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => loadApplications(order)}
                              title="View order details"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            
                            {(order.status === 'pending_review' || order.status === 'returned_for_modification') && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-green-600"
                                  onClick={() => setActionDialog({ open: true, type: 'approve', order })}
                                  title="Approve application"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-amber-600"
                                  onClick={() => setActionDialog({ open: true, type: 'return', order })}
                                  title="Return for modification"
                                >
                                  <RefreshCw className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600"
                                  onClick={() => setActionDialog({ open: true, type: 'reject', order })}
                                  title="Cannot process application"
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </>
                            )}

                            {order.status === 'customer_confirmed_payment' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-purple-600"
                                onClick={() => loadApplications(order)}
                                title="Verify payment"
                              >
                                <AlertCircle className="w-4 h-4" />
                              </Button>
                            )}

                            {order.status === 'paid' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-blue-600"
                                onClick={() => handleMarkProcessing(order)}
                                title="Mark as processing"
                              >
                                Start Processing
                              </Button>
                            )}

                            {order.status === 'processing' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-green-600"
                                onClick={async () => {
                                  const apps = await base44.entities.Application.filter({ order_id: order.id });
                                  setVisaActionDialog({ open: true, order, applications: apps });
                                  setApplicantVisaActions({});
                                }}
                                title="Upload visa or mark as rejected"
                              >
                                <Upload className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Details Dialog */}
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Order Details - #{selectedOrder?.tracking_number}</DialogTitle>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-6">
                {selectedOrder.is_known_customer && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Shield className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-blue-900">Known Customer Order</p>
                      <p className="text-sm text-blue-700">This order was submitted by an authenticated known customer</p>
                      {selectedOrder.customer_user_email && (
                        <p className="text-xs text-blue-600 mt-1">Account: {selectedOrder.customer_user_email}</p>
                      )}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500">Customer</p>
                    <p className="font-medium">{selectedOrder.customer_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Email</p>
                    <p className="font-medium">{selectedOrder.customer_email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Phone</p>
                    <p className="font-medium">{selectedOrder.customer_phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Status</p>
                    <StatusBadge status={selectedOrder.status} />
                  </div>
                </div>

                {(selectedOrder.payment_link || editingPaymentLink) && (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-slate-500">Payment Link:</p>
                      {!editingPaymentLink ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingPaymentLink(true)}
                          className="h-7 text-xs text-blue-600"
                        >
                          Update Payment link
                        </Button>
                      ) : (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingPaymentLink(false);
                              setEditedPaymentLink(selectedOrder.payment_link || '');
                            }}
                            className="h-7 text-xs"
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={async () => {
                              await handleUpdateOrder(selectedOrder.id, { payment_link: editedPaymentLink });
                              setEditingPaymentLink(false);
                            }}
                            disabled={updateOrderMutation.isPending}
                            className="h-7 text-xs bg-blue-600 hover:bg-blue-700"
                          >
                            Save
                          </Button>
                        </div>
                      )}
                    </div>
                    {editingPaymentLink ? (
                      <Input
                        type="url"
                        value={editedPaymentLink}
                        onChange={(e) => setEditedPaymentLink(e.target.value)}
                        placeholder="https://payment-gateway.com/..."
                        className="bg-white"
                      />
                    ) : (
                      <a 
                        href={selectedOrder.payment_link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm flex items-center gap-2"
                      >
                        <span className="truncate">{selectedOrder.payment_link}</span>
                        <ExternalLink className="w-4 h-4 flex-shrink-0" />
                      </a>
                    )}
                  </div>
                )}

                {selectedOrder.status === 'customer_confirmed_payment' && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-purple-600" />
                      <p className="font-medium text-purple-800">Customer Confirmed Payment</p>
                    </div>
                    <p className="text-sm text-purple-700 mb-3">
                      Customer has confirmed they completed the payment. Please verify the payment receipt before proceeding.
                    </p>
                    {selectedOrder.customer_payment_confirmation_date && (
                      <p className="text-xs text-purple-600 mb-3">
                        Confirmed on: {format(new Date(selectedOrder.customer_payment_confirmation_date), 'MMM d, yyyy HH:mm')}
                      </p>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        onClick={async () => {
                          await updateOrderMutation.mutateAsync({
                            id: selectedOrder.id,
                            data: { 
                              status: 'payment_pending',
                              customer_payment_confirmation_date: null,
                              admin_notes: (selectedOrder.admin_notes || '') + '\n[Admin rejected payment confirmation - ' + new Date().toLocaleString() + ']'
                            }
                          });
                          setSelectedOrder(null);
                        }}
                        disabled={updateOrderMutation.isPending}
                        variant="outline"
                        className="border-red-300 text-red-700 hover:bg-red-50"
                      >
                        {updateOrderMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <XCircle className="w-4 h-4 mr-2" />
                        )}
                        Payment Not Received
                      </Button>
                      <Button
                        onClick={async () => {
                          await updateOrderMutation.mutateAsync({
                            id: selectedOrder.id,
                            data: { 
                              status: 'paid',
                              admin_payment_verification_date: new Date().toISOString()
                            }
                          });
                          setSelectedOrder(null);
                        }}
                        disabled={updateOrderMutation.isPending}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {updateOrderMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <CheckCircle className="w-4 h-4 mr-2" />
                        )}
                        I confirm that customer has paid
                      </Button>
                    </div>
                  </div>
                )}



                <div>
                  <h4 className="font-medium mb-3">Applicants ({applications.length})</h4>
                  <div className="space-y-3">
                    {applications.map((app) => (
                      <Card key={app.id} className="p-4">
                        {app.is_known_customer && (
                          <div className="mb-3 flex items-center gap-2 text-sm text-blue-700 bg-blue-50 px-3 py-1.5 rounded-md border border-blue-200 w-fit">
                            <Shield className="w-4 h-4" />
                            <span className="font-medium">Known Customer</span>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-slate-500">Name</p>
                            <p className="font-medium">{app.applicant_name}</p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-500">Passport</p>
                            <p className="font-medium">{app.passport_number}</p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-500">Nationality</p>
                            <p className="font-medium">{app.nationality}</p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-500">Residence Country</p>
                            <p className="font-medium">{app.residence_country || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-500">Expected Travel Date</p>
                            <p className="font-medium">{app.expected_travel_date ? format(new Date(app.expected_travel_date), 'MMM d, yyyy') : 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-500">Service</p>
                            <p className="font-medium">{app.service_name}</p>
                          </div>
                        </div>
                        <div className="mt-4 space-y-3">
                          <div className="border-t pt-3">
                            <h5 className="text-sm font-medium text-slate-700 mb-2">Documents</h5>
                            <div className="grid grid-cols-2 gap-2">
                              {app.passport_front_url && (
                                <a 
                                  href={app.passport_front_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 text-blue-600 text-sm hover:bg-blue-50 p-2 rounded border border-blue-200"
                                >
                                  <FileText className="w-4 h-4" />
                                  <span>Passport Front</span>
                                  <Download className="w-3 h-3 ml-auto" />
                                </a>
                              )}
                              {app.passport_cover_url && (
                                <a 
                                  href={app.passport_cover_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 text-blue-600 text-sm hover:bg-blue-50 p-2 rounded border border-blue-200"
                                >
                                  <FileText className="w-4 h-4" />
                                  <span>Passport Cover</span>
                                  <Download className="w-3 h-3 ml-auto" />
                                </a>
                              )}
                              {app.photo_url && (
                                <a 
                                  href={app.photo_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 text-blue-600 text-sm hover:bg-blue-50 p-2 rounded border border-blue-200"
                                >
                                  <ImageIcon className="w-4 h-4" />
                                  <span>Personal Photo</span>
                                  <Download className="w-3 h-3 ml-auto" />
                                </a>
                              )}
                            </div>
                          </div>
                          {app.supporting_documents_urls && app.supporting_documents_urls.length > 0 && (
                            <div className="border-t pt-3">
                              <h5 className="text-sm font-medium text-slate-700 mb-2">Supporting Documents ({app.supporting_documents_urls.length})</h5>
                              <div className="grid grid-cols-2 gap-2">
                                {app.supporting_documents_urls.map((url, idx) => (
                                  <a 
                                    key={idx}
                                    href={url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-slate-600 text-sm hover:bg-slate-50 p-2 rounded border border-slate-200"
                                  >
                                    <FileText className="w-4 h-4" />
                                    <span>Document {idx + 1}</span>
                                    <Download className="w-3 h-3 ml-auto" />
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                          {app.visa_document_url && (
                            <div className="border-t pt-3 bg-green-50 px-3 py-2 rounded-md">
                              <p className="text-xs text-green-700 font-medium mb-1">✓ Visa Issued</p>
                              <a 
                                href={app.visa_document_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-green-600 hover:underline text-sm flex items-center gap-2"
                              >
                                <Download className="w-4 h-4" />
                                Download Visa PDF
                              </a>
                            </div>
                          )}
                          {app.government_rejection_reason && (
                            <div className="border-t pt-3 bg-red-50 px-3 py-2 rounded-md">
                              <p className="text-xs text-red-700 font-medium mb-1">✗ Government Rejected</p>
                              <p className="text-sm text-red-700">{app.government_rejection_reason}</p>
                            </div>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Visa Upload/Rejection Dialog - Per Applicant */}
        <Dialog open={visaActionDialog.open} onOpenChange={() => {
          setVisaActionDialog({ open: false, order: null, applications: [] });
          setApplicantVisaActions({});
        }}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Process Visas - #{visaActionDialog.order?.tracking_number}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                Upload the issued visa or mark as government rejected for each applicant:
              </p>

              {visaActionDialog.applications.map((app) => (
                <Card key={app.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-slate-800">{app.applicant_name}</h4>
                      <p className="text-sm text-slate-500">{app.service_name}</p>
                    </div>
                    <StatusBadge status={app.status} />
                  </div>

                  {app.status === 'completed' && app.visa_document_url ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-green-700 mb-2">
                        <CheckCircle className="w-4 h-4" />
                        <span className="font-medium text-sm">Visa Issued</span>
                      </div>
                      <a 
                        href={app.visa_document_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-green-600 hover:underline text-sm flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Download Visa PDF
                      </a>
                    </div>
                  ) : app.status === 'rejected' && app.government_rejection_reason ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-red-700 mb-2">
                        <XCircle className="w-4 h-4" />
                        <span className="font-medium text-sm">Government Rejected</span>
                      </div>
                      <p className="text-sm text-red-700">{app.government_rejection_reason}</p>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-3">
                      {/* Upload Visa */}
                      <div className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-center gap-2 text-green-700">
                          <CheckCircle className="w-4 h-4" />
                          <span className="font-medium text-sm">Upload Visa</span>
                        </div>
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            accept=".pdf"
                            className="hidden"
                            onChange={(e) => e.target.files?.[0] && handleVisaUpload(app.id, e.target.files[0])}
                            disabled={uploadingVisa}
                          />
                          <Button
                            size="sm"
                            className="w-full bg-green-600 hover:bg-green-700"
                            disabled={uploadingVisa}
                            asChild
                          >
                            <span>
                              {uploadingVisa ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                  Uploading...
                                </>
                              ) : (
                                <>
                                  <Upload className="w-4 h-4 mr-2" />
                                  Select PDF
                                </>
                              )}
                            </span>
                          </Button>
                        </label>
                      </div>

                      {/* Government Rejection */}
                      <div className="border border-red-200 rounded-lg p-3 space-y-2 bg-red-50">
                        <div className="flex items-center gap-2 text-red-700">
                          <XCircle className="w-4 h-4" />
                          <span className="font-medium text-sm">Gov. Rejected</span>
                        </div>
                        {applicantVisaActions[app.id]?.showRejectionInput ? (
                          <div className="space-y-2">
                            <Textarea
                              value={applicantVisaActions[app.id]?.rejectionReason || ''}
                              onChange={(e) => setApplicantVisaActions(prev => ({
                                ...prev,
                                [app.id]: { ...prev[app.id], rejectionReason: e.target.value }
                              }))}
                              placeholder="Enter reason..."
                              rows={2}
                              className="bg-white text-xs"
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setApplicantVisaActions(prev => {
                                  const updated = { ...prev };
                                  delete updated[app.id];
                                  return updated;
                                })}
                                className="flex-1 text-xs"
                              >
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleGovernmentRejection(app.id, applicantVisaActions[app.id]?.rejectionReason)}
                                disabled={!applicantVisaActions[app.id]?.rejectionReason?.trim()}
                                className="flex-1 text-xs"
                              >
                                Confirm
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full text-xs border-red-300 text-red-700 hover:bg-red-100"
                            onClick={() => setApplicantVisaActions(prev => ({
                              ...prev,
                              [app.id]: { showRejectionInput: true, rejectionReason: '' }
                            }))}
                          >
                            Mark as Rejected
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setVisaActionDialog({ open: false, order: null, applications: [] });
                  setApplicantVisaActions({});
                }}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Approve/Reject Dialog */}
        <Dialog open={actionDialog.open} onOpenChange={() => setActionDialog({ open: false, type: '', order: null })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {actionDialog.type === 'approve' ? 'Approve Application' : 
                 actionDialog.type === 'return' ? 'Return for Modification' : 
                 'Cannot Process Application'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {actionDialog.type === 'approve' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Payment Link *</label>
                  <Input
                    type="url"
                    value={paymentLink}
                    onChange={(e) => setPaymentLink(e.target.value)}
                    placeholder="https://payment-gateway.com/..."
                  />
                  <p className="text-xs text-slate-500">Enter the secure payment link for the customer</p>
                </div>
              )}
              {actionDialog.type === 'approve' && applications.length > 0 && (
                <div className="space-y-3">
                  <label className="text-sm font-medium">Security Deposits (Optional)</label>
                  <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-3 bg-slate-50">
                    {applications.map((app) => (
                      <div key={app.id} className="flex items-center gap-3 bg-white p-3 rounded-lg border">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-700">{app.applicant_name}</p>
                          <p className="text-xs text-slate-500">{app.service_name}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-600">AED</span>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={securityDeposits[app.id] || 0}
                            onChange={(e) => setSecurityDeposits(prev => ({
                              ...prev,
                              [app.id]: parseFloat(e.target.value) || 0
                            }))}
                            className="w-28"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  {Object.values(securityDeposits).some(v => v > 0) && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-sm font-medium text-amber-800">
                        Total Security Deposit: AED {Object.values(securityDeposits).reduce((sum, val) => sum + (Number(val) || 0), 0).toFixed(2)}
                      </p>
                      <p className="text-xs text-amber-600 mt-1">
                        This will be added to the customer's total payable amount
                      </p>
                    </div>
                  )}
                </div>
              )}
              {actionDialog.type === 'return' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Modification Instructions *</label>
                  <Textarea
                    value={modificationNotes}
                    onChange={(e) => setModificationNotes(e.target.value)}
                    placeholder="Explain what needs to be modified..."
                    rows={3}
                  />
                </div>
              )}
              {actionDialog.type === 'reject' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Reason *</label>
                  <Textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Enter the reason why the application cannot be processed..."
                    rows={3}
                  />
                </div>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium">Admin Notes (optional)</label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add any internal notes..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setActionDialog({ open: false, type: '', order: null })}
              >
                Cancel
              </Button>
              {actionDialog.type === 'approve' ? (
                <Button 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={handleApprove}
                  disabled={updateOrderMutation.isPending}
                >
                  {updateOrderMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  Approve
                </Button>
              ) : actionDialog.type === 'return' ? (
                <Button 
                  className="bg-amber-600 hover:bg-amber-700"
                  onClick={handleReturnForModification}
                  disabled={!modificationNotes || updateOrderMutation.isPending}
                >
                  {updateOrderMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Return for Modification
                </Button>
              ) : (
                <Button 
                  variant="destructive"
                  onClick={handleReject}
                  disabled={!rejectionReason || updateOrderMutation.isPending}
                >
                  {updateOrderMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <XCircle className="w-4 h-4 mr-2" />
                  )}
                  Cannot Process
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}