"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getStudentWithdrawalDate, getTodayYmd } from "../lib/studentWithdrawal";
import { useLanguage } from "../lib/i18n";
import { useAdminConsoleWorkspaceContext } from "./AdminConsoleWorkspaceContext";
import { useStudentsWorkspaceState } from "./AdminConsoleStudentsWorkspaceState";
import AdminLoadingState from "./AdminLoadingState";
import AdminStatusMessage from "./AdminStatusMessage";

const LazyAdminConsoleResultsWorkspace = dynamic(() => import("./AdminConsoleResultsWorkspace"));

export default function AdminConsoleStudentsWorkspace() {
  const { t } = useLanguage();
  const contextData = useAdminConsoleWorkspaceContext();
  const {
    activeSchoolId,
    adminViewStateStorageKey,
    adminDataStorageUserId,
    adminDataStorageSchoolId,
    session,
    canUseAdminConsole,
    supabase,
    students,
    testSessions,
    testSessionsLoaded,
    studentsLoaded,
    testMetaByVersion,
    getScoreRate,
    fetchStudents,
    setInviteOpen,
    handleLoadStudentWarnings,
    studentWarningCounts,
    handleCsvFile,
    csvMsg,
    selectedStudent: contextSelectedStudent,
    setSelectedStudentId: setContextSelectedStudentId,
    exportStudentReportPdf,
    setReissueStudent,
    setReissuePassword,
    setReissueIssuedPassword,
    setReissueLoading,
    setReissueMsg,
    setReissueOpen,
    toggleTestAccount,
    toggleWithdrawn,
    deleteStudent,
    fetchStudentAttendance,
    fetchStudentAttempts,
    fetchStudentDetail,
    setStudentInfoForm: setCoreStudentInfoForm,
    getPersonalInfoForm,
    setStudentInfoUploadFiles: setCoreStudentInfoUploadFiles,
    setStudentInfoMsg: setCoreStudentInfoMsg,
    setStudentInfoOpen: setCoreStudentInfoOpen,
    studentWarnings,
    studentWarningsLoading,
    studentWarningsLoaded,
    studentWarningsMsg,
    hasStudentDetailFields,
    formatDateFull,
    calculateAge,
    formatYearsOfExperience,
    PERSONAL_UPLOAD_FIELDS,
    renderProfileUpload,
    getProfileUploads,
    studentModelCategorySummaryRows,
    studentModelAttempts,
    sectionTitles,
    renderTwoLineHeader,
    getAttemptEffectivePassRate,
    studentAttemptSummaryById,
    studentAttemptDisplayScoreById,
    attemptCanOpenDetail,
    openAttemptDetail,
    getAttemptTitle,
    getAttemptDisplayDateValue,
    getTabLeftCount,
    selectedAttempt,
    attemptDetailOpen,
    setAttemptDetailOpen,
    setSelectedAttemptObj,
    attemptDetailSource,
    setAttemptDetailSource,
    attemptQuestionsLoading,
    attemptQuestionsError,
    attemptDetailTab,
    setAttemptDetailTab,
    selectedAttemptRows,
    selectedAttemptScoreRate,
    selectedAttemptUsesImportedSummary,
    selectedAttemptUsesImportedModelSummary,
    selectedAttemptMainSectionSummary,
    selectedAttemptIsPass,
    selectedAttemptIsModel,
    selectedAttemptNestedSectionSummary,
    selectedAttemptPassRate,
    selectedAttemptSectionSummary,
    selectedAttemptQuestionSectionsFiltered,
    attemptDetailSectionRefs,
    attemptDetailWrongOnly,
    setAttemptDetailWrongOnly,
    exportSelectedAttemptCsv,
    deleteAttempt: deleteAttemptRecord,
    studentDailyCategorySummaryRows,
    studentDailyAttemptsByCategory,
    studentAttendancePrevMonthKey,
    selectedStudentAttendanceMonth,
    studentAttendanceMonthOptions,
    studentAttendanceNextMonthKey,
    studentAttendancePie,
    attendanceSummary,
    filteredStudentAttendance,
    formatDateShort,
    formatWeekday,
    formatDateTime,
    summarizeWarningCriteria,
    getDefaultStudentWarningForm,
    issueStudentWarning: issueStudentWarningCtx,
    deleteStudentWarning: deleteStudentWarningCtx,
    studentWarningPreviewStudent,
    studentWarningPreviewEntries,
    studentWarningIssueOpen,
    setStudentWarningIssueOpen,
    studentWarningIssueSaving,
    setStudentWarningIssueSaving,
    studentWarningIssueMsg,
    setStudentWarningIssueMsg,
    studentWarningDeletingId,
    setStudentWarningDeletingId,
    studentWarningForm,
    setStudentWarningForm,
    selectedStudentWarning,
    setSelectedStudentWarning,
    studentWarningPreviewStudentId,
    setStudentWarningPreviewStudentId,
  } = contextData;

  // Use the Students workspace state hook
  const {
    studentMsg,
    selectedStudentId,
    setSelectedStudentId,
    selectedStudentDetail,
    setSelectedStudentDetail,
    selectedStudentTab,
    setSelectedStudentTab,
    studentAttempts,
    setStudentAttempts,
    studentAttemptsMsg,
    setStudentAttemptsMsg,
    studentAttemptRanks,
    setStudentAttemptRanks,
    studentAttendance,
    setStudentAttendance,
    studentAttendanceMsg,
    setStudentAttendanceMsg,
    studentAttendanceRange,
    setStudentAttendanceRange,
    studentInfoOpen,
    setStudentInfoOpen,
    studentInfoSaving,
    setStudentInfoSaving,
    studentInfoMsg,
    setStudentInfoMsg,
    studentInfoForm,
    setStudentInfoForm,
    studentInfoUploadFiles,
    setStudentInfoUploadFiles,
    studentListFilters,
    setStudentListFilters,
    studentListLoading,
    studentListMetricsLoaded,
    studentDetailOpen,
    setStudentDetailOpen,
    studentDetailLoading,
    setStudentDetailLoading,
    studentDetailMsg,
    studentReportExporting,
    setStudentReportExporting,
    studentAttendanceMonthKey,
    setStudentAttendanceMonthKey,
    studentListRows,
    fetchStudentListMetrics,
    openStudentWarningsModalFn,
    openStudentDetailFn,
    normalizeStudentNumberInput,
    getStudentDisplayName,
  } = useStudentsWorkspaceState({
    supabase,
    activeSchoolId,
    session,
    students,
    testSessions,
    testSessionsLoaded,
    testMetaByVersion,
    getScoreRate,
    fetchStudentDetail,
    setStudentWarningForm,
    setStudentWarningIssueMsg,
    setStudentWarningIssueOpen,
    viewStateStorageKey: adminViewStateStorageKey,
    dataStorageUserId: adminDataStorageUserId,
    dataStorageSchoolId: adminDataStorageSchoolId,
  });

  const selectedStudent = useMemo(() => {
    if (!selectedStudentId) return null;
    const selectedStudentSummary = students.find((student) => student.id === selectedStudentId) ?? null;
    if (contextSelectedStudent?.id === selectedStudentId) {
      return { ...(selectedStudentSummary ?? {}), ...contextSelectedStudent };
    }
    if (selectedStudentDetail?.id === selectedStudentId) {
      return { ...(selectedStudentSummary ?? {}), ...selectedStudentDetail };
    }
    return selectedStudentSummary;
  }, [contextSelectedStudent, selectedStudentDetail, selectedStudentId, students]);
  const selectedStudentWithdrawalDate = getStudentWithdrawalDate(selectedStudent);
  const [withdrawalSaving, setWithdrawalSaving] = useState(false);
  const [withdrawalDateDraft, setWithdrawalDateDraft] = useState("");
  const [withdrawalDateEditing, setWithdrawalDateEditing] = useState(false);
  const [studentListFilterOpen, setStudentListFilterOpen] = useState(false);

  const autoLoadSchoolIdRef = useRef("");

  // Wrapper for loading metrics (since handleLoadStudentMetrics from context references old fetchStudentListMetrics)
  const loadMetrics = useCallback(() => {
    if (studentListLoading) return;
    fetchStudentListMetrics();
  }, [studentListLoading, fetchStudentListMetrics]);

  useEffect(() => {
    if (!activeSchoolId || !session || !canUseAdminConsole || !supabase) return;
    if (autoLoadSchoolIdRef.current === activeSchoolId) return;
    if (studentsLoaded) {
      autoLoadSchoolIdRef.current = activeSchoolId;
      if (!studentListMetricsLoaded) {
        void fetchStudentListMetrics();
      }
      if (!studentWarningsLoaded) {
        void handleLoadStudentWarnings();
      }
      return;
    }
    autoLoadSchoolIdRef.current = activeSchoolId;
    void fetchStudentListMetrics();
    void handleLoadStudentWarnings();
  }, [
    activeSchoolId,
    canUseAdminConsole,
    fetchStudentListMetrics,
    handleLoadStudentWarnings,
    supabase,
    session,
    studentsLoaded,
    studentListMetricsLoaded,
    studentWarningsLoaded,
  ]);

  useEffect(() => {
    if (!activeSchoolId || !session || !canUseAdminConsole) return;
    if (studentsLoaded) return;
    fetchStudents();
  }, [activeSchoolId, canUseAdminConsole, session, studentsLoaded]);

  useEffect(() => {
    setContextSelectedStudentId(selectedStudentId || "");
  }, [selectedStudentId, setContextSelectedStudentId]);

  useEffect(() => {
    setWithdrawalSaving(false);
    setWithdrawalDateDraft(selectedStudentWithdrawalDate || getTodayYmd());
    setWithdrawalDateEditing(false);
  }, [selectedStudentId, selectedStudentWithdrawalDate]);

  useEffect(() => {
    setStudentListFilterOpen(false);
  }, [activeSchoolId]);

  const hasStudentListFilterValue = useMemo(() => (
    Boolean(
      studentListFilters.maxAttendance
      || studentListFilters.minUnexcused
      || studentListFilters.minModelAvg
      || studentListFilters.minDailyAvg
      || studentListFilters.from
      || studentListFilters.to
    )
  ), [
    studentListFilters.from,
    studentListFilters.maxAttendance,
    studentListFilters.minDailyAvg,
    studentListFilters.minModelAvg,
    studentListFilters.minUnexcused,
    studentListFilters.to,
  ]);

  const handleWithdrawnToggle = useCallback(async (nextValue) => {
    if (!selectedStudent) return;
    setWithdrawalSaving(true);
    try {
      await toggleWithdrawn(selectedStudent, nextValue, {
        withdrawalDate: nextValue
          ? (selectedStudentWithdrawalDate || getTodayYmd())
          : null,
      });
      if (!nextValue) {
        setWithdrawalDateEditing(false);
      }
    } finally {
      setWithdrawalSaving(false);
    }
  }, [selectedStudent, selectedStudentWithdrawalDate, toggleWithdrawn]);

  const handleWithdrawalDateSave = useCallback(async () => {
    if (!selectedStudent || !selectedStudent.is_withdrawn || !withdrawalDateDraft) return;
    setWithdrawalSaving(true);
    try {
      await toggleWithdrawn(selectedStudent, true, { withdrawalDate: withdrawalDateDraft });
      setWithdrawalDateEditing(false);
    } finally {
      setWithdrawalSaving(false);
    }
  }, [selectedStudent, toggleWithdrawn, withdrawalDateDraft]);

  return (
    <div style={{ marginBottom: 12 }}>
      {!studentDetailOpen ? (
        <>
          <div style={{ marginTop: 14, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <div className="admin-title">{t("Student List")}</div>
              <button className="btn btn-primary student-list-primary-btn" onClick={() => setInviteOpen(true)}>
                <svg viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M10 4v12M4 10h12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <span>{t("Add New Student")}</span>
              </button>
              <button
                className="btn student-list-primary-btn student-warning-launch-btn"
                onClick={() => {
                  openStudentWarningsModalFn(getDefaultStudentWarningForm);
                  void handleLoadStudentWarnings();
                }}
              >
                <svg viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M10 4v12M4 10h12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <span>{t("Warnings")}</span>
              </button>
              <button
                className={`btn admin-icon-action-btn attendance-filter-toggle-btn ${studentListFilterOpen || hasStudentListFilterValue ? "active" : ""}`}
                type="button"
                aria-label={studentListFilterOpen ? t("Hide student filters") : t("Show student filters")}
                aria-expanded={studentListFilterOpen}
                title={studentListFilterOpen ? t("Hide filters") : hasStudentListFilterValue ? t("Show filters (active)") : t("Show filters")}
                onClick={() => setStudentListFilterOpen((current) => !current)}
              >
                <svg viewBox="0 0 20 20" aria-hidden="true">
                  <path
                    d="M4 5.5h12"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="8" cy="5.5" r="1.7" fill="#fff" stroke="currentColor" strokeWidth="1.4" />
                  <path
                    d="M4 10h12"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="12.25" cy="10" r="1.7" fill="#fff" stroke="currentColor" strokeWidth="1.4" />
                  <path
                    d="M4 14.5h12"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="6.5" cy="14.5" r="1.7" fill="#fff" stroke="currentColor" strokeWidth="1.4" />
                </svg>
                {(studentListFilterOpen || hasStudentListFilterValue) ? (
                  <span className="attendance-filter-toggle-indicator" aria-hidden="true" />
                ) : null}
              </button>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8, flexWrap: "wrap", marginLeft: "auto" }}>
              <button
                className="btn student-list-primary-btn"
                type="button"
                onClick={() => void loadMetrics()}
                disabled={studentListLoading}
                aria-label={studentListLoading ? t("Loading Metrics...") : studentListMetricsLoaded ? t("Refresh Metrics") : t("Load Metrics")}
                title={studentListLoading ? t("Loading Metrics...") : studentListMetricsLoaded ? t("Refresh Metrics") : t("Load Metrics")}
              >
                <svg viewBox="0 0 20 20" aria-hidden="true">
                  <path
                    d="M16 10a6 6 0 1 1-1.76-4.24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                  <path
                    d="M16 4.5v3.75h-3.75"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>{studentListLoading ? t("Loading Metrics...") : studentListMetricsLoaded ? t("Refresh Metrics") : t("Load Metrics")}</span>
              </button>
              <button
                className="btn student-list-primary-btn"
                type="button"
                onClick={() => void handleLoadStudentWarnings()}
                disabled={studentWarningsLoading}
                aria-label={studentWarningsLoading ? t("Loading Warnings...") : studentWarningsLoaded ? t("Refresh Warnings") : t("Load Warnings")}
                title={studentWarningsLoading ? t("Loading Warnings...") : studentWarningsLoaded ? t("Refresh Warnings") : t("Load Warnings")}
              >
                <svg viewBox="0 0 20 20" aria-hidden="true">
                  <path
                    d="M16 10a6 6 0 1 1-1.76-4.24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                  <path
                    d="M16 4.5v3.75h-3.75"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>{studentWarningsLoading ? t("Loading Warnings...") : studentWarningsLoaded ? t("Refresh Warnings") : t("Load Warnings")}</span>
              </button>
            </div>
          </div>

          {studentListFilterOpen ? (
            <div className="attendance-filter-box" style={{ marginTop: 14 }}>
              <div className="admin-form" style={{ marginTop: 0 }}>
                <div className="field small">
                  <label className="student-list-filter-label">{t("Filter (Attendance Rate ≤)")}</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="e.g. 80"
                    value={studentListFilters.maxAttendance}
                    onChange={(e) => setStudentListFilters((s) => ({ ...s, maxAttendance: e.target.value }))}
                  />
                </div>
                <div className="field small">
                  <label className="student-list-filter-label">{t("Filter (Unexcused ≥)")}</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 3"
                    value={studentListFilters.minUnexcused}
                    onChange={(e) => setStudentListFilters((s) => ({ ...s, minUnexcused: e.target.value }))}
                  />
                </div>
                <div className="field small">
                  <label className="student-list-filter-label">{t("Filter (Model Avg Rate ≥)")}</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="e.g. 60"
                    value={studentListFilters.minModelAvg}
                    onChange={(e) => setStudentListFilters((s) => ({ ...s, minModelAvg: e.target.value }))}
                  />
                </div>
                <div className="field small">
                  <label className="student-list-filter-label">{t("Filter (Daily Avg Rate ≥)")}</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="e.g. 60"
                    value={studentListFilters.minDailyAvg}
                    onChange={(e) => setStudentListFilters((s) => ({ ...s, minDailyAvg: e.target.value }))}
                  />
                </div>
                <div className="field small">
                  <label className="student-list-filter-label">{t("Filter Date From")}</label>
                  <input
                    type="date"
                    value={studentListFilters.from}
                    onChange={(e) => setStudentListFilters((s) => ({ ...s, from: e.target.value }))}
                  />
                </div>
                <div className="field small">
                  <label className="student-list-filter-label">{t("Filter Date To")}</label>
                  <input
                    type="date"
                    value={studentListFilters.to}
                    onChange={(e) => setStudentListFilters((s) => ({ ...s, to: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          ) : null}
          <div className="admin-table-wrap" style={{ marginTop: 10 }}>
            <table className="admin-table" style={{ minWidth: 960 }}>
              <thead>
                <tr>
                  <th>{t("Student No.")}</th>
                  <th>{t("Name")}</th>
                  <th>{t("Email")}</th>
                  <th>{t("Attendance Rate")}</th>
                  <th>{t("Unexcused Absence")}</th>
                  <th>{t("Model Avg Rate")}</th>
                  <th>{t("Daily Avg Rate")}</th>
                </tr>
              </thead>
              <tbody>
                {studentListRows.map((row) => {
                  const s = row.student;
                  const rateLabel = row.attendanceRate == null ? "-" : `${row.attendanceRate.toFixed(1)}%`;
                  const modelLabel = row.modelAvg == null ? "-" : `${row.modelAvg.toFixed(1)}%`;
                  const dailyLabel = row.dailyAvg == null ? "-" : `${row.dailyAvg.toFixed(1)}%`;
                  return (
                    <tr
                      key={s.id}
                      onClick={() => {
                        void openStudentDetailFn(s.id);
                      }}
                      className={s.is_withdrawn ? "row-withdrawn" : ""}
                    >
                      <td>{s.student_code ?? ""}</td>
                      <td>
                        <div className="student-list-name-cell">
                          {s.is_test_account ? (
                            <span className="student-test-account-badge" title={t("Test Account")} aria-label={t("Test Account")}>
                              T
                            </span>
                          ) : null}
                          <span>{s.display_name ?? ""}</span>
                          {studentWarningCounts[s.id] ? (
                            <button
                              type="button"
                              className="student-warning-badge student-warning-badge-btn"
                              title={`${studentWarningCounts[s.id]} warning(s) issued`}
                              onClick={(event) => {
                                event.stopPropagation();
                                setStudentWarningPreviewStudentId(s.id);
                              }}
                            >
                              !
                            </button>
                          ) : null}
                        </div>
                      </td>
                      <td>{s.email ?? ""}</td>
                      <td>{rateLabel}</td>
                      <td>{row.unexcused ?? 0}</td>
                      <td>{modelLabel}</td>
                      <td>{dailyLabel}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {!studentListMetricsLoaded && !studentListLoading ? (
            <div className="admin-help" style={{ marginTop: 6 }}>
              {t("Metrics are not loaded yet. Click Load Metrics to calculate attendance and test averages.")}
            </div>
          ) : null}
          {!studentWarningsLoaded && !studentWarningsLoading ? (
            <div className="admin-help" style={{ marginTop: 6 }}>
              {t("Warnings are not loaded yet. Click Load Warnings to show warning badges and warning history.")}
            </div>
          ) : null}
          {studentListLoading ? <AdminLoadingState compact label={t("Loading metrics...")} /> : null}
          {studentWarningsLoading ? <AdminLoadingState compact label={t("Loading warnings...")} /> : null}
          <AdminStatusMessage message={studentMsg} />

          <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <div className="admin-help">
              {t("CSV: email,display_name,student_code,temp_password")}
            </div>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => handleCsvFile(e.target.files?.[0])}
            />
            <div className="admin-help">{csvMsg}</div>
          </div>
        </>
      ) : null}

      {selectedStudentId && studentDetailOpen ? (
        <div
          className={`student-detail-shell ${selectedStudent?.is_withdrawn ? "student-detail-shell-withdrawn" : ""}`}
          style={{ marginTop: 16 }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button
                  className="admin-icon-btn"
                  onClick={() => {
                    setSelectedStudentId("");
                    setStudentDetailOpen(false);
                  }}
                  aria-label={t("Back")}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" style={{ width: 18, height: 18 }}>
                    <path
                      d="m15 6-6 6 6 6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                <div className="admin-title">
                  {selectedStudent?.display_name ?? ""} {selectedStudent?.student_code ? `(${selectedStudent.student_code})` : ""}
                </div>
              </div>
            </div>
            <div className="student-detail-status-badges">
              {selectedStudent?.is_test_account ? (
                <span className="student-detail-status-pill student-detail-status-pill-test">{t("Test Account")}</span>
              ) : null}
              {selectedStudent?.is_withdrawn ? (
                <span className="student-detail-status-pill student-detail-status-pill-withdrawn">Withdrawn</span>
              ) : null}
            </div>
          </div>

          <div className="student-detail-tab-row">
            <div className="admin-top-tabs student-detail-tabs">
              <button className={`admin-top-tab ${selectedStudentTab === "information" ? "active" : ""}`} onClick={() => setSelectedStudentTab("information")}>
                {t("Information")}
              </button>
              <button
                className={`admin-top-tab ${selectedStudentTab === "attendance" ? "active" : ""}`}
                onClick={() => {
                  setSelectedStudentTab("attendance");
                  fetchStudentAttendance(selectedStudentId);
                }}
              >
                {t("Attendance")}
              </button>
              <button
                className={`admin-top-tab ${selectedStudentTab === "daily" ? "active" : ""}`}
                onClick={() => {
                  setSelectedStudentTab("daily");
                  fetchStudentAttempts(selectedStudentId);
                }}
              >
                {t("Daily Test")}
              </button>
              <button
                className={`admin-top-tab ${selectedStudentTab === "model" ? "active" : ""}`}
                onClick={() => {
                  setSelectedStudentTab("model");
                  fetchStudentAttempts(selectedStudentId);
                }}
              >
                {t("Model Test")}
              </button>
              <button
                className={`admin-top-tab ${selectedStudentTab === "actions" ? "active" : ""}`}
                onClick={() => setSelectedStudentTab("actions")}
              >
                {t("Actions")}
              </button>
            </div>
          </div>

          {selectedStudentTab === "information" ? (
            <div className="student-info-panel" style={{ marginTop: 12 }}>
              <div className="student-info-panel-header">
                <div>
                  <div className="admin-title">{t("Personal Information")}</div>
                  <div className="admin-subtitle">{t("Shared student profile data visible from both student and admin portals.")}</div>
                </div>
                <button
                  className="btn btn-primary"
                  disabled={studentDetailLoading || !hasStudentDetailFields(selectedStudent)}
                  onClick={() => {
                    setCoreStudentInfoForm(getPersonalInfoForm(selectedStudent));
                    setCoreStudentInfoUploadFiles({});
                    setCoreStudentInfoMsg("");
                    setCoreStudentInfoOpen(true);
                  }}
                >
                  {t("Edit Information")}
                </button>
              </div>
              {studentDetailLoading ? <AdminLoadingState compact label={t("Loading full student details...")} /> : null}
              <AdminStatusMessage message={studentDetailMsg} />
              <div className="student-info-grid admin-student-info-grid">
                {[
                  { label: t("Full Name"), value: selectedStudent?.display_name || "-" },
                  { label: t("Email"), value: selectedStudent?.email || "-" },
                  { label: t("Student No."), value: selectedStudent?.student_code || "-" },
                  { label: t("Phone Number"), value: selectedStudent?.phone_number || "-" },
                  {
                    label: t("Date of Birth"),
                    value: selectedStudent?.date_of_birth
                      ? `${formatDateFull(selectedStudent.date_of_birth)}${calculateAge(selectedStudent.date_of_birth) != null ? ` • Age ${calculateAge(selectedStudent.date_of_birth)}` : ""}`
                      : "-"
                  },
                  { label: t("Sex"), value: selectedStudent?.sex || "-" },
                  { label: t("Current Working Facility"), value: selectedStudent?.current_working_facility || "-" },
                  { label: t("Years of Experience"), value: formatYearsOfExperience(selectedStudent?.years_of_experience) || "-" },
                  { label: t("Nursing Certificate"), value: selectedStudent?.nursing_certificate || "-" },
                  { label: t("Certificate Status"), value: selectedStudent?.nursing_certificate_status || "-" },
                  { label: t("BNMC Registration Number"), value: selectedStudent?.bnmc_registration_number || "-" },
                  {
                    label: t("BNMC Registration Expiry Date"),
                    value: selectedStudent?.bnmc_registration_expiry_date
                      ? formatDateFull(selectedStudent.bnmc_registration_expiry_date)
                      : "-"
                  },
                  { label: t("Passport Number"), value: selectedStudent?.passport_number || "-" },
                  ...PERSONAL_UPLOAD_FIELDS.map((field) => ({
                    label: field.label,
                    value: renderProfileUpload(getProfileUploads(selectedStudent?.profile_uploads)[field.key], field.label),
                    wide: true,
                  })),
                ].map((item) => (
                  <div key={item.label} className={`student-info-row ${item.wide ? "student-info-row-wide" : ""}`}>
                    <div className="student-info-label">{item.label}</div>
                    <div className="student-info-value">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {selectedStudentTab === "model" ? (
            <>
              <div className="admin-table-wrap" style={{ marginTop: 10 }}>
                <table className="admin-table" style={{ minWidth: 640 }}>
                  <thead>
                    <tr>
                      <th>{t("Category")}</th>
                      <th>{t("Average Rate")}</th>
                      <th>{t("Pass")}</th>
                      <th>{t("Fail")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentModelCategorySummaryRows.length ? studentModelCategorySummaryRows.map((row) => (
                        <tr key={`student-model-summary-${row.category}`}>
                        <td>{row.category}</td>
                        <td>{row.averageRateLabel}</td>
                        <td>{row.passCount}</td>
                        <td>{row.failCount}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan={4}>{t("No model test records.")}</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="admin-table-wrap" style={{ marginTop: 10 }}>
                <table className="admin-table" style={{ minWidth: 980 }}>
                  <thead>
                    <tr>
                      <th>{t("Test")}</th>
                      <th>{t("Date")}</th>
                      <th>{t("Total Score")}</th>
                      <th>{t("Rate")}</th>
                      <th>{t("P/F")}</th>
                      <th>{t("Class Rank")}</th>
                      {sectionTitles.map((title) => (
                        <th key={`sec-${title}`} className="admin-table-compact">
                          {renderTwoLineHeader(title)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {studentModelAttempts.map((a) => {
                      const displayScore = studentAttemptDisplayScoreById[a.id] || null;
                      const score = displayScore?.total > 0
                        ? `${displayScore.correct}/${displayScore.total}`
                        : (a.correct === 0 && a.total === 0 ? "-" : `${a.correct}/${a.total}`);
                      const rateValue = displayScore ? displayScore.scoreRate : getScoreRate(a);
                      const rate = `${(rateValue * 100).toFixed(1)}%`;
                      const passRate = getAttemptEffectivePassRate(a);
                      const passed = rateValue >= passRate;
                      const rankInfo = studentAttemptRanks[a.id];
                      const summary = studentAttemptSummaryById[a.id] || {};
                      return (
                        <tr key={`student-model-${a.id}`} onClick={() => openAttemptDetail(a)}>
                          <td>{getAttemptTitle(a)}</td>
                          <td>{formatDateFull(getAttemptDisplayDateValue(a))}</td>
                          <td>{score}</td>
                          <td>{rate}</td>
                          <td><span className={passed ? "pf-pass" : "pf-fail"}>{passed ? t("Pass") : t("Fail")}</span></td>
                          <td>{rankInfo ? `${rankInfo.rank}/${rankInfo.total}` : "-"}</td>
                          {sectionTitles.map((title) => {
                            const s = summary[title];
                            return (
                              <td key={`${a.id}-${title}`} className="admin-table-compact">
                                {s ? `${s.correct}/${s.total}` : "-"}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <AdminStatusMessage message={studentAttemptsMsg} />
            </>
          ) : null}

          {selectedStudentTab === "daily" ? (
            <>
              <div className="admin-table-wrap" style={{ marginTop: 10 }}>
                <table className="admin-table" style={{ minWidth: 640 }}>
                  <thead>
                    <tr>
                      <th>{t("Category")}</th>
                      <th>{t("Average Rate")}</th>
                      <th>{t("Pass")}</th>
                      <th>{t("Fail")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentDailyCategorySummaryRows.length ? studentDailyCategorySummaryRows.map((row) => (
                      <tr key={`student-daily-summary-${row.category}`}>
                        <td>{row.category}</td>
                        <td>{row.averageRateLabel}</td>
                        <td>{row.passCount}</td>
                        <td>{row.failCount}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan={4}>{t("No daily test records.")}</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              {studentDailyAttemptsByCategory.map(([category, items]) => (
                <div key={`daily-${category}`} style={{ marginTop: 12 }}>
                  <div className="admin-subtitle" style={{ fontWeight: 900 }}>{category}</div>
                  <div className="admin-table-wrap" style={{ marginTop: 8 }}>
                    <table className="admin-table" style={{ minWidth: 820 }}>
                      <thead>
                        <tr>
                          <th>{t("Test")}</th>
                          <th>{t("Date")}</th>
                          <th>{t("Score")}</th>
                          <th>{t("Rate")}</th>
                          <th>{t("P/F")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((a) => {
                          const displayScore = studentAttemptDisplayScoreById[a.id] || null;
                          const score = displayScore?.total > 0
                            ? `${displayScore.correct}/${displayScore.total}`
                            : (a.correct === 0 && a.total === 0 ? "-" : `${a.correct}/${a.total}`);
                          const rateValue = displayScore ? displayScore.scoreRate : getScoreRate(a);
                          const rate = `${(rateValue * 100).toFixed(1)}%`;
                          const passRate = getAttemptEffectivePassRate(a);
                          const passed = rateValue >= passRate;
                          return (
                        <tr key={`student-daily-${a.id}`} onClick={() => openAttemptDetail(a)}>
                          <td>{getAttemptTitle(a)}</td>
                          <td>{formatDateFull(getAttemptDisplayDateValue(a))}</td>
                          <td>{score}</td>
                          <td>{rate}</td>
                              <td><span className={passed ? "pf-pass" : "pf-fail"}>{passed ? t("Pass") : t("Fail")}</span></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
              <AdminStatusMessage message={studentAttemptsMsg} />
            </>
          ) : null}

          {selectedStudentTab === "attendance" ? (
            <>
              <div className="student-attendance-summary-section" style={{ marginTop: 10 }}>
                <div className="student-attendance-summary-top">
                  <div className="student-attendance-pie-panel">
                    <div className="student-attendance-month-bar">
                      <button
                        className="student-attendance-month-nav"
                        type="button"
                        onClick={() => studentAttendancePrevMonthKey && setStudentAttendanceMonthKey(studentAttendancePrevMonthKey)}
                        disabled={!studentAttendancePrevMonthKey}
                        aria-label="Previous month"
                      >
                        ‹
                      </button>
                      <div className="student-attendance-month-label">
                        <select
                          className="student-attendance-month-select"
                          value={selectedStudentAttendanceMonth.key}
                          onChange={(e) => setStudentAttendanceMonthKey(e.target.value)}
                        >
                          {studentAttendanceMonthOptions.map((option) => (
                            <option key={`student-attendance-month-${option.key}`} value={option.key}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        className="student-attendance-month-nav"
                        type="button"
                        onClick={() => studentAttendanceNextMonthKey && setStudentAttendanceMonthKey(studentAttendanceNextMonthKey)}
                        disabled={!studentAttendanceNextMonthKey}
                        aria-label="Next month"
                      >
                        ›
                      </button>
                    </div>

                    <div className="student-attendance-pie-wrap">
                      <div className="student-attendance-pie" style={{ "--pie-bg": `conic-gradient(${studentAttendancePie.pieStops})` }}>
                        <div className="student-attendance-pie-labels">
                          {studentAttendancePie.pieLabels.map((item) => (
                            <span
                              key={`student-attendance-pie-${item.key}`}
                              className="student-attendance-pie-label"
                              style={{ "--x": `${item.x.toFixed(1)}px`, "--y": `${item.y.toFixed(1)}px` }}
                            >
                              {item.label}
                            </span>
                          ))}
                        </div>
                        <div className="student-attendance-pie-center">
                          <div className="student-attendance-rate">{studentAttendancePie.rateValue.toFixed(1)}%</div>
                          <div className="student-attendance-rate-label">{t("Attendance Rate")}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="admin-table-wrap">
                    <table className="admin-table" style={{ minWidth: 760 }}>
                      <thead>
                        <tr>
                          <th></th>
                          <th>{t("Overall")}</th>
                          {attendanceSummary.months.map((m) => (
                            <th key={m.key}>{m.label}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>{t("Attendance %")}</td>
                          <td>{attendanceSummary.overall.rate == null ? t("N/A") : `${attendanceSummary.overall.rate.toFixed(2)}%`}</td>
                          {attendanceSummary.months.map((m) => (
                            <td key={`${m.key}-rate`}>{m.stats.rate == null ? t("N/A") : `${m.stats.rate.toFixed(2)}%`}</td>
                          ))}
                        </tr>
                        <tr>
                          <td>{t("Total Days")}</td>
                          <td>{attendanceSummary.overall.total || "-"}</td>
                          {attendanceSummary.months.map((m) => (
                            <td key={`${m.key}-total`}>{m.stats.total || "-"}</td>
                          ))}
                        </tr>
                        <tr>
                          <td>{t("Present (P)")}</td>
                          <td>{attendanceSummary.overall.present || "-"}</td>
                          {attendanceSummary.months.map((m) => (
                            <td key={`${m.key}-present`}>{m.stats.present || "-"}</td>
                          ))}
                        </tr>
                        <tr>
                          <td>{t("Late/Left Early (L)")}</td>
                          <td>{attendanceSummary.overall.late || "-"}</td>
                          {attendanceSummary.months.map((m) => (
                            <td key={`${m.key}-late`}>{m.stats.late || "-"}</td>
                          ))}
                        </tr>
                        <tr>
                          <td>{t("Excused Absence (E)")}</td>
                          <td>{attendanceSummary.overall.excused || "-"}</td>
                          {attendanceSummary.months.map((m) => (
                            <td key={`${m.key}-excused`}>{m.stats.excused || "-"}</td>
                          ))}
                        </tr>
                        <tr>
                          <td>{t("Unexcused Absence (A)")}</td>
                          <td>{attendanceSummary.overall.unexcused || "-"}</td>
                          {attendanceSummary.months.map((m) => (
                            <td key={`${m.key}-unexcused`}>{m.stats.unexcused || "-"}</td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="admin-form" style={{ marginTop: 10 }}>
                <div className="field small">
                  <label>{t("From")}</label>
                  <input type="date" value={studentAttendanceRange.from} onChange={(e) => setStudentAttendanceRange((s) => ({ ...s, from: e.target.value }))} />
                </div>
                <div className="field small">
                  <label>{t("To")}</label>
                  <input type="date" value={studentAttendanceRange.to} onChange={(e) => setStudentAttendanceRange((s) => ({ ...s, to: e.target.value }))} />
                </div>
                <div className="field small">
                  <label>&nbsp;</label>
                  <button className="btn" type="button" onClick={() => setStudentAttendanceRange({ from: "", to: "" })}>
                    {t("Clear")}
                  </button>
                </div>
              </div>

              <div className="admin-table-wrap" style={{ marginTop: 10 }}>
                <table className="admin-table" style={{ minWidth: 760 }}>
                  <thead>
                    <tr>
                      <th>{t("Date")}</th>
                      <th>{t("Status")}</th>
                      <th>{t("Comment")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudentAttendance.map((r, idx) => (
                      <tr key={`att-row-${idx}`}>
                        <td>{`${formatDateShort(r.day_date)} (${formatWeekday(r.day_date)})`}</td>
                        <td>{r.status}</td>
                        <td>{r.comment}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <AdminStatusMessage message={studentAttendanceMsg} />
            </>
          ) : null}

          {selectedStudentTab === "actions" ? (
            <div className="student-actions-panel" style={{ marginTop: 12 }}>
              <div className="student-actions-list">
                <div className="student-actions-row">
                  <div>
                    <div className="student-actions-title">{t("Export PDF")}</div>
                    <div className="student-actions-help">{t("Download the student report with profile, attendance, and test data.")}</div>
                  </div>
                  <button
                    className="btn student-detail-action-btn"
                    onClick={exportStudentReportPdf}
                    disabled={studentReportExporting || studentDetailLoading}
                  >
                    <svg viewBox="0 0 20 20" aria-hidden="true">
                      <path d="M10 3v8m0 0 3-3m-3 3-3-3M4 13.5v1.25C4 15.44 4.56 16 5.25 16h9.5c.69 0 1.25-.56 1.25-1.25V13.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {studentReportExporting ? t("Exporting...") : t("Export PDF")}
                  </button>
                </div>

                <div className="student-actions-row">
                  <div>
                    <div className="student-actions-title">{t("Reissue Temp Pass")}</div>
                    <div className="student-actions-help">{t("Generate a new temporary password for this student.")}</div>
                  </div>
                  <button
                    className="btn student-detail-action-btn"
                    onClick={() => {
                      if (!selectedStudent) return;
                      setReissueStudent(selectedStudent);
                      setReissuePassword("");
                      setReissueIssuedPassword("");
                      setReissueLoading(false);
                      setReissueMsg("");
                      setReissueOpen(true);
                    }}
                  >
                    {t("Reissue Temp Pass")}
                  </button>
                </div>

                <div className="student-actions-row">
                  <div>
                    <div className="student-actions-title">{t("Test Account")}</div>
                    <div className="student-actions-help">{t("Exclude this student from live analytics and treat the account as a test profile.")}</div>
                  </div>
                  <div className="student-actions-switch-row">
                    <span className="student-detail-toggle-label">{selectedStudent?.is_test_account ? t("On") : t("Off")}</span>
                    <label className="daily-session-create-switch" aria-label={t("Test Account")}>
                      <input
                        type="checkbox"
                        checked={Boolean(selectedStudent?.is_test_account)}
                        onChange={(event) => {
                          if (!selectedStudent) return;
                          toggleTestAccount(selectedStudent, event.target.checked);
                        }}
                      />
                      <span className="daily-session-create-switch-slider" />
                    </label>
                  </div>
                </div>

                <div className="student-actions-row student-actions-row-withdrawal">
                  <div>
                    <div className="student-actions-title">{t("Withdrawal")}</div>
                    <div className="student-actions-help">
                      {t("Exclude the student from attendance totals after the selected withdrawal date.")}
                    </div>
                  </div>
                  <div className="student-actions-withdrawal-controls">
                    <div className="student-actions-switch-row">
                      <span className="student-detail-toggle-label student-actions-toggle-state">
                        {withdrawalSaving ? (
                          <>
                            <span className="attendance-import-status-spinner admin-loading-spinner student-actions-saving-indicator" aria-hidden="true" />
                            <span>{t("Saving...")}</span>
                          </>
                        ) : (
                          <span>{selectedStudent?.is_withdrawn ? t("On") : t("Off")}</span>
                        )}
                      </span>
                      <label className="daily-session-create-switch" aria-label="Withdrawn">
                        <input
                          type="checkbox"
                          checked={Boolean(selectedStudent?.is_withdrawn)}
                          disabled={withdrawalSaving}
                          onChange={(event) => {
                            void handleWithdrawnToggle(event.target.checked);
                          }}
                        />
                        <span className="daily-session-create-switch-slider" />
                      </label>
                    </div>
                    <div className="student-actions-date-field">
                      <span className="student-actions-date-label">{t("Withdrawal Date")}</span>
                      <div className="student-actions-date-input-row">
                        <input
                          type="date"
                          value={selectedStudent?.is_withdrawn ? withdrawalDateDraft : ""}
                          disabled={!selectedStudent?.is_withdrawn || withdrawalSaving}
                          onFocus={() => {
                            if (!selectedStudent?.is_withdrawn) return;
                            setWithdrawalDateEditing(true);
                          }}
                          onClick={() => {
                            if (!selectedStudent?.is_withdrawn) return;
                            setWithdrawalDateEditing(true);
                          }}
                          onChange={(event) => {
                            setWithdrawalDateEditing(true);
                            setWithdrawalDateDraft(event.target.value);
                          }}
                        />
                        {selectedStudent?.is_withdrawn && withdrawalDateEditing ? (
                          <button
                            type="button"
                            className="btn"
                            disabled={
                              withdrawalSaving
                              || !withdrawalDateDraft
                              || withdrawalDateDraft === (selectedStudentWithdrawalDate || getTodayYmd())
                            }
                            onClick={() => {
                              void handleWithdrawalDateSave();
                            }}
                          >
                            Save
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="student-actions-danger">
                <button
                  className="btn btn-danger student-actions-delete-btn"
                  onClick={() => {
                    if (!selectedStudent) return;
                    deleteStudent(selectedStudent.id, selectedStudent.email);
                  }}
                >
                  {t("Delete Student")}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {studentWarningIssueOpen ? (
        <div className="admin-modal-overlay" onClick={() => setStudentWarningIssueOpen(false)}>
          <div className="admin-modal invite-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div className="student-warning-modal-title">{t("Create Warning")}</div>
              <button className="admin-modal-close" onClick={() => setStudentWarningIssueOpen(false)} aria-label="Close">
                &times;
              </button>
            </div>
            <div className="student-warning-history" style={{ marginTop: 10 }}>
              <div className="student-warning-history-title">{t("Issued Warnings")}</div>
              {studentWarningsLoading ? <AdminLoadingState compact label={t("Loading warnings...")} /> : null}
              <div className="student-warning-history-list">
                {studentWarnings.map((warning) => {
                  const summary = summarizeWarningCriteria(warning.criteria);
                  return (
                    <button key={warning.id} type="button" className="student-warning-card" onClick={() => setSelectedStudentWarning(warning)}>
                      <div className="student-warning-card-title">{warning.title || "Warning"}</div>
                      <div className="student-warning-card-meta">
                        {formatDateTime(warning.created_at)} · {warning.student_count || warning.recipients?.length || 0} student{(warning.student_count || warning.recipients?.length || 0) === 1 ? "" : "s"}
                      </div>
                      <div className="student-warning-card-summary">
                        {(summary.length ? summary : ["No criteria summary"]).join(" / ")}
                      </div>
                    </button>
                  );
                })}
                {!studentWarningsLoading && !studentWarnings.length ? (
                  <div className="admin-help">{t("No warnings issued yet.")}</div>
                ) : null}
              </div>
              <AdminStatusMessage message={studentWarningsMsg} />
            </div>
            <div className="admin-form student-warning-form" style={{ marginTop: 10 }}>
              <div className="field student-warning-form-title">
                <label>{t("Title (optional)")}</label>
                <input value={studentWarningForm.title} onChange={(e) => setStudentWarningForm((prev) => ({ ...prev, title: e.target.value }))} placeholder={t("Warning title")} />
              </div>
              <div className="student-warning-period-row">
                <div className="field">
                  <label>{t("Period")}</label>
                  <select
                    value={studentWarningForm.period ?? "all"}
                    onChange={(e) => setStudentWarningForm((prev) => ({
                      ...prev,
                      period: e.target.value,
                      from: e.target.value === "specified" ? prev.from : "",
                      to: e.target.value === "specified" ? prev.to : "",
                    }))}
                  >
                    <option value="all">{t("All period")}</option>
                    <option value="specified">{t("Specify Dates")}</option>
                  </select>
                  <div className="admin-help student-warning-period-hint">
                    {t("Choose Specify Dates to enable the date range.")}
                  </div>
                </div>
                <div className={`field student-warning-date-range-field${studentWarningForm.period !== "specified" ? " is-disabled" : ""}`}>
                  <label>{t("Date Range")}</label>
                  <div className="student-warning-period-dates">
                    <input
                      type="date"
                      value={studentWarningForm.from}
                      disabled={studentWarningForm.period !== "specified"}
                      onChange={(e) => setStudentWarningForm((prev) => ({ ...prev, from: e.target.value }))}
                    />
                    <input
                      type="date"
                      value={studentWarningForm.to}
                      disabled={studentWarningForm.period !== "specified"}
                      onChange={(e) => setStudentWarningForm((prev) => ({ ...prev, to: e.target.value }))}
                    />
                  </div>
                  <div className="admin-help student-warning-period-hint">
                    {studentWarningForm.period === "specified"
                      ? t("Select the start and end dates for this warning.")
                      : t("Date range is disabled until Specify Dates is selected.")}
                  </div>
                </div>
              </div>
              <div className="student-warning-criteria-grid">
                <div className="field">
                  <label>{t("Attendance Rate (%) (≤)")}</label>
                  <input type="number" min="0" max="100" value={studentWarningForm.maxAttendance} onChange={(e) => setStudentWarningForm((prev) => ({ ...prev, maxAttendance: e.target.value }))} />
                </div>
                <div className="field">
                  <label>{t("Unexcused Absences (≥)")}</label>
                  <input type="number" min="0" value={studentWarningForm.minUnexcused} onChange={(e) => setStudentWarningForm((prev) => ({ ...prev, minUnexcused: e.target.value }))} />
                </div>
                <div className="field">
                  <label>{t("Model Test Average (%) (≤)")}</label>
                  <input type="number" min="0" max="100" value={studentWarningForm.maxModelAvg} onChange={(e) => setStudentWarningForm((prev) => ({ ...prev, maxModelAvg: e.target.value }))} />
                </div>
                <div className="field">
                  <label>{t("Daily Test Average (%) (≤)")}</label>
                  <input type="number" min="0" max="100" value={studentWarningForm.maxDailyAvg} onChange={(e) => setStudentWarningForm((prev) => ({ ...prev, maxDailyAvg: e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="admin-help" style={{ marginTop: 10 }}>
              {t("Students are included if they match any selected warning threshold.")}
            </div>
            <AdminStatusMessage message={studentWarningIssueMsg} />
            <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button className="btn btn-primary" onClick={issueStudentWarningCtx} disabled={studentWarningIssueSaving}>
                {studentWarningIssueSaving ? t("Issuing...") : t("Issue Warning")}
              </button>
              <button className="btn" onClick={() => setStudentWarningForm(getDefaultStudentWarningForm())}>
                {t("Reset")}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {selectedStudentWarning ? (
        <div className="admin-modal-overlay" onClick={() => setSelectedStudentWarning(null)}>
          <div className="admin-modal invite-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <div className="student-warning-modal-title">{selectedStudentWarning.title || "Warning"}</div>
                <div className="admin-help" style={{ marginTop: 6 }}>
                  {formatDateTime(selectedStudentWarning.created_at)} · {selectedStudentWarning.student_count || selectedStudentWarning.recipients?.length || 0} student{(selectedStudentWarning.student_count || selectedStudentWarning.recipients?.length || 0) === 1 ? "" : "s"}
                </div>
              </div>
              <button className="admin-modal-close" onClick={() => setSelectedStudentWarning(null)} aria-label="Close">
                &times;
              </button>
            </div>
            <div className="admin-help" style={{ marginTop: 10 }}>
              {(summarizeWarningCriteria(selectedStudentWarning.criteria).length
                ? summarizeWarningCriteria(selectedStudentWarning.criteria)
                : ["No criteria summary"]
              ).join(" / ")}
            </div>
            <div className="admin-table-wrap" style={{ marginTop: 12 }}>
              <table className="admin-table" style={{ minWidth: 760 }}>
                <thead>
                  <tr>
                    <th>{t("Student No.")}</th>
                    <th>{t("Name")}</th>
                    <th>{t("Email")}</th>
                    <th>{t("Issues")}</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedStudentWarning.recipients ?? []).map((recipient) => {
                    const student = students.find((item) => item.id === recipient.student_id) ?? null;
                    return (
                      <tr key={`warning-recipient-${recipient.id}`}>
                        <td>{student?.student_code ?? ""}</td>
                        <td>{student?.display_name ?? recipient.student_id}</td>
                        <td>{student?.email ?? ""}</td>
                        <td>{(recipient.issues ?? []).join(" / ") || "-"}</td>
                      </tr>
                    );
                  })}
                  {!(selectedStudentWarning.recipients ?? []).length ? (
                    <tr><td colSpan={4}>{t("No recipients found.")}</td></tr>
                  ) : null}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end", gap: 10, flexWrap: "wrap" }}>
              <button
                className="btn btn-danger"
                onClick={() => deleteStudentWarningCtx(selectedStudentWarning)}
                disabled={studentWarningDeletingId === selectedStudentWarning.id}
              >
                {studentWarningDeletingId === selectedStudentWarning.id ? t("Deleting...") : t("Delete Warning")}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {studentWarningPreviewStudentId ? (
        <div className="admin-modal-overlay" onClick={() => setStudentWarningPreviewStudentId("")}>
          <div className="admin-modal invite-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <div className="student-warning-modal-title">{t("Applied Warnings")}</div>
                <div className="admin-help" style={{ marginTop: 6 }}>
                  {studentWarningPreviewStudent?.display_name || studentWarningPreviewStudent?.email || studentWarningPreviewStudentId}
                </div>
              </div>
              <button className="admin-modal-close" onClick={() => setStudentWarningPreviewStudentId("")} aria-label="Close">
                &times;
              </button>
            </div>
            <div className="student-warning-history-list" style={{ marginTop: 12 }}>
              {studentWarningPreviewEntries.map(({ warning, recipient }) => {
                const summary = summarizeWarningCriteria(warning.criteria);
                return (
                  <button
                    key={`student-warning-preview-${warning.id}-${recipient.id}`}
                    type="button"
                    className="student-warning-card"
                    onClick={() => {
                      setStudentWarningPreviewStudentId("");
                      setSelectedStudentWarning(warning);
                    }}
                  >
                    <div className="student-warning-card-title">{warning.title || "Warning"}</div>
                    <div className="student-warning-card-meta">{formatDateTime(warning.created_at)}</div>
                    <div className="student-warning-card-summary">
                      {(recipient.issues ?? []).join(" / ") || (summary.length ? summary.join(" / ") : "No criteria summary")}
                    </div>
                  </button>
                );
              })}
              {!studentWarningPreviewEntries.length ? (
                <div className="admin-help">{t("No warnings found for this student.")}</div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {attemptDetailOpen ? (
        <LazyAdminConsoleResultsWorkspace
          supabase={supabase}
          resultContext={null}
          sessionDetail={{ type: "", sessionId: "" }}
          students={students}
          testMetaByVersion={testMetaByVersion}
          attemptCanOpenDetail={attemptCanOpenDetail}
          openAttemptDetail={openAttemptDetail}
          formatDateTime={formatDateTime}
          getAttemptTitle={getAttemptTitle}
          getTabLeftCount={getTabLeftCount}
          getScoreRate={getScoreRate}
          renderTwoLineHeader={renderTwoLineHeader}
          attemptDetailOpen={attemptDetailOpen}
          selectedAttempt={selectedAttempt}
          selectedAttemptRows={selectedAttemptRows}
          selectedAttemptScoreRate={selectedAttemptScoreRate}
          studentAttemptRanks={studentAttemptRanks}
          attemptDetailSource={attemptDetailSource}
          selectedAttemptUsesImportedSummary={selectedAttemptUsesImportedSummary}
          selectedAttemptUsesImportedModelSummary={selectedAttemptUsesImportedModelSummary}
          selectedAttemptMainSectionSummary={selectedAttemptMainSectionSummary}
          setAttemptDetailOpen={setAttemptDetailOpen}
          setSelectedAttemptObj={setSelectedAttemptObj}
          setAttemptDetailSource={setAttemptDetailSource}
          attemptQuestionsLoading={attemptQuestionsLoading}
          attemptQuestionsError={attemptQuestionsError}
          attemptDetailTab={attemptDetailTab}
          setAttemptDetailTab={setAttemptDetailTab}
          selectedAttemptIsPass={selectedAttemptIsPass}
          selectedAttemptIsModel={selectedAttemptIsModel}
          selectedAttemptNestedSectionSummary={selectedAttemptNestedSectionSummary}
          selectedAttemptPassRate={selectedAttemptPassRate}
          selectedAttemptSectionSummary={selectedAttemptSectionSummary}
          selectedAttemptQuestionSectionsFiltered={selectedAttemptQuestionSectionsFiltered}
          attemptDetailSectionRefs={attemptDetailSectionRefs}
          attemptDetailWrongOnly={attemptDetailWrongOnly}
          setAttemptDetailWrongOnly={setAttemptDetailWrongOnly}
          exportSelectedAttemptCsv={exportSelectedAttemptCsv}
          deleteAttempt={deleteAttemptRecord}
          previewOpen={false}
        />
      ) : null}
    </div>
  );
}
