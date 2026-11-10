import { defineRailway, github, project, service } from "railway/iac";
// This repository manages only its own resources in the environment. Other
// repositories export their own partial name.
// See https://docs.railway.com/infrastructure-as-code#multi-repo-projects
export const partial = "ironman-dashboard";
export default defineRailway(() => {
  const ironmanDashboard = service("ironman-dashboard", {
    source: github("dantetoapanta/ironman-dashboard", { branch: "main", checkSuites: false }),
    build: { buildCommand: "npm run build", buildEnvironment: "V3", builder: "NIXPACKS" },
    start: "npm start",
    replicas: { "sfo": 1 },
  });

  return project("nurturing-rejoicing", {
    variables: { managed: false },
    resources: [ironmanDashboard],
  });
});
