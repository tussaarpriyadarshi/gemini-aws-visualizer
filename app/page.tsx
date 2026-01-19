'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { AWSRegion, GeminiAction } from '@/lib/types';
import { queryGemini } from '@/lib/gemini';
import awsRegionsData from '@/aws-regions.json';

const Scene = dynamic(() => import('@/components/Scene'), { ssr: false });

export default function Home() {
   

  const [regions] = useState<AWSRegion[]>(awsRegionsData);
  const [query, setQuery] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeminiAction | null>(null);
  const [highlightedRegions, setHighlightedRegions] = useState<string[]>([]);
  const [flyToRegion, setFlyToRegion] = useState<string | null>(null);
  const [compareRegions, setCompareRegions] = useState<string[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<AWSRegion | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || !apiKey.trim()) return;
    console.log("Key prefix:", apiKey.slice(0, 4));

    setLoading(true);
    setResult(null);
    setHighlightedRegions([]);
    setFlyToRegion(null);
    setCompareRegions([]);

    try {
      const action = await queryGemini(query, apiKey);
      setResult(action);

      // Apply visualization based on action
      if (action.action === 'highlight_regions' && action.regions) {
        setHighlightedRegions(action.regions);
      } else if (action.action === 'camera_fly' && action.target) {
        setFlyToRegion(action.target);
        setHighlightedRegions([action.target]);
      } else if (action.action === 'compare_regions' && action.regions) {
        setHighlightedRegions(action.regions);
        setCompareRegions(action.regions);
      } else if (action.action === 'provision_architecture' && action.regions) {
        setHighlightedRegions(action.regions);
        if (action.regions.length >= 2) {
          setCompareRegions(action.regions);
        }
      }
      else if (action.action === "latency_suggestion" && action.regions) {
          setHighlightedRegions(action.regions);
          setCompareRegions([]); // no topology
      }

    } catch (error) {
      console.error('Error:', error);
      setResult({
        action: 'error',
        reason: 'An error occurred. Please check your API key and try again.'
      });
    } finally {
      setLoading(false);
    }
    
  };

  const handleRegionClick = (region: AWSRegion) => {
    setSelectedRegion(region);
  };

  const exampleQueries = [
    "Show me low-latency options for India",
    "I need redundancy between Tokyo and Seoul",
    "Fly me to Ireland",
    "I'm building a fintech platform for London and Mumbai. Compliance matters.",
    "Recommend deployment for South America users",
    "I need sub-30ms latency for gaming in Southeast Asia"
  ];

  return (
    <main style={{ 
      width: '100vw', 
      height: '100vh', 
      overflow: 'hidden',
      fontFamily: '"JetBrains Mono", "Courier New", monospace',
      background: '#0a0e27'
    }}>
      {/* 3D Visualization */}
      <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
        <Scene
          regions={regions}
          highlightedRegions={highlightedRegions}
          flyToRegion={flyToRegion}
          compareRegions={compareRegions}
          onRegionClick={handleRegionClick}
        />
      </div>

      {/* UI Overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        padding: '2rem',
        display: 'flex',
        flexDirection: 'column',
        
        gap: '2rem'
      }}>
        {/* Header */}
        <div style={{
          background: 'rgba(10, 14, 39, 0.15)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(78, 205, 196, 0.3)',
          borderRadius: '12px',
          padding: '1.5rem 2rem',
          pointerEvents: 'auto',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
        }}>
          <h1 style={{
            margin: 0,
            fontSize: '1.8rem',
            fontWeight: 700,
            background: 'linear-gradient(135deg, #4ecdc4 0%, #ff6b35 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '0.5px'
          }}>
            AWS 3D COMMAND CENTER
          </h1>
          <p style={{
            margin: '0.5rem 0 0 0',
            color: '#95e1d3',
            fontSize: '0.9rem',
            opacity: 0.9
          }}>
            Intelligent Infrastructure Visualization + Gemini AI
          </p>
        </div>

        {/* Query Panel */}
        <div style={{
          background: 'rgba(10, 14, 39, 0.85)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(78, 205, 196, 0.3)',
          borderRadius: '12px',
          padding: '1.5rem',
          pointerEvents: 'auto',
          maxWidth: '390px',
          marginTop:'1rem',
          //marginLeft: '1rem',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
        }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', color: '#95e1d3', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 500 }}>
                Gemini API Key
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your Gemini API key"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(78, 205, 196, 0.2)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.9rem',
                  outline: 'none',
                  transition: 'all 0.2s'
                }}
                onFocus={(e) => {
                  e.target.style.border = '1px solid rgba(78, 205, 196, 0.5)';
                  e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                }}
                onBlur={(e) => {
                  e.target.style.border = '1px solid rgba(78, 205, 196, 0.2)';
                  e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', color: '#95e1d3', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 500 }}>
                Natural Language Query
              </label>
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask me anything about AWS infrastructure..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(78, 205, 196, 0.2)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.9rem',
                  outline: 'none',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  transition: 'all 0.2s'
                }}
                onFocus={(e) => {
                  e.target.style.border = '1px solid rgba(78, 205, 196, 0.5)';
                  e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                }}
                onBlur={(e) => {
                  e.target.style.border = '1px solid rgba(78, 205, 196, 0.2)';
                  e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !query.trim() || !apiKey.trim()}
              style={{
                padding: '0.875rem',
                background: loading ? 'rgba(78, 205, 196, 0.3)' : 'linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.95rem',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                opacity: (!query.trim() || !apiKey.trim()) ? 0.5 : 1
              }}
              onMouseEnter={(e) => {
                if (!loading && query.trim() && apiKey.trim()) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(78, 205, 196, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {loading ? 'ANALYZING...' : 'EXECUTE QUERY'}
            </button>
          </form>

          {/* Example Queries */}
          <div style={{ marginTop: '1rem' }}>
            <p style={{ color: '#95e1d3', fontSize: '0.8rem', marginBottom: '0.5rem', opacity: 0.8 }}>
              Example queries:
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {exampleQueries.slice(0, 3).map((example, i) => (
                <button
                  key={i}
                  onClick={() => setQuery(example)}
                  style={{
                    padding: '0.4rem 0.8rem',
                    background: 'rgba(78, 205, 196, 0.1)',
                    border: '1px solid rgba(78, 205, 196, 0.3)',
                    borderRadius: '6px',
                    color: '#95e1d3',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(78, 205, 196, 0.2)';
                    e.currentTarget.style.borderColor = 'rgba(78, 205, 196, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(78, 205, 196, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(78, 205, 196, 0.3)';
                  }}
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Result Panel */}
        {result && (
          <div style={{
            background: 'rgba(10, 14, 39, 0.85)',
            backdropFilter: 'blur(12px)',
            border: `1px solid ${result.action === 'error' ? 'rgba(255, 107, 53, 0.3)' : 'rgba(78, 205, 196, 0.3)'}`,
            borderRadius: '12px',
            padding: '1.5rem',
            pointerEvents: 'auto',
            maxWidth: '600px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            animation: 'slideIn 0.3s ease-out'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: result.action === 'error' ? '#ff6b35' : '#4ecdc4',
                boxShadow: `0 0 10px ${result.action === 'error' ? '#ff6b35' : '#4ecdc4'}`
              }} />
              <h3 style={{
                margin: 0,
                color: result.action === 'error' ? '#ff6b35' : '#4ecdc4',
                fontSize: '0.95rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {result.action.replace(/_/g, ' ')}
              </h3>
            </div>
            
            <p style={{
              margin: 0,
              color: '#e0e0e0',
              fontSize: '0.9rem',
              lineHeight: '1.6'
            }}>
              {result.reason}
            </p>

            {result.regions && result.regions.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <p style={{ color: '#95e1d3', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                  Selected Regions:
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {result.regions.map(regionCode => {
                    const region = regions.find(r => r.region === regionCode);
                    return region ? (
                      <span key={regionCode} style={{
                        padding: '0.4rem 0.8rem',
                        background: 'rgba(255, 107, 53, 0.2)',
                        border: '1px solid rgba(255, 107, 53, 0.4)',
                        borderRadius: '6px',
                        color: '#ffbe0b',
                        fontSize: '0.8rem',
                        fontWeight: 500
                      }}>
                        {region.displayName} ({regionCode})
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            )}
            {result.latency_estimate && (
  <p style={{ color: '#95e1d3', fontSize: '0.85rem', marginTop: '0.75rem' }}>
    Estimated latency: {result.latency_estimate}
  </p>
)}


            {result.architecture && result.architecture.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <p style={{ color: '#95e1d3', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                  Architecture Recommendations:
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {result.architecture.map((arch, i) => (
                    <span key={i} style={{
                      padding: '0.4rem 0.8rem',
                      background: 'rgba(78, 205, 196, 0.2)',
                      border: '1px solid rgba(78, 205, 196, 0.4)',
                      borderRadius: '6px',
                      color: '#95e1d3',
                      fontSize: '0.8rem'
                    }}>
                      {arch}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Region Info Panel (bottom right) */}
        {selectedRegion && (
          <div style={{
            position: 'absolute',
            bottom: '2rem',
            right: '2rem',
            background: 'rgba(10, 14, 39, 0.85)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(78, 205, 196, 0.3)',
            borderRadius: '12px',
            padding: '1rem',
            pointerEvents: 'auto',
            minWidth: '250px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
          }}>
            <button
              onClick={() => setSelectedRegion(null)}
              style={{
                position: 'absolute',
                top: '0.5rem',
                right: '0.5rem',
                background: 'none',
                border: 'none',
                color: '#95e1d3',
                cursor: 'pointer',
                fontSize: '1.2rem',
                padding: '0.25rem',
                lineHeight: 1
              }}
            >
              ×
            </button>
            <h4 style={{
              margin: '0 0 0.75rem 0',
              color: '#4ecdc4',
              fontSize: '1rem',
              fontWeight: 600
            }}>
              {selectedRegion.displayName}
            </h4>
            <div style={{ fontSize: '0.85rem', color: '#e0e0e0', lineHeight: '1.8' }}>
              <p style={{ margin: '0.25rem 0' }}>
                <strong style={{ color: '#95e1d3' }}>Region:</strong> {selectedRegion.region}
              </p>
              <p style={{ margin: '0.25rem 0' }}>
                <strong style={{ color: '#95e1d3' }}>Country:</strong> {selectedRegion.country}
              </p>
              <p style={{ margin: '0.25rem 0' }}>
                <strong style={{ color: '#95e1d3' }}>AZs:</strong> {selectedRegion.availabilityZones.length}
              </p>
              <div style={{ marginTop: '0.75rem' }}>
                <strong style={{ color: '#95e1d3', fontSize: '0.8rem' }}>Availability Zones:</strong>
                <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {selectedRegion.availabilityZones.map(az => (
                    <span key={az} style={{
                      padding: '0.25rem 0.5rem',
                      background: 'rgba(149, 225, 211, 0.1)',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      color: '#95e1d3'
                    }}>
                      {az}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add CSS animation */}
      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </main>
  );
  

}