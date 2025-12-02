import React, { useState, useEffect } from "react";
import Select from "react-select";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import SubmitReportForm from "./SubmitReportForm";
import ReportDetailsModal from "./ReportDetailsModal";

const customSelectStyles = {
    control: (provided, state) => ({
        ...provided,
        borderColor: state.isFocused ? "#E4002B" : "#d1d5db",
        boxShadow: state.isFocused ? "0 0 0 1px #E4002B" : "none",
        "&:hover": { borderColor: "#E4002B" },
        minHeight: "42px",
    }),
    option: (provided, state) => ({
        ...provided,
        backgroundColor: state.isFocused ? "#FEE2E2" : "white",
        color: "#333",
        "&:active": { backgroundColor: "#FECACA" },
    }),
    menu: (provided) => ({
        ...provided,
        zIndex: 20,
    }),
};

const ManageReports = () => {
    // Campaign Selection
    const [campaigns, setCampaigns] = useState([]);
    const [selectedCampaign, setSelectedCampaign] = useState(null);
    const [loadingCampaigns, setLoadingCampaigns] = useState(true);

    // Retailer Selection for filtering
    const [selectedRetailer, setSelectedRetailer] = useState(null);
    const [availableRetailers, setAvailableRetailers] = useState([]);

    // Employee Selection for filtering
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [availableEmployees, setAvailableEmployees] = useState([]);

    // Date Range Filter
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");

    // State Filter
    const [selectedState, setSelectedState] = useState(null);
    const [availableStates, setAvailableStates] = useState([]);

    // Data
    const [displayReports, setDisplayReports] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [retailers, setRetailers] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [modalLoading, setModalLoading] = useState(false);

    // Report Details Modal
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedReport, setSelectedReport] = useState(null);

    // ✅ Fetch Campaigns
    useEffect(() => {
        fetchCampaigns();
    }, []);

    const fetchCampaigns = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(
                "https://supreme-419p.onrender.com/api/admin/campaigns",
                {
                    method: "GET",
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.message || "Error fetching campaigns", {
                    theme: "dark",
                });
                return;
            }

            const activeCampaigns = (data.campaigns || []).filter(
                (c) => c.isActive === true
            );

            const campaignOptions = activeCampaigns.map((c) => ({
                value: c._id,
                label: c.name,
                data: c,
            }));

            setCampaigns(campaignOptions);
        } catch (err) {
            console.log("Campaign Fetch Error:", err);
            toast.error("Failed to load campaigns", { theme: "dark" });
        } finally {
            setLoadingCampaigns(false);
        }
    };

    const fetchRetailersAndEmployees = async (campaignId) => {
        setModalLoading(true);
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

            if (res.ok) {
                // Extract all unique retailers from the mapping
                const retailerSet = new Set();
                const retailerData = [];
                const stateSet = new Set();

                data.employees.forEach(emp => {
                    if (emp.retailers && emp.retailers.length > 0) {
                        emp.retailers.forEach(retailer => {
                            if (!retailerSet.has(retailer._id)) {
                                retailerSet.add(retailer._id);
                                retailerData.push(retailer);

                                // Extract state
                                const state = retailer.shopDetails?.shopAddress?.state;
                                if (state) {
                                    stateSet.add(state);
                                }
                            }
                        });
                    }
                });

                // Format retailers: Outlet Name • Outlet Code • Retailer Name
                const formattedRetailers = retailerData.map(r => {
                    const outletName = r.shopDetails?.shopName || 'N/A';
                    const outletCode = r.uniqueId || 'N/A';
                    const retailerName = r.name || 'N/A';
                    const label = `${outletName} • ${outletCode} • ${retailerName}`;

                    return {
                        value: r._id,
                        label: label,
                        data: r
                    };
                });

                // Format employees: Employee Name • Employee Code (only employees with retailers)
                const formattedEmployees = data.employees.map(e => {
                    const employeeName = e.name || 'N/A';
                    const employeeCode = e.employeeId || 'N/A';
                    const label = `${employeeName} • ${employeeCode}`;

                    return {
                        value: e._id,
                        label: label,
                        data: e
                    };
                });

                // Format states
                const formattedStates = Array.from(stateSet).map(state => ({
                    value: state,
                    label: state
                }));

                setRetailers(formattedRetailers);
                setEmployees(formattedEmployees);
                setAvailableRetailers(formattedRetailers);
                setAvailableStates(formattedStates);
                setAvailableEmployees(formattedEmployees);
            }
        } catch (err) {
            console.error("Error fetching retailers/employees:", err);
            toast.error("Failed to load retailers and employees", { theme: "dark" });
        } finally {
            setModalLoading(false);
        }
    };

    // ✅ Fetch Reports for Retailer
    const fetchRetailerReports = async () => {
        if (!selectedCampaign) {
            toast.error("Please select a campaign first", { theme: "dark" });
            return;
        }

        setLoading(true);
        setHasSearched(true);

        try {
            const token = localStorage.getItem("token");

            // Build query params
            const params = new URLSearchParams();
            params.append("campaignId", selectedCampaign.value);

            if (selectedRetailer) {
                params.append("retailerId", selectedRetailer.value);
            }
            if (selectedEmployee) {
                params.append("employeeId", selectedEmployee.value);
            }
            if (fromDate) {
                params.append("fromDate", fromDate);
            }
            if (fromDate) {
                params.append("fromDate", fromDate);
            }
            if (toDate) {
                params.append("toDate", toDate);
            }

            const res = await fetch(
                `https://supreme-419p.onrender.com/api/admin/reports/campaign-retailers?${params.toString()}`,
                {
                    method: "GET",
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.message || "Error fetching reports", {
                    theme: "dark",
                });
                setDisplayReports([]);
                return;
            }

            let reports = data.reports || [];

            // Client-side filter by state if selected
            if (selectedState) {
                reports = reports.filter(report =>
                    report.shopState === selectedState.value
                );
            }

            if (selectedEmployee) {
                reports = reports.filter(report =>
                    report.employeeId?._id === selectedEmployee.value ||
                    report.employeeId === selectedEmployee.value
                );
            }

            setDisplayReports(reports);

            if (reports.length === 0) {
                toast.info("No reports found for the selected filters", {
                    theme: "dark",
                });
            } else {
                toast.success(`Found ${reports.length} report(s)`, {
                    theme: "dark",
                });
            }
        } catch (err) {
            console.log("Reports Fetch Error:", err);
            toast.error("Failed to load reports", { theme: "dark" });
            setDisplayReports([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitReport = async (formData) => {
        try {
            const token = localStorage.getItem("token");

            // Add campaignId to formData
            formData.append("campaignId", selectedCampaign.value);

            const res = await fetch(
                "https://supreme-419p.onrender.com/api/admin/admin/reports",
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: formData,
                }
            );

            const data = await res.json();

            if (res.ok) {
                toast.success("Report submitted successfully", { theme: "dark" });
                setShowModal(false);
                // Refresh reports if already searched
                if (hasSearched) {
                    fetchRetailerReports();
                }
            } else {
                toast.error(data.message || "Failed to submit report", { theme: "dark" });
            }
        } catch (err) {
            console.error("Submit report error:", err);
            toast.error("Failed to submit report", { theme: "dark" });
        }
    };

    // ✅ Handle Campaign Change
    const handleCampaignChange = (selected) => {
        setSelectedCampaign(selected);
        setSelectedRetailer(null);
        setSelectedEmployee(null);
        setSelectedState(null);
        setFromDate("");
        setToDate("");
        setDisplayReports([]);
        setHasSearched(false);
        setAvailableRetailers([]);
        setAvailableEmployees([]);
        setAvailableStates([]);

        if (selected) {
            fetchRetailersAndEmployees(selected.value);
        }
    };

    // Clear all filters
    const handleClearFilters = () => {
        setSelectedRetailer(null);
        setSelectedEmployee(null);
        setSelectedState(null);
        setFromDate("");
        setToDate("");
        setDisplayReports([]);
        setHasSearched(false);
    };

    const formatValue = (value) => {
        if (Array.isArray(value)) {
            return value.join(", ");
        }
        return value || "N/A";
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    // Handle View Details
    const handleViewDetails = (report) => {
        setSelectedReport(report);
        setShowDetailsModal(true);
    };

    // Handle Update Report
    const handleUpdateReport = async (reportId, formData) => {
        try {
            const token = localStorage.getItem("token");

            const res = await fetch(
                `https://supreme-419p.onrender.com/api/admin/reports/${reportId}`,
                {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: formData,
                }
            );

            const data = await res.json();

            if (res.ok) {
                toast.success("Report updated successfully", { theme: "dark" });
                setShowDetailsModal(false);
                // Refresh reports
                if (hasSearched) {
                    fetchRetailerReports();
                }
            } else {
                toast.error(data.message || "Failed to update report", { theme: "dark" });
            }
        } catch (err) {
            console.error("Update report error:", err);
            toast.error("Failed to update report", { theme: "dark" });
        }
    };

    // Handle Delete Report
    const handleDeleteReport = async (reportId) => {
        if (!window.confirm("Are you sure you want to delete this report?")) {
            return;
        }

        try {
            const token = localStorage.getItem("token");

            const res = await fetch(
                `https://supreme-419p.onrender.com/api/admin/reports/${reportId}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await res.json();

            if (res.ok) {
                toast.success("Report deleted successfully", { theme: "dark" });
                setShowDetailsModal(false);
                // Refresh reports
                if (hasSearched) {
                    fetchRetailerReports();
                }
            } else {
                toast.error(data.message || "Failed to delete report", { theme: "dark" });
            }
        } catch (err) {
            console.error("Delete report error:", err);
            toast.error("Failed to delete report", { theme: "dark" });
        }
    };

    return (
        <>
            <ToastContainer position="top-right" autoClose={3000} />
            <div className="min-h-screen bg-[#171717] p-6">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-3xl font-bold text-[#E4002B] mb-8">
                        Manage Reports
                    </h1>

                    {/* Select Campaign */}
                    <div className="bg-[#EDEDED] rounded-lg shadow-md p-6 mb-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold text-gray-700">
                                Select Campaign *
                            </h2>
                            {selectedCampaign && (
                                <button
                                    onClick={() => {
                                        setShowModal(true);
                                        if (retailers.length === 0) {
                                            fetchRetailersAndEmployees(selectedCampaign.value);
                                        }
                                    }}
                                    className="bg-[#E4002B] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#C3002B] transition flex items-center gap-2"
                                >
                                    <span>+</span> Add Report
                                </button>
                            )}
                        </div>
                        <Select
                            value={selectedCampaign}
                            onChange={handleCampaignChange}
                            options={campaigns}
                            isLoading={loadingCampaigns}
                            styles={customSelectStyles}
                            placeholder="Choose a campaign"
                            isSearchable
                            className="max-w-md"
                        />
                        {selectedCampaign && (
                            <div className="mt-4 p-4 bg-gray-50 rounded-lg text-sm">
                                <p>
                                    <strong>Client:</strong>{" "}
                                    {selectedCampaign.data.client}
                                </p>
                                <p>
                                    <strong>Type:</strong>{" "}
                                    {selectedCampaign.data.type}
                                </p>
                                <p>
                                    <strong>Region(s):</strong>{" "}
                                    {formatValue(selectedCampaign.data.regions)}
                                </p>
                                <p>
                                    <strong>State(s):</strong>{" "}
                                    {formatValue(selectedCampaign.data.states)}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Filters - Only for Retailer */}
                    {selectedCampaign && (
                        <div className="bg-[#EDEDED] rounded-lg shadow-md p-6 mb-6">
                            <h2 className="text-lg font-semibold mb-4 text-gray-700">
                                Filter Reports
                            </h2>

                            {/* First Row - State, Retailer, Employee */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        State (Optional)
                                    </label>
                                    <Select
                                        value={selectedState}
                                        onChange={setSelectedState}
                                        options={availableStates}
                                        styles={customSelectStyles}
                                        placeholder="Select state"
                                        isSearchable
                                        isClearable
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Retailer (Optional)
                                    </label>
                                    <Select
                                        value={selectedRetailer}
                                        onChange={setSelectedRetailer}
                                        options={availableRetailers}
                                        styles={customSelectStyles}
                                        placeholder="Select retailer"
                                        isSearchable
                                        isClearable
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Employee (Optional)
                                    </label>
                                    <Select
                                        value={selectedEmployee}
                                        onChange={setSelectedEmployee}
                                        options={availableEmployees}
                                        styles={customSelectStyles}
                                        placeholder="Select employee"
                                        isSearchable
                                        isClearable
                                    />
                                </div>
                            </div>

                            {/* Second Row - Date Filters */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        From Date (Optional)
                                    </label>
                                    <input
                                        type="date"
                                        value={fromDate}
                                        onChange={(e) => setFromDate(e.target.value)}
                                        className="w-full px-4 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-red-600 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        To Date (Optional)
                                    </label>
                                    <input
                                        type="date"
                                        value={toDate}
                                        onChange={(e) => setToDate(e.target.value)}
                                        className="w-full px-4 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-red-600 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={fetchRetailerReports}
                                    disabled={loading}
                                    className="bg-[#E4002B] text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-[#C3002B] transition disabled:bg-gray-400"
                                >
                                    {loading ? "Searching..." : "Search Reports"}
                                </button>

                                {(selectedRetailer || selectedEmployee || selectedState || fromDate || toDate) && (
                                    <button
                                        onClick={handleClearFilters}
                                        className="text-sm text-red-600 underline hover:text-red-800"
                                    >
                                        Clear Filters
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Display Table */}
                    {!loading && hasSearched && displayReports.length > 0 && (
                        <div className="bg-[#EDEDED] rounded-lg shadow-md p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-lg font-semibold text-gray-700">
                                    Reports ({displayReports.length} found)
                                </h2>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">
                                                Report Type
                                            </th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">
                                                Retailer Name
                                            </th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">
                                                Shop Name
                                            </th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">
                                                Location
                                            </th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">
                                                Employee
                                            </th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">
                                                Submitted By
                                            </th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">
                                                Date
                                            </th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {displayReports.map((report, index) => (
                                            <tr
                                                key={report._id}
                                                className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"
                                                    } hover:bg-gray-100 transition`}
                                            >
                                                <td className="px-4 py-3 text-sm text-gray-800 border-b">
                                                    {report.reportType || "N/A"}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-800 border-b">
                                                    <div>{report.retailerName}</div>
                                                    <div className="text-xs text-gray-500">
                                                        {report.retailerCode || report.retailerUniqueId}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-800 border-b">
                                                    {report.shopName || "N/A"}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-800 border-b">
                                                    <div>{report.shopCity}</div>
                                                    <div className="text-xs text-gray-500">
                                                        {report.shopState}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-800 border-b">
                                                    <div>{report.employeeName || "N/A"}</div>
                                                    <div className="text-xs text-gray-500">
                                                        {report.employeePhone || ""}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-800 border-b">
                                                    {report.submittedByRole || "N/A"}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-800 border-b">
                                                    {formatDate(report.createdAt)}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-800 border-b">
                                                    <button
                                                        onClick={() => handleViewDetails(report)}
                                                        className="text-[#E4002B] hover:underline"
                                                    >
                                                        View Details
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {loading && (
                        <div className="text-center py-8 text-gray-200">
                            Loading reports...
                        </div>
                    )}

                    {!loading && hasSearched && displayReports.length === 0 && (
                        <div className="text-center py-8 text-gray-500 bg-[#EDEDED] rounded-lg">
                            No reports found for the selected filters. Try adjusting your search criteria.
                        </div>
                    )}

                    {!hasSearched && selectedCampaign && (
                        <div className="text-center py-8 text-gray-400 bg-[#EDEDED] rounded-lg">
                            Click "Search Reports" to view reports for this campaign
                        </div>
                    )}
                </div>
            </div>

            {/* Add Report Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-2xl font-bold text-[#E4002B]">
                                    Add Report
                                </h2>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <span className="text-2xl">&times;</span>
                                </button>
                            </div>

                            {modalLoading ? (
                                <div className="text-center py-8">Loading...</div>
                            ) : (
                                <SubmitReportForm
                                    retailers={retailers}
                                    employees={employees}
                                    campaignId={selectedCampaign.value}
                                    onSubmit={handleSubmitReport}
                                    onCancel={() => setShowModal(false)}
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Report Details Modal */}
            {showDetailsModal && selectedReport && (
                <ReportDetailsModal
                    report={selectedReport}
                    onClose={() => setShowDetailsModal(false)}
                    onUpdate={handleUpdateReport}
                    onDelete={handleDeleteReport}
                />
            )}
        </>
    );
};

export default ManageReports;