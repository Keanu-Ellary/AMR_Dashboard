"use client";

import { useState } from "react";
import { Search, Loader2, AlertCircle, CheckCircle2, ShieldAlert } from "lucide-react";
import clsx from "clsx";

export default function AnalyzePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{
    detected: boolean;
    probability: number;
    boxes: number[][];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setError(null);
    }
  };

  const handleProcessImage = async () => {
    if (!selectedFile) return;
    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(selectedFile);
      reader.onload = async () => {
        const base64String = (reader.result as string).split(",")[1];
        try {
          const response = await fetch("/api/algae", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: base64String }),
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || "Failed to process image");

          const detections = data.data.results || [];
          if (detections.length > 0) {
            let maxConf = 0;
            for (const detection of detections) { if (detection[4] > maxConf) maxConf = detection[4]; }
            setResult({ detected: true, probability: Math.round(maxConf * 100), boxes: detections });
          } else {
            setResult({ detected: false, probability: 0, boxes: [] });
          }
        } catch (err: any) {
          setError(err.message || "An error occurred during processing");
        } finally {
          setIsProcessing(false);
        }
      };
    } catch (err: any) {
      setError(err.message || "An error occurred");
      setIsProcessing(false);
    }
  };

  return (
    <main className="flex-1 bg-background p-8 min-h-full">
      <div className="max-w-7xl mx-auto">
        <header className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Algae Detection Analysis</h1>
          <p className="text-gray-500 mt-1 font-medium">Automated visual monitoring for cyanobacteria and algal blooms</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Controls */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl border border-border p-8 shadow-subtle">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-6">Laboratory Input</h3>
              
              <div className="space-y-6">
                <div className="relative group">
                   <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">Select Sampling Image</label>
                   <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="block w-full text-xs text-gray-400
                      file:mr-4 file:py-2.5 file:px-4
                      file:rounded-lg file:border-0
                      file:text-[10px] file:font-bold file:uppercase file:tracking-widest
                      file:bg-gray-100 file:text-gray-600
                      hover:file:bg-gray-200 transition-all cursor-pointer"
                  />
                </div>

                {previewUrl && (
                  <div className="mt-6 rounded-xl overflow-hidden bg-gray-50 border border-border p-4 flex justify-center items-center">
                    <div className="relative inline-block max-w-full shadow-subtle rounded-lg overflow-hidden">
                      <img src={previewUrl} alt="Preview" className="max-h-[300px] w-auto block" />
                      {result?.boxes?.map((box, i) => {
                        const [xmin, ymin, xmax, ymax] = box;
                        return (
                          <div
                            key={i}
                            className="absolute border-2 border-risk-high bg-risk-high/10"
                            style={{ 
                              left: `${(xmin / 800) * 100}%`, 
                              top: `${(ymin / 800) * 100}%`, 
                              width: `${((xmax - xmin) / 800) * 100}%`, 
                              height: `${((ymax - ymin) / 800) * 100}%` 
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}

                <button
                  onClick={handleProcessImage}
                  disabled={!selectedFile || isProcessing}
                  className="w-full flex items-center justify-center gap-2 bg-brand-600 text-white font-bold py-3 rounded-xl hover:bg-brand-700 transition-all shadow-subtle text-xs uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? <><Loader2 className="animate-spin" size={16} /> Scanning Matrix...</> : <><Search size={16} /> Run AI Analysis</>}
                </button>

                {error && (
                  <div className="flex gap-3 p-4 bg-red-50 text-red-700 rounded-xl text-xs font-bold border border-red-100 items-center">
                    <AlertCircle size={16} className="shrink-0" /> {error}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Results Side */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-2xl border border-border p-12 shadow-subtle min-h-[500px] flex flex-col">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-10">Analysis Outcome</h3>

              {!result && !isProcessing && (
                <div className="flex-1 flex flex-col items-center justify-center text-center px-12">
                   <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-6 border border-border">
                      <Search className="text-gray-300" size={32} />
                   </div>
                   <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Pending Laboratory Data</p>
                   <p className="text-xs text-gray-400 mt-2">Awaiting image upload for convolutional neural network inference.</p>
                </div>
              )}

              {isProcessing && (
                <div className="flex-1 flex flex-col items-center justify-center">
                  <div className="relative w-20 h-20 mb-6">
                    <div className="absolute inset-0 border-4 border-brand-100 rounded-full" />
                    <div className="absolute inset-0 border-4 border-brand-600 rounded-full border-t-transparent animate-spin" />
                  </div>
                  <p className="text-xs font-bold text-brand-600 uppercase tracking-widest">Processing Tensors...</p>
                </div>
              )}

              {result && !isProcessing && (
                <div className="flex-1 flex flex-col items-center justify-center animate-in fade-in duration-500">
                  <div className={clsx("flex items-center gap-4 px-8 py-5 rounded-2xl border mb-10", 
                    result.detected ? "bg-red-50 border-red-100 text-risk-high" : "bg-green-50 border-green-100 text-risk-low")}>
                    {result.detected ? <ShieldAlert size={32} /> : <CheckCircle2 size={32} />}
                    <div>
                      <p className="text-sm font-bold uppercase tracking-widest">{result.detected ? "Algae Detected" : "No Algae Detected"}</p>
                      <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Inference Confidence: {result.probability}%</p>
                    </div>
                  </div>

                  <div className="w-full max-w-md space-y-6 pt-10 border-t border-border">
                    <div className="grid grid-cols-2 gap-8">
                       <ResultStat label="Confidence Score" value={`${result.probability}%`} />
                       <ResultStat label="Objects Logged" value={result.boxes.length} />
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed font-medium">
                      {result.detected 
                        ? "Visual patterns consistent with high-concentration chlorophyll-a or cyanobacteria blooms have been identified within the image matrix."
                        : "The model found no significant evidence of surface blooms. Water clarity patterns are consistent with normal historical baselines."}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function ResultStat({ label, value }: any) {
  return (
    <div>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">{label}</p>
      <p className="text-2xl font-bold text-foreground tracking-tight">{value}</p>
    </div>
  );
}
