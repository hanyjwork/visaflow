import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, MapPin, Phone, Mail, Heart, Lock, Zap } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import WhatsAppButton from '@/components/ui/WhatsAppButton';

// Fix for default marker icons in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png'
});

export default function About() {
  const values = [
    {
      icon: Heart,
      title: "Trust",
      description: "We believe in building long-term relationships with our clients through honest and transparent communication."
    },
    {
      icon: Lock,
      title: "Transparency",
      description: "Every process, fee, and timeline is clearly communicated. No hidden charges, no surprises."
    },
    {
      icon: Zap,
      title: "Digital Experience",
      description: "A seamless, modern online platform that makes visa processing simple, fast, and accessible from anywhere."
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
          <h1 className="text-3xl md:text-4xl font-bold mb-4">About Visaflow UAE</h1>
          <p className="text-slate-300 text-lg">
            Making visa processing simple, transparent, and truly digital
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Company Overview */}
        <Card className="border-0 shadow-lg mb-12">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold text-blue-800 mb-4">Who We Are</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              Visaflow UAE is a leading travel services company dedicated to simplifying the UAE visa process. As trusted travel agents, we combine decades of expertise with cutting-edge technology to deliver an exceptional online experience.
            </p>
            <p className="text-slate-600 leading-relaxed">
              We handle thousands of visa applications every year, and our commitment remains unwavering: making international travel accessible, affordable, and hassle-free for everyone.
            </p>
          </CardContent>
        </Card>

        {/* Core Values */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-blue-800 mb-8 text-center">Our Core Values</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-100 mb-4">
                      <Icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">{value.title}</h3>
                    <p className="text-slate-600 text-sm">{value.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Contact & Map */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold text-blue-800 mb-8">Visit Us</h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              {/* Contact Info */}
              <div>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-blue-100">
                        <MapPin className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 mb-1">Address</h3>
                      <p className="text-slate-600 text-sm">
                        Dubai International Financial Centre<br />
                        Gate Avenue, Office 1405<br />
                        Dubai, UAE
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-blue-100">
                        <Phone className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 mb-1">Phone</h3>
                      <a href="tel:+971501234567" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                        +971 50 123 4567
                      </a>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-blue-100">
                        <Mail className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 mb-1">Email</h3>
                      <a href="mailto:support@visaflowuae.com" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                        support@visaflowuae.com
                      </a>
                    </div>
                  </div>
                </div>

                <Link to={createPageUrl('Home')} className="inline-block mt-8">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    Return to Home
                  </Button>
                </Link>
              </div>

              {/* Map */}
              <div className="rounded-lg overflow-hidden shadow-md h-80">
                <MapContainer
                  center={[25.2048, 55.2708]}
                  zoom={15}
                  scrollWheelZoom={true}
                  className="h-full w-full"
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={[25.2048, 55.2708]}>
                    <Popup>
                      <div className="text-sm">
                        <strong>Visaflow UAE</strong><br />
                        DIFC, Gate Avenue<br />
                        Dubai, UAE
                      </div>
                    </Popup>
                  </Marker>
                </MapContainer>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <WhatsAppButton />
    </div>
  );
}