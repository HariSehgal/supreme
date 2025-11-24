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

const ScheduleUnscheduleTask = () => {
    const [campaigns, setCampaigns] = useState([]);
    const [selectedCampaign, setSelectedCampaign] = useState(null);
    const [loadingCampaigns, setLoadingCampaigns] = useState(true);

    const [assignedPairs, setAssignedPairs] = useState([]);
    const [filteredPairs, setFilteredPairs] = useState([]);
    const [loadingAssignedData, setLoadingAssignedData] = useState(false);

    // Filters
    const [stateFilter, setStateFilter] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");

    // Fetch Campaigns
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

    const handleCampaignChange = async (selected) => {
        setSelectedCampaign(selected);

        if (!selected) {
            setAssignedPairs([]);
            setFilteredPairs([]);
            setStateFilter(null);
            setSearchQuery("");
            return;
        }

        setLoadingAssignedData(true);
        setAssignedPairs([]);
        setFilteredPairs([]);
        setStateFilter(null);
        setSearchQuery("");

        try {
            const token = localStorage.getItem("token");

            // Use the correct endpoint
            const res = await fetch(
                `https://supreme-419p.onrender.com/api/admin/campaign/${selected.value}/employee-retailer-mapping`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.message || "Error loading campaign data", {
                    theme: "dark",
                });
                return;
            }

            // Transform the nested structure into flat pairs
            const pairs = [];

            if (data.employees && Array.isArray(data.employees)) {
                data.employees.forEach((employee) => {
                    if (
                        employee.retailers &&
                        Array.isArray(employee.retailers)
                    ) {
                        employee.retailers.forEach((retailer) => {
                            pairs.push({
                                employee: {
                                    _id: employee._id,
                                    employeeId: employee.employeeId,
                                    name: employee.name,
                                    email: employee.email,
                                    phone: employee.phone,
                                    position: employee.position,
                                },
                                retailer: {
                                    _id: retailer._id,
                                    uniqueId: retailer.uniqueId,
                                    name: retailer.name,
                                    contactNo: retailer.contactNo,
                                    shopDetails: retailer.shopDetails,
                                },
                                assignedAt: retailer.assignedAt,
                            });
                        });
                    }
                });
            }

            setAssignedPairs(pairs);
            setFilteredPairs(pairs);
        } catch (err) {
            console.error("Fetch error:", err);
            toast.error("Server error. Try again.", { theme: "dark" });
        } finally {
            setLoadingAssignedData(false);
        }
    };

    // Filter pairs based on state and search query
    useEffect(() => {
        if (!assignedPairs.length) {
            setFilteredPairs([]);
            return;
        }

        let filtered = [...assignedPairs];

        // State Filter
        if (stateFilter) {
            filtered = filtered.filter(
                (pair) =>
                    pair.retailer?.shopDetails?.shopAddress?.state ===
                    stateFilter.value
            );
        }

        // Search Filter
        if (searchQuery.trim() !== "") {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (pair) =>
                    pair.retailer?.uniqueId?.toLowerCase().includes(query) ||
                    pair.retailer?.shopDetails?.shopName
                        ?.toLowerCase()
                        .includes(query) ||
                    pair.employee?.employeeId?.toLowerCase().includes(query) ||
                    pair.employee?.name?.toLowerCase().includes(query)
            );
        }

        setFilteredPairs(filtered);
    }, [stateFilter, searchQuery, assignedPairs]);

    const handleTaskClick = (pair) => {
        console.log("Task clicked for:", pair);
        toast.info(
            `Task for ${pair.retailer?.shopDetails?.shopName} - ${pair.employee?.name}`,
            { theme: "dark" }
        );
    };

    return (
        <>
            <ToastContainer position="top-right" autoClose={3000} />
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-3xl font-bold text-gray-800 mb-8">
                        Schedule / Unschedule Task
                    </h1>

                    {/* Campaign Selection */}
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
                            isClearable
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
                                    {Array.isArray(
                                        selectedCampaign.data.regions
                                    )
                                        ? selectedCampaign.data.regions.join(
                                              ", "
                                          )
                                        : selectedCampaign.data.region || "N/A"}
                                </p>
                                <p>
                                    <strong>State(s):</strong>{" "}
                                    {Array.isArray(selectedCampaign.data.states)
                                        ? selectedCampaign.data.states.join(
                                              ", "
                                          )
                                        : selectedCampaign.data.state || "N/A"}
                                </p>
                            </div>
                        )}
                    </div>

                    {selectedCampaign && (
                        <>
                            {/* Filters */}
                            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                                <h2 className="text-lg font-semibold mb-4 text-gray-700">
                                    Filters
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* State Filter */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            State
                                        </label>
                                        <Select
                                            value={stateFilter}
                                            onChange={setStateFilter}
                                            options={[
                                                ...new Set(
                                                    assignedPairs
                                                        .map(
                                                            (pair) =>
                                                                pair.retailer
                                                                    ?.shopDetails
                                                                    ?.shopAddress
                                                                    ?.state
                                                        )
                                                        .filter(Boolean)
                                                ),
                                            ].map((s) => ({
                                                label: s,
                                                value: s,
                                            }))}
                                            styles={customSelectStyles}
                                            placeholder="Select State"
                                            isClearable
                                        />
                                    </div>

                                    {/* Search Filter */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Search
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Search by Outlet/Employee Code or Name"
                                            value={searchQuery}
                                            onChange={(e) =>
                                                setSearchQuery(e.target.value)
                                            }
                                            className="w-full px-4 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-red-600 focus:outline-none"
                                        />
                                    </div>
                                </div>

                                {/* Clear Filters */}
                                {(stateFilter || searchQuery) && (
                                    <button
                                        onClick={() => {
                                            setStateFilter(null);
                                            setSearchQuery("");
                                        }}
                                        className="mt-4 text-sm text-red-600 underline hover:text-red-800"
                                    >
                                        Clear All Filters
                                    </button>
                                )}
                            </div>

                            {/* Assigned Pairs Table */}
                            <div className="bg-white shadow-md rounded-lg p-6">
                                <h3 className="text-lg font-semibold text-gray-700 mb-4">
                                    Assigned Employee-Retailer Pairs (
                                    {filteredPairs.length} of{" "}
                                    {assignedPairs.length})
                                </h3>

                                {loadingAssignedData ? (
                                    <p className="text-gray-500 py-3">
                                        Loading...
                                    </p>
                                ) : assignedPairs.length === 0 ? (
                                    <p className="text-gray-500 py-3">
                                        No assignments found for this campaign.
                                    </p>
                                ) : filteredPairs.length === 0 ? (
                                    <p className="text-gray-500 py-3">
                                        No results match your filters.
                                    </p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-100">
                                                <tr>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">
                                                        S.No
                                                    </th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">
                                                        Outlet Code
                                                    </th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">
                                                        Outlet Name
                                                    </th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">
                                                        Employee Code
                                                    </th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">
                                                        Employee Name
                                                    </th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">
                                                        Task
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {filteredPairs.map(
                                                    (pair, index) => (
                                                        <tr
                                                            key={`${pair.retailer?._id}-${pair.employee?._id}-${index}`}
                                                            className="hover:bg-gray-50"
                                                        >
                                                            <td className="px-4 py-2 text-sm">
                                                                {index + 1}
                                                            </td>
                                                            <td className="px-4 py-2 text-sm font-medium text-gray-700">
                                                                {pair.retailer
                                                                    ?.uniqueId ||
                                                                    "-"}
                                                            </td>
                                                            <td className="px-4 py-2 text-sm text-gray-700">
                                                                {pair.retailer
                                                                    ?.shopDetails
                                                                    ?.shopName ||
                                                                    "-"}
                                                            </td>
                                                            <td className="px-4 py-2 text-sm font-medium text-gray-700">
                                                                {pair.employee
                                                                    ?.employeeId ||
                                                                    "-"}
                                                            </td>
                                                            <td className="px-4 py-2 text-sm text-gray-700">
                                                                {pair.employee
                                                                    ?.name ||
                                                                    "-"}
                                                            </td>
                                                            <td className="px-4 py-2">
                                                                <button
                                                                    onClick={() =>
                                                                        handleTaskClick(
                                                                            pair
                                                                        )
                                                                    }
                                                                    className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded hover:bg-red-700 transition"
                                                                >
                                                                    Task
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    )
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
};

export default ScheduleUnscheduleTask;
