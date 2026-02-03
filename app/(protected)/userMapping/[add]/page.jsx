"use client";

import { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import toast, { Toaster } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { UsersApi } from "@/features/users/users.api";
import { LocationsApi } from "@/features/locations/locations.api";
import { AssignmentsApi } from "@/features/assignments/assignments.api";
import { useCompanyId } from "@/providers/CompanyProvider";
import { usePermissions } from "@/shared/hooks/usePermission";
import { useRequirePermission } from "@/shared/hooks/useRequirePermission";
import { MODULES } from "@/shared/constants/permissions";
import {
  User,
  MapPin,
  Search,
  ChevronDown,
  X,
  CheckSquare,
  Square,
  Users,
  AlertCircle,
  Loader,
  ArrowLeft,
  Check,
  Shield,
  ShieldCheck,
  ClipboardPlus,
} from "lucide-react";
import Link from "next/link";

const AddAssignmentPage = () => {
  useRequirePermission(MODULES.ASSIGNMENTS);

  const { canAdd } = usePermissions();
  const canAddAssignment = canAdd(MODULES.ASSIGNMENTS);

  // --- STATE MANAGEMENT ---
  const [assignmentMode, setAssignmentMode] = useState("multi");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [singleUser, setSingleUser] = useState("");

  const [allUsers, setAllUsers] = useState([]);
  const [allLocations, setAllLocations] = useState([]);
  const [availableLocations, setAvailableLocations] = useState([]);
  const [userAssignedLocations, setUserAssignedLocations] = useState([]);

  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [locationSearchTerm, setLocationSearchTerm] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState("all");

  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingAssignments, setIsFetchingAssignments] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  const { user: loggedInUser } = useSelector((state) => state.auth);
  const { companyId } = useCompanyId();

  const userDropdownRef = useRef(null);
  const locationDropdownRef = useRef(null);
  const router = useRouter();

  const assignableUsers = allUsers.filter(
    (u) => u.role_id !== 1 && u.role_id !== 2,
  );
  const uniqueRoles = [
    ...new Set(assignableUsers.map((u) => u.role?.name).filter(Boolean)),
  ];

  const getRoleColor = (roleName) => {
    if (!roleName)
      return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";

    const role = roleName.toLowerCase();
    switch (role) {
      case "supervisor":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
      case "cleaner":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300";
      case "zonal admin":
      case "zonaladmin":
        return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300";
      case "facility supervisor":
        return "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300";
      case "facility admin":
        return "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  // --- DATA FETCHING ---
  useEffect(() => {
    if (!companyId) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const userRes = await UsersApi.getAllUsers(companyId);
        const locationRes = await LocationsApi.getAllLocations(companyId);

        if (userRes.success) setAllUsers(userRes.data || []);
        if (locationRes.success) setAllLocations(locationRes.data || []);
      } catch (err) {
        console.error("❌ Error while fetching:", err);
        toast.error("Failed to load data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [companyId]);

  // --- FETCH ASSIGNED LOCATIONS FOR SINGLE USER MODE ---
  useEffect(() => {
    if (assignmentMode === "single" && singleUser) {
      fetchUserAssignments(singleUser);
    } else {
      setAvailableLocations(allLocations);
    }
  }, [singleUser, assignmentMode, allLocations]);

  const fetchUserAssignments = async (userId) => {
    setIsFetchingAssignments(true);
    try {
      const response = await AssignmentsApi.getAssignmentsByCleanerId(
        userId,
        companyId,
      );

      if (response.success) {
        const assignedLocationIds = response.data.map((a) => a.location_id);
        setUserAssignedLocations(assignedLocationIds);

        const unassignedLocations = allLocations.filter(
          (loc) => !assignedLocationIds.includes(loc.id),
        );
        setAvailableLocations(unassignedLocations);
      }
    } catch (error) {
      console.error("Error fetching user assignments:", error);
      toast.error("Failed to load user assignments");
      setAvailableLocations(allLocations);
    } finally {
      setIsFetchingAssignments(false);
    }
  };

  // --- VALIDATE ASSIGNMENTS BEFORE SUBMIT ---
  const validateAssignments = async () => {
    setIsValidating(true);
    const conflicts = [];

    try {
      const usersToCheck =
        assignmentMode === "multi"
          ? selectedUsers
          : [assignableUsers.find((u) => u.id === singleUser)];

      for (const user of usersToCheck) {
        const response = await AssignmentsApi.getAssignmentsByCleanerId(
          user.id,
          companyId,
        );

        if (response.success) {
          const assignedLocationIds = response.data.map((a) => a.location_id);
          const userConflicts = selectedLocations.filter((loc) =>
            assignedLocationIds.includes(loc.id),
          );

          if (userConflicts.length > 0) {
            conflicts.push({
              userName: user.name,
              locations: userConflicts.map((loc) => loc.name),
            });
          }
        }
      }
    } catch (error) {
      console.error("Error validating assignments:", error);
    } finally {
      setIsValidating(false);
    }

    return conflicts;
  };

  // --- CLOSE DROPDOWNS ON OUTSIDE CLICK ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target)
      ) {
        setIsUserDropdownOpen(false);
      }
      if (
        locationDropdownRef.current &&
        !locationDropdownRef.current.contains(event.target)
      ) {
        setIsLocationDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- RESET ON MODE CHANGE ---
  useEffect(() => {
    if (!assignmentMode) return;
    setSelectedUsers([]);
    setSingleUser("");
    setSelectedLocations([]);
    setUserSearchTerm("");
    setLocationSearchTerm("");
    setSelectedRoleFilter("all");
    setIsUserDropdownOpen(false);
    setIsLocationDropdownOpen(false);
  }, [assignmentMode]);

  // --- HANDLERS ---
  const handleModeToggle = () => {
    const newMode = assignmentMode === "multi" ? "single" : "multi";
    setAssignmentMode(newMode);
  };

  const handleUserSelect = (user) => {
    if (assignmentMode === "multi") {
      setSelectedUsers((prev) =>
        prev.some((u) => u.id === user.id)
          ? prev.filter((u) => u.id !== user.id)
          : [...prev, user],
      );
    } else {
      setSingleUser(user.id);
      setUserSearchTerm(user.name);
      setIsUserDropdownOpen(false);
      setSelectedLocations([]);
    }
  };

  const handleLocationSelect = (location) => {
    setSelectedLocations((prev) =>
      prev.some((loc) => loc.id === location.id)
        ? prev.filter((loc) => loc.id !== location.id)
        : [...prev, location],
    );
  };

  const handleRemoveUser = (userId) => {
    setSelectedUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  const handleRemoveLocation = (locationId) => {
    setSelectedLocations((prev) => prev.filter((loc) => loc.id !== locationId));
  };

  const handleSelectAllLocations = () => {
    const locationsToUse =
      assignmentMode === "single" ? availableLocations : allLocations;

    if (selectedLocations.length === locationsToUse.length) {
      setSelectedLocations([]);
    } else {
      setSelectedLocations(locationsToUse);
    }
  };

  const handleSelectAllUsers = () => {
    const usersToSelect = filteredUsers;

    if (selectedUsers.length === usersToSelect.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(usersToSelect);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!canAddAssignment) {
      return toast.error("You don't have permission to add assignments");
    }

    // Validation
    if (assignmentMode === "multi") {
      if (selectedUsers.length === 0 || selectedLocations.length === 0) {
        return toast.error("Please select at least one user and one location.");
      }
    } else {
      if (!singleUser || selectedLocations.length === 0) {
        return toast.error("Please select a user and at least one location.");
      }
    }

    // Check for conflicts
    const conflicts = await validateAssignments();

    if (conflicts.length > 0) {
      const errorMessages = conflicts.map((conflict) => {
        const locationList = conflict.locations.join(", ");
        return `• ${conflict.userName} is already assigned to: ${locationList}`;
      });

      toast.error(
        (t) => (
          <div className="max-w-md">
            <div className="flex items-start gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-800 mb-1">
                  Assignment Conflicts Found
                </p>
                <div className="text-sm text-red-700 space-y-1">
                  {errorMessages.map((msg, idx) => (
                    <p key={idx}>{msg}</p>
                  ))}
                </div>
              </div>
            </div>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="mt-2 w-full px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
            >
              Dismiss
            </button>
          </div>
        ),
        { duration: Infinity, style: { maxWidth: "500px" } },
      );

      return;
    }

    setIsLoading(true);

    try {
      let successCount = 0;
      let failureCount = 0;
      const errors = [];

      if (assignmentMode === "multi") {
        const promises = selectedUsers.map(async (user) => {
          try {
            const response = await AssignmentsApi.createAssignment({
              cleaner_user_id: user.id,
              location_ids: selectedLocations.map((loc) => loc.id),
              status: "assigned",
              company_id: companyId,
              role_id: user.role_id,
            });

            if (response.success) {
              successCount += response.data?.data?.created || 0;
              return { success: true, user: user.name };
            } else {
              failureCount++;
              errors.push(`${user.name}: ${response.error}`);
              return { success: false, user: user.name, error: response.error };
            }
          } catch (error) {
            failureCount++;
            errors.push(`${user.name}: ${error.message}`);
            return { success: false, user: user.name, error: error.message };
          }
        });

        await Promise.all(promises);
      } else {
        const selectedUserData = assignableUsers.find(
          (u) => u.id === singleUser,
        );
        const response = await AssignmentsApi.createAssignment({
          cleaner_user_id: singleUser,
          location_ids: selectedLocations.map((loc) => loc.id),
          status: "assigned",
          company_id: companyId,
          role_id: selectedUserData?.role_id,
        });

        if (response.success) {
          successCount = response.data?.data?.created || 0;
        } else {
          failureCount++;
          errors.push(response.error);
        }
      }

      // Show results
      if (successCount > 0 && failureCount === 0) {
        toast.success(
          `Successfully created ${successCount} assignment${
            successCount !== 1 ? "s" : ""
          }!`,
        );

        setSelectedUsers([]);
        setSingleUser("");
        setSelectedLocations([]);
        setUserSearchTerm("");
        setLocationSearchTerm("");

        setTimeout(() => {
          router.push(`/userMapping?companyId=${companyId}`);
        }, 1000);
      } else if (successCount > 0 && failureCount > 0) {
        toast(
          (t) => (
            <div className="max-w-md">
              <div className="flex items-start gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-yellow-800 mb-1">
                    Partial Success
                  </p>
                  <p className="text-sm text-yellow-700 mb-2">
                    Created {successCount} assignment
                    {successCount !== 1 ? "s" : ""}, but {failureCount} failed:
                  </p>
                  <div className="text-sm text-yellow-700 space-y-1">
                    {errors.slice(0, 3).map((error, idx) => (
                      <p key={idx}>• {error}</p>
                    ))}
                    {errors.length > 3 && (
                      <p>• ...and {errors.length - 3} more</p>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => toast.dismiss(t.id)}
                className="mt-2 w-full px-3 py-1.5 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 transition-colors"
              >
                Dismiss
              </button>
            </div>
          ),
          { duration: Infinity, style: { maxWidth: "500px" } },
        );
      } else {
        toast.error(
          (t) => (
            <div className="max-w-md">
              <div className="flex items-start gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-800 mb-1">
                    Assignment Failed
                  </p>
                  <div className="text-sm text-red-700 space-y-1">
                    {errors.slice(0, 3).map((error, idx) => (
                      <p key={idx}>• {error}</p>
                    ))}
                    {errors.length > 3 && (
                      <p>• ...and {errors.length - 3} more errors</p>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => toast.dismiss(t.id)}
                className="mt-2 w-full px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
              >
                Dismiss
              </button>
            </div>
          ),
          { duration: Infinity, style: { maxWidth: "500px" } },
        );
      }
    } catch (error) {
      console.error("Error creating assignments:", error);
      toast.error(
        (t) => (
          <div>
            <p className="font-semibold mb-1">Failed to create assignments</p>
            <p className="text-sm">{error.message}</p>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="mt-2 w-full px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
            >
              Dismiss
            </button>
          </div>
        ),
        { duration: Infinity },
      );
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = assignableUsers.filter((user) => {
    const matchesSearch = user.name
      .toLowerCase()
      .includes(userSearchTerm.toLowerCase());
    const matchesRole =
      selectedRoleFilter === "all" ||
      user.role?.name?.toLowerCase() === selectedRoleFilter.toLowerCase();
    return matchesSearch && matchesRole;
  });

  const filteredLocations = (
    assignmentMode === "single" ? availableLocations : allLocations
  ).filter((loc) =>
    loc.name.toLowerCase().includes(locationSearchTerm.toLowerCase()),
  );

  const locationsToShow =
    assignmentMode === "single" ? availableLocations : allLocations;
  const allLocationsSelected =
    selectedLocations.length === locationsToShow.length &&
    locationsToShow.length > 0;
  const allUsersSelected =
    selectedUsers.length === filteredUsers.length && filteredUsers.length > 0;

  // --- RENDER ---
  return (
    <>
      <Toaster position="top-center" />
      <div className="min-h-screen bg-white dark:bg-background w-full py-4 sm:py-6 px-4 sm:px-6 md:px-8 flex flex-col items-center relative overflow-hidden">
        {/* Background Decorative Blur */}
        <div className="absolute top-0 right-0 w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56 bg-[#CBF3F0] rounded-full blur-3xl opacity-50 -mr-12 sm:-mr-16 -mt-12 sm:-mt-16 pointer-events-none" />

        {/* Back Button */}
        <div className="absolute top-4 sm:top-6 md:top-8 left-4 sm:left-6 md:left-8 z-20">
          <button
            className="cursor-pointer p-2 hover:bg-slate-100 dark:hover:bg-slate-700 
          rounded-full text-slate-600 dark:text-slate-300 
          transition-colors"
            onClick={() => router.back()}
          >
            <ArrowLeft size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* Main Card */}
        <div className="max-w-2xl w-full bg-white dark:bg-card rounded-2xl shadow-lg shadow-slate-200/40 border border-slate-100 dark:border-border overflow-hidden relative z-10 mt-12 sm:mt-0">
          {/* Card Header */}
          <div className="bg-[#CBF3F0] dark:bg-[#2a4a4a] px-4 sm:px-6 py-3 sm:py-4 border-b border-[#CBF3F1] dark:border-border flex justify-between items-center">
            <div className="flex items-center gap-2 sm:gap-3">
              <ClipboardPlus
                size={18}
                className="text-[#FF9F1C] flex-shrink-0"
              />
              <h1 className="text-base sm:text-lg md:text-xl font-extrabold tracking-tight text-[#0f0f0f] dark:text-slate-100">
                Create Assignments
              </h1>
            </div>
            <div className="h-2 w-2 rounded-full bg-[#28C76F] animate-pulse" />
          </div>

          <form
            onSubmit={handleSubmit}
            className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8"
          >
            {/* Mode Toggle Box */}
            <div className="bg-white dark:bg-card border border-slate-50 dark:border-border rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all duration-300">
              <div className="flex items-center gap-3 sm:gap-4 flex-1">
                <div
                  className={`h-10 w-10 sm:h-11 sm:w-11 rounded-lg bg-white dark:bg-[hsl(224,48%,14%)] flex items-center justify-center shadow-sm transition-all duration-300 flex-shrink-0 ${
                    assignmentMode === "multi"
                      ? "bg-[#FDF9F2] dark:bg-[hsl(224,48%,16%)]"
                      : "bg-blue-50 dark:bg-blue-900/20"
                  }`}
                >
                  <ShieldCheck
                    className={`transition-colors duration-300 ${
                      assignmentMode === "multi"
                        ? "text-[#FF9F1C]"
                        : "text-blue-600 dark:text-blue-400"
                    }`}
                    size={20}
                  />
                </div>
                <div className="text-left">
                  <h3
                    className={`text-xs sm:text-sm font-black uppercase tracking-tight transition-colors duration-300 ${
                      assignmentMode === "multi"
                        ? "text-slate-800 dark:text-slate-100"
                        : "text-blue-700 dark:text-blue-300"
                    }`}
                  >
                    {assignmentMode === "multi"
                      ? "Multiple Mode"
                      : "Single Mode"}
                  </h3>
                  <p
                    className={`text-[10px] sm:text-xs font-bold transition-colors duration-300 ${
                      assignmentMode === "multi"
                        ? "text-slate-500 dark:text-slate-400"
                        : "text-blue-600 dark:text-blue-400"
                    }`}
                  >
                    {assignmentMode === "multi"
                      ? "Bulk mapping active"
                      : "One-to-one mapping active"}
                  </p>
                </div>
              </div>

              {/* Enhanced Toggle Switch */}
              <button
                type="button"
                onClick={handleModeToggle}
                className={`relative inline-flex h-8 w-14 sm:h-9 sm:w-16 items-center rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-95 hover:scale-105 flex-shrink-0 ${
                  assignmentMode === "multi"
                    ? "bg-[#CBF3F0] dark:bg-[hsl(var(--primary))]/30 focus:ring-[#CBF3F0] shadow-md shadow-[#CBF3F0]/20"
                    : "bg-blue-500 dark:bg-blue-600 focus:ring-blue-500 shadow-md shadow-blue-500/20"
                }`}
              >
                <span
                  className={`inline-flex items-center justify-center h-6 w-6 sm:h-7 sm:w-7 transform rounded-full bg-white dark:bg-slate-100 transition-all duration-300 ease-out shadow-lg ${
                    assignmentMode === "multi"
                      ? "translate-x-7 sm:translate-x-8"
                      : "translate-x-1"
                  }`}
                >
                  <Users
                    size={14}
                    className={`absolute transition-all duration-300 ${
                      assignmentMode === "multi"
                        ? "text-[#FF9F1C] opacity-100 scale-100 rotate-0"
                        : "opacity-0 scale-0 -rotate-90"
                    }`}
                  />
                  <User
                    size={14}
                    className={`absolute transition-all duration-300 ${
                      assignmentMode !== "multi"
                        ? "text-blue-600 dark:text-blue-400 opacity-100 scale-100 rotate-0"
                        : "opacity-0 scale-0 rotate-90"
                    }`}
                  />
                </span>
              </button>
            </div>

            {/* Filter by Role - ENHANCED WITH BETTER SHADOW AND VISIBILITY */}
            <div className="text-left space-y-3 bg-gradient-to-br from-[#FDF9F2] to-[#FFF4E6] dark:from-[hsl(224,48%,12%)] dark:to-[hsl(224,48%,14%)] p-4 sm:p-5 rounded-xl border-2 border-[#CBF3F0] dark:border-[hsl(var(--primary))]/30 shadow-md shadow-[#CBF3F0]/30 dark:shadow-[hsl(var(--primary))]/20">
              <p className="text-xs font-black text-[#FF9F1C] dark:text-[hsl(var(--primary))] uppercase tracking-widest ml-1">
                Filter by Role
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRoleFilter("all")}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all border shadow-sm ${
                    selectedRoleFilter === "all"
                      ? "bg-[#CBF3F0] dark:bg-[hsl(var(--primary))] border-[#CBF3F0] dark:border-[hsl(var(--primary))] text-[#FF9F1C] dark:text-white shadow-md shadow-[#CBF3F0]/40"
                      : "bg-white dark:bg-card border-slate-200 dark:border-border text-slate-500 dark:text-slate-400 hover:border-[#CBF3F0] dark:hover:border-[hsl(var(--primary))] hover:shadow-md"
                  }`}
                >
                  All Roles
                </button>
                {uniqueRoles.map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setSelectedRoleFilter(role)}
                    className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all border shadow-sm ${
                      selectedRoleFilter === role
                        ? "bg-[#CBF3F0] dark:bg-[hsl(var(--primary))] border-[#CBF3F0] dark:border-[hsl(var(--primary))] text-[#FF9F1C] dark:text-white shadow-md shadow-[#CBF3F0]/40"
                        : "bg-white dark:bg-card border-slate-200 dark:border-border text-slate-500 dark:text-slate-400 hover:border-[#CBF3F0] dark:hover:border-[hsl(var(--primary))] hover:shadow-md"
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            {/* Permission Warning */}
            {!canAddAssignment && (
              <div className="p-3 sm:p-4 bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-200 dark:border-orange-800 rounded-xl shadow-sm">
                <div className="flex items-start gap-2 sm:gap-3">
                  <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-orange-700 dark:text-orange-300">
                      You don't have permission to create assignments. Please
                      contact your administrator.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* User Selection */}
            <div className="text-left space-y-2" ref={userDropdownRef}>
              <label className="text-xs font-black text-[#0f0f0f] dark:text-slate-100 uppercase tracking-widest ml-1">
                {assignmentMode === "multi"
                  ? `Select Users (${selectedUsers.length} selected)`
                  : "Select User"}
              </label>
              <div className="relative">
                <div
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  className="relative cursor-pointer group"
                >
                  <input
                    type="text"
                    readOnly
                    value={
                      assignmentMode === "multi"
                        ? selectedUsers.length > 0
                          ? `${selectedUsers.length} user${
                              selectedUsers.length > 1 ? "s" : ""
                            } selected`
                          : "Click to select users..."
                        : singleUser
                          ? assignableUsers.find((u) => u.id === singleUser)
                              ?.name || "Select a user..."
                          : "Select a user..."
                    }
                    placeholder={
                      assignmentMode === "multi"
                        ? "Click to select users..."
                        : "Select a user..."
                    }
                    className="w-full px-4 sm:px-6 py-3 sm:py-3.5 text-sm sm:text-base rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-card font-medium text-[#0f0f0f] dark:text-slate-100 outline-none focus:border-[#93C5FD] dark:focus:border-[hsl(var(--primary))] focus:ring-2 focus:ring-[#93C5FD]/20 dark:focus:ring-[hsl(var(--primary))]/20 transition-all cursor-pointer"
                  />
                  <ChevronDown
                    className={`absolute right-4 sm:right-5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-hover:text-[#FF9F1C] dark:group-hover:text-[hsl(var(--primary))] transition-all duration-300 ${
                      isUserDropdownOpen ? "rotate-180" : ""
                    }`}
                    size={18}
                    strokeWidth={2.5}
                  />
                </div>

                {/* Dropdown Menu - IMPROVED HEIGHT */}
                {isUserDropdownOpen && (
                  <div
                    className="absolute z-50 w-full mt-2 bg-white dark:bg-card border border-slate-200 dark:border-border rounded-xl shadow-xl overflow-hidden flex flex-col"
                    style={{ maxHeight: "420px" }}
                  >
                    {/* Search Bar */}
                    <div className="p-3 border-b border-slate-100 dark:border-border flex-shrink-0">
                      <div className="relative">
                        <Search
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                          size={16}
                        />
                        <input
                          type="text"
                          value={userSearchTerm}
                          onChange={(e) => setUserSearchTerm(e.target.value)}
                          placeholder="Search users..."
                          className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-border bg-slate-50 dark:bg-[hsl(224,48%,12%)] text-slate-700 dark:text-slate-200 outline-none focus:border-[#93C5FD] dark:focus:border-[hsl(var(--primary))]"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>

                    {/* Select All (Multiple Mode Only) */}
                    {assignmentMode === "multi" && (
                      <div className="p-2 border-b border-slate-100 dark:border-border flex-shrink-0">
                        <label className="flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-[hsl(224,48%,14%)] rounded-lg transition-colors">
                          <input
                            type="checkbox"
                            checked={allUsersSelected}
                            onChange={handleSelectAllUsers}
                            className="w-4 h-4 text-[#FF9F1C] dark:text-[hsl(var(--primary))] border-slate-300 rounded focus:ring-[#FF9F1C]"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                            Select All ({filteredUsers.length})
                          </span>
                        </label>
                      </div>
                    )}

                    {/* Users List - IMPROVED SCROLL */}
                    <div
                      className="overflow-y-auto flex-1"
                      style={{ minHeight: "150px", maxHeight: "300px" }}
                    >
                      {filteredUsers.length === 0 ? (
                        <div className="p-4 text-center text-sm text-slate-500 dark:text-slate-400">
                          No users found
                        </div>
                      ) : (
                        filteredUsers.map((user) => {
                          const isSelected =
                            assignmentMode === "multi"
                              ? selectedUsers.some((u) => u.id === user.id)
                              : singleUser === user.id;
                          return (
                            <div
                              key={user.id}
                              onClick={() => handleUserSelect(user)}
                              className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                                isSelected
                                  ? "bg-[#FDF9F2] dark:bg-[hsl(224,48%,16%)]"
                                  : "hover:bg-slate-50 dark:hover:bg-[hsl(224,48%,14%)]"
                              }`}
                            >
                              {assignmentMode === "multi" ? (
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {}}
                                  className="w-4 h-4 text-[#FF9F1C] dark:text-[hsl(var(--primary))] border-slate-300 rounded focus:ring-[#FF9F1C]"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              ) : (
                                <div
                                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                    isSelected
                                      ? "border-[#FF9F1C] dark:border-[hsl(var(--primary))] bg-[#FF9F1C] dark:bg-[hsl(var(--primary))]"
                                      : "border-slate-300 dark:border-slate-500"
                                  }`}
                                >
                                  {isSelected && (
                                    <div className="w-2 h-2 rounded-full bg-white" />
                                  )}
                                </div>
                              )}
                              <div className="flex-1">
                                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                  {user.name}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  {user.email}
                                </p>
                              </div>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getRoleColor(
                                  user.role?.name,
                                )}`}
                              >
                                {user.role?.name || "No Role"}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* SELECTED USERS CHIPS - NEW */}
              {assignmentMode === "multi" && selectedUsers.length > 0 && (
                <div className="mt-3 p-3 bg-slate-50 dark:bg-[hsl(224,48%,12%)] rounded-lg border border-slate-200 dark:border-border max-h-32 overflow-y-auto">
                  <div className="flex flex-wrap gap-2">
                    {selectedUsers.map((user) => (
                      <div
                        key={user.id}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-card border border-[#CBF3F0] dark:border-[hsl(var(--primary))]/30 rounded-lg shadow-sm group hover:shadow-md transition-all"
                      >
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                          {user.name}
                        </span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded-full ${getRoleColor(
                            user.role?.name,
                          )}`}
                        >
                          {user.role?.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveUser(user.id)}
                          className="p-0.5 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-full transition-colors group-hover:scale-110"
                        >
                          <X className="w-3.5 h-3.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SINGLE USER CHIP - NEW */}
              {assignmentMode === "single" && singleUser && (
                <div className="mt-3 p-3 bg-slate-50 dark:bg-[hsl(224,48%,12%)] rounded-lg border border-slate-200 dark:border-border">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-card border border-blue-200 dark:border-blue-800 rounded-lg shadow-sm">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                      {assignableUsers.find((u) => u.id === singleUser)?.name}
                    </span>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded-full ${getRoleColor(
                        assignableUsers.find((u) => u.id === singleUser)?.role
                          ?.name,
                      )}`}
                    >
                      {
                        assignableUsers.find((u) => u.id === singleUser)?.role
                          ?.name
                      }
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSingleUser("");
                        setUserSearchTerm("");
                      }}
                      className="p-0.5 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-full transition-colors"
                    >
                      <X className="w-3.5 h-3.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Location Selection */}
            <div className="text-left space-y-2" ref={locationDropdownRef}>
              <label className="text-xs font-black text-[#0f0f0f] dark:text-slate-100 uppercase tracking-widest ml-1">
                {assignmentMode === "multi"
                  ? `Select Locations (${selectedLocations.length} selected)`
                  : singleUser
                    ? `Select Locations (${selectedLocations.length} selected)`
                    : "Select Locations (0 selected)"}
              </label>

              {assignmentMode === "single" && !singleUser && (
                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl">
                  <p className="text-sm font-medium text-orange-700 dark:text-orange-300">
                    Please select a user first to see available locations.
                  </p>
                </div>
              )}

              {isFetchingAssignments && (
                <div className="flex items-center gap-2 text-xs sm:text-sm text-[#FF9F1C] dark:text-[hsl(var(--primary))] mb-2">
                  <Loader className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                  <span>Loading available locations...</span>
                </div>
              )}

              <div className="relative">
                <div
                  onClick={() => {
                    if (assignmentMode === "single" && !singleUser) return;
                    setIsLocationDropdownOpen(!isLocationDropdownOpen);
                  }}
                  className={`relative cursor-pointer group ${
                    assignmentMode === "single" && !singleUser
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                >
                  <input
                    type="text"
                    readOnly
                    value={
                      selectedLocations.length > 0
                        ? `${selectedLocations.length} location${
                            selectedLocations.length > 1 ? "s" : ""
                          } selected`
                        : "Click to select locations..."
                    }
                    placeholder="Click to select locations..."
                    disabled={assignmentMode === "single" && !singleUser}
                    className="w-full px-4 sm:px-6 py-3 sm:py-3.5 text-sm sm:text-base rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-card font-medium text-[#0f0f0f] dark:text-slate-100 outline-none focus:border-[#93C5FD] dark:focus:border-[hsl(var(--primary))] focus:ring-2 focus:ring-[#93C5FD]/20 dark:focus:ring-[hsl(var(--primary))]/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <ChevronDown
                    className={`absolute right-4 sm:right-5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-hover:text-[#FF9F1C] dark:group-hover:text-[hsl(var(--primary))] transition-all duration-300 ${
                      isLocationDropdownOpen ? "rotate-180" : ""
                    }`}
                    size={18}
                    strokeWidth={2.5}
                  />
                </div>

                {/* Dropdown Menu - INCREASED HEIGHT FOR BETTER SCROLLING */}
                {isLocationDropdownOpen &&
                  (assignmentMode === "multi" || singleUser) && (
                    <div
                      className="absolute z-50 w-full mt-2 bg-white dark:bg-card border border-slate-200 dark:border-border rounded-xl shadow-xl overflow-hidden flex flex-col"
                      style={{ maxHeight: "500px" }}
                    >
                      {/* Search Bar - Reduced Padding */}
                      <div className="p-2.5 border-b border-slate-100 dark:border-border flex-shrink-0">
                        <div className="relative">
                          <Search
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                            size={16}
                          />
                          <input
                            type="text"
                            value={locationSearchTerm}
                            onChange={(e) =>
                              setLocationSearchTerm(e.target.value)
                            }
                            placeholder="Search locations..."
                            className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-border bg-slate-50 dark:bg-[hsl(224,48%,12%)] text-slate-700 dark:text-slate-200 outline-none focus:border-[#93C5FD] dark:focus:border-[hsl(var(--primary))]"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>

                      {/* Select All - Reduced Padding */}
                      {assignmentMode === "multi" && (
                        <div className="p-1.5 border-b border-slate-100 dark:border-border flex-shrink-0">
                          <label className="flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-[hsl(224,48%,14%)] rounded-lg transition-colors">
                            <input
                              type="checkbox"
                              checked={allLocationsSelected}
                              onChange={handleSelectAllLocations}
                              className="w-4 h-4 text-[#FF9F1C] dark:text-[hsl(var(--primary))] border-slate-300 rounded focus:ring-[#FF9F1C]"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                              Select All ({filteredLocations.length})
                            </span>
                          </label>
                        </div>
                      )}

                      {/* Locations List - SIGNIFICANTLY INCREASED SCROLL AREA */}
                      <div
                        className="overflow-y-auto flex-1"
                        style={{ minHeight: "250px", maxHeight: "420px" }}
                      >
                        {filteredLocations.length === 0 ? (
                          <div className="p-4 text-center text-sm text-slate-500 dark:text-slate-400">
                            {assignmentMode === "single" && singleUser
                              ? "All locations are already assigned to this user"
                              : "No locations found"}
                          </div>
                        ) : (
                          filteredLocations.map((location) => {
                            const isSelected = selectedLocations.some(
                              (loc) => loc.id === location.id,
                            );
                            return (
                              <div
                                key={location.id}
                                onClick={() => handleLocationSelect(location)}
                                className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${
                                  isSelected
                                    ? "bg-[#FDF9F2] dark:bg-[hsl(224,48%,16%)]"
                                    : "hover:bg-slate-50 dark:hover:bg-[hsl(224,48%,14%)]"
                                }`}
                              >
                                {assignmentMode === "multi" ? (
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => {}}
                                    className="w-4 h-4 text-[#FF9F1C] dark:text-[hsl(var(--primary))] border-slate-300 rounded focus:ring-[#FF9F1C] flex-shrink-0"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                ) : (
                                  <div
                                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                      isSelected
                                        ? "border-[#FF9F1C] dark:border-[hsl(var(--primary))] bg-[#FF9F1C] dark:bg-[hsl(var(--primary))]"
                                        : "border-slate-300 dark:border-slate-500"
                                    }`}
                                  >
                                    {isSelected && (
                                      <div className="w-2 h-2 rounded-full bg-white" />
                                    )}
                                  </div>
                                )}
                                <MapPin className="w-4 h-4 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                                <span className="text-sm font-medium text-slate-900 dark:text-slate-100 flex-1">
                                  {location.name}
                                </span>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
              </div>

              {/* SELECTED LOCATIONS CHIPS - NEW */}
              {selectedLocations.length > 0 && (
                <div className="mt-3 p-3 bg-slate-50 dark:bg-[hsl(224,48%,12%)] rounded-lg border border-slate-200 dark:border-border max-h-40 overflow-y-auto">
                  <div className="flex flex-wrap gap-2">
                    {selectedLocations.map((location) => (
                      <div
                        key={location.id}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-card border border-[#CBF3F0] dark:border-[hsl(var(--primary))]/30 rounded-lg shadow-sm group hover:shadow-md transition-all"
                      >
                        <MapPin className="w-3.5 h-3.5 text-[#FF9F1C] dark:text-[hsl(var(--primary))] flex-shrink-0" />
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                          {location.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveLocation(location.id)}
                          className="p-0.5 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-full transition-colors group-hover:scale-110"
                        >
                          <X className="w-3.5 h-3.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action Button */}
            <div className="pt-4 sm:pt-6 border-t border-slate-100 dark:border-border">
              <button
                type="submit"
                disabled={isLoading || isValidating || !canAddAssignment}
                className={`w-full py-3 sm:py-4 px-4 sm:px-6 text-sm sm:text-base font-bold text-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 sm:gap-3 disabled:cursor-not-allowed disabled:opacity-50 ${
                  assignmentMode === "multi"
                    ? "bg-gradient-to-r from-[#FF9F1C] to-[#FFBF69] dark:from-[hsl(var(--primary))] dark:to-[hsl(var(--primary-light))] hover:from-[#E68900] hover:to-[#FF9F1C] shadow-[#FF9F1C]/30 dark:shadow-[hsl(var(--primary))]/30"
                    : "bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 hover:from-blue-600 hover:to-blue-700 shadow-blue-500/30 dark:shadow-blue-600/30"
                }`}
              >
                {isValidating ? (
                  <>
                    <Loader className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                    <span>Validating...</span>
                  </>
                ) : isLoading ? (
                  <>
                    <Loader className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <Check size={20} strokeWidth={3} className="text-white" />
                    <span>
                      {assignmentMode === "multi"
                        ? `Create ${
                            selectedUsers.length > 0 &&
                            selectedLocations.length > 0
                              ? selectedUsers.length * selectedLocations.length
                              : 0
                          } Assignments`
                        : `Assign ${selectedLocations.length} Location${
                            selectedLocations.length !== 1 ? "s" : ""
                          }`}
                    </span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default AddAssignmentPage;
