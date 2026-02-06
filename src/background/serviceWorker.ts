interface CaptureScreenshotMessage {
  type: "CAPTURE_SCREENSHOT";
}

interface CaptureScreenshotResponse {
  success: boolean;
  dataUrl?: string;
  error?: string;
}

/**
 * 스크린샷 캡처 메시지 핸들러
 */
chrome.runtime.onMessage.addListener(
  (
    message: CaptureScreenshotMessage,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: CaptureScreenshotResponse) => void
  ) => {
    if (message.type === "CAPTURE_SCREENSHOT") {
      chrome.tabs
        .captureVisibleTab(null as unknown as number, { format: "png", quality: 100 })
        .then(dataUrl => sendResponse({ success: true, dataUrl }))
        .catch(error => {
          console.error("Failed to capture screenshot:", error);
          sendResponse({ success: false, error: error.message });
        });

      return true;
    }
  }
);

chrome.runtime.onInstalled.addListener(() => {
  console.log("Xray extension installed");
});
