import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, X, FileText, Image, Loader2, Info } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function ApplicantForm({ isOpen, onClose, onSave, initialData, serviceName, serviceCategory }) {
  const [formData, setFormData] = useState(initialData || {
    applicant_name: '',
    passport_number: '',
    nationality: '',
    residence_country: '',
    date_of_birth: '',
    expected_travel_date: '',
    gender: '',
    passport_front_url: '',
    passport_cover_url: '',
    photo_url: '',
    supporting_documents_urls: [],
  });

  const [countries, setCountries] = useState([]);
  const [loadingCountries, setLoadingCountries] = useState(true);

  useEffect(() => {
    const fetchNationalities = async () => {
      try {
        const nationalities = await base44.entities.Nationality.filter({ is_enabled: true });
        setCountries(nationalities.sort((a, b) => a.name.localeCompare(b.name)));
      } catch (error) {
        console.error('Failed to load nationalities:', error);
      } finally {
        setLoadingCountries(false);
      }
    };
    fetchNationalities();
  }, []);

  // Calculate minimum travel date based on service type
  const getMinTravelDate = () => {
    const today = new Date();
    const daysToAdd = serviceCategory === 'express_visa' ? 3 : 5;
    today.setDate(today.getDate() + daysToAdd);
    return today.toISOString().split('T')[0];
  };
  
  const [uploading, setUploading] = useState({ 
    passportFront: false, 
    passportCover: false, 
    photo: false, 
    supporting: false 
  });
  const [errors, setErrors] = useState({});
  const [tooltipOpen, setTooltipOpen] = useState({
    passportFront: false,
    passportCover: false,
    photo: false
  });

  const handleFileUpload = async (file, type, inputElement) => {
    if (!file) return;
    
    // Validate file
    if (!file.size || file.size === 0) {
      alert('Selected file is empty. Please try again.');
      return;
    }
    
    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File is too large. Maximum size is 10MB.');
      return;
    }
    
    setUploading(prev => ({ ...prev, [type]: true }));
    
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      if (!file_url) {
        throw new Error('Upload failed - no URL returned');
      }
      
      if (type === 'passportFront') {
        setFormData(prev => ({ ...prev, passport_front_url: file_url }));
      } else if (type === 'passportCover') {
        setFormData(prev => ({ ...prev, passport_cover_url: file_url }));
      } else if (type === 'photo') {
        setFormData(prev => ({ ...prev, photo_url: file_url }));
      } else if (type === 'supporting') {
        setFormData(prev => ({ 
          ...prev, 
          supporting_documents_urls: [...(prev.supporting_documents_urls || []), file_url] 
        }));
      }
      
      // Reset input to allow re-selection
      if (inputElement) {
        inputElement.value = '';
      }
    } catch (error) {
      console.error('File upload failed:', error);
      alert(`✗ Upload failed: ${error.message || 'Unknown error'}. Please try again.`);
      
      // Reset input on error
      if (inputElement) {
        inputElement.value = '';
      }
    } finally {
      setUploading(prev => ({ ...prev, [type]: false }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.applicant_name) newErrors.applicant_name = 'Name is required';
    if (!formData.nationality) newErrors.nationality = 'Nationality is required';
    if (!formData.residence_country) newErrors.residence_country = 'Residence country is required';
    if (!formData.expected_travel_date) newErrors.expected_travel_date = 'Expected travel date is required';
    if (!formData.passport_front_url) newErrors.passport_front_url = 'Passport front page is required';
    if (!formData.passport_cover_url) newErrors.passport_cover_url = 'Passport cover is required';
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
              onChange={(e) => setFormData(prev => ({ ...prev, applicant_name: e.target.value.toUpperCase() }))}
              placeholder="Enter full name"
              className={`uppercase ${errors.applicant_name ? 'border-red-500' : ''}`}
            />
            {errors.applicant_name && <p className="text-xs text-red-500">{errors.applicant_name}</p>}
          </div>
          

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nationality *</Label>
              <Select 
                value={formData.nationality} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, nationality: value }))}
                disabled={loadingCountries}
              >
                <SelectTrigger className={errors.nationality ? 'border-red-500' : ''}>
                  <SelectValue placeholder={loadingCountries ? "Loading..." : "Select country"} />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {countries.map(country => (
                    <SelectItem key={country.id} value={country.name}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.nationality && <p className="text-xs text-red-500">{errors.nationality}</p>}
            </div>
            
            <div className="space-y-2">
              <Label>Residence Country *</Label>
              <Select 
                value={formData.residence_country} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, residence_country: value }))}
                disabled={loadingCountries}
              >
                <SelectTrigger className={errors.residence_country ? 'border-red-500' : ''}>
                  <SelectValue placeholder={loadingCountries ? "Loading..." : "Select country"} />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {countries.map(country => (
                    <SelectItem key={country.id} value={country.name}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.residence_country && <p className="text-xs text-red-500">{errors.residence_country}</p>}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="travel_date">Expected Travel Date *</Label>
            <Input
              id="travel_date"
              type="date"
              value={formData.expected_travel_date}
              onChange={(e) => setFormData(prev => ({ ...prev, expected_travel_date: e.target.value }))}
              className={errors.expected_travel_date ? 'border-red-500' : ''}
              min={getMinTravelDate()}
            />
            <p className="text-xs text-slate-500">
              {serviceCategory === 'express_visa' 
                ? 'Minimum 3 days from today for express visas' 
                : 'Minimum 5 days from today'}
            </p>
            {errors.expected_travel_date && <p className="text-xs text-red-500">{errors.expected_travel_date}</p>}
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>Passport Copy (Front) *</Label>
              <TooltipProvider>
                <Tooltip open={tooltipOpen.passportFront}>
                  <TooltipTrigger asChild>
                    <button 
                      type="button" 
                      className="p-1 -m-1 touch-manipulation"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setTooltipOpen(prev => ({ ...prev, passportFront: !prev.passportFront }));
                      }}
                    >
                      <Info className="w-4 h-4 text-slate-400" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs" onPointerDownOutside={() => setTooltipOpen(prev => ({ ...prev, passportFront: false }))}>
                    <div className="space-y-2">
                      <p className="font-semibold text-sm">Valid Passport Example:</p>
                      <img 
                        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6957a1f81f10f2f9a853595e/728a81ea1_passportexample.png" 
                        alt="Passport example" 
                        className="rounded border w-full"
                      />
                      <p className="text-xs">Clear photo of the data page showing your name, photo, passport number, and expiry date.</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-xs text-slate-500">Photo page with your details</p>
            <div className={`border-2 border-dashed rounded-lg p-4 text-center ${errors.passport_front_url ? 'border-red-300 bg-red-50' : 'border-slate-200 hover:border-blue-400'} transition-colors`}>
              {formData.passport_front_url ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-green-600">
                    <FileText className="w-5 h-5" />
                    <span className="text-sm">Passport front uploaded</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setFormData(prev => ({ ...prev, passport_front_url: '' }))}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : uploading.passportFront ? (
                <div className="flex items-center justify-center gap-2 text-slate-500">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Uploading...</span>
                </div>
              ) : (
                <label className="cursor-pointer block">
                  <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                  <span className="text-sm text-slate-600">Click to upload</span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleFileUpload(file, 'passportFront', e.target);
                      }
                    }}
                  />
                </label>
              )}
            </div>
            {errors.passport_front_url && <p className="text-xs text-red-500">{errors.passport_front_url}</p>}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>Passport Cover Copy *</Label>
              <TooltipProvider>
                <Tooltip open={tooltipOpen.passportCover}>
                  <TooltipTrigger asChild>
                    <button 
                      type="button" 
                      className="p-1 -m-1 touch-manipulation"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setTooltipOpen(prev => ({ ...prev, passportCover: !prev.passportCover }));
                      }}
                    >
                      <Info className="w-4 h-4 text-slate-400" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs" onPointerDownOutside={() => setTooltipOpen(prev => ({ ...prev, passportCover: false }))}>
                    <div className="space-y-2">
                      <p className="font-semibold text-sm">Passport Cover Example:</p>
                      <img 
                        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6957a1f81f10f2f9a853595e/9c1c67679_passportcover.png" 
                        alt="Passport cover example" 
                        className="rounded border w-full"
                      />
                      <p className="text-xs">Clear photo of the front cover of your passport showing the country emblem.</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-xs text-slate-500">Front cover of your passport</p>
            <div className={`border-2 border-dashed rounded-lg p-4 text-center ${errors.passport_cover_url ? 'border-red-300 bg-red-50' : 'border-slate-200 hover:border-blue-400'} transition-colors`}>
              {formData.passport_cover_url ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-green-600">
                    <FileText className="w-5 h-5" />
                    <span className="text-sm">Passport cover uploaded</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setFormData(prev => ({ ...prev, passport_cover_url: '' }))}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : uploading.passportCover ? (
                <div className="flex items-center justify-center gap-2 text-slate-500">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Uploading...</span>
                </div>
              ) : (
                <label className="cursor-pointer block">
                  <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                  <span className="text-sm text-slate-600">Click to upload</span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleFileUpload(file, 'passportCover', e.target);
                      }
                    }}
                  />
                </label>
              )}
            </div>
            {errors.passport_cover_url && <p className="text-xs text-red-500">{errors.passport_cover_url}</p>}
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>Personal Photo *</Label>
              <TooltipProvider>
                <Tooltip open={tooltipOpen.photo}>
                  <TooltipTrigger asChild>
                    <button 
                      type="button" 
                      className="p-1 -m-1 touch-manipulation"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setTooltipOpen(prev => ({ ...prev, photo: !prev.photo }));
                      }}
                    >
                      <Info className="w-4 h-4 text-slate-400" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs" onPointerDownOutside={() => setTooltipOpen(prev => ({ ...prev, photo: false }))}>
                    <div className="space-y-2">
                      <p className="font-semibold text-sm">Photo Requirements:</p>
                      <ul className="text-xs space-y-1 list-disc list-inside">
                        <li>White or light colored background</li>
                        <li>Face forward, looking at camera</li>
                        <li>No glasses or headwear (unless for religious purposes)</li>
                        <li>Neutral expression, mouth closed</li>
                        <li>Recent photo (taken within last 6 months)</li>
                        <li>Good lighting, no shadows</li>
                        <li>High resolution (minimum 600x600 pixels)</li>
                      </ul>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
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
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleFileUpload(file, 'photo', e.target);
                      }
                    }}
                  />
                </label>
              )}
            </div>
            {errors.photo_url && <p className="text-xs text-red-500">{errors.photo_url}</p>}
          </div>

          <div className="space-y-2">
            <Label>Additional Supporting Documents (Optional)</Label>
            <p className="text-xs text-slate-500">Return flight ticket, national ID, sponsor ID, bank statements, hotel bookings, or other documents to assist with visa processing</p>
            <div className="border-2 border-dashed rounded-lg p-4 text-center border-slate-200 hover:border-blue-400 transition-colors">
              {uploading.supporting ? (
                <div className="flex items-center justify-center gap-2 text-slate-500">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Uploading...</span>
                </div>
              ) : (
                <label className="cursor-pointer block">
                  <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                  <span className="text-sm text-slate-600">Click to upload additional documents</span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleFileUpload(file, 'supporting', e.target);
                      }
                    }}
                  />
                </label>
              )}
            </div>
            {formData.supporting_documents_urls && formData.supporting_documents_urls.length > 0 && (
              <div className="space-y-2 mt-2">
                {formData.supporting_documents_urls.map((url, index) => (
                  <div key={index} className="flex items-center justify-between bg-slate-50 p-2 rounded">
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="w-4 h-4 text-slate-500" />
                      <span className="text-slate-700">Document {index + 1}</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => setFormData(prev => ({ 
                        ...prev, 
                        supporting_documents_urls: prev.supporting_documents_urls.filter((_, i) => i !== index) 
                      }))}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
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