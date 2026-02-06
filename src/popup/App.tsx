import { DEFAULT_MODE, DEFAULT_SHORTCUT, ModeConfig, ShortcutConfig } from "@/types/types";
import { useEffect, useState } from "react";

export default function App() {
  const [isMode, setMode] = useState<ModeConfig>(DEFAULT_MODE);
  const [isActive, setIsActive] = useState(true);
  const [shortcut, setShortcut] = useState<ShortcutConfig>(DEFAULT_SHORTCUT);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    chrome.storage.local.get("Xray-dev_mode", data => {
      const value = data["Xray-dev_mode"];

      setMode((value as ModeConfig) ?? DEFAULT_MODE);
    });
    chrome.storage.local.get("Xray-dev_isActive", data => {
      const value = data["Xray-dev_isActive"];

      setIsActive((value as boolean) ?? true);
    });

    chrome.storage.local.get("Xray-dev_shortcut", data => {
      const value = data["Xray-dev_shortcut"];

      setShortcut((value as ShortcutConfig) ?? DEFAULT_SHORTCUT);
    });
  }, []);

  const handleToggle = () => {
    setIsActive(!isActive);
    chrome.storage.local.set({ "Xray-dev_isActive": !isActive });
    console.log(isActive);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isRecording) return;

    e.preventDefault();

    // Modifier 키만 눌렸을 때는 무시
    if (["Control", "Shift", "Alt", "Meta"].includes(e.key)) return;

    const newShortcut: ShortcutConfig = {
      key: e.key.toLowerCase(),
      ctrlKey: e.ctrlKey,
      shiftKey: e.shiftKey,
      altKey: e.altKey,
      metaKey: e.metaKey,
    };

    setShortcut(newShortcut);
    setIsRecording(false);

    chrome.storage.local.set({ "Xray-dev_shortcut": newShortcut });
  };

  const handleToHtml = () => {
    setMode("html");
    chrome.storage.local.set({
      "Xray-dev_mode": "html",
    });
  };

  const handleToScreenshot = () => {
    setMode("screenshot");
    chrome.storage.local.set({
      "Xray-dev_mode": "screenshot",
    });
  };

  const getShortcutString = (config: ShortcutConfig) => {
    const keys = [];
    if (config.ctrlKey) keys.push("Ctrl");
    if (config.metaKey) keys.push("Cmd");
    if (config.shiftKey) keys.push("Shift");
    if (config.altKey) keys.push("Alt");
    keys.push(config.key.toUpperCase());
    return keys.join(" + ");
  };

  return (
    <div className="w-96 flex-row">
      <div className="flex w-full ">
        <p
          onClick={handleToScreenshot}
          className={`flex-1 h-10 flex items-center justify-center cursor-pointer border-b-2
      ${
        isMode === "screenshot"
          ? "border-blue-500 text-blue-500 font-semibold"
          : "border-transparent text-gray-500"
      }`}
        >
          Screenshot
        </p>

        <p
          onClick={handleToHtml}
          className={`flex-1 h-10 flex items-center justify-center cursor-pointer border-b-2
      ${
        isMode === "html"
          ? "border-blue-500 text-blue-500 font-semibold"
          : "border-transparent text-gray-500"
      }`}
        >
          HTML
        </p>
      </div>

      <div className="p-4 bg-gray-50 flex flex-col items-center justify-center">
        <h1 className="text-lg font-bold text-gray-800 mb-4">Xray</h1>

        <div className="flex items-center gap-3">
          <span className={`text-sm font-medium ${isActive ? "text-blue-600" : "text-gray-400"}`}>
            {isActive ? "ON" : "OFF"}
          </span>

          {/* 토글 스위치 버튼 */}
          <button
            onClick={handleToggle}
            className={`
            relative w-14 h-8 rounded-full transition-colors duration-200 ease-in-out focus:outline-none
            ${isActive ? "bg-blue-500" : "bg-gray-300"}
          `}
          >
            <span
              className={`
              absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow transform transition-transform duration-200 ease-in-out
              ${isActive ? "translate-x-6" : "translate-x-0"}
            `}
            />
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-4 text-center">
          {isActive
            ? "웹사이트 요소 위에 마우스를 올리고 단축키를 활용하여 복사하세요."
            : "기능이 비활성화되었습니다."}
        </p>
      </div>

      <div className=" p-5 bg-white flex flex-col items-center gap-4">
        <h2 className="font-bold text-gray-700">단축키 설정</h2>

        <button
          onClick={() => setIsRecording(true)}
          onKeyDown={handleKeyDown} // 여기서 키 입력을 받음
          className={`
          w-full py-2 px-4 rounded border text-sm font-medium transition-colors
          ${
            isRecording
              ? "bg-blue-100 border-blue-500 text-blue-700 animate-pulse"
              : "bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100"
          }
        `}
        >
          {isRecording ? "단축키를 누르세요..." : getShortcutString(shortcut)}
        </button>

        <p className="text-xs text-gray-500 text-center">
          버튼을 클릭 후 원하는 키 조합을 입력하세요.
        </p>
      </div>
    </div>
  );
}
