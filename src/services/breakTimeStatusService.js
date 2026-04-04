const FIXED_NEXT_BREAK_ACTION = "out";

export function normalizeBreakAction(actionType) {
  return String(actionType).trim().toLowerCase() === "out" ? "out" : "in";
}

export function getBreakActionLabel(actionType) {
  return normalizeBreakAction(actionType).toUpperCase();
}

export async function getNextBreakAction() {
  const actionType = normalizeBreakAction(FIXED_NEXT_BREAK_ACTION);

  return {
    success: true,
    actionType,
    label: getBreakActionLabel(actionType),
  };
}
