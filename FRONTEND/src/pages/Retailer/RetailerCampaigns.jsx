import React from "react";

const RetailerCampaigns = ({ campaigns = [], onView }) => {
  // Dummy campaigns if no data is passed
  const demoCampaigns = [
    {
      id: 1,
      name: "Monte Carlo Campaign",
      startDate: "01-Apr-25",
      endDate: "15-Apr-25",
    },
    {
      id: 2,
      name: "ABCD Campaign",
      startDate: "10-Apr-25",
      endDate: "25-Apr-25",
    },
    {
      id: 3,
      name: "Winter Dhamaka 2025",
      startDate: "05-Apr-25",
      endDate: "20-Apr-25",
    },
  ];

  const campaignData = campaigns.length ? campaigns : demoCampaigns;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-[#E4002B]">
        My Campaigns
      </h2>

      {campaignData.length === 0 ? (
        <p className="text-gray-600">No campaigns found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaignData.map((campaign) => (
            <div
              key={campaign.id}
              className="border border-gray-300 rounded-lg p-6 shadow-sm hover:shadow-md transition"
            >
              <h3 className="text-lg font-semibold mb-2 text-gray-800">
                {campaign.name}
              </h3>

              <p className="text-sm text-gray-600 mb-1">
                <span className="font-medium">Start:</span> {campaign.startDate}
              </p>

              <p className="text-sm text-gray-600 mb-4">
                <span className="font-medium">End:</span> {campaign.endDate}
              </p>

              <button
                className="w-full bg-[#E4002B] text-white py-2 rounded-md hover:bg-[#C00026] transition font-medium text-sm"
                onClick={() => onView?.(campaign.id)}
              >
                View Details
              </button>

            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RetailerCampaigns;
