'use client';

import { useState, useRef, useEffect } from 'react';
import { MapProvider } from '@/components/map/MapContext';
import SitesSidebar from '@/components/map/SitesSidebar';
import { Map } from "@/components/map/LoadMap";
import { SiteData } from '@/types/site_types';
import { toast } from 'react-toastify';
import { addSiteData, addMutlipleSiteData, getAllSites } from '@/app/services/siteService';
import ConfirmFile from '@/components/add-data/confirmFile';
import { DEFAULT_FILTERS } from '@/constants/map_constants';
import { getDangerZoneLabel, MapFilters } from '@/types/map_types';

export default function AddDataPage() {
  const [dangerZone, setDangerZone] = useState('Blue');
  const [showImportDropdown, setShowImportDropdown] = useState(false);
  const [acceptType, setAcceptType] = useState('.csv');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [imageBase64, setImageBase64] = useState<string | undefined>(undefined);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
   const [sites, setSites] = useState<SiteData[]>([]);
  
    const handleGetAllSites = async () => {
      const allSitesResponse = await getAllSites();
  
      if (allSitesResponse.ok) {
        const allSiteData = await allSitesResponse.json();
        setSites(allSiteData.sites);
  
      }
    }
  
    useEffect(() => {
      handleGetAllSites();
      filteredPoints;
    }, []);

  const [formData, setFormData] = useState({
    // required
    sampleName: '',
    isolationSource: '',
    collectionDate: '',
    geoLocName: '',
    latitude: '',
    longitude: '',
    amrResGenes: '',
    predictedSir: '',
    sampleAnalysisType: '',
    dangerZone: 'blue',

    // optional
    isolateId: '',
    organism: '',
    sampleId: '',
    collectedBy: '',
    sequenceName: '',
    elementType: '',
    class: '',
    subclass: '',
    targetLength: '',
    referenceLength: '',
    coverage: '',
    identity: '',
    alignmentLength: '',
    accession: '',
    virtulenceGenes: '',
    plasmidReplicons: '',

    // water params
    temperature: '',
    ph: '',
    tds: '',
    ec: '',
    dissolvedO2: '',
  });

  const handleClear = () => {
    setDangerZone('Blue');
    setFormData({
      // required
    sampleName: '',
    isolationSource: '',
    collectionDate: '',
    geoLocName: '',
    latitude: '',
    longitude: '',
    amrResGenes: '',
    predictedSir: '',
    sampleAnalysisType: '',
    dangerZone: 'blue',

    // optional
    isolateId: '',
    organism: '',
    sampleId: '',
    collectedBy: '',
    sequenceName: '',
    elementType: '',
    class: '',
    subclass: '',
    targetLength: '',
    referenceLength: '',
    coverage: '',
    identity: '',
    alignmentLength: '',
    accession: '',
    virtulenceGenes: '',
    plasmidReplicons: '',

    // water params
    temperature: '',
    ph: '',
    tds: '',
    ec: '',
    dissolvedO2: '',
    });
    setImageBase64(undefined);
  };

  const handleImportClick = (type: string) => {
    setShowImportDropdown(false);
    let accept = '.csv';
    if (type === 'TSV') accept = '.tsv';
    if (type === 'JSON') accept = '.json';
    setAcceptType(accept);
    setTimeout(() => {
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    }, 0);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPendingFile(file);
    }
  };

   const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImageBase64(base64String);
        toast.success('Image loaded successfully!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddData = async () => {
    const response = await addSiteData({
      // required
      sampleName: formData.sampleName,
      isolationSource: formData.isolationSource,
      collectionDate: new Date(formData.collectionDate),
      geoLocName: formData.geoLocName,
      latitude: parseFloat(formData.latitude),
      longitude: parseFloat(formData.longitude),
      amrResGenes: formData.amrResGenes,
      predictedSir: formData.predictedSir,
      sampleAnalysisType: formData.sampleAnalysisType,
      dangerZone: formData.dangerZone as 'red' | 'yellow' | 'green' | 'blue',

      // water params
      temperature: formData.temperature ? parseFloat(formData.temperature) : undefined,
      ph: formData.ph ? parseFloat(formData.ph) : undefined,
      tds: formData.tds ? parseFloat(formData.tds) : undefined,
      ec: formData.ec ? parseFloat(formData.ec) : undefined,
      dissolvedO2: formData.dissolvedO2 ? parseFloat(formData.dissolvedO2) : undefined,

      // optional
      isolateId: formData.isolateId || undefined,
      orgamism: formData.organism || undefined,
      sampleId: formData.sampleId || undefined,
      collectedBy: formData.collectedBy || undefined,
      sequenceName: formData.sequenceName || undefined,
      elementType: formData.elementType || undefined,
      class: formData.class || undefined,
      subclass: formData.subclass || undefined,
      targetLength: formData.targetLength ? parseFloat(formData.targetLength) : undefined,
      referenceLength: formData.referenceLength ? parseFloat(formData.referenceLength) : undefined,
      coverage: formData.coverage ? parseFloat(formData.coverage) : undefined,
      identity: formData.identity ? parseFloat(formData.identity) : undefined,
      alignmentLength: formData.alignmentLength ? parseFloat(formData.alignmentLength) : undefined,
      accession: formData.accession || undefined,
      virtulenceGenes: formData.virtulenceGenes || undefined,
      plasmidReplicons: formData.plasmidReplicons || undefined,

      // image
      imageBase64,
    });
    if (response.status === 200 || response.status === 201) {
      toast.success('Site data added successfully!');
      handleClear();
      handleGetAllSites();
      filteredPoints;
    } else {
      toast.error('Failed to add site data. Please try again.');
    }


  }

  const handleAddFileData = async() => {
    if (!pendingFile) {
      toast.error('No file selected. Please select a file to import.');
      return;
    }

    setPendingFile(null);
    if (fileInputRef.current?.files?.[0]) {
      const file = fileInputRef.current.files[0];
      const response = await addMutlipleSiteData(file);

      if (response.status === 200 || response.status === 201) {
        toast.success('File data added successfully!' );
        handleClear();
        handleGetAllSites();
        filteredPoints;
      } else {
        toast.error('Failed to add file data. Please try again.');
      }
    }
  }

  const handleCancel = () => {
    setPendingFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };


   const [selectedSite, setSelectedSite] = useState<SiteData | null>(null);
    const [filters, setFilters] = useState<MapFilters>(DEFAULT_FILTERS);
   
     const filteredPoints = sites.filter((point) => {
         if (!filters) return true;
     
         if (filters.contaminationLevels) {
           if (filters.contaminationLevels?.length > 0 &&
             !filters.contaminationLevels.includes(getDangerZoneLabel(point.dangerZone as any)))
           return false;
         }
     
         if (filters.sites) {
           const site= point.geoLocName;
           let siteName = site;
           if (point.sampleName) {
             if (site.includes("Apies River - ")) {
               const parts = site.split("Apies River - ");
               if (parts.length > 1) {
                 siteName = parts[1].trim();
               }
             }
             if (site.includes(" - Apies River")) {
               const parts = site.split(" - Apies River");
               if (parts.length > 1) {
                 siteName = parts[0].trim();
               }
             }
           }
           if (filters.sites?.length > 0 &&
             !filters.sites.includes(siteName))
           return false;
         }
     
         const sampleDate = new Date(point.collectionDate);
         if (filters.startDate && sampleDate < new Date(filters.startDate)) return false;
         if (filters.endDate   && sampleDate > new Date(filters.endDate))   return false;
     
         return true;
       });

  return (

    <div className="flex h-screen p-2 font-sans text-sm">

      <ConfirmFile
          file={pendingFile}
           handleConfirm={handleAddFileData}
            handleCancel={handleCancel}
        />

          <div className="flex-1 flex overflow-hidden">
            {/* MAIN Form Column */}
            <div className="w-80 border-r border-gray-100 p-6 flex flex-col overflow-y-auto py-4">
              
              <button 
                className="bg-[#ef4444] text-white px-4 py-1.5 rounded w-fit text-xs font-medium mb-4 hover:bg-red-600 transition"
                onClick={() => window.location.href = "/home"}
              >
                Close
              </button>

              <div className="space-y-3 flex-1 overflow-y-auto">
                {/* Form Fields */}

                <div>
                  <label className="block text-gray-700 mb-0.5 text-xs">Sample Name</label>
                  <input type="text" placeholder="Value" value={formData.sampleName} onChange={(e) => setFormData({...formData, sampleName: e.target.value})} className="w-full border border-gray-200 rounded-md px-3 py-1 focus:outline-none focus:border-blue-500 placeholder-gray-400 text-black text-xs" />
                </div>
                <div>
                  <label className="block text-gray-700 mb-0.5 text-xs">Isolation Source</label>
                  <input type="text" placeholder="Value" value={formData.isolationSource} onChange={(e) => setFormData({...formData, isolationSource: e.target.value})} className="w-full border border-gray-200 rounded-md px-3 py-1 focus:outline-none focus:border-blue-500 placeholder-gray-400 text-black text-xs" />
                </div>
                <div>
                  <label className="block text-gray-700 mb-0.5 text-xs">Collection Date </label>
                  <input type="text" placeholder="Value" value={formData.collectionDate} onChange={(e) => setFormData({...formData, collectionDate: e.target.value})} className="w-full border border-gray-200 rounded-md px-3 py-1 focus:outline-none focus:border-blue-500 placeholder-gray-400 text-black text-xs" />
                </div>
                <div>
                  <label className="block text-gray-700 mb-0.5 text-xs">Geographic Location Name</label>
                  <input type="text" placeholder="Value" value={formData.geoLocName} onChange={(e) => setFormData({...formData, geoLocName: e.target.value})} className="w-full border border-gray-200 rounded-md px-3 py-1 focus:outline-none focus:border-blue-500 placeholder-gray-400 text-black text-xs" />
                </div>

                <div>
                  <label className="block text-gray-700 mb-1 text-xs">Location GPS Co-ordinates</label>
                  <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                    <input 
                      type="text" 
                      placeholder="Longitude" 
                      value={formData.longitude}
                      onChange={(e) => setFormData({...formData, longitude: e.target.value})}
                      className="w-full border border-gray-200 rounded-md px-3 py-1.5 focus:outline-none focus:border-blue-500 placeholder-gray-400 text-black text-xs" 
                    />
                    <input 
                      type="text" 
                      placeholder="Latitude" 
                      value={formData.latitude}
                      onChange={(e) => setFormData({...formData, latitude: e.target.value})}
                      className="w-full border border-gray-200 rounded-md px-3 py-1.5 focus:outline-none focus:border-blue-500 placeholder-gray-400 text-black text-xs" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 mb-0.5 text-xs">AMR Resistance Genes</label>
                  <input type="text" placeholder="Value" value={formData.amrResGenes} onChange={(e) => setFormData({...formData, amrResGenes: e.target.value})} className="w-full border border-gray-200 rounded-md px-3 py-1 focus:outline-none focus:border-blue-500 placeholder-gray-400 text-black text-xs" />
                </div>
                <div>
                  <label className="block text-gray-700 mb-0.5 text-xs">Predicted SIR Profile</label>
                  <input type="text" placeholder="Value" value={formData.predictedSir} onChange={(e) => setFormData({...formData, predictedSir: e.target.value})} className="w-full border border-gray-200 rounded-md px-3 py-1 focus:outline-none focus:border-blue-500 placeholder-gray-400 text-black text-xs" />
                </div>
                <div>
                  <label className="block text-gray-700 mb-0.5 text-xs">Sample Analysis Type</label>
                  <input type="text" placeholder="Value" value={formData.sampleAnalysisType} onChange={(e) => setFormData({...formData, sampleAnalysisType: e.target.value})} className="w-full border border-gray-200 rounded-md px-3 py-1 focus:outline-none focus:border-blue-500 placeholder-gray-400 text-black text-xs" />
                </div>

                <p className="text-black-500 text-xs border-b border-black-200 pb-2"> Optional </p>
                
                <div>
                  <label className="block text-gray-700 mb-1 text-xs">Danger Zone</label>
                  <select 
                    title="danger-zone"
                    className="w-full border border-gray-200 rounded-md px-3 py-1.5 bg-white text-gray-600 focus:outline-none focus:border-blue-500 text-xs"
                    value={dangerZone}
                    onChange={(e) => setDangerZone(e.target.value)}
                  >
                    <option>Red</option>
                    <option>Yellow</option>
                    <option>Green</option>
                    <option>Blue</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 mb-0.5 text-xs">Isolate ID</label>
                  <input type="text" placeholder="Value" value={formData.isolateId} onChange={(e) => setFormData({...formData, isolateId: e.target.value})} className="w-full border border-gray-200 rounded-md px-3 py-1 focus:outline-none focus:border-blue-500 placeholder-gray-400 text-black text-xs" />
                </div>
                <div>
                  <label className="block text-gray-700 mb-0.5 text-xs">Organism</label>
                  <input type="text" placeholder="Value" value={formData.organism} onChange={(e) => setFormData({...formData, organism: e.target.value})} className="w-full border border-gray-200 rounded-md px-3 py-1 focus:outline-none focus:border-blue-500 placeholder-gray-400 text-black text-xs" />
                </div>
                <div>
                  <label className="block text-gray-700 mb-0.5 text-xs">Sample ID</label>
                  <input type="text" placeholder="Value" value={formData.sampleId} onChange={(e) => setFormData({...formData, sampleId: e.target.value})} className="w-full border border-gray-200 rounded-md px-3 py-1 focus:outline-none focus:border-blue-500 placeholder-gray-400 text-black text-xs" />
                </div>
                <div>
                  <label className="block text-gray-700 mb-0.5 text-xs">Collected By</label>
                  <input type="text" placeholder="Value" value={formData.collectedBy} onChange={(e) => setFormData({...formData, collectedBy: e.target.value})} className="w-full border border-gray-200 rounded-md px-3 py-1 focus:outline-none focus:border-blue-500 placeholder-gray-400 text-black text-xs" />
                </div>
                <div>
                  <label className="block text-gray-700 mb-0.5 text-xs">Sequence Name</label>
                  <input type="text" placeholder="Value" value={formData.sequenceName} onChange={(e) => setFormData({...formData, sequenceName: e.target.value})} className="w-full border border-gray-200 rounded-md px-3 py-1 focus:outline-none focus:border-blue-500 placeholder-gray-400 text-black text-xs" />
                </div>
                <div>
                  <label className="block text-gray-700 mb-0.5 text-xs">Element Type</label>
                  <input type="text" placeholder="Value" value={formData.elementType} onChange={(e) => setFormData({...formData, elementType: e.target.value})} className="w-full border border-gray-200 rounded-md px-3 py-1 focus:outline-none focus:border-blue-500 placeholder-gray-400 text-black text-xs" />
                </div>
                <div>
                  <label className="block text-gray-700 mb-0.5 text-xs">Class</label>
                  <input type="text" placeholder="Value" value={formData.class} onChange={(e) => setFormData({...formData, class: e.target.value})} className="w-full border border-gray-200 rounded-md px-3 py-1 focus:outline-none focus:border-blue-500 placeholder-gray-400 text-black text-xs" />
                </div>
                <div>
                  <label className="block text-gray-700 mb-0.5 text-xs">Sub Class</label>
                  <input type="text" placeholder="Value" value={formData.subclass} onChange={(e) => setFormData({...formData, subclass: e.target.value})} className="w-full border border-gray-200 rounded-md px-3 py-1 focus:outline-none focus:border-blue-500 placeholder-gray-400 text-black text-xs" />
                </div>
                <div>
                  <label className="block text-gray-700 mb-0.5 text-xs">Target Length</label>
                  <input type="text" placeholder="Value" value={formData.targetLength} onChange={(e) => setFormData({...formData, targetLength: e.target.value})} className="w-full border border-gray-200 rounded-md px-3 py-1 focus:outline-none focus:border-blue-500 placeholder-gray-400 text-black text-xs" />
                </div>
                <div>
                  <label className="block text-gray-700 mb-0.5 text-xs">Reference Length</label>
                  <input type="text" placeholder="Value" value={formData.referenceLength} onChange={(e) => setFormData({...formData, referenceLength: e.target.value})} className="w-full border border-gray-200 rounded-md px-3 py-1 focus:outline-none focus:border-blue-500 placeholder-gray-400 text-black text-xs" />
                </div>
                <div>
                  <label className="block text-gray-700 mb-0.5 text-xs">Coverage</label>
                  <input type="text" placeholder="Value" value={formData.coverage} onChange={(e) => setFormData({...formData, coverage: e.target.value})} className="w-full border border-gray-200 rounded-md px-3 py-1 focus:outline-none focus:border-blue-500 placeholder-gray-400 text-black text-xs" />
                </div>
                <div>
                  <label className="block text-gray-700 mb-0.5 text-xs">Identity</label>
                  <input type="text" placeholder="Value" value={formData.identity} onChange={(e) => setFormData({...formData, identity: e.target.value})} className="w-full border border-gray-200 rounded-md px-3 py-1 focus:outline-none focus:border-blue-500 placeholder-gray-400 text-black text-xs" />
                </div>
                <div>
                  <label className="block text-gray-700 mb-0.5 text-xs">Alignment Length</label>
                  <input type="text" placeholder="Value" value={formData.alignmentLength} onChange={(e) => setFormData({...formData, alignmentLength: e.target.value})} className="w-full border border-gray-200 rounded-md px-3 py-1 focus:outline-none focus:border-blue-500 placeholder-gray-400 text-black text-xs" />
                </div>
                <div>
                  <label className="block text-gray-700 mb-0.5 text-xs">Accession</label>
                  <input type="text" placeholder="Value" value={formData.accession} onChange={(e) => setFormData({...formData, accession: e.target.value})} className="w-full border border-gray-200 rounded-md px-3 py-1 focus:outline-none focus:border-blue-500 placeholder-gray-400 text-black text-xs" />
                </div>
                <div>
                  <label className="block text-gray-700 mb-0.5 text-xs">Virtulence Genes</label>
                  <input type="text" placeholder="Value" value={formData.virtulenceGenes} onChange={(e) => setFormData({...formData, virtulenceGenes: e.target.value})} className="w-full border border-gray-200 rounded-md px-3 py-1 focus:outline-none focus:border-blue-500 placeholder-gray-400 text-black text-xs" />
                </div>
                <div>
                  <label className="block text-gray-700 mb-0.5 text-xs">Plasmid Replicons</label>
                  <input type="text" placeholder="Value" value={formData.plasmidReplicons} onChange={(e) => setFormData({...formData, plasmidReplicons: e.target.value})} className="w-full border border-gray-200 rounded-md px-3 py-1 focus:outline-none focus:border-blue-500 placeholder-gray-400 text-black text-xs" />
                </div>


                <div>
                  <label className="block text-gray-700 mb-0.5 text-xs">Water Temperature (°C)</label>
                  <input type="text" placeholder="Value" value={formData.temperature} onChange={(e) => setFormData({...formData, temperature: e.target.value})} className="w-full border border-gray-200 rounded-md px-3 py-1 focus:outline-none focus:border-blue-500 placeholder-gray-400 text-black text-xs" />
                </div>
                <div>
                  <label className="block text-gray-700 mb-0.5 text-xs">Water pH Level</label>
                  <input type="text" placeholder="Value" value={formData.ph} onChange={(e) => setFormData({...formData, ph: e.target.value})} className="w-full border border-gray-200 rounded-md px-3 py-1 focus:outline-none focus:border-blue-500 placeholder-gray-400 text-black text-xs" />
                </div>
                <div>
                  <label className="block text-gray-700 mb-0.5 text-xs">Water TDS</label>
                  <input type="text" placeholder="Value" value={formData.tds} onChange={(e) => setFormData({...formData, tds: e.target.value})} className="w-full border border-gray-200 rounded-md px-3 py-1 focus:outline-none focus:border-blue-500 placeholder-gray-400 text-black text-xs" />
                </div>
                <div>
                  <label className="block text-gray-700 mb-0.5 text-xs">Water EC</label>
                  <input type="text" placeholder="Value" value={formData.ec} onChange={(e) => setFormData({...formData, ec: e.target.value})} className="w-full border border-gray-200 rounded-md px-3 py-1 focus:outline-none focus:border-blue-500 placeholder-gray-400 text-black text-xs" />
                </div>
                <div>
                  <label className="block text-gray-700 mb-0.5 text-xs">Water DO</label>
                  <input type="text" placeholder="Value" value={formData.dissolvedO2} onChange={(e) => setFormData({...formData, dissolvedO2: e.target.value})} className="w-full border border-gray-200 rounded-md px-3 py-1 focus:outline-none focus:border-blue-500 placeholder-gray-400 text-black text-xs" />
                </div>

                 <p className="block text-gray-700 mb-0.5 text-xs">Site Image</p>
                  <div>
                    <input type="file" ref={imageInputRef} accept="image/*" onChange={handleImageChange} className="text-xs" />
                    <button
                      onClick={() => imageInputRef.current?.click()}
                      className="w-full border border-dashed border-gray-300 rounded-md py-2 text-xs text-gray-500 hover:border-blue-400 hover:text-blue-500 transition"
                    >
                      {imageBase64 ? 'Image selected' : 'Click to upload image'}
                    </button>
                  </div>

              </div>

              <div className="mt-4 flex flex-col gap-2 flex-shrink-0 pb-10">
                <button 
                  className="w-full bg-[#22c55e] text-white py-1.5 rounded-md font-medium hover:bg-[#16a34a] transition text-sm"
                  onClick={handleAddData}
                >
                  Submit
                </button>

                <div className="relative">
                  {/* Hidden file input */}
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    accept={acceptType}
                    onChange={handleFileChange}
                    className="hidden" 
                  />
                  <button 
                    onClick={() => setShowImportDropdown(!showImportDropdown)}
                    className="w-full bg-[#0ea5e9] text-white py-1.5 rounded-md font-medium hover:bg-[#0284c7] transition text-sm flex justify-center items-center gap-1"
                  >
                    Import

                  </button>
                  {showImportDropdown && (
                    <div className="absolute bottom-full left-0 mb-1 w-full bg-white border border-gray-200 rounded-md shadow-lg overflow-hidden z-10">
                      <button 
                        onClick={() => handleImportClick('CSV')}
                        className="block w-full text-left px-4 py-2 text-xs text-black font-semibold hover:bg-gray-100"
                      >
                        CSV
                      </button>
              
                      <button 
                        onClick={() => handleImportClick('TSV')}
                        className="block w-full text-left px-4 py-2 text-xs text-black font-semibold hover:bg-gray-100"
                      >
                        TSV
                      </button>
                      <button 
                        onClick={() => handleImportClick('JSON')}
                        className="block w-full text-left px-4 py-2 text-xs text-black font-semibold hover:bg-gray-100"
                      >
                        JSON
                      </button>
                    </div>
                  )}
                </div>
                <button 
                  onClick={handleClear}
                  className="w-full bg-[#ef4444] text-white py-1.5 rounded-md font-medium hover:bg-[#dc2626] transition text-sm"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Map Column */}
            <MapProvider>
                <div className="flex-1 flex overflow-hidden">
                  <div className="flex-1 relative">
                              <Map
                                points={filteredPoints}
                                selectedSite={selectedSite}
                                onSelectSite={setSelectedSite}
                                filters={filters}
                                onFiltersChange={setFilters}
                              />
                  </div>
                  <SitesSidebar
                    points={filteredPoints}
                    selectedSite={selectedSite}
                    onSelectSite={setSelectedSite}
                  />
                </div>
            </MapProvider>
          </div>

      </div>
  );
}
