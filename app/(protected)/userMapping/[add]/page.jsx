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
          `Successfully created ${successCount} assignment${successCount !== 1 ? "s" : ""
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
      <div
        className="min-h-screen w-full py-4 sm:py-6 px-4 sm:px-6 md:px-8 flex flex-col items-center relative "
        style={{
          background: "var(--assignment-bg)",
        }}
      >

        {/* Background Decorative Blur */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute top-0 right-0 w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56 
               rounded-full blur-3xl opacity-50 
               translate-x-1/2 -translate-y-1/2"
            style={{ background: "var(--assignment-accent-bg)" }}
          />
        </div>



        {/* Back Button */}
        <div className="absolute top-4 sm:top-6 md:top-8 left-4 sm:left-6 md:left-8 z-20">
          <button
            onClick={() => router.back()}
            className="cursor-pointer p-2 rounded-full transition-colors"
            style={{
              color: "var(--assignment-title)",
              background: "transparent",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--assignment-accent-bg)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            <ArrowLeft size={20} strokeWidth={2.5} />
          </button>
        </div>


        {/* Main Card */}
        <div className="max-w-2xl w-full relative z-10">
          {/* visual card */}
          <div
            className="rounded-2xl"
            style={{
              background: "var(--assignment-surface)",
              border: "1px solid var(--assignment-border)",
              boxShadow: "var(--assignment-shadow)",
            }}
          >

            {/* Card Header */}
            <div
              className="px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center"
              style={{
                background: "var(--assignment-header-bg)",
                borderBottom: "1px solid var(--assignment-header-border)",
              }}
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <ClipboardPlus
                  size={18}
                  className="flex-shrink-0"
                  style={{ color: "var(--assignment-accent-text)" }}
                />
                <h1
                  className="text-base sm:text-lg md:text-xl font-extrabold tracking-tight"
                  style={{ color: "var(--assignment-title)" }}
                >
                  Create Assignments
                </h1>
              </div>

              <div
                className="h-2 w-2 rounded-full animate-pulse"
                style={{ background: "var(--assignment-success-dot)" }}
              />
            </div>


            <form
              onSubmit={handleSubmit}
              className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8"
            >
              {/* Mode Toggle Box */}
              <div
                className="rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all duration-300"
                style={{
                  background: "var(--assignment-surface)",
                  border: "1px solid var(--assignment-border)",
                }}
              >
                <div className="flex items-center gap-3 sm:gap-4 flex-1">
                  <div
                    className="h-10 w-10 sm:h-11 sm:w-11 rounded-lg flex items-center justify-center shadow-sm transition-all duration-300 flex-shrink-0"
                    style={{
                      background:
                        assignmentMode === "multi"
                          ? "var(--assignment-accent-bg)"
                          : "var(--assignment-input-bg)",
                    }}
                  >
                    <ShieldCheck
                      size={20}
                      style={{
                        color:
                          assignmentMode === "multi"
                            ? "var(--assignment-accent-text)"
                            : "var(--assignment-subtitle)",
                      }}
                    />
                  </div>

                  <div className="text-left">
                    <h3
                      className="text-xs sm:text-sm font-black uppercase tracking-tight transition-colors duration-300"
                      style={{ color: "var(--assignment-title)" }}
                    >
                      {assignmentMode === "multi" ? "Multiple Mode" : "Single Mode"}
                    </h3>

                    <p
                      className="text-[10px] sm:text-xs font-bold transition-colors duration-300"
                      style={{ color: "var(--assignment-subtitle)" }}
                    >
                      {assignmentMode === "multi"
                        ? "Bulk mapping active"
                        : "One-to-one mapping active"}
                    </p>
                  </div>
                </div>

                {/* Toggle Switch */}
                <button
                  type="button"
                  onClick={handleModeToggle}
                  className="relative inline-flex h-8 w-14 sm:h-9 sm:w-16 items-center rounded-full transition-all duration-300 ease-in-out active:scale-95 hover:scale-105 flex-shrink-0"
                  style={{
                    background:
                      assignmentMode === "multi"
                        ? "var(--assignment-toggle-active-bg)"
                        : "var(--assignment-toggle-bg)",
                    boxShadow: "var(--assignment-toggle-shadow)",
                  }}
                >
                  <span
                    className="inline-flex items-center justify-center h-6 w-6 sm:h-7 sm:w-7 rounded-full transition-all duration-300 ease-out"
                    style={{
                      background: "var(--assignment-toggle-knob)",
                      transform:
                        assignmentMode === "multi"
                          ? "translateX(1.75rem)"
                          : "translateX(0.25rem)",
                    }}
                  >
                    <Users
                      size={14}
                      style={{
                        opacity: assignmentMode === "multi" ? 1 : 0,
                        transform:
                          assignmentMode === "multi" ? "scale(1)" : "scale(0)",
                        color: "var(--assignment-accent-text)",
                      }}
                    />
                    <User
                      size={14}
                      style={{
                        opacity: assignmentMode !== "multi" ? 1 : 0,
                        transform:
                          assignmentMode !== "multi" ? "scale(1)" : "scale(0)",
                        color: "var(--assignment-subtitle)",
                        position: "absolute",
                      }}
                    />
                  </span>
                </button>
              </div>


              {/* Filter by Role - ENHANCED WITH BETTER SHADOW AND VISIBILITY */}
              <div
                className="text-left space-y-3 p-4 sm:p-5 rounded-xl shadow-md"
                style={{
                  background: "var(--assignment-accent-bg)",
                  border: "2px solid var(--assignment-accent-border)",
                  boxShadow: "var(--assignment-shadow)",
                }}
              >
                <p
                  className="text-xs font-black uppercase tracking-widest ml-1"
                  style={{ color: "var(--assignment-accent-text)" }}
                >
                  Filter by Role
                </p>

                <div className="flex flex-wrap gap-2">
                  {/* ALL ROLES */}
                  <button
                    type="button"
                    onClick={() => setSelectedRoleFilter("all")}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all border"
                    style={{
                      background:
                        selectedRoleFilter === "all"
                          ? "var(--assignment-accent-bg)"
                          : "var(--assignment-surface)",
                      borderColor:
                        selectedRoleFilter === "all"
                          ? "var(--assignment-accent-border)"
                          : "var(--assignment-border)",
                      color:
                        selectedRoleFilter === "all"
                          ? "var(--assignment-accent-text)"
                          : "var(--assignment-subtitle)",
                      boxShadow:
                        selectedRoleFilter === "all"
                          ? "var(--assignment-shadow)"
                          : "none",
                    }}
                  >
                    All Roles
                  </button>

                  {/* ROLE BUTTONS */}
                  {uniqueRoles.map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setSelectedRoleFilter(role)}
                      className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all border"
                      style={{
                        background:
                          selectedRoleFilter === role
                            ? "var(--assignment-accent-bg)"
                            : "var(--assignment-surface)",
                        borderColor:
                          selectedRoleFilter === role
                            ? "var(--assignment-accent-border)"
                            : "var(--assignment-border)",
                        color:
                          selectedRoleFilter === role
                            ? "var(--assignment-accent-text)"
                            : "var(--assignment-subtitle)",
                        boxShadow:
                          selectedRoleFilter === role
                            ? "var(--assignment-shadow)"
                            : "none",
                      }}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>


              {/* Permission Warning */}
              {!canAddAssignment && (
                <div
                  className="p-3 sm:p-4 rounded-xl shadow-sm"
                  style={{
                    background: "var(--assignment-warning-bg)",
                    border: "2px solid var(--assignment-warning-border)",
                    color: "var(--assignment-warning-text)",
                  }}
                >
                  <div className="flex items-start gap-2 sm:gap-3">
                    <AlertCircle
                      className="w-5 h-5 flex-shrink-0 mt-0.5"
                      style={{ color: "var(--assignment-warning-text)" }}
                    />
                    <div>
                      <p className="text-sm font-semibold">
                        You don&apos;t have permission to create assignments. Please contact your
                        administrator.
                      </p>
                    </div>
                  </div>
                </div>
              )}


              {/* User Selection */}
              <div className="text-left space-y-2" ref={userDropdownRef}>
                <label
                  className="text-xs font-black uppercase tracking-widest ml-1"
                  style={{ color: "var(--assignment-title)" }}
                >
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
                            ? `${selectedUsers.length} user${selectedUsers.length > 1 ? "s" : ""
                            } selected`
                            : "Click to select users..."
                          : singleUser
                            ? assignableUsers.find((u) => u.id === singleUser)?.name ||
                            "Select a user..."
                            : "Select a user..."
                      }
                      placeholder={
                        assignmentMode === "multi"
                          ? "Click to select users..."
                          : "Select a user..."
                      }
                      className="w-full px-4 sm:px-6 py-3 sm:py-3.5 text-sm sm:text-base rounded-xl outline-none cursor-pointer transition-all"
                      style={{
                        background: "var(--assignment-input-bg)",
                        border: "1px solid var(--assignment-input-border)",
                        color: "var(--assignment-input-text)",
                      }}
                    />

                    <ChevronDown
                      size={18}
                      strokeWidth={2.5}
                      className={`absolute right-4 sm:right-5 top-1/2 -translate-y-1/2 transition-transform duration-300 ${isUserDropdownOpen ? "rotate-180" : ""
                        }`}
                      style={{ color: "var(--assignment-subtitle)" }}
                    />
                  </div>

                  {/* DROPDOWN */}
                  {isUserDropdownOpen && (
                    <div
                      className="absolute left-0 right-0 top-full mt-3 z-50 rounded-xl overflow-hidden flex flex-col"
                      style={{
                        background: "var(--assignment-dropdown-bg)",
                        border: "1px solid var(--assignment-dropdown-border)",
                        boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
                      }}
                    >

                      {/* SEARCH */}
                      <div
                        className="p-3 flex-shrink-0"
                        style={{ borderBottom: "1px solid var(--assignment-divider)" }}
                      >
                        <div className="relative">
                          <Search
                            size={16}
                            className="absolute left-3 top-1/2 -translate-y-1/2"
                            style={{ color: "var(--assignment-subtitle)" }}
                          />
                          <input
                            type="text"
                            value={userSearchTerm}
                            onChange={(e) => setUserSearchTerm(e.target.value)}
                            placeholder="Search users..."
                            className="w-full pl-10 pr-4 py-2 text-sm rounded-lg outline-none"
                            style={{
                              background: "var(--assignment-input-bg)",
                              border: "1px solid var(--assignment-input-border)",
                              color: "var(--assignment-input-text)",
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>

                      {/* SELECT ALL */}
                      {assignmentMode === "multi" && (
                        <div
                          className="p-2 flex-shrink-0"
                          style={{ borderBottom: "1px solid var(--assignment-divider)" }}
                        >
                          <label className="flex items-center gap-2 px-2 py-1.5 cursor-pointer rounded-lg transition-colors">
                            <input
                              type="checkbox"
                              checked={allUsersSelected}
                              onChange={handleSelectAllUsers}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <span
                              className="text-sm font-medium"
                              style={{ color: "var(--assignment-input-text)" }}
                            >
                              Select All ({filteredUsers.length})
                            </span>
                          </label>
                        </div>
                      )}

                      {/* USERS LIST */}
                      <div
                        className="overflow-y-auto "
                        style={{ minHeight: "150px", maxHeight: "320px" }}
                      >
                        {filteredUsers.length === 0 ? (
                          <div
                            className="p-4 text-center text-sm"
                            style={{ color: "var(--assignment-subtitle)" }}
                          >
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
                                className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors"
                                style={{
                                  background: isSelected
                                    ? "var(--assignment-dropdown-selected)"
                                    : "transparent",
                                }}
                              >
                                {assignmentMode === "multi" ? (
                                  <input type="checkbox" checked={isSelected} readOnly />
                                ) : (
                                  <div
                                    className="w-4 h-4 rounded-full border-2 flex items-center justify-center"
                                    style={{
                                      borderColor: isSelected
                                        ? "var(--assignment-accent-border)"
                                        : "var(--assignment-border)",
                                      background: isSelected
                                        ? "var(--assignment-accent-bg)"
                                        : "transparent",
                                    }}
                                  >
                                    {isSelected && (
                                      <div
                                        className="w-2 h-2 rounded-full"
                                        style={{ background: "var(--assignment-accent-text)" }}
                                      />
                                    )}
                                  </div>
                                )}

                                <div className="flex-1">
                                  <p
                                    className="text-sm font-medium"
                                    style={{ color: "var(--assignment-input-text)" }}
                                  >
                                    {user.name}
                                  </p>
                                  <p
                                    className="text-xs"
                                    style={{ color: "var(--assignment-subtitle)" }}
                                  >
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

                {/* MULTI USER CHIPS */}
                {assignmentMode === "multi" && selectedUsers.length > 0 && (
                  <div
                    className="mt-3 p-3 rounded-lg max-h-32 overflow-y-auto"
                    style={{
                      background: "var(--assignment-chip-bg)",
                      border: "1px solid var(--assignment-chip-border)",
                    }}
                  >
                    <div className="flex flex-wrap gap-2">
                      {selectedUsers.map((user) => (
                        <div
                          key={user.id}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg shadow-sm transition-all"
                          style={{
                            background: "var(--assignment-surface)",
                            border: "1px solid var(--assignment-chip-border)",
                          }}
                        >
                          <span
                            className="text-xs font-semibold"
                            style={{ color: "var(--assignment-chip-text)" }}
                          >
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
                            className="p-0.5 rounded-full transition-colors"
                            style={{ color: "var(--assignment-chip-remove-hover)" }}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* SINGLE USER CHIP */}
                {assignmentMode === "single" && singleUser && (
                  <div
                    className="mt-3 p-3 rounded-lg"
                    style={{
                      background: "var(--assignment-chip-bg)",
                      border: "1px solid var(--assignment-chip-border)",
                    }}
                  >
                    <div
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg shadow-sm"
                      style={{
                        background: "var(--assignment-surface)",
                        border: "1px solid var(--assignment-chip-border)",
                      }}
                    >
                      <span
                        className="text-xs font-semibold"
                        style={{ color: "var(--assignment-chip-text)" }}
                      >
                        {assignableUsers.find((u) => u.id === singleUser)?.name}
                      </span>

                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded-full ${getRoleColor(
                          assignableUsers.find((u) => u.id === singleUser)?.role?.name,
                        )}`}
                      >
                        {
                          assignableUsers.find((u) => u.id === singleUser)?.role?.name
                        }
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          setSingleUser("");
                          setUserSearchTerm("");
                        }}
                        className="p-0.5 rounded-full transition-colors"
                        style={{ color: "var(--assignment-chip-remove-hover)" }}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>


              {/* Location Selection */}
              <div className="text-left space-y-2" ref={locationDropdownRef}>
                <label
                  className="text-xs font-black uppercase tracking-widest ml-1"
                  style={{ color: "var(--assignment-title)" }}
                >
                  {assignmentMode === "multi"
                    ? `Select Locations (${selectedLocations.length} selected)`
                    : singleUser
                      ? `Select Locations (${selectedLocations.length} selected)`
                      : "Select Locations (0 selected)"}
                </label>

                {/* SINGLE MODE WARNING */}
                {assignmentMode === "single" && !singleUser && (
                  <div
                    className="p-3 rounded-xl"
                    style={{
                      background: "var(--assignment-warning-bg)",
                      border: "1px solid var(--assignment-warning-border)",
                      color: "var(--assignment-warning-text)",
                    }}
                  >
                    <p className="text-sm font-medium">
                      Please select a user first to see available locations.
                    </p>
                  </div>
                )}

                {/* LOADING */}
                {isFetchingAssignments && (
                  <div
                    className="flex items-center gap-2 text-xs sm:text-sm mb-2"
                    style={{ color: "var(--assignment-loading-text)" }}
                  >
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
                    className={`relative cursor-pointer group ${assignmentMode === "single" && !singleUser
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                      }`}
                  >
                    <input
                      type="text"
                      readOnly
                      disabled={assignmentMode === "single" && !singleUser}
                      value={
                        selectedLocations.length > 0
                          ? `${selectedLocations.length} location${selectedLocations.length > 1 ? "s" : ""
                          } selected`
                          : "Click to select locations..."
                      }
                      placeholder="Click to select locations..."
                      className="w-full px-4 sm:px-6 py-3 sm:py-3.5 text-sm sm:text-base rounded-xl outline-none cursor-pointer transition-all disabled:cursor-not-allowed"
                      style={{
                        background: "var(--assignment-input-bg)",
                        border: "1px solid var(--assignment-input-border)",
                        color: "var(--assignment-input-text)",
                      }}
                    />

                    <ChevronDown
                      size={18}
                      strokeWidth={2.5}
                      className={`absolute right-4 sm:right-5 top-1/2 -translate-y-1/2 transition-transform duration-300 ${isLocationDropdownOpen ? "rotate-180" : ""
                        }`}
                      style={{ color: "var(--assignment-subtitle)" }}
                    />
                  </div>

                  {/* DROPDOWN */}
                  {isLocationDropdownOpen &&
                    (assignmentMode === "multi" || singleUser) && (
                      <div
                        className="absolute z-50 w-full mt-2 rounded-xl overflow-hidden flex flex-col"
                        style={{
                          background: "var(--assignment-dropdown-bg)",
                          border: "1px solid var(--assignment-dropdown-border)",
                          boxShadow: "var(--assignment-shadow)",
                          maxHeight: "500px",
                        }}
                      >
                        {/* SEARCH */}
                        <div
                          className="p-2.5 flex-shrink-0"
                          style={{ borderBottom: "1px solid var(--assignment-divider)" }}
                        >
                          <div className="relative">
                            <Search
                              size={16}
                              className="absolute left-3 top-1/2 -translate-y-1/2"
                              style={{ color: "var(--assignment-subtitle)" }}
                            />
                            <input
                              type="text"
                              value={locationSearchTerm}
                              onChange={(e) => setLocationSearchTerm(e.target.value)}
                              placeholder="Search locations..."
                              className="w-full pl-10 pr-4 py-2 text-sm rounded-lg outline-none"
                              style={{
                                background: "var(--assignment-input-bg)",
                                border: "1px solid var(--assignment-input-border)",
                                color: "var(--assignment-input-text)",
                              }}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>

                        {/* SELECT ALL */}
                        {assignmentMode === "multi" && (
                          <div
                            className="p-1.5 flex-shrink-0"
                            style={{ borderBottom: "1px solid var(--assignment-divider)" }}
                          >
                            <label className="flex items-center gap-2 px-2 py-1.5 cursor-pointer rounded-lg">
                              <input
                                type="checkbox"
                                checked={allLocationsSelected}
                                onChange={handleSelectAllLocations}
                                onClick={(e) => e.stopPropagation()}
                              />
                              <span
                                className="text-sm font-medium"
                                style={{ color: "var(--assignment-input-text)" }}
                              >
                                Select All ({filteredLocations.length})
                              </span>
                            </label>
                          </div>
                        )}

                        {/* LOCATIONS LIST */}
                        <div
                          className="overflow-y-auto flex-1"
                          style={{ minHeight: "250px", maxHeight: "420px" }}
                        >
                          {filteredLocations.length === 0 ? (
                            <div
                              className="p-4 text-center text-sm"
                              style={{ color: "var(--assignment-subtitle)" }}
                            >
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
                                  className="flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors"
                                  style={{
                                    background: isSelected
                                      ? "var(--assignment-dropdown-selected)"
                                      : "transparent",
                                  }}
                                >
                                  {assignmentMode === "multi" ? (
                                    <input type="checkbox" checked={isSelected} readOnly />
                                  ) : (
                                    <div
                                      className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                                      style={{
                                        borderColor: isSelected
                                          ? "var(--assignment-accent-border)"
                                          : "var(--assignment-border)",
                                        background: isSelected
                                          ? "var(--assignment-accent-bg)"
                                          : "transparent",
                                      }}
                                    >
                                      {isSelected && (
                                        <div
                                          className="w-2 h-2 rounded-full"
                                          style={{
                                            background:
                                              "var(--assignment-accent-text)",
                                          }}
                                        />
                                      )}
                                    </div>
                                  )}

                                  <MapPin
                                    className="w-4 h-4 flex-shrink-0"
                                    style={{ color: "var(--assignment-subtitle)" }}
                                  />

                                  <span
                                    className="text-sm font-medium flex-1"
                                    style={{ color: "var(--assignment-input-text)" }}
                                  >
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

                {/* SELECTED LOCATIONS CHIPS */}
                {selectedLocations.length > 0 && (
                  <div
                    className="mt-3 p-3 rounded-lg max-h-40 overflow-y-auto"
                    style={{
                      background: "var(--assignment-chip-bg)",
                      border: "1px solid var(--assignment-chip-border)",
                    }}
                  >
                    <div className="flex flex-wrap gap-2">
                      {selectedLocations.map((location) => (
                        <div
                          key={location.id}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg shadow-sm transition-all"
                          style={{
                            background: "var(--assignment-surface)",
                            border: "1px solid var(--assignment-chip-border)",
                          }}
                        >
                          <MapPin
                            className="w-3.5 h-3.5 flex-shrink-0"
                            style={{ color: "var(--assignment-accent-text)" }}
                          />

                          <span
                            className="text-xs font-semibold"
                            style={{ color: "var(--assignment-chip-text)" }}
                          >
                            {location.name}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleRemoveLocation(location.id)}
                            className="p-0.5 rounded-full transition-colors"
                            style={{ color: "var(--assignment-chip-remove-hover)" }}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>


              {/* Action Button */}
              <div
                className="pt-4 sm:pt-6"
                style={{ borderTop: "1px solid var(--assignment-divider)" }}
              >
                <button
                  type="submit"
                  disabled={isLoading || isValidating || !canAddAssignment}
                  className="w-full py-3 sm:py-4 px-4 sm:px-6 text-sm sm:text-base font-bold rounded-2xl transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 sm:gap-3 disabled:cursor-not-allowed disabled:opacity-50"
                  style={{
                    background:
                      assignmentMode === "multi"
                        ? "var(--assignment-primary-bg)"
                        : "var(--assignment-primary-bg)",
                    color: "var(--assignment-primary-text)",
                    boxShadow: "var(--assignment-primary-shadow)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background =
                      "var(--assignment-primary-hover-bg)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background =
                      "var(--assignment-primary-bg)";
                  }}
                >
                  {isValidating ? (
                    <>
                      <Loader className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                      <span style={{ color: "var(--assignment-primary-text)" }}>
                        Validating...
                      </span>
                    </>
                  ) : isLoading ? (
                    <>
                      <Loader className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                      <span style={{ color: "var(--assignment-primary-text)" }}>
                        Creating...
                      </span>
                    </>
                  ) : (
                    <>
                      <Check size={20} strokeWidth={3} />
                      <span>
                        {assignmentMode === "multi"
                          ? `Create ${selectedUsers.length > 0 && selectedLocations.length > 0
                            ? selectedUsers.length * selectedLocations.length
                            : 0
                          } Assignments`
                          : `Assign ${selectedLocations.length} Location${selectedLocations.length !== 1 ? "s" : ""
                          }`}
                      </span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default AddAssignmentPage;
