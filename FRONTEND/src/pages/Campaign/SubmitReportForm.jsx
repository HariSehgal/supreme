import React, { useState } from "react";
import Select from "react-select";
import { FiPlus, FiX } from "react-icons/fi";

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

const SubmitReportForm = ({ retailers, employees, onSubmit, onCancel, campaignId }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [retailer, setRetailer] = useState(null);
    const [employee, setEmployee] = useState(null);
    const [reportType, setReportType] = useState(null);
    const [frequency, setFrequency] = useState(null);
    const [notes, setNotes] = useState("");
    const [loadingEmployee, setLoadingEmployee] = useState(false);
    const [loadingRetailers, setLoadingRetailers] = useState(false);

    // Filtered options
    const [filteredEmployees, setFilteredEmployees] = useState([]);
    const [filteredRetailers, setFilteredRetailers] = useState([]);

    // Stock fields - change these from strings to state for Select components
    const [stockType, setStockType] = useState(null);
    const [brand, setBrand] = useState("");
    const [product, setProduct] = useState("");
    const [sku, setSku] = useState("");
    const [productType, setProductType] = useState(null);
    const [quantity, setQuantity] = useState("");

    // File uploads
    const [images, setImages] = useState([]);
    const [billCopies, setBillCopies] = useState([]);

    // Initialize filtered options
    React.useEffect(() => {
        setFilteredEmployees(employees);
        setFilteredRetailers(retailers);
    }, [employees, retailers]);

    // Fetch assigned employee when retailer is selected
    const fetchAssignedEmployee = async (retailerId) => {
        setLoadingEmployee(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(
                `https://supreme-419p.onrender.com/api/admin/campaign/${campaignId}/retailer/${retailerId}/employee`,
                {
                    method: "GET",
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            const data = await res.json();

            if (res.ok && data.isAssigned && data.employee) {
                // Find and set the employee from the employees list
                const assignedEmp = employees.find(emp => emp.value.toString() === data.employee._id.toString());
                if (assignedEmp) {
                    setEmployee(assignedEmp);
                    // Filter to show only this employee
                    setFilteredEmployees([assignedEmp]);
                } else {
                    setEmployee(null);
                    setFilteredEmployees([]);
                }
            } else {
                setEmployee(null);
                setFilteredEmployees([]);
            }
        } catch (err) {
            console.error("Error fetching assigned employee:", err);
            setEmployee(null);
            setFilteredEmployees([]);
        } finally {
            setLoadingEmployee(false);
        }
    };

    // Fetch assigned retailers when employee is selected
    const fetchAssignedRetailers = async (employeeId) => {
        setLoadingRetailers(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(
                `https://supreme-419p.onrender.com/api/admin/campaign/${campaignId}/employee-retailer-mapping`,
                {
                    method: "GET",
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            const data = await res.json();

            if (res.ok && data.employees) {
                // Find the employee and their retailers
                const empData = data.employees.find(e => e._id.toString() === employeeId.toString());

                if (empData && empData.retailers && empData.retailers.length > 0) {
                    // Filter retailers to show only assigned ones
                    const assignedRetailerIds = empData.retailers.map(r => r._id.toString());
                    const assignedRetailerOptions = retailers.filter(r =>
                        assignedRetailerIds.includes(r.value.toString())
                    );

                    setFilteredRetailers(assignedRetailerOptions);

                    // If employee has only one retailer, auto-select it
                    if (assignedRetailerOptions.length === 1) {
                        setRetailer(assignedRetailerOptions[0]);
                    } else {
                        setRetailer(null);
                    }
                } else {
                    setFilteredRetailers([]);
                    setRetailer(null);
                }
            }
        } catch (err) {
            console.error("Error fetching assigned retailers:", err);
            setFilteredRetailers([]);
        } finally {
            setLoadingRetailers(false);
        }
    };

    // Handle retailer change
    const handleRetailerChange = (selected) => {
        setRetailer(selected);
        if (selected) {
            fetchAssignedEmployee(selected.value);
        } else {
            setEmployee(null);
            setFilteredEmployees(employees); // Reset to all employees
        }
    };

    // Handle employee change
    const handleEmployeeChange = (selected) => {
        setEmployee(selected);
        if (selected) {
            fetchAssignedRetailers(selected.value);
        } else {
            setRetailer(null);
            setFilteredRetailers(retailers); // Reset to all retailers
        }
    };

    const handleImageChange = (e) => {
        const newFiles = Array.from(e.target.files || []);
        setImages((prevFiles) => [...prevFiles, ...newFiles]);
    };

    const removeImage = (index) => {
        setImages((prevFiles) => prevFiles.filter((_, i) => i !== index));
    };

    const handleBillCopyChange = (e) => {
        const newFiles = Array.from(e.target.files || []);
        setBillCopies((prevFiles) => [...prevFiles, ...newFiles]);
    };

    const removeBillCopy = (index) => {
        setBillCopies((prevFiles) => prevFiles.filter((_, i) => i !== index));
    };

    const isImage = (file) => file && ["image/png", "image/jpeg", "image/jpg"].includes(file.type);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!retailer || !employee || !reportType) {
            alert("Please fill required fields");
            return;
        }

        setIsSubmitting(true);

        const formData = new FormData();

        // Append basic fields
        formData.append("retailerId", retailer.value);
        formData.append("employeeId", employee.value);
        formData.append("reportType", reportType.value);
        formData.append("notes", notes);

        if (frequency) {
            formData.append("frequency", frequency.value);
        }

        // Append stock fields if stock type
        if (reportType.value === "stock") {
            formData.append("stockType", stockType?.value || "");
            formData.append("brand", brand);
            formData.append("product", product);
            formData.append("sku", sku);
            formData.append("productType", productType?.value || "");
            formData.append("quantity", quantity);

            // Append bill copies if exist
            billCopies.forEach((billCopy) => {
                formData.append("billCopy", billCopy);
            });
        }

        // Append images for window or others
        if (reportType.value === "window" || reportType.value === "others") {
            images.forEach((image) => {
                formData.append("images", image);
            });
        }

        try {
            await onSubmit(formData);
        } catch (error) {
            console.error("Submit error:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block font-medium mb-1">Retailer *</label>
                <Select
                    styles={customSelectStyles}
                    options={filteredRetailers}
                    value={retailer}
                    onChange={handleRetailerChange}
                    placeholder="Select Retailer"
                    isSearchable
                    isLoading={loadingRetailers}
                    isClearable
                />
                {filteredRetailers.length === 0 && employee && (
                    <p className="text-sm text-red-500 mt-1">No retailers assigned to this employee</p>
                )}
            </div>

            <div>
                <label className="block font-medium mb-1">
                    Employee * {loadingEmployee && <span className="text-sm text-gray-500">(Loading...)</span>}
                </label>
                <Select
                    styles={customSelectStyles}
                    options={filteredEmployees}
                    value={employee}
                    onChange={handleEmployeeChange}
                    placeholder="Select Employee"
                    isSearchable
                    isLoading={loadingEmployee}
                    isClearable
                />
                {filteredEmployees.length === 0 && retailer && (
                    <p className="text-sm text-red-500 mt-1">No employee assigned to this retailer</p>
                )}
            </div>

            {/* Rest of the form remains the same... */}
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

            <div>
                <label className="block font-medium mb-1">Frequency</label>
                <Select
                    styles={customSelectStyles}
                    options={frequencyOptions}
                    value={frequency}
                    onChange={setFrequency}
                    placeholder="Select Frequency"
                    isSearchable
                />
            </div>

            {/* STOCK REPORT */}
            {reportType?.value === "stock" && (
                <div className="space-y-3 bg-gray-50 p-4 rounded-md border">
                    <div>
                        <Select
                            styles={customSelectStyles}
                            options={stockTypeOptions}
                            value={stockType}
                            onChange={setStockType}
                            placeholder="Select Stock Type"
                            isSearchable
                        />
                    </div>

                    <input
                        type="text"
                        placeholder="Brand"
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                        className="border rounded p-2 w-full"
                    />
                    <input
                        type="text"
                        placeholder="Product"
                        value={product}
                        onChange={(e) => setProduct(e.target.value)}
                        className="border rounded p-2 w-full"
                    />
                    <input
                        type="text"
                        placeholder="SKU"
                        value={sku}
                        onChange={(e) => setSku(e.target.value)}
                        className="border rounded p-2 w-full"
                    />

                    <div>
                        <Select
                            styles={customSelectStyles}
                            options={productTypeOptions}
                            value={productType}
                            onChange={setProductType}
                            placeholder="Select Product Type"
                            isSearchable
                        />
                    </div>

                    <input
                        type="number"
                        placeholder="Quantity"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        className="border rounded p-2 w-full"
                    />

                    {/* Bill Copy */}
                    <div>
                        <label className="block font-medium mb-1">Bill Copies <span className="text-red-500">(Multiple Images Allowed)</span></label>
                        <label className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:border-[#E4002B]">
                            <FiPlus className="text-3xl text-gray-400" />
                            <span>Click or drop files here to add bill copies</span>
                            <input
                                type="file"
                                accept="image/*, application/pdf"
                                multiple
                                className="hidden"
                                onChange={handleBillCopyChange}
                            />
                        </label>

                        {billCopies.length > 0 && (
                            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                                {billCopies.map((file, index) => (
                                    <div
                                        key={index}
                                        className="relative border-2 border-dashed rounded-lg overflow-hidden bg-gray-50 group"
                                    >
                                        {isImage(file) ? (
                                            <img
                                                src={URL.createObjectURL(file)}
                                                className="w-full h-32 object-cover"
                                                alt={`bill-preview-${index}`}
                                            />
                                        ) : (
                                            <div className="w-full h-32 flex items-center justify-center bg-gray-100">
                                                <p className="text-sm text-gray-600 px-2 text-center">
                                                    {file?.name && file.name.length > 20
                                                        ? file.name.substring(0, 17) + "..."
                                                        : file?.name}
                                                </p>
                                            </div>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => removeBillCopy(index)}
                                            className="absolute top-1 right-1 bg-[#E4002B] text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <FiX size={16} />
                                        </button>
                                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 text-center">
                                            {file?.name && file.name.length > 15
                                                ? file.name.substring(0, 12) + "..."
                                                : file?.name}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {billCopies.length > 0 && (
                            <p className="text-sm text-gray-600 mt-3">
                                {billCopies.length} bill cop{billCopies.length !== 1 ? "ies" : "y"} uploaded
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* WINDOW DISPLAY */}
            {reportType?.value === "window" && (
                <div>
                    <label className="block font-medium mb-1">Upload Shop Display Images <span className="text-red-500">(Multiple Images Allowed)</span></label>
                    <label className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:border-[#E4002B]">
                        <FiPlus className="text-3xl text-gray-400" />
                        <span>Click or drop files here to add more images</span>
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={handleImageChange}
                        />
                    </label>

                    {images.length > 0 && (
                        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                            {images.map((file, index) => (
                                <div
                                    key={index}
                                    className="relative border-2 border-dashed rounded-lg overflow-hidden bg-gray-50 group"
                                >
                                    <img
                                        src={URL.createObjectURL(file)}
                                        className="w-full h-32 object-cover"
                                        alt={`preview-${index}`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(index)}
                                        className="absolute top-1 right-1 bg-[#E4002B] text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <FiX size={16} />
                                    </button>
                                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 text-center">
                                        {file?.name && file.name.length > 15
                                            ? file.name.substring(0, 12) + "..."
                                            : file?.name}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {images.length > 0 && (
                        <p className="text-sm text-gray-600 mt-3">
                            {images.length} image{images.length !== 1 ? "s" : ""} uploaded
                        </p>
                    )}
                </div>
            )}

            {/* OTHERS */}
            {reportType?.value === "others" && (
                <div>
                    <label className="block font-medium mb-1">Upload File</label>
                    {images.length === 0 ? (
                        <label className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:border-[#E4002B]">
                            <FiPlus className="text-3xl text-gray-400" />
                            <span>Click or drop file here</span>
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageChange}
                            />
                        </label>
                    ) : (
                        <div className="border-2 border-dashed rounded-lg p-4 text-center">
                            {isImage(images[0]) ? (
                                <img
                                    src={URL.createObjectURL(images[0])}
                                    className="w-28 h-28 mx-auto rounded"
                                    alt="preview"
                                />
                            ) : (
                                <p className="text-sm">{images[0]?.name}</p>
                            )}
                            <button
                                type="button"
                                className="flex items-center gap-1 text-[#E4002B] mt-2 mx-auto"
                                onClick={() => setImages([])}
                            >
                                <FiX /> Remove
                            </button>
                        </div>
                    )}
                </div>
            )}

            <div>
                <label className="block font-medium mb-1">Notes</label>
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="border rounded p-2 w-full"
                    rows="3"
                    placeholder="Add any notes..."
                />
            </div>

            <div className="flex gap-3 justify-end pt-4">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-[#E4002B] text-white rounded-md hover:bg-[#C3002B] disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? "Submitting..." : "Submit Report"}
                </button>
            </div>
        </form>
    );
};

export default SubmitReportForm;


