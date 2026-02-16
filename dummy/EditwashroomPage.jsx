// "use client";

// import React, { useEffect, useState, useRef } from "react";
// import { useParams, useRouter, useSearchParams } from "next/navigation";

// import LocationsApi from "@/features/locations/locations.api";
// import { fetchToiletFeaturesByName } from "@/features/configurations/configurations.api";
// import Loader from "@/components/ui/Loader";
// import { useCompanyId } from "@/providers/CompanyProvider";
// import { usePermissions } from "@/shared/hooks/usePermission";
// import { useRequirePermission } from "@/shared/hooks/useRequirePermission";
// import { MODULES } from "@/shared/constants/permissions";
// import toast, { Toaster } from "react-hot-toast";
// import { FacilityCompanyApi } from "@/features/facilityCompany/facilityCompany.api";
// import {
//   MapPin,
//   Save,
//   ArrowLeft,
//   ChevronLeft,
//   ChevronRight,
//   Search,
//   X,
//   Navigation,
//   Plus,
//   Eye,
//   AlertCircle,
//   Upload,
//   Image as ImageIcon,
//   Trash2,
//   Home,
//   Building2,
//   Users,
//   Camera,
//   Droplets,
//   Armchair,
// } from "lucide-react";

// import { Country, State, City } from "country-state-city";
// import GoogleMapPicker from "@/app/(protected)/add-location/components/GoogleMapPicker";
// import LatLongInput from "@/app/(protected)/add-location/components/LatLongInput";
// // import SearchableSelect from './components/SearchableSelect';
// import SearchableSelect from "../../../add-location/components/SearchableSelect";
// import locationTypesApi from "@/lib/api/locationTypesApi";

// // ✅ Indian States List
// const INDIAN_STATES = [
//   "Andhra Pradesh",
//   "Arunachal Pradesh",
//   "Assam",
//   "Bihar",
//   "Chhattisgarh",
//   "Goa",
//   "Gujarat",
//   "Haryana",
//   "Himachal Pradesh",
//   "Jharkhand",
//   "Karnataka",
//   "Kerala",
//   "Madhya Pradesh",
//   "Maharashtra",
//   "Manipur",
//   "Meghalaya",
//   "Mizoram",
//   "Nagaland",
//   "Odisha",
//   "Punjab",
//   "Rajasthan",
//   "Sikkim",
//   "Tamil Nadu",
//   "Telangana",
//   "Tripura",
//   "Uttar Pradesh",
//   "Uttarakhand",
//   "West Bengal",
//   "Andaman and Nicobar Islands",
//   "Chandigarh",
//   "Dadra and Nagar Haveli and Daman and Diu",
//   "Delhi",
//   "Jammu and Kashmir",
//   "Ladakh",
//   "Lakshadweep",
//   "Puducherry",
// ];

// const EditLocationPage = () => {
//   useRequirePermission(MODULES.LOCATIONS);

//   const { canUpdate } = usePermissions();
//   const canEditLocation = canUpdate(MODULES.LOCATIONS);

//   const [location, setLocation] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);
//   const [error, setError] = useState(null);
//   const [allLocations, setAllLocations] = useState([]);
//   const [navigationLoading, setNavigationLoading] = useState(false);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [searchResults, setSearchResults] = useState([]);
//   const [showSearch, setShowSearch] = useState(false);
//   const [toiletFeatures, setToiletFeatures] = useState({});
//   const [selectedFacilityCompany, setSelectedFacilityCompany] = useState();
//   const [facilityCompanies, setFacilityCompanies] = useState([]);

//   // location type select dropdown
//   const [selectedLocationType, setSelectedLocationType] = useState();
//   const [locationTypes, setLocationTypes] = useState([]);

//   //  Image states
//   const [newImages, setNewImages] = useState([]);
//   const [previewImages, setPreviewImages] = useState([]);
//   const [existingImages, setExistingImages] = useState([]);
//   const [imagesToDelete, setImagesToDelete] = useState([]);
//   const [selectedImageIndex, setSelectedImageIndex] = useState(null);
//   const fileInputRef = useRef(null);

//   const [availableStates, setAvailableStates] = useState([]);
//   const [availableCities, setAvailableCities] = useState([]);
//   const [availableDistricts, setAvailableDistricts] = useState([]);

//   // ✅ Updated formData with new fields
//   const [formData, setFormData] = useState({
//     name: "",
//     latitude: "",
//     longitude: "",
//     address: "",
//     city: "",
//     state: "",
//     dist: "",
//     pincode: "",
//     facility_companiesId: null,
//     type_id: null,
//     options: {},
//     usage_category: {
//       men: {
//         wc: 0,
//         indian: 0,
//         urinal: 0,
//         shower: 0,
//         basin: 0,
//       },
//       women: {
//         wc: 0,
//         indian: 0,
//         urinal: 0,
//         shower: 0,
//         basin: 0,
//       },
//     },
//   });

//   const params = useParams();
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const { companyId } = useCompanyId();

//   const urlCompanyId = searchParams.get("companyId");
//   const finalCompanyId = companyId || urlCompanyId;

//   useEffect(() => {
//     const fetchData = async () => {
//       if (!params.id || !finalCompanyId) return;

//       try {
//         setLoading(true);

//         const [
//           locationResult,
//           locationsResult,
//           featuresResult,
//           facilityCompaniesResult,
//           locationTypesResult,
//         ] = await Promise.all([
//           LocationsApi.getLocationById(params.id, finalCompanyId),
//           LocationsApi.getAllLocations(finalCompanyId),
//           fetchToiletFeaturesByName("Toilet_Features"),
//           // FacilityCompanyApi.getAllFacilityCompanies(finalCompanyId)
//           FacilityCompanyApi.getAll(finalCompanyId),
//           locationTypesApi.getAll(finalCompanyId),
//         ]);

//         console.log(locationResult, "locatoin result");
//         console.log(locationTypesResult, "location tyeps result");

//         if (locationResult.success) {
//           setLocation(locationResult.data);
//           setFormData({
//             name: locationResult.data.name,
//             latitude: locationResult.data.latitude?.toString() || "",
//             longitude: locationResult.data.longitude?.toString() || "",
//             address: locationResult.data.address || "",
//             city: locationResult.data.city || "",
//             state: locationResult.data.state || "",
//             dist: locationResult.data.dist || "",
//             pincode: locationResult.data.pincode || "",
//             no_of_photos: locationResult.data.no_of_photos,
//             options: locationResult.data.options || {},

//             usage_category: locationResult.data.usage_category || {
//               men: {
//                 wc: 0,
//                 indian: 0,
//                 urinals: 0,
//               },
//               women: {
//                 wc: 0,
//                 indian: 0,
//                 urinals: 0,
//               },
//             },
//           });

//           setExistingImages(locationResult.data.images || []);
//           setSelectedFacilityCompany(locationResult.data.facility_companiesId);
//           setSelectedLocationType(locationResult.data?.type_id);

//           if (locationResult.data?.state) {
//             const indiaStates = State.getStatesOfCountry("IN");
//             const selectedState = indiaStates.find(
//               (s) => s.name === locationResult?.data?.state,
//             );
//             if (selectedState) {
//               const cities = City.getCitiesOfState("IN", selectedState.isoCode);
//               const cityNames = cities.map((city) => city.name);
//               setAvailableCities(cityNames);
//             }
//           }
//         } else {
//           setError(locationResult.error);
//         }

//         if (locationsResult.success) {
//           setAllLocations(locationsResult.data);
//         }

//         if (facilityCompaniesResult.success) {
//           setFacilityCompanies(facilityCompaniesResult.data);
//         }

//         if (locationTypesResult) {
//           setLocationTypes(locationTypesResult);
//         }
//         if (featuresResult) {
//           const features = {};
//           featuresResult?.data[0]?.description.forEach((feature) => {
//             features[feature.key] = feature;
//           });
//           setToiletFeatures(features);
//         }
//       } catch (err) {
//         setError("Failed to fetch location data");
//         console.error("Error:", err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchData();
//   }, [params.id, finalCompanyId]);

//   // Load Indian states on mount
//   useEffect(() => {
//     const indiaStates = State.getStatesOfCountry("IN");
//     const stateNames = indiaStates.map((state) => state.name);
//     setAvailableStates(stateNames);
//   }, []);

//   // ✅ Image handling functions
//   const handleFileSelect = (e) => {
//     const files = Array.from(e.target.files);
//     if (files.length === 0) return;

//     const validFiles = [];
//     const invalidFiles = [];

//     files.forEach((file) => {
//       if (file.type.startsWith("image/")) {
//         if (file.size <= 10 * 1024 * 1024) {
//           validFiles.push(file);
//         } else {
//           invalidFiles.push(file.name + " (too large)");
//         }
//       } else {
//         invalidFiles.push(file.name + " (not an image)");
//       }
//     });

//     if (invalidFiles.length > 0) {
//       toast.error(`Invalid files: ${invalidFiles.join(", ")}`);
//     }

//     if (validFiles.length > 0) {
//       setNewImages((prev) => [...prev, ...validFiles]);

//       const newPreviews = validFiles.map((file) => ({
//         file,
//         url: URL.createObjectURL(file),
//         name: file.name,
//         isNew: true,
//       }));

//       setPreviewImages((prev) => [...prev, ...newPreviews]);
//     }

//     if (fileInputRef.current) {
//       fileInputRef.current.value = "";
//     }
//   };

//   const removeNewImage = (index) => {
//     URL.revokeObjectURL(previewImages[index].url);
//     setNewImages((prev) => prev.filter((_, i) => i !== index));
//     setPreviewImages((prev) => prev.filter((_, i) => i !== index));
//   };

//   const removeExistingImage = (imageUrl) => {
//     setImagesToDelete((prev) => [...prev, imageUrl]);
//     setExistingImages((prev) => prev.filter((img) => img !== imageUrl));
//   };

//   const triggerFileInput = () => {
//     fileInputRef.current?.click();
//   };

//   const handleMultiselectChange = (key, value, checked) => {
//     const currentValues = formData.options[key] || [];
//     let newValues;

//     if (checked) {
//       newValues = currentValues.includes(value)
//         ? currentValues
//         : [...currentValues, value];
//     } else {
//       newValues = currentValues.filter((v) => v !== value);
//     }

//     handleOptionChange(key, newValues);
//   };

//   const getCurrentLocationIndex = () => {
//     return allLocations.findIndex((loc) => loc.id === params.id);
//   };

//   const handlePrevious = async () => {
//     const currentIndex = getCurrentLocationIndex();
//     if (currentIndex > 0) {
//       setNavigationLoading(true);
//       const prevLocation = allLocations[currentIndex - 1];
//       router.push(
//         `/washrooms/item/${prevLocation.id}/edit?companyId=${finalCompanyId}`,
//       );
//     }
//   };

//   const handleNext = async () => {
//     const currentIndex = getCurrentLocationIndex();
//     if (currentIndex < allLocations.length - 1) {
//       setNavigationLoading(true);
//       const nextLocation = allLocations[currentIndex + 1];
//       router.push(
//         `/washrooms/item/${nextLocation.id}/edit?companyId=${finalCompanyId}`,
//       );
//     }
//   };

//   const getNavigationInfo = () => {
//     const currentIndex = getCurrentLocationIndex();
//     return {
//       currentIndex,
//       hasPrevious: currentIndex > 0,
//       hasNext: currentIndex < allLocations.length - 1,
//       previousName:
//         currentIndex > 0 ? allLocations[currentIndex - 1]?.name : null,
//       nextName:
//         currentIndex < allLocations.length - 1
//           ? allLocations[currentIndex + 1]?.name
//           : null,
//     };
//   };

//   // const handleInputChange = (field, value) => {
//   //   setFormData(prev => ({
//   //     ...prev,
//   //     [field]: value
//   //   }));
//   // };

//   // const handleInputChange = (field, value) => {
//   //   if (field === 'state') {
//   //     const indiaStates = State.getStatesOfCountry('IN');
//   //     const selectedState = indiaStates.find(s => s.name === value);

//   //     if (selectedState) {
//   //       const cities = City.getCitiesOfState('IN', selectedState.isoCode);
//   //       const cityNames = cities.map(city => city.name);
//   //       setAvailableCities(cityNames);
//   //     } else {
//   //       setAvailableCities([]);
//   //     }

//   //     setFormData(prev => ({
//   //       ...prev,
//   //       state: value,
//   //       city: '' // Reset city when state changes
//   //     }));
//   //   } else {

//   //     setFormData(prev => ({ ...prev, [field]: value }));
//   //   }
//   // };

//   const handleInputChange = (field, value) => {
//     // Handle state change separately
//     if (field === "state") {
//       const indiaStates = State.getStatesOfCountry("IN");
//       const selectedState = indiaStates.find((s) => s.name === value);

//       if (selectedState) {
//         const cities = City.getCitiesOfState("IN", selectedState.isoCode);
//         const cityNames = cities.map((city) => city.name);
//         setAvailableCities(cityNames);
//       } else {
//         setAvailableCities([]);
//       }

//       setFormData((prev) => ({
//         ...prev,
//         state: value,
//         city: "", // Reset city when state changes
//       }));
//       return; // Exit early for state
//     }

//     // Validate coordinates
//     if (field === "latitude") {
//       const lat = parseFloat(value);
//       if (value && (isNaN(lat) || lat < -90 || lat > 90)) {
//         toast.error("Latitude must be between -90 and 90");
//       }
//     }

//     if (field === "longitude") {
//       const lng = parseFloat(value);
//       if (value && (isNaN(lng) || lng < -180 || lng > 180)) {
//         toast.error("Longitude must be between -180 and 180");
//       }
//     }

//     // Update form data for all other fields
//     setFormData((prev) => ({ ...prev, [field]: value }));
//   };

//   const handleOptionChange = (optionKey, value) => {
//     setFormData((prev) => ({
//       ...prev,
//       options: {
//         ...prev.options,
//         [optionKey]: value,
//       },
//     }));
//   };

//   // ✅ Updated save handler with new fields
//   const handleSave = async () => {
//     try {
//       setSaving(true);

//       if (!formData.name.trim()) {
//         toast.error("Location name is required");
//         return;
//       }

//       const updateData = {
//         name: formData.name.trim(),
//         latitude: formData.latitude ? parseFloat(formData.latitude) : null,
//         longitude: formData.longitude ? parseFloat(formData.longitude) : null,
//         address: formData.address.trim() || null,
//         city: formData.city.trim() || null,
//         state: formData.state || null,
//         dist: formData.dist.trim() || null,
//         pincode: formData.pincode.trim() || null,
//         no_of_photos: formData.no_of_photos || null,
//         facility_companiesId: formData.facility_companiesId || null,
//         type_id: formData.type_id || null,
//         options: formData.options,
//         usage_category: formData.usage_category,
//       };

//       // console.log(updateData, "data to be updated")
//       // Handle image deletion first
//       for (const imageUrl of imagesToDelete) {
//         try {
//           await LocationsApi.deleteLocationImage(
//             params.id,
//             imageUrl,
//             finalCompanyId,
//           );
//         } catch (error) {
//           console.error("Error deleting image:", error);
//         }
//       }

//       const result = await LocationsApi.updateLocation(
//         params.id,
//         updateData,
//         finalCompanyId,
//         newImages,
//         false,
//       );

//       if (result.success) {
//         toast.success("Location updated successfully! Redirecting...");

//         previewImages.forEach((preview) => {
//           if (preview.url.startsWith("blob:")) {
//             URL.revokeObjectURL(preview.url);
//           }
//         });

//         router.push(`/washrooms?companyId=${finalCompanyId}`);
//       } else {
//         toast.error(result.error || "Failed to update location");
//         setSaving(false);
//       }
//     } catch (error) {
//       console.error("Save error:", error);
//       toast.error("Failed to update location");
//       setSaving(false);
//     }
//   };

//   // Render option controls
//   const renderOptionControl = (optionKey, feature) => {
//     const currentValue = formData.options[optionKey];

//     switch (feature.type) {
//       case "boolean":
//         return (
//           <div
//             key={optionKey}
//             className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-blue-300 transition-colors"
//           >
//             <div>
//               <label className="font-medium text-slate-800">
//                 {feature.label}
//               </label>
//               {feature.category && (
//                 <p className="text-sm text-slate-500 mt-1">
//                   {feature.category}
//                 </p>
//               )}
//             </div>
//             <label className="relative inline-flex items-center cursor-pointer">
//               <input
//                 type="checkbox"
//                 checked={currentValue ?? feature.defaultValue ?? false}
//                 onChange={(e) =>
//                   handleOptionChange(optionKey, e.target.checked)
//                 }
//                 className="sr-only peer"
//               />
//               <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
//             </label>
//           </div>
//         );

//       case "multiselect":
//         const selectedValues = currentValue || feature.defaultValue || [];
//         return (
//           <div
//             key={optionKey}
//             className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200"
//           >
//             <label className="block font-semibold text-slate-800">
//               {feature.label}
//               {feature.required && <span className="text-red-500 ml-1">*</span>}
//             </label>
//             {feature.category && (
//               <p className="text-sm text-slate-500">{feature.category}</p>
//             )}

//             {selectedValues.length > 0 && (
//               <div className="text-sm text-blue-600 font-medium">
//                 {selectedValues.length} selected
//               </div>
//             )}

//             <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
//               {feature.options?.map((option, index) => {
//                 const value =
//                   typeof option === "string" ? option : option.value;
//                 const label =
//                   typeof option === "string" ? option : option.label;
//                 const isSelected = selectedValues.includes(value);

//                 return (
//                   <label
//                     key={index}
//                     className={`flex items-center space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
//                       isSelected
//                         ? "bg-blue-50 border-blue-500"
//                         : "bg-white border-slate-200 hover:bg-slate-50"
//                     }`}
//                   >
//                     <input
//                       type="checkbox"
//                       checked={isSelected}
//                       onChange={(e) =>
//                         handleMultiselectChange(
//                           optionKey,
//                           value,
//                           e.target.checked,
//                         )
//                       }
//                       className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
//                     />
//                     <span
//                       className={`text-sm font-medium ${
//                         isSelected ? "text-blue-700" : "text-slate-700"
//                       }`}
//                     >
//                       {label}
//                     </span>
//                   </label>
//                 );
//               })}
//             </div>

//             {selectedValues.length > 0 && (
//               <div className="flex flex-wrap gap-2 mt-2">
//                 {selectedValues.map((value) => {
//                   const option = feature.options?.find(
//                     (opt) =>
//                       (typeof opt === "string" ? opt : opt.value) === value,
//                   );
//                   const label = option
//                     ? typeof option === "string"
//                       ? option
//                       : option.label
//                     : value;

//                   return (
//                     <span
//                       key={value}
//                       className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full"
//                     >
//                       {label}
//                       <button
//                         type="button"
//                         onClick={() =>
//                           handleMultiselectChange(optionKey, value, false)
//                         }
//                         className="ml-1 text-blue-600 hover:text-blue-800"
//                       >
//                         ×
//                       </button>
//                     </span>
//                   );
//                 })}
//               </div>
//             )}
//           </div>
//         );

//       case "select":
//       case "dropdown":
//         return (
//           <div key={optionKey} className="space-y-2">
//             <label className="block font-semibold text-slate-800">
//               {feature.label}
//               {feature.required && <span className="text-red-500 ml-1">*</span>}
//             </label>
//             {feature.category && (
//               <p className="text-sm text-slate-500">{feature.category}</p>
//             )}
//             <select
//               value={currentValue ?? feature.defaultValue ?? ""}
//               onChange={(e) => handleOptionChange(optionKey, e.target.value)}
//               className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//               required={feature.required}
//             >
//               <option value="">Select {feature.label}</option>
//               {feature.options?.map((option, index) => {
//                 const value =
//                   typeof option === "string" ? option : option.value;
//                 const label =
//                   typeof option === "string" ? option : option.label;
//                 return (
//                   <option key={index} value={value}>
//                     {label}
//                   </option>
//                 );
//               })}
//             </select>
//           </div>
//         );

//       case "text":
//         return (
//           <div key={optionKey} className="space-y-2">
//             <label className="block font-semibold text-slate-800">
//               {feature.label}
//               {feature.required && <span className="text-red-500 ml-1">*</span>}
//             </label>
//             {feature.category && (
//               <p className="text-sm text-slate-500">{feature.category}</p>
//             )}
//             <input
//               type="text"
//               value={currentValue ?? feature.defaultValue ?? ""}
//               onChange={(e) => handleOptionChange(optionKey, e.target.value)}
//               className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//               placeholder={feature.placeholder || `Enter ${feature.label}`}
//               maxLength={feature.maxLength}
//               required={feature.required}
//             />
//           </div>
//         );

//       case "number":
//         return (
//           <div key={optionKey} className="space-y-2">
//             <label className="block font-semibold text-slate-800">
//               {feature.label}
//               {feature.required && <span className="text-red-500 ml-1">*</span>}
//             </label>
//             {feature.category && (
//               <p className="text-sm text-slate-500">{feature.category}</p>
//             )}
//             <input
//               type="number"
//               value={currentValue ?? feature.defaultValue ?? ""}
//               onChange={(e) =>
//                 handleOptionChange(optionKey, parseFloat(e.target.value) || "")
//               }
//               className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//               min={feature.min}
//               max={feature.max}
//               step={feature.step || "any"}
//               required={feature.required}
//             />
//           </div>
//         );

//       case "textarea":
//         return (
//           <div key={optionKey} className="space-y-2">
//             <label className="block font-semibold text-slate-800">
//               {feature.label}
//               {feature.required && <span className="text-red-500 ml-1">*</span>}
//             </label>
//             {feature.category && (
//               <p className="text-sm text-slate-500">{feature.category}</p>
//             )}
//             <textarea
//               value={currentValue ?? feature.defaultValue ?? ""}
//               onChange={(e) => handleOptionChange(optionKey, e.target.value)}
//               className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//               placeholder={feature.placeholder || `Enter ${feature.label}`}
//               rows={feature.rows || 3}
//               maxLength={feature.maxLength}
//               required={feature.required}
//             />
//           </div>
//         );

//       default:
//         return (
//           <div key={optionKey} className="space-y-2">
//             <label className="block font-semibold text-slate-800">
//               {feature.label}
//             </label>
//             <input
//               type="text"
//               value={currentValue ?? ""}
//               onChange={(e) => handleOptionChange(optionKey, e.target.value)}
//               className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//               placeholder={`Enter ${feature.label}`}
//             />
//           </div>
//         );
//     }
//   };

//   // Clean up preview URLs on unmount
//   useEffect(() => {
//     return () => {
//       previewImages.forEach((preview) => {
//         if (preview.url.startsWith("blob:")) {
//           URL.revokeObjectURL(preview.url);
//         }
//       });
//     };
//   }, []);

//   if (loading || navigationLoading) {
//     return (
//       <div className="flex justify-center items-center h-screen">
//         <Loader size="large" color="#3b82f6" message="Loading location..." />
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
//         <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md w-full">
//           <div className="text-red-500 mb-4">
//             <AlertCircle className="w-12 h-12 mx-auto" />
//           </div>
//           <h2 className="text-xl font-semibold text-slate-900 mb-2">
//             Something went wrong
//           </h2>
//           <p className="text-slate-600 mb-6">{error}</p>
//           <button
//             onClick={() => router.back()}
//             className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
//           >
//             Go Back
//           </button>
//         </div>
//       </div>
//     );
//   }

//   if (!location) {
//     return (
//       <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
//         <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md w-full">
//           <MapPin className="w-12 h-12 text-slate-400 mx-auto mb-4" />
//           <h2 className="text-xl font-semibold text-slate-900 mb-2">
//             Location not found
//           </h2>
//           <p className="text-slate-600">
//             This location doesn't exist or has been removed.
//           </p>
//         </div>
//       </div>
//     );
//   }

//   const navigationInfo = getNavigationInfo();

//   const updateUsageCategory = (gender, field, value) => {
//     setFormData((prev) => ({
//       ...prev,
//       usage_category: {
//         ...prev.usage_category,
//         [gender]: {
//           ...prev.usage_category[gender],
//           [field]: value === "" ? 0 : parseInt(value),
//         },
//       },
//     }));
//   };

//   return (
//     <>
//       <Toaster position="top-right" />

//       <div className="min-h-screen bg-slate-50">
//         {/* Header */}
//         <div className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
//           <div className="max-w-6xl mx-auto px-4 py-4">
//             <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
//               <button
//                 onClick={() =>
//                   router.push(`/washrooms?companyId=${finalCompanyId}`)
//                 }
//                 className="flex items-center text-slate-600 hover:text-slate-900 transition-colors"
//               >
//                 <ArrowLeft className="w-5 h-5 mr-2" />
//                 <span className="font-medium">Back to Listings</span>
//               </button>

//               {/* Navigation Controls */}
//               <div className="flex items-center gap-2 w-full sm:w-auto">
//                 <button
//                   onClick={handlePrevious}
//                   disabled={!navigationInfo.hasPrevious}
//                   className="flex items-center px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm flex-1 sm:flex-none justify-center"
//                   title={
//                     navigationInfo.previousName
//                       ? `Previous: ${navigationInfo.previousName}`
//                       : "No previous location"
//                   }
//                 >
//                   <ChevronLeft className="w-4 h-4 mr-1" />
//                   <span className="hidden sm:inline">
//                     {navigationInfo.previousName &&
//                       navigationInfo.previousName.substring(0, 15)}
//                   </span>
//                 </button>

//                 <span className="px-3 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium whitespace-nowrap">
//                   {navigationInfo.currentIndex + 1} of {allLocations.length}
//                 </span>

//                 <button
//                   onClick={handleNext}
//                   disabled={!navigationInfo.hasNext}
//                   className="flex items-center px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm flex-1 sm:flex-none justify-center"
//                   title={
//                     navigationInfo.nextName
//                       ? `Next: ${navigationInfo.nextName}`
//                       : "No next location"
//                   }
//                 >
//                   <span className="hidden sm:inline">
//                     {navigationInfo.nextName &&
//                       navigationInfo.nextName.substring(0, 15)}
//                   </span>
//                   <ChevronRight className="w-4 h-4 ml-1" />
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>

//         <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
//           {/* Main Form */}
//           <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden mb-6">
//             {/* Form Header */}
//             <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-6">
//               <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
//                 <div>
//                   <h1 className="text-2xl font-bold text-white mb-2">
//                     Edit Washroom
//                   </h1>
//                   <p className="text-blue-100 text-sm">
//                     Update location information, address, images, and amenities
//                   </p>
//                 </div>
//                 <button
//                   onClick={() =>
//                     router.push(
//                       `/washrooms/item/${params.id}?companyId=${finalCompanyId}`,
//                     )
//                   }
//                   className="flex items-center px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors shadow-md whitespace-nowrap"
//                 >
//                   <Eye className="w-4 h-4 mr-2" />
//                   View Location
//                 </button>
//               </div>
//             </div>

//             <div className="p-4 sm:p-6 lg:p-8 space-y-8">
//               {/* ========== FACILITY COMPANY SECTION ========== */}
//               <div className="space-y-4 border-t border-slate-200 pt-6 mt-6">
//                 <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
//                   <Building2 className="w-5 h-5 text-blue-600" />
//                   Facility Company Assignment
//                 </h3>

//                 {/* Current Assignment Display */}
//                 {selectedFacilityCompany && (
//                   <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
//                     <p className="text-sm text-blue-800 font-medium">
//                       Current Assignment:{" "}
//                       <span className="font-bold">
//                         {facilityCompanies.find(
//                           (fc) => fc.id === selectedFacilityCompany,
//                         )?.name || "Unknown Company"}
//                       </span>
//                     </p>
//                   </div>
//                 )}

//                 {/* Current Status if null */}
//                 {!selectedFacilityCompany && (
//                   <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
//                     <p className="text-sm text-amber-800 font-medium flex items-center gap-2">
//                       <AlertCircle className="w-4 h-4" />
//                       No facility company assigned
//                     </p>
//                   </div>
//                 )}

//                 {/* Facility Company Dropdown */}
//                 <div className="space-y-2">
//                   <label className="block font-semibold text-slate-800">
//                     Select Facility Company
//                   </label>
//                   <select
//                     value={formData.facility_companiesId || ""}
//                     onChange={(e) => {
//                       const newValue =
//                         e.target.value === "" ? null : e.target.value;
//                       handleInputChange("facility_companiesId", newValue);
//                       setSelectedFacilityCompany(newValue);
//                     }}
//                     className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   >
//                     <option value="">-- No Facility Company --</option>
//                     {facilityCompanies.map((company) => (
//                       <option key={company.id} value={company.id}>
//                         {company.name}
//                       </option>
//                     ))}
//                   </select>
//                 </div>

//                 {/* ========== LOCATION HIERARCHY SECTION ========== */}
//                 <div className="space-y-4 border-t border-slate-200 pt-6 mt-6">
//                   <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
//                     <Home className="w-5 h-5 text-blue-600" />
//                     Location Hierarchy
//                   </h3>

//                   {/* Current Assignment Display */}
//                   {selectedLocationType && (
//                     <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
//                       <p className="text-sm text-blue-800 font-medium">
//                         Current Type:{" "}
//                         <span className="font-bold">
//                           {locationTypes.find(
//                             (lt) => lt.id === selectedLocationType,
//                           )?.name || "Unknown Type"}
//                         </span>
//                       </p>
//                     </div>
//                   )}

//                   {/* Current Status if null */}
//                   {!selectedLocationType && (
//                     <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
//                       <p className="text-sm text-amber-800 font-medium flex items-center gap-2">
//                         <AlertCircle className="w-4 h-4" />
//                         No location type assigned
//                       </p>
//                     </div>
//                   )}

//                   {/* Location Type Dropdown */}
//                   <div className="space-y-2">
//                     <label className="block font-semibold text-slate-800">
//                       Select Location Type
//                     </label>
//                     <select
//                       value={formData.type_id || ""}
//                       onChange={(e) => {
//                         const newValue =
//                           e.target.value === "" ? null : e.target.value;
//                         handleInputChange("type_id", newValue);
//                         setSelectedLocationType(newValue);
//                       }}
//                       className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                     >
//                       <option value="">-- No Location Type --</option>
//                       {locationTypes.map((locationType) => (
//                         <option key={locationType.id} value={locationType.id}>
//                           {locationType.name}
//                         </option>
//                       ))}
//                     </select>
//                   </div>

//                   {/* Change Indicator */}
//                   {selectedLocationType !== location?.type_id && (
//                     <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
//                       <p className="text-sm text-green-700 font-medium">
//                         {selectedLocationType ? (
//                           <>
//                             ✓ Will change from{" "}
//                             <span className="font-bold">
//                               {location?.type_id
//                                 ? locationTypes.find(
//                                     (lt) => lt.id === location.type_id,
//                                   )?.name || "Unknown"
//                                 : "None"}
//                             </span>
//                             {" to "}
//                             <span className="font-bold">
//                               {
//                                 locationTypes.find(
//                                   (lt) => lt.id === selectedLocationType,
//                                 )?.name
//                               }
//                             </span>
//                           </>
//                         ) : (
//                           <>✓ Will remove location type assignment</>
//                         )}
//                       </p>
//                     </div>
//                   )}
//                 </div>

//                 {/* Change Indicator */}
//                 {selectedFacilityCompany !== location?.facility_companiesId && (
//                   <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
//                     <p className="text-sm text-green-700 font-medium">
//                       {selectedFacilityCompany ? (
//                         <>
//                           ✓ Will change from{" "}
//                           <span className="font-bold">
//                             {location?.facility_companiesId
//                               ? facilityCompanies.find(
//                                   (fc) =>
//                                     fc.id === location.facility_companiesId,
//                                 )?.name || "Unknown"
//                               : "None"}
//                           </span>
//                           {" to "}
//                           <span className="font-bold">
//                             {
//                               facilityCompanies.find(
//                                 (fc) => fc.id === selectedFacilityCompany,
//                               )?.name
//                             }
//                           </span>
//                         </>
//                       ) : (
//                         <>✓ Will remove facility company assignment</>
//                       )}
//                     </p>
//                   </div>
//                 )}
//               </div>

//               {/* ========== SECTION 1: BASIC INFORMATION ========== */}
//               <div className="space-y-6">
//                 <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 border-b border-slate-200 pb-3">
//                   <Building2 className="w-6 h-6 text-blue-600" />
//                   Basic Information
//                 </h2>

//                 {/* Location Name */}
//                 <div className="space-y-2">
//                   <label className="block font-semibold text-slate-800">
//                     Location Name <span className="text-red-500">*</span>
//                   </label>
//                   <input
//                     type="text"
//                     value={formData.name}
//                     onChange={(e) => handleInputChange("name", e.target.value)}
//                     className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                     placeholder="Enter location name"
//                     required
//                   />
//                 </div>

//                 {/* Coordinates Row */}
//                 {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                   <div className="space-y-2">
//                     <label className="block font-semibold text-slate-800">Latitude</label>
//                     <input
//                       type="number"
//                       step="any"
//                       value={formData.latitude}
//                       onChange={(e) => handleInputChange('latitude', e.target.value)}
//                       className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                       placeholder="e.g., 21.1458"
//                     />
//                   </div>

//                   <div className="space-y-2">
//                     <label className="block font-semibold text-slate-800">Longitude</label>
//                     <input
//                       type="number"
//                       step="any"
//                       value={formData.longitude}
//                       onChange={(e) => handleInputChange('longitude', e.target.value)}
//                       className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                       placeholder="e.g., 79.0882"
//                     />
//                   </div>

//                   <div className="space-y-2">
//                     <label className="block font-semibold text-slate-800">View on Map</label>
//                     <button
//                       type="button"
//                       onClick={() => window.open(`https://maps.google.com/?q=${formData.latitude},${formData.longitude}`, '_blank')}
//                       disabled={!formData.latitude || !formData.longitude}
//                       className="w-full flex items-center justify-center px-4 py-3 border-2 border-slate-300 rounded-xl bg-white text-slate-800 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
//                     >
//                       <Navigation className="w-4 h-4 mr-2" />
//                       Open in Maps
//                     </button>
//                   </div>
//                 </div> */}

//                 {/* ========== LOCATION COORDINATES WITH MAP ========== */}
//                 <div className="space-y-4 border-t border-slate-200 pt-6 mt-6">
//                   <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
//                     <MapPin className="w-5 h-5 text-blue-600" />
//                     Location Coordinates
//                   </h3>

//                   {/* Info Banner */}
//                   {/* <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
//                     <p className="text-sm text-blue-800">
//                       <span className="font-semibold">Interactive Map:</span> Click on the map to select a new location,
//                       or manually enter coordinates below. Changes are synchronized automatically.
//                     </p>
//                   </div> */}

//                   {/* Google Map Picker - Interactive Map */}
//                   <div className="bg-white p-2 border-2 border-slate-300 overflow-hidden">
//                     <GoogleMapPicker
//                       lat={
//                         formData.latitude ? parseFloat(formData.latitude) : null
//                       }
//                       lng={
//                         formData.longitude
//                           ? parseFloat(formData.longitude)
//                           : null
//                       }
//                       onSelect={(lat, lng) => {
//                         handleInputChange("latitude", lat?.toString() || "");
//                         handleInputChange("longitude", lng?.toString() || "");
//                       }}
//                     />
//                   </div>

//                   {/* Manual Lat/Long Input */}
//                   <LatLongInput
//                     lat={
//                       formData.latitude ? parseFloat(formData.latitude) : null
//                     }
//                     lng={
//                       formData.longitude ? parseFloat(formData.longitude) : null
//                     }
//                     onChange={(lat, lng) => {
//                       handleInputChange("latitude", lat?.toString() || "");
//                       handleInputChange("longitude", lng?.toString() || "");
//                     }}
//                   />

//                   {/* Current Coordinates Display */}
//                   {formData.latitude && formData.longitude && (
//                     <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
//                       <p className="text-sm text-green-800 font-medium flex items-center gap-2">
//                         <Navigation className="w-4 h-4" />
//                         Current Coordinates:
//                         <span className="font-mono">
//                           {parseFloat(formData.latitude).toFixed(6)},{" "}
//                           {parseFloat(formData.longitude).toFixed(6)}
//                         </span>
//                       </p>
//                       {(formData.latitude !== location?.latitude?.toString() ||
//                         formData.longitude !==
//                           location?.longitude?.toString()) && (
//                         <p className="text-xs text-green-700 mt-2">
//                           ✓ Coordinates have been modified
//                         </p>
//                       )}
//                     </div>
//                   )}

//                   {/* No Coordinates Warning */}
//                   {(!formData.latitude || !formData.longitude) && (
//                     <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
//                       <p className="text-sm text-amber-800 font-medium flex items-center gap-2">
//                         <AlertCircle className="w-4 h-4" />
//                         No coordinates set. Click on the map or enter
//                         coordinates manually.
//                       </p>
//                     </div>
//                   )}
//                 </div>
//               </div>

//               {/* Number of Photos Field - Simple Version */}
//               <div>
//                 <label className="block text-sm font-medium text-slate-700 mb-2">
//                   Maximum Photos Allowed
//                 </label>
//                 <input
//                   type="number"
//                   min="1"
//                   max="20"
//                   value={formData.no_of_photos}
//                   onChange={(e) =>
//                     handleInputChange("no_of_photos", parseInt(e.target.value))
//                   }
//                   className="w-full p-3 border border-slate-300 rounded-xl bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
//                   placeholder="Enter number (1-20)"
//                 />
//               </div>

//               {/* ✅ ADD THIS - Usage Category Section */}
//               {/* ✅ Usage Category Section */}
//               <div className="col-span-2">
//                 <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
//                   <Droplets className="h-5 w-5 text-blue-600" />
//                   Usage Category
//                 </h3>

//                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//                   {/* Men Section */}
//                   <div className="p-5 border-2 border-blue-200 rounded-xl bg-gradient-to-br from-blue-50 via-white to-blue-50 shadow-sm">
//                     <div className="flex items-center gap-2 mb-4 pb-3 border-b border-blue-200">
//                       <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shadow-sm">
//                         <Users className="w-4 h-4 text-white" />
//                       </div>
//                       <h4 className="text-base font-semibold text-blue-800">
//                         Men's Facilities
//                       </h4>
//                     </div>
//                     <div className="space-y-3">
//                       {/* WC */}
//                       <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-blue-100/50 transition-colors">
//                         <span className="text-sm font-medium text-slate-700 w-20">
//                           WC
//                         </span>
//                         <input
//                           type="number"
//                           min="0"
//                           placeholder="0"
//                           value={formData.usage_category.men.wc}
//                           onChange={(e) =>
//                             updateUsageCategory("men", "wc", e.target.value)
//                           }
//                           className="flex-1 p-2.5 text-sm border-2 border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                         />
//                       </div>

//                       {/* Indian */}
//                       <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-blue-100/50 transition-colors">
//                         <span className="text-sm font-medium text-slate-700 w-20">
//                           Indian
//                         </span>
//                         <input
//                           type="number"
//                           min="0"
//                           placeholder="0"
//                           value={formData.usage_category.men.indian}
//                           onChange={(e) =>
//                             updateUsageCategory("men", "indian", e.target.value)
//                           }
//                           className="flex-1 p-2.5 text-sm border-2 border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                         />
//                       </div>

//                       {/* Urinals */}
//                       <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-blue-100/50 transition-colors">
//                         <span className="text-sm font-medium text-slate-700 w-20">
//                           Urinals
//                         </span>
//                         <input
//                           type="number"
//                           min="0"
//                           placeholder="0"
//                           value={formData.usage_category.men.urinals}
//                           onChange={(e) =>
//                             updateUsageCategory(
//                               "men",
//                               "urinals",
//                               e.target.value,
//                             )
//                           }
//                           className="flex-1 p-2.5 text-sm border-2 border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                         />
//                       </div>

//                       {/* ✅ NEW: Shower */}
//                       <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-blue-100/50 transition-colors">
//                         <span className="text-sm font-medium text-slate-700 w-20 flex items-center gap-1">
//                           <Droplets className="w-3.5 h-3.5 text-blue-600" />
//                           Shower
//                         </span>
//                         <input
//                           type="number"
//                           min="0"
//                           placeholder="0"
//                           value={formData.usage_category.men.shower}
//                           onChange={(e) =>
//                             updateUsageCategory("men", "shower", e.target.value)
//                           }
//                           className="flex-1 p-2.5 text-sm border-2 border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                         />
//                       </div>

//                       {/* ✅ NEW: Basin */}
//                       <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-blue-100/50 transition-colors">
//                         <span className="text-sm font-medium text-slate-700 w-20 flex items-center gap-1">
//                           <Armchair className="w-3.5 h-3.5 text-blue-600" />
//                           Basin
//                         </span>
//                         <input
//                           type="number"
//                           min="0"
//                           placeholder="0"
//                           value={formData.usage_category.men.basin}
//                           onChange={(e) =>
//                             updateUsageCategory("men", "basin", e.target.value)
//                           }
//                           className="flex-1 p-2.5 text-sm border-2 border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                         />
//                       </div>
//                     </div>
//                   </div>

//                   {/* Women Section */}
//                   <div className="p-5 border-2 border-pink-200 rounded-xl bg-gradient-to-br from-pink-50 via-white to-pink-50 shadow-sm">
//                     <div className="flex items-center gap-2 mb-4 pb-3 border-b border-pink-200">
//                       <div className="w-8 h-8 rounded-full bg-pink-600 flex items-center justify-center shadow-sm">
//                         <Users className="w-4 h-4 text-white" />
//                       </div>
//                       <h4 className="text-base font-semibold text-pink-800">
//                         Women's Facilities
//                       </h4>
//                     </div>
//                     <div className="space-y-3">
//                       {/* WC */}
//                       <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-pink-100/50 transition-colors">
//                         <span className="text-sm font-medium text-slate-700 w-20">
//                           WC
//                         </span>
//                         <input
//                           type="number"
//                           min="0"
//                           placeholder="0"
//                           value={formData.usage_category.women.wc}
//                           onChange={(e) =>
//                             updateUsageCategory("women", "wc", e.target.value)
//                           }
//                           className="flex-1 p-2.5 text-sm border-2 border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
//                         />
//                       </div>

//                       {/* Indian */}
//                       <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-pink-100/50 transition-colors">
//                         <span className="text-sm font-medium text-slate-700 w-20">
//                           Indian
//                         </span>
//                         <input
//                           type="number"
//                           min="0"
//                           placeholder="0"
//                           value={formData.usage_category.women.indian}
//                           onChange={(e) =>
//                             updateUsageCategory(
//                               "women",
//                               "indian",
//                               e.target.value,
//                             )
//                           }
//                           className="flex-1 p-2.5 text-sm border-2 border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
//                         />
//                       </div>

//                       {/* Urinals */}
//                       <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-pink-100/50 transition-colors">
//                         <span className="text-sm font-medium text-slate-700 w-20">
//                           Urinals
//                         </span>
//                         <input
//                           type="number"
//                           min="0"
//                           placeholder="0"
//                           value={formData.usage_category.women.urinals}
//                           onChange={(e) =>
//                             updateUsageCategory(
//                               "women",
//                               "urinals",
//                               e.target.value,
//                             )
//                           }
//                           className="flex-1 p-2.5 text-sm border-2 border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
//                         />
//                       </div>

//                       {/* ✅ NEW: Shower */}
//                       <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-pink-100/50 transition-colors">
//                         <span className="text-sm font-medium text-slate-700 w-20 flex items-center gap-1">
//                           <Droplets className="w-3.5 h-3.5 text-pink-600" />
//                           Shower
//                         </span>
//                         <input
//                           type="number"
//                           min="0"
//                           placeholder="0"
//                           value={formData.usage_category.women.shower}
//                           onChange={(e) =>
//                             updateUsageCategory(
//                               "women",
//                               "shower",
//                               e.target.value,
//                             )
//                           }
//                           className="flex-1 p-2.5 text-sm border-2 border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
//                         />
//                       </div>

//                       {/* ✅ NEW: Basin */}
//                       <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-pink-100/50 transition-colors">
//                         <span className="text-sm font-medium text-slate-700 w-20 flex items-center gap-1">
//                           <Armchair className="w-3.5 h-3.5 text-pink-600" />
//                           Basin
//                         </span>
//                         <input
//                           type="number"
//                           min="0"
//                           placeholder="0"
//                           value={formData.usage_category.women.basin}
//                           onChange={(e) =>
//                             updateUsageCategory(
//                               "women",
//                               "basin",
//                               e.target.value,
//                             )
//                           }
//                           className="flex-1 p-2.5 text-sm border-2 border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
//                         />
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               {/* ========== SECTION 2: ADDRESS DETAILS ========== */}
//               {/* Address Details */}
//               <div className="space-y-6 border-t border-slate-200 pt-8">
//                 <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 border-b border-slate-200 pb-3">
//                   <MapPin className="w-6 h-6 text-blue-600" />
//                   Address Details
//                 </h2>

//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                   {/* State */}
//                   <SearchableSelect
//                     options={availableStates}
//                     value={formData.state}
//                     onChange={(value) => handleInputChange("state", value)}
//                     placeholder="Select or type state"
//                     label="State"
//                     allowCustom={true}
//                   />

//                   {/* City */}
//                   <SearchableSelect
//                     options={availableCities}
//                     value={formData.city}
//                     onChange={(value) => handleInputChange("city", value)}
//                     placeholder="Select or type city"
//                     label="City"
//                     allowCustom={true}
//                   />

//                   {/* District */}
//                   <SearchableSelect
//                     options={[]}
//                     value={formData.dist}
//                     onChange={(value) => handleInputChange("dist", value)}
//                     placeholder="Enter district name"
//                     label="District"
//                     allowCustom={true}
//                   />

//                   {/* Pincode */}
//                   <div>
//                     <label className="block text-sm font-medium text-slate-700 mb-2">
//                       Pincode
//                     </label>
//                     <input
//                       type="text"
//                       placeholder="Enter 6-digit pincode"
//                       value={formData.pincode}
//                       onChange={(e) =>
//                         handleInputChange("pincode", e.target.value)
//                       }
//                       maxLength={6}
//                       className="w-full p-3 border border-slate-300 rounded-xl bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
//                     />
//                   </div>
//                 </div>

//                 {/* Full Address */}
//                 <div>
//                   <label className="block text-sm font-medium text-slate-700 mb-2">
//                     Full Address
//                   </label>
//                   <textarea
//                     placeholder="Enter complete address"
//                     value={formData.address}
//                     onChange={(e) =>
//                       handleInputChange("address", e.target.value)
//                     }
//                     rows={3}
//                     className="w-full p-3 border border-slate-300 rounded-xl bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
//                   />
//                 </div>
//               </div>

//               {/* ========== SECTION 3: IMAGES ========== */}
//               <div className="space-y-6 border-t border-slate-200 pt-8">
//                 <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 border-b border-slate-200 pb-3">
//                   <ImageIcon className="w-6 h-6 text-blue-600" />
//                   Location Images
//                   {(existingImages.length > 0 || previewImages.length > 0) && (
//                     <span className="text-sm font-normal text-slate-500">
//                       ({existingImages.length + previewImages.length} total)
//                     </span>
//                   )}
//                 </h2>

//                 {/* Upload Area */}
//                 <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
//                   <input
//                     ref={fileInputRef}
//                     type="file"
//                     accept="image/*"
//                     multiple
//                     onChange={handleFileSelect}
//                     className="hidden"
//                   />

//                   <div className="space-y-4">
//                     <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
//                       <Upload className="h-8 w-8 text-blue-600" />
//                     </div>

//                     <div>
//                       <button
//                         type="button"
//                         onClick={triggerFileInput}
//                         className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-md"
//                       >
//                         <Plus className="h-5 w-5" />
//                         {existingImages.length === 0 &&
//                         previewImages.length === 0
//                           ? "Add Images"
//                           : "Add More Images"}
//                       </button>
//                       <p className="text-sm text-slate-500 mt-2">
//                         Select multiple images (max 10MB each)
//                       </p>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Current Images */}
//                 {(existingImages.length > 0 || previewImages.length > 0) && (
//                   <div className="space-y-4">
//                     <div className="flex items-center justify-between">
//                       <h4 className="font-semibold text-slate-700">
//                         Current Images (
//                         {existingImages.length + previewImages.length})
//                       </h4>

//                       {(existingImages.length > 0 ||
//                         previewImages.length > 0) && (
//                         <button
//                           type="button"
//                           onClick={() => {
//                             setImagesToDelete((prev) => [
//                               ...prev,
//                               ...existingImages,
//                             ]);
//                             setExistingImages([]);
//                             previewImages.forEach((preview) =>
//                               URL.revokeObjectURL(preview.url),
//                             );
//                             setNewImages([]);
//                             setPreviewImages([]);
//                             toast.success("All images marked for removal");
//                           }}
//                           className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
//                         >
//                           <Trash2 className="h-4 w-4" />
//                           Clear All
//                         </button>
//                       )}
//                     </div>

//                     <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
//                       {/* Existing Images */}
//                       {existingImages.map((imageUrl, index) => (
//                         <div
//                           key={`existing-${index}`}
//                           className="relative group bg-white rounded-lg border-2 border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
//                         >
//                           <img
//                             src={imageUrl}
//                             alt={`Existing ${index + 1}`}
//                             className="w-full h-32 object-cover cursor-pointer hover:opacity-90 transition-opacity"
//                             onClick={() => setSelectedImageIndex(index)}
//                           />

//                           <button
//                             type="button"
//                             onClick={(e) => {
//                               e.stopPropagation();
//                               removeExistingImage(imageUrl);
//                               toast.success("Image marked for deletion");
//                             }}
//                             className="absolute top-2 right-2 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors shadow-lg"
//                           >
//                             <X className="h-4 w-4" />
//                           </button>

//                           <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
//                             <p className="text-xs text-white font-medium">
//                               Existing
//                             </p>
//                           </div>
//                         </div>
//                       ))}

//                       {/* New Images */}
//                       {previewImages.map((preview, index) => (
//                         <div
//                           key={`new-${index}`}
//                           className="relative group bg-white rounded-lg border-2 border-green-500 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
//                         >
//                           <img
//                             src={preview.url}
//                             alt={`New ${index + 1}`}
//                             className="w-full h-32 object-cover cursor-pointer hover:opacity-90 transition-opacity"
//                             onClick={() =>
//                               setSelectedImageIndex(
//                                 existingImages.length + index,
//                               )
//                             }
//                           />

//                           <button
//                             type="button"
//                             onClick={(e) => {
//                               e.stopPropagation();
//                               removeNewImage(index);
//                               toast.success("New image removed");
//                             }}
//                             className="absolute top-2 right-2 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors shadow-lg"
//                           >
//                             <X className="h-4 w-4" />
//                           </button>

//                           <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-green-600/80 to-transparent p-2">
//                             <p className="text-xs text-white font-medium truncate">
//                               New
//                             </p>
//                           </div>
//                         </div>
//                       ))}
//                     </div>

//                     {/* Status Indicators */}
//                     <div className="space-y-2">
//                       {imagesToDelete.length > 0 && (
//                         <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
//                           <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
//                           <div className="flex-1">
//                             <p className="text-sm text-red-600 font-medium">
//                               {imagesToDelete.length} existing image(s) will be
//                               deleted when you save
//                             </p>
//                           </div>
//                           <button
//                             type="button"
//                             onClick={() => {
//                               setExistingImages((prev) => [
//                                 ...prev,
//                                 ...imagesToDelete,
//                               ]);
//                               setImagesToDelete([]);
//                               toast.success("Image deletions cancelled");
//                             }}
//                             className="text-xs text-red-600 hover:text-red-700 underline"
//                           >
//                             Undo
//                           </button>
//                         </div>
//                       )}

//                       {newImages.length > 0 && (
//                         <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
//                           <Plus className="h-4 w-4 text-green-600 flex-shrink-0" />
//                           <p className="text-sm text-green-600 font-medium">
//                             {newImages.length} new image(s) will be added when
//                             you save
//                           </p>
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                 )}
//               </div>

//               {/* ========== SECTION 4: AMENITIES & FEATURES ========== */}
//               {Object.keys(toiletFeatures).length > 0 && (
//                 <div className="space-y-6 border-t border-slate-200 pt-8">
//                   <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 border-b border-slate-200 pb-3">
//                     <MapPin className="w-6 h-6 text-blue-600" />
//                     Amenities & Features
//                   </h2>
//                   <div className="grid grid-cols-1 gap-4">
//                     {Object.entries(toiletFeatures).map(([key, feature]) =>
//                       renderOptionControl(key, feature),
//                     )}
//                   </div>
//                 </div>
//               )}

//               {/* Action Buttons */}
//               <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-6 border-t border-slate-200">
//                 <button
//                   type="button"
//                   onClick={() => router.back()}
//                   className="w-full sm:w-auto px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
//                   disabled={saving}
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   type="button"
//                   onClick={handleSave}
//                   disabled={saving || !canEditLocation}
//                   className="w-full sm:w-auto flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-md"
//                 >
//                   {saving ? (
//                     <>
//                       <div className="w-5 h-5 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
//                       Saving...
//                     </>
//                   ) : (
//                     <>
//                       <Save className="w-5 h-5 mr-2" />
//                       Save Changes
//                     </>
//                   )}

//                   {/* <>
//                     <Save className="w-5 h-5 mr-2" />
//                     Save Changes
//                   </> */}
//                 </button>
//                 {!canEditLocation && (
//                   <div className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded-lg mb-6">
//                     <div className="flex items-start gap-3">
//                       <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
//                       <div>
//                         <p className="text-sm font-semibold text-amber-800">
//                           Read-Only Mode
//                         </p>
//                         <p className="text-sm text-amber-700">
//                           You don't have permission to edit this location
//                         </p>
//                       </div>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Image Modal */}
//       {selectedImageIndex !== null && (
//         <div
//           className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
//           onClick={() => setSelectedImageIndex(null)}
//         >
//           <div className="relative max-w-4xl max-h-full">
//             {(() => {
//               const isExistingImage =
//                 selectedImageIndex < existingImages.length;
//               const imageUrl = isExistingImage
//                 ? existingImages[selectedImageIndex]
//                 : previewImages[selectedImageIndex - existingImages.length]
//                     ?.url;

//               return (
//                 <img
//                   src={imageUrl}
//                   alt={`Full view ${selectedImageIndex + 1}`}
//                   className="max-w-full max-h-full object-contain rounded-lg"
//                   style={{ maxHeight: "90vh" }}
//                 />
//               );
//             })()}

//             <button
//               onClick={() => setSelectedImageIndex(null)}
//               className="absolute top-4 right-4 text-white hover:text-gray-300 text-2xl font-bold bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center"
//             >
//               ×
//             </button>

//             <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 text-white px-4 py-2 rounded-lg">
//               <p className="text-sm">
//                 Image {selectedImageIndex + 1} of{" "}
//                 {existingImages.length + previewImages.length}
//                 {selectedImageIndex < existingImages.length
//                   ? " (Existing)"
//                   : " (New)"}
//               </p>
//             </div>
//           </div>
//         </div>
//       )}
//     </>
//   );
// };

// export default EditLocationPage;