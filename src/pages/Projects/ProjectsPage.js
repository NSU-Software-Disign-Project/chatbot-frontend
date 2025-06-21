import React, { useEffect, useState } from "react";
import "./style.css";
import { useNavigate } from "react-router-dom";
import projectSharingService from "../../services/ProjectSharingService";
import ProjectSharingUI from "../../components/ProjectSharingUI";

const ProjectsPage = () => {
  const navigate = useNavigate();

  // Состояния
  const [user, setUser] = useState(null);
  const [ownedProjects, setOwnedProjects] = useState([]);
  const [sharedProjects, setSharedProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [creatingProject, setCreatingProject] = useState(false);
  const [showSharingModal, setShowSharingModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  // Загрузка данных
  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/auth"); // Перенаправляем на авторизацию, если токена нет
        return;
      }

      try {
        // Update token in sharing service
        projectSharingService.updateToken(token);

        // Получаем информацию о пользователе
        const userResponse = await fetch("http://localhost:8080/auth/me", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!userResponse.ok)
          throw new Error("Ошибка получения данных пользователя");

        const userData = await userResponse.json();
        console.log(userData);
        setUser(userData.user);

        // Получаем доступные проекты (owned + shared)
        const accessibleProjects =
          await projectSharingService.getAccessibleProjects();
        console.log("Accessible projects:", accessibleProjects);

        setOwnedProjects(accessibleProjects.data.owned || []);
        setSharedProjects(accessibleProjects.data.shared || []);

        setLoading(false);
      } catch (err) {
        console.error(err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleProjectClick = (project) => {
    // Use the collaborative route with shareToken if available, otherwise use projectId
    const shareToken = project.shareToken || project.projectId;
    navigate(`/collaborative/${shareToken}`, {
      state: {
        projectId: project.projectId,
        projectName: project.name,
        isShared: project.permission !== undefined,
        shareToken: shareToken,
      },
    });
  };

  const handleShareProject = (e, project) => {
    e.stopPropagation();
    setSelectedProject(project);
    setShowSharingModal(true);
  };

  const handleCloseSharing = () => {
    setShowSharingModal(false);
    setSelectedProject(null);
  };

  const handleCreateProject = () => {
    setShowCreateModal(true);
  };

  const handleSubmitCreateProject = async (e) => {
    e.preventDefault();

    if (!newProjectName || newProjectName.trim() === "") {
      return;
    }

    setCreatingProject(true);
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/auth");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:8080/api/collaborative/project`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: newProjectName.trim(),
            nodeDataArray: [],
            linkDataArray: [],
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Ошибка создания проекта");
      }

      const data = await response.json();
      console.log("Collaborative проект создан:", data);

      // Show the share link to the user
      const shareUrl = data.data.shareUrl;
      alert(
        `Проект успешно создан!\n\nShare link: ${shareUrl}\n\nAnyone with this link can edit the project.`
      );

      // Обновляем список проектов
      const accessibleProjects =
        await projectSharingService.getAccessibleProjects();
      setOwnedProjects(accessibleProjects.data.owned || []);
      setSharedProjects(accessibleProjects.data.shared || []);

      setShowCreateModal(false);
      setNewProjectName("");
    } catch (err) {
      console.error("Ошибка создания проекта:", err);
      alert(`Ошибка создания проекта: ${err.message}`);
    } finally {
      setCreatingProject(false);
    }
  };

  const handleCancelCreate = () => {
    setShowCreateModal(false);
    setNewProjectName("");
    setCreatingProject(false);
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
    return <div className="loading">Загрузка...</div>;
  }

  if (error) {
    return <div className="error">Ошибка: {error}</div>;
  }

  return (
    <div className="projects-container">
      <div className="user-info">
        <h2>Привет, {user.name || "Пользователь"} 👋</h2>
        <p className="email">{user.email}</p>
      </div>

      <div className="projects-header">
        <h1>Мои проекты</h1>
        <div className="project-actions">
          <button
            className="create-project-button"
            onClick={handleCreateProject}
          >
            Создать проект
          </button>
        </div>
      </div>

      {/* Owned Projects */}
      {ownedProjects.length > 0 && (
        <div className="projects-section">
          <h4 className="section-title">Мои проекты</h4>
          <div className="projects-list">
            {ownedProjects.map((project) => (
              <div
                key={project.id}
                className="project-card"
                onClick={() => handleProjectClick(project)}
              >
                <div className="project-info">
                  <h4>{project.name}</h4>
                  <p className="last-edited">
                    Последнее изменение:{" "}
                    {new Date(project.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="project-actions">
                  <button
                    className="share-button"
                    onClick={(e) => handleShareProject(e, project)}
                    title="Share project"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shared Projects */}
      {sharedProjects.length > 0 && (
        <div className="projects-section">
          <h4 className="section-title">Поделенные со мной</h4>
          <div className="projects-list">
            {sharedProjects.map((project) => (
              <div
                key={project.id}
                className="project-card shared"
                onClick={() => handleProjectClick(project)}
              >
                <div className="project-info">
                  <h4>{project.name}</h4>
                  <p className="owner-info">
                    Владелец: {project.user?.name || project.user?.email}
                  </p>
                  <p className="last-edited">
                    Последнее изменение:{" "}
                    {new Date(project.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="project-actions">
                  <span
                    className="permission-badge"
                    style={{
                      backgroundColor: getPermissionColor(project.permission),
                    }}
                  >
                    {getPermissionLabel(project.permission)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {ownedProjects.length === 0 && sharedProjects.length === 0 && (
        <p className="no-projects">Нет доступных проектов</p>
      )}

      {/* Modal для создания проекта */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Создать новый проект</h3>
            <form onSubmit={handleSubmitCreateProject}>
              <input
                type="text"
                placeholder="Название проекта"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                required
                disabled={creatingProject}
              />
              <div className="modal-buttons">
                <button
                  type="button"
                  onClick={handleCancelCreate}
                  disabled={creatingProject}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={creatingProject || !newProjectName.trim()}
                >
                  {creatingProject ? "Создание..." : "Создать"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sharing Modal */}
      {showSharingModal && selectedProject && (
        <ProjectSharingUI
          projectId={selectedProject.projectId}
          projectName={selectedProject.name}
          onClose={handleCloseSharing}
        />
      )}
    </div>
  );
};

export default ProjectsPage;
