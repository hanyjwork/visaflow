import React, { useState } from 'react';
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
  Search, FileText, Users, Clock, CheckCircle, 
  XCircle, Eye, CreditCard, Loader2, RefreshCw
} from 'lucide-react';
import StatusBadge from '@/components/tracking/StatusBadge';

export default function Admin() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [applications, setApplications] = useState([]);
  const [actionDialog, setActionDialog] = useState({ open: false, type: '', order: null });
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

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

  const loadApplications = async (order) => {
    const apps = await base44.entities.Application.filter({ order_id: order.id });
    setApplications(apps);
    setSelectedOrder(order);
  };

  const handleApprove = async () => {
    await updateOrderMutation.mutateAsync({
      id: actionDialog.order.id,
      data: { 
        status: 'approved', 
        admin_notes: adminNotes 
      }
    });
    setAdminNotes('');
  };

  const handleReject = async () => {
    await updateOrderMutation.mutateAsync({
      id: actionDialog.order.id,
      data: { 
        status: 'rejected', 
        rejection_reason: rejectionReason,
        admin_notes: adminNotes 
      }
    });
    await updateApplicationsMutation.mutateAsync({
      orderId: actionDialog.order.id,
      status: 'rejected'
    });
    setRejectionReason('');
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
    approved: orders.filter(o => o.status === 'approved' || o.status === 'payment_pending').length,
    paid: orders.filter(o => o.status === 'paid' || o.status === 'processing').length,
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Admin Dashboard</h1>
            <p className="text-slate-500">Manage visa applications</p>
          </div>
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Orders', value: stats.total, icon: FileText, color: 'blue' },
            { label: 'Pending Review', value: stats.pending, icon: Clock, color: 'amber' },
            { label: 'Approved', value: stats.approved, icon: CheckCircle, color: 'green' },
            { label: 'Paid/Processing', value: stats.paid, icon: CreditCard, color: 'purple' },
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
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="payment_pending">Payment Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
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
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => loadApplications(order)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            
                            {order.status === 'pending_review' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-green-600"
                                  onClick={() => setActionDialog({ open: true, type: 'approve', order })}
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600"
                                  onClick={() => setActionDialog({ open: true, type: 'reject', order })}
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </>
                            )}

                            {order.status === 'paid' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-blue-600"
                                onClick={() => handleMarkProcessing(order)}
                              >
                                Start Processing
                              </Button>
                            )}

                            {order.status === 'processing' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-green-600"
                                onClick={() => handleMarkCompleted(order)}
                              >
                                Mark Complete
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

                <div>
                  <h4 className="font-medium mb-3">Applicants ({applications.length})</h4>
                  <div className="space-y-3">
                    {applications.map((app) => (
                      <Card key={app.id} className="p-4">
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
                            <p className="text-sm text-slate-500">Service</p>
                            <p className="font-medium">{app.service_name}</p>
                          </div>
                        </div>
                        <div className="flex gap-4 mt-4">
                          {app.passport_copy_url && (
                            <a 
                              href={app.passport_copy_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 text-sm hover:underline"
                            >
                              View Passport
                            </a>
                          )}
                          {app.photo_url && (
                            <a 
                              href={app.photo_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 text-sm hover:underline"
                            >
                              View Photo
                            </a>
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

        {/* Approve/Reject Dialog */}
        <Dialog open={actionDialog.open} onOpenChange={() => setActionDialog({ open: false, type: '', order: null })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {actionDialog.type === 'approve' ? 'Approve Application' : 'Reject Application'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {actionDialog.type === 'reject' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Rejection Reason *</label>
                  <Textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Enter the reason for rejection..."
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
                  Reject
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}