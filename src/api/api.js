import axios from "axios";

const api = axios.create({
  baseURL: "https://api.elimishatrust.or.ke/",
});

// Auto attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const studentAPI = {
  updateDetails: (payload) => api.patch("/admin/students/update-details", payload),
  checkSubmissionStatus: () => api.get("/admin/student/submission-status"),
  uploadFile: (formData) => api.post("/uploads/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  }),
  submitApplication: (payload) => api.post("/submit", payload),
};

export const adminAPI = {
  getAllStudents: () => api.get("/admin/students"),
  getStudentDetails: (id) => api.get(`/admin/students/${id}`),
  updateStatus: (id, status) => api.patch(`/staff/submission/${id}`, { status }),
};

export default api;