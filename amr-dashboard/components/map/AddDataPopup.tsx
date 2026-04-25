'use client';

import { useState, useRef, useEffect } from 'react';
import { SiteData } from '@/types/site_types';
import { toast } from 'react-toastify';
import { addSiteData, addMutlipleSiteData, updateSite } from '@/app/services/siteService';
import ConfirmFile from '@/components/add-data/confirmFile';
import { Upload, FileJson, FileText, Eraser, Check, X } from 'lucide-react';
import clsx from 'clsx';

const INITIAL_FORM_DATA = {
  sampleName: '',
  isolationSource: '',
  collectionDate: '',
  geoLocName: '',
  latitude: '',
  longitude: '',
  amrResGenes: '',
  predictedSir: '',
  sampleAnalysisType: '',
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
  temperature: '',
  ph: '',
  tds: '',
  ec: '',
  dissolvedO2: '',
};

interface AddDataPopupProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSite: SiteData | null;
  onRefresh: () => void;
}

export default function AddDataPopup({ isOpen, onClose, selectedSite, onRefresh }: AddDataPopupProps) {
  const [showImportDropdown, setShowImportDropdown] = useState(false);
  const [acceptType, setAcceptType] = useState('.csv');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);

  useEffect(() => {
    if (selectedSite) {
      setFormData({
        sampleName: selectedSite.sampleName ?? '',
        isolationSource: selectedSite.isolationSource ?? '',
        collectionDate: selectedSite.collectionDate ? new Date(selectedSite.collectionDate).toISOString().split('T')[0] : '',
        geoLocName: selectedSite.geoLocName ?? '',
        latitude: selectedSite.latitude?.toString() ?? '',
        longitude: selectedSite.longitude?.toString() ?? '',
        amrResGenes: selectedSite.amrResGenes ?? '',
        predictedSir: selectedSite.predictedSir ?? '',
        sampleAnalysisType: selectedSite.sampleAnalysisType ?? '',
        isolateId: selectedSite.isolateId ?? '',
        organism: selectedSite.orgamism ?? '',
        sampleId: selectedSite.sampleId ?? '',
        collectedBy: selectedSite.collectedBy ?? '',
        sequenceName: selectedSite.sequenceName ?? '',
        elementType: selectedSite.elementType ?? '',
        class: selectedSite.class ?? '',
        subclass: selectedSite.subclass ?? '',
        targetLength: selectedSite.targetLength?.toString() ?? '',
        referenceLength: selectedSite.referenceLength?.toString() ?? '',
        coverage: selectedSite.coverage?.toString() ?? '',
        identity: selectedSite.identity?.toString() ?? '',
        alignmentLength: selectedSite.alignmentLength?.toString() ?? '',
        accession: selectedSite.accession ?? '',
        virtulenceGenes: selectedSite.virtulenceGenes ?? '',
        plasmidReplicons: selectedSite.plasmidReplicons ?? '',
        temperature: selectedSite.temperature?.toString() ?? '',
        ph: selectedSite.ph?.toString() ?? '',
        tds: selectedSite.tds?.toString() ?? '',
        ec: selectedSite.ec?.toString() ?? '',
        dissolvedO2: selectedSite.dissolvedO2?.toString() ?? '',
      });
    } else {
      setFormData(INITIAL_FORM_DATA);
    }
  }, [selectedSite, isOpen]);

  const handleClear = () => {
    setFormData(INITIAL_FORM_DATA);
  };

  const handleImportClick = (type: string) => {
    setShowImportDropdown(false);
    setAcceptType(type === 'TSV' ? '.tsv' : type === 'JSON' ? '.json' : '.csv');
    setTimeout(() => fileInputRef.current?.click(), 0);
  };

  const handleAction = async () => {
    const payload = {
      ...formData,
      collectionDate: new Date(formData.collectionDate),
      latitude: parseFloat(formData.latitude),
      longitude: parseFloat(formData.longitude),
      temperature: formData.temperature ? parseFloat(formData.temperature) : undefined,
      ph: formData.ph ? parseFloat(formData.ph) : undefined,
      tds: formData.tds ? parseFloat(formData.tds) : undefined,
      ec: formData.ec ? parseFloat(formData.ec) : undefined,
      dissolvedO2: formData.dissolvedO2 ? parseFloat(formData.dissolvedO2) : undefined,
      targetLength: formData.targetLength ? parseFloat(formData.targetLength) : undefined,
      referenceLength: formData.referenceLength ? parseFloat(formData.referenceLength) : undefined,
      coverage: formData.coverage ? parseFloat(formData.coverage) : undefined,
      identity: formData.identity ? parseFloat(formData.identity) : undefined,
      alignmentLength: formData.alignmentLength ? parseFloat(formData.alignmentLength) : undefined,
      orgamism: formData.organism || undefined,
    };

    const res = selectedSite?.id ? await updateSite(selectedSite.id, payload) : await addSiteData(payload);

    if (res.ok || res.status === 200 || res.status === 201) {
      toast.success(selectedSite?.id ? 'Site updated' : 'Site added');
      onRefresh();
      onClose();
    } else {
      toast.error('Operation failed');
    }
  };

  const handleAddFileData = async () => {
    if (!pendingFile) return;
    const res = await addMutlipleSiteData(pendingFile);
    if (res.ok || res.status === 200 || res.status === 201) {
      toast.success('Import successful');
      setPendingFile(null);
      onRefresh();
      onClose();
    } else {
      toast.error('Import failed');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        <ConfirmFile file={pendingFile} handleConfirm={handleAddFileData} handleCancel={() => setPendingFile(null)} />
        
        <div className="p-6 border-b border-border flex items-center justify-between bg-gray-50/50">
          <div>
            <h1 className="text-sm font-bold uppercase tracking-wider text-foreground">
              {selectedSite ? 'Edit Site Data' : 'Add New Sample'}
            </h1>
            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest mt-0.5">Matrix Management</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <section className="space-y-6">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-brand-600 border-b border-brand-100 pb-2">Core Identification</h2>
            <div className="space-y-4">
              <Input label="Sample Name" value={formData.sampleName} onChange={(v: string) => setFormData({...formData, sampleName: v})} required />
              <Input label="Isolation Source" value={formData.isolationSource} onChange={(v: string) => setFormData({...formData, isolationSource: v})} required />
              <Input label="Collection Date" placeholder="YYYY-MM-DD" value={formData.collectionDate} onChange={(v: string) => setFormData({...formData, collectionDate: v})} required />
              <Input label="Location Name" value={formData.geoLocName} onChange={(v: string) => setFormData({...formData, geoLocName: v})} required />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Latitude" value={formData.latitude} onChange={(v: string) => setFormData({...formData, latitude: v})} required />
                <Input label="Longitude" value={formData.longitude} onChange={(v: string) => setFormData({...formData, longitude: v})} required />
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-brand-600 border-b border-brand-100 pb-2">Physicochemical Data</h2>
            <div className="grid grid-cols-1 gap-4">
              <Input label="Temperature (°C)" value={formData.temperature} onChange={(v: string) => setFormData({...formData, temperature: v})} />
              <Input label="pH Level" value={formData.ph} onChange={(v: string) => setFormData({...formData, ph: v})} />
              <Input label="TDS (mg/L)" value={formData.tds} onChange={(v: string) => setFormData({...formData, tds: v})} />
              <Input label="EC (µS/cm)" value={formData.ec} onChange={(v: string) => setFormData({...formData, ec: v})} />
              <Input label="Dissolved O₂" value={formData.dissolvedO2} onChange={(v: string) => setFormData({...formData, dissolvedO2: v})} />
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-brand-600 border-b border-brand-100 pb-2">Genetic Profile</h2>
            <div className="space-y-4">
              <Input label="AMR Genes" value={formData.amrResGenes} onChange={(v: string) => setFormData({...formData, amrResGenes: v})} required />
              <Input label="Predicted SIR" value={formData.predictedSir} onChange={(v: string) => setFormData({...formData, predictedSir: v})} required />
              <Input label="Analysis Type" value={formData.sampleAnalysisType} onChange={(v: string) => setFormData({...formData, sampleAnalysisType: v})} required />
              <Input label="Organism" value={formData.organism} onChange={(v: string) => setFormData({...formData, organism: v})} />
            </div>
          </section>
        </div>

        <div className="p-6 bg-gray-50 border-t border-border flex flex-col md:flex-row gap-3">
          <div className="flex-1 flex gap-3">
            <button onClick={handleAction} className="flex-1 flex items-center justify-center gap-2 bg-brand-600 text-white py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-brand-700 transition-all shadow-subtle">
              <Check size={16} /> {selectedSite ? 'Update Matrix' : 'Record Sample'}
            </button>
            <button onClick={handleClear} className="px-6 flex items-center justify-center gap-2 bg-white border border-border text-gray-500 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-gray-100 transition-all shadow-subtle">
              <Eraser size={16} /> Clear
            </button>
          </div>
          
          <div className="relative">
            <input type="file" ref={fileInputRef} accept={acceptType} onChange={(e) => e.target.files?.[0] && setPendingFile(e.target.files[0])} className="hidden" />
            <button onClick={() => setShowImportDropdown(!showImportDropdown)} className="w-full md:w-40 flex items-center justify-center gap-2 bg-white border border-border text-foreground py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-gray-100 transition-all shadow-subtle">
              <Upload size={16} /> Bulk Import
            </button>
            {showImportDropdown && (
              <div className="absolute bottom-full right-0 mb-2 w-full bg-white border border-border rounded-xl shadow-xl overflow-hidden z-20">
                <ImportOpt label="CSV Format" icon={<FileText size={14}/>} onClick={() => handleImportClick('CSV')} />
                <ImportOpt label="TSV Format" icon={<FileText size={14}/>} onClick={() => handleImportClick('TSV')} />
                <ImportOpt label="JSON Format" icon={<FileJson size={14}/>} onClick={() => handleImportClick('JSON')} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, placeholder, required }: any) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
        {label} {required && <span className="text-risk-high">*</span>}
      </label>
      <input
        type="text"
        placeholder={placeholder || "Enter value..."}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500 transition-all placeholder:text-gray-300"
      />
    </div>
  );
}

function ImportOpt({ label, icon, onClick }: any) {
  return (
    <button onClick={onClick} className="flex items-center gap-2 w-full text-left px-4 py-3 text-[10px] font-bold text-gray-600 hover:bg-gray-50 transition-colors border-b border-border last:border-0 uppercase tracking-widest">
      {icon} {label}
    </button>
  );
}
