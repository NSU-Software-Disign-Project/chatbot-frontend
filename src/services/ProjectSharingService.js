class ProjectSharingService {
  constructor() {
    this.baseUrl = process.env.REACT_APP_BACKEND_URL || "http://localhost:8080";
    this.token = localStorage.getItem("token");
  }

  // Update token when user logs in/out
  updateToken(token) {
    this.token = token;
  }

  // Get headers for authenticated requests
  getHeaders() {
    const headers = {
      "Content-Type": "application/json",
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    return headers;
  }

  // Share project with another user
  async shareProject(projectId, targetUserEmail, permission = "view") {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/project/${projectId}/share`,
        {
          method: "POST",
          headers: this.getHeaders(),
          body: JSON.stringify({
            targetUserEmail,
            permission,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to share project");
      }

      return await response.json();
    } catch (error) {
      console.error("Error sharing project:", error);
      throw error;
    }
  }

  // Get user's accessible projects (owned + shared)
  async getAccessibleProjects() {
    try {
      const response = await fetch(`${this.baseUrl}/api/accessible-projects`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to get accessible projects");
      }

      return await response.json();
    } catch (error) {
      console.error("Error getting accessible projects:", error);
      throw error;
    }
  }

  // Get project by shareable ID
  async getProjectByShareableId(projectId) {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/project/${projectId}/shareable`,
        {
          method: "GET",
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to get project");
      }

      return await response.json();
    } catch (error) {
      console.error("Error getting project by shareable ID:", error);
      throw error;
    }
  }

  // Check project access permissions
  async checkProjectAccess(projectId, permission = "view") {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/project/${projectId}/access?permission=${permission}`,
        {
          method: "GET",
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to check access");
      }

      return await response.json();
    } catch (error) {
      console.error("Error checking project access:", error);
      throw error;
    }
  }

  // Generate shareable link for a project
  generateShareableLink(projectId) {
    const baseUrl = window.location.origin;
    return `${baseUrl}/shared-project/${projectId}`;
  }

  // Copy shareable link to clipboard
  async copyShareableLink(projectId) {
    const link = this.generateShareableLink(projectId);

    try {
      await navigator.clipboard.writeText(link);
      return { success: true, link };
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = link;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      return { success: true, link };
    }
  }

  // Get project permissions for current user
  async getProjectPermissions(projectId) {
    try {
      const accessResponse = await this.checkProjectAccess(projectId);
      return accessResponse.data;
    } catch (error) {
      console.error("Error getting project permissions:", error);
      return { hasAccess: false, permission: null };
    }
  }

  // Check if user can edit project
  async canEditProject(projectId) {
    try {
      const accessResponse = await this.checkProjectAccess(projectId, "edit");
      return accessResponse.data.hasAccess;
    } catch (error) {
      console.error("Error checking edit permissions:", error);
      return false;
    }
  }

  // Check if user can share project
  async canShareProject(projectId) {
    try {
      const accessResponse = await this.checkProjectAccess(projectId, "admin");
      return accessResponse.data.hasAccess;
    } catch (error) {
      console.error("Error checking share permissions:", error);
      return false;
    }
  }

  // Get projects owned by current user
  async getOwnedProjects() {
    try {
      const response = await fetch(`${this.baseUrl}/auth/my-projects`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to get owned projects");
      }

      return await response.json();
    } catch (error) {
      console.error("Error getting owned projects:", error);
      throw error;
    }
  }

  // Get projects shared with current user
  async getSharedProjects() {
    try {
      const accessibleResponse = await this.getAccessibleProjects();
      return accessibleResponse.data.shared || [];
    } catch (error) {
      console.error("Error getting shared projects:", error);
      throw error;
    }
  }
}

// Create singleton instance
const projectSharingService = new ProjectSharingService();
export default projectSharingService;
