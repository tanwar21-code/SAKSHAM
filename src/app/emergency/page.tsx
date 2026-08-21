'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Phone, MapPin, Cross, AlertTriangle, ExternalLink } from 'lucide-react';

interface Resource { id: number; resource_type: string; title: string; content: string; phone_number: string; url: string; }
interface SafetyPlan { evacuation_instructions: string; assembly_point: string; emergency_exit_information: string; first_aid_location: string; }
interface Disaster { id: number; name: string; icon: string; description: string; }
interface Guide { id: number; title: string; content: string; disaster_name: string; icon: string; disaster_id: number; }

export default function EmergencyPage() {
  const router = useRouter();
  const [resources, setResources] = useState<Resource[]>([]);
  const [safetyPlan, setSafetyPlan] = useState<SafetyPlan | null>(null);
  const [disasters, setDisasters] = useState<Disaster[]>([]);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [openGuide, setOpenGuide] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/emergency')
      .then(r => r.json())
      .then(d => {
        setResources(d.resources || []);
        setSafetyPlan(d.safetyPlan);
        setDisasters(d.disasters || []);
        setGuides(d.guides || []);
        // Cache for offline
        if ('caches' in window) {
          caches.open('saksham-emergency').then(cache => {
            cache.put('/api/emergency', new Response(JSON.stringify(d)));
          });
        }
      })
      .catch(async () => {
        // Try loading from cache
        if ('caches' in window) {
          const cache = await caches.open('saksham-emergency');
          const cached = await cache.match('/api/emergency');
          if (cached) {
            const d = await cached.json();
            setResources(d.resources || []);
            setSafetyPlan(d.safetyPlan);
            setDisasters(d.disasters || []);
            setGuides(d.guides || []);
          }
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const phoneResources = resources.filter(r => r.resource_type === 'phone');

  if (loading) {
    return (
      <div className="min-h-screen emergency-bg flex items-center justify-center">
        <div className="animate-pulse text-white text-lg">Loading Emergency Info...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen emergency-bg text-white">
      <div className="max-w-lg mx-auto px-4 pt-6 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-white/10 min-h-[44px] min-w-[44px] flex items-center justify-center">
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-white animate-pulse" />
            <span className="text-sm font-bold uppercase tracking-widest">Emergency</span>
          </div>
          <div className="w-10" />
        </div>

        {/* Emergency Icon */}
        <div className="text-center mb-6">
          <AlertTriangle size={48} className="mx-auto mb-2 animate-pulse" />
          <h1 className="text-2xl font-extrabold">EMERGENCY MODE</h1>
          <p className="text-sm text-white/70 mt-1">Stay calm. Follow instructions.</p>
        </div>

        {/* Call Buttons */}
        <div className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-white/60 mb-3">📞 CALL NOW</h2>
          <div className="grid grid-cols-1 gap-2">
            {phoneResources.length > 0 ? phoneResources.map(r => (
              <a
                key={r.id}
                href={`tel:${r.phone_number}`}
                className="flex items-center gap-3 bg-white/15 backdrop-blur-sm rounded-2xl px-4 py-4 border border-white/20 active:scale-[0.98] transition-transform min-h-[56px]"
              >
                <Phone size={22} className="shrink-0" />
                <div className="flex-1">
                  <p className="font-bold text-base">{r.title}</p>
                  {r.phone_number && <p className="text-sm text-white/70">{r.phone_number}</p>}
                </div>
              </a>
            )) : (
              <>
                <a href="tel:112" className="flex items-center gap-3 bg-white/15 rounded-2xl px-4 py-4 border border-white/20 min-h-[56px]">
                  <Phone size={22} /><div><p className="font-bold">Police</p><p className="text-sm text-white/70">112</p></div>
                </a>
                <a href="tel:101" className="flex items-center gap-3 bg-white/15 rounded-2xl px-4 py-4 border border-white/20 min-h-[56px]">
                  <Phone size={22} /><div><p className="font-bold">Fire</p><p className="text-sm text-white/70">101</p></div>
                </a>
                <a href="tel:108" className="flex items-center gap-3 bg-white/15 rounded-2xl px-4 py-4 border border-white/20 min-h-[56px]">
                  <Cross size={22} /><div><p className="font-bold">Ambulance</p><p className="text-sm text-white/70">108</p></div>
                </a>
              </>
            )}
          </div>
        </div>

        {/* Quick Disaster Guides */}
        {disasters.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-white/60 mb-3">⚡ QUICK GUIDES</h2>
            <div className="grid grid-cols-3 gap-2">
              {disasters.map(d => (
                <button
                  key={d.id}
                  onClick={() => setOpenGuide(openGuide === d.id ? null : d.id)}
                  className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 text-center border border-white/10 active:scale-95 transition-transform min-h-[80px] flex flex-col items-center justify-center"
                >
                  <span className="text-2xl">{d.icon}</span>
                  <p className="text-xs font-semibold mt-1">{d.name}</p>
                </button>
              ))}
            </div>
            {openGuide !== null && (
              <div className="mt-3 bg-white/10 rounded-2xl p-4 border border-white/10">
                {guides.filter(g => g.disaster_id === openGuide).map(g => (
                  <div key={g.id} className="mb-2 last:mb-0">
                    <p className="text-sm font-bold mb-1">{g.title}</p>
                    <p className="text-xs text-white/80 whitespace-pre-wrap">{g.content}</p>
                  </div>
                ))}
                {guides.filter(g => g.disaster_id === openGuide).length === 0 && (
                  <p className="text-xs text-white/80">{disasters.find(d => d.id === openGuide)?.description}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Institution Safety Info */}
        {safetyPlan && (
          <div className="mb-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-white/60 mb-3">🏫 YOUR INSTITUTION</h2>
            <div className="space-y-2">
              {safetyPlan.evacuation_instructions && (
                <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
                  <p className="text-xs font-bold uppercase text-white/60 mb-1">Evacuation Route</p>
                  <p className="text-sm">{safetyPlan.evacuation_instructions}</p>
                </div>
              )}
              {safetyPlan.assembly_point && (
                <div className="bg-white/10 rounded-2xl p-4 border border-white/10 flex items-start gap-3">
                  <MapPin size={18} className="shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold uppercase text-white/60 mb-1">Assembly Point</p>
                    <p className="text-sm">{safetyPlan.assembly_point}</p>
                  </div>
                </div>
              )}
              {safetyPlan.first_aid_location && (
                <div className="bg-white/10 rounded-2xl p-4 border border-white/10 flex items-start gap-3">
                  <Cross size={18} className="shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold uppercase text-white/60 mb-1">First Aid</p>
                    <p className="text-sm">{safetyPlan.first_aid_location}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Other Resources */}
        {resources.filter(r => r.resource_type !== 'phone').length > 0 && (
          <div className="mb-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-white/60 mb-3">📋 RESOURCES</h2>
            <div className="space-y-2">
              {resources.filter(r => r.resource_type !== 'phone').map(r => (
                <div key={r.id} className="bg-white/10 rounded-2xl p-3 border border-white/10">
                  {r.url ? (
                    <a href={r.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                      <ExternalLink size={14} /><span className="text-sm font-medium">{r.title}</span>
                    </a>
                  ) : (
                    <div>
                      <p className="text-sm font-medium">{r.title}</p>
                      {r.content && <p className="text-xs text-white/60 mt-0.5">{r.content}</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
