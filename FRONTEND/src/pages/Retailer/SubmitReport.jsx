import React, { useState } from "react";
import Select from "react-select";
import { FiPlus, FiXCircle } from "react-icons/fi";

const reportTypes = [
  { value: "window", label: "Window Display" },
  { value: "stock", label: "Stock" },
  { value: "others", label: "Others" },
];

const frequencyOptions = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "fortnightly", label: "Fortnightly" },
  { value: "monthly", label: "Monthly" },
  { value: "custom", label: "Custom" },
];

const futureUseOptions = [
  { value: "future1", label: "Future Option 1" },
  { value: "future2", label: "Future Option 2" },
  { value: "future3", label: "Future Option 3" },
];

const stockTypeOptions = [
  { value: "opening", label: "Opening Stock" },
  { value: "closing", label: "Closing Stock" },
  { value: "purchase", label: "Purchase Stock" },
  { value: "sold", label: "Sold Stock" },
];

const brandOptions = [
  { value: "brand1", label: "Brand A" },
  { value: "brand2", label: "Brand B" },
  { value: "brand3", label: "Brand C" },
];

const productOptions = [
  { value: "product1", label: "Product X" },
  { value: "product2", label: "Product Y" },
  { value: "product3", label: "Product Z" },
];

const skuOptions = [
  { value: "sku1", label: "SKU 1" },
  { value: "sku2", label: "SKU 2" },
  { value: "sku3", label: "SKU 3" },
];

const productTypeOptions = [
  { value: "focus", label: "Focus" },
  { value: "all", label: "All" },
];

const customSelectStyles = {
  control: (provided, state) => ({
    ...provided,
    borderColor: state.isFocused ? "#E4002B" : "#d1d5db",
    boxShadow: state.isFocused ? "0 0 0 1px #E4002B" : "none",
    "&:hover": { borderColor: "#E4002B" },
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isFocused ? "#FEE2E2" : "white",
    color: "#333",
    "&:active": { backgroundColor: "#FECACA" },
  }),
  singleValue: (provided) => ({
    ...provided,
    color: "#333", // ✅ NOT RED ANYMORE
  }),
  input: (provided) => ({
    ...provided,
    color: "#333",
  }),
  menu: (provided) => ({
    ...provided,
    zIndex: 10,
  }),
};

const SubmitReport = () => {
  const [reportType, setReportType] = useState(null);
  const [frequency, setFrequency] = useState(null);
  const [future, setFuture] = useState(null);

  const [showCustomDate, setShowCustomDate] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [files, setFiles] = useState(null);
  const [billCopy, setBillCopy] = useState(null);

  const handleFileChange = (e) => setFiles(e.target.files[0]);
  const removeFile = () => setFiles(null);

  const handleBillCopy = (e) => setBillCopy(e.target.files[0]);
  const removeBill = () => setBillCopy(null);

  const isImage = (file) =>
    file && ["image/png", "image/jpeg", "image/jpg"].includes(file.type);

  return (
    <div>
      <h3 className="text-xl font-semibold mb-4 text-[#E4002B]">Submit Report</h3>

      <form className="space-y-4">

        {/* Type of Report */}
        <div>
          <label className="block font-medium mb-1">Type of Report *</label>
          <Select
            styles={customSelectStyles}
            options={reportTypes}
            value={reportType}
            onChange={setReportType}
            placeholder="Select Report Type"
            isSearchable
          />
        </div>

        {/* Frequency */}
        <div>
          <label className="block font-medium mb-1">Frequency *</label>
          <Select
            styles={customSelectStyles}
            options={frequencyOptions}
            value={frequency}
            onChange={(item) => {
              setFrequency(item);
              setShowCustomDate(item?.value === "custom");
            }}
            placeholder="Select Frequency"
            isSearchable
          />
        </div>

        {/* CUSTOM FROM / TO */}
        {showCustomDate && (
          <div className="flex gap-4">
            <div>
              <label className="font-medium mb-1 block">From *</label>
              <input
                type="date"
                className="border rounded p-2"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div>
              <label className="font-medium mb-1 block">To *</label>
              <input
                type="date"
                className="border rounded p-2"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* EXTRA */}
        <div>
          <label className="block font-medium mb-1">Extra (Future)</label>
          <Select
            styles={customSelectStyles}
            options={futureUseOptions}
            value={future}
            onChange={setFuture}
            placeholder="Select future use"
            isSearchable
          />
        </div>

        {/* STOCK */}
        {reportType?.value === "stock" && (
          <div className="space-y-4 bg-gray-50 p-4 rounded-md border">

            <Select styles={customSelectStyles} options={stockTypeOptions} placeholder="Type of Stock" isSearchable />
            <Select styles={customSelectStyles} options={brandOptions} placeholder="Brand" isSearchable />
            <Select styles={customSelectStyles} options={productOptions} placeholder="Product" isSearchable />
            <Select styles={customSelectStyles} options={skuOptions} placeholder="SKU" isSearchable />
            <Select styles={customSelectStyles} options={productTypeOptions} placeholder="Product Type" isSearchable />

            <div>
              <label className="font-medium mb-1">Quantity</label>
              <input type="number" className="border rounded p-2 w-full" placeholder="Enter quantity" />
            </div>

            {/* Bill Copy */}
            <div>
              <label className="block font-medium mb-1">Bill Copy</label>

              {!billCopy ? (
                <label className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:border-[#E4002B]">
                  <FiPlus className="text-3xl text-gray-400" />
                  <span>Click or drop file here</span>
                  <input
                    type="file"
                    accept="image/*, application/pdf"
                    className="hidden"
                    onChange={handleBillCopy}
                  />
                </label>
              ) : (
                <div className="border-2 border-dashed rounded-lg p-4 text-center">
                  {isImage(billCopy) ? (
                    <img
                      src={URL.createObjectURL(billCopy)}
                      className="w-28 h-28 mx-auto rounded"
                      alt="preview"
                    />
                  ) : (
                    <p>{billCopy?.name}</p>
                  )}
                  <button
                    type="button"
                    className="flex items-center gap-1 text-[#E4002B] mt-2"
                    onClick={removeBill}
                  >
                    <FiXCircle /> Remove
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* WINDOW */}
        {reportType?.value === "window" && (
          <div>
            <label className="block font-medium mb-1">Upload Shop Display</label>

            {!files ? (
              <label className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:border[#E4002B]">
                <FiPlus className="text-3xl text-gray-400" />
                <span>Click or drop file here</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            ) : (
              <div className="border-2 border-dashed rounded-lg p-4 text-center">
                {isImage(files) ? (
                  <img
                    src={URL.createObjectURL(files)}
                    className="w-28 h-28 mx-auto rounded"
                    alt="preview"
                  />
                ) : (
                  <p>{files?.name}</p>
                )}
                <button
                  type="button"
                  className="flex items-center gap-1 text-[#E4002B] mt-2"
                  onClick={removeFile}
                >
                  <FiXCircle /> Remove
                </button>
              </div>
            )}
          </div>
        )}

        {/* OTHERS */}
        {reportType?.value === "others" && (
          <div>
            <label className="block font-medium mb-1">Upload File</label>

            {!files ? (
              <label className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:border-[#E4002B]">
                <FiPlus className="text-3xl text-gray-400" />
                <span>Click or drop file here</span>
                <input type="file" className="hidden" onChange={handleFileChange} />
              </label>
            ) : (
              <div className="border-2 border-dashed rounded-lg p-4 text-center">
                {isImage(files) ? (
                  <img
                    src={URL.createObjectURL(files)}
                    className="w-28 h-28 mx-auto rounded"
                    alt="preview"
                  />
                ) : (
                  <p>{files?.name}</p>
                )}
                <button
                  type="button"
                  className="flex items-center gap-1 text-[#E4002B] mt-2"
                  onClick={removeFile}
                >
                  <FiXCircle /> Remove
                </button>
              </div>
            )}
          </div>
        )}

        <button
          type="submit"
          className="mt-3 px-4 py-2 bg-[#E4002B] text-white rounded"
        >
          Submit
        </button>
      </form>
    </div>
  );
};

export default SubmitReport;
