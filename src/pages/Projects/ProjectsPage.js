import React, { useEffect, useState } from "react";
import "./style.css";
import { useNavigate } from "react-router-dom";
import projectSharingService from "../../services/ProjectSharingService";

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
  const [deletingProject, setDeletingProject] = useState(null);

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
    if (project.shareToken) {
      // Only collaborative projects can be opened in collaborative editor
      navigate(`/collaborative/${project.shareToken}`, {
        state: {
          projectId: project.projectId || project.id,
          projectName: project.name,
          isShared: project.permission !== undefined,
          shareToken: project.shareToken,
        },
      });
    } else {
      alert(
        "This is not a collaborative project. Please use the regular editor."
      );
      // Optionally: navigate(`/project/${project.projectId || project.id}`);
    }
  };

  const handleDeleteProject = async (e, project) => {
    e.stopPropagation();

    if (
      !window.confirm(
        `Вы уверены, что хотите удалить проект "${project.name}"? Это действие нельзя отменить.`
      )
    ) {
      return;
    }

    const projectIdToDelete = project.projectId || project.id;
    setDeletingProject(projectIdToDelete);

    try {
      await projectSharingService.deleteProject(projectIdToDelete);

      // Remove project from the list
      setOwnedProjects((prev) =>
        prev.filter((p) => (p.projectId || p.id) !== projectIdToDelete)
      );

      alert("Проект успешно удален!");
    } catch (err) {
      console.error("Ошибка удаления проекта:", err);
      alert(`Ошибка удаления проекта: ${err.message}`);
    } finally {
      setDeletingProject(null);
    }
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
      const shareToken = data.data.shareToken;
      const shareUrl = `${window.location.origin}/collaborative/${shareToken}`;
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
        <h2>Привет, {user.name || "Пользователь"}</h2>
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
                    className="delete-button"
                    onClick={(e) => handleDeleteProject(e, project)}
                    title="Delete project"
                    disabled={
                      deletingProject === (project.projectId || project.id)
                    }
                  >
                    {deletingProject === (project.projectId || project.id) ? (
                      <span>Удаление...</span>
                    ) : (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                      </svg>
                    )}
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
    </div>
  );
};

export default ProjectsPage;
