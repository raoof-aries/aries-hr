# Tracking PWA vs Browser Usage

## Overview
You can easily detect whether a user is opening your app through a regular browser (Chrome, Safari, Edge) or as an installed Progressive Web App (PWA) from their home screen.

---

## 1. Detection Logic (JavaScript)

```javascript
export const isPwaMode = () => {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
};
```

* **`true`**: User is using the installed PWA (standalone app without browser address bar).
* **`false`**: User is using a normal browser tab.

---

## 2. Implementation Steps

### Step 1: Update Frontend (`src/context/AuthContext.jsx`)
In the `login` function, detect the mode and append it to the login request:

```javascript
// Detect platform
const isPWA =
  window.matchMedia("(display-mode: standalone)").matches ||
  window.navigator.standalone === true;

const form = new URLSearchParams();
form.set("username", username);
form.set("password", password);
form.set("platform", isPWA ? "PWA" : "Browser"); // <-- Send platform tag
```

---

### Step 2: Update Backend (Login API)
1. Receive the `platform` parameter from the request (`$_POST['platform']` or `req.body.platform`).
2. Save it in the database table (e.g., `users` or `login_logs` table) under a column like `last_login_platform`.
