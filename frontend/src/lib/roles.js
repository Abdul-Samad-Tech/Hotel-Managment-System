export function homeFor(role) {
  if (role === "guest") return "/guest";
  if (role === "admin" || role === "manager") return "/admin";
  return "/staff";
}
