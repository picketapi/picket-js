import React, { useState, useLayoutEffect } from "react";

import { PicketTheme } from "../../picket";
import { MODAL_ID } from "../constants";

type ColorSchemePreference = "light" | "dark";

const getUserColorSchemePreference = (): ColorSchemePreference =>
  window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

const useUserColorSchemePreference = () => {
  const [colorSchemePreference, setColorSchemePreference] =
    useState<ColorSchemePreference>("light");

  useLayoutEffect(() => {
    const handler = () =>
      setColorSchemePreference(getUserColorSchemePreference());
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", handler);
    return () =>
      window
        .matchMedia("(prefers-color-scheme: dark)")
        .removeEventListener("change", handler);
  }, []);

  return colorSchemePreference;
};

export const useDarkMode = (theme: PicketTheme) => {
  const colorSchemePreference = useUserColorSchemePreference();

  const darkMode =
    theme === "dark" || (theme === "auto" && colorSchemePreference === "dark");

  // add/remove tailwind class if any theme or preferences change
  useLayoutEffect(() => {
    const picketModalEl = document.getElementById(MODAL_ID);

    // should never happen!
    if (!picketModalEl) return;

    if (darkMode) {
      picketModalEl.classList.add("dark");
    } else {
      picketModalEl.classList.remove("dark");
    }
  }, [darkMode]);

  return darkMode;
};
