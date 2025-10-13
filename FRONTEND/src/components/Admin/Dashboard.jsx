import React from "react";
import { Link } from "react-router-dom";

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Admin Dashboard</h1>

      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Add New Client Admin */}
        <div className="bg-white p-6 rounded-lg shadow-md flex flex-col justify-between">
          <h2 className="text-xl font-semibold mb-4">Add New Client Admin</h2>
          <Link to="/clientsignup">
            <button className="self-start bg-purple-700 text-white px-5 py-2 rounded-lg hover:bg-purple-800 transition">
              Add Client Admin
            </button>
          </Link>
        </div>

        {/* Card 2: Add New Admin */}
        <div className="bg-white p-6 rounded-lg shadow-md flex flex-col justify-between">
          <h2 className="text-xl font-semibold mb-4">Add New Admin</h2>
          <button className="self-start bg-purple-700 text-white px-5 py-2 rounded-lg hover:bg-purple-800 transition">
            Add Admin
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
