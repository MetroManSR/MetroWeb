import { initializeErrorButton } from './dictScripts/errorModule.js';
import { copyToClipboard } from './dictScripts/util.js';

// Define the language variable in the JavaScript context
const lang = document.documentElement.lang; // Ensure that lang is set correctly

// Define knlangRedirect function and export it
export function knlangRedirect() {
  // Get the current path
  let path = window.location.pathname;
  let newPath = "";

  // Add "en/" at the beginning of the path
  if (lang === "es") {
    newPath = '/en' + path;
  } else {
    newPath = path.replace("/en", "");
  }

  // Build the new URL
  let newUrl = window.location.origin + newPath;

  // Redirect to the new URL
  window.location.href = newUrl;
}

// Function to set default texts
function setDefaultStrings(language) {
  const defaultStrings = {
    en: {
      back: "Return",
    },
    es: {
      back: "Volver",
    }
  };
  return defaultStrings[language];
}

document.addEventListener('DOMContentLoaded', function() {
  // This should be injected by your static site generator
  const defaultStrings = setDefaultStrings(lang);
  document.getElementById("backbutton").innerText = defaultStrings.back;

  // Initialize error button
  initializeErrorButton();
});
