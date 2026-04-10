'use client';

import { useState, useRef } from 'react';
import { Home, BarChart2, Map as MapIcon, ChevronRight, User, Sidebar } from 'lucide-react';
import Link from 'next/link';
import SideNavBar from '@/components/SideNavBar';

export default function AddDataPage() {
  const [dangerZone, setDangerZone] = useState('Choose Zone');
  const [showImportDropdown, setShowImportDropdown] = useState(false);
  const [acceptType, setAcceptType] = useState('.csv');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    longitude: '',
    latitude: '',
    temp: '',
    ph: '',
    tds: '',
    ec: '',
    do: ''
  });

  const handleClear = () => {
    setDangerZone('Choose Zone');
    setFormData({
      longitude: '',
      latitude: '',
      temp: '',
      ph: '',
      tds: '',
      ec: '',
      do: ''
    });
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
      console.log('Importing file:', file.name);
      // Logic to actually parse the file would go here
    }
  };

  return (
    <div className="flex h-screen bg-[#2D2D2D] p-2 font-sans text-sm">
      <div className="flex w-full bg-white rounded-[2rem] shadow-lg overflow-hidden border border-gray-100">
        
        <SideNavBar />

        {/* MAIN Form Column */}
        <div className="w-80 border-r border-gray-100 p-6 flex flex-col overflow-y-auto py-4">
          <button className="bg-[#ef4444] text-white px-4 py-1.5 rounded w-fit text-xs font-medium mb-4 hover:bg-red-600 transition">
            Close
          </button>

          <div className="space-y-3 flex-1 overflow-visible">
            {/* Form Fields */}
            <div>
              <label className="block text-gray-700 mb-1 text-xs">Danger Zone</label>
              <select 
                title="danger-zone"
                className="w-full border border-gray-200 rounded-md px-3 py-1.5 bg-white text-gray-600 focus:outline-none focus:border-blue-500 text-xs"
                value={dangerZone}
                onChange={(e) => setDangerZone(e.target.value)}
              >
                <option>Choose Zone</option>
                <option>Red Zone</option>
                <option>Yellow Zone</option>
              </select>
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
              <label className="block text-gray-700 mb-0.5 text-xs">Water Temperature (°C)</label>
              <input type="text" placeholder="Value" value={formData.temp} onChange={(e) => setFormData({...formData, temp: e.target.value})} className="w-full border border-gray-200 rounded-md px-3 py-1 focus:outline-none focus:border-blue-500 placeholder-gray-400 text-black text-xs" />
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
              <input type="text" placeholder="Value" value={formData.do} onChange={(e) => setFormData({...formData, do: e.target.value})} className="w-full border border-gray-200 rounded-md px-3 py-1 focus:outline-none focus:border-blue-500 placeholder-gray-400 text-black text-xs" />
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2">
            <button className="w-full bg-[#22c55e] text-white py-1.5 rounded-md font-medium hover:bg-[#16a34a] transition text-sm">
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

        {/* MAP Column */}
        <div className="flex-1 bg-white relative flex items-center justify-center p-8">
        
        </div>

        {/* RIGHT Sidebar with mock data */}
        <div className="w-64 bg-white p-6 border-l border-gray-100 flex flex-col pt-8 text-xs overflow-hidden">
          
          <div className="flex-1 flex flex-col min-h-0 mb-6">
            <h3 className="font-semibold text-gray-800 text-xs mb-4 shrink-0">Red Areas</h3>
            <div className="space-y-4 overflow-y-auto pr-2 flex-1 scrollbar-thin scrollbar-thumb-gray-200">
              <div>
                <p className="text-gray-800 font-medium">Magiliesburg Mountain Range</p>
                <p className="text-gray-400">Just now</p>
              </div>
              <div>
                <p className="text-gray-800 font-medium">Sunnyside</p>
                <p className="text-gray-400">59 minutes ago</p>
              </div>
              <div>
                <p className="text-gray-800 font-medium">Groenkloof</p>
                <p className="text-gray-400">12 hours ago</p>
              </div>
              {/* scroll if added */}
              
            </div>
          </div>

          <div className="flex-1 flex flex-col min-h-0">
            <h3 className="font-semibold text-gray-800 text-xs mb-4 shrink-0">Yellow Areas</h3>
            <div className="space-y-4 overflow-y-auto pr-2 flex-1 scrollbar-thin scrollbar-thumb-gray-200">
              <div>
                <p className="text-gray-800 font-medium">Gezina</p>
                <p className="text-gray-400">2 hours ago</p>
              </div>
              <div>
                <p className="text-gray-800 font-medium">Pretoria Zoo</p>
                <p className="text-gray-400">6 hours ago</p>
              </div>
              <div>
                <p className="text-gray-800 font-medium">UNISA Campus</p>
                <p className="text-gray-400">2 days ago</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
