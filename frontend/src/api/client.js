import axios from "axios";

const api = axios.create({ baseURL: "/api" });

export const getWeeks = () => api.get("/weeks").then((r) => r.data);
export const getCurrentWeek = () => api.get("/weeks/current").then((r) => r.data);
export const getWeek = (weekNumber) => api.get(`/weeks/${weekNumber}`).then((r) => r.data);

export const getTodaySessions = (date) => api.get("/sessions/today", { params: date ? { date } : {} }).then((r) => r.data);
export const setSessionCompletion = (sessionId, completed, notes) =>
  api.patch(`/sessions/${sessionId}/complete`, { completed, notes }).then((r) => r.data);

export const getPhases = () => api.get("/phases").then((r) => r.data);
export const getPhaseTemplate = (order) => api.get(`/phases/${order}/template`).then((r) => r.data);

export const getFitnessTests = (type) => api.get("/fitness-tests", { params: type ? { type } : {} }).then((r) => r.data);
export const createFitnessTest = (data) => api.post("/fitness-tests", data).then((r) => r.data);
export const deleteFitnessTest = (id) => api.delete(`/fitness-tests/${id}`);

export const getScheduleProfiles = () => api.get("/schedule-profiles").then((r) => r.data);
export const getActiveScheduleProfile = () => api.get("/schedule-profiles/active").then((r) => r.data);
export const updateScheduleProfile = (id, data) => api.patch(`/schedule-profiles/${id}`, data).then((r) => r.data);

export const getWeather = (location) => api.get(`/weather/${location}`).then((r) => r.data);

export const getGear = () => api.get("/gear").then((r) => r.data);
export const addGear = (data) => api.post("/gear", data).then((r) => r.data);
export const updateGear = (id, data) => api.patch(`/gear/${id}`, data).then((r) => r.data);
export const deleteGear = (id) => api.delete(`/gear/${id}`);

export const getRaceProfile = () => api.get("/race/profile").then((r) => r.data);
export const updateRaceProfile = (data) => api.patch("/race/profile", data).then((r) => r.data);
export const getRaceMorning = () => api.get("/race/morning").then((r) => r.data);
export const updateRaceMorningEvent = (id, data) => api.patch(`/race/morning/${id}`, data).then((r) => r.data);

export const getWhoopStatus = () => api.get("/integrations/whoop/status").then((r) => r.data);
export const syncWhoop = () => api.post("/integrations/whoop/sync").then((r) => r.data);
export const disconnectWhoop = () => api.delete("/integrations/whoop/disconnect");
export const importGarminCsv = (csv) => api.post("/integrations/garmin/import", { csv }).then((r) => r.data);
export const getDailyMetrics = (start, end) =>
  api.get("/integrations/metrics", { params: { start, end } }).then((r) => r.data);

export default api;
