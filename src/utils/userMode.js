export function getIsRegularUser(user) {
  const backendValue = user?.is_regular;

  if (backendValue === 1 || backendValue === "1" || backendValue === true) {
    return true;
  }

  if (backendValue === 0 || backendValue === "0" || backendValue === false) {
    return false;
  }

  // Temporary fallback until the backend starts sending `is_regular`.
  return true;
}
