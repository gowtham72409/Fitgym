export function getResolvedUserName(profile) {
  // Check if a valid name is stored in localStorage first or in profile object
  const candidates = [
    localStorage.getItem("fitquest_user_name"),
    profile?.name,
    profile?.profile?.name,
    profile?.user?.name,
    profile?.displayName,
    profile?.fullName,
  ];

  for (const c of candidates) {
    if (typeof c === "string") {
      const trimmed = c.trim();
      if (
        trimmed &&
        trimmed.toLowerCase() !== "athlete" &&
        !trimmed.toLowerCase().includes("athlete") &&
        trimmed.toLowerCase() !== "fitness enthusiast"
      ) {
        return trimmed;
      }
    }
  }

  return "Gowtham";
}

export function getUserInitial(profile) {
  const name = getResolvedUserName(profile);
  return (name.trim().charAt(0) || "G").toUpperCase();
}
