"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { SiteData } from "@/types/site_types";
import { parseLocationName, calculateWQI } from "@/utils/siteUtils";
import { getMe } from "@/app/services/authService";
import { getAllSites, addSiteData, addMutlipleSiteData, updateSite } from "@/app/services/siteService";
import {
  Trash2,
  Search,
  Calendar,
  ShieldAlert,
  Layers,
  Table,
  CheckSquare,
  Square,
  AlertOctagon,
  RefreshCw,
  X,
  Plus,
  Upload as UploadIcon,
  ArrowLeft,
  FlaskConical,
  Edit,
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
        toast.success(data.message || "Data purged successfully");
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
          <span className="ml-2 text-slate-500 font-semibold">Loading admin inventory...</span>
        </div>
      </main>
    );
  }

  if (showForm) {
    return (
      <main className="flex-1 overflow-auto p-6 bg-slate-50/50 flex flex-col gap-6">
        {/* Form Header with Back Button */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleClear}
            className="p-2 bg-white rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 shadow-sm transition-all"
            title="Go Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-indigo-950 tracking-tight flex items-center gap-2">
              <FlaskConical className="h-6 w-6 text-indigo-600" />
              {editingIsolate ? "Edit Isolate Record" : "Add New Isolate Sample"}
            </h1>
            <p className="text-sm text-gray-500 font-medium">
              {editingIsolate 
                ? `Modify details and water quality metrics for sample ${editingIsolate.sampleName}` 
                : "Create a new water sample record with diagnostic physical-chemical metrics and genetics profile"}
            </p>
          </div>
        </div>

        {/* Widescreen Detail Form Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-[1400px]">
          {/* Left Column: Image box and Profile fields */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 flex flex-col gap-4">
              {/* Sample Image Uploader Box */}
              <div className="rounded-2xl overflow-hidden h-48 bg-slate-100 border border-slate-200 border-dashed hover:bg-slate-200/50 transition-colors flex flex-col items-center justify-center text-slate-400 gap-2 cursor-pointer relative group">
                {imageBase64 ? (
                  <>
                    <img src={imageBase64} className="w-full h-full object-cover" alt="Preview" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">
                      Change Image
                    </div>
                  </>
                ) : (
                  <>
                    <UploadIcon className="h-8 w-8" />
                    <span className="text-xs font-bold uppercase tracking-wider">Upload Sample Image</span>
                  </>
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageChange} 
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                />
              </div>

              {/* Core Details */}
              <div className="flex flex-col gap-3">
                <h4 className="text-xs font-extrabold text-indigo-950 uppercase tracking-widest">Core Details</h4>
                <div className="flex flex-col gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Sample Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Apies River - Site A" 
                      value={formData.sampleName} 
                      onChange={(e) => setFormData({...formData, sampleName: e.target.value})} 
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 font-bold" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Isolation Source</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Surface Water" 
                      value={formData.isolationSource} 
                      onChange={(e) => setFormData({...formData, isolationSource: e.target.value})} 
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 font-medium" 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Collection Date</label>
                      <input 
                        type="date" 
                        value={formData.collectionDate} 
                        onChange={(e) => setFormData({...formData, collectionDate: e.target.value})} 
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 font-medium" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Location Name</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Site A" 
                        value={formData.geoLocName} 
                        onChange={(e) => setFormData({...formData, geoLocName: e.target.value})} 
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 font-medium" 
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Longitude</label>
                      <input 
                        type="number" 
                        step="any"
                        placeholder="e.g. 28.188" 
                        value={formData.longitude} 
                        onChange={(e) => setFormData({...formData, longitude: e.target.value})} 
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 font-medium" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Latitude</label>
                      <input 
                        type="number" 
                        step="any"
                        placeholder="e.g. -25.744" 
                        value={formData.latitude} 
                        onChange={(e) => setFormData({...formData, latitude: e.target.value})} 
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 font-medium" 
                      />
                    </div>
                  </div>
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* Isolate Details */}
              <div className="flex flex-col gap-3">
                <h4 className="text-xs font-extrabold text-indigo-950 uppercase tracking-widest">Isolate Profile</h4>
                <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Organism</label>
                    <input 
                      type="text" 
                      placeholder="e.g. E. coli" 
                      value={formData.organism} 
                      onChange={(e) => setFormData({...formData, organism: e.target.value})} 
                      className="w-full border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 font-bold italic" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Isolate ID</label>
                    <input 
                      type="text" 
                      placeholder="e.g. AR-01" 
                      value={formData.isolateId} 
                      onChange={(e) => setFormData({...formData, isolateId: e.target.value})} 
                      className="w-full border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 font-mono font-bold" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">SIR Prediction</label>
                    <select 
                      value={formData.predictedSir} 
                      onChange={(e) => setFormData({...formData, predictedSir: e.target.value})} 
                      className="w-full border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 font-bold"
                    >
                      <option value="">Select Profile</option>
                      <option value="Resistant (R)">Resistant (R)</option>
                      <option value="Intermediate (I)">Intermediate (I)</option>
                      <option value="Susceptible (S)">Susceptible (S)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Analysis Type</label>
                    <input 
                      type="text" 
                      placeholder="e.g. qPCR" 
                      value={formData.sampleAnalysisType} 
                      onChange={(e) => setFormData({...formData, sampleAnalysisType: e.target.value})} 
                      className="w-full border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 font-bold" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">AMR Resistance Genes</label>
                  <textarea 
                    placeholder="e.g. blaCTX-M-15, sul1, tet(A)" 
                    value={formData.amrResGenes} 
                    onChange={(e) => setFormData({...formData, amrResGenes: e.target.value})} 
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 font-mono font-bold h-20 resize-none" 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Columns: Metrics & Formula */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Water Quality Metric Card Grid */}
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="font-extrabold text-indigo-950 text-base">Diagnostic Water Quality Parameters</h3>
                  <p className="text-xs text-gray-500 font-medium">Individual physical-chemical measurements taken at site</p>
                </div>

                {/* Live Water Quality Score */}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Live Quality Score</span>
                  <span className={`px-3 py-1 rounded-2xl text-base font-black shadow-sm transition-all duration-200 ${
                    liveWqiScore === null 
                      ? "bg-slate-50 text-slate-400 border border-slate-200" 
                      : liveWqiScore >= 76
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : liveWqiScore >= 51
                      ? "bg-yellow-50 text-yellow-700 border border-yellow-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}>
                    {liveWqiScore === null ? "—" : `${liveWqiScore.toFixed(1)}%`}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-4 flex flex-col gap-1.5 shadow-sm hover:shadow transition-shadow">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">pH Level</span>
                  <input 
                    type="number" 
                    step="0.1" 
                    placeholder="7.0"
                    value={formData.ph} 
                    onChange={(e) => setFormData({...formData, ph: e.target.value})} 
                    className="w-full bg-white border border-blue-200 rounded-xl px-3 py-1.5 text-base font-black text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" 
                  />
                </div>
                <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-4 flex flex-col gap-1.5 shadow-sm hover:shadow transition-shadow">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Temperature (°C)</span>
                  <input 
                    type="number" 
                    step="0.1" 
                    placeholder="20.0"
                    value={formData.temperature} 
                    onChange={(e) => setFormData({...formData, temperature: e.target.value})} 
                    className="w-full bg-white border border-emerald-200 rounded-xl px-3 py-1.5 text-base font-black text-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" 
                  />
                </div>
                <div className="bg-orange-50/60 border border-orange-100 rounded-2xl p-4 flex flex-col gap-1.5 shadow-sm hover:shadow transition-shadow">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Dissolved O₂ (mg/L)</span>
                  <input 
                    type="number" 
                    step="0.01" 
                    placeholder="8.0"
                    value={formData.dissolvedO2} 
                    onChange={(e) => setFormData({...formData, dissolvedO2: e.target.value})} 
                    className="w-full bg-white border border-orange-200 rounded-xl px-3 py-1.5 text-base font-black text-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500" 
                  />
                </div>
                <div className="bg-purple-50/60 border border-purple-100 rounded-2xl p-4 flex flex-col gap-1.5 shadow-sm hover:shadow transition-shadow">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">TDS (mg/L)</span>
                  <input 
                    type="number" 
                    step="1" 
                    placeholder="150"
                    value={formData.tds} 
                    onChange={(e) => setFormData({...formData, tds: e.target.value})} 
                    className="w-full bg-white border border-purple-200 rounded-xl px-3 py-1.5 text-base font-black text-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500" 
                  />
                </div>
              </div>
              
              {/* Optional Water Metric */}
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col gap-1.5 shadow-sm hover:shadow transition-shadow col-span-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Water EC</span>
                  <input 
                    type="number" 
                    step="any" 
                    placeholder="e.g. 250"
                    value={formData.ec} 
                    onChange={(e) => setFormData({...formData, ec: e.target.value})} 
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-400" 
                  />
                </div>
              </div>
            </div>

            {/* Live Formula Breakdown */}
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6">
              <h3 className="font-extrabold text-indigo-950 text-base mb-4">Live Water Quality Index Formula Breakdown</h3>
              <WaterQualityFormula
                mode="site"
                ph={parseFloat(formData.ph) || undefined}
                temperature={parseFloat(formData.temperature) || undefined}
                dissolvedO2={parseFloat(formData.dissolvedO2) || undefined}
                tds={parseFloat(formData.tds) || undefined}
              />
            </div>

            {/* Submission actions */}
            <div className="flex gap-4 items-center justify-end mt-4">
              <button
                onClick={handleClear}
                className="px-6 py-3 border border-slate-200 bg-white hover:bg-slate-50 rounded-2xl font-black text-xs uppercase tracking-wider text-slate-600 transition-all shadow-sm"
              >
                Cancel & Return
              </button>
              <button
                onClick={editingIsolate ? handleUpdateSite : handleAddData}
                disabled={!formData.sampleName || !formData.geoLocName || !formData.collectionDate || loading}
                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-1.5"
              >
                {loading && <RefreshCw className="h-3 w-3 animate-spin" />}
                {editingIsolate ? "Save Changes" : "Submit New Isolate"}
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-auto p-6 bg-slate-50/50 flex flex-col gap-6">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-indigo-950 tracking-tight flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-red-600" />
            Administrative Data Management
          </h1>
          <p className="text-sm text-gray-500 font-medium">
            Ingest, import, edit, and perform secure bulk-purging of water sample isolates
          </p>
        </div>
        <div className="flex items-center gap-3 self-end sm:self-center relative">
          {/* Hidden file input */}
          <input 
            type="file" 
            ref={fileInputRef} 
            accept={acceptType}
            onChange={handleFileChange}
            className="hidden" 
          />

          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-sm transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Record
          </button>

          <button
            onClick={() => setShowImportDropdown(!showImportDropdown)}
            className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-black shadow-sm transition-all"
          >
            <UploadIcon className="h-3.5 w-3.5" />
            Import File
          </button>
          
          {showImportDropdown && (
            <div className="absolute top-full right-10 mt-1 w-32 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-20">
              <button 
                onClick={() => handleImportClick("CSV")}
                className="block w-full text-left px-4 py-2.5 text-xs text-slate-700 font-bold hover:bg-slate-50 transition-colors"
              >
                CSV (.csv)
              </button>
              <button 
                onClick={() => handleImportClick("TSV")}
                className="block w-full text-left px-4 py-2.5 text-xs text-slate-700 font-bold hover:bg-slate-50 transition-colors"
              >
                TSV (.tsv)
              </button>
              <button 
                onClick={() => handleImportClick("JSON")}
                className="block w-full text-left px-4 py-2.5 text-xs text-slate-700 font-bold hover:bg-slate-50 transition-colors"
              >
                JSON (.json)
              </button>
            </div>
          )}

          <button
            onClick={loadSitesData}
            className="p-2 bg-white rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 shadow-sm transition-all"
            title="Refresh Data"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Global Quick Action Purge Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-[1400px]">
        {/* Date Range Purge Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col gap-4 shadow-sm">
          <div>
            <h3 className="font-extrabold text-indigo-950 text-sm flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-indigo-600" />
              Delete by Date Range
            </h3>
            <p className="text-[11px] text-gray-400 font-semibold">Purge all records between specific collection dates</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase">Start Date</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase">End Date</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>
          <button
            onClick={() => setShowDeleteDateRangeModal(true)}
            disabled={!startDate && !endDate}
            className="flex items-center justify-center gap-1.5 w-full py-2 bg-red-50 hover:bg-red-100 disabled:opacity-40 disabled:hover:bg-red-50 text-red-700 rounded-xl text-xs font-black shadow-sm transition-all border border-red-200"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete Data in Range
          </button>
        </div>

        {/* Selected Data Purge Summary Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col gap-3 shadow-sm justify-between">
          <div>
            <h3 className="font-extrabold text-indigo-950 text-sm flex items-center gap-1.5">
              <CheckSquare className="h-4 w-4 text-indigo-600" />
              Purge Selected Checklist
            </h3>
            <p className="text-[11px] text-gray-400 font-semibold">Perform selective purging of multi-checked locations or samples</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs font-semibold text-slate-600">
              <span>Selected Locations:</span>
              <span className="font-black text-indigo-950">{selectedLocations.length}</span>
            </div>
            <div className="flex justify-between text-xs font-semibold text-slate-600">
              <span>Selected Samples:</span>
              <span className="font-black text-indigo-950">{selectedSampleIds.length}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowDeleteLocationsModal(true)}
              disabled={selectedLocations.length === 0}
              className="flex-1 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:hover:bg-red-600 text-white rounded-xl text-xs font-black shadow-sm transition-all"
            >
              Purge Locations ({selectedLocations.length})
            </button>
            <button
              onClick={() => setShowDeleteSamplesModal(true)}
              disabled={selectedSampleIds.length === 0}
              className="flex-1 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:hover:bg-red-600 text-white rounded-xl text-xs font-black shadow-sm transition-all"
            >
              Purge Samples ({selectedSampleIds.length})
            </button>
          </div>
        </div>

        {/* Master Database Wipe Card */}
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 flex flex-col justify-between shadow-sm">
          <div>
            <h3 className="font-extrabold text-rose-950 text-sm flex items-center gap-1.5">
              <AlertOctagon className="h-4 w-4 text-red-600" />
              Complete System Reset
            </h3>
            <p className="text-[11px] text-rose-600/80 font-bold mt-0.5">Danger zone: Permanently purge all water samples and isolates</p>
          </div>
          <button
            onClick={() => setShowDeleteAllModal(true)}
            className="flex items-center justify-center gap-1.5 w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black shadow-md hover:shadow-lg transition-all"
          >
            <AlertOctagon className="h-4 w-4" />
            Delete All Database Records
          </button>
        </div>
      </div>

      {/* Interactive Inventory Table with Tabs */}
      <div className="flex flex-col gap-4 max-w-[1400px]">
        {/* Tab switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 border border-slate-200/50 rounded-2xl self-start select-none">
          <button
            onClick={() => setActiveTab("location")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 ${
              activeTab === "location"
                ? "bg-white text-indigo-950 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            Locations Summary View
          </button>
          <button
            onClick={() => setActiveTab("sample")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 ${
              activeTab === "sample"
                ? "bg-white text-indigo-950 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Table className="h-3.5 w-3.5" />
            Isolates Detail List
          </button>
        </div>

        {/* Tab Panels */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 flex flex-col gap-4">
          {activeTab === "location" && (
            <>
              {/* Location controls */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
                <div>
                  <h3 className="font-extrabold text-indigo-950 text-base">Purge by Site Locations</h3>
                  <p className="text-xs text-gray-500">Purge all database samples collected at checked locations</p>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search locations..."
                    value={locationSearch}
                    onChange={(e) => setLocationSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-100 shadow-inner">
                <table className="min-w-full divide-y divide-slate-100">
                  <thead className="bg-slate-50/70 select-none">
                    <tr>
                      <th className="px-6 py-3.5 text-left w-12">
                        <button onClick={toggleAllLocations} className="text-slate-400 hover:text-indigo-600 transition-colors">
                          {selectedLocations.length === filteredLocations.length && filteredLocations.length > 0 ? (
                            <CheckSquare className="h-4.5 w-4.5 text-indigo-600" />
                          ) : (
                            <Square className="h-4.5 w-4.5" />
                          )}
                        </button>
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Location Name</th>
                      <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Coordinates</th>
                      <th className="px-6 py-3.5 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Samples Count</th>
                      <th className="px-6 py-3.5 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Latest Sampling Date</th>
                      <th className="px-6 py-3.5 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100 text-sm font-medium text-slate-700">
                    {filteredLocations.map((loc) => {
                      const isChecked = selectedLocations.includes(loc.name);
                      return (
                        <tr
                          key={loc.name}
                          onClick={() => toggleLocationSelection(loc.name)}
                          className={`hover:bg-slate-50/50 cursor-pointer transition-colors ${
                            isChecked ? "bg-indigo-50/20" : ""
                          }`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-slate-400">
                              {isChecked ? (
                                <CheckSquare className="h-4.5 w-4.5 text-indigo-600" />
                              ) : (
                                <Square className="h-4.5 w-4.5" />
                              )}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-800">{loc.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-slate-500">
                            {loc.latitude.toFixed(5)}, {loc.longitude.toFixed(5)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center font-bold">{loc.totalSamples}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-xs text-slate-500 font-medium">
                            {new Date(loc.latestCollectionDate).toLocaleDateString("en-ZA", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-xs">
                            <Link
                              href={`/statistics?location=${encodeURIComponent(loc.name)}&site=${loc.latestSiteId}`}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-800 rounded-xl text-xs font-extrabold transition-all shadow-sm"
                            >
                              View Stats
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeTab === "sample" && (
            <>
              {/* Sample controls */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
                <div>
                  <h3 className="font-extrabold text-indigo-950 text-base">Purge Individual Isolate Samples</h3>
                  <p className="text-xs text-gray-500">Purge specific record entries by multi-select checklists</p>
                </div>
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search organism, sample, genes..."
                    value={sampleSearch}
                    onChange={(e) => setSampleSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-100 shadow-inner">
                <table className="min-w-full divide-y divide-slate-100">
                  <thead className="bg-slate-50/70 select-none">
                    <tr>
                      <th className="px-6 py-3.5 text-left w-12">
                        <button onClick={toggleAllSamples} className="text-slate-400 hover:text-indigo-600 transition-colors">
                          {selectedSampleIds.length === filteredSamples.length && filteredSamples.length > 0 ? (
                            <CheckSquare className="h-4.5 w-4.5 text-indigo-600" />
                          ) : (
                            <Square className="h-4.5 w-4.5" />
                          )}
                        </button>
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Sample Name</th>
                      <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Organism</th>
                      <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Location</th>
                      <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Collection Date</th>
                      <th className="px-6 py-3.5 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Risk Zone</th>
                      <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">AMR Genes</th>
                      <th className="px-6 py-3.5 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100 text-sm font-medium text-slate-600">
                    {filteredSamples.map((s) => {
                      const isChecked = selectedSampleIds.includes(s.id!);
                      return (
                        <tr
                          key={s.id}
                          onClick={() => toggleSampleSelection(s.id!)}
                          className={`hover:bg-slate-50/50 cursor-pointer transition-colors ${
                            isChecked ? "bg-indigo-50/20" : ""
                          }`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-slate-400">
                              {isChecked ? (
                                <CheckSquare className="h-4.5 w-4.5 text-indigo-600" />
                              ) : (
                                <Square className="h-4.5 w-4.5" />
                              )}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-800">{s.sampleName}</td>
                          <td className="px-6 py-4 whitespace-nowrap italic">{s.orgamism || "—"}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{parseLocationName(s.geoLocName)}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {new Date(s.collectionDate).toLocaleDateString("en-ZA", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className={`inline-block px-2 py-0.5 rounded border text-[10px] font-extrabold capitalize ${
                              s.dangerZone === "red"
                                ? "bg-red-50 text-red-700 border-red-200"
                                : s.dangerZone === "yellow"
                                ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            }`}>
                              {s.dangerZone || "unknown"}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-mono text-xs truncate max-w-[150px]" title={s.amrResGenes}>
                            {s.amrResGenes || "—"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-xs">
                            <div className="flex justify-end items-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditClick(s);
                                }}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-extrabold transition-all shadow-sm"
                              >
                                <Edit className="h-3 w-3" />
                                Edit
                              </button>
                              <Link
                                href={`/statistics?site=${s.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-800 rounded-xl text-xs font-extrabold transition-all shadow-sm"
                              >
                                View Stats
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ========================================================== */}
      {/* SECURITY VERIFICATION CONFIRMATION MODALS                   */}
      {/* ========================================================== */}

      {/* Deletion confirmation overlays */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-4 border border-rose-100">
            <div className="flex justify-between items-center text-rose-950">
              <h3 className="font-extrabold text-base flex items-center gap-1.5">
                <AlertOctagon className="h-5 w-5 text-red-600" />
                Critical Database Reset
              </h3>
              <button onClick={() => setShowDeleteAllModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed font-semibold">
              Warning: This action will **permanently delete all water samples and isolates** from the database and purge all MinIO imagery. 
            </p>
            <p className="text-xs text-rose-600 font-black leading-relaxed">
              To proceed, please type <strong className="font-extrabold text-rose-800 bg-rose-50 px-1 py-0.5 rounded">DELETE ALL DATA</strong> in the verification input below:
            </p>
            <input
              type="text"
              value={confirmDeleteAllText}
              onChange={(e) => setConfirmDeleteAllText(e.target.value)}
              placeholder="Type verification text..."
              className="px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-bold"
            />
            <div className="flex gap-3 mt-2">
              <button
                onClick={() => setShowDeleteAllModal(false)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAll}
                disabled={confirmDeleteAllText !== "DELETE ALL DATA"}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white rounded-xl text-xs font-black transition-all shadow-sm"
              >
                Wipe All Data
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteDateRangeModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-indigo-950 text-base flex items-center gap-1.5">
                <Calendar className="h-5 w-5 text-indigo-600" />
                Date Range Deletion
              </h3>
              <button onClick={() => setShowDeleteDateRangeModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed font-semibold">
              Are you sure you want to delete all isolates collected:
              <strong className="text-slate-800 block mt-2">
                {startDate ? `From: ${new Date(startDate).toLocaleDateString()}` : ""}
                {endDate ? ` To: ${new Date(endDate).toLocaleDateString()}` : ""}
              </strong>
            </p>
            <div className="flex gap-3 mt-2">
              <button
                onClick={() => setShowDeleteDateRangeModal(false)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteDateRange}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black transition-all shadow-sm"
              >
                Confirm Purge
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteLocationsModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-indigo-950 text-base flex items-center gap-1.5">
                <Layers className="h-5 w-5 text-indigo-600" />
                Purge Locations
              </h3>
              <button onClick={() => setShowDeleteLocationsModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed font-semibold">
              Are you sure you want to delete all water samples and isolates collected at:
              <strong className="text-slate-800 block mt-2 max-h-24 overflow-y-auto font-bold border border-slate-50 p-2 rounded-lg bg-slate-50/50">
                {selectedLocations.join(", ")}
              </strong>
            </p>
            <div className="flex gap-3 mt-2">
              <button
                onClick={() => setShowDeleteLocationsModal(false)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteLocations}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black transition-all shadow-sm"
              >
                Purge Sites
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteSamplesModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-indigo-950 text-base flex items-center gap-1.5">
                <Table className="h-5 w-5 text-indigo-600" />
                Purge Checked Samples
              </h3>
              <button onClick={() => setShowDeleteSamplesModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed font-semibold">
              Are you sure you want to delete the <strong className="font-extrabold text-indigo-950">{selectedSampleIds.length}</strong> selected individual sample records?
            </p>
            <div className="flex gap-3 mt-2">
              <button
                onClick={() => setShowDeleteSamplesModal(false)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSamples}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black transition-all shadow-sm"
              >
                Purge Records
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Upload CSV/TSV/JSON Confirmation Modal */}
      <ConfirmFile
        file={pendingFile}
        handleConfirm={handleAddFileData}
        handleCancel={handleCancelFile}
      />
    </main>
  );
}
