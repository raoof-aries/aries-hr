import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import jsQR from "jsqr";
import "./QrScannerModal.css";

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

async function requestCameraStream() {
  const constraintsList = [
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
  ];

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
      video.srcObject = null;
    }
  };

  useEffect(() => stopScanner, []);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    let isMounted = true;
    let permissionStatus = null;

    const syncPermissionState = async () => {
      if (!window.isSecureContext) {
        if (isMounted) {
          setPermissionState("unsupported");
          setCameraError(
            "Camera permission popup only works on HTTPS or localhost. Open this app in a secure URL to use scanning.",
          );
          setScannerPhase("error");
        }
        return;
      }

      if (!navigator.permissions?.query) {
        if (isMounted) {
          setPermissionState("prompt");
        }
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
        if (permissionStatus.state === "denied") {
          setCameraError(
            "Camera permission is blocked for this site. The browser will not show the popup again until you enable camera access in site settings.",
          );
          setScannerPhase("error");
        }

        permissionStatus.onchange = () => {
          setPermissionState(permissionStatus.state);
          if (permissionStatus.state !== "denied") {
            setCameraError("");
          }
        };
      } catch {
        if (isMounted) {
          setPermissionState("prompt");
        }
      }
    };

    setCameraError("");
    setScannerPhase("idle");
    syncPermissionState();

    return () => {
      isMounted = false;
      if (permissionStatus) {
        permissionStatus.onchange = null;
      }
    };
  }, [isOpen]);

  const handleClose = () => {
    stopScanner();
    onClose();
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

  const handleRequestCameraAccess = async () => {
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

    if (permissionState === "denied") {
      setCameraError(
        "Camera permission is blocked for this site. Please enable camera access in the browser site settings, then try again.",
      );
      setScannerPhase("error");
      return;
    }

    try {
      setIsStartingCamera(true);
      setCameraError("");
      setScannerPhase("requesting");
      isHandlingDetectionRef.current = false;
      stopScanner();

      const videoInputs = await listVideoInputs();
      if (videoInputs.length === 0) {
        setCameraError(
          "No camera device was found. Connect a camera or open this page on a phone with a working camera.",
        );
        setScannerPhase("error");
        return;
      }

      const stream = await requestCameraStream();

      streamRef.current = stream;

      const video = videoRef.current;
      if (!video) {
        setCameraError("Unable to start the camera preview.");
        setScannerPhase("error");
        return;
      }

      video.srcObject = stream;
      await video.play();
      setScannerPhase("scanning");
      animationFrameRef.current = requestAnimationFrame(scanFrame);
    } catch (error) {
      console.error("Unable to start QR scanner:", error);
      const failureName = error?.name || "";
      let nextErrorMessage = "Unable to request camera access right now. Please try again.";

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
        nextErrorMessage =
          "A preferred camera was not available, and no fallback camera could be opened.";
      }

      setCameraError(nextErrorMessage);
      setScannerPhase("error");
      stopScanner();
    } finally {
      setIsStartingCamera(false);
    }
  };

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
                  {permissionState === "denied"
                    ? "Camera was already blocked for this site. Enable it in the browser site settings, then come back here."
                    : "Tap the button below, then choose Allow in the native browser popup to start scanning."}
                </p>
                <button
                  type="button"
                  className="breakTimeModalPrimaryButton qrScannerPermissionButton"
                  onClick={handleRequestCameraAccess}
                  disabled={isStartingCamera}
                >
                  {isStartingCamera
                    ? "Waiting For Permission..."
                    : "Allow Camera Access"}
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
                onClick={handleRequestCameraAccess}
                disabled={isStartingCamera}
              >
                Retry Camera Access
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
