import React, { useState, useEffect } from "react";
import Select from "react-select";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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

    // Party Type Selection
    const [partyType, setPartyType] = useState(null);

    // State Filter
    const [selectedState, setSelectedState] = useState(null);
    const [availableStates, setAvailableStates] = useState([]);

    // Search Query
    const [searchQuery, setSearchQuery] = useState("");

    // Data
    const [allReports, setAllReports] = useState([]);
    const [displayCards, setDisplayCards] = useState([]);
    const [loading, setLoading] = useState(false);

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

    // ✅ Fetch Reports from Backend
    // ✅ Fetch Reports from Backend
    const fetchReports = async () => {
        if (!selectedCampaign) return;

        setLoading(true);
        try {
            const token = localStorage.getItem("token");

            // Build query params
            const params = new URLSearchParams();
            params.append("campaignId", selectedCampaign.value);

            // ✅ FIX: Add the query params to the URL
            const res = await fetch(
                `https://supreme-419p.onrender.com/api/admin/employee/reports?${params.toString()}`,
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
                setAllReports([]);
                return;
            }

            const reports = data.reports || [];
            console.log("Fetched reports:", reports); // Debug log
            setAllReports(reports);

            toast.success(`Loaded ${reports.length} reports`, {
                theme: "dark",
            });
        } catch (err) {
            console.log("Reports Fetch Error:", err);
            toast.error("Failed to load reports", { theme: "dark" });
            setAllReports([]);
        } finally {
            setLoading(false);
        }
    };

    // ✅ Extract unique states from reports (only states where reports exist)
    const extractUniqueStates = (reports) => {
        const states = [
            ...new Set(
                reports
                    .map((r) => r.retailerId?.shopDetails?.shopAddress?.state)
                    .filter(Boolean)
            ),
        ];
        return states.map((s) => ({ label: s, value: s }));
    };

    // ✅ Apply Filters
    const applyFilters = () => {
        let filtered = [...allReports];

        // Filter by campaign states (if campaign restricts states)
        if (selectedCampaign?.data?.states) {
            const allowedStates = selectedCampaign.data.states;
            if (
                !allowedStates.includes("All") &&
                !allowedStates.includes("All States")
            ) {
                filtered = filtered.filter((r) =>
                    allowedStates.includes(
                        r.retailerId?.shopDetails?.shopAddress?.state
                    )
                );
            }
        }

        // Update available states based on filtered reports
        const uniqueStates = extractUniqueStates(filtered);
        setAvailableStates(uniqueStates);

        // Filter by selected state
        if (selectedState) {
            filtered = filtered.filter(
                (r) =>
                    r.retailerId?.shopDetails?.shopAddress?.state ===
                    selectedState.value
            );
        }

        // Filter by search query
        if (searchQuery.trim() !== "") {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter((r) => {
                const retailerName = r.retailerId?.name?.toLowerCase() || "";
                const retailerCode =
                    r.retailerId?.uniqueId?.toLowerCase() || "";
                const employeeName = r.employeeId?.name?.toLowerCase() || "";
                const employeeId =
                    r.employeeId?.employeeId?.toLowerCase() || "";

                if (partyType === "retailer") {
                    return (
                        retailerName.includes(query) ||
                        retailerCode.includes(query)
                    );
                } else {
                    return (
                        employeeName.includes(query) ||
                        employeeId.includes(query)
                    );
                }
            });
        }

        setDisplayCards(filtered);

        if (filtered.length === 0 && (searchQuery || selectedState)) {
            toast.info("No results match your search/filter.", {
                theme: "dark",
            });
        }
    };

    // ✅ Fetch reports when campaign changes
    useEffect(() => {
        if (selectedCampaign && partyType) {
            fetchReports();
        }
    }, [selectedCampaign, partyType]);

    // ✅ Apply filters when dependencies change
    useEffect(() => {
        if (allReports.length > 0) {
            applyFilters();
        }
    }, [allReports, selectedState, searchQuery]);

    // ✅ Handle Campaign Change
    const handleCampaignChange = (selected) => {
        setSelectedCampaign(selected);
        setPartyType(null);
        setSelectedState(null);
        setSearchQuery("");
        setDisplayCards([]);
        setAllReports([]);
        setAvailableStates([]);
    };

    // ✅ Handle Party Type Change
    const handlePartyTypeChange = (selected) => {
        setPartyType(selected.value);
        setSelectedState(null);
        setSearchQuery("");
        setDisplayCards([]);
    };

    // ✅ Handle View Details
    const handleViewDetails = (reportId) => {
        console.log("View details for report:", reportId);
        toast.info(`Viewing details for report ${reportId}`, { theme: "dark" });
        // Navigate to report details page or open modal
        // Example: navigate(`/reports/${reportId}`);
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

    // ✅ Get display name based on party type
    const getDisplayName = (report) => {
        if (partyType === "retailer") {
            // Retailer is populated correctly
            if (
                typeof report.retailerId === "object" &&
                report.retailerId !== null
            ) {
                return report.retailerId.name || "N/A";
            }
            return "N/A";
        } else {
            // Employee is NOT populated - it's just an ID string
            if (
                typeof report.employeeId === "object" &&
                report.employeeId !== null
            ) {
                return report.employeeId.name || "N/A";
            }
            // Fallback: Show employee ID until backend is fixed
            return `Employee (${report.employeeId})`;
        }
    };

    // ✅ Get report type display
    const getReportType = (report) => {
        return report.reportType || report.campaignId?.type || "General Report";
    };

    return (
        <>
            <ToastContainer position="top-right" autoClose={3000} />
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-3xl font-bold text-gray-800 mb-8">
                        Manage Reports
                    </h1>

                    {/* Select Campaign */}
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                        <h2 className="text-lg font-semibold mb-4 text-gray-700">
                            Select Campaign *
                        </h2>
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

                    {/* Select Type of Party */}
                    {selectedCampaign && (
                        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                            <h2 className="text-lg font-semibold mb-4 text-gray-700">
                                Select Type of Party *
                            </h2>
                            <Select
                                value={
                                    partyType
                                        ? {
                                              label:
                                                  partyType === "retailer"
                                                      ? "Retailer"
                                                      : "Employee",
                                              value: partyType,
                                          }
                                        : null
                                }
                                onChange={handlePartyTypeChange}
                                options={[
                                    { label: "Retailer", value: "retailer" },
                                    { label: "Employee", value: "employee" },
                                ]}
                                styles={customSelectStyles}
                                className="max-w-md"
                                placeholder="Select party type"
                            />
                        </div>
                    )}

                    {/* State Filter & Search */}
                    {partyType && (
                        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                            <h2 className="text-lg font-semibold mb-4 text-gray-700">
                                Filter Reports
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        State
                                    </label>
                                    <Select
                                        value={selectedState}
                                        onChange={setSelectedState}
                                        options={availableStates}
                                        styles={customSelectStyles}
                                        placeholder="Select state"
                                        isSearchable
                                        isClearable
                                        isDisabled={
                                            loading ||
                                            availableStates.length === 0
                                        }
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Search
                                    </label>
                                    <input
                                        type="text"
                                        placeholder={`Search by ${
                                            partyType === "retailer"
                                                ? "Retailer Code / Name"
                                                : "Employee ID / Name"
                                        }`}
                                        value={searchQuery}
                                        onChange={(e) =>
                                            setSearchQuery(e.target.value)
                                        }
                                        className="w-full px-4 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-red-600 focus:outline-none"
                                    />
                                </div>
                            </div>

                            {(searchQuery || selectedState) && (
                                <button
                                    onClick={() => {
                                        setSearchQuery("");
                                        setSelectedState(null);
                                    }}
                                    className="text-sm text-red-600 underline hover:text-red-800"
                                >
                                    Clear Filters
                                </button>
                            )}
                        </div>
                    )}

                    {/* Display Cards */}
                    {!loading && displayCards.length > 0 && (
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-lg font-semibold text-gray-700">
                                    Reports ({displayCards.length} found)
                                </h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {displayCards.map((report) => (
                                    <div
                                        key={report._id}
                                        className="bg-white shadow-md rounded-xl border border-gray-200 p-6 hover:shadow-lg transition h-full flex flex-col justify-between"
                                    >
                                        <div>
                                            {/* Name (Retailer or Employee based on party type) */}
                                            <h2 className="text-xl font-bold text-gray-800 mb-3">
                                                {getDisplayName(report)}
                                            </h2>

                                            {/* Type of Report */}
                                            <p className="text-gray-600 mb-2">
                                                <strong>Report Type:</strong>{" "}
                                                {getReportType(report)}
                                            </p>

                                            {/* Last Updated */}
                                            <p className="text-gray-600 mb-2">
                                                <strong>Last Updated:</strong>{" "}
                                                {formatDate(
                                                    report.updatedAt ||
                                                        report.createdAt
                                                )}
                                            </p>
                                        </div>

                                        {/* Divider */}
                                        <div className="w-full h-[1px] bg-gray-200 my-4"></div>

                                        {/* View Details Button */}
                                        <button
                                            onClick={() =>
                                                handleViewDetails(report._id)
                                            }
                                            className="w-full bg-[#E4002B] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#C3002B] transition"
                                        >
                                            View Details
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {loading && (
                        <div className="text-center py-8 text-gray-500">
                            Loading reports...
                        </div>
                    )}

                    {!loading &&
                        displayCards.length === 0 &&
                        partyType &&
                        allReports.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                                No reports found for this campaign. Try
                                selecting a different campaign.
                            </div>
                        )}

                    {!loading &&
                        displayCards.length === 0 &&
                        partyType &&
                        allReports.length > 0 && (
                            <div className="text-center py-8 text-gray-500">
                                No reports match your filters. Try adjusting
                                your search criteria.
                            </div>
                        )}
                </div>
            </div>
        </>
    );
};

export default ManageReports;
