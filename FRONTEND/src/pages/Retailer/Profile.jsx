import React, { useState, useRef, useEffect } from "react";
import {
  FaUser,
  FaUsers,
  FaPhoneAlt,
  FaEnvelope,
  FaCalendarAlt,
  FaIdCard,
  FaBuilding,
  FaStore,
  FaPlus,
  FaTimes,
  FaFileInvoice,
  FaMapMarkerAlt,
  FaCity,
  FaMapMarkedAlt,
  FaMapPin,
  FaUniversity,
  FaCreditCard,
  FaCode,
} from "react-icons/fa";
import { IoClose, IoChevronDown } from "react-icons/io5";

const SearchableSelect = ({ label, placeholder, options, value, onChange, leftIcon }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const filtered = options.filter((o) =>
    o.toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <div className="relative" ref={ref}>
      <label className="block text-sm font-medium mb-1">{label}</label>

      <div
        className="relative w-full border border-gray-300 rounded-lg cursor-pointer"
        onClick={() => setOpen(true)}
      >
        {/* Left icon */}
        {leftIcon && (
          <span className="absolute left-3 top-[11px] text-gray-400">
            {leftIcon}
          </span>
        )}

        <div className="flex items-center px-3 py-2">
          <input
            className={`flex-1 outline-none bg-transparent ${leftIcon ? "pl-6" : ""
              }`}
            placeholder={value || placeholder}
            value={open ? search : value || ""}
            onChange={(e) => {
              setSearch(e.target.value);
              onChange && onChange("");
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
          />

          {/* Clear button */}
          {value && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
                setSearch("");
              }}
              className="ml-2 text-gray-500 hover:text-gray-700"
            >
              <IoClose />
            </button>
          )}

          {/* Down arrow */}
          <IoChevronDown className="ml-2 text-gray-400" />
        </div>
      </div>

      {open && (
        <ul className="absolute z-50 w-full bg-white border border-gray-300 rounded-lg max-h-48 overflow-y-auto mt-1">
          {filtered.length > 0 ? (
            filtered.map((opt, idx) => (
              <li
                key={idx}
                onClick={() => {
                  onChange(opt);
                  setSearch("");
                  setOpen(false);
                }}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
              >
                {opt}
              </li>
            ))
          ) : (
            <li className="px-4 py-2 text-gray-500">No match found</li>
          )}
        </ul>
      )}
    </div>
  );
};

const FileInput = ({ label, accept = "*", file, setFile }) => {
  const fileRef = useRef();

  useEffect(() => {
    return () => {
      if (file && file.preview) URL.revokeObjectURL(file.preview);
    };
  }, [file]);

  function handleFileChange(e) {
    const f = e.target.files[0];
    if (!f) {
      setFile(null);
      return;
    }
    const preview = f.type.startsWith("image/") ? URL.createObjectURL(f) : null;
    setFile({ raw: f, preview, name: f.name });
  }

  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <div
        className="relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#E4002B] transition"
        onClick={() => fileRef.current?.click()}
      >
        {!file ? (
          <>
            <FaPlus className="text-2xl text-gray-400 mb-2" />
            <p className="text-sm text-gray-500">Click or drop file here</p>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2">
            {file.preview ? (
              <img
                src={file.preview}
                alt="preview"
                className="w-20 h-16 object-cover rounded-md border"
              />
            ) : (
              <p className="text-sm text-gray-700">{file.name}</p>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
                if (fileRef.current) fileRef.current.value = "";
              }}
              className="flex items-center gap-1 text-red-500 text-xs hover:underline"
            >
              <FaTimes /> Remove
            </button>
          </div>
        )}

        <input
          ref={fileRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
};

const Profile = () => {
  // Personal details
  const [name, setName] = useState("Hari Sehgal");
  const [contactNo, setContactNo] = useState("9310233356");
  const [altContactNo, setAltContactNo] = useState("");
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState("");
  const genderOptions = ["Male", "Female", "Other", "Prefer not to say"];
  const idTypeOptions = ["Aadhaar", "PAN", "Voter ID", "Driving License", "Other"];
  const [gender, setGender] = useState("");
  const [govtIdType, setGovtIdType] = useState("");
  const [govtIdNumber, setGovtIdNumber] = useState("");

  // Shop details
  const [shopName, setShopName] = useState("Hari Garments");
  const businessTypeOptions = [
    "Grocery Retailer",
    "Wholesale",
    "Key Accounts",
    "Salon / Beauty Parlour",
    "Self Service Outlet",
    "Chemist Outlet",
    "Other",
  ];
  const ownershipTypeOptions = [
    "Sole Proprietorship",
    "Partnership",
    "Private Ltd",
    "LLP"
  ];
  const [businessType, setBusinessType] = useState("Wholesale");
  const [ownershipType, setOwnershipType] = useState("");
  const [gstNo, setGstNo] = useState("");
  const [panCard, setPanCard] = useState("ABCDE1234F");
  const [address1, setAddress1] = useState("Guru Ram Das Nagar, Laxmi Nagar");
  const [address2, setAddress2] = useState("");
  const [city, setCity] = useState("New Delhi");
  const [state, setState] = useState("Delhi");
  const [pincode, setPincode] = useState("110092");

  const [gstError, setGstError] = useState("");

  // Bank details
  const bankOptions = [
    "HDFC Bank",
    "State Bank of India",
    "ICICI Bank",
    "Axis Bank",
    "Kotak Mahindra Bank",
    "Punjab National Bank",
    "Other",
  ];

  const [bankName, setBankName] = useState("HDFC Bank");
  const [accountNumber, setAccountNumber] = useState("99909310233356");
  const [ifsc, setIfsc] = useState("HDFC0001234");
  const [branchName, setBranchName] = useState("Laxmi Nagar");

  // Files
  const [govtIdPhoto, setGovtIdPhoto] = useState(null);
  const [personPhoto, setPersonPhoto] = useState(null);
  const [registrationFormFile, setRegistrationFormFile] = useState(null);
  const [outletPhoto, setOutletPhoto] = useState(null);

  // Submission
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);

    // Collect all form values
    const payload = {
      name,
      contactNo,
      altContactNo,
      email,
      dob,
      gender,
      govtIdType,
      govtIdNumber,

      address1,
      address2,
      city,
      state,
      pincode,

      shopDetails: {
        shopName,
        businessType,
        ownershipType,
        GSTNo: gstNo,
        PANCard: panCard,
      },

      bankDetails: {
        bankName,
        accountNumber,
        IFSC: ifsc,
        branchName,
      },

      files: {
        govtIdPhoto,
        personPhoto,
        registrationFormFile,
        outletPhoto,
      },
    };

    // Show data in console
    console.log("Submitted payload:", payload);

    resetForm();
    setSubmitting(false);
  };

  const resetForm = () => {
    setName("Hari Sehgal");
    setContactNo("9310233356");
    setAltContactNo("");
    setEmail("");
    setDob("");
    setGender("");
    setGovtIdType("");
    setGovtIdNumber("");
    setShopName("Hari Garments");
    setBusinessType("Wholesale");
    setOwnershipType("");
    setGstNo("");
    setPanCard("ABCDE1234F");
    setAddress1("Guru Ram Das Nagar, Laxmi Nagar");
    setAddress2("");
    setCity("New Delhi");
    setState("Delhi");
    setPincode("110092");
    setBankName("HDFC Bank");
    setAccountNumber("99909310233356");
    setIfsc("HDFC0001234");
    setBranchName("Laxmi Nagar");

    setGovtIdPhoto(null);
    setPersonPhoto(null);
    setRegistrationFormFile(null);
    setOutletPhoto(null);
  };

  return (
    <>
      {/* Retailer Profile */}
      <div className="flex justify-center items-center w-full">
        <div className="w-full max-w-3xl bg-white shadow-md rounded-xl p-8">
          <h1 className="text-2xl font-bold text-[#E4002B] text-center pb-8">Retailer Profile</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Details */}
            <section className="space-y-4">
              <h3 className="text-lg font-medium text-[#E4002B]">Personal Details</h3>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FaUser className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    value={name}
                    disabled
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Contact No <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FaPhoneAlt className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="tel"
                    value={contactNo}
                    onChange={(e) => setContactNo(e.target.value.replace(/\D/g, ""))}
                    placeholder="+91 1234567890"
                    maxLength={10}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#E4002B]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Alternate Contact No
                </label>
                <div className="relative">
                  <FaPhoneAlt className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="tel"
                    value={altContactNo}
                    onChange={(e) => setAltContactNo(e.target.value.replace(/\D/g, ""))}
                    placeholder="+91 1234567890"
                    maxLength={10}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#E4002B]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Email
                </label>
                <div className="relative">
                  <FaEnvelope className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@google.com"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#E4002B]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Date of Birth
                </label>
                <div className="relative">
                  <FaCalendarAlt className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#E4002B]"
                  />
                </div>
              </div>

              <SearchableSelect
                label="Gender"
                placeholder="Select gender"
                options={genderOptions}
                value={gender}
                onChange={setGender}
                leftIcon={<FaUser />}
              />

              <SearchableSelect
                label="Govt ID Type"
                placeholder="Select ID type"
                options={idTypeOptions}
                value={govtIdType}
                onChange={setGovtIdType}
                leftIcon={<FaIdCard />}
              />

              <div>
                <label className="block text-sm font-medium mb-1">
                  Govt ID Number
                </label>
                <div className="relative">
                  <FaIdCard className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    value={govtIdNumber}
                    onChange={(e) => setGovtIdNumber(e.target.value)}
                    placeholder="1234-5678-9102"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#E4002B]"
                  />
                </div>
              </div>
            </section>

            {/* Shop Details */}
            <section className="space-y-4">
              <h3 className="text-lg font-medium text-[#E4002B]">Shop Details</h3>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Shop Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FaBuilding className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    value={shopName}
                    disabled
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                    required
                  />
                </div>
              </div>

              <SearchableSelect
                label={
                  <>
                    Business Type <span className="text-red-500">*</span>
                  </>
                }
                placeholder="Select business type"
                options={businessTypeOptions}
                value={businessType}
                onChange={setBusinessType}
                leftIcon={<FaStore />}
              />

              <SearchableSelect
                label="Ownership Type"
                placeholder="Select ownership type"
                options={ownershipTypeOptions}
                value={ownershipType}
                onChange={setOwnershipType}
                leftIcon={<FaUsers />}
              />

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    GST No
                  </label>

                  <div className="relative">
                    {/* Left Icon */}
                    <FaFileInvoice className="absolute left-3 top-3 text-gray-400" />

                    <input
                      type="text"
                      value={gstNo}
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase();
                        setGstNo(val);

                        const gstRegex =
                          /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

                        if (val === "") setGstError("");
                        else if (!gstRegex.test(val))
                          setGstError("Invalid GST Number format (e.g., 29ABCDE1234F1Z5)");
                        else setGstError("");
                      }}
                      placeholder="29ABCDE1234F1Z5"
                      className={`w-full pl-10 px-4 py-2 border rounded-lg outline-none focus:ring-2 ${gstError
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-300 focus:ring-[#E4002B]"
                        }`}
                    />
                  </div>

                  {gstError && <p className="text-red-500 text-xs mt-1">{gstError}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    PAN Card <span className="text-red-500">*</span>
                  </label>

                  <div className="relative">
                    {/* Left icon */}
                    <FaIdCard className="absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      value={panCard}
                      disabled
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Address Line 1 <span className="text-red-500">*</span>
                </label>

                <div className="relative">
                  {/* Left icon */}
                  <FaMapMarkerAlt className="absolute left-3 top-3 text-gray-400" />

                  <input
                    type="text"
                    value={address1}
                    disabled
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Address Line 2
                </label>

                <div className="relative">
                  {/* Left icon */}
                  <FaMapMarkerAlt className="absolute left-3 top-3 text-gray-400" />

                  <input
                    type="text"
                    value={address2}
                    onChange={(e) => setAddress2(e.target.value)}
                    placeholder="Near XYZ landmark"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 
                 rounded-lg outline-none focus:ring-2 focus:ring-[#E4002B]"
                  />
                </div>
              </div>

              {/* City, State, and Pincode */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    City <span className="text-red-500">*</span>
                  </label>

                  <div className="relative">
                    {/* Left icon */}
                    <FaCity className="absolute left-3 top-3 text-gray-400" />

                    <input
                      type="text"
                      value={city}
                      disabled
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 
                 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                      required
                    />
                  </div>
                </div>


                <div>
                  <label className="block text-sm font-medium mb-1">
                    State <span className="text-red-500">*</span>
                  </label>

                  <div className="relative">
                    {/* Left icon */}
                    <FaMapMarkedAlt className="absolute left-3 top-3 text-gray-400" />

                    <input
                      type="text"
                      value={state}
                      disabled
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg
                 bg-gray-100 text-gray-600 cursor-not-allowed"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Pincode <span className="text-red-500">*</span>
                  </label>

                  <div className="relative">
                    {/* Left icon */}
                    <FaMapPin className="absolute left-3 top-3 text-gray-400" />

                    <input
                      type="text"
                      value={pincode}
                      disabled
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg 
                 bg-gray-100 text-gray-600 cursor-not-allowed"
                      required
                    />
                  </div>
                </div>

              </div>
            </section>

            {/* Bank Details */}
            <section className="space-y-4">
              <h3 className="text-lg font-medium text-[#E4002B]">Bank Details</h3>

              <SearchableSelect
                label={
                  <>
                    Bank Name <span className="text-red-500">*</span>
                  </>
                }
                placeholder="Select bank"
                options={bankOptions}
                value={bankName}
                onChange={setBankName}
                leftIcon={<FaUniversity />}
              />

              <div>
                <label className="block text-sm font-medium mb-1">
                  Account Number <span className="text-red-500">*</span>
                </label>

                <div className="relative">
                  {/* Left icon */}
                  <FaCreditCard className="absolute left-3 top-3 text-gray-400" />

                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456789012"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 
                 rounded-lg outline-none focus:ring-2 focus:ring-[#E4002B]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  IFSC <span className="text-red-500">*</span>
                </label>

                <div className="relative">
                  {/* Left icon */}
                  <FaCode className="absolute left-3 top-3 text-gray-400" />

                  <input
                    type="text"
                    value={ifsc}
                    onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                    placeholder="HDFC0001234"
                    maxLength={11}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 
                 rounded-lg outline-none focus:ring-2 focus:ring-[#E4002B]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Branch Name <span className="text-red-500">*</span>
                </label>

                <div className="relative">
                  {/* Left icon */}
                  <FaStore className="absolute left-3 top-3 text-gray-400" />

                  <input
                    type="text"
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                    placeholder="Branch name"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 
                 rounded-lg outline-none focus:ring-2 focus:ring-[#E4002B]"
                    required
                  />
                </div>
              </div>
            </section>

            {/* File Uploads */}
            <section className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-[#E4002B]">File Uploads</h3>
                <p className="text-[11px] text-gray-500 mt-1">
                  <span className="text-red-500">*</span> Accepted formats: PNG, JPG, JPEG, PDF, DOC — less than 1 MB
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FileInput
                  label={
                    <>
                      Govt ID Photo <span className="text-red-500">*</span>
                    </>
                  }
                  accept=".png,.jpg,.jpeg,.pdf,.doc"
                  file={govtIdPhoto}
                  setFile={setGovtIdPhoto}
                />

                <FileInput
                  label={
                    <>
                      Person Photo <span className="text-red-500">*</span>
                    </>
                  }
                  accept=".png,.jpg,.jpeg,.pdf,.doc"
                  file={personPhoto}
                  setFile={setPersonPhoto}
                />

                <FileInput
                  label={
                    <>
                      Registration Form
                    </>
                  }
                  accept=".png,.jpg,.jpeg,.pdf,.doc"
                  file={registrationFormFile}
                  setFile={setRegistrationFormFile}
                />

                <FileInput
                  label={
                    <>
                      Outlet Photo <span className="text-red-500">*</span>
                    </>
                  }
                  accept=".png,.jpg,.jpeg,.pdf,.doc"
                  file={outletPhoto}
                  setFile={setOutletPhoto}
                />
              </div>
            </section>

            <div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#E4002B] text-white py-3 rounded-lg font-medium hover:bg-[#C3002B] transition disabled:opacity-60"
              >
                {submitting ? "Creating..." : "Create Retailer"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default Profile;
