import React, { useEffect, useState, useRef } from "react";
import PropTypes from "prop-types";
import { HiOutlineDownload } from "react-icons/hi";
import { FaFileCsv, FaFilePdf } from "react-icons/fa";
import { SiJson } from "react-icons/si";
import { useTheme } from "../../hooks/useThemeContext";

const DownloadButtons = ({ onDownload, isLoading, downloading, cancelled }) => {
  const { themeColors, isDark } = useTheme();
  const [activeFormat, setActiveFormat] = useState(null);
  const [processingFormat, setProcessingFormat] = useState(null);
  const [scaleValues] = useState({
    csv: 1,
    json: 1,
    pdf: 1,
  });

  useEffect(() => {
    if (!downloading && !isLoading) {
      setActiveFormat(null);
      setProcessingFormat(null);
    }
  }, [downloading, isLoading]);

  useEffect(() => {
    if (cancelled) {
      console.log("Download cancelled - resetting button states");
      setActiveFormat(null);
      setProcessingFormat(null);
    }
  }, [cancelled]);

  useEffect(() => {
    if (!downloading && (activeFormat || processingFormat)) {
      console.log("Download stopped - resetting button states");
      setTimeout(() => {
        setActiveFormat(null);
        setProcessingFormat(null);
      }, 100);
    }
  }, [downloading, activeFormat, processingFormat]);

  useEffect(() => {
    if (cancelled && (activeFormat || processingFormat)) {
      console.log("Forcing immediate reset due to cancellation");
      setActiveFormat(null);
      setProcessingFormat(null);
      setTimeout(() => {
        setActiveFormat(null);
        setProcessingFormat(null);
      }, 0);
    }
  }, [cancelled, activeFormat, processingFormat]);

  const showStyledAlert = (title, message, type = "info") => {
    let prefix = "";
    if (type === "error") prefix = "Error: ";
    else if (type === "success") prefix = "Success: ";
    else if (type === "warning") prefix = "Warning: ";
    else if (type === "info") prefix = "Info: ";
    else if (type === "loading") prefix = "Processing: ";

    const formattedTitle = prefix + title;

    // Use native browser alert or a toast library
    alert(`${formattedTitle}\n\n${message}`);
  };

  const resetButtonStates = () => {
    console.log("Manually resetting button states");
    setActiveFormat(null);
    setProcessingFormat(null);
  };

  const handleDownloadWithAnimation = async (format) => {
    if (cancelled) {
      resetButtonStates();
      return;
    }

    if (activeFormat || processingFormat || isLoading || downloading) {
      showStyledAlert(
        "Download in Progress",
        "Another download is already in progress. Please wait for it to complete.",
        "loading"
      );
      return;
    }

    setActiveFormat(format);

    try {
      setTimeout(() => setProcessingFormat(format), 150);
      const result = await onDownload(format);

      if (result === false || result === null || result === undefined) {
        resetButtonStates();
      }
    } catch (error) {
      console.error("Download error:", error);
      resetButtonStates();

      if (
        !error.message?.includes("cancel") &&
        !error.message?.includes("abort")
      ) {
        showStyledAlert(
          "Download Failed",
          error.message ||
            "An error occurred while downloading. Please try again.",
          "error"
        );
      }
    }
  };

  // Only render download buttons, no share option
  const renderDownloadButton = (format, Icon, label, gradientColors) => {
    const isCurrentActive = activeFormat === format;
    const isCurrentProcessing = processingFormat === format;
    const isAnyActive =
      activeFormat !== null ||
      processingFormat !== null ||
      isLoading ||
      (downloading && !cancelled);
    const isThisButtonBusy =
      (isCurrentActive ||
        isCurrentProcessing ||
        (downloading && processingFormat === format)) &&
      !cancelled;

    return (
      <div
        className="flex-1 transform transition-transform"
        style={{
          transform: `scale(${scaleValues[format]})`,
        }}
      >
        <button
          className={`
            relative w-full py-3.5 px-4 rounded-xl border overflow-hidden
            shadow-sm transition-all duration-200 min-h-[52px]
            ${isThisButtonBusy ? "border-2" : "border"}
            ${
              isAnyActive && !isThisButtonBusy
                ? "opacity-30 cursor-not-allowed"
                : "opacity-100 cursor-pointer hover:shadow-md"
            }
          `}
          style={{
            background: themeColors.surface,
            borderColor: isThisButtonBusy
              ? gradientColors[1]
              : isDark
              ? themeColors.border
              : "rgba(255, 255, 255, 0.3)",
            boxShadow:
              !isDark && isThisButtonBusy
                ? `0 4px 12px ${gradientColors[0]}30`
                : undefined,
          }}
          onClick={() => handleDownloadWithAnimation(format)}
          disabled={isAnyActive}
        >
          <div
            className={`absolute inset-0 bg-gradient-to-br transition-opacity ${
              isThisButtonBusy ? "opacity-100" : "opacity-0"
            }`}
            style={{
              background: isThisButtonBusy
                ? `linear-gradient(to bottom right, ${gradientColors[1]}, ${gradientColors[0]})`
                : isDark
                ? `linear-gradient(to bottom right, ${themeColors.surface}, ${themeColors.background})`
                : `linear-gradient(to bottom right, ${gradientColors[0]}15, ${gradientColors[0]}05)`,
            }}
          />

          <div className="relative flex items-center justify-center gap-2.5">
            {isThisButtonBusy ? (
              <div className="flex items-center gap-1.5">
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                <span
                  className="text-xs font-semibold"
                  style={{
                    color: isThisButtonBusy ? "#fff" : gradientColors[0],
                  }}
                >
                  {isCurrentProcessing || downloading
                    ? "Processing..."
                    : "Preparing..."}
                </span>
              </div>
            ) : (
              <>
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${gradientColors[0]}18` }}
                >
                  <Icon size={18} color={gradientColors[0]} />
                </div>
                <span
                  className="text-sm font-bold tracking-tight"
                  style={{ color: gradientColors[0] }}
                >
                  {label}
                </span>
              </>
            )}
          </div>
        </button>
      </div>
    );
  };

  const getStatusMessage = () => {
    if (processingFormat === "csv") return "Processing CSV download...";
    if (processingFormat === "json") return "Processing JSON download...";
    if (processingFormat === "pdf") return "Processing PDF download...";
    if (activeFormat === "csv") return "Preparing CSV download...";
    if (activeFormat === "json") return "Preparing JSON download...";
    if (activeFormat === "pdf") return "Preparing PDF download...";
    if (downloading) return "Finalizing download...";
    return "Preparing download...";
  };

  return (
    <div
      className={`mx-4 mb-5 rounded-2xl overflow-hidden shadow-lg border relative`}
      style={{
        background: themeColors.surface,
        borderColor: isDark ? "#374151" : "rgba(255,255,255,0.2)",
      }}
    >
      <div
        className={`absolute inset-0`}
        style={{ background: themeColors.surface, opacity: 0.98 }}
      />

      <div className="relative flex items-center px-5 pt-5 pb-4">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center mr-3.5"
          style={{ background: themeColors.surface }}
        >
          <HiOutlineDownload size={24} color={themeColors.primary} />
        </div>
        <div className="flex-1">
          <h3
            className="text-lg font-bold tracking-tight mb-0.5"
            style={{ color: themeColors.heading }}
          >
            Export Data
          </h3>
          <p
            className="text-sm font-medium opacity-80"
            style={{ color: `${themeColors.text}99` }}
          >
            Download analytics in your preferred format
          </p>
        </div>
      </div>

      <div className="relative px-5 pb-5">
        <div className="flex gap-3">
          {renderDownloadButton("csv", FaFileCsv, "CSV", [
            "#34C759",
            "#30B351",
          ])}
          {renderDownloadButton("json", SiJson, "JSON", ["#007AFF", "#0056CC"])}
          {renderDownloadButton("pdf", FaFilePdf, "PDF", [
            "#FF3B30",
            "#D70015",
          ])}
        </div>
      </div>

      {(activeFormat || processingFormat || downloading || isLoading) && (
        <div className="relative px-5 pb-5">
          <div
            className={`
              inline-flex items-center justify-center mx-auto
              py-2.5 px-4 rounded-full border shadow-sm
            `}
            style={{
              background: themeColors.surface,
              borderColor: isDark ? "#374151" : "rgba(255,255,255,0.2)",
            }}
          >
            <HiOutlineDownload
              size={16}
              color={themeColors.primary}
              className="mr-2"
            />
            <span
              className="text-xs font-semibold tracking-tight relative"
              style={{ color: themeColors.text }}
            >
              {getStatusMessage()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

DownloadButtons.propTypes = {
  onDownload: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
  downloading: PropTypes.bool,
  cancelled: PropTypes.bool,
};

DownloadButtons.defaultProps = {
  isLoading: false,
  downloading: false,
  cancelled: false,
};

export default DownloadButtons;
