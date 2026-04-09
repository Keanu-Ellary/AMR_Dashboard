"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { Upload } from "lucide-react";

export default function AnalyzePage() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    algae: string;
    detection: string;
    warningLevel: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setSelectedImage(imageUrl);
      setAnalysisResult(null); // reset analysis
    }
  };

  const handleAnalyze = () => {
    if (!selectedImage) return;
    setIsAnalyzing(true);
    // Simulate AI analysis API call
    setTimeout(() => {
      setIsAnalyzing(false);
      setAnalysisResult({ // mock
        algae: "Moderate",
        detection: "Cyanobacteria detected in central region",
        warningLevel: "Elevated"
      });
    }, 1500);
  };

  return (
    <div className="flex h-screen bg-[#1E1E1E] text-gray-900 font-sans p-4">
      <div className="flex w-full h-full bg-white rounded-2xl overflow-hidden shadow-xl">
        {/* Sidebar */}
        <aside className="w-64 border-r border-gray-100 flex flex-col p-4 bg-white">
          <div className="flex items-center gap-3 mb-8 px-2">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
              <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <Link href="/login" className="font-medium text-sm hover:underline">Admin</Link>
          </div>
          
          <div className="flex-1">
            <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">Dashboards</h3>
            <nav className="space-y-1">
              <Link href="/" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                Overview
              </Link>
              <Link href="/statistics" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                Statistics
              </Link>
              <Link href="/analyze" className="flex items-center gap-3 px-3 py-2 text-sm font-medium bg-gray-100 text-gray-900 rounded-md">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                Map View
              </Link>
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto flex relative bg-white">
          <div className="flex-1 p-8 flex flex-col">
           
            <div className="mb-8 mt-2">
              <Link href="/" className="inline-flex items-center justify-center bg-[#FF1A1A] text-white text-[13px] font-medium px-5 py-2 rounded-md hover:bg-red-700 transition-colors">
                Close
              </Link>
            </div>

            {/* image and analysis */}
            <div className="flex gap-10 max-w-5xl">
              {/* left image and button */}
              <div className="w-[380px] flex flex-col gap-6">
                <div 
                  className="w-full h-[500px] rounded-3xl overflow-hidden cursor-pointer relative bg-gray-50 flex flex-col items-center justify-center group"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {selectedImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={selectedImage} alt="Selected" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center text-gray-400 group-hover:text-gray-600 transition-colors flex flex-col items-center">
                      <Upload className="w-10 h-10 mb-3 text-gray-300 group-hover:text-gray-500 transition-colors" />
                      <span className="text-sm font-medium">Click to upload photo</span>
                    </div>
                  )}
                  {/* overlay to change image */}
                  {selectedImage && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-sm font-medium flex items-center gap-2">
                        <Upload className="w-4 h-4" /> Change Photo
                      </span>
                    </div>
                  )}
                </div>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  ref={fileInputRef} 
                  onChange={handleImageUpload}
                />

                <button 
                  onClick={handleAnalyze}
                  disabled={!selectedImage || isAnalyzing}
                  className="w-full py-3.5 bg-[#6B5AED] hover:bg-[#5A4AD1] disabled:bg-[#A399F5] text-white text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {isAnalyzing ? "Analyzing..." : "Analyze"}
                </button>
              </div>

              {/* ai results after analysis*/}
              <div className="flex-1">
                <div className="border border-gray-100 rounded-3xl p-8 h-[400px] flex flex-col bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
                  <h3 className="text-[13px] font-semibold text-gray-900 mb-6">AI Analysis:</h3>
                  {analysisResult ? (
                    <ul className="list-disc pl-5 space-y-3 text-[13px] text-gray-600 marker:text-gray-400">
                      <li>Potential algae: <span className="text-gray-900">{analysisResult.algae}</span></li>
                      <li>Area detection: <span className="text-gray-900">{analysisResult.detection}</span></li>
                      <li>Warning Level: <span className="text-gray-900">{analysisResult.warningLevel}</span></li>
                    </ul>
                  ) : (
                    <div className="text-[13px] text-gray-400 mt-2">
                      {isAnalyzing ? "Processing image data..." : (
                        <ul className="list-disc pl-5 space-y-3 marker:text-gray-200">
                          <li>Potential algae</li>
                          <li>Area detection</li>
                          <li>Warning Level</li>
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
