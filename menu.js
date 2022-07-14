const { ipcRenderer } = require("electron");

const closeButton = document.querySelector(".navBar__closeButton");
const minimizeButton = document.querySelector(".navBar__minimizeButton");

const creatorLink = document.querySelector(".mainMenu__button--creator");

import { minimizeButtonSvg, closeButtonSvg } from "./svgModules.js";

window.addEventListener("DOMContentLoaded", () => {
  minimizeButton.innerHTML = minimizeButtonSvg;
  closeButton.innerHTML = closeButtonSvg;

  closeButton.addEventListener("click", () => ipcRenderer.send("close"));
  minimizeButton.addEventListener("click", () => ipcRenderer.send("min"));
});

creatorLink.addEventListener("click", () => ipcRenderer.send("openCreator"));
