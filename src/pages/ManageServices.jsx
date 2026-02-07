import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Plus, Pencil, Trash2, Loader2, ShieldAlert, ArrowLeft
} from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function ManageServices() {
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [editDialog, setEditDialog] = useState({ open: false, service: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, service: null });
  const [formData, setFormData] = useState({
    name: '',
    category: 'visa',
    description: '',
    duration: '',
    price: '',
    processing_time: '',
    requirements: '',
    is_active: true,
    icon: 'FileText'
  });

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

  const { data: services = [], isLoading, refetch } = useQuery({
    queryKey: ['services'],
    queryFn: () => base44.entities.Service.list('-created_date'),
  });

  const createServiceMutation = useMutation({
    mutationFn: (data) => base44.entities.Service.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      setEditDialog({ open: false, service: null });
      resetForm();
    },
  });

  const updateServiceMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Service.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      setEditDialog({ open: false, service: null });
      resetForm();
    },
  });

  const deleteServiceMutation = useMutation({
    mutationFn: (id) => base44.entities.Service.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      setDeleteDialog({ open: false, service: null });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'visa',
      description: '',
      duration: '',
      price: '',
      processing_time: '',
      requirements: '',
      is_active: true,
      icon: 'FileText'
    });
  };

  const openEditDialog = (service = null) => {
    if (service) {
      setFormData({
        name: service.name || '',
        category: service.category || 'visa',
        description: service.description || '',
        duration: service.duration || '',
        price: service.price?.toString() || '',
        processing_time: service.processing_time || '',
        requirements: service.requirements?.join('\n') || '',
        is_active: service.is_active !== false,
        icon: service.icon || 'FileText'
      });
    } else {
      resetForm();
    }
    setEditDialog({ open: true, service });
  };

  const handleSubmit = () => {
    const data = {
      name: formData.name,
      category: formData.category,
      description: formData.description,
      duration: formData.duration,
      price: parseFloat(formData.price) || 0,
      processing_time: formData.processing_time,
      requirements: formData.requirements.split('\n').filter(r => r.trim()),
      is_active: formData.is_active,
      icon: formData.icon
    };

    if (editDialog.service) {
      updateServiceMutation.mutate({ id: editDialog.service.id, data });
    } else {
      createServiceMutation.mutate(data);
    }
  };

  const handleDelete = () => {
    if (deleteDialog.service) {
      deleteServiceMutation.mutate(deleteDialog.service.id);
    }
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
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.location.href = '/Admin'}
                className="text-slate-600"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Manage Services</h1>
            <p className="text-slate-500">Create, edit, and delete visa services</p>
          </div>
          <Button 
            onClick={() => openEditDialog()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Service
          </Button>
        </div>

        {/* Services Table */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>Services ({services.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : services.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-500">No services found. Create your first service.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {services.map((service) => (
                      <TableRow key={service.id} className="hover:bg-slate-50">
                        <TableCell>
                          <div>
                            <p className="font-medium">{service.name}</p>
                            <p className="text-sm text-slate-500">{service.processing_time}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{service.category}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          AED {service.price?.toFixed(2)}
                        </TableCell>
                        <TableCell>{service.duration}</TableCell>
                        <TableCell>
                          {service.is_active ? (
                            <Badge className="bg-green-100 text-green-700">Active</Badge>
                          ) : (
                            <Badge variant="outline" className="text-slate-500">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(service)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600"
                              onClick={() => setDeleteDialog({ open: true, service })}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
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

        {/* Edit/Create Dialog */}
        <Dialog open={editDialog.open} onOpenChange={(open) => setEditDialog({ open, service: null })}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editDialog.service ? 'Edit Service' : 'Create New Service'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="30 Day Tourist Visa"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="visa">Visa</SelectItem>
                      <SelectItem value="insurance">Insurance</SelectItem>
                      <SelectItem value="express_visa">Express Visa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Service description..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Price (AED) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="299.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Duration</Label>
                  <Input
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="30 days"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Processing Time</Label>
                  <Input
                    value={formData.processing_time}
                    onChange={(e) => setFormData({ ...formData, processing_time: e.target.value })}
                    placeholder="3-5 business days"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Icon Name</Label>
                  <Input
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    placeholder="FileText"
                  />
                  <p className="text-xs text-slate-500">Lucide icon name (e.g., FileText, Plane, Shield)</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Requirements (one per line)</Label>
                <Textarea
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                  placeholder="Valid passport&#10;Passport copy&#10;Photo"
                  rows={4}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Active (visible to customers)</Label>
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setEditDialog({ open: false, service: null })}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={!formData.name || !formData.price || createServiceMutation.isPending || updateServiceMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {(createServiceMutation.isPending || updateServiceMutation.isPending) ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  editDialog.service ? 'Update Service' : 'Create Service'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, service: null })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Service</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-slate-600">
                Are you sure you want to delete <strong>{deleteDialog.service?.name}</strong>? This action cannot be undone.
              </p>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setDeleteDialog({ open: false, service: null })}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteServiceMutation.isPending}
              >
                {deleteServiceMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}