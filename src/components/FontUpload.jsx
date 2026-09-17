import React, { useRef } from "react";

const supportedFormats = [".ttf", ".otf", ".woff", ".woff2"];

export default function FontUpload({ onFontUpload }) {
  const inputRef = useRef(null);

  const handleUpload = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const extension = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();

    if (!supportedFormats.includes(extension)) {
      alert("Only TTF, OTF, WOFF and WOFF2 fonts are supported");
      event.target.value = "";
      return;
    }

    onFontUpload?.(file);
    event.target.value = "";
  };

  return (
    <div className="mt-2 rounded-md border border-dashed border-gray-200 p-2.5">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex w-full items-center justify-center rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-[11px] font-medium text-blue-700 hover:bg-blue-100"
      >
        Choose font file
      </button>

      <input
        ref={inputRef}
        type="file"
        accept=".ttf,.otf,.woff,.woff2"
        onChange={handleUpload}
        className="hidden"
      />

      <p className="mt-2 text-[10px] text-gray-500">Supported formats: TTF, OTF, WOFF, WOFF2</p>
    </div>
  );
}