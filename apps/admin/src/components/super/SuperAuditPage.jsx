"use client";

import { useEffect, useState } from "react";
import { useSuperAdmin } from "./SuperAdminShell";
import AdminLoadingState from "../AdminLoadingState";
import { useLanguage } from "../../lib/i18n";

function toDateInput(date) {
  return date.toISOString().slice(0, 10);
}

function defaultRange() {
  const now = new Date();
  const from = new Date(now);
  from.setDate(now.getDate() - 29);
  return {
    from: toDateInput(from),
    to: toDateInput(now),
  };
}

function toTitleCase(value) {
  return String(value ?? "")
    .replace(/_/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function buildAuditSummary(row) {
  const summary = String(row?.metadata?.summary ?? "").trim();
  if (summary) return summary;

  const actionLabel = toTitleCase(row?.action_type || "updated");
  const entityLabel = toTitleCase(row?.entity_type || "record");
  const targetLabel = String(
    row?.metadata?.title
    ?? row?.metadata?.name
    ?? row?.metadata?.email
    ?? row?.entity_id
    ?? ""
  ).trim();
  return `${actionLabel} ${entityLabel}${targetLabel ? `: ${targetLabel}` : ""}`;
}

function formatAuditDateTime(value) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleString("en-GB", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export default function SuperAuditPage() {
  const { supabase } = useSuperAdmin();
  const { t } = useLanguage();
  const [filters, setFilters] = useState({
    entityType: "all",
    schoolId: "all",
    ...defaultRange(),
  });
  const [logs, setLogs] = useState([]);
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadSchools() {
      const { data } = await supabase.from("schools").select("id, name").order("name", { ascending: true });
      if (cancelled) return;
      setSchools(data ?? []);
    }

    loadSchools();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  useEffect(() => {
    let cancelled = false;

    async function loadLogs() {
      setLoading(true);
      setMsg("");
      let query = supabase
        .from("audit_logs")
        .select("id, actor_user_id, actor_role, actor_email, action_type, entity_type, entity_id, school_id, metadata, created_at")
        .order("created_at", { ascending: false })
        .limit(200);

      if (filters.from) query = query.gte("created_at", `${filters.from}T00:00:00`);
      if (filters.to) query = query.lte("created_at", `${filters.to}T23:59:59`);
      if (filters.entityType !== "all") query = query.eq("entity_type", filters.entityType);
      if (filters.schoolId !== "all") query = query.eq("school_id", filters.schoolId);

      const { data, error } = await query;

      if (cancelled) return;

      if (error) {
        setLogs([]);
        setMsg(error.message || t("Failed to load audit logs."));
        setLoading(false);
        return;
      }

      setLogs(data ?? []);
      setLoading(false);
    }

    loadLogs();
    return () => {
      cancelled = true;
    };
  }, [filters, supabase]);

  const schoolMap = Object.fromEntries((schools ?? []).map((school) => [school.id, school.name]));

  return (
    <div className="super-page-content">
      <div className="admin-panel">
        <div className="admin-help">
          {t("Concise audit history for super admin and admin actions that affect other users.")}
        </div>
        <div className="admin-form" style={{ marginTop: 12 }}>
          <div className="field small">
            <label>{t("Date From")}</label>
            <input
              type="date"
              value={filters.from}
              onChange={(event) => setFilters((prev) => ({ ...prev, from: event.target.value }))}
            />
          </div>
          <div className="field small">
            <label>{t("Date To")}</label>
            <input
              type="date"
              value={filters.to}
              onChange={(event) => setFilters((prev) => ({ ...prev, to: event.target.value }))}
            />
          </div>
          <div className="field small">
            <label>{t("Entity Type")}</label>
            <select
              value={filters.entityType}
              onChange={(event) => setFilters((prev) => ({ ...prev, entityType: event.target.value }))}
            >
              <option value="all">{t("All")}</option>
              <option value="school">{t("School")}</option>
              <option value="admin">{t("Admin")}</option>
              <option value="question_set">{t("Question Set")}</option>
              <option value="question_set_version">{t("Question Set Version")}</option>
              <option value="question_set_visibility">{t("Question Set Visibility")}</option>
              <option value="test_session">{t("Test Session")}</option>
              <option value="daily_record">{t("Daily Record")}</option>
              <option value="attendance_day">{t("Attendance Day")}</option>
              <option value="attendance_import">{t("Attendance Import")}</option>
              <option value="question_import">{t("Question Import")}</option>
              <option value="results_import">{t("Results Import")}</option>
              <option value="announcement">{t("Announcement")}</option>
              <option value="student">{t("Student")}</option>
              <option value="absence_application">{t("Absence Application")}</option>
            </select>
          </div>
          <div className="field small">
            <label>{t("School")}</label>
            <select
              value={filters.schoolId}
              onChange={(event) => setFilters((prev) => ({ ...prev, schoolId: event.target.value }))}
            >
              <option value="all">{t("All schools")}</option>
              {schools.map((school) => (
                <option key={school.id} value={school.id}>{school.name}</option>
              ))}
            </select>
          </div>
        </div>
        {msg ? <div className="admin-msg">{msg}</div> : null}
      </div>

      <div className="admin-panel">
        <div className="admin-table-wrap">
          <table className="admin-table" style={{ minWidth: 1100 }}>
            <thead>
              <tr>
                <th>{t("Time")}</th>
                <th>{t("Actor")}</th>
                <th>{t("Activity")}</th>
                <th>{t("School")}</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((row) => (
                <tr key={row.id}>
                  <td>{formatAuditDateTime(row.created_at)}</td>
                  <td>
                    <div>{row.actor_email || row.actor_user_id || "N/A"}</div>
                    <div className="daily-code">{row.actor_role || "N/A"}</div>
                  </td>
                  <td>
                    <div>{buildAuditSummary(row)}</div>
                  </td>
                  <td>{row.school_id ? schoolMap[row.school_id] ?? row.school_id : t("Global")}</td>
                </tr>
              ))}
              {!loading && logs.length === 0 ? (
                <tr>
                  <td colSpan={4}>{t("No audit logs found for the selected filters.")}</td>
                </tr>
              ) : null}
              {loading ? (
                <tr>
                  <td colSpan={4}><AdminLoadingState compact label={t("Loading audit logs...")} /></td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
