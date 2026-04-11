'use client';

type Props = {
  file: File | null | undefined;
  handleConfirm: () => void;
  handleCancel: () => void;
};

export default function ConfirmFile({ file, handleConfirm, handleCancel }: Props) {
  return (
    <div 
      className={
        `fixed inset-0 flex items-center justify-center z-100000 transition-opacity duration-200
         ${file ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`
      }
    >
      <div 
        onClick={handleCancel}
      />

      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md flex flex-col gap-6">
        
        <h2 className="text-xl font-bold">Confirm Upload</h2>

        {file && (
          <div className="bg-gray-100 rounded-xl p-4 flex flex-col gap-1 text-sm text-gray-600">
            <p><span className="font-semibold">File:</span> {file.name}</p>
            <p><span className="font-semibold">Size:</span> {(file.size / 1024).toFixed(2)} KB</p>
          </div>
        )}

        <p className="text-gray-500 text-sm">
          Are you sure you want to upload this file? All rows will be added as a sample.
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
            className="px-6 py-2 rounded-md bg-blue-200 text-slate-800 font-medium hover:bg-blue-300 transition-colors"
          >
            Upload
          </button>
        </div>

      </div>
    </div>
  );
}