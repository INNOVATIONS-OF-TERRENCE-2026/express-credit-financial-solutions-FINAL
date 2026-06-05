import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useRoles } from "@/hooks/useRoles";
import { useMembership } from "@/hooks/useMembership";

/**
 * Floating auth/session debug panel.
 *
 * Visibility rules (any one enables it):
 *   - URL contains `?debug=auth`
 *   - localStorage key `ec_debug_auth` === "1"
 *   - import.meta.env.DEV is true AND localStorage key `ec_debug_auth` !== "0"
 *
 * Exposes a stable `[data-testid="auth-debug"]` node with a JSON snapshot
 * of session/user/loading/authReady/role/membership readiness so Playwright
 * (and humans) can verify route guards wait for auth/roles before rendering.
 */
export function AuthDebugPanel() {
  const location = useLocation();
  const { user, session, loading: authLoading, isAdmin: isAdminFlag } = useAuth();
  const { userRole, loading: rolesLoading, isAdmin } = useRoles();
  const {
    planType,
    paymentStatus,
    membershipType,
    loading: membershipLoading,
  } = useMembership();

  const [visible, setVisible] = useState(false);
  const [collapsed, setCollapsed] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlFlag = params.get("debug") === "auth";
    const stored = window.localStorage.getItem("ec_debug_auth");
    const devDefault = !!import.meta.env.DEV && stored !== "0";
    setVisible(urlFlag || stored === "1" || devDefault);
    if (urlFlag) window.localStorage.setItem("ec_debug_auth", "1");
  }, [location.search]);

  if (!visible) return null;

  const authReady = !authLoading;
  const rolesReady = !rolesLoading;
  const membershipReady = !membershipLoading;
  const guardsReady = authReady && rolesReady;

  const snapshot = {
    path: location.pathname,
    authReady,
    rolesReady,
    membershipReady,
    guardsReady,
    hasSession: !!session,
    hasUser: !!user,
    userId: user?.id ?? null,
    email: user?.email ?? null,
    role: userRole,
    isAdmin: isAdmin(),
    isAdminFlag,
    planType,
    paymentStatus,
    membershipType,
    expiresAt: session?.expires_at
      ? new Date(session.expires_at * 1000).toISOString()
      : null,
  };

  return (
    <div
      data-testid="auth-debug"
      data-auth-ready={String(authReady)}
      data-roles-ready={String(rolesReady)}
      data-membership-ready={String(membershipReady)}
      data-guards-ready={String(guardsReady)}
      data-has-session={String(!!session)}
      data-has-user={String(!!user)}
      data-role={userRole ?? ""}
      data-is-admin={String(isAdmin())}
      data-path={location.pathname}
      style={{
        position: "fixed",
        bottom: 8,
        right: 8,
        zIndex: 2147483647,
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        fontSize: 11,
        background: "rgba(10,10,15,0.92)",
        color: "#e2e8f0",
        border: "1px solid #334155",
        borderRadius: 8,
        padding: collapsed ? "4px 8px" : "8px 10px",
        maxWidth: 360,
        boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
        pointerEvents: "auto",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          cursor: "pointer",
          userSelect: "none",
        }}
        onClick={() => setCollapsed((c) => !c)}
      >
        <span
          style={{
            display: "inline-block",
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: guardsReady
              ? user
                ? "#22c55e"
                : "#eab308"
              : "#ef4444",
          }}
        />
        <strong>auth-debug</strong>
        <span style={{ opacity: 0.7 }}>
          {user ? (isAdmin() ? "admin" : userRole ?? "user") : "anon"}
          {guardsReady ? "" : " · loading"}
        </span>
        <span style={{ marginLeft: "auto", opacity: 0.6 }}>
          {collapsed ? "▸" : "▾"}
        </span>
      </div>
      {!collapsed && (
        <pre
          data-testid="auth-debug-json"
          style={{
            margin: "6px 0 0",
            whiteSpace: "pre-wrap",
            wordBreak: "break-all",
            maxHeight: 280,
            overflow: "auto",
          }}
        >
          {JSON.stringify(snapshot, null, 2)}
        </pre>
      )}
      {!collapsed && (
        <div style={{ marginTop: 6, display: "flex", gap: 6 }}>
          <button
            type="button"
            onClick={() => {
              window.localStorage.setItem("ec_debug_auth", "0");
              setVisible(false);
            }}
            style={{
              fontSize: 10,
              background: "#1e293b",
              color: "#e2e8f0",
              border: "1px solid #334155",
              borderRadius: 4,
              padding: "2px 6px",
              cursor: "pointer",
            }}
          >
            hide
          </button>
        </div>
      )}
    </div>
  );
}

export default AuthDebugPanel;