export const isDemoMode = process.env.REACT_APP_DEMO_MODE === "true";

export const useDemoFallback = () => isDemoMode;
