import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

let activeTooltipId: string | null = null;
let tooltipCounter = 0;

export function useTooltipPortal() {
  const [tooltipId] = useState(() => `tooltip-${++tooltipCounter}`);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    return () => {
      if (activeTooltipId === tooltipId) {
        activeTooltipId = null;
      }
    };
  }, [tooltipId]);

  const registerTooltip = () => {
    if (activeTooltipId && activeTooltipId !== tooltipId) {
      console.log('🚫 Another tooltip is active, blocking:', { active: activeTooltipId, requesting: tooltipId });
      return false;
    }
    activeTooltipId = tooltipId;
    setIsActive(true);
    console.log('✅ Tooltip registered:', tooltipId);
    return true;
  };

  const unregisterTooltip = () => {
    if (activeTooltipId === tooltipId) {
      activeTooltipId = null;
      setIsActive(false);
      console.log('🧹 Tooltip unregistered:', tooltipId);
    }
  };

  const renderTooltip = (content: React.ReactNode) => {
    if (!isActive || activeTooltipId !== tooltipId) {
      return null;
    }

    const portalRoot = document.getElementById('tooltip-portal') || document.body;
    return createPortal(content, portalRoot);
  };

  return {
    tooltipId,
    isActive: isActive && activeTooltipId === tooltipId,
    registerTooltip,
    unregisterTooltip,
    renderTooltip
  };
}