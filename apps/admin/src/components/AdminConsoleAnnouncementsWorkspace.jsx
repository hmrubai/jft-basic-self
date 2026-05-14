"use client";

import { useEffect } from "react";
import { useAdminConsoleWorkspaceContext } from "./AdminConsoleWorkspaceContext";
import { useAnnouncementsWorkspaceState } from "./AdminConsoleAnnouncementsWorkspaceState";
import AdminStatusMessage from "./AdminStatusMessage";
import { formatDateTime } from "../lib/adminFormatters";
import { useLanguage } from "../lib/i18n";

export default function AdminConsoleAnnouncementsWorkspace() {
  const { t } = useLanguage();
  const { supabase, activeSchoolId, session } = useAdminConsoleWorkspaceContext();
  const {
    announcements,
    announcementMsg,
    announcementsLoaded,
    announcementCreateOpen,
    announcementForm,
    setAnnouncementForm,
    editingAnnouncementId,
    editingAnnouncementForm,
    setEditingAnnouncementForm,
    fetchAnnouncements,
    createAnnouncement,
    deleteAnnouncement,
    startEditAnnouncement,
    cancelEditAnnouncement,
    openCreateAnnouncementModal,
    closeCreateAnnouncementModal,
    saveAnnouncementEdits,
  } = useAnnouncementsWorkspaceState({ supabase, activeSchoolId, session });

  useEffect(() => {
    if (!supabase || !activeSchoolId) return;
    if (!announcementsLoaded) {
      fetchAnnouncements();
    }
  }, [supabase, activeSchoolId, announcementsLoaded]);

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div className="admin-title">{t("Announcements")}</div>
          <button className="btn btn-primary admin-compact-action-btn admin-upload-cta-btn" onClick={openCreateAnnouncementModal}>
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path
                d="M4.5 10.5V8.5l8-3v9l-8-3z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12.5 8.5h1.5a2 2 0 0 1 0 4h-1.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M7.5 13.5 8.5 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
            {t("Create Announcement")}
          </button>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            className="btn admin-icon-action-btn"
            aria-label={t("Refresh announcements")}
            title={t("Refresh announcements")}
            onClick={() => fetchAnnouncements()}
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
          </button>
        </div>
      </div>

      <div className="admin-table-wrap" style={{ marginTop: 12 }}>
        <table className="admin-table" style={{ minWidth: 720 }}>
          <thead>
            <tr>
              <th>{t("Created")}</th>
              <th>{t("Title")}</th>
              <th>{t("Message")}</th>
              <th>{t("Publish At")}</th>
              <th>{t("End At")}</th>
              <th>{t("Edit")}</th>
              <th>{t("Delete")}</th>
            </tr>
          </thead>
          <tbody>
            {announcements.map((a) => (
              <tr key={a.id}>
                <td>{formatDateTime(a.created_at)}</td>
                <td>{a.title}</td>
                <td>{a.body}</td>
                <td>{formatDateTime(a.publish_at)}</td>
                <td>{a.end_at ? formatDateTime(a.end_at) : ""}</td>
                <td>
                  <button className="btn" onClick={() => startEditAnnouncement(a)}>
                    {t("Edit")}
                  </button>
                </td>
                <td>
                  <button className="btn btn-danger" onClick={() => deleteAnnouncement(a.id)}>
                    {t("Delete")}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <AdminStatusMessage message={announcementMsg} />

      {announcementCreateOpen ? (
        <div className="admin-modal-overlay" onClick={closeCreateAnnouncementModal}>
          <div className="admin-modal invite-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div className="admin-title">{t("Create Announcement")}</div>
              <button className="admin-modal-close" onClick={closeCreateAnnouncementModal} aria-label={t("Close")}>
                &times;
              </button>
            </div>
            <div className="admin-form" style={{ marginTop: 10 }}>
              <div className="field">
                <label>{t("Title")}</label>
                <input
                  value={announcementForm.title}
                  onChange={(e) => setAnnouncementForm((s) => ({ ...s, title: e.target.value }))}
                  placeholder={t("Announcement title")}
                />
              </div>
              <div className="field" style={{ gridColumn: "1 / -1" }}>
                <label>{t("Message")}</label>
                <textarea
                  value={announcementForm.body}
                  onChange={(e) => setAnnouncementForm((s) => ({ ...s, body: e.target.value }))}
                  placeholder={t("Write your message here...")}
                  rows={6}
                />
              </div>
              <div className="field small">
                <label>{t("Publish At")}</label>
                <input
                  type="datetime-local"
                  step="300"
                  value={announcementForm.publish_at}
                  onChange={(e) => setAnnouncementForm((s) => ({ ...s, publish_at: e.target.value }))}
                />
              </div>
              <div className="field small">
                <label>{t("End At")}</label>
                <input
                  type="datetime-local"
                  step="300"
                  value={announcementForm.end_at}
                  onChange={(e) => setAnnouncementForm((s) => ({ ...s, end_at: e.target.value }))}
                />
              </div>
            </div>
            <div style={{ marginTop: 12, display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
              <button className="btn" onClick={closeCreateAnnouncementModal}>{t("Cancel")}</button>
              <button className="btn btn-primary" onClick={createAnnouncement}>{t("Create Announcement")}</button>
            </div>
          </div>
        </div>
      ) : null}

      {editingAnnouncementId ? (
        <div className="admin-modal-overlay" onClick={cancelEditAnnouncement}>
          <div className="admin-modal invite-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div className="admin-title">{t("Edit Announcement")}</div>
              <button className="admin-modal-close" onClick={cancelEditAnnouncement} aria-label={t("Close")}>
                &times;
              </button>
            </div>
            <div className="admin-form" style={{ marginTop: 10 }}>
              <div className="field">
                <label>{t("Title")}</label>
                <input
                  value={editingAnnouncementForm.title}
                  onChange={(e) => setEditingAnnouncementForm((s) => ({ ...s, title: e.target.value }))}
                  placeholder={t("Announcement title")}
                />
              </div>
              <div className="field" style={{ gridColumn: "1 / -1" }}>
                <label>{t("Message")}</label>
                <textarea
                  value={editingAnnouncementForm.body}
                  onChange={(e) => setEditingAnnouncementForm((s) => ({ ...s, body: e.target.value }))}
                  placeholder={t("Write your message here...")}
                  rows={6}
                />
              </div>
              <div className="field small">
                <label>{t("Publish At")}</label>
                <input
                  type="datetime-local"
                  step="300"
                  value={editingAnnouncementForm.publish_at}
                  onChange={(e) => setEditingAnnouncementForm((s) => ({ ...s, publish_at: e.target.value }))}
                />
              </div>
              <div className="field small">
                <label>{t("End At")}</label>
                <input
                  type="datetime-local"
                  step="300"
                  value={editingAnnouncementForm.end_at}
                  onChange={(e) => setEditingAnnouncementForm((s) => ({ ...s, end_at: e.target.value }))}
                />
              </div>
            </div>
            <div style={{ marginTop: 12, display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
              <button className="btn" onClick={cancelEditAnnouncement}>{t("Cancel")}</button>
              <button className="btn btn-primary" onClick={saveAnnouncementEdits}>{t("Save")}</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
