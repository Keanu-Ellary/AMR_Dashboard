"use client";

import React, { useState } from "react";
import Link from "next/link";
import SideNavBar from "@/components/SideNavBar";
import TopNavBar from "@/components/TopNavBar";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { Download, LayoutDashboard, MapPin, PieChart as PieChartIcon } from "lucide-react";

// mock data
const amrTrendsData = [
  { name: "Mar", value: 40 },
  { name: "Apr", value: 42 },
  { name: "May", value: 45 }, 
  { name: "Jun", value: 48 },
  { name: "Jul", value: 50 },
  { name: "Aug", value: 52 },
];

const organismPrevalenceData = [
  { name: "E.coli", ecoli: 58 },
  { name: "Enterococcus", enterococcus: 44 },
  { name: "Pseudomonas", pseudomonas: 39 },
  { name: "Other", other: 24 },
];

export default function StatisticsPage() {
  const [isExportOpen, setIsExportOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      
      <SideNavBar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header bar */}
        <TopNavBar />

        {/* Dashboard Content */}
        <main className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-[1400px] mx-auto w-full">
            
            {/* Left Column (Info Card & Water Quality) */}
            <div className="md:col-span-1 flex flex-col gap-6">
              
              {/* Location Info Card */}
              <div className="bg-blue-50 rounded-2xl p-4 shadow-sm border border-blue-100">
                <div className="rounded-xl overflow-hidden mb-4 h-40 bg-gray-200">
                  <img src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=600&auto=format&fit=crop" alt="Magaliesburg" className="w-full h-full object-cover"/>
                </div>
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <MapPin size={16} className="text-gray-700"/>
                  Magaliesburg Mountain Range
                </h3>
                <div className="mt-4 text-sm text-gray-700 space-y-1">
                  <p><strong>GPS Coordinates:</strong> 25.7500° S, 27.8667° E</p>
                  <p><strong>Zone:</strong> Red</p>
                  <p className="mt-2 text-gray-800 font-semibold flex items-center gap-2">Water Temperature: 19.2°C</p>
                  <p><strong>pH:</strong> 7.1</p>
                  <p><strong>TDS:</strong> 470 mg/L</p>
                  <p><strong>EC:</strong> 750 uS/cm</p>
                  <p><strong>DO:</strong> 5.5 mg/L</p>
                  <p className="font-bold mt-2">AMR Positive: <span className="font-normal">58%</span></p>
                </div>
              </div>

              {/* Water Quality Donut (Mocked with simple HTML/CSS for now) */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 flex flex-col items-center justify-center text-center h-full min-h-[300px]">
                 <div className="relative w-32 h-32 mb-4">
                    {/* Simple CSS-based donut chart */}
                    <svg viewBox="0 0 36 36" className="w-full h-full">
                      <path
                        className="text-gray-100"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-blue-500"
                        stroke="currentColor"
                        strokeWidth="4"
                        strokeDasharray="80, 100"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xl font-bold text-slate-800">80%</span>
                    </div>
                </div>
                <h3 className="font-bold text-xl text-gray-900">Water Quality</h3>
                <div className="flex gap-4 mt-4 text-sm font-medium">
                  <div className="flex items-center gap-2"><span className="w-3 h-3 bg-blue-500 rounded-sm"></span> Safe</div>
                  <div className="flex items-center gap-2"><span className="w-3 h-3 bg-gray-200 rounded-sm"></span> Unsafe</div>
                </div>
              </div>
            </div>

            {/* Right Column (Graphs) */}
            <div className="md:col-span-2 flex flex-col gap-6">
              
              {/* AMR Trends Chart */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <h3 className="text-indigo-900 font-bold text-lg mb-4">AMR Trends</h3>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={amrTrendsData} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} tickFormatter={(value) => `${value}%`} />
                      <Tooltip />
                      <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="value" data={[...amrTrendsData].map(d => ({...d, value: d.value + 10}))} stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="bg-orange-100 text-orange-800 text-sm p-2 rounded-md text-center mt-2 font-medium">
                  AMR increased from 40% in March to 52% in August
                </div>
              </div>

              {/* Organism Prevalence */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <h3 className="text-indigo-900 font-bold text-lg mb-4">Organism Prevalence</h3>
                <div className="space-y-4">
                  
                  {/* Custom Progress bars for prevalence */}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="w-32 flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-500"></span>E.coli</div>
                    <div className="flex-1 bg-gray-100 h-4 rounded-sm overflow-hidden flex">
                       <div className="bg-blue-500 h-full" style={{ width: '58%' }}></div>
                    </div>
                    <div className="w-10 font-bold text-right text-gray-700">58%</div>
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    <div className="w-32 flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-green-500"></span>Enterococcus</div>
                    <div className="flex-1 bg-gray-100 h-4 rounded-sm overflow-hidden flex">
                       <div className="bg-green-500 h-full" style={{ width: '44%' }}></div>
                    </div>
                    <div className="w-10 font-bold text-right text-gray-700">44%</div>
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    <div className="w-32 flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-orange-400"></span>Pseudomonas</div>
                    <div className="flex-1 bg-gray-100 h-4 rounded-sm overflow-hidden flex">
                       <div className="bg-orange-400 h-full" style={{ width: '39%' }}></div>
                    </div>
                    <div className="w-10 font-bold text-right text-gray-700">39%</div>
                  </div>

                   <div className="flex items-center gap-4 text-sm">
                    <div className="w-32 flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-yellow-400"></span>Other</div>
                    <div className="flex-1 bg-gray-100 h-4 rounded-sm overflow-hidden flex">
                       <div className="bg-yellow-400 h-full" style={{ width: '24%' }}></div>
                    </div>
                    <div className="w-10 font-bold text-right text-gray-700">24%</div>
                  </div>
                  
                </div>
                <div className="bg-orange-100 text-orange-800 text-sm p-2 rounded-md text-center mt-4 font-medium">
                  E.coli and Enterococcus are the most common organisms detected
                </div>
              </div>

              

            </div>
          </div>
        </main>
      </div>
    </div>
  );
}