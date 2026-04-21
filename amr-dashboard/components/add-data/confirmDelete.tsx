'use client';

import { SiteData } from "@/types/site_types";

type Props = {
  site: SiteData | null | undefined;
  handleConfirm: () => void;
  handleCancel: () => void;
};

export default function ConfirmDelete({ site, handleConfirm, handleCancel }: Props) {
  return (
    <div 
      className={
        `fixed inset-0 flex items-center justify-center z-100000 transition-opacity duration-200
         ${site ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`
      }
    >
      <div 
        onClick={handleCancel}
      />

      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md flex flex-col gap-6">
        
        <h2 className="text-xl font-bold">Confirm Delete</h2>

        {site && (
          <div className="bg-gray-100 rounded-xl p-4 flex flex-col gap-1 text-sm text-gray-600">
            <p><span className="font-semibold">Site:</span> {site.geoLocName}</p>
            <p><span className="font-semibold">Location:</span> {site.latitude}, {site.longitude}</p>
          </div>
        )}

        <p className="text-gray-500 text-sm">
          Are you sure you want to delete this site?
        </p>

        <div className="flex gap-4 justify-end">
          <button
            onClick={handleCancel}
            className="px-6 py-2 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleConfirm}
            className="px-6 py-2 rounded-md bg-red-200 text-slate-800 font-medium hover:bg-red-300 transition-colors"
          >
            Delete
          </button>
        </div>

      </div>
    </div>
  );
}