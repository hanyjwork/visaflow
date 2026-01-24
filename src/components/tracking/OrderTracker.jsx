import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Circle, Clock, CreditCard, FileCheck, Search } from 'lucide-react';
import { motion } from 'framer-motion';

const steps = [
  { key: 'pending_review', label: 'Submitted', icon: Clock },
  { key: 'under_review', label: 'Under Review', icon: Search },
  { key: 'approved', label: 'Approved', icon: CheckCircle },
  { key: 'customer_confirmed_payment', label: 'Payment', icon: CreditCard },
  { key: 'processing', label: 'Processing', icon: Clock },
  { key: 'completed', label: 'Completed', icon: FileCheck },
];

const statusOrder = ['pending_review', 'under_review', 'approved', 'payment_pending', 'customer_confirmed_payment', 'paid', 'processing', 'completed', 'cannot_process_application'];

export default function OrderTracker({ currentStatus }) {
  const currentIndex = statusOrder.indexOf(currentStatus);
  const isRejected = currentStatus === 'cannot_process_application';
  
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg">Application Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Progress Line */}
          <div className="absolute top-5 left-5 right-5 h-0.5 bg-slate-200 hidden md:block" />
          <div 
            className="absolute top-5 left-5 h-0.5 bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500 hidden md:block"
            style={{ width: `${Math.min((currentIndex / (steps.length - 1)) * 100, 100)}%` }}
          />
          
          <div className="flex flex-col md:flex-row md:justify-between gap-4 md:gap-0">
            {steps.map((step, index) => {
              const isCompleted = currentIndex >= statusOrder.indexOf(step.key);
              const isCurrent = step.key === currentStatus || 
                (currentStatus === 'payment_pending' && step.key === 'customer_confirmed_payment') ||
                (currentStatus === 'customer_confirmed_payment' && step.key === 'customer_confirmed_payment') ||
                (currentStatus === 'paid' && step.key === 'customer_confirmed_payment');
              const Icon = step.icon;
              
              return (
                <motion.div 
                  key={step.key}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex md:flex-col items-center gap-3 md:gap-2"
                >
                  <div 
                    className={`
                      relative z-10 w-10 h-10 rounded-full flex items-center justify-center
                      transition-all duration-300
                      ${isCompleted 
                        ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg' 
                        : 'bg-slate-100 text-slate-400'
                      }
                      ${isCurrent ? 'ring-4 ring-blue-100' : ''}
                    `}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  <span className={`text-sm font-medium ${isCompleted ? 'text-slate-800' : 'text-slate-400'}`}>
                    {step.label}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>
        
        {isRejected && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 font-medium">Cannot Process Application</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}