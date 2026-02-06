/* eslint-disable react-hooks/static-components */
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";

import { useCompanyId } from "@/providers/CompanyProvider";
import { useRequirePermission } from "@/shared/hooks/useRequirePermission.js";
import { MODULES } from "@/shared/constants/permissions";

import { useCleanerReviews } from "@/features/cleaners/cleaners.queries.js";

import {
    ListChecks,
    Clock,
    CheckCircle,
    Calendar,
    MapPin,
    RotateCcw,
    Eye,
    Search,
    BarChart3,
    X,
    User,
} from "lucide-react";

/* ---------------- helpers ---------------- */

const cleanString = (str) =>
    str ? String(str).replace(/^["'\s]+|["'\s,]+$/g, "").trim() : "";

const getTimeElapsed = (startTime) => {
    const diff = Date.now() - new Date(startTime);
    const h = Math.floor(diff / 3_600_000);
    const m = Math.floor((diff % 3_600_000) / 60_000);
    return h > 0 ? `${h}h ${m}m ago` : `${m}m ago`;
};

const getCompletionTime = (start, end) => {
    const diff = new Date(end) - new Date(start);
    const h = Math.floor(diff / 3_600_000);
    const m = Math.floor((diff % 3_600_000) / 60_000);
    return h > 0 ? `Completed in ${h}h ${m}m` : `Completed in ${m}m`;
};

/* ---------------- page ---------------- */

export default function CleanerReviewPage() {
    useRequirePermission(MODULES.CLEANER_REVIEWS);

    const router = useRouter();
    const searchParams = useSearchParams();
    const { companyId } = useCompanyId();



    const [filter, setFilter] = useState(
        searchParams.get("status") || "all"
    );
    const [date, setDate] = useState(
        new Date().toISOString().split("T")[0]
    );
    const [searchQuery, setSearchQuery] = useState("");

    /* ---------------- TanStack Query ---------------- */

    const {
        data,
        isLoading,
        isError,
        error,
        refetch,
    } = useCleanerReviews(
        {
            status: filter === "all" ? null : filter,
            date: date || null,
        },
        companyId
    );

    /* ---------------- derived data ---------------- */
    console.log("companyId:", companyId);
    const reviews = (() => {
        if (!data) return [];

        let cleaned = data.map((r) => ({
            ...r,
            name: cleanString(r?.cleaner_user?.name),
            address: cleanString(r?.address),
        }));

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            cleaned = cleaned.filter(
                (r) =>
                    r?.cleaner_user?.name?.toLowerCase().includes(q) ||
                    r?.location?.name?.toLowerCase().includes(q)
            );
        }

        return cleaned;
    })();

    /* ---------------- ui helpers ---------------- */

    const handleReset = () => {
        setFilter("all");
        setDate("");
        setSearchQuery("");
        toast.success("Filters reset");
        refetch();
    };


    /* ---------------- error handling ---------------- */

    if (isError) {
        toast.error(error?.message || "Failed to load cleaner activity");
    }

    /* ---------------- render ---------------- */

    return (
        <>
            <Toaster position="top-center" />

            <div className="min-h-screen bg-background text-foreground p-6">
                <div className="max-w-7xl mx-auto space-y-6">

                    {/* ================= HEADER CARD ================= */}
                    <div className="bg-[var(--surface)] border border-border rounded-xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-md bg-muted">
                                <ListChecks className="text-primary" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold">CLEANERS ACTIVITY</h1>
                                <p className="text-xs text-muted-foreground">
                                    Monitor real-time daily cleaning tasks and progress
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-2 bg-muted p-1 rounded-lg">
                            {["all", "ongoing", "completed"].map((v) => (
                                <button
                                    key={v}
                                    onClick={() => setFilter(v)}
                                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition
                    ${filter === v
                                            ? "bg-primary text-primary-foreground"
                                            : "text-muted-foreground hover:bg-muted/70"
                                        }`}
                                >
                                    {v === "all" ? "All Tasks" : v}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ================= FILTER CARD ================= */}
                    <div className="bg-[var(--surface)] border border-border rounded-xl p-5 space-y-4">
                        <div className="flex items-center gap-2 text-sm font-semibold">
                            <Calendar className="text-primary" size={16} />
                            FILTER BY DATE
                        </div>

                        <div className="flex flex-wrap gap-4 items-center">
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="input w-48"
                            />

                            <button onClick={handleReset} className="action">
                                <RotateCcw size={14} />
                                Reset
                            </button>
                        </div>
                    </div>

                    {/* ================= MAIN GRID ================= */}
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                        {/* ===== LEFT: ACTIVITY OVERVIEW ===== */}
                        <div className="bg-[var(--surface)] border border-border rounded-xl p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="p-2 rounded-md bg-muted">
                                    <BarChart3 size={16} className="text-primary" />
                                </div>
                                <h3 className="font-semibold">Activity Overview</h3>
                            </div>

                            <div className="flex items-center gap-4 mb-5">
                                <div className="w-16 h-16 rounded-full border-4 border-muted flex items-center justify-center text-sm font-bold text-primary">
                                    75%
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Completion Rate</p>
                                    <p className="text-xs text-muted-foreground">
                                        Target: <span className="text-primary">90%</span>
                                    </p>
                                </div>
                            </div>

                            <p className="text-xs text-muted-foreground">PERFORMANCE SCORE</p>
                            <p className="font-semibold text-lg">
                                8.2 <span className="text-muted-foreground text-sm">/ 10</span>
                            </p>
                        </div>

                        {/* ===== RIGHT: CLEANER CARDS ===== */}
                        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
                            {isLoading ? (
                                <div className="col-span-full text-center text-muted-foreground">
                                    Loading cleaner activity…
                                </div>
                            ) : reviews.length ? (
                                reviews.map((r) => (
                                    <div
                                        key={r.id}
                                        className="bg-[var(--surface)] border border-border rounded-xl p-5"
                                    >
                                        {/* Header */}
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                                                    <User size={16} className="text-primary" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold">
                                                        {r.cleaner_user?.name || "Cleaner"}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        STAFF MEMBER
                                                    </p>
                                                </div>
                                            </div>

                                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-muted text-primary">
                                                {r.status.toUpperCase()}
                                            </span>
                                        </div>

                                        {/* Evidence */}
                                        <p className="text-xs text-muted-foreground mb-2">
                                            EVIDENCE LOGS ({r.before_photo?.length || 0})
                                        </p>

                                        <div className="flex items-center gap-2 mb-4">
                                            {(r.before_photo || []).slice(0, 2).map((img, i) => (
                                                <img
                                                    key={i}
                                                    src={img}
                                                    className="w-10 h-10 rounded-full object-cover border border-border"
                                                    alt=""
                                                />
                                            ))}
                                            {(r.before_photo?.length || 0) > 2 && (
                                                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                                                    +{r.before_photo.length - 2}
                                                </div>
                                            )}
                                        </div>

                                        {/* Location */}
                                        <div className="bg-muted rounded-lg p-3 mb-4">
                                            <p className="text-sm font-medium flex items-center gap-2">
                                                <MapPin size={14} />
                                                {r.location?.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Started: {new Date(r.created_at).toLocaleString()}
                                            </p>
                                            {r.status === "ongoing" && (
                                                <p className="text-xs text-primary mt-1">
                                                    <Clock size={12} className="inline mr-1" />
                                                    {getTimeElapsed(r.created_at)}
                                                </p>
                                            )}
                                        </div>

                                        <button
                                            onClick={() =>
                                                router.push(`/cleaners/${r.id}?companyId=${companyId}`)
                                            }

                                        className="w-full py-2 rounded-lg border border-border text-primary text-sm font-medium hover:bg-muted transition"
                                        >
                                        Detailed Report →
                                    </button>
                                    </div>
                        ))
                        ) : (
                        <div className="col-span-full text-center text-muted-foreground">
                            No cleaner activity found
                        </div>
                            )}
                    </div>
                </div>
            </div>
        </div >
        </>
    );
}
