/* eslint-disable react-hooks/immutability */
"use client";

import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import toast, { Toaster } from "react-hot-toast";
import {
  Plus,
  Edit,
  Trash2,
  Users,
  Search,
  Eye,
  Shield,
  UserCog,
  HardHat,
  MapPin,
  Building2,
  LayoutGrid,
  List,
} from "lucide-react";
import { UsersApi } from "@/features/users/users.api";
import { useRouter } from "next/navigation";

import { useCompanyId } from "@/providers/CompanyProvider";
import { usePermissions } from "@/shared/hooks/usePermission";
import { useRequirePermission } from "@/shared/hooks/useRequirePermission";
import { MODULES } from "@/shared/constants/permissions";

// 1. Updated Hierarchy with Color Classes
const ROLE_HIERARCHY = {
  2: {
    name: "Admin",
    level: 2,
    icon: Shield,
    color: "blue",
    // Light mode active state
    activeClass:
      "bg-gradient-to-br from-blue-500 to-blue-600 border-blue-600 text-white shadow-blue-200",
    iconColor: "text-blue-100",
  },
  3: {
    name: "Supervisor",
    level: 4,
    icon: UserCog,
    color: "teal",
    activeClass:
      "bg-gradient-to-br from-teal-500 to-teal-600 border-teal-600 text-white shadow-teal-200",
    iconColor: "text-teal-100",
  },
  5: {
    name: "Cleaner",
    level: 5,
    icon: HardHat,
    color: "orange",
    activeClass:
      "bg-gradient-to-br from-orange-500 to-orange-600 border-orange-600 text-white shadow-orange-200",
    iconColor: "text-orange-100",
  },
  6: {
    name: "Zonal Admin",
    level: 3,
    icon: MapPin,
    color: "purple",
    activeClass:
      "bg-gradient-to-br from-purple-500 to-purple-600 border-purple-600 text-white shadow-purple-200",
    iconColor: "text-purple-100",
  },
  7: {
    name: "Facility Supv",
    level: 4,
    icon: Users,
    color: "cyan", // Changed to cyan for differentiation
    activeClass:
      "bg-gradient-to-br from-cyan-500 to-cyan-600 border-cyan-600 text-white shadow-cyan-200",
    iconColor: "text-cyan-100",
  },
  8: {
    name: "Facility Admin",
    level: 3,
    icon: Building2,
    color: "indigo",
    activeClass:
      "bg-gradient-to-br from-indigo-500 to-indigo-600 border-indigo-600 text-white shadow-indigo-200",
    iconColor: "text-indigo-100",
  },
};

const TableRowSkeleton = () => (
  <tr className="animate-pulse border-b border-slate-100 dark:border-slate-800">
    {[...Array(4)].map((_, i) => (
      <td key={i} className="p-4">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full" />
      </td>
    ))}
  </tr>
);

const CardSkeleton = () => (
  <div className="animate-pulse p-4 bg-white dark:bg-slate-800 rounded-2xl shadow border border-slate-200 dark:border-slate-700">
    <div className="flex gap-4 items-center mb-4">
      <div className="h-12 w-12 bg-slate-200 dark:bg-slate-700 rounded-full" />
      <div className="flex-1">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3 mb-2" />
        <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded w-1/3" />
      </div>
    </div>
    <div className="h-8 bg-slate-100 dark:bg-slate-700 rounded w-full mt-4" />
  </div>
);

export default function UsersPage() {
  useRequirePermission(MODULES.USERS);

  const { canAdd, canUpdate, canDelete } = usePermissions();
  const canAddUser = canAdd(MODULES.USERS);
  const canEditUser = canUpdate(MODULES.USERS);
  const canDeleteUser = canDelete(MODULES.USERS);

  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState("all");
  const [viewMode, setViewMode] = useState("table");

  const currentUser = useSelector((state) => state.auth.user);
  const { companyId } = useCompanyId();
  const router = useRouter();

  const currentUserRoleId = parseInt(currentUser?.role_id || 4);

  // --- Logic Helpers ---

  const roleStats = useCallback(() => {
    const stats = {};
    Object.keys(ROLE_HIERARCHY).forEach((roleId) => {
      stats[roleId] = users.filter(
        (u) => parseInt(u.role_id || u.role?.id) === parseInt(roleId),
      ).length;
    });
    return stats;
  }, [users]);

  const filterUsersByRole = useCallback(
    (allUsers) => {
      if (!currentUser || !currentUser.role_id) return allUsers;

      return allUsers.filter((user) => {
        const userRoleId = parseInt(user.role_id || user.role?.id, 10);
        if (userRoleId === 1 || userRoleId === 4) return false;
        if (!ROLE_HIERARCHY[userRoleId]) return false;
        if (currentUserRoleId === 1) return true;
        if (currentUserRoleId === 2) return true;

        const userRoleLevel = ROLE_HIERARCHY[userRoleId]?.level || 999;
        const currentUserRoleLevel =
          ROLE_HIERARCHY[currentUserRoleId]?.level || 999;
        return userRoleLevel >= currentUserRoleLevel;
      });
    },
    [currentUser, currentUserRoleId],
  );

  const filterUsersBySearch = useCallback((allUsers, term) => {
    if (!term) return allUsers;
    return allUsers.filter(
      (user) =>
        user.name.toLowerCase().includes(term.toLowerCase()) ||
        (user.email && user.email.toLowerCase().includes(term.toLowerCase())) ||
        (user.phone && user.phone.includes(term)),
    );
  }, []);


  const fetchUsers = useCallback(async () => {
    if (!companyId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const response = await UsersApi.getAllUsers(companyId);
      if (response.success) {
        const roleFilteredUsers = filterUsersByRole(response.data);
        setUsers(roleFilteredUsers);
        applyFilters(roleFilteredUsers, searchTerm, selectedRole);
      } else {
        toast.error(response.error || "Failed to fetch users.");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to fetch users.");
    }
    setIsLoading(false);
  }, [companyId, filterUsersByRole, searchTerm, selectedRole]);


  const applyFilters = useCallback(
    (userList, search, role) => {
      let filtered = [...userList];

      if (role !== "all") {
        filtered = filtered.filter(
          (u) => parseInt(u.role_id || u.role?.id) === parseInt(role),
        );
      }

      filtered = filterUsersBySearch(filtered, search);
      setFilteredUsers(filtered);
    },
    [filterUsersBySearch],
  );
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    applyFilters(users, searchTerm, selectedRole);
  }, [searchTerm, selectedRole, users, applyFilters]);

  // --- UI Helpers ---

  const canManageUser = (targetUser) => {
    if (currentUserRoleId === 1) return true;
    const targetUserRoleId = parseInt(
      targetUser.role_id || targetUser.role?.id || 4,
    );
    const targetUserRoleLevel = ROLE_HIERARCHY[targetUserRoleId]?.level || 999;
    const currentUserRoleLevel =
      ROLE_HIERARCHY[currentUserRoleId]?.level || 999;
    return targetUserRoleLevel >= currentUserRoleLevel;
  };

  const getRoleDisplayName = (user) => {
    const roleId = parseInt(user.role_id || user.role?.id || 4);
    return ROLE_HIERARCHY[roleId]?.name || user.role?.name || "Unknown Role";
  };

  const getRoleColorClass = (user) => {
    const roleId = parseInt(user.role_id || user.role?.id || 4);
    const colorMap = {
      blue: "text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700",
      teal: "text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-900/30 border-teal-200 dark:border-teal-700",
      orange:
        "text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-700",
      purple:
        "text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-700",
      indigo:
        "text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-700",
      cyan: "text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-900/30 border-cyan-200 dark:border-cyan-700",
    };
    const color = ROLE_HIERARCHY[roleId]?.color || "gray";
    return (
      colorMap[color] ||
      "text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600"
    );
  };

  const handleDelete = (user) => {
    if (!canManageUser(user)) {
      toast.error("You don't have permission to delete this user.");
      return;
    }
    toast(
      (t) => (
        <div className="flex flex-col items-center gap-4 p-4 dark:text-slate-200">
          <p className="font-semibold text-center">
            Are you sure you want to delete {user.name}?
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => {
                toast.dismiss(t.id);
                performDelete(user.id);
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all"
            >
              Delete
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-200 dark:bg-slate-700 dark:text-slate-200 rounded-md hover:bg-slate-300 dark:hover:bg-slate-600 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      ),
      { duration: 6000, className: "dark:bg-slate-800 dark:text-white" },
    );
  };

  const performDelete = async (id) => {
    const toastId = toast.loading("Deleting user...");
    const response = await UsersApi.deleteUser(id);
    if (response.success) {
      toast.success("User deleted successfully!", { id: toastId });
      fetchUsers();
    } else {
      toast.error(response.error || "Failed to delete user.", { id: toastId });
    }
  };

  const stats = roleStats();

  // --- Render Components ---

  const UserCard = ({ user }) => (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 hover:shadow-md transition-all duration-300 group cursor-pointer relative overflow-hidden">
      {/* Top Line Hover Effect (restored) */}
      <div className="absolute top-0 left-0 w-full h-1 bg-orange-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />

      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-lg">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base leading-tight">
              {user.name}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              ID: #{user.id}
            </p>
          </div>
        </div>

        {/* Role Badge */}
        <span
          className={`inline-flex px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded border ${getRoleColorClass(user)}`}
        >
          {getRoleDisplayName(user)}
        </span>
      </div>

      <div className="space-y-2 mb-5">
        <div className="text-sm text-slate-600 dark:text-slate-300 flex items-center gap-2">
          <div className="w-8 text-xs font-semibold uppercase text-slate-400">
            Email
          </div>
          <span className="truncate">{user.email || "N/A"}</span>
        </div>
        <div className="text-sm text-slate-600 dark:text-slate-300 flex items-center gap-2">
          <div className="w-8 text-xs font-semibold uppercase text-slate-400">
            Phone
          </div>
          <span>{user.phone || "N/A"}</span>
        </div>
      </div>

      <div className="flex gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
        <button
          onClick={() =>
            router.push(`/users/view/${user.id}?companyId=${companyId}`)
          }
          className="flex-1 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium text-xs hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:text-orange-600 dark:hover:text-orange-400 transition-colors flex items-center justify-center gap-2"
        >
          <Eye size={14} /> View
        </button>

        {canManageUser(user) && (
          <div className="flex gap-2">
            {canEditUser && (
              <button
                onClick={() =>
                  router.push(`/users/${user.id}/edit?companyId=${companyId}`)
                }
                className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 transition-colors"
                title="Edit"
              >
                <Edit size={16} />
              </button>
            )}
            {canDeleteUser && (
              <button
                onClick={() => handleDelete(user)}
                className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-colors"
                title="Delete"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      <div className="min-h-screen bg-slate-50 dark:bg-[#0B0E14] transition-colors duration-300 p-4 sm:p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-orange-50 dark:bg-orange-900/20 rounded-2xl flex items-center justify-center border border-orange-100 dark:border-orange-800/50">
                  <Shield className="w-7 h-7 text-orange-600 dark:text-orange-500" />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    USER MANAGEMENT
                  </h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
                    Manage roles, permissions, and staff access
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {canAddUser && (
                  <a
                    href={`/users/add?companyId=${companyId}`}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-all duration-200 active:scale-95"
                  >
                    <Plus size={18} strokeWidth={3} />
                    ADD NEW USER
                  </a>
                )}

                <a
                  href={`/userMapping?companyId=${companyId}`}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-all duration-200 active:scale-95"
                >
                  <Plus size={18} strokeWidth={3} />
                  Assign
                </a>
              </div>

            </div>
          </div>

          {/* Stats Cards Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-8">
            {/* Total Users Card */}
            <button
              onClick={() => setSelectedRole("all")}
              className={`group relative overflow-hidden rounded-2xl p-4 transition-all duration-300 cursor-pointer text-left border ${selectedRole === "all"
                ? "bg-slate-800 dark:bg-slate-700 border-slate-700 text-white shadow-md ring-2 ring-slate-700 dark:ring-slate-600"
                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-orange-400 dark:hover:border-orange-500 hover:shadow-sm"
                }`}
            >
              <div className="flex justify-between items-start mb-2">
                <Users
                  className={`w-5 h-5 ${selectedRole === "all" ? "text-orange-400" : "text-slate-400"}`}
                />
                {selectedRole === "all" && (
                  <div className="h-2 w-2 rounded-full bg-orange-400" />
                )}
              </div>
              <p className="text-2xl font-black">{users.length}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                Total Users
              </p>
            </button>

            {/* Dynamic Role Cards */}
            {Object.entries(ROLE_HIERARCHY).map(([roleId, roleData]) => {
              if ((stats[roleId] || 0) === 0) return null;
              const Icon = roleData.icon;
              const isSelected = selectedRole === roleId;

              // Apply specific role color in Light Mode, default to dark in Dark Mode
              const activeClasses = isSelected
                ? `${roleData.activeClass} dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:from-transparent dark:to-transparent`
                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-600 hover:shadow-sm";

              return (
                <button
                  key={roleId}
                  onClick={() => setSelectedRole(isSelected ? "all" : roleId)}
                  className={`group relative overflow-hidden rounded-2xl p-4 transition-all duration-300 cursor-pointer text-left border ${activeClasses}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <Icon
                      className={`w-5 h-5 ${isSelected ? "text-white dark:text-orange-400" : "text-slate-400"}`}
                    />
                    {isSelected && (
                      <div className="h-2 w-2 rounded-full bg-white/40 dark:bg-orange-400" />
                    )}
                  </div>
                  <p className="text-2xl font-black">{stats[roleId]}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider opacity-90 truncate">
                    {roleData.name}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Filters & Controls */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, email or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              />
            </div>

            {/* View Toggle */}
            <div className="flex p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shrink-0">
              <button
                onClick={() => setViewMode("table")}
                className={`p-2.5 rounded-lg transition-all ${viewMode === "table"
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  } hidden md:block`}
                title="List View"
              >
                <List size={20} />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2.5 rounded-lg transition-all ${viewMode === "grid"
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  }`}
                title="Grid View"
              >
                <LayoutGrid size={20} />
              </button>
            </div>
          </div>

          {/* Content Area */}
          {isLoading ? (
            <div
              className={`grid gap-4 ${viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"}`}
            >
              {viewMode === "grid" ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <CardSkeleton key={i} />
                ))
              ) : (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <table className="w-full">
                    <tbody>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <TableRowSkeleton key={i} />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : filteredUsers.length > 0 ? (
            <>
              {/* Grid View (Visible on Mobile OR when toggled) */}
              <div
                className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 ${viewMode === "table" ? "hidden md:hidden" : ""}`}
              >
                {filteredUsers.map((user) => (
                  <UserCard key={user.id} user={user} />
                ))}
              </div>

              {/* Table View (Desktop Only) */}
              {viewMode === "table" && (
                <div className="hidden md:block bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-left">
                        <th className="p-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Staff Member
                        </th>
                        <th className="p-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Contact Info
                        </th>
                        <th className="p-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Permission Level
                        </th>
                        <th className="p-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredUsers.map((user) => (
                        <tr
                          key={user.id}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                        >
                          <td className="p-5">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 font-bold text-sm border border-slate-200 dark:border-slate-700">
                                {user.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 dark:text-slate-100">
                                  {user.name}
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-500">
                                  ID: #{user.id}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="p-5">
                            <div className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                              {user.email || "N/A"}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">
                              {user.phone || "N/A"}
                            </div>
                          </td>
                          <td className="p-5">
                            <span
                              className={`inline-flex px-3 py-1 text-xs font-bold uppercase tracking-wide rounded border ${getRoleColorClass(user)}`}
                            >
                              {getRoleDisplayName(user)}
                            </span>
                          </td>
                          <td className="p-5 text-right">
                            <div className="flex justify-end gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() =>
                                  router.push(
                                    `/users/view/${user.id}?companyId=${companyId}`,
                                  )
                                }
                                className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-orange-500 hover:border-orange-200 transition-all shadow-sm"
                              >
                                <Eye size={16} />
                              </button>
                              {canManageUser(user) && (
                                <>
                                  {canEditUser && (
                                    <button
                                      onClick={() =>
                                        router.push(
                                          `/users/${user.id}/edit?companyId=${companyId}`,
                                        )
                                      }
                                      className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"
                                    >
                                      <Edit size={16} />
                                    </button>
                                  )}
                                  {canDeleteUser && (
                                    <button
                                      onClick={() => handleDelete(user)}
                                      className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-red-600 hover:border-red-200 transition-all shadow-sm"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-slate-400 dark:text-slate-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                No users found
              </h3>
              <p className="text-slate-500 dark:text-slate-400">
                Try adjusting your filters or search terms.
              </p>
            </div>
          )}

          {/* Footer Count */}
          {!isLoading && filteredUsers.length > 0 && (
            <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400 font-medium">
              Showing{" "}
              <span className="text-slate-900 dark:text-white font-bold">
                {filteredUsers.length}
              </span>{" "}
              of{" "}
              <span className="text-slate-900 dark:text-white font-bold">
                {users.length}
              </span>{" "}
              staff members
            </div>
          )}
        </div>
      </div>
    </>
  );
}
