"use client";

import { useState, useRef, useEffect } from 'react';
import { SiteData } from '@/types/site_types';
import { toast } from 'react-toastify';
import { getAllSites, addSiteImage } from '@/app/services/siteService';
import { X, Search, Calendar, ShieldAlert, Image as ImageIcon, Upload, Check } from 'lucide-react';
import clsx from 'clsx';

interface AddImagesPopupProps {
  isOpen: boolean;
  onClose: () => void;
  initialSite: SiteData | null;
  onRefresh: () => void;
}

export default function AddImagesPopup({ isOpen, onClose, initialSite, onRefresh }: AddImagesPopupProps) {
  const [sites, setSites] = useState<SiteData[]>([]);
  const [selectedSite, setSelectedSite] = useState<SiteData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [imageBase64, setImageBase64] = useState<string[]>([]);
  const [checkAlgae, setCheckAlgae] = useState<boolean>(false);
  const [imageDateTaken, setImageDateTaken] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchSites = async () => {
        const response = await getAllSites();
        if (response.ok) {
          const data = await response.json();
          setSites(data.sites);
          if (initialSite) {
            const site = data.sites.find((s: SiteData) => s.id === initialSite.id);
            if (site) setSelectedSite(site);
          }
        }
      };
      fetchSites();
    } else {
      // Reset on close
      setSelectedSite(null);
      setImageBase64([]);
      setCheckAlgae(false);
      setSearchQuery('');
    }
  }, [isOpen, initialSite]);

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
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      });
      Promise.all(promises).then(base64Strings => {
        setImageBase64(prev => [...prev, ...base64Strings]);
        toast.success(`${files.length} images loaded`);
      });
    }
  };

  const handleSubmit = async () => {
    if (!selectedSite || !selectedSite.id) {
      toast.error('Select site');
      return;
    }
    if (imageBase64.length === 0) {
      toast.error('Select images');
      return;
    }

    setIsUploading(true);
    try {
      const response = await addSiteImage(selectedSite.id, imageBase64, imageDateTaken, checkAlgae);
      if (response.ok) {
        toast.success("Batch uploaded");
        onRefresh();
        onClose();
      } else {
        toast.error("Upload failed");
      }
    } catch (e) {
      toast.error("Upload error");
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        
        <div className="p-6 border-b border-border flex items-center justify-between bg-gray-50/50">
          <div>
            <h1 className="text-sm font-bold uppercase tracking-wider text-foreground">Visual Documentation</h1>
            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest mt-0.5">Image Batch Ingestion</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* Site Selection */}
          <section className="space-y-4">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-brand-600 border-b border-brand-100 pb-2 flex items-center gap-2">
              <Search size={12} /> 1. Targeting Site
            </h2>
            {!selectedSite ? (
              <div className="relative">
                <input
                  type="text"
                  placeholder="Filter sites by name or region..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500 transition-all"
                />
                {searchQuery && (
                  <div className="absolute top-full left-0 right-0 mt-2 max-h-48 overflow-y-auto bg-white border border-border rounded-xl shadow-xl z-50 overflow-hidden">
                    {filteredSites.length > 0 ? (
                      filteredSites.map(site => (
                        <button
                          key={site.id}
                          onClick={() => { setSelectedSite(site); setSearchQuery(''); }}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-border last:border-0 transition-colors"
                        >
                          <div className="text-xs font-bold text-gray-800">{site.sampleName}</div>
                          <div className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">{site.geoLocName}</div>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-4 text-center text-xs font-bold text-gray-300 uppercase tracking-widest">No target found</div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 bg-brand-50 border border-brand-100 rounded-xl">
                <div>
                  <div className="text-xs font-bold text-brand-900 uppercase tracking-wider">{selectedSite.sampleName}</div>
                  <div className="text-[10px] text-brand-600 font-bold uppercase tracking-widest mt-0.5">{selectedSite.geoLocName}</div>
                </div>
                <button onClick={() => setSelectedSite(null)} className="text-[10px] font-bold text-brand-700 hover:text-brand-900 uppercase tracking-widest bg-white/50 px-3 py-1.5 rounded-lg border border-brand-200 transition-all">
                  Change Target
                </button>
              </div>
            )}
          </section>

          {/* Batch Settings */}
          <section className={clsx("space-y-4 transition-all duration-300", !selectedSite && "opacity-30 grayscale pointer-events-none")}>
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-brand-600 border-b border-brand-100 pb-2 flex items-center gap-2">
              <Calendar size={12} /> 2. Environmental Metadata
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Sampling Date</label>
                <input 
                  type="date" 
                  value={imageDateTaken} 
                  onChange={(e) => setImageDateTaken(e.target.value)} 
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-100 transition-all" 
                />
              </div>
              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-3 p-2.5 bg-gray-50 border border-border rounded-xl cursor-pointer hover:bg-gray-100 transition-colors group">
                  <input 
                    type="checkbox" 
                    checked={checkAlgae} 
                    onChange={(e) => setCheckAlgae(e.target.checked)} 
                    className="custom-checkbox" 
                  />
                  <div className="flex items-center gap-2">

                    <ShieldAlert size={14} className="text-risk-high" />
                    <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Enable Neural Algae Scanner</span>
                  </div>
                </label>
              </div>
            </div>
          </section>

          {/* Image Selection */}
          <section className={clsx("space-y-4 transition-all duration-300", !selectedSite && "opacity-30 grayscale pointer-events-none")}>
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-brand-600 border-b border-brand-100 pb-2 flex items-center gap-2">
              <ImageIcon size={12} /> 3. Visual Assets
            </h2>
            
            <input type="file" ref={imageInputRef} accept="image/*" multiple onChange={handleImageChange} className="hidden" />
            <button
              onClick={() => imageInputRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-200 rounded-2xl py-12 flex flex-col items-center gap-3 hover:border-brand-300 hover:bg-brand-50/30 transition-all group"
            >
              <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100 group-hover:scale-110 transition-transform">
                <Upload size={20} className="text-gray-400 group-hover:text-brand-500" />
              </div>
              <div className="text-center">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Select photographic evidence</p>
                <p className="text-[10px] text-gray-400 font-medium mt-1">Multi-file support for batch analysis</p>
              </div>
            </button>

            {imageBase64.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{imageBase64.length} Assets Staged</span>
                  <button onClick={() => setImageBase64([])} className="text-[10px] font-bold text-risk-high uppercase tracking-widest hover:underline">Clear Stage</button>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                  {imageBase64.map((src, idx) => (
                    <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100 border border-border shadow-subtle">
                      <img src={src} alt="Evidence" className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all" />
                      <button
                        onClick={() => setImageBase64(prev => prev.filter((_, i) => i !== idx))}
                        className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded-full text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-risk-high"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>

        <div className="p-6 bg-gray-50 border-t border-border">
          <button
            onClick={handleSubmit}
            disabled={isUploading || imageBase64.length === 0 || !selectedSite}
            className="w-full flex items-center justify-center gap-3 bg-foreground text-white font-bold py-3.5 rounded-xl text-xs uppercase tracking-widest hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-subtle"
          >
            {isUploading ? <span className="animate-pulse">Ingesting Matrix...</span> : <><Check size={16} /> Execute Batch Upload</>}
          </button>
        </div>
      </div>
    </div>
  );
}
