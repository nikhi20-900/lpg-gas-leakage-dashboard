import { useEffect, useMemo, useRef, useState } from "react";
import { onValue, ref } from "firebase/database";
import { database } from "../firebase";

const MAX_HISTORY = 30;
const MAX_EVENTS = 10;

function formatTime(date) {
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function normalizeReading(payload) {
  if (!payload || typeof payload !== "object") {
    return {
      ok: false,
      message: "Waiting for real Firebase data at /LPG.",
    };
  }

  const gasValue = Number(payload.GasValue);
  if (!Number.isFinite(gasValue)) {
    return {
      ok: false,
      message: "Firebase /LPG is missing a numeric GasValue field.",
    };
  }

  return {
    ok: true,
    value: Math.max(0, Math.min(Math.round(gasValue), 1023)),
    status: typeof payload.Status === "string" ? payload.Status.trim() : "",
    system: typeof payload.System === "string" ? payload.System.trim() : "",
  };
}

export function useLpgRealtime() {
  const [connected, setConnected] = useState(false);
  const [permissionError, setPermissionError] = useState("");
  const [reading, setReading] = useState(null);
  const [waitingMessage, setWaitingMessage] = useState("Connecting to Firebase...");
  const [history, setHistory] = useState([]);
  const [events, setEvents] = useState([]);
  const lastStatusRef = useRef("");

  useEffect(() => {
    const connectedRef = ref(database, ".info/connected");
    return onValue(connectedRef, (snapshot) => {
      setConnected(snapshot.val() === true);
    });
  }, []);

  useEffect(() => {
    const lpgRef = ref(database, "/LPG");
    return onValue(
      lpgRef,
      (snapshot) => {
        setPermissionError("");
        const normalized = normalizeReading(snapshot.val());
        if (!normalized.ok) {
          setWaitingMessage(`${normalized.message} No local readings are generated.`);
          return;
        }

        const timestamp = new Date();
        const isAlert = normalized.value > 400 || normalized.status.toLowerCase() === "gas leak detected";
        const nextReading = {
          ...normalized,
          isAlert,
          timestamp,
          timeLabel: formatTime(timestamp),
        };

        setReading(nextReading);
        setWaitingMessage("");
        setHistory((current) => [...current, nextReading].slice(-MAX_HISTORY));

        const statusKey = normalized.status || "Status missing";
        if (statusKey !== lastStatusRef.current) {
          setEvents((current) => [
            {
              id: `${timestamp.getTime()}-${statusKey}`,
              status: statusKey,
              system: normalized.system || "System missing",
              value: normalized.value,
              isAlert,
              timeLabel: formatTime(timestamp),
            },
            ...current,
          ].slice(0, MAX_EVENTS));
          lastStatusRef.current = statusKey;
        }
      },
      (error) => {
        setPermissionError(error.message || "Firebase permission denied.");
        setWaitingMessage("Realtime Database rules blocked the /LPG listener.");
      }
    );
  }, []);

  return useMemo(
    () => ({
      connected,
      permissionError,
      reading,
      waitingMessage,
      history,
      events,
    }),
    [connected, permissionError, reading, waitingMessage, history, events]
  );
}
