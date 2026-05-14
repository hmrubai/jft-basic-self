"use client";

import AdminLoadingState from "./AdminLoadingState";
import { useLanguage } from "../lib/i18n";

export default function AdminConsoleShellFrame({
  schoolName = "",
  displayName = "",
  activeTab = "announcements",
  schoolSelector = null,
  changeSchoolHref = "",
  onChangeSchool = null,
  onSelectTab = null,
  children = null,
}) {
  const { lang, setLang, t } = useLanguage();

  const NAV_ITEMS = [
    { key: "announcements", label: t("Announcements") },
    { key: "students", label: t("Student List") },
    { key: "attendance", label: t("Attendance") },
    { key: "model", label: t("Model Test") },
    { key: "daily", label: t("Daily Test") },
    { key: "dailyRecord", label: t("Schedule & Record") },
    { key: "ranking", label: t("Ranking") },
  ];

  function getAdminPageTitle(tab) {
    if (tab === "announcements") return t("Announcements");
    if (tab === "attendance") return t("Attendance");
    if (tab === "model") return t("Model Test");
    if (tab === "daily") return t("Daily Test");
    if (tab === "dailyRecord") return t("Schedule & Record");
    if (tab === "ranking") return t("Ranking");
    return t("Student List");
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-head">
          <div className="admin-brand">
            <div className="admin-brand-text">
              <div className="admin-brand-title">
                <img className="admin-brand-logo" src="/branding/jft-navi-color.png" alt="JFT Navi" />
              </div>
              <div className="admin-brand-sub">{t("Admin Console")}</div>
            </div>
          </div>
        </div>
        <div className="admin-nav" aria-hidden="true">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              className={`admin-nav-item ${activeTab === item.key ? "active" : ""}`}
              type="button"
              disabled={typeof onSelectTab !== "function"}
              onClick={() => onSelectTab?.(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="admin-sidebar-footer">
          <div className="admin-lang-toggle" role="group" aria-label={t("Language")}>
            <button
              className={`admin-lang-toggle-opt ${lang === "en" ? "active" : ""}`}
              onClick={() => setLang("en")}
              type="button"
            >
              EN
            </button>
            <button
              className={`admin-lang-toggle-opt ${lang === "ja" ? "active" : ""}`}
              onClick={() => setLang("ja")}
              type="button"
            >
              日本語
            </button>
          </div>
          <div className="admin-email">{displayName || <AdminLoadingState compact label={t("Loading user...")} />}</div>
        </div>
      </aside>

      <div className="admin-main">
        <div className="admin-wrap">
          <div className="admin-page-topbar">
            <div className="admin-page-topbar-title">{getAdminPageTitle(activeTab)}</div>
            <div className="admin-page-topbar-meta">
              {schoolSelector || (
                <div className="admin-school-switcher admin-topbar-school-switcher">
                  <label>{t("School")}</label>
                  <div className="admin-topbar-school-label">{schoolName || <AdminLoadingState compact label={t("Loading school...")} />}</div>
                </div>
              )}
              {changeSchoolHref ? (
                <button
                  className="btn admin-topbar-link"
                  type="button"
                  onClick={onChangeSchool}
                >
                  {t("Change school")}
                </button>
              ) : null}
              <div className="admin-page-topbar-console">{t("Admin Console")}</div>
              <div className="admin-page-topbar-user">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" fill="currentColor" />
                  <path d="M4 20a8 8 0 0 1 16 0Z" fill="currentColor" />
                </svg>
                <span>{displayName || <AdminLoadingState compact label={t("Loading user...")} />}</span>
              </div>
            </div>
          </div>

          <div className="admin-panel admin-console-panel">{children}</div>
        </div>
      </div>
    </div>
  );
}
