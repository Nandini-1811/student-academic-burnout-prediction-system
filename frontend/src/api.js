import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

export const submitPrediction = (studentData) =>
  api.post("/predict", studentData).then((res) => res.data);

export const getTrends = (studentId) =>
  api.get(`/trends/${studentId}`).then((res) => res.data);

export const getAllStudents = () =>
  api.get("/mentor/students").then((res) => res.data);

export default api;