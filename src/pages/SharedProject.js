import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import projectSharingService from "../services/ProjectSharingService";
import "./SharedProject.css";

const SharedProject = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [access, setAccess] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadProject = async () => {
      try {
        setLoading(true);

        // Check if user is logged in
        const token = localStorage.getItem("token");
        if (token) {
          projectSharingService.updateToken(token);

          // Get user info
          try {
            const userResponse = await fetch("http://localhost:8080/auth/me", {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (userResponse.ok) {
              const userData = await userResponse.json();
              setUser(userData.user);
            }
          } catch (err) {
            console.log("User not logged in or token expired");
          }
        }

        // Get project data
        const projectResponse =
          await projectSharingService.getProjectByShareableId(projectId);
        setProject(projectResponse.data);
        setAccess(projectResponse.access);

        setLoading(false);
      } catch (err) {
        console.error("Error loading shared project:", err);
        setError(err.message || "Failed to load project");
        setLoading(false);
      }
    };

    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  const handleOpenProject = () => {
    navigate("/Diagram", {
      state: {
        projectId: project.projectId,
        projectName: project.name,
        isShared: true,
        permission: access?.permission,
      },
    });
  };

  const handleLogin = () => {
    navigate("/auth", {
      state: {
        redirectTo: `/shared-project/${projectId}`,
        message: "Please log in to access this shared project",
      },
    });
  };

  const handleRegister = () => {
    navigate("/auth", {
      state: {
        redirectTo: `/shared-project/${projectId}`,
        message: "Please register to access this shared project",
      },
    });
  };

  const handleNavigateToDashboard = () => {
    // Check if user is authenticated
    const token = localStorage.getItem("token");
    if (token) {
      // If authenticated, go to projects page
      navigate("/me");
    } else {
      // If not authenticated, go to homepage
      navigate("/");
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
      <div className="shared-project-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading shared project...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="shared-project-container">
        <div className="error-container">
          <div className="error-icon">!</div>
          <h2>Доступ запрещен</h2>
          <p>{error}</p>
          <div className="error-actions">
            <button
              onClick={handleNavigateToDashboard}
              className="btn-secondary"
            >
              На главную
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="shared-project-container">
        <div className="error-container">
          <div className="error-icon">?</div>
          <h2>Проект не найден</h2>
          <p>Проект, который вы ищете, не существует или был удален.</p>
          <div className="error-actions">
            <button
              onClick={handleNavigateToDashboard}
              className="btn-secondary"
            >
              На главную
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="shared-project-container">
      <div className="shared-project-content">
        <div className="project-header">
          <div className="project-info">
            <h1>{project.name}</h1>
            <p className="project-owner">
              Shared by {project.user?.name || project.user?.email}
            </p>
            <p className="project-date">
              Last updated: {new Date(project.updatedAt).toLocaleDateString()}
            </p>
          </div>

          {access && (
            <div className="access-info">
              <span
                className="permission-badge"
                style={{
                  backgroundColor: getPermissionColor(access.permission),
                }}
              >
                {getPermissionLabel(access.permission)}
              </span>
            </div>
          )}
        </div>

        <div className="project-description">
          <p>
            This is a shared chatbot project. You can view and interact with the
            diagram based on your permission level.
          </p>
        </div>

        {!user ? (
          <div className="auth-required">
            <div className="auth-message">
              <h3>Sign in to access this project</h3>
              <p>
                You need to be signed in to view and edit this shared project.
              </p>
            </div>
            <div className="auth-actions">
              <button onClick={handleLogin} className="btn-primary">
                Sign In
              </button>
              <button onClick={handleRegister} className="btn-secondary">
                Create Account
              </button>
            </div>
          </div>
        ) : (
          <div className="project-actions">
            <button onClick={handleOpenProject} className="btn-primary">
              {access?.permission === "view" ? "View Project" : "Open Project"}
            </button>
            <button
              onClick={handleNavigateToDashboard}
              className="btn-secondary"
            >
              Go to Dashboard
            </button>
          </div>
        )}

        {access?.permission === "view" && (
          <div className="permission-notice">
            <p>
              <strong>Note:</strong> You have view-only access to this project.
              You can see the diagram but cannot make changes.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SharedProject;
