import React from 'react';
import { MessageCircle } from 'lucide-react';

export default function WhatsAppButton({ phoneNumber = "971501234567" }) {
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=Hello, I need help with my UAE visa application`;
  
  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-full shadow-lg transition-all duration-300 hover:scale-105 group"
    >
      <MessageCircle className="w-6 h-6" />
      <span className="hidden group-hover:inline font-medium">Chat with us</span>
    </a>
  );
}