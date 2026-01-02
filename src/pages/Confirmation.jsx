import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from 'framer-motion';
import { CheckCircle, Copy, Search, Home, MessageCircle } from 'lucide-react';
import { toast } from "sonner";
import WhatsAppButton from '@/components/ui/WhatsAppButton';

export default function Confirmation() {
  const urlParams = new URLSearchParams(window.location.search);
  const trackingNumber = urlParams.get('tracking');

  const copyToClipboard = () => {
    navigator.clipboard.writeText(trackingNumber);
    toast.success('Tracking number copied!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        <Card className="border-0 shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-br from-green-500 to-green-600 p-8 text-center text-white">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <CheckCircle className="w-12 h-12 text-green-500" />
            </motion.div>
            <h1 className="text-2xl font-bold mb-2">Application Submitted!</h1>
            <p className="text-green-100">Your visa application has been received</p>
          </div>
          
          <CardContent className="p-8 space-y-6">
            <div className="text-center">
              <p className="text-sm text-slate-500 mb-2">Your Tracking Number</p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-3xl font-mono font-bold text-slate-800 tracking-wider">
                  {trackingNumber}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={copyToClipboard}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <Copy className="w-5 h-5" />
                </Button>
              </div>
              <p className="text-sm text-slate-500 mt-2">
                Save this number to track your application status
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
              <h3 className="font-medium text-blue-800 mb-2">What happens next?</h3>
              <ul className="text-sm text-blue-700 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                  <span>Our team will review your application (24-48 hours)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                  <span>You'll receive an email when your application is approved</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                  <span>Complete payment to start visa processing</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col gap-3">
              <Link to={createPageUrl('Track') + `?tracking=${trackingNumber}`}>
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  <Search className="w-4 h-4 mr-2" />
                  Track Application
                </Button>
              </Link>
              <Link to={createPageUrl('Home')}>
                <Button variant="outline" className="w-full">
                  <Home className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
            </div>

            <div className="text-center pt-4 border-t">
              <p className="text-sm text-slate-500 mb-3">Need help? Contact us on WhatsApp</p>
              <a
                href="https://wa.me/971501234567"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium"
              >
                <MessageCircle className="w-5 h-5" />
                Chat with Support
              </a>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <WhatsAppButton />
    </div>
  );
}