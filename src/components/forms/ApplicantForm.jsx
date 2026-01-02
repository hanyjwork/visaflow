import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, X, FileText, Image, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const countries = [
  "Afghanistan", "Albania", "Algeria", "Argentina", "Australia", "Austria", "Bangladesh", 
  "Belgium", "Brazil", "Canada", "China", "Colombia", "Egypt", "France", "Germany", 
  "Greece", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Italy", "Japan", "Jordan",
  "Kenya", "Kuwait", "Lebanon", "Malaysia", "Mexico", "Morocco", "Nepal", "Netherlands",
  "New Zealand", "Nigeria", "Norway", "Oman", "Pakistan", "Philippines", "Poland", "Portugal",
  "Qatar", "Russia", "Saudi Arabia", "Singapore", "South Africa", "South Korea", "Spain",
  "Sri Lanka", "Sweden", "Switzerland", "Syria", "Thailand", "Tunisia", "Turkey", "UAE",
  "UK", "Ukraine", "USA", "Vietnam", "Yemen"
];

export default function ApplicantForm({ isOpen, onClose, onSave, initialData, serviceName }) {
  const [formData, setFormData] = useState(initialData || {
    applicant_name: '',
    passport_number: '',
    nationality: '',
    date_of_birth: '',
    gender: '',
    passport_copy_url: '',
    photo_url: '',
  });
  
  const [uploading, setUploading] = useState({ passport: false, photo: false });
  const [errors, setErrors] = useState({});

  const handleFileUpload = async (file, type) => {
    if (!file) return;
    
    setUploading(prev => ({ ...prev, [type]: true }));
    
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    
    if (type === 'passport') {
      setFormData(prev => ({ ...prev, passport_copy_url: file_url }));
    } else {
      setFormData(prev => ({ ...prev, photo_url: file_url }));
    }
    
    setUploading(prev => ({ ...prev, [type]: false }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.applicant_name) newErrors.applicant_name = 'Name is required';
    if (!formData.passport_number) newErrors.passport_number = 'Passport number is required';
    if (!formData.nationality) newErrors.nationality = 'Nationality is required';
    if (!formData.date_of_birth) newErrors.date_of_birth = 'Date of birth is required';
    if (!formData.gender) newErrors.gender = 'Gender is required';
    if (!formData.passport_copy_url) newErrors.passport_copy_url = 'Passport copy is required';
    if (!formData.photo_url) newErrors.photo_url = 'Photo is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      onSave(formData);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Applicant Details</DialogTitle>
          <p className="text-sm text-slate-500">For: {serviceName}</p>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name (as in passport) *</Label>
            <Input
              id="name"
              value={formData.applicant_name}
              onChange={(e) => setFormData(prev => ({ ...prev, applicant_name: e.target.value }))}
              placeholder="Enter full name"
              className={errors.applicant_name ? 'border-red-500' : ''}
            />
            {errors.applicant_name && <p className="text-xs text-red-500">{errors.applicant_name}</p>}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="passport">Passport Number *</Label>
              <Input
                id="passport"
                value={formData.passport_number}
                onChange={(e) => setFormData(prev => ({ ...prev, passport_number: e.target.value.toUpperCase() }))}
                placeholder="e.g., AB1234567"
                className={errors.passport_number ? 'border-red-500' : ''}
              />
              {errors.passport_number && <p className="text-xs text-red-500">{errors.passport_number}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dob">Date of Birth *</Label>
              <Input
                id="dob"
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData(prev => ({ ...prev, date_of_birth: e.target.value }))}
                className={errors.date_of_birth ? 'border-red-500' : ''}
              />
              {errors.date_of_birth && <p className="text-xs text-red-500">{errors.date_of_birth}</p>}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nationality *</Label>
              <Select 
                value={formData.nationality} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, nationality: value }))}
              >
                <SelectTrigger className={errors.nationality ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {countries.map(country => (
                    <SelectItem key={country} value={country}>{country}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.nationality && <p className="text-xs text-red-500">{errors.nationality}</p>}
            </div>
            
            <div className="space-y-2">
              <Label>Gender *</Label>
              <Select 
                value={formData.gender} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}
              >
                <SelectTrigger className={errors.gender ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
              {errors.gender && <p className="text-xs text-red-500">{errors.gender}</p>}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Passport Copy *</Label>
            <div className={`border-2 border-dashed rounded-lg p-4 text-center ${errors.passport_copy_url ? 'border-red-300 bg-red-50' : 'border-slate-200 hover:border-blue-400'} transition-colors`}>
              {formData.passport_copy_url ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-green-600">
                    <FileText className="w-5 h-5" />
                    <span className="text-sm">Passport uploaded</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setFormData(prev => ({ ...prev, passport_copy_url: '' }))}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : uploading.passport ? (
                <div className="flex items-center justify-center gap-2 text-slate-500">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Uploading...</span>
                </div>
              ) : (
                <label className="cursor-pointer block">
                  <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                  <span className="text-sm text-slate-600">Click to upload passport copy</span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileUpload(e.target.files[0], 'passport')}
                  />
                </label>
              )}
            </div>
            {errors.passport_copy_url && <p className="text-xs text-red-500">{errors.passport_copy_url}</p>}
          </div>
          
          <div className="space-y-2">
            <Label>Personal Photo *</Label>
            <p className="text-xs text-slate-500">White background, recent photo</p>
            <div className={`border-2 border-dashed rounded-lg p-4 text-center ${errors.photo_url ? 'border-red-300 bg-red-50' : 'border-slate-200 hover:border-blue-400'} transition-colors`}>
              {formData.photo_url ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img src={formData.photo_url} alt="Photo" className="w-12 h-12 rounded object-cover" />
                    <span className="text-sm text-green-600">Photo uploaded</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setFormData(prev => ({ ...prev, photo_url: '' }))}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : uploading.photo ? (
                <div className="flex items-center justify-center gap-2 text-slate-500">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Uploading...</span>
                </div>
              ) : (
                <label className="cursor-pointer block">
                  <Image className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                  <span className="text-sm text-slate-600">Click to upload photo</span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e.target.files[0], 'photo')}
                  />
                </label>
              )}
            </div>
            {errors.photo_url && <p className="text-xs text-red-500">{errors.photo_url}</p>}
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700">
            Save Details
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}