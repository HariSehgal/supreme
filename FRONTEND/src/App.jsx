import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SignIn from "./components/admin/SignIn";
import SignUp from "./components/admin/SignUp";
import Dashboard from "./components/Admin/Dashboard";
import ClientSignUp from "./components/Client/SignUp";


const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/clientsignup" element={<ClientSignUp />} />
      </Routes>
    </Router>
  );
};

export default App;
