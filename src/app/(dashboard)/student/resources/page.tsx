'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Phone, MapPin, Cross, ExternalLink, AlertTriangle } from 'lucide-react';
import Card from '@/components/ui/Card';

interface Resource { id: number; resource_type: string; title: string; content: string; phone_number: string; url: string; }
interface SafetyPlan { evacuation_instructions: string; assembly_point: string; emergency_exit_information: string; first_aid_location: string; }
interface Guide { id: number; title: string; content: string; disaster_name: string; icon: string; }

function ResourceBlock({ r }: { r: Resource }) {
  if (r.resource_type === 'phone' && r.phone_number) {
    return (
      <a href={`tel:${r.phone_number}`} className="flex items-center gap-3">
        <Phone size={18} className="text-emergency" />
        <div>
          <p className="text-sm font-semibold text-text">{r.title}</p>
          <p className="text-xs text-text-muted">{r.phone_number}</p>
        </div>
      </a>
    );
  }
  if (r.resource_type === 'link' && r.url) {
    return (
      <a href={r.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3">
        <ExternalLink size={18} className="text-secondary" />
        <div>
          <p className="text-sm font-semibold text-text">{r.title}</p>
          {r.content && <p className="text-xs text-text-muted">{r.content}</p>}
        </div>
      </a>
    );
  }
  return (
    <div>
      <p className="text-sm font-semibold text-text">{r.title}</p>
      {r.content && <p className="text-xs text-text-muted mt-1 whitespace-pre-wrap">{r.content}</p>}
    </div>
  );
}

export default function StudentResourcesPage() {
  const router = useRouter();
  const [resources, setResources] = useState<Resource[]>([]);
  const [safetyPlan, setSafetyPlan] = useState<SafetyPlan | null>(null);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/emergency')
      .then(r => r.json())
      .then(d => {
        setResources(d.resources || []);
        setSafetyPlan(d.safetyPlan);
        setGuides(d.guides || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const phones = resources.filter(r => r.resource_type === 'phone');
  const others = resources.filter(r => r.resource_type !== 'phone' && r.resource_type !== 'guide');

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-8">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.push('/student')} className="p-2 rounded-xl hover:bg-gray-100 min-h-[44px] min-w-[44px] flex items-center justify-center">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-text">Emergency Resources</h1>
      </div>

      <Card className="mb-4 !bg-red-50 !border-red-200" interactive onClick={() => router.push('/emergency')}>
        <div className="flex items-center gap-3">
          <AlertTriangle className="text-emergency" />
          <div>
            <p className="text-sm font-bold text-emergency">Open Emergency Mode</p>
            <p className="text-xs text-text-muted">One-tap calls and institution safety info</p>
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="h-16 skeleton rounded-2xl" />)}</div>
      ) : (
        <>
          <h2 className="text-sm font-bold text-text mb-2">Emergency Contacts</h2>
          <div className="space-y-2 mb-5">
            {phones.map(r => (
              <Card key={r.id}><ResourceBlock r={r} /></Card>
            ))}
          </div>

          {safetyPlan && (
            <>
              <h2 className="text-sm font-bold text-text mb-2">Institution Safety Plan</h2>
              <div className="space-y-2 mb-5">
                {safetyPlan.evacuation_instructions && (
                  <Card>
                    <p className="text-xs font-bold text-text-muted mb-1">Evacuation route</p>
                    <p className="text-sm whitespace-pre-wrap">{safetyPlan.evacuation_instructions}</p>
                  </Card>
                )}
                {safetyPlan.assembly_point && (
                  <Card>
                    <div className="flex items-start gap-2">
                      <MapPin size={16} className="text-primary mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-text-muted mb-1">Assembly point</p>
                        <p className="text-sm">{safetyPlan.assembly_point}</p>
                      </div>
                    </div>
                  </Card>
                )}
                {safetyPlan.emergency_exit_information && (
                  <Card>
                    <p className="text-xs font-bold text-text-muted mb-1">Emergency exits</p>
                    <p className="text-sm whitespace-pre-wrap">{safetyPlan.emergency_exit_information}</p>
                  </Card>
                )}
                {safetyPlan.first_aid_location && (
                  <Card>
                    <div className="flex items-start gap-2">
                      <Cross size={16} className="text-success mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-text-muted mb-1">First aid</p>
                        <p className="text-sm">{safetyPlan.first_aid_location}</p>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            </>
          )}

          {guides.length > 0 && (
            <>
              <h2 className="text-sm font-bold text-text mb-2">Disaster Guides</h2>
              <div className="space-y-2 mb-5">
                {guides.map(g => (
                  <Card key={g.id}>
                    <p className="text-sm font-semibold">{g.icon} {g.title}</p>
                    <p className="text-xs text-text-muted whitespace-pre-wrap mt-1">{g.content}</p>
                  </Card>
                ))}
              </div>
            </>
          )}

          {others.length > 0 && (
            <div className="space-y-2">
              {others.map(r => (
                <Card key={r.id}><ResourceBlock r={r} /></Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
