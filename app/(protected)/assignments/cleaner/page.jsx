"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Users,
  Phone,
  Calendar,
  MapPin,
  Eye,
  Trash2,
  AlertTriangle,
  ArrowLeft,
  UserCheck,
  UserPlus,
  Search,
  Grid3x3,
  List,
  Mail,
  Clock,
} from "lucide-react";
import { AssignmentsApi } from "@/features/assignments/assignments.api";
import { useCompanyId } from "@/providers/CompanyProvider";
import Loader from "@/components/ui/Loader";
import toast, { Toaster } from "react-hot-toast";
import { useSelector } from "react-redux";

export default function CleanersPage() {
  const [assignments, setAssignments] = useState([]);
  const [filteredAssignments, setFilteredAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    assignment: null,
  });
  const [deleting, setDeleting] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(null);
  const [statusModal, setStatusModal] = useState({
    open: false,
    assignment: null,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState("grid");

  const router = useRouter();
  const searchParams = useSearchParams();
  const { companyId } = useCompanyId();

  const locationId = searchParams.get("locationId");
  const locationName = searchParams.get("locationName");

  const user = useSelector((state) => state.auth.user);
  const userRoleId = user?.role_id;
  const isPermitted = userRoleId === 1 || userRoleId === 2;

  // ... all your existing useEffect and functions remain exactly the same ...

  useEffect(() => {
    if (!locationId || !companyId) {
      setLoading(false);
      return;
    }
    fetchAssignments();
  }, [locationId, companyId]);

  useEffect(() => {
    let filtered = [...assignments];
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((assignment) => {
        const cleanerName = assignment.cleaner_user?.name?.toLowerCase() || "";
        const cleanerEmail =
          assignment.cleaner_user?.email?.toLowerCase() || "";
        const cleanerPhone =
          assignment.cleaner_user?.phone?.toLowerCase() || "";

        return (
          cleanerName.includes(query) ||
          cleanerEmail.includes(query) ||
          cleanerPhone.includes(query)
        );
      });
    }
    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (assignment) =>
          assignment.status?.toLowerCase() === statusFilter.toLowerCase(),
      );
    }
    setFilteredAssignments(filtered);
  }, [searchQuery, statusFilter, assignments]);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const response = await AssignmentsApi.getAssignmentsByLocation(
        locationId,
        companyId,
      );
      if (response.success) {
        const filteredCleaners = response.data.filter(
          (item) => item.role_id === 5,
        );
        setAssignments(filteredCleaners);
        setFilteredAssignments(filteredCleaners);
      } else {
        toast.error(response.error || "Failed to fetch assignments");
      }
    } catch (error) {
      toast.error("Failed to fetch assignments");
    } finally {
      setLoading(false);
    }
  };

  const handleView = (assignmentId) => {
    router.push(
      `/assignments/cleaner/${assignmentId}?companyId=${companyId}&locationId=${locationId}`,
    );
  };

  const handleAddCleaner = () => {
    router.push(
      `/assignments/cleaner/add?companyId=${companyId}&locationId=${locationId}&locationName=${encodeURIComponent(locationName)}`,
    );
  };

  const confirmStatusToggle = async () => {
    if (!statusModal.assignment) return;
    const assignment = statusModal.assignment;
    setTogglingStatus(assignment.id);
    try {
      const currentStatus = assignment.status?.toLowerCase() || "unassigned";
      const newStatus =
        currentStatus === "assigned" ? "unassigned" : "assigned";
      const updateData = { status: newStatus };
      const response = await AssignmentsApi.updateAssignment(
        assignment.id,
        updateData,
      );
      if (response.success) {
        toast.success(`Status changed to ${newStatus}`);
        setAssignments((prevAssignments) =>
          prevAssignments.map((a) =>
            a.id === assignment.id ? { ...a, status: newStatus } : a,
          ),
        );
        setStatusModal({ open: false, assignment: null });
      } else {
        toast.error(response.error || "Failed to update status");
      }
    } catch (error) {
      toast.error("Failed to update status");
    } finally {
      setTogglingStatus(null);
    }
  };

  const handleDelete = (assignment) => {
    setDeleteModal({ open: true, assignment });
  };

  const confirmDelete = async () => {
    if (!deleteModal.assignment) return;
    const assignmentId = deleteModal.assignment.id;
    const cleanerName = deleteModal.assignment.cleaner_user?.name || "Cleaner";
    setDeleting(true);
    try {
      const response = await AssignmentsApi.deleteAssignment(assignmentId);
      if (response.success) {
        toast.success(`${cleanerName} removed successfully`);
        setAssignments((prev) => prev.filter((a) => a.id !== assignmentId));
        setDeleteModal({ open: false, assignment: null });
      } else {
        toast.error(response.error || "Failed to remove assignment");
      }
    } catch (error) {
      toast.error("Failed to remove assignment");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div
        className="flex justify-center items-center h-screen"
        style={{ background: "var(--cleaner-bg)" }}
      >
        <Loader
          size="large"
          color="var(--cleaner-input-focus)"
          message="Loading cleaners..."
        />
      </div>

    );
  }

  return (
    <>
      <Toaster position="top-right" />
      <div
        className="min-h-screen"
        style={{ background: "var(--cleaner-bg)" }}
      >

        {/* Minimal Header */}
        <div
          className="backdrop-blur-sm border-b"
          style={{
            background: "var(--cleaner-header-bg)",
            borderColor: "var(--cleaner-header-border)",
          }}
        >
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.back()}
                  className="cursor-pointer p-2 rounded-lg transition-all"
                  style={{
                    color: "var(--cleaner-subtitle)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "var(--cleaner-primary-text)";
                    e.currentTarget.style.background =
                      "var(--assignment-accent-bg)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "var(--cleaner-subtitle)";
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>

                <div>
                  <h1
                    className="text-xl font-semibold"
                    style={{ color: "var(--cleaner-title)" }}
                  >
                    Cleaners
                  </h1>

                  {locationName && (
                    <p
                      className="text-sm flex items-center gap-1"
                      style={{ color: "var(--cleaner-subtitle)" }}
                    >
                      <MapPin className="h-3 w-3" />
                      {locationName}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div
                  className="text-sm font-medium"
                  style={{ color: "var(--cleaner-subtitle)" }}
                >
                  {assignments.length} cleaners
                </div>

                {isPermitted && (
                  <button
                    onClick={handleAddCleaner}
                    className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all text-sm"
                    style={{
                      background: "var(--cleaner-primary-bg)",
                      color: "var(--cleaner-primary-text)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background =
                        "var(--cleaner-primary-hover-bg)";
                      e.currentTarget.style.transform = "scale(1.05)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background =
                        "var(--cleaner-primary-bg)";
                      e.currentTarget.style.transform = "scale(1)";
                    }}
                  >
                    <UserPlus className="h-4 w-4" />
                    Add Cleaner
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>


        {/* Rest of your content remains exactly the same */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Enhanced Controls */}
          <div
            className="rounded-xl p-4 mb-6"
            style={{
              background: "var(--cleaner-surface)",
              border: "1px solid var(--cleaner-border)",
              boxShadow: "var(--cleaner-shadow)",
            }}
          >
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5"
                  style={{ color: "var(--cleaner-input-placeholder)" }}
                />
                <input
                  type="text"
                  placeholder="Search by name, phone, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg outline-none text-sm transition-all"
                  style={{
                    background: "var(--cleaner-input-bg)",
                    border: "2px solid var(--cleaner-input-border)",
                    color: "var(--cleaner-input-text)",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor =
                      "var(--cleaner-input-focus)";
                    e.currentTarget.style.boxShadow =
                      "0 0 0 2px color-mix(in srgb, var(--cleaner-input-focus) 25%, transparent)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor =
                      "var(--cleaner-input-border)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 rounded-lg outline-none text-sm cursor-pointer transition-all"
                style={{
                  background: "var(--cleaner-input-bg)",
                  border: "2px solid var(--cleaner-input-border)",
                  color: "var(--cleaner-input-text)",
                }}
                onFocus={(e) =>
                (e.currentTarget.style.borderColor =
                  "var(--cleaner-input-focus)")
                }
                onBlur={(e) =>
                (e.currentTarget.style.borderColor =
                  "var(--cleaner-input-border)")
                }
              >
                <option value="all">All Status</option>
                <option value="assigned">Assigned</option>
                <option value="unassigned">Unassigned</option>
              </select>

              {/* Count + View Toggle */}
              <div className="flex items-center gap-3">
                <span
                  className="text-sm font-medium px-3 py-2 rounded-lg"
                  style={{
                    background: "var(--muted)",
                    color: "var(--cleaner-subtitle)",
                  }}
                >
                  {filteredAssignments.length} of {assignments.length}
                </span>

                <div
                  className="flex rounded-lg p-1"
                  style={{ background: "var(--muted)" }}
                >
                  <button
                    onClick={() => setViewMode("grid")}
                    className="cursor-pointer p-2 rounded transition-all"
                    style={
                      viewMode === "grid"
                        ? {
                          background: "var(--cleaner-primary-bg)",
                          color: "var(--cleaner-primary-text)",
                          boxShadow: "var(--assignment-primary-shadow)",
                        }
                        : {
                          color: "var(--cleaner-subtitle)",
                        }
                    }
                  >
                    <Grid3x3 className="h-5 w-5" />
                  </button>

                  <button
                    onClick={() => setViewMode("table")}
                    className="cursor-pointer p-2 rounded transition-all"
                    style={
                      viewMode === "table"
                        ? {
                          background: "var(--cleaner-primary-bg)",
                          color: "var(--cleaner-primary-text)",
                          boxShadow: "var(--assignment-primary-shadow)",
                        }
                        : {
                          color: "var(--cleaner-subtitle)",
                        }
                    }
                  >
                    <List className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>


          {/* Content - exactly the same as your original */}
          {filteredAssignments.length === 0 ? (
            <div
              className="rounded-xl p-16 text-center"
              style={{
                background: "var(--cleaner-surface)",
                border: "1px solid var(--cleaner-border)",
                boxShadow: "var(--cleaner-shadow)",
              }}
            >
              <div
                className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center"
                style={{
                  background: "var(--assignment-accent-bg)",
                }}
              >
                <UserCheck
                  className="h-12 w-12"
                  style={{ color: "var(--assignment-accent-text)" }}
                />
              </div>

              <h3
                className="text-2xl font-bold mb-2"
                style={{ color: "var(--cleaner-title)" }}
              >
                {assignments.length === 0
                  ? "No Cleaners Yet"
                  : "No Results Found"}
              </h3>

              <p
                className="mb-6"
                style={{ color: "var(--cleaner-subtitle)" }}
              >
                {assignments.length === 0
                  ? "Get started by adding your first cleaner to this location"
                  : "Try adjusting your search or filter criteria"}
              </p>

              {assignments.length === 0 && isPermitted && (
                <button
                  onClick={handleAddCleaner}
                  className="cursor-pointer inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all"
                  style={{
                    background: "var(--cleaner-primary-bg)",
                    color: "var(--cleaner-primary-text)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background =
                      "var(--cleaner-primary-hover-bg)";
                    e.currentTarget.style.transform = "scale(1.05)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background =
                      "var(--cleaner-primary-bg)";
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                >
                  <UserPlus className="h-5 w-5" />
                  Add First Cleaner
                </button>
              )}
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAssignments.map((assignment, index) => (
                <div
                  key={assignment.id}
                  className="group rounded-xl transition-all duration-300 overflow-hidden"
                  style={{
                    background: "var(--cleaner-surface)",
                    border: "1px solid var(--cleaner-border)",
                    borderTop: "4px solid var(--cleaner-input-focus)",
                    boxShadow: "var(--cleaner-shadow)",
                  }}
                >
                  {/* Header strip */}
                  <div
                    className="p-5"
                    style={{ background: "var(--assignment-accent-bg)" }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl"
                          style={{
                            background: "var(--cleaner-primary-bg)",
                            color: "var(--cleaner-primary-text)",
                            boxShadow: "var(--assignment-primary-shadow)",
                          }}
                        >
                          {assignment.cleaner_user?.name
                            ?.charAt(0)
                            .toUpperCase() || "?"}
                        </div>

                        <div>
                          <h3
                            className="font-bold text-lg"
                            style={{ color: "var(--cleaner-title)" }}
                          >
                            {assignment.cleaner_user?.name || "Unknown"}
                          </h3>
                          <p
                            className="text-xs"
                            style={{ color: "var(--cleaner-subtitle)" }}
                          >
                            ID: #{index + 1}
                          </p>
                        </div>
                      </div>

                      {/* Status pill */}
                      <button
                        onClick={() => setStatusModal({ open: true, assignment })}
                        disabled={togglingStatus === assignment.id}
                        className="cursor-pointer px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                        style={
                          assignment.status?.toLowerCase() === "assigned"
                            ? {
                              background: "var(--cleaner-status-active-bg)",
                              color: "var(--cleaner-status-active-text)",
                            }
                            : {
                              background: "var(--cleaner-status-inactive-bg)",
                              color: "var(--cleaner-status-inactive-text)",
                            }
                        }
                      >
                        {togglingStatus === assignment.id
                          ? "..."
                          : assignment.status || "N/A"}
                      </button>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-5 space-y-3">
                    {assignment.cleaner_user?.phone && (
                      <div className="flex items-center gap-3 text-sm">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ background: "var(--assignment-accent-bg)" }}
                        >
                          <Phone
                            className="h-4 w-4"
                            style={{ color: "var(--assignment-accent-text)" }}
                          />
                        </div>
                        <span
                          className="font-medium"
                          style={{ color: "var(--cleaner-title)" }}
                        >
                          {assignment.cleaner_user.phone}
                        </span>
                      </div>
                    )}

                    {assignment.cleaner_user?.email && (
                      <div className="flex items-center gap-3 text-sm">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ background: "var(--assignment-accent-bg)" }}
                        >
                          <Mail
                            className="h-4 w-4"
                            style={{ color: "var(--assignment-accent-text)" }}
                          />
                        </div>
                        <span
                          className="font-medium truncate"
                          style={{ color: "var(--cleaner-title)" }}
                        >
                          {assignment.cleaner_user.email}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-3 text-sm">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: "var(--assignment-accent-bg)" }}
                      >
                        <Calendar
                          className="h-4 w-4"
                          style={{ color: "var(--assignment-accent-text)" }}
                        />
                      </div>
                      <span style={{ color: "var(--cleaner-subtitle)" }}>
                        Assigned on{" "}
                        {new Date(assignment.assigned_on).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          }
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-5 pt-0 flex gap-2">
                    <button
                      onClick={() => handleView(assignment.id)}
                      className="cursor-pointer flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold transition-all"
                      style={{
                        background: "var(--cleaner-primary-bg)",
                        color: "var(--cleaner-primary-text)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background =
                          "var(--cleaner-primary-hover-bg)";
                        e.currentTarget.style.transform = "scale(1.05)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background =
                          "var(--cleaner-primary-bg)";
                        e.currentTarget.style.transform = "scale(1)";
                      }}
                    >
                      <Eye className="h-4 w-4" />
                      View Details
                    </button>

                    {isPermitted && (
                      <button
                        onClick={() => handleDelete(assignment)}
                        className="cursor-pointer p-2.5 rounded-lg transition-colors"
                        style={{ color: "var(--cleaner-danger-text)" }}
                        onMouseEnter={(e) =>
                        (e.currentTarget.style.background =
                          "var(--cleaner-danger-bg)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "transparent")
                        }
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

          ) : (
            <div
              className="rounded-xl overflow-hidden"
              style={{
                background: "var(--cleaner-surface)",
                border: "1px solid var(--cleaner-border)",
                boxShadow: "var(--cleaner-shadow)",
              }}
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr
                      style={{
                        background: "var(--assignment-accent-bg)",
                        borderBottom: "2px solid var(--cleaner-input-focus)",
                      }}
                    >
                      {["#", "Cleaner Name", "Contact", "Status", "Assigned Date", "Actions"].map(
                        (h) => (
                          <th
                            key={h}
                            className={`px-6 py-4 text-xs font-bold uppercase tracking-wider ${h === "Actions" ? "text-center" : "text-left"
                              }`}
                            style={{ color: "var(--cleaner-subtitle)" }}
                          >
                            {h}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>

                  <tbody>
                    {filteredAssignments.map((assignment, index) => (
                      <tr
                        key={assignment.id}
                        className="transition-colors"
                        style={{
                          borderBottom: "1px solid var(--cleaner-border)",
                        }}
                        onMouseEnter={(e) =>
                        (e.currentTarget.style.background =
                          "var(--assignment-accent-bg)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "transparent")
                        }
                      >
                        {/* Index */}
                        <td className="px-6 py-4">
                          <span
                            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                            style={{
                              background: "var(--cleaner-primary-bg)",
                              color: "var(--cleaner-primary-text)",
                            }}
                          >
                            {index + 1}
                          </span>
                        </td>

                        {/* Cleaner */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center font-bold"
                              style={{
                                background: "var(--cleaner-primary-bg)",
                                color: "var(--cleaner-primary-text)",
                              }}
                            >
                              {assignment.cleaner_user?.name
                                ?.charAt(0)
                                .toUpperCase() || "?"}
                            </div>
                            <div>
                              <div
                                className="font-semibold"
                                style={{ color: "var(--cleaner-title)" }}
                              >
                                {assignment.cleaner_user?.name || "Unknown"}
                              </div>
                              <div
                                className="text-xs"
                                style={{ color: "var(--cleaner-subtitle)" }}
                              >
                                {assignment.cleaner_user?.email || "No email"}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Contact */}
                        <td
                          className="px-6 py-4 text-sm font-medium"
                          style={{ color: "var(--cleaner-title)" }}
                        >
                          {assignment.cleaner_user?.phone || "—"}
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          <button
                            onClick={() =>
                              setStatusModal({ open: true, assignment })
                            }
                            disabled={togglingStatus === assignment.id}
                            className="cursor-pointer px-4 py-2 rounded-lg text-xs font-bold transition-all"
                            style={
                              assignment.status?.toLowerCase() === "assigned"
                                ? {
                                  background: "var(--cleaner-status-active-bg)",
                                  color: "var(--cleaner-status-active-text)",
                                }
                                : {
                                  background: "var(--cleaner-status-inactive-bg)",
                                  color: "var(--cleaner-status-inactive-text)",
                                }
                            }
                          >
                            {togglingStatus === assignment.id
                              ? "..."
                              : assignment.status || "N/A"}
                          </button>
                        </td>

                        {/* Date */}
                        <td
                          className="px-6 py-4 text-sm"
                          style={{ color: "var(--cleaner-subtitle)" }}
                        >
                          <div className="flex items-center gap-2">
                            <Clock
                              className="h-4 w-4"
                              style={{ color: "var(--assignment-accent-text)" }}
                            />
                            {new Date(assignment.assigned_on).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              }
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => handleView(assignment.id)}
                              className="cursor-pointer p-2 rounded-lg transition-all"
                              style={{
                                background: "var(--cleaner-primary-bg)",
                                color: "var(--cleaner-primary-text)",
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </button>

                            {isPermitted && (
                              <button
                                onClick={() => handleDelete(assignment)}
                                className="cursor-pointer p-2 rounded-lg transition-colors"
                                style={{ color: "var(--cleaner-danger-text)" }}
                                onMouseEnter={(e) =>
                                (e.currentTarget.style.background =
                                  "var(--cleaner-danger-bg)")
                                }
                                onMouseLeave={(e) =>
                                  (e.currentTarget.style.background = "transparent")
                                }
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          )}
        </div>
      </div>

      {/* Modals remain exactly the same */}
      {statusModal.open && (
        <div
          className="fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0, 0, 0, 0.5)" }}
        >
          <div
            className="rounded-2xl max-w-md w-full overflow-hidden"
            style={{
              background: "var(--cleaner-surface)",
              border: "1px solid var(--cleaner-border)",
              boxShadow: "var(--cleaner-shadow)",
            }}
          >
            {/* Header */}
            <div
              className="p-6"
              style={{ background: "var(--cleaner-primary-bg)" }}
            >
              <h3
                className="text-2xl font-bold"
                style={{ color: "var(--cleaner-primary-text)" }}
              >
                Change Status
              </h3>
            </div>

            {/* Body */}
            <div className="p-6">
              <p
                className="text-base mb-6"
                style={{ color: "var(--cleaner-subtitle)" }}
              >
                Are you sure you want to change{" "}
                <strong style={{ color: "var(--cleaner-title)" }}>
                  {statusModal.assignment?.cleaner_user?.name}
                </strong>{" "}
                status to{" "}
                <strong style={{ color: "var(--assignment-accent-text)" }}>
                  {statusModal.assignment?.status?.toLowerCase() === "assigned"
                    ? "Unassigned"
                    : "Assigned"}
                </strong>
                ?
              </p>

              <div className="flex gap-3">
                {/* Cancel */}
                <button
                  onClick={() =>
                    setStatusModal({ open: false, assignment: null })
                  }
                  className="cursor-pointer flex-1 px-5 py-3 rounded-lg text-sm font-semibold transition-colors"
                  style={{
                    background: "transparent",
                    border: "1px solid var(--cleaner-border)",
                    color: "var(--cleaner-title)",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "var(--muted)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  Cancel
                </button>

                {/* Confirm */}
                <button
                  onClick={confirmStatusToggle}
                  disabled={togglingStatus === statusModal.assignment?.id}
                  className="cursor-pointer flex-1 px-5 py-3 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
                  style={{
                    background: "var(--cleaner-primary-bg)",
                    color: "var(--cleaner-primary-text)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background =
                      "var(--cleaner-primary-hover-bg)";
                    e.currentTarget.style.boxShadow =
                      "var(--assignment-primary-shadow)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background =
                      "var(--cleaner-primary-bg)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  {togglingStatus === statusModal.assignment?.id
                    ? "Processing..."
                    : "Confirm"}
                </button>
              </div>
            </div>
          </div>
        </div>

      )}

      {deleteModal.open && (
        <div
          className="fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0, 0, 0, 0.5)" }}
        >
          <div
            className="rounded-2xl max-w-md w-full overflow-hidden"
            style={{
              background: "var(--cleaner-surface)",
              border: "1px solid var(--cleaner-border)",
              boxShadow: "var(--cleaner-shadow)",
            }}
          >
            {/* Header */}
            <div
              className="p-6"
              style={{
                background: "var(--assignment-toast-error-bg)",
                borderBottom: "1px solid var(--assignment-toast-error-border)",
              }}
            >
              <div
                className="flex items-center gap-3"
                style={{ color: "var(--assignment-toast-error-text)" }}
              >
                <AlertTriangle className="h-8 w-8" />
                <h3 className="text-2xl font-bold">Remove Cleaner</h3>
              </div>
            </div>

            {/* Body */}
            <div className="p-6">
              <p
                className="text-base mb-2"
                style={{ color: "var(--cleaner-subtitle)" }}
              >
                Are you sure you want to remove{" "}
                <strong style={{ color: "var(--cleaner-title)" }}>
                  {deleteModal.assignment?.cleaner_user?.name}
                </strong>
                ?
              </p>

              <p
                className="text-sm font-medium mb-6"
                style={{ color: "var(--assignment-toast-error-text)" }}
              >
                This action cannot be undone.
              </p>

              <div className="flex gap-3">
                {/* Cancel */}
                <button
                  onClick={() =>
                    setDeleteModal({ open: false, assignment: null })
                  }
                  disabled={deleting}
                  className="cursor-pointer flex-1 px-5 py-3 rounded-lg text-sm font-semibold transition-colors"
                  style={{
                    background: "transparent",
                    border: "1px solid var(--cleaner-border)",
                    color: "var(--cleaner-title)",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "var(--muted)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  Cancel
                </button>

                {/* Confirm delete */}
                <button
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="cursor-pointer flex-1 px-5 py-3 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
                  style={{
                    background: "var(--assignment-toast-error-border)",
                    color: "var(--assignment-toast-error-text)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background =
                      "var(--assignment-toast-error-text)";
                    e.currentTarget.style.color = "var(--cleaner-surface)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background =
                      "var(--assignment-toast-error-border)";
                    e.currentTarget.style.color =
                      "var(--assignment-toast-error-text)";
                  }}
                >
                  {deleting ? "Removing..." : "Remove"}
                </button>
              </div>
            </div>
          </div>
        </div>

      )}
    </>
  );
}