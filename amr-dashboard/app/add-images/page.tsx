"use client";

import { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { SiteData } from '@/types/site_types';
import { toast } from 'react-toastify';
import { getAllSites, addSiteImage } from '@/app/services/siteService';

function AddImagesContent() {
  const searchParams = useSearchParams();
  const initialSiteId = searchParams.get('site');

  const [sites, setSites] = useState<SiteData[]>([]);
  const [selectedSite, setSelectedSite] = useState<SiteData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [imageBase64, setImageBase64] = useState<string[]>([]);
  const [checkAlgae, setCheckAlgae] = useState<boolean>(false);
  const [imageDateTaken, setImageDateTaken] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const fetchSites = async () => {
      const response = await getAllSites();
      if (response.ok) {
        const data = await response.json();
        setSites(data.sites);
        
        if (initialSiteId) {
          const site = data.sites.find((s: SiteData) => s.id === parseInt(initialSiteId));
          if (site) setSelectedSite(site);
        }
      }
    };
    fetchSites();
  }, [initialSiteId]);

  const filteredSites = sites.filter(site => 
    site.sampleName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    site.geoLocName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const promises = files.map(file => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve(reader.result as string);
          };
          reader.readAsDataURL(file);
        });
      });
      Promise.all(promises).then(base64Strings => {
        setImageBase64(base64Strings);
        toast.success(`${files.length} images loaded successfully!`);
      });
    }
  };

  const handleSubmit = async () => {
    if (!selectedSite || !selectedSite.id) {
      toast.error('Please select a site first.');
      return;
    }
    if (imageBase64.length === 0) {
      toast.error('Please select images to upload.');
      return;
    }
    if (!imageDateTaken) {
      toast.error('Please select a date taken.');
      return;
    }

    setIsUploading(true);
    try {
      const response = await addSiteImage(selectedSite.id, imageBase64, imageDateTaken, checkAlgae);
      if (response.ok) {
        toast.success("Images uploaded successfully!");
        setImageBase64([]);
        setCheckAlgae(false);
        if (imageInputRef.current) {
          imageInputRef.current.value = "";
        }
      } else {
        toast.error("Failed to upload images.");
      }
    } catch (e) {
      console.error(e);
      toast.error("An error occurred during upload.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <main className="flex-1 overflow-auto bg-gray-50 p-6 min-h-screen">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Add Site Images</h1>
          <p className="text-gray-600 mt-2">Upload a batch of images to a specific site location.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-6">
          
          {/* Site Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700">1. Select Location</label>
            {!selectedSite ? (
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by site name or region..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                {searchQuery && (
                  <div className="absolute top-full left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                    {filteredSites.length > 0 ? (
                      filteredSites.map(site => (
                        <div
                          key={site.id}
                          onClick={() => { setSelectedSite(site); setSearchQuery(''); }}
                          className="px-4 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0"
                        >
                          <div className="font-semibold text-gray-800">{site.sampleName}</div>
                          <div className="text-xs text-gray-500">{site.geoLocName} • {site.dangerZone}</div>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-gray-500">No locations found.</div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-100 rounded-lg">
                <div>
                  <div className="font-semibold text-blue-900">{selectedSite.sampleName}</div>
                  <div className="text-xs text-blue-700">{selectedSite.geoLocName}</div>
                </div>
                <button
                  onClick={() => setSelectedSite(null)}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Change
                </button>
              </div>
            )}
          </div>

          <hr className="border-gray-100" />

          {/* Image Upload */}
          <div className="space-y-4 opacity-100 transition-opacity" style={{ opacity: selectedSite ? 1 : 0.5, pointerEvents: selectedSite ? 'auto' : 'none' }}>
            <label className="block text-sm font-semibold text-gray-700">2. Batch Upload Settings</label>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Batch Date Taken</label>
                <input 
                  type="date" 
                  value={imageDateTaken} 
                  onChange={(e) => setImageDateTaken(e.target.value)} 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" 
                />
              </div>
              <div className="flex flex-col justify-end">
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                  <input 
                    type="checkbox" 
                    id="checkAlgae" 
                    checked={checkAlgae} 
                    onChange={(e) => setCheckAlgae(e.target.checked)} 
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer" 
                  />
                  <label htmlFor="checkAlgae" className="text-sm text-gray-700 cursor-pointer select-none">
                    Run AI Algae Scanner on images
                  </label>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Select Photos</label>
              <input type="file" ref={imageInputRef} accept="image/*" multiple onChange={handleImageChange} className="hidden" />
              <button
                onClick={() => imageInputRef.current?.click()}
                className="w-full border-2 border-dashed border-gray-300 rounded-xl py-8 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors flex flex-col items-center gap-2"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                {imageBase64.length > 0 ? (
                  <span className="font-semibold text-blue-600">{imageBase64.length} images selected — click to change</span>
                ) : (
                  <span>Click to browse images</span>
                )}
              </button>

              {imageBase64.length > 0 && (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Preview</span>
                    <button
                      onClick={() => { setImageBase64([]); if (imageInputRef.current) imageInputRef.current.value = ""; }}
                      className="text-xs text-red-500 hover:text-red-700 font-medium"
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                    {imageBase64.map((src, idx) => (
                      <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                        <img src={src} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          onClick={() => setImageBase64(prev => prev.filter((_, i) => i !== idx))}
                          className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Remove"
                        >
                          ✕
                        </button>
                        <div className="absolute bottom-0 left-0 right-0 bg-black/30 text-white text-[10px] text-center py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          {idx + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleSubmit}
              disabled={isUploading || imageBase64.length === 0 || !selectedSite}
              className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-4"
            >
              {isUploading ? 'Uploading & Processing...' : 'Upload Image Batch'}
            </button>
          </div>

        </div>
      </div>
    </main>
  );
}

export default function AddImagesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-gray-500">Loading Add Images...</div>}>
      <AddImagesContent />
    </Suspense>
  );
}
