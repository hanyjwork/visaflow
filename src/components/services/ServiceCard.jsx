import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, FileText, Shield, Plane, Plus, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const iconMap = {
  visa: Plane,
  express_visa: Plane,
  insurance: Shield,
};

export default function ServiceCard({ service, onAddToCart }) {
  const Icon = iconMap[service.category] || FileText;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="h-full bg-white border-0 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-100 to-amber-50 rounded-bl-full opacity-50" />
        {service.category === 'express_visa' && (
          <div className="absolute top-2 right-2 z-10 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-2 py-1 rounded-full flex items-center gap-1 shadow-md">
            <Zap className="w-3 h-3 fill-white" />
            <span className="text-[10px] font-bold uppercase tracking-wide">Express</span>
          </div>
        )}
        
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg">
              <Icon className="w-6 h-6" />
            </div>
            <Badge 
              variant="secondary" 
              className={`${
                service.category === 'visa' ? 'bg-blue-100 text-blue-700' : 
                service.category === 'express_visa' ? 'bg-amber-100 text-amber-700' : 
                'bg-emerald-100 text-emerald-700'
              }`}
            >
              {service.category === 'visa' ? 'Visa' : 
               service.category === 'express_visa' ? 'Express Visa' : 
               'Insurance'}
            </Badge>
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mt-4">{service.name}</h3>
          {service.duration && (
            <p className="text-sm text-slate-500">{service.duration}</p>
          )}
        </CardHeader>
        
        <CardContent className="space-y-3">
          <p className="text-sm text-slate-600 line-clamp-2">{service.description}</p>
          
          {service.processing_time && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Clock className="w-4 h-4" />
              <span>Processing: {service.processing_time}</span>
            </div>
          )}
          
          <div className="pt-2 border-t">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-slate-800">AED {service.price}</span>
              <span className="text-sm text-slate-400">/person</span>
            </div>
          </div>
        </CardContent>
        
        <CardFooter>
          <Button 
            onClick={() => onAddToCart(service)}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-medium shadow-md"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add to Cart
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}