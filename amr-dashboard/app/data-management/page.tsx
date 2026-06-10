"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { SiteData } from "@/types/site_types";
import { parseLocationName, calculateWQI } from "@/utils/siteUtils";
import { getMe } from "@/app/services/authService";
import { getAllSites, addSiteData, addMutlipleSiteData, updateSite } from "@/app/services/siteService";
import {
  Search,
  RefreshCw,
  X,
  ArrowLeft,
  ChevronDown,
  Trash2,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  FilterX,
} from "lucide-react";
import ConfirmFile from "@/components/add-data/confirmFile";
import WaterQualityFormula from "@/components/WaterQualityFormula";
import { toast } from "react-toastify";

export default function DataManagementPage() {
  const router = useRouter();
  const [isAdminUser, setIsAdminUser] = useState<boolean | null>(null);
  const [sites, setSites] = useState<SiteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"location" | "sample">("location");

  // Form overlay and add/edit data state
  const [showForm, setShowForm] = useState(false);
  const [editingIsolate, setEditingIsolate] = useState<SiteData | null>(null);
  
  // File upload state
  const [showImportDropdown, setShowImportDropdown] = useState(false);
  const [showDeleteDropdown, setShowDeleteDropdown] = useState(false);
  const [acceptType, setAcceptType] = useState(".csv");
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  
  const [imageBase64, setImageBase64] = useState<string>("");

  const [formData, setFormData] = useState({
    // required
    sampleName: "",
    isolationSource: "",
    collectionDate: "",
    geoLocName: "",
    latitude: "",
    longitude: "",
    amrResGenes: "",
    predictedSir: "",
    sampleAnalysisType: "",

    // optional
    isolateId: "",
    organism: "",
    sampleId: "",
    collectedBy: "",
    sequenceName: "",
    elementType: "",
    class: "",
    subclass: "",
    targetLength: "",
    referenceLength: "",
    coverage: "",
    identity: "",
    alignmentLength: "",
    accession: "",
    virtulenceGenes: "",
    plasmidReplicons: "",

    // water params
    temperature: "",
    ph: "",
    tds: "",
    ec: "",
    dissolvedO2: "",
  });

  // Search & Filters
  const [locationSearch, setLocationSearch] = useState("");
  const [sampleSearch, setSampleSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Checkbox selections
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedSampleIds, setSelectedSampleIds] = useState<number[]>([]);

  // Pagination for Samples
  const [samplePage, setSamplePage] = useState(1);
  const samplesPerPage = 15;

  // Deletion modals
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [confirmDeleteAllText, setConfirmDeleteAllText] = useState("");
  const [showDeleteDateRangeModal, setShowDeleteDateRangeModal] = useState(false);
  const [showDeleteLocationsModal, setShowDeleteLocationsModal] = useState(false);
  const [showDeleteSamplesModal, setShowDeleteSamplesModal] = useState(false);

  // Authenticate Admin
  const checkAdmin = async () => {
    try {
      const user = await getMe();
      if (user?.isAdmin) {
        setIsAdminUser(true);
      } else {
        setIsAdminUser(false);
        toast.error("Access denied. Admin authorization required.");
        router.push("/home");
      }
    } catch (err) {
      setIsAdminUser(false);
      router.push("/home");
    }
  };

  const loadSitesData = async () => {
    setLoading(true);
    try {
      const response = await getAllSites();
      if (response.ok) {
        const json = await response.json();
        setSites(json.sites || []);
      }
    } catch (err) {
      toast.error("Failed to load inventory data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAdmin();
    loadSitesData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Compute Location statistics
  const locationGroups = useMemo(() => {
    const groups: Record<string, SiteData[]> = {};
    sites.forEach((site) => {
      const loc = parseLocationName(site.geoLocName);
      if (!groups[loc]) {
        groups[loc] = [];
      }
      groups[loc].push(site);
    });
    return groups;
  }, [sites]);

  const locationStats = useMemo(() => {
    return Object.entries(locationGroups).map(([name, groupSites]) => {
      const latestSite = [...groupSites].sort(
        (a, b) => new Date(b.collectionDate).getTime() - new Date(a.collectionDate).getTime()
      )[0];

      return {
        name,
        latitude: latestSite.latitude,
        longitude: latestSite.longitude,
        totalSamples: groupSites.length,
        latestCollectionDate: latestSite.collectionDate,
        latestSiteId: latestSite.id,
      };
    });
  }, [locationGroups]);

  // Filter Locations
  const filteredLocations = useMemo(() => {
    return locationStats.filter((loc) =>
      loc.name.toLowerCase().includes(locationSearch.toLowerCase())
    );
  }, [locationStats, locationSearch]);

  // Filter Samples
  const filteredSamples = useMemo(() => {
    return sites.filter((s) => {
      const lowerSearch = sampleSearch.toLowerCase();
      const matchesName = s.sampleName.toLowerCase().includes(lowerSearch);
      const matchesOrg = (s.orgamism ?? "").toLowerCase().includes(lowerSearch);
      const matchesLoc = s.geoLocName.toLowerCase().includes(lowerSearch);
      const matchesId = (s.isolateId ?? "").toLowerCase().includes(lowerSearch);
      return matchesName || matchesOrg || matchesLoc || matchesId;
    });
  }, [sites, sampleSearch]);

  // Paginated Samples
  const paginatedSamples = useMemo(() => {
    const start = (samplePage - 1) * samplesPerPage;
    return filteredSamples.slice(start, start + samplesPerPage);
  }, [filteredSamples, samplePage]);

  const totalSamplePages = Math.ceil(filteredSamples.length / samplesPerPage) || 1;

  // Bulk Delete API handler
  const executeBulkDelete = async (payload: {
    all?: boolean;
    locations?: string[];
    ids?: number[];
    startDate?: string;
    endDate?: string;
  }) => {
    setLoading(true);
    try {
      const res = await fetch("/api/site/bulk", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Data deleted successfully");
        setSelectedLocations([]);
        setSelectedSampleIds([]);
        loadSitesData();
      } else {
        toast.error(data.error || "Bulk deletion failed");
      }
    } catch (err) {
      toast.error("Network error during bulk deletion");
    } finally {
      setLoading(false);
    }
  };

  // Bulk deletion triggers
  const handleDeleteAll = () => {
    if (confirmDeleteAllText !== "DELETE ALL DATA") {
      toast.error("Confirmation text mismatch");
      return;
    }
    executeBulkDelete({ all: true });
    setShowDeleteAllModal(false);
    setConfirmDeleteAllText("");
  };

  const handleDeleteDateRange = () => {
    if (!startDate && !endDate) {
      toast.error("Please specify at least one date boundary");
      return;
    }
    executeBulkDelete({ startDate, endDate });
    setShowDeleteDateRangeModal(false);
    setStartDate("");
    setEndDate("");
  };

  const handleDeleteLocations = () => {
    if (selectedLocations.length === 0) return;
    executeBulkDelete({ locations: selectedLocations });
    setShowDeleteLocationsModal(false);
  };

  const handleDeleteSamples = () => {
    if (selectedSampleIds.length === 0) return;
    executeBulkDelete({ ids: selectedSampleIds });
    setShowDeleteSamplesModal(false);
  };

  // Multi-select handlers
  const toggleLocationSelection = (locName: string) => {
    setSelectedLocations((prev) =>
      prev.includes(locName) ? prev.filter((n) => n !== locName) : [...prev, locName]
    );
  };

  const toggleAllLocations = () => {
    if (selectedLocations.length === filteredLocations.length) {
      setSelectedLocations([]);
    } else {
      setSelectedLocations(filteredLocations.map((loc) => loc.name));
    }
  };

  const toggleSampleSelection = (id: number) => {
    setSelectedSampleIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleAllSamples = () => {
    if (selectedSampleIds.length === filteredSamples.length) {
      setSelectedSampleIds([]);
    } else {
      setSelectedSampleIds(
        filteredSamples.map((s) => s.id).filter((id): id is number => id !== undefined)
      );
    }
  };

  // Dynamic Live WQI Calculation
  const liveWqiScore = useMemo(() => {
    const phVal = parseFloat(formData.ph);
    const tempVal = parseFloat(formData.temperature);
    const doVal = parseFloat(formData.dissolvedO2);
    const tdsVal = parseFloat(formData.tds);

    if (isNaN(phVal) || isNaN(tempVal) || isNaN(doVal) || isNaN(tdsVal)) {
      return null;
    }

    return calculateWQI(doVal, phVal, tempVal, tdsVal);
  }, [formData.ph, formData.temperature, formData.dissolvedO2, formData.tds]);

  // Image base64 uploader conversion
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImageBase64(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  // Edit handler
  const handleEditClick = (site: SiteData) => {
    setEditingIsolate(site);
    setFormData({
      sampleName: site.sampleName ?? "",
      isolationSource: site.isolationSource ?? "",
      collectionDate: site.collectionDate ? new Date(site.collectionDate).toISOString().split("T")[0] : "",
      geoLocName: site.geoLocName ?? "",
      latitude: site.latitude?.toString() ?? "",
      longitude: site.longitude?.toString() ?? "",
      amrResGenes: site.amrResGenes ?? "",
      predictedSir: site.predictedSir ?? "",
      sampleAnalysisType: site.sampleAnalysisType ?? "",

      isolateId: site.isolateId ?? "",
      organism: site.orgamism ?? "",
      sampleId: site.sampleId ?? "",
      collectedBy: site.collectedBy ?? "",
      sequenceName: site.sequenceName ?? "",
      elementType: site.elementType ?? "",
      class: site.class ?? "",
      subclass: site.subclass ?? "",
      targetLength: site.targetLength?.toString() ?? "",
      referenceLength: site.referenceLength?.toString() ?? "",
      coverage: site.coverage?.toString() ?? "",
      identity: site.identity?.toString() ?? "",
      alignmentLength: site.alignmentLength?.toString() ?? "",
      accession: site.accession ?? "",
      virtulenceGenes: site.virtulenceGenes ?? "",
      plasmidReplicons: site.plasmidReplicons ?? "",
      
      temperature: site.temperature?.toString() ?? "",
      ph: site.ph?.toString() ?? "",
      tds: site.tds?.toString() ?? "",
      ec: site.ec?.toString() ?? "",
      dissolvedO2: site.dissolvedO2?.toString() ?? "",
    });

    const latestBatchImage = site.imageBatches?.[0]?.images?.[0]?.url;
    const latestImage = latestBatchImage || site.images?.[site.images.length - 1]?.url;
    if (latestImage) {
      setImageBase64(`/api/image?url=${encodeURIComponent(latestImage)}`);
    } else if (site.imageBase64) {
      setImageBase64(site.imageBase64);
    } else {
      setImageBase64("");
    }
    
    setShowForm(true);
  };

  // Form Submit Action (Add)
  const handleAddData = async () => {
    setLoading(true);
    try {
      const response = await addSiteData({
        sampleName: formData.sampleName,
        isolationSource: formData.isolationSource,
        collectionDate: new Date(formData.collectionDate),
        geoLocName: formData.geoLocName,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        amrResGenes: formData.amrResGenes,
        predictedSir: formData.predictedSir,
        sampleAnalysisType: formData.sampleAnalysisType,

        temperature: formData.temperature ? parseFloat(formData.temperature) : undefined,
        ph: formData.ph ? parseFloat(formData.ph) : undefined,
        tds: formData.tds ? parseFloat(formData.tds) : undefined,
        ec: formData.ec ? parseFloat(formData.ec) : undefined,
        dissolvedO2: formData.dissolvedO2 ? parseFloat(formData.dissolvedO2) : undefined,

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
        imageBase64: imageBase64.startsWith("data:image/") ? imageBase64 : undefined,
      });

      if (response.status === 200 || response.status === 201) {
        toast.success("Site data added successfully!");
        handleClear();
        loadSitesData();
      } else {
        toast.error("Failed to add site data. Please try again.");
      }
    } catch (err) {
      toast.error("Error submitting site data");
    } finally {
      setLoading(false);
    }
  };

  // Form Save Action (Edit)
  const handleUpdateSite = async () => {
    if (!editingIsolate || !editingIsolate.id) return;
    setLoading(true);
    try {
      const response = await updateSite(editingIsolate.id, {
        sampleName: formData.sampleName,
        isolationSource: formData.isolationSource,
        collectionDate: new Date(formData.collectionDate),
        geoLocName: formData.geoLocName,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        amrResGenes: formData.amrResGenes,
        predictedSir: formData.predictedSir,
        sampleAnalysisType: formData.sampleAnalysisType,

        temperature: formData.temperature ? parseFloat(formData.temperature) : undefined,
        ph: formData.ph ? parseFloat(formData.ph) : undefined,
        tds: formData.tds ? parseFloat(formData.tds) : undefined,
        ec: formData.ec ? parseFloat(formData.ec) : undefined,
        dissolvedO2: formData.dissolvedO2 ? parseFloat(formData.dissolvedO2) : undefined,

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
        imageBase64: imageBase64.startsWith("data:image/") ? imageBase64 : undefined,
      });

      if (response.ok) {
        toast.success("Isolate record updated successfully!");
        handleClear();
        loadSitesData();
      } else {
        toast.error("Failed to update isolate record.");
      }
    } catch (err) {
      toast.error("Error updating isolate record");
    } finally {
      setLoading(false);
    }
  };

  // Bulk Ingestion File handlers
  const handleImportClick = (type: string) => {
    setShowImportDropdown(false);
    let accept = ".csv";
    if (type === "TSV") accept = ".tsv";
    if (type === "JSON") accept = ".json";
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

  const handleAddFileData = async () => {
    if (!pendingFile) {
      toast.error("No file selected.");
      return;
    }
    setLoading(true);
    setPendingFile(null);
    try {
      if (fileInputRef.current?.files?.[0]) {
        const file = fileInputRef.current.files[0];
        const response = await addMutlipleSiteData(file);

        if (response.status === 200 || response.status === 201) {
          toast.success("Bulk data imported successfully!");
          handleClear();
          loadSitesData();
        } else {
          toast.error("Failed to import bulk file data.");
        }
      }
    } catch (err) {
      toast.error("Error importing file data");
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleCancelFile = () => {
    setPendingFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClear = () => {
    setEditingIsolate(null);
    setShowForm(false);
    setImageBase64("");
    setFormData({
      sampleName: "",
      isolationSource: "",
      collectionDate: "",
      geoLocName: "",
      latitude: "",
      longitude: "",
      amrResGenes: "",
      predictedSir: "",
      sampleAnalysisType: "",

      isolateId: "",
      organism: "",
      sampleId: "",
      collectedBy: "",
      sequenceName: "",
      elementType: "",
      class: "",
      subclass: "",
      targetLength: "",
      referenceLength: "",
      coverage: "",
      identity: "",
      alignmentLength: "",
      accession: "",
      virtulenceGenes: "",
      plasmidReplicons: "",

      temperature: "",
      ph: "",
      tds: "",
      ec: "",
      dissolvedO2: "",
    });
  };

  if (isAdminUser === null || loading) {
    return (
      <main className="flex-1 overflow-auto p-6 bg-slate-50/50">
        <div className="flex items-center justify-center h-96">
          <RefreshCw className="h-6 w-6 text-indigo-600 animate-spin" />
          <span className="ml-2 text-slate-500 font-semibold uppercase text-[10px] tracking-widest">Loading Records...</span>
        </div>
      </main>
    );
  }

  if (showForm) {
    return (
      <main className="flex-1 overflow-auto p-6 bg-slate-50/50 flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <button
            onClick={handleClear}
            className="p-2 bg-white rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 shadow-sm transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-indigo-950 tracking-tight">
              {editingIsolate ? "Edit Isolate Record" : "Add New Isolate Sample"}
            </h1>
            <p className="text-sm text-slate-500 font-medium">
              {editingIsolate 
                ? `Modify details and water quality metrics for sample ${editingIsolate.sampleName}` 
                : "Create a new water sample record with diagnostic physical-chemical metrics"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-[1400px]">
          <div className="lg:col-span-1 flex flex-col gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col gap-4">
              <div className="rounded-xl overflow-hidden h-48 bg-slate-50 border border-slate-200 border-dashed hover:bg-slate-100 transition-colors flex flex-col items-center justify-center text-slate-400 gap-2 cursor-pointer relative group">
                {imageBase64 ? (
                  <>
                    <img src={imageBase64} className="w-full h-full object-cover" alt="Preview" />
                    <div className="absolute inset-0 bg-indigo-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-black uppercase tracking-wider">
                      Change Image
                    </div>
                  </>
                ) : (
                  <span className="text-[10px] font-black uppercase tracking-widest">Upload Sample Image</span>
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageChange} 
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                />
              </div>

              <div className="flex flex-col gap-3">
                <h4 className="text-[10px] font-black text-indigo-950 uppercase tracking-widest">Core Details</h4>
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Sample Name</label>
                    <input 
                      type="text" 
                      placeholder="Apies River - Site A" 
                      value={formData.sampleName} 
                      onChange={(e) => setFormData({...formData, sampleName: e.target.value})} 
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-indigo-950 font-black" 
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Isolation Source</label>
                    <input 
                      type="text" 
                      placeholder="Surface Water" 
                      value={formData.isolationSource} 
                      onChange={(e) => setFormData({...formData, isolationSource: e.target.value})} 
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700 font-bold" 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Collection Date</label>
                      <input 
                        type="date" 
                        value={formData.collectionDate} 
                        onChange={(e) => setFormData({...formData, collectionDate: e.target.value})} 
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700 font-bold" 
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Location Name</label>
                      <input 
                        type="text" 
                        placeholder="Site A" 
                        value={formData.geoLocName} 
                        onChange={(e) => setFormData({...formData, geoLocName: e.target.value})} 
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700 font-bold" 
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Longitude</label>
                      <input 
                        type="number" 
                        step="any"
                        placeholder="28.188" 
                        value={formData.longitude} 
                        onChange={(e) => setFormData({...formData, longitude: e.target.value})} 
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700 font-bold" 
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Latitude</label>
                      <input 
                        type="number" 
                        step="any"
                        placeholder="-25.744" 
                        value={formData.latitude} 
                        onChange={(e) => setFormData({...formData, latitude: e.target.value})} 
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700 font-bold" 
                      />
                    </div>
                  </div>
                </div>
              </div>

              <hr className="border-slate-100" />

              <div className="flex flex-col gap-3">
                <h4 className="text-[10px] font-black text-indigo-950 uppercase tracking-widest">Isolate Profile</h4>
                <div className="grid grid-cols-2 gap-3 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Organism</label>
                    <input 
                      type="text" 
                      placeholder="E. coli" 
                      value={formData.organism} 
                      onChange={(e) => setFormData({...formData, organism: e.target.value})} 
                      className="w-full border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-indigo-950 font-black italic" 
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Isolate ID</label>
                    <input 
                      type="text" 
                      placeholder="AR-01" 
                      value={formData.isolateId} 
                      onChange={(e) => setFormData({...formData, isolateId: e.target.value})} 
                      className="w-full border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-indigo-950 font-mono font-bold" 
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">SIR Prediction</label>
                    <select 
                      value={formData.predictedSir} 
                      onChange={(e) => setFormData({...formData, predictedSir: e.target.value})} 
                      className="w-full border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-indigo-950 font-black"
                    >
                      <option value="">Select Profile</option>
                      <option value="Resistant (R)">Resistant (R)</option>
                      <option value="Intermediate (I)">Intermediate (I)</option>
                      <option value="Susceptible (S)">Susceptible (S)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Analysis Type</label>
                    <input 
                      type="text" 
                      placeholder="qPCR" 
                      value={formData.sampleAnalysisType} 
                      onChange={(e) => setFormData({...formData, sampleAnalysisType: e.target.value})} 
                      className="w-full border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-indigo-950 font-black" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">AMR Resistance Genes</label>
                  <textarea 
                    placeholder="blaCTX-M-15, sul1, tet(A)" 
                    value={formData.amrResGenes} 
                    onChange={(e) => setFormData({...formData, amrResGenes: e.target.value})} 
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-indigo-950 font-mono font-bold h-20 resize-none" 
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="font-black text-indigo-950 text-base">Water Quality Parameters</h3>
                  <p className="text-xs text-slate-500 font-medium">Physical-chemical measurements taken at site</p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">WQI Score</span>
                  <span className={`px-3 py-1 rounded-xl text-base font-black border shadow-sm transition-all duration-200 ${
                    liveWqiScore === null 
                      ? "bg-slate-50 text-slate-400 border-slate-200" 
                      : liveWqiScore >= 76
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-500/10"
                      : liveWqiScore >= 51
                      ? "bg-yellow-50 text-yellow-700 border-yellow-200 ring-1 ring-yellow-500/10"
                      : liveWqiScore >= 26
                      ? "bg-orange-50 text-orange-700 border-orange-200 ring-1 ring-orange-500/10"
                      : "bg-red-50 text-red-700 border-red-200 ring-1 ring-red-500/10"
                  }`}>
                    {liveWqiScore === null ? "—" : `${liveWqiScore.toFixed(1)}%`}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-2 shadow-sm">
                  <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">pH Level</span>
                  <input 
                    type="number" 
                    step="0.1" 
                    placeholder="7.0"
                    value={formData.ph} 
                    onChange={(e) => setFormData({...formData, ph: e.target.value})} 
                    className="w-full border-b border-slate-200 px-0 py-1 text-lg font-black text-indigo-950 focus:outline-none focus:border-indigo-500" 
                  />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-2 shadow-sm">
                  <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Temp (°C)</span>
                  <input 
                    type="number" 
                    step="0.1" 
                    placeholder="20.0"
                    value={formData.temperature} 
                    onChange={(e) => setFormData({...formData, temperature: e.target.value})} 
                    className="w-full border-b border-slate-200 px-0 py-1 text-lg font-black text-indigo-950 focus:outline-none focus:border-indigo-500" 
                  />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-2 shadow-sm">
                  <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Dissolved O₂</span>
                  <input 
                    type="number" 
                    step="0.01" 
                    placeholder="8.0"
                    value={formData.dissolvedO2} 
                    onChange={(e) => setFormData({...formData, dissolvedO2: e.target.value})} 
                    className="w-full border-b border-slate-200 px-0 py-1 text-lg font-black text-indigo-950 focus:outline-none focus:border-indigo-500" 
                  />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-2 shadow-sm">
                  <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">TDS (mg/L)</span>
                  <input 
                    type="number" 
                    step="1" 
                    placeholder="150"
                    value={formData.tds} 
                    onChange={(e) => setFormData({...formData, tds: e.target.value})} 
                    className="w-full border-b border-slate-200 px-0 py-1 text-lg font-black text-indigo-950 focus:outline-none focus:border-indigo-500" 
                  />
                </div>
              </div>
              
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-2 shadow-sm">
                  <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Water EC</span>
                  <input 
                    type="number" 
                    step="any" 
                    placeholder="250"
                    value={formData.ec} 
                    onChange={(e) => setFormData({...formData, ec: e.target.value})} 
                    className="w-full border-b border-slate-200 px-0 py-1 text-base font-black text-indigo-950 focus:outline-none focus:border-indigo-500" 
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="font-black text-indigo-950 text-base mb-4 uppercase tracking-widest text-[10px]">WQI Formula Breakdown</h3>
              <WaterQualityFormula
                mode="site"
                ph={parseFloat(formData.ph) || undefined}
                temperature={parseFloat(formData.temperature) || undefined}
                dissolvedO2={parseFloat(formData.dissolvedO2) || undefined}
                tds={parseFloat(formData.tds) || undefined}
              />
            </div>

            <div className="flex gap-3 items-center justify-end mt-4">
              <button
                onClick={handleClear}
                className="px-6 py-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 transition-all shadow-sm"
              >
                Cancel
              </button>
              <button
                onClick={editingIsolate ? handleUpdateSite : handleAddData}
                disabled={!formData.sampleName || !formData.geoLocName || !formData.collectionDate || loading}
                className="px-8 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-30 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm flex items-center justify-center gap-2"
              >
                {loading && <RefreshCw className="h-3 w-3 animate-spin" />}
                {editingIsolate ? "Save Changes" : "Submit Record"}
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-auto p-6 bg-slate-50/50 flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-indigo-950 tracking-tight">Administrative Data Management</h1>
          <p className="text-sm text-slate-500 font-medium">Ingest, edit, and perform secure purging of sample isolates</p>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-center relative">
          <input 
            type="file" 
            ref={fileInputRef} 
            accept={acceptType}
            onChange={handleFileChange}
            className="hidden" 
          />

          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm transition-all"
          >
            Add Record
          </button>

          <button
            onClick={() => setShowImportDropdown(!showImportDropdown)}
            onBlur={() => setTimeout(() => setShowImportDropdown(false), 200)}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm transition-all flex items-center gap-1.5"
          >
            Import File
            <ChevronDown className="h-3 w-3" />
          </button>
          
          {showImportDropdown && (
            <div className="absolute top-full right-[100px] mt-1 w-32 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-20">
              {["CSV", "TSV", "JSON"].map((type) => (
                <button 
                  key={type}
                  onClick={() => handleImportClick(type)}
                  className="block w-full text-left px-4 py-2.5 text-[10px] text-indigo-950 font-black hover:bg-slate-50 transition-colors uppercase"
                >
                  {type} (.{type.toLowerCase()})
                </button>
              ))}
            </div>
          )}

          <div className="relative">
            <button
              onClick={() => setShowDeleteDropdown(!showDeleteDropdown)}
              onBlur={() => setTimeout(() => setShowDeleteDropdown(false), 200)}
              className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm transition-all flex items-center gap-1.5"
            >
              Delete
              <ChevronDown className="h-3 w-3" />
            </button>
            {showDeleteDropdown && (
              <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-20">
                <button
                  onClick={() => setShowDeleteDateRangeModal(true)}
                  className="block w-full text-left px-4 py-2.5 text-[10px] text-indigo-950 font-black hover:bg-slate-50 transition-colors uppercase border-b border-slate-50"
                >
                  By Date Range
                </button>
                <button
                  onClick={() => setShowDeleteLocationsModal(true)}
                  disabled={selectedLocations.length === 0}
                  className="block w-full text-left px-4 py-2.5 text-[10px] text-indigo-950 font-black hover:bg-slate-50 transition-colors uppercase border-b border-slate-50 disabled:opacity-30"
                >
                  By Selected Locations ({selectedLocations.length})
                </button>
                <button
                  onClick={() => setShowDeleteSamplesModal(true)}
                  disabled={selectedSampleIds.length === 0}
                  className="block w-full text-left px-4 py-2.5 text-[10px] text-indigo-950 font-black hover:bg-slate-50 transition-colors uppercase border-b border-slate-50 disabled:opacity-30"
                >
                  By Selected Samples ({selectedSampleIds.length})
                </button>
                <button
                  onClick={() => setShowDeleteAllModal(true)}
                  className="block w-full text-left px-4 py-2.5 text-[10px] text-rose-600 font-black hover:bg-rose-50 transition-colors uppercase"
                >
                  System Reset (All)
                </button>
              </div>
            )}
          </div>

          <button
            onClick={loadSitesData}
            className="p-2 bg-white rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 shadow-sm transition-all"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4 max-w-[1400px]">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 border border-slate-200/50 rounded-2xl self-start select-none">
          <button
            onClick={() => setActiveTab("location")}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-200 ${
              activeTab === "location"
                ? "bg-white text-indigo-950 shadow-sm"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            Locations Summary
          </button>
          <button
            onClick={() => setActiveTab("sample")}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-200 ${
              activeTab === "sample"
                ? "bg-white text-indigo-950 shadow-sm"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            Isolates Detail
          </button>
        </div>

        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 flex flex-col gap-4 overflow-hidden">
          {activeTab === "location" && (
            <>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
                <div>
                  <h3 className="font-extrabold text-indigo-950 text-lg">Manage Site Locations</h3>
                  <p className="text-xs text-slate-500">Select locations to perform bulk delete operations</p>
                </div>
                <div className="relative w-full sm:w-64 group">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  <input
                    type="text"
                    placeholder="Search locations..."
                    value={locationSearch}
                    onChange={(e) => setLocationSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              <div className="flex-1 min-h-0 overflow-hidden rounded-2xl border border-slate-100 shadow-inner flex flex-col">
                <div className="overflow-auto flex-1">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead className="sticky top-0 z-10 select-none">
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-4 py-3 text-left w-12">
                          <input
                            type="checkbox"
                            checked={selectedLocations.length === filteredLocations.length && filteredLocations.length > 0}
                            onChange={toggleAllLocations}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Location Name</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Coordinates</th>
                        <th className="px-3 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Samples</th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Latest Date</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                      {filteredLocations.map((loc) => {
                        const isChecked = selectedLocations.includes(loc.name);
                        return (
                          <tr
                            key={loc.name}
                            onClick={() => toggleLocationSelection(loc.name)}
                            className={`hover:bg-slate-50/50 transition-colors cursor-pointer ${
                              isChecked ? "bg-indigo-50/20" : ""
                            }`}
                          >
                            <td className="px-4 py-3 whitespace-nowrap">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {}}
                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                              />
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-slate-800">{loc.name}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500 font-mono font-medium">
                              {loc.latitude.toFixed(5)}, {loc.longitude.toFixed(5)}
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap text-center text-sm font-medium text-slate-600">{loc.totalSamples}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-slate-500 font-medium">
                              {new Date(loc.latestCollectionDate).toLocaleDateString("en-ZA", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {activeTab === "sample" && (
            <>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
                <div>
                  <h3 className="font-extrabold text-indigo-950 text-lg">Manage Individual Isolate Samples</h3>
                  <p className="text-xs text-slate-500">Select specific records to edit or delete</p>
                </div>
                <div className="relative w-full sm:w-80 group">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  <input
                    type="text"
                    placeholder="Search records..."
                    value={sampleSearch}
                    onChange={(e) => {
                      setSampleSearch(e.target.value);
                      setSamplePage(1);
                    }}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              <div className="flex-1 min-h-0 overflow-hidden rounded-2xl border border-slate-100 shadow-inner flex flex-col">
                <div className="overflow-auto flex-1">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead className="sticky top-0 z-10 select-none">
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-4 py-3 text-left w-12">
                          <input
                            type="checkbox"
                            checked={selectedSampleIds.length === filteredSamples.length && filteredSamples.length > 0}
                            onChange={toggleAllSamples}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Sample Name</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Organism</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Location</th>
                        <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Risk</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">AMR Genes</th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                      {paginatedSamples.map((s) => {
                        const isChecked = selectedSampleIds.includes(s.id!);
                        const risk = s.dangerZone?.toLowerCase();
                        const riskLabel = risk === 'red' ? 'High' : risk === 'yellow' ? 'Moderate' : 'Low';
                        return (
                          <tr
                            key={s.id}
                            onClick={() => toggleSampleSelection(s.id!)}
                            className={`hover:bg-slate-50/50 transition-colors cursor-pointer ${
                              isChecked ? "bg-indigo-50/20" : ""
                            }`}
                          >
                            <td className="px-4 py-3 whitespace-nowrap">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {}}
                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                              />
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-slate-800">{s.sampleName}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm italic text-slate-600 font-medium">{s.orgamism || "—"}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 font-medium">{parseLocationName(s.geoLocName)}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-slate-500 font-medium">
                              {new Date(s.collectionDate).toLocaleDateString("en-ZA", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </td>
                            <td className={`px-4 py-3 whitespace-nowrap text-center text-sm font-extrabold capitalize ${
                              risk === 'red' ? 'text-red-600' :
                              risk === 'yellow' ? 'text-yellow-600' :
                              'text-slate-800'
                            }`}>
                              {riskLabel}
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-500 font-mono truncate max-w-[120px]" title={s.amrResGenes}>
                              {s.amrResGenes || "—"}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-right">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditClick(s);
                                }}
                                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-extrabold transition-all shadow-sm"
                              >
                                Edit
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredSamples.length === 0 && (
                        <tr>
                          <td colSpan={8} className="px-6 py-12 text-center text-slate-400 text-sm">
                            <FilterX className="h-8 w-8 mx-auto mb-2 opacity-50 text-slate-400" />
                            No sample records match active filters or search terms.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination Footer for Samples */}
              {filteredSamples.length > 0 && (
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 flex-shrink-0 select-none">
                  <span className="text-xs text-slate-500 font-medium">
                    Showing <strong className="text-slate-800">{(samplePage - 1) * samplesPerPage + 1}</strong> to{" "}
                    <strong className="text-slate-800">
                      {Math.min(samplePage * samplesPerPage, filteredSamples.length)}
                    </strong>{" "}
                    of <strong className="text-slate-800">{filteredSamples.length}</strong> records
                  </span>

                  <div className="flex gap-1">
                    <button
                      onClick={() => setSamplePage((p) => Math.max(p - 1, 1))}
                      disabled={samplePage === 1}
                      className="p-1.5 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    {Array.from({ length: totalSamplePages }, (_, i) => i + 1)
                      .filter((p) => Math.abs(p - samplePage) <= 2 || p === 1 || p === totalSamplePages)
                      .map((p, index, arr) => {
                        const isGap = index > 0 && p - arr[index - 1] > 1;
                        return (
                          <React.Fragment key={p}>
                            {isGap && <span className="px-2 text-slate-400">...</span>}
                            <button
                              onClick={() => setSamplePage(p)}
                              className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-all ${
                                samplePage === p
                                  ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
                              }`}
                            >
                              {p}
                            </button>
                          </React.Fragment>
                        );
                      })}
                    <button
                      onClick={() => setSamplePage((p) => Math.min(p + 1, totalSamplePages))}
                      disabled={samplePage === totalSamplePages}
                      className="p-1.5 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {showDeleteAllModal && (
        <div className="fixed inset-0 bg-indigo-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-md w-full shadow-2xl flex flex-col gap-4 border border-rose-100">
            <h3 className="font-black text-base text-rose-950 uppercase tracking-widest">Critical Database Reset</h3>
            <p className="text-xs text-slate-500 font-medium">
              This action will **permanently delete all water samples and isolates** from the database. 
            </p>
            <p className="text-[10px] text-rose-600 font-black uppercase tracking-widest">
              Type <strong className="text-rose-800 bg-rose-50 px-1 py-0.5 rounded">DELETE ALL DATA</strong> to proceed:
            </p>
            <input
              type="text"
              value={confirmDeleteAllText}
              onChange={(e) => setConfirmDeleteAllText(e.target.value)}
              placeholder="Verification text..."
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-rose-500 font-black text-rose-900"
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => setShowDeleteAllModal(false)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAll}
                disabled={confirmDeleteAllText !== "DELETE ALL DATA"}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-30 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm"
              >
                Confirm Wipe
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteDateRangeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-xs w-full shadow-2xl flex flex-col gap-4 border border-slate-100">
            <div>
              <h3 className="font-black text-indigo-950 text-sm uppercase tracking-widest">Delete by Date Range</h3>
              <p className="text-[10px] text-slate-500 font-medium">Select a range to delete isolate records</p>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-black text-slate-400 uppercase">Start Date</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs text-indigo-950 font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full"
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-black text-slate-400 uppercase">End Date</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs text-indigo-950 font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-2">
              <button
                onClick={() => setShowDeleteDateRangeModal(false)}
                className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteDateRange}
                disabled={!startDate && !endDate}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-30 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm"
              >
                Delete Data
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteLocationsModal && (
        <div className="fixed inset-0 bg-indigo-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-sm w-full shadow-2xl flex flex-col gap-4">
            <h3 className="font-black text-indigo-950 text-base uppercase tracking-widest">Delete Locations</h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Confirm deletion of samples at:
              <strong className="text-indigo-950 block mt-1 max-h-24 overflow-y-auto font-black border border-slate-50 p-2 rounded-lg bg-slate-50">
                {selectedLocations.join(", ")}
              </strong>
            </p>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => setShowDeleteLocationsModal(false)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteLocations}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm"
              >
                Delete Sites
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteSamplesModal && (
        <div className="fixed inset-0 bg-indigo-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-sm w-full shadow-2xl flex flex-col gap-4">
            <h3 className="font-black text-indigo-950 text-base uppercase tracking-widest">Delete Samples</h3>
            <p className="text-xs text-slate-500 font-medium">
              Delete the <strong className="font-black text-indigo-950">{selectedSampleIds.length}</strong> selected individual sample records?
            </p>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => setShowDeleteSamplesModal(false)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSamples}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm"
              >
                Delete Records
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmFile
        file={pendingFile}
        handleConfirm={handleAddFileData}
        handleCancel={handleCancelFile}
      />
    </main>
  );
}
