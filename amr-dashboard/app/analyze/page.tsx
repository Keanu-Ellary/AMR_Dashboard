/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";

export default function AnalyzePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{
    algaeDetected: boolean;
    pollutionDetected: boolean;
    clean: boolean;
    probabilities: { algae: number; clean: number; polluted: number };
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
      // Convert file to base64
      const reader = new FileReader();
      reader.readAsDataURL(selectedFile);

      reader.onload = async () => {
        // The result is a data URL like "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
        // We only want the base64 string portion after the comma
        const base64String = (reader.result as string).split(",")[1];

        try {
          const response = await fetch("/api/algae", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ image: base64String }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || "Failed to process image");
          }

          setResult({
            algaeDetected: data.data.algaeDetected || false,
            pollutionDetected: data.data.pollutionDetected || false,
            clean: data.data.clean || false,
            probabilities: data.data.probabilities || {
              algae: 0,
              clean: 0,
              polluted: 0,
            },
          });
        } catch (err: any) {
          console.error(err);
          setError(err.message || "An error occurred during processing");
        } finally {
          setIsProcessing(false);
        }
      };

      reader.onerror = () => {
        setError("Failed to read file");
        setIsProcessing(false);
      };
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred");
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-6xl text-gray-900 bg-white rounded-xl shadow-md border border-gray-100 my-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-900">
        AI Image Scanner
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Side: Upload and Preview */}
        <div className="border rounded-lg p-6 shadow-sm bg-white">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">
            Upload Image
          </h2>

          <div className="mb-4">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
          </div>

          {previewUrl && (
            <div className="mt-4 border rounded-md overflow-hidden bg-gray-50 flex justify-center items-center p-4">
              <div className="relative inline-block max-w-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-h-[350px] w-auto block"
                />
                {/* No boxes to render for classification model */}
              </div>
            </div>
          )}

          <button
            onClick={handleProcessImage}
            disabled={!selectedFile || isProcessing}
            className={`mt-6 w-full py-3 px-4 rounded-md text-white font-medium transition-colors
              ${
                !selectedFile || isProcessing
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
          >
            {isProcessing ? "Processing AI Analysis..." : "Analyze Image"}
          </button>

          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md text-sm border border-red-200">
              {error}
            </div>
          )}
        </div>

        {/* Right Side: Results */}
        <div className="border rounded-lg p-6 shadow-sm bg-white flex flex-col items-center justify-center min-h-[350px]">
          <h2 className="text-xl font-semibold mb-6 w-full text-left text-gray-900">
            Analysis Results
          </h2>

          {!result && !isProcessing && (
            <div className="flex-1 flex items-center justify-center text-gray-500 italic text-center px-4">
              Select an image from your computer and click &quot;Analyze
              Image&quot; to see the AI predictions here.
            </div>
          )}

          {isProcessing && (
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600">Running AI Model...</p>
            </div>
          )}

          {result && !isProcessing && (
            <div className="flex-1 flex flex-col items-center justify-center w-full animate-in fade-in zoom-in duration-300">
              <div
                className={`text-3xl font-bold mb-4 px-6 py-4 rounded-xl shadow-sm ${
                  result.algaeDetected || result.pollutionDetected
                    ? "bg-red-100 text-red-600 border border-red-200"
                    : "bg-green-100 text-green-600 border border-green-200"
                }`}
              >
                {result.algaeDetected && result.pollutionDetected
                  ? "ALGAE & POLLUTION DETECTED"
                  : result.algaeDetected
                    ? "ALGAE DETECTED"
                    : result.pollutionDetected
                      ? "POLLUTION DETECTED"
                      : "CLEAN"}
              </div>

              {(result.algaeDetected ||
                result.pollutionDetected ||
                result.clean) && (
                <div className="flex flex-col gap-2 mt-4 w-full px-4">
                  <div className="bg-gray-50 px-6 py-3 rounded-lg border border-gray-100 flex justify-between">
                    <span className="text-gray-600 font-medium">Algae:</span>
                    <span
                      className={`font-bold ${result.algaeDetected ? "text-red-500" : "text-gray-700"}`}
                    >
                      {Math.round(result.probabilities.algae * 100)}%
                    </span>
                  </div>
                  <div className="bg-gray-50 px-6 py-3 rounded-lg border border-gray-100 flex justify-between">
                    <span className="text-gray-600 font-medium">
                      Pollution:
                    </span>
                    <span
                      className={`font-bold ${result.pollutionDetected ? "text-red-500" : "text-gray-700"}`}
                    >
                      {Math.round(result.probabilities.polluted * 100)}%
                    </span>
                  </div>
                  <div className="bg-gray-50 px-6 py-3 rounded-lg border border-gray-100 flex justify-between">
                    <span className="text-gray-600 font-medium">Clean:</span>
                    <span
                      className={`font-bold ${result.clean ? "text-green-500" : "text-gray-700"}`}
                    >
                      {Math.round(result.probabilities.clean * 100)}%
                    </span>
                  </div>
                </div>
              )}

              <p className="mt-8 text-sm text-gray-500 text-center px-4 max-w-sm border-t border-gray-100 pt-6">
                {result.algaeDetected || result.pollutionDetected
                  ? "The AI model has identified visual elements highly consistent with algae blooms or pollution in the provided image."
                  : "The AI model did not find any significant evidence of algae blooms or pollution in the provided image."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
