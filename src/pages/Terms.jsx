import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, FileText, CheckCircle, AlertTriangle, Clock, CreditCard, Shield, Ban } from 'lucide-react';
import WhatsAppButton from '@/components/ui/WhatsAppButton';

export default function Terms() {
  const sections = [
    {
      icon: FileText,
      title: "Application Process",
      items: [
        "All information provided must be accurate and truthful. Any false information may result in visa rejection.",
        "Applicants must upload clear, legible copies of their passport (valid for at least 6 months) and a recent passport-size photo with white background.",
        "Applications are subject to review by UAE immigration authorities. We do not guarantee visa approval.",
        "Processing times are estimates and may vary depending on the volume of applications and immigration authority workload."
      ]
    },
    {
      icon: CreditCard,
      title: "Payment & Fees",
      items: [
        "Payment is required only after your application has been reviewed and approved by our team.",
        "All fees are quoted in UAE Dirhams (AED) and include processing fees.",
        <strong>A security deposit may be required for certain visa applications. This deposit is fully refundable once the visitor exits the UAE in compliance with visa regulations.</strong>,
        "Government fees may change without prior notice as per UAE immigration policies.",
        "Additional fees may apply for urgent processing requests."
      ]
    },
    {
      icon: Clock,
      title: "Processing Times",
      items: [
        "Standard visa processing: 3-5 working days after payment confirmation.",
        "Express processing (if available): 24-48 hours after payment confirmation.",
        "Travel insurance policies are issued within 24 hours of payment.",
        "Processing times exclude weekends and UAE public holidays."
      ]
    },
    {
      icon: Ban,
      title: "Refund Policy",
      items: [
        "Full refund if application is rejected before submission to UAE authorities.",
        "No refund for applications rejected by UAE immigration authorities.",
        "No refund for visa applications already in processing.",
        "Refund requests must be submitted within 7 days of rejection notification."
      ]
    },
    {
      icon: AlertTriangle,
      title: "Applicant Responsibilities",
      items: [
        "Ensure all travel documents are valid for the duration of your stay.",
        "Provide accurate travel dates and accommodation details if requested.",
        "Notify us immediately of any changes to your travel plans.",
        "Comply with all UAE entry requirements and immigration laws."
      ]
    },
    {
      icon: Shield,
      title: "Privacy & Data Protection",
      items: [
        "Personal information is collected solely for visa processing purposes.",
        "Documents are securely stored and handled in compliance with data protection regulations.",
        "Information may be shared with UAE immigration authorities as required for visa processing.",
        "We do not sell or share personal data with third parties for marketing purposes."
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-700 to-blue-800 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to={createPageUrl('Home')} className="inline-flex items-center text-slate-300 hover:text-white mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Terms & Conditions</h1>
          <p className="text-slate-300 text-lg">
            Please read these terms carefully before submitting your visa application
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Card className="border-0 shadow-lg mb-8">
          <CardContent className="p-6 md:p-8">
            <div className="flex items-start gap-4 p-4 bg-amber-50 border border-amber-200 rounded-xl mb-8">
              <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-800">Important Notice</h3>
                <p className="text-amber-700 text-sm mt-1">
                  By submitting your visa application, you acknowledge that you have read, understood, and agree to these terms and conditions. Visa approval is at the sole discretion of UAE immigration authorities.
                </p>
              </div>
            </div>

            <div className="space-y-10">
              {sections.map((section, index) => {
                const Icon = section.icon;
                return (
                  <div key={index}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-blue-100">
                        <Icon className="w-5 h-5 text-blue-600" />
                      </div>
                      <h2 className="text-xl font-bold text-blue-800">{section.title}</h2>
                    </div>
                    <ul className="space-y-3 ml-11">
                      {section.items.map((item, itemIndex) => (
                        <li key={itemIndex} className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-slate-600">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>

            <div className="mt-12 pt-8 border-t">
              <h2 className="text-xl font-bold text-blue-800 mb-4">Contact Information</h2>
              <p className="text-slate-600 mb-4">
                For any questions regarding these terms and conditions or your visa application, please contact us:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-sm text-slate-500">Email</p>
                  <p className="font-medium text-blue-800">support@uaevisa.com</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-sm text-slate-500">WhatsApp</p>
                  <p className="font-medium text-blue-800">+971 50 123 4567</p>
                </div>
              </div>
            </div>

            <div className="mt-8 text-center">
              <p className="text-sm text-slate-500 mb-4">Last updated: January 2025</p>
              <Link to={createPageUrl('Home')}>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Return to Home
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <WhatsAppButton />
    </div>
  );
}