import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, User, Plane, Shield, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function CartItem({ item, index, onRemove, onEdit, isComplete }) {
  const Icon = item.service.category === 'visa' ? Plane : Shield;
  
  return (
    <Card className={`p-4 border ${isComplete ? 'border-green-200 bg-green-50/50' : 'border-amber-200 bg-amber-50/50'}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div className={`p-2 rounded-lg ${item.service.category === 'visa' ? 'bg-blue-100' : 'bg-emerald-100'}`}>
            <Icon className={`w-5 h-5 ${item.service.category === 'visa' ? 'text-blue-600' : 'text-emerald-600'}`} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-medium text-slate-800">{item.service.name}</h4>
              <Badge variant="outline" className="text-xs">
                #{index + 1}
              </Badge>
              {isComplete ? (
                <Badge className="bg-green-500 hover:bg-green-600 text-white text-xs">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Completed
                </Badge>
              ) : (
                <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-xs">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Incomplete
                </Badge>
              )}
            </div>
            
            {item.applicant?.applicant_name ? (
              <div className="mt-1 flex items-center gap-2 text-sm text-slate-600">
                <User className="w-4 h-4" />
                <span>{item.applicant.applicant_name}</span>
              </div>
            ) : (
              <div className="mt-1 flex items-center gap-2 text-sm text-amber-600">
                <AlertCircle className="w-4 h-4" />
                <span>Applicant details required</span>
              </div>
            )}
            
            <p className="mt-1 text-lg font-semibold text-slate-800">
              AED {item.service.price}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(index)}
            className="text-blue-600 border-blue-200 hover:bg-blue-50"
          >
            {isComplete ? 'Edit' : 'Fill Details'}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRemove(index)}
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}