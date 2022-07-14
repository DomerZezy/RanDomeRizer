const { remove, write, exists, read } = require("fs-jetpack");
const { ipcRenderer } = require("electron");

const closeButton = document.querySelector(".titleBar__closeButton");
const minimizeButton = document.querySelector(".titleBar__minimizeButton");

const openSetup = document.querySelector(".index__editSetup");
const fieldsAmount = document.querySelector(".index__fieldsAmount");
const groupsAmount = document.querySelector(".index__groupsAmount");
const setupName = document.querySelector(".index__setupName");
const placeholderName = document.querySelector(".index__placeholderName");
const checkboxes = document.querySelectorAll(".index__checkbox");
const generateSetup = document.querySelector(".index__generateSetup");
const showLimitedResults = document.querySelector(".index__showLimitedFields");

import { minimizeButtonSvg, closeButtonSvg } from "../svgModules.js";

const config = {
  type: "RanDomeRizerSetup",
  fields: [],
  groups: [],
  config: {},
};

window.addEventListener("DOMContentLoaded", () => {
  minimizeButton.innerHTML = minimizeButtonSvg;
  closeButton.innerHTML = closeButtonSvg;

  closeButton.addEventListener("click", () => {
    ipcRenderer.send("closeAdditional");
  });

  minimizeButton.addEventListener("click", () => {
    ipcRenderer.send("minAdditional");
  });
});

const Generate = async () => {
  for (let i = 0; i < parseInt(fieldsAmount.value); i++) {
    config.fields.push("");
  }
  for (let i = 0; i < parseInt(groupsAmount.value); i++) {
    config.groups.push({ groupName: `Group ${i + 1}`, groupColor: "#FFFFFF" });
  }
  if (setupName.value.length > 0) config.config["title"] = setupName.value;
  else config.config["title"] = "Generated config";
  if (placeholderName.value.length > 0)
    config.config["fieldPlaceholder"] = placeholderName.value;
  checkboxes.forEach((checkbox) => {
    if (checkbox.checked) {
      switch (checkbox.name) {
        case "staticFields": {
          if (!config.config.visibility) {
            config.config["visibility"] = [];
          }
          config.config.visibility.push("staticFields");
          break;
        }
        case "staticGroups": {
          if (!config.config.visibility) {
            config.config["visibility"] = [];
          }
          config.config.visibility.push("staticGroups");
          break;
        }
        case "doNotRenderFields": {
          if (!config.config.visibility) {
            config.config["visibility"] = [];
          }
          config.config.visibility.push("doNotRenderFields");
          break;
        }
        case "renderLimitedResults": {
          if (!config.config.visibility) {
            config.config["visibility"] = [];
          }
          config.config.visibility.push([
            "showLimitedResults",
            parseInt(showLimitedResults.value),
          ]);
        }
      }
    }
  });
  console.log(config);
  const filePath = await ipcRenderer.invoke("saveSetupFile");
  if (exists(filePath)) remove(filePath);
  write(filePath, config);
};

generateSetup.addEventListener("click", () => {
  if (parseInt(groupsAmount.value) > 0 && parseInt(fieldsAmount.value) > 0) {
    Generate();
  }
});
