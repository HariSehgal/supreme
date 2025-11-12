import React, { useState } from "react";

const Report = ({ campaign }) => {
  const [range, setRange] = useState("today");
  const [customDates, setCustomDates] = useState({
    start: "",
    end: "",
  });

  // Sample data — replace with API data
  const dummyTableData = [
    { date: "02-Apr-25", sales: 12, reward: 300 },
    { date: "03-Apr-25", sales: 20, reward: 500 },
    { date: "05-Apr-25", sales: 15, reward: 400 },
  ];

  const handleDateChange = (e) => {
    setCustomDates({ ...customDates, [e.target.name]: e.target.value });
  };

  return (
    <div>
      {/* Title */}
      <h3 className="text-xl font-semibold mb-6 text-gray-800">Report</h3>

      {/* Date Range */}
      <div className="mb-6">
        <label className="block font-medium mb-2">Select Date Range</label>

        <div className="flex items-center gap-4">
          {/* Dropdown */}
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="border rounded-md p-2 w-60"
          >
            <option value="today">Today</option>
            <option value="last7">Last 7 Days</option>
            <option value="last30">Last 30 Days</option>
            <option value="custom">Custom</option>
          </select>

          {/* ✅ Custom Date Picker inline */}
          {range === "custom" && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">From</label>
                <input
                  type="date"
                  name="start"
                  value={customDates.start}
                  onChange={handleDateChange}
                  className="border rounded-md p-2"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">To</label>
                <input
                  type="date"
                  name="end"
                  value={customDates.end}
                  onChange={handleDateChange}
                  className="border rounded-md p-2"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* TABLE */}
      <div className="border rounded-lg overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#E4002B] text-white">
            <tr>
              <th className="p-3">Date</th>
              <th className="p-3">Sales</th>
              <th className="p-3">Rewards Earned</th>
            </tr>
          </thead>

          <tbody>
            {dummyTableData?.map((row, idx) => (
              <tr key={idx} className="border-b hover:bg-gray-100">
                <td className="p-3">{row.date}</td>
                <td className="p-3">{row.sales}</td>
                <td className="p-3">{row.reward}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Report;
