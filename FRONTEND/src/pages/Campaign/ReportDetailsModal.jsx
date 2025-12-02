import React, { useState, useEffect, useRef } from "react";
import Select from "react-select";

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
};

const stockTypeOptions = [
    { value: "opening", label: "Opening Stock" },
    { value: "closing", label: "Closing Stock" },
    { value: "purchase", label: "Purchase Stock" },
    { value: "sold", label: "Sold Stock" },
];

const productTypeOptions = [
    { value: "focus", label: "Focus" },
    { value: "all", label: "All" },
];

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
];

const ReportDetailsModal = ({ report, onClose, onUpdate, onDelete }) => {
    console.log("REPORT OBJECT =>", report);
    console.log("FREQUENCY VALUE =>", report.frequency);

    const [isEditing, setIsEditing] = useState(false);

    // Form state
    const [reportType, setReportType] = useState(
        reportTypes.find(rt => rt.value === report.reportType) || null
    );
    const [frequency, setFrequency] = useState(
        frequencyOptions.find(f => f.value === report.frequency?.toLowerCase?.()) || null
    );
    const [stockType, setStockType] = useState(
        stockTypeOptions.find(st => st.value === report.stockType) || null
    );
    const [productType, setProductType] = useState(
        productTypeOptions.find(pt => pt.value === report.productType) || null
    );

    const [brand, setBrand] = useState(report.brand || "");
    const [product, setProduct] = useState(report.product || "");
    const [sku, setSku] = useState(report.sku || "");
    const [quantity, setQuantity] = useState(report.quantity || "");
    const [otherReasonText, setOtherReasonText] = useState(report.otherReasonText || "");

    const [images, setImages] = useState([]);
    const [billCopy, setBillCopy] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [removedImageIndices, setRemovedImageIndices] = useState([]);
    const [removedBillIndices, setRemovedBillIndices] = useState([]);

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return "N/A";
            return date.toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
            });
        } catch (error) {
            return "N/A";
        }
    };

    const handleImageChange = (e) => {
        const newFiles = Array.from(e.target.files || []);
        if (newFiles.length > 0) {
            setImages((prevFiles) => [...prevFiles, ...newFiles]);
        }
        e.target.value = "";
    };

    const removeImage = (index) => {
        setImages((prevFiles) => {
            const newImages = prevFiles.filter((_, i) => i !== index);
            return newImages;
        });
    };

    const removeCurrentImage = (index) => {
        setRemovedImageIndices(prev => [...prev, index]);
    };

    const handleBillCopy = (e) => {
        const newFiles = Array.from(e.target.files || []);
        if (newFiles.length > 0) {
            setBillCopy((prevFiles) => [...prevFiles, ...newFiles]);
        }
        e.target.value = ""; // Reset input
    }

    const removeBill = (index) => {
        setBillCopy((prevFiles) => prevFiles.filter((_, i) => i !== index));
    };

    const handleSave = async (e) => {
        e.preventDefault();

        // Validation
        if (!reportType) {
            alert("Please select a report type");
            return;
        }

        setIsSaving(true);

        const formData = new FormData();

        // Append basic fields
        if (reportType) formData.append("reportType", reportType.value);
        if (frequency) formData.append("frequency", frequency.value);
        if (otherReasonText) formData.append("otherReasonText", otherReasonText);

        if (removedImageIndices.length > 0) {
            formData.append("removedImageIndices", JSON.stringify(removedImageIndices));
        }

        // ⭐ Add removed bill indices
        if (removedBillIndices.length > 0) {
            formData.append("removedBillIndices", JSON.stringify(removedBillIndices));
        }

        // Append stock fields if stock type
        if (reportType?.value === "stock") {
            if (stockType) formData.append("stockType", stockType.value);
            if (brand) formData.append("brand", brand);
            if (product) formData.append("product", product);
            if (sku) formData.append("sku", sku);
            if (productType) formData.append("productType", productType.value);
            if (quantity) formData.append("quantity", quantity);

            // Handle multiple bill copies (new uploads)
            if (billCopy.length > 0) {
                billCopy.forEach((file) => {
                    formData.append("billCopy", file);
                });
            }
        }

        // Append images if new ones uploaded
        if (images.length > 0) {
            images.forEach((image) => {
                formData.append("images", image);
            });
        }

        try {
            await onUpdate(report._id, formData);
            setIsEditing(false);
        } catch (error) {
            console.error("Failed to update report:", error);
            alert("Failed to update report. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        try {
            await onDelete(report._id);
        } catch (error) {
            console.error("Failed to delete report:", error);
            alert("Failed to delete report. Please try again.");
        }
    };

    const imageUrlsRef = useRef([]);

    useEffect(() => {
        if (isEditing) {
            // Store initial values
            setReportType(reportTypes.find(rt => rt.value === report.reportType) || null);
            setFrequency(frequencyOptions.find(f => f.value === report.frequency?.toLowerCase?.()) || null);
            setStockType(stockTypeOptions.find(st => st.value === report.stockType) || null);
            setProductType(productTypeOptions.find(pt => pt.value === report.productType) || null);
            setBrand(report.brand || "");
            setProduct(report.product || "");
            setSku(report.sku || "");
            setQuantity(report.quantity || "");
            setOtherReasonText(report.otherReasonText || "");
            setImages([]);
            setBillCopy([]);
            setRemovedImageIndices([]);
            setRemovedBillIndices([]);
        }
    }, [isEditing, report]);

    useEffect(() => {
        return () => {
            imageUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
        };
    }, []);

    // Reset fields when report type changes during editing
    useEffect(() => {
        if (isEditing && reportType) {
            const previousReportType = report.reportType;
            const currentReportType = reportType.value;

            // If switching away from stock type, clear stock-related fields and mark bills for removal
            if (currentReportType !== "stock" && previousReportType === "stock") {
                setStockType(null);
                setBrand("");
                setProduct("");
                setSku("");
                setProductType(null);
                setQuantity("");
                setBillCopy([]);

                // Mark all existing bill copies for removal
                if (report.billCopies && report.billCopies.length > 0) {
                    setRemovedBillIndices(report.billCopies.map((_, idx) => idx));
                }
            }

            // If switching away from window/others, clear images and mark for removal
            if (currentReportType !== "window" && currentReportType !== "others" &&
                (previousReportType === "window" || previousReportType === "others")) {
                setImages([]);

                // Mark all existing images for removal
                if (report.images && report.images.length > 0) {
                    setRemovedImageIndices(report.images.map((_, idx) => idx));
                }
            }

            // If switching TO stock from window/others, clear images and mark for removal
            if (currentReportType === "stock" && (previousReportType === "window" || previousReportType === "others")) {
                setImages([]);

                // Mark all existing images for removal
                if (report.images && report.images.length > 0) {
                    setRemovedImageIndices(report.images.map((_, idx) => idx));
                }
            }

            // If switching TO window/others from stock, clear bills and mark for removal
            if ((currentReportType === "window" || currentReportType === "others") && previousReportType === "stock") {
                setBillCopy([]);

                // Mark all existing bills for removal
                if (report.billCopies && report.billCopies.length > 0) {
                    setRemovedBillIndices(report.billCopies.map((_, idx) => idx));
                }
            }
        }
    }, [reportType, isEditing]);

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-lg shadow-xl max-w-5xl w-full my-8"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="max-h-[85vh] overflow-y-auto">
                    {/* Header */}
                    <div className="sticky top-0 bg-white z-10 border-b p-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-[#E4002B]">
                                {isEditing ? "Edit Report" : "Report Details"}
                            </h2>
                            <div className="flex items-center gap-3">
                                {!isEditing ? (
                                    <>
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={handleDelete}
                                            className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition"
                                        >
                                            Delete
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={handleSave}
                                            disabled={isSaving}
                                            className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition disabled:bg-gray-400"
                                        >
                                            {isSaving ? "Saving..." : "Save Changes"}
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (window.confirm("Discard all changes?")) {
                                                    setIsEditing(false);
                                                }
                                            }}
                                            className="bg-gray-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-600 transition"
                                        >
                                            Cancel
                                        </button>
                                    </>
                                )}
                                <button
                                    onClick={onClose}
                                    className="text-gray-500 hover:text-gray-700 ml-2"
                                >
                                    <span className="text-2xl">&times;</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">


                        {isEditing ? (
                            // EDIT MODE - Form View
                            <form className="space-y-6">
                                {/* Campaign Info - Read Only */}
                                <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-500">
                                    <h3 className="text-lg font-semibold mb-3 text-gray-700">Campaign Information</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                        <div>
                                            <span className="font-medium text-gray-600">Campaign:</span>
                                            <p className="text-gray-800">{report.campaignName || "N/A"}</p>
                                        </div>
                                        <div>
                                            <span className="font-medium text-gray-600">Type:</span>
                                            <p className="text-gray-800">{report.campaignType || "N/A"}</p>
                                        </div>
                                        <div>
                                            <span className="font-medium text-gray-600">Client:</span>
                                            <p className="text-gray-800">{report.clientName || "N/A"}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Retailer - Non-editable */}
                                <div className="bg-gray-100 p-4 rounded-lg border">
                                    <label className="block font-medium mb-2 text-gray-700">Retailer (Cannot be changed)</label>
                                    <div className="bg-white p-3 rounded border">
                                        <p className="font-semibold text-gray-800">{report.retailerName || "N/A"}</p>
                                        <p className="text-sm text-gray-600">
                                            {report.shopName} • {report.retailerCode || report.retailerUniqueId}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {report.shopCity}, {report.shopState}
                                        </p>
                                    </div>
                                </div>

                                {/* Employee - Non-editable */}
                                <div className="bg-gray-100 p-4 rounded-lg border">
                                    <label className="block font-medium mb-2 text-gray-700">Employee (Cannot be changed)</label>
                                    <div className="bg-white p-3 rounded border">
                                        <p className="font-semibold text-gray-800">{report.employeeName || "N/A"}</p>
                                        <p className="text-sm text-gray-600">{report.employeePhone || "N/A"}</p>
                                        {report.employeeEmail && (
                                            <p className="text-sm text-gray-500">{report.employeeEmail}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Report Type */}
                                <div>
                                    <label className="block font-medium mb-2">Type of Report *</label>
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
                                    <label className="block font-medium mb-2">Frequency</label>
                                    <Select
                                        styles={customSelectStyles}
                                        options={frequencyOptions}
                                        value={frequency}
                                        onChange={setFrequency}
                                        placeholder="Select Frequency"
                                        isSearchable
                                        isClearable
                                    />
                                </div>

                                {/* STOCK REPORT FIELDS */}
                                {reportType?.value === "stock" && (
                                    <div className="space-y-4 bg-blue-50 p-4 rounded-md border border-blue-200">
                                        <h3 className="text-lg font-semibold text-gray-700">Stock Information</h3>

                                        <div>
                                            <label className="block font-medium mb-2">Stock Type</label>
                                            <Select
                                                styles={customSelectStyles}
                                                options={stockTypeOptions}
                                                value={stockType}
                                                onChange={setStockType}
                                                placeholder="Select Stock Type"
                                                isSearchable
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block font-medium mb-2">Brand</label>
                                                <input
                                                    type="text"
                                                    value={brand}
                                                    onChange={(e) => setBrand(e.target.value)}
                                                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-[#E4002B] focus:outline-none"
                                                    placeholder="Brand"
                                                />
                                            </div>
                                            <div>
                                                <label className="block font-medium mb-2">Product</label>
                                                <input
                                                    type="text"
                                                    value={product}
                                                    onChange={(e) => setProduct(e.target.value)}
                                                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-[#E4002B] focus:outline-none"
                                                    placeholder="Product"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block font-medium mb-2">SKU</label>
                                                <input
                                                    type="text"
                                                    value={sku}
                                                    onChange={(e) => setSku(e.target.value)}
                                                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-[#E4002B] focus:outline-none"
                                                    placeholder="SKU"
                                                />
                                            </div>
                                            <div>
                                                <label className="block font-medium mb-2">Product Type</label>
                                                <Select
                                                    styles={customSelectStyles}
                                                    options={productTypeOptions}
                                                    value={productType}
                                                    onChange={setProductType}
                                                    placeholder="Select Product Type"
                                                    isSearchable
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block font-medium mb-2">Quantity</label>
                                            <input
                                                type="number"
                                                value={quantity}
                                                onChange={(e) => setQuantity(e.target.value)}
                                                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-[#E4002B] focus:outline-none"
                                                placeholder="Quantity"
                                            />
                                        </div>

                                        {/* Current Bill Copies */}
                                        {report.billCopies && report.billCopies.length > 0 && (
                                            <div className="mb-4">
                                                <p className="text-sm font-medium text-gray-600 mb-2">
                                                    Current Bill Copies ({report.billCopies.filter((_, idx) => !removedBillIndices.includes(idx)).length}):
                                                </p>
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                                    {report.billCopies.map((bill, idx) => {
                                                        // Skip if removed
                                                        if (removedBillIndices.includes(idx)) return null;

                                                        // Convert Buffer to base64 if needed
                                                        let imageSource;

                                                        if (bill.data?.type === 'Buffer' && Array.isArray(bill.data?.data)) {
                                                            const base64 = btoa(
                                                                bill.data.data.reduce((data, byte) => data + String.fromCharCode(byte), '')
                                                            );
                                                            imageSource = `data:${bill.contentType};base64,${base64}`;
                                                        } else if (typeof bill.data === 'string') {
                                                            imageSource = bill.data.startsWith('data:')
                                                                ? bill.data
                                                                : `data:${bill.contentType};base64,${bill.data}`;
                                                        } else {
                                                            imageSource = bill.data;
                                                        }

                                                        return (
                                                            <div key={idx} className="relative group">
                                                                <img
                                                                    src={imageSource}
                                                                    alt={`Bill ${idx + 1}`}
                                                                    className="w-full h-32 object-cover rounded border"
                                                                    onError={(e) => {
                                                                        console.error('Image load error for bill:', bill);
                                                                        e.target.style.display = 'none';
                                                                    }}
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setRemovedBillIndices(prev => [...prev, idx])}
                                                                    className="absolute top-1 right-1 bg-[#E4002B] text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                                >
                                                                    ×
                                                                </button>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* New Bill Copy Upload */}
                                        <div>
                                            <label className="block font-medium mb-2">
                                                {billCopy.length > 0 ? "Add More Bill Copies" : "Upload Bill Copies"}
                                            </label>
                                            <label className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:border-[#E4002B]">
                                                <span className="text-3xl text-gray-400">+</span>
                                                <span>Click to upload bill copies (multiple allowed)</span>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    multiple
                                                    className="hidden"
                                                    onChange={handleBillCopy}
                                                />
                                            </label>

                                            {/* Preview new bill copies */}
                                            {billCopy.length > 0 && (
                                                <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2">
                                                    {billCopy.map((file, index) => (
                                                        <div key={index} className="relative group">
                                                            <img
                                                                src={URL.createObjectURL(file)}
                                                                className="w-full h-32 object-cover rounded border"
                                                                alt={`New Bill ${index + 1}`}
                                                            />
                                                            <button
                                                                type="button"
                                                                className="absolute top-1 right-1 bg-[#E4002B] text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                                onClick={() => removeBill(index)}
                                                            >
                                                                ×
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Notes */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block font-medium mb-2">Notes</label>
                                        <input
                                            type="text"
                                            value={otherReasonText}
                                            onChange={(e) => setOtherReasonText(e.target.value)}
                                            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-[#E4002B] focus:outline-none"
                                            placeholder="Notes"
                                        />
                                    </div>
                                </div>

                                {/* WINDOW DISPLAY / OTHERS - Images */}
                                {(reportType?.value === "window" || reportType?.value === "others") && (
                                    <div>
                                        {/* Current Images */}
                                        {report.images && report.images.length > 0 && (
                                            <div className="mb-4">
                                                <p className="text-sm font-medium text-gray-600 mb-2">
                                                    Current Images ({report.images.filter((_, idx) => !removedImageIndices.includes(idx)).length}):
                                                </p>
                                                <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                                                    {report.images.map((img, idx) => (
                                                        !removedImageIndices.includes(idx) && (
                                                            <div key={idx} className="relative group">
                                                                <img
                                                                    src={img.base64}
                                                                    alt={`Current ${idx + 1}`}
                                                                    className="w-full h-20 object-cover rounded border"
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeCurrentImage(idx)}
                                                                    className="absolute top-1 right-1 bg-[#E4002B] text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                                >
                                                                    ×
                                                                </button>
                                                            </div>
                                                        )
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        <label className="block font-medium mb-2">
                                            {report.images && report.images.length > 0 ? "Add More Images" : "Upload Images"}
                                        </label>
                                        <label className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:border-[#E4002B]">
                                            <span className="text-3xl text-gray-400">+</span>
                                            <span>Click to upload new images</span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                multiple={reportType?.value === "window"}
                                                className="hidden"
                                                onChange={handleImageChange}
                                            />
                                        </label>

                                        {images.length > 0 && (
                                            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                                                {images.map((file, index) => (
                                                    <div key={index} className="relative border-2 border-dashed rounded-lg overflow-hidden bg-gray-50 group">
                                                        <img
                                                            src={URL.createObjectURL(file)}
                                                            className="w-full h-32 object-cover"
                                                            alt={`preview-${index}`}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => removeImage(index)}
                                                            className="absolute top-1 right-1 bg-[#E4002B] text-white rounded-full p-1"
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}


                            </form>
                        ) : (
                            // VIEW MODE - Display View (Your existing code)
                            <div className="space-y-6">
                                {/* All your existing view mode sections */}
                                {/* Basic Info */}
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h3 className="text-lg font-semibold mb-4 text-gray-700">Basic Information</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600 mb-1">Report Type</label>
                                            <p className="text-gray-800 bg-white px-3 py-2 rounded">{report.reportType || "N/A"}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600 mb-1">Submitted By</label>
                                            <p className="text-gray-800 bg-white px-3 py-2 rounded">{report.submittedByRole || "N/A"}</p>
                                        </div>
                                        {report.frequency && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-600 mb-1">Frequency</label>
                                                <p className="text-gray-800 bg-white px-3 py-2 rounded">{report.frequency}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Campaign Info */}
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h3 className="text-lg font-semibold mb-4 text-gray-700">Campaign Information</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600 mb-1">Campaign Name</label>
                                            <p className="text-gray-800 bg-white px-3 py-2 rounded">{report.campaignName || "N/A"}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600 mb-1">Campaign Type</label>
                                            <p className="text-gray-800 bg-white px-3 py-2 rounded">{report.campaignType || "N/A"}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600 mb-1">Client</label>
                                            <p className="text-gray-800 bg-white px-3 py-2 rounded">{report.clientName || "N/A"}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Retailer Info */}
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h3 className="text-lg font-semibold mb-4 text-gray-700">Retailer Information</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600 mb-1">Retailer Name</label>
                                            <p className="text-gray-800 bg-white px-3 py-2 rounded">{report.retailerName || "N/A"}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600 mb-1">Retailer Code</label>
                                            <p className="text-gray-800 bg-white px-3 py-2 rounded">{report.retailerCode || report.retailerUniqueId || "N/A"}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600 mb-1">Shop Name</label>
                                            <p className="text-gray-800 bg-white px-3 py-2 rounded">{report.shopName || "N/A"}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600 mb-1">Contact</label>
                                            <p className="text-gray-800 bg-white px-3 py-2 rounded">{report.retailerContact || "N/A"}</p>
                                        </div>
                                    </div>
                                </div>
                                {/* Employee Info */}
                                {report.employeeName && (
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h3 className="text-lg font-semibold mb-4 text-gray-700">Employee Information</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-600 mb-1">Employee Name</label>
                                                <p className="text-gray-800 bg-white px-3 py-2 rounded">{report.employeeName}</p>
                                            </div>
                                            {report.employeeId.employeeId && (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-600 mb-1">Employee Code</label>
                                                    <p className="text-gray-800 bg-white px-3 py-2 rounded">{report.employeeId.employeeId}</p>
                                                </div>
                                            )}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-600 mb-1">Phone</label>
                                                <p className="text-gray-800 bg-white px-3 py-2 rounded">{report.employeePhone || "N/A"}</p>
                                            </div>
                                            {report.employeeEmail && (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
                                                    <p className="text-gray-800 bg-white px-3 py-2 rounded">{report.employeeEmail}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Product/Stock Info */}
                                {report.reportType === "stock" && (report.brand || report.product || report.sku || report.stockType) && (
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h3 className="text-lg font-semibold mb-4 text-gray-700">Product/Stock Information</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {report.stockType && (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-600 mb-1">Stock Type</label>
                                                    <p className="text-gray-800 bg-white px-3 py-2 rounded">{report.stockType}</p>
                                                </div>
                                            )}
                                            {report.brand && (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-600 mb-1">Brand</label>
                                                    <p className="text-gray-800 bg-white px-3 py-2 rounded">{report.brand}</p>
                                                </div>
                                            )}
                                            {report.product && (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-600 mb-1">Product</label>
                                                    <p className="text-gray-800 bg-white px-3 py-2 rounded">{report.product}</p>
                                                </div>
                                            )}
                                            {report.sku && (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-600 mb-1">SKU</label>
                                                    <p className="text-gray-800 bg-white px-3 py-2 rounded">{report.sku}</p>
                                                </div>
                                            )}
                                            {report.productType && (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-600 mb-1">Product Type</label>
                                                    <p className="text-gray-800 bg-white px-3 py-2 rounded">{report.productType}</p>
                                                </div>
                                            )}
                                            {report.quantity && (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-600 mb-1">Quantity</label>
                                                    <p className="text-gray-800 bg-white px-3 py-2 rounded">{report.quantity}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Date Info */}
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h3 className="text-lg font-semibold mb-4 text-gray-700">Date Information</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {report.fromDate && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-600 mb-1">From Date</label>
                                                <p className="text-gray-800 bg-white px-3 py-2 rounded">{formatDate(report.fromDate)}</p>
                                            </div>
                                        )}
                                        {report.toDate && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-600 mb-1">To Date</label>
                                                <p className="text-gray-800 bg-white px-3 py-2 rounded">{formatDate(report.toDate)}</p>
                                            </div>
                                        )}
                                        {report.visitDate && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-600 mb-1">Visit Date</label>
                                                <p className="text-gray-800 bg-white px-3 py-2 rounded">{formatDate(report.visitDate)}</p>
                                            </div>
                                        )}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600 mb-1">Submitted On</label>
                                            <p className="text-gray-800 bg-white px-3 py-2 rounded">{formatDate(report.createdAt)}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Additional Info */}
                                {(report.otherReasonText) && (
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h3 className="text-lg font-semibold mb-4 text-gray-700">Additional Information</h3>
                                        <div className="space-y-3">
                                            {report.otherReasonText && (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-600 mb-1">Notes</label>
                                                    <p className="text-gray-800 bg-white px-3 py-2 rounded">{report.otherReasonText}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Images */}
                                {(report.reportType === "window" || report.reportType === "others") && report.images && report.images.length > 0 && (
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h3 className="text-lg font-semibold mb-4 text-gray-700">Images ({report.images.length})</h3>
                                        <div className="space-y-4">
                                            <div className="relative bg-black rounded-lg overflow-hidden" style={{ height: '400px' }}>
                                                <img
                                                    src={report.images[activeImageIndex].base64}
                                                    alt={`Report image ${activeImageIndex + 1}`}
                                                    className="w-full h-full object-contain"
                                                />
                                                {report.images.length > 1 && (
                                                    <>
                                                        <button
                                                            onClick={() => setActiveImageIndex(prev => prev > 0 ? prev - 1 : report.images.length - 1)}
                                                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 transition"
                                                        >
                                                            ←
                                                        </button>
                                                        <button
                                                            onClick={() => setActiveImageIndex(prev => prev < report.images.length - 1 ? prev + 1 : 0)}
                                                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 transition"
                                                        >
                                                            →
                                                        </button>
                                                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                                                            {activeImageIndex + 1} / {report.images.length}
                                                        </div>
                                                    </>
                                                )}
                                            </div>

                                            {report.images.length > 1 && (
                                                <div className="flex gap-2 overflow-x-auto pb-2">
                                                    {report.images.map((img, idx) => (
                                                        <button
                                                            key={idx}
                                                            onClick={() => setActiveImageIndex(idx)}
                                                            className={`flex-shrink-0 w-20 h-20 rounded border-2 overflow-hidden transition ${activeImageIndex === idx ? 'border-[#E4002B]' : 'border-gray-300'}`}
                                                        >
                                                            <img
                                                                src={img.base64}
                                                                alt={`Thumbnail ${idx + 1}`}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Bill Copies */}
                                {report.reportType === "stock" && report.billCopies && report.billCopies.length > 0 && (
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h3 className="text-lg font-semibold mb-4 text-gray-700">
                                            Bill {report.billCopies.length > 1 ? 'Copies' : 'Copy'} ({report.billCopies.length})
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {report.billCopies.map((bill, idx) => {
                                                // Convert Buffer to base64 if needed
                                                let imageSource;

                                                if (bill.data?.type === 'Buffer' && Array.isArray(bill.data?.data)) {
                                                    // Convert Buffer array to base64
                                                    const base64 = btoa(
                                                        bill.data.data.reduce((data, byte) => data + String.fromCharCode(byte), '')
                                                    );
                                                    imageSource = `data:${bill.contentType};base64,${base64}`;
                                                } else if (typeof bill.data === 'string') {
                                                    // Already base64 string
                                                    imageSource = bill.data.startsWith('data:')
                                                        ? bill.data
                                                        : `data:${bill.contentType};base64,${bill.data}`;
                                                } else {
                                                    imageSource = bill.data;
                                                }

                                                return (
                                                    <div key={idx} className="relative bg-black rounded-lg overflow-hidden" style={{ height: '300px' }}>
                                                        <img
                                                            src={imageSource}
                                                            alt={`Bill Copy ${idx + 1}`}
                                                            className="w-full h-full object-contain"
                                                            onError={(e) => {
                                                                console.error('Image load error for bill:', bill);
                                                                e.target.style.display = 'none';
                                                            }}
                                                        />
                                                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                                                            {bill.fileName || `Bill ${idx + 1}`}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
export default ReportDetailsModal;