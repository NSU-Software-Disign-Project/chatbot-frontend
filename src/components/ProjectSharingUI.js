import React, { useState, useEffect, useCallback } from "react";
import projectSharingService from "../services/ProjectSharingService";
import "./ProjectSharingUI.css";

const ProjectSharingUI = ({ projectId, projectName, onClose }) => {
  const [shareEmail, setShareEmail] = useState("");
  const [sharePermission, setSharePermission] = useState("view");
  const [isSharing, setIsSharing] = useState(false);
  const [shareMessage, setShareMessage] = useState("");
  const [shareableLink, setShareableLink] = useState("");
  const [isCopying, setIsCopying] = useState(false);
  const [copyMessage, setCopyMessage] = useState("");
  const [sharedUsers, setSharedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSharedUsers = useCallback(async () => {
    try {
      setLoading(true);
      const project = await projectSharingService.getProjectByShareableId(
        projectId
      );
      setSharedUsers(project.data.shares || []);
    } catch (error) {
      console.error("Error loading shared users:", error);
      setError("Failed to load shared users");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const generateShareableLink = useCallback(() => {
    const link = projectSharingService.generateShareableLink(projectId);
    setShareableLink(link);
  }, [projectId]);

  useEffect(() => {
    if (projectId) {
      loadSharedUsers();
      generateShareableLink();
    }
  }, [projectId, loadSharedUsers, generateShareableLink]);

  const handleShareProject = async (e) => {
    e.preventDefault();

    if (!shareEmail.trim()) {
      setShareMessage("Please enter an email address");
      return;
    }

    try {
      setIsSharing(true);
      setShareMessage("");

      await projectSharingService.shareProject(
        projectId,
        shareEmail,
        sharePermission
      );

      setShareMessage(`Project shared successfully with ${shareEmail}`);
      setShareEmail("");
      setSharePermission("view");

      // Reload shared users
      await loadSharedUsers();
    } catch (error) {
      setShareMessage(error.message || "Failed to share project");
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      setIsCopying(true);
      setCopyMessage("");

      const result = await projectSharingService.copyShareableLink(projectId);

      if (result.success) {
        setCopyMessage("Link copied to clipboard!");
      } else {
        setCopyMessage("Failed to copy link");
      }
    } catch (error) {
      setCopyMessage("Failed to copy link");
    } finally {
      setIsCopying(false);
    }
  };

  const getPermissionLabel = (permission) => {
    switch (permission) {
      case "view":
        return "Can view";
      case "edit":
        return "Can edit";
      case "admin":
        return "Can edit and share";
      default:
        return permission;
    }
  };

  const getPermissionColor = (permission) => {
    switch (permission) {
      case "view":
        return "#6c757d";
      case "edit":
        return "#007bff";
      case "admin":
        return "#28a745";
      default:
        return "#6c757d";
    }
  };

  if (loading) {
    return (
      <div className="project-sharing-modal">
        <div className="project-sharing-content">
          <div className="loading">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="project-sharing-modal">
      <div className="project-sharing-content">
        <div className="project-sharing-header">
          <h2>Share "{projectName}"</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* Shareable Link Section */}
        <div className="sharing-section">
          <h3>Shareable Link</h3>
          <p className="section-description">
            Anyone with this link can view your project
          </p>

          <div className="link-container">
            <input
              type="text"
              value={shareableLink}
              readOnly
              className="shareable-link-input"
            />
            <button
              onClick={handleCopyLink}
              disabled={isCopying}
              className="copy-button"
            >
              {isCopying ? "Copying..." : "Copy"}
            </button>
          </div>

          {copyMessage && (
            <div
              className={`message ${
                copyMessage.includes("Failed") ? "error" : "success"
              }`}
            >
              {copyMessage}
            </div>
          )}
        </div>

        {/* Share with Specific Users Section */}
        <div className="sharing-section">
          <h3>Share with People</h3>
          <p className="section-description">
            Share with specific people and set their permissions
          </p>

          <form onSubmit={handleShareProject} className="share-form">
            <div className="form-row">
              <input
                type="email"
                placeholder="Enter email address"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
                className="email-input"
                required
              />

              <select
                value={sharePermission}
                onChange={(e) => setSharePermission(e.target.value)}
                className="permission-select"
              >
                <option value="view">Can view</option>
                <option value="edit">Can edit</option>
                <option value="admin">Can edit and share</option>
              </select>

              <button
                type="submit"
                disabled={isSharing || !shareEmail.trim()}
                className="share-button"
              >
                {isSharing ? "Sharing..." : "Share"}
              </button>
            </div>
          </form>

          {shareMessage && (
            <div
              className={`message ${
                shareMessage.includes("Failed") ? "error" : "success"
              }`}
            >
              {shareMessage}
            </div>
          )}
        </div>

        {/* Shared Users List */}
        <div className="sharing-section">
          <h3>People with Access</h3>

          {sharedUsers.length === 0 ? (
            <p className="no-users">
              No one has been shared with this project yet.
            </p>
          ) : (
            <div className="shared-users-list">
              {sharedUsers.map((share) => (
                <div key={share.id} className="shared-user-item">
                  <div className="user-info">
                    <div className="user-email">{share.user.email}</div>
                    <div className="user-name">{share.user.name}</div>
                  </div>
                  <div className="user-permission">
                    <span
                      className="permission-badge"
                      style={{
                        backgroundColor: getPermissionColor(share.permission),
                      }}
                    >
                      {getPermissionLabel(share.permission)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Permissions Legend */}
        <div className="permissions-legend">
          <h4>Permission Levels:</h4>
          <div className="legend-items">
            <div className="legend-item">
              <span
                className="legend-badge"
                style={{ backgroundColor: "#6c757d" }}
              >
                Can view
              </span>
              <span>Can view the project but cannot make changes</span>
            </div>
            <div className="legend-item">
              <span
                className="legend-badge"
                style={{ backgroundColor: "#007bff" }}
              >
                Can edit
              </span>
              <span>Can view and edit the project</span>
            </div>
            <div className="legend-item">
              <span
                className="legend-badge"
                style={{ backgroundColor: "#28a745" }}
              >
                Can edit and share
              </span>
              <span>Can view, edit, and share the project with others</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectSharingUI;
