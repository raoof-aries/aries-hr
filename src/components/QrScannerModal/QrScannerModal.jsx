import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import jsQR from "jsqr";
import "./QrScannerModal.css";

const CAMERA_DEVICE_STORAGE_KEY = "aries-hr.camera-device-id";

async function listVideoInputs() {
  if (!navigator.mediaDevices?.enumerateDevices) {
    return [];
  }

  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter((device) => device.kind === "videoinput");
  } catch {
    return [];
  }
}

function getStoredPreferredCameraId() {
  try {
    return window.localStorage.getItem(CAMERA_DEVICE_STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

function storePreferredCameraId(deviceId) {
  if (!deviceId) {
    return;
  }

  try {
    window.localStorage.setItem(CAMERA_DEVICE_STORAGE_KEY, deviceId);
  } catch {
    // Ignore storage failures; camera access should still work.
  }
}

function buildConstraintsList(preferredDeviceId) {
  const constraintsList = [];

  if (preferredDeviceId) {
    constraintsList.push({
      audio: false,
      video: {
        deviceId: {
          exact: preferredDeviceId,
        },
      },
    });
  }

  constraintsList.push(
    {
      audio: false,
      video: {
        facingMode: {
          ideal: "environment",
        },
      },
    },
    {
      audio: false,
      video: {
        facingMode: "environment",
      },
    },
    {
      audio: false,
      video: true,
    },
  );

  return constraintsList;
}

async function requestCameraStream(preferredDeviceId = "") {
  const constraintsList = buildConstraintsList(preferredDeviceId);

  let lastError = null;

  for (const constraints of constraintsList) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      return stream;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("Unable to access a camera stream.");
}

function getPrimaryVideoTrack(stream) {
  return stream?.getVideoTracks?.()[0] || null;
}

function wait(duration) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, duration);
  });
}

export default function QrScannerModal({
  isOpen,
  errorMessage,
  onClose,
  onDetected,
}) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const animationFrameRef = useRef(0);
  const canvasRef = useRef(null);
  const isHandlingDetectionRef = useRef(false);
  const permissionStateRef = useRef("prompt");
  const [scannerPhase, setScannerPhase] = useState("idle");
  const [permissionState, setPermissionState] = useState("prompt");
  const [cameraError, setCameraError] = useState("");
  const [isStartingCamera, setIsStartingCamera] = useState(false);

  const stopScanner = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = 0;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    const video = videoRef.current;
    if (video) {
      video.pause();
      video.srcObject = null;
    }
  };

  useEffect(() => stopScanner, []);

  useEffect(() => {
    permissionStateRef.current = permissionState;
  }, [permissionState]);

  const handleClose = () => {
    stopScanner();
    onClose();
  };

  const handleRetryCamera = () => {
    void startCamera();
  };

  const scanFrame = async () => {
    const video = videoRef.current;
    if (!video || isHandlingDetectionRef.current) {
      animationFrameRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      const canvas = canvasRef.current || document.createElement("canvas");
      canvasRef.current = canvas;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const context = canvas.getContext("2d", {
        willReadFrequently: true,
      });

      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const image = context.getImageData(0, 0, canvas.width, canvas.height);
        const decodedValue = jsQR(image.data, image.width, image.height, {
          inversionAttempts: "dontInvert",
        });

        if (decodedValue?.data) {
          isHandlingDetectionRef.current = true;
          const isAccepted = await onDetected(decodedValue.data);
          if (!isAccepted) {
            isHandlingDetectionRef.current = false;
          } else {
            return;
          }
        }
      }
    }

    animationFrameRef.current = requestAnimationFrame(scanFrame);
  };

  const startCamera = useCallback(async (attempt = 0) => {
    if (!window.isSecureContext) {
      setPermissionState("unsupported");
      setCameraError(
        "Camera permission popup only works on HTTPS or localhost. Open this app in a secure URL to use scanning.",
      );
      setScannerPhase("error");
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera access is not available on this device.");
      setScannerPhase("error");
      return;
    }

    if (permissionStateRef.current === "denied") {
      setCameraError(
        "Camera permission is blocked for this site. Please enable camera access in the browser site settings, then try again.",
      );
      setScannerPhase("error");
      return;
    }

    const preferredDeviceId = getStoredPreferredCameraId();

    try {
      setIsStartingCamera(true);
      setCameraError("");
      setScannerPhase("requesting");
      isHandlingDetectionRef.current = false;
      const hadActiveStream = Boolean(streamRef.current || videoRef.current?.srcObject);
      stopScanner();

      if (hadActiveStream) {
        await wait(250);
      }

      const stream = await requestCameraStream(preferredDeviceId);
      const videoTrack = getPrimaryVideoTrack(stream);
      const activeDeviceId = videoTrack?.getSettings?.().deviceId || "";

      if (activeDeviceId) {
        storePreferredCameraId(activeDeviceId);
      }

      streamRef.current = stream;

      const video = videoRef.current;
      if (!video) {
        stream.getTracks().forEach((track) => track.stop());
        setCameraError("Unable to start the camera preview.");
        setScannerPhase("error");
        return;
      }

      video.srcObject = stream;
      await video.play();
      setPermissionState("granted");
      setScannerPhase("scanning");
      animationFrameRef.current = requestAnimationFrame(scanFrame);
    } catch (error) {
      console.error("Unable to start QR scanner:", error);
      const failureName = error?.name || "";
      let nextErrorMessage = "Unable to request camera access right now. Please try again.";

      if (
        (failureName === "NotReadableError" ||
          failureName === "AbortError" ||
          failureName === "TrackStartError") &&
        attempt < 2
      ) {
        await wait(350 * (attempt + 1));
        return startCamera(attempt + 1);
      }

      if (failureName === "NotAllowedError" || failureName === "PermissionDeniedError") {
        setPermissionState("denied");
        nextErrorMessage =
          "Camera permission was denied. If you tapped Block earlier, enable camera access in the browser site settings to see the popup again.";
      } else if (
        failureName === "SecurityError" ||
        failureName === "NotSupportedError"
      ) {
        setPermissionState("unsupported");
        nextErrorMessage =
          "This browser could not request camera access here. Use HTTPS or localhost so the native permission popup can appear.";
      } else if (failureName === "NotFoundError" || failureName === "DevicesNotFoundError") {
        nextErrorMessage =
          "No usable camera was found on this device. If you are on desktop, connect a webcam. If you are on mobile, try the browser instead of an in-app webview.";
      } else if (
        failureName === "OverconstrainedError" ||
        failureName === "ConstraintNotSatisfiedError"
      ) {
        nextErrorMessage = preferredDeviceId
          ? "The last-used camera is no longer available. Try opening the camera again so the browser can switch to another camera."
          : "A preferred camera was not available, and no fallback camera could be opened.";
      } else if (failureName === "NotReadableError" || failureName === "AbortError") {
        const videoInputs = await listVideoInputs();
        if (videoInputs.length === 0) {
          nextErrorMessage =
            "No camera device was found. Connect a camera or open this page on a phone with a working camera.";
        }
      }

      setCameraError(nextErrorMessage);
      setScannerPhase("error");
      stopScanner();
    } finally {
      setIsStartingCamera(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    let isMounted = true;
    let permissionStatus = null;

    const initializeScanner = async () => {
      setCameraError("");
      setScannerPhase("idle");

      if (!window.isSecureContext) {
        if (!isMounted) {
          return;
        }

        setPermissionState("unsupported");
        setCameraError(
          "Camera permission popup only works on HTTPS or localhost. Open this app in a secure URL to use scanning.",
        );
        setScannerPhase("error");
        return;
      }

      if (!navigator.permissions?.query) {
        if (!isMounted) {
          return;
        }

        setPermissionState("prompt");
        setScannerPhase("ready");
        return;
      }

      try {
        permissionStatus = await navigator.permissions.query({
          name: "camera",
        });

        if (!isMounted) {
          return;
        }

        setPermissionState(permissionStatus.state);

        permissionStatus.onchange = () => {
          setPermissionState(permissionStatus.state);
          if (permissionStatus.state !== "denied") {
            setCameraError("");
          }
        };

        if (permissionStatus.state === "denied") {
          setCameraError(
            "Camera permission is blocked for this site. Please enable camera access in the browser site settings, then try again.",
          );
          setScannerPhase("error");
          return;
        }

        if (permissionStatus.state === "granted") {
          await startCamera();
          return;
        }

        setScannerPhase("ready");
      } catch {
        if (!isMounted) {
          return;
        }

        setPermissionState("prompt");
        setScannerPhase("ready");
      }
    };

    initializeScanner();

    return () => {
      isMounted = false;
      if (permissionStatus) {
        permissionStatus.onchange = null;
      }
    };
  }, [isOpen, startCamera]);

  if (!isOpen) {
    return null;
  }

  const modalContent = (
    <div className="breakTimeModalOverlay" onClick={handleClose}>
      <div
        className="qrScannerModalCard"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="breakTimeModalHeader">
          <div>
            <h2 className="breakTimeModalTitle">Scan QR Code</h2>
            <p className="breakTimeModalSubtitle">
              Align the code inside the frame to continue.
            </p>
          </div>
          <button
            type="button"
            className="breakTimeModalClose"
            onClick={handleClose}
            aria-label="Close QR scanner"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="qrScannerModalBody">
          <div className="qrScannerViewport">
            <video
              ref={videoRef}
              className="qrScannerVideo"
              autoPlay
              muted
              playsInline
            />
            <div className="qrScannerFrame" aria-hidden="true">
              <span className="qrScannerFrameCorner qrScannerFrameCornerTopLeft"></span>
              <span className="qrScannerFrameCorner qrScannerFrameCornerTopRight"></span>
              <span className="qrScannerFrameCorner qrScannerFrameCornerBottomLeft"></span>
              <span className="qrScannerFrameCorner qrScannerFrameCornerBottomRight"></span>
            </div>
            {scannerPhase !== "scanning" && (
              <div className="qrScannerPermissionPanel">
                <div className="qrScannerPermissionIcon" aria-hidden="true">
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M23 7l-7 5 7 5V7z"></path>
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                  </svg>
                </div>
                <h3 className="qrScannerPermissionTitle">Allow Camera Access</h3>
                <p className="qrScannerPermissionText">
                  {scannerPhase === "requesting"
                    ? "Opening camera access. If your browser shows a native permission popup, choose Allow to continue."
                    : permissionState === "denied"
                      ? "Camera was already blocked for this site. Enable it in the browser site settings, then come back here."
                      : scannerPhase === "ready"
                        ? "Tap the button below to open the browser's camera permission prompt. This is more reliable than requesting camera access automatically on page load."
                      : "Trying to open the camera directly. If it does not start, use the button below."}
                </p>
                <button
                  type="button"
                  className="breakTimeModalPrimaryButton qrScannerPermissionButton"
                  onClick={handleRetryCamera}
                  disabled={isStartingCamera}
                >
                  {isStartingCamera
                    ? "Opening Camera..."
                    : scannerPhase === "ready"
                      ? "Open Camera"
                      : "Retry Camera Access"}
                </button>
              </div>
            )}
          </div>

          <div className="qrScannerDetails">
            <p className="qrScannerHint">
              {scannerPhase === "scanning"
                ? "Hold your phone steady and keep the full QR visible."
                : scannerPhase === "requesting"
                  ? "Waiting for the browser's native camera permission popup."
                  : scannerPhase === "ready"
                    ? "Open the camera from this dialog so the permission request happens from a direct user action."
                  : "The popup appears only when the browser is allowed to ask for camera access on this site."}
            </p>
            {(cameraError || errorMessage) && (
              <div className="breakTimeModalMessage breakTimeModalMessageError">
                {cameraError || errorMessage}
              </div>
            )}
            {scannerPhase !== "scanning" && (
              <button
                type="button"
                className="breakTimeModalSecondaryButton"
                onClick={handleRetryCamera}
                disabled={isStartingCamera}
              >
                {scannerPhase === "ready"
                  ? "Open Camera"
                  : "Retry Camera Access"}
              </button>
            )}
            <button
              type="button"
              className="breakTimeModalSecondaryButton"
              onClick={handleClose}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
