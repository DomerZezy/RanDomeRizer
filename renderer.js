const { remove, write, exists, read } = require("fs-jetpack");
const { ipcRenderer } = require("electron"); // needed since remote module got deprecated
const Toastify = require("toastify-js");
const Anime = require("animejs");

import {
  minimizeButtonSvg,
  closeButtonSvg,
  settingsButtonSvg,
  lessThanSvg,
  greaterThanSvg,
} from "./svgModules.js";

// gather all necessary elements
const settingsButton = document.querySelector(".navBar__settingsButton");

const menu = document.querySelector(".main__settingsMenu");
const saveSetupButton = document.querySelector(".main__saveSetupButton");
const saveResultsButton = document.querySelector(".main__saveResultsButton");
const loadResultsButton = document.querySelector(".main__loadResultsButton");
const resetButton = document.querySelector(".main__resetButton");

const fieldsInput = document.querySelector(".main__fieldsSettingsInput");
const groupsInput = document.querySelector(".main__groupsSettingsInput");

const loadSetupButton = document.querySelector(".main__loadSetupButton");
const fieldsList = document.querySelector(".main__fieldsList");
const randomizeButton = document.querySelector(".main__randomizeButton");
const settingsInputButtons = document.querySelectorAll(
  ".main__settingsInputButton"
);

const results = document.querySelector(".main__results");
const resultsList = document.querySelector(".main__resultsList");
const resultCloseButton = document.querySelector(
  ".main__resultRandomizeButton"
);

const setup = {
  groups: [],
  fields: [],
  config: {},
};

const closeResultsButton = document.querySelector(".main__resultsCloseButton");

let fieldsAmount = 0;
let groupsAmount = 0;

let userConfig;
let inputFocused = false;
let menuOpened = false;

let resultsObject;

// rendering results
const renderResults = (resultsObject, resultsGroups) => {
  results.style.left = "0";

  resultsList.innerHTML = "";

  resultsGroups.forEach((group) => {
    resultsList.innerHTML += `<h2 class="main__resultsTitle" style="color: ${group.groupColor};">${group.groupName}</h2>`;
    resultsObject.forEach((result, index) => {
      console.log(result.group.groupName, group.groupName);
      if (result.group.groupName === group.groupName)
        resultsList.innerHTML += `<p class="main__resultsResult">${result.field}</p>`;
    });
  });

  document
    .querySelector(".main__resultsCloseButton")
    .addEventListener("click", () => {
      results.style.left = "100%";
    });
};

const handleInputChange = (button) => {
  let inputChange;
  let operation;

  button.target.classList.forEach((className) => {
    switch (className) {
      case "main__fieldsSettingsInputButton": {
        inputChange = "fields";
        break;
      }
      case "main__groupsSettingsInputButton": {
        inputChange = "groups";
        break;
      }
      case "main__settingsInputButton--greater": {
        operation = "increment";
        break;
      }
      case "main__settingsInputButton--less": {
        operation = "decrement";
        break;
      }
    }
  });

  if (inputChange === "fields") {
    if (operation === "increment") {
      fieldsInput.value = parseInt(fieldsInput.value) + 1;
    } else {
      if (parseInt(fieldsInput.value) === 0) return;
      fieldsInput.value = parseInt(fieldsInput.value) - 1;
    }
  } else {
    if (operation === "increment") {
      groupsInput.value = parseInt(groupsInput.value) + 1;
    } else {
      if (parseInt(groupsInput.value) === 0) return;
      groupsInput.value = parseInt(groupsInput.value) - 1;
    }
  }

  checkFieldsDifference();
  checkGroupsDifference();
};

const handleChange = () => {
  const fields = document.querySelectorAll(".main__fieldName");

  fields.forEach((field, index) => {
    field.setAttribute("pos", index);
    if (!field.hasAttribute("event-input")) {
      field.setAttribute("event-input", true);
      field.addEventListener("input", (e) => {
        setup.fields[parseInt(field.getAttribute("pos"))] = e.target.value;
      });
    }
  });
};

const saveResults = async () => {
  const filePathData = await ipcRenderer.invoke("saveResultsFile");
  if (filePathData.canceled) return;

  const filePath = filePathData.filePath;
  if (exists(filePath)) {
    remove(filePath);
    write(filePath, resultsObject);
  } else {
    write(filePath, resultsObject);
  }
};

const loadResults = async () => {
  const file = await ipcRenderer.invoke("openResultsFile");
  if (file.canceled) return;
  const filePath = file.filePaths[0];

  if (exists(filePath)) {
    const resultsFile = read(filePath, "json");
    console.log(resultsFile);
    if (!resultsFile.type || resultsFile.type !== "RanDomeRizerResults") {
      Toastify({
        text: "File is not a result!",
        duration: 3000,
        className: "main__errorToast",
        gravity: "top",
        position: "left",
        stopOnFocus: true,
        close: true,
        offset: {
          y: 10,
        },
        style: {
          background: "#FF0000",
          maxWidth: "200px",
        },
      }).showToast();
      return;
    }
    renderResults(resultsFile.results, resultsFile.groups);
  }
};

//gathering data from inputs (for randomization and saving setups)
const gatherData = () => {
  const date = new Date();
  const y = date.getFullYear();
  const m = date.getMonth() < 10 ? `0${date.getMonth() + 1}` : date.getMonth();
  const d = date.getDate() < 10 ? `0${date.getDate()}` : date.getDate();
  return {
    type: "RanDomeRizerSetup",
    fields: setup.fields,
    groups: setup.groups,
    config: {
      visibility: [],
      title: `${d}.${m}.${y}`,
    },
  };
};

const randomize = () => {
  const inputData = gatherData();

  const groups = inputData.groups;
  const fields = inputData.fields;

  if (groups.length <= 0 || fields.length <= 0) {
    Toastify({
      text: "Incorrect setup data!",
      duration: 3000,
      className: "main__errorToast",
      gravity: "top",
      position: "left",
      stopOnFocus: true,
      close: true,
      offset: {
        y: 10,
      },
      style: {
        background: "#FF0000",
        maxWidth: "250px",
      },
    }).showToast();
    return;
  }

  const data = {
    type: "RanDomeRizerSetup",
    fields: fields,
    groups: groups,
    config: {
      visibility: [],
      title: "Last setup",
    },
  };

  //remove lastSetup file to write a new one (and to avoid appending)
  remove("setups/lastSetup.json");
  write("setups/lastSetup.json", data);

  const resultsList = [];

  // new algorithm
  const randomizationFields = [...inputData.fields];

  for (let i = 0; i < fields.length; i++) {
    `i = ${i}`;
    for (let j = 0; j < groups.length; j++) {
      if (randomizationFields.length === 0) {
        continue;
      }
      const randomField = Math.floor(
        Math.random() * randomizationFields.length
      );
      resultsList.push({
        group: groups[j],
        field: randomizationFields[randomField],
      });
      randomizationFields.splice(randomField, 1);
    }
  }

  if (
    setup.config.visibility &&
    setup.config.visibility.some(
      (x) => typeof x === "object" && x[0] === "showLimitedResults"
    )
  ) {
    let amount = 0;
    setup.config.visibility.forEach((attribute) => {
      if (
        typeof attribute === "object" &&
        attribute[0] === "showLimitedResults"
      ) {
        amount = attribute[1];
      }
    });
    resultsList.splice(amount);
  }

  resultsObject = {
    type: "RanDomeRizerResults",
    results: resultsList,
    groups: groups,
  };

  // remove lastRandomization file to write a new one (and to avoid appending)
  remove("results/lastRandomize.json");
  write("results/lastRandomize.json", resultsObject);

  renderResults(resultsList, groups);
};
const loadSetup = async () => {
  // show file prompt to user and get file data
  const file = await ipcRenderer.invoke("openSetupFile");
  // if user canceled file selection, do nothing
  if (file.canceled) return;
  // else get file path (multiSelection is off, so only index 0 is needed)
  const filePath = file.filePaths[0];

  // check if file exists, just in case
  if (exists(filePath)) {
    const setupFile = read(filePath, "json");
    if (!setupFile.type || setupFile.type !== "RanDomeRizerSetup") {
      Toastify({
        text: "File is not a setup!",
        duration: 3000,
        className: "main__errorToast",
        gravity: "top",
        position: "left",
        stopOnFocus: true,
        close: true,
        offset: {
          y: 10,
        },
        style: {
          background: "#FF0000",
          maxWidth: "200px",
        },
      }).showToast();
      return;
    }

    if (
      !setupFile.fields ||
      !setupFile.groups ||
      setupFile.fields.length === 0 ||
      setupFile.groups.length === 0
    ) {
      Toastify({
        text: "Setup not valid!",
        duration: 3000,
        className: "main__errorToast",
        gravity: "top",
        position: "left",
        stopOnFocus: true,
        close: true,
        offset: {
          y: 10,
        },
        style: {
          background: "#FF0000",
          maxWidth: "200px",
        },
      }).showToast();
      return;
    }

    setup.fields = [];
    setup.groups = [];

    fieldsAmount = setupFile.fields.length;
    groupsAmount = setupFile.groups.length;

    fieldsInput.removeAttribute("readonly");
    groupsInput.removeAttribute("readonly");

    //show setup title
    loadSetupButton.querySelector(".main__setupText").textContent =
      setupFile.config.title;

    // load config to internal object
    setup.config = setupFile.config;

    fieldsList.innerHTML = "";

    // config visibility checks
    if (setup.config.visibility.some((x) => x === "staticGroups")) {
      groupsInput.setAttribute("readonly", true);
    }

    if (setup.config.visibility.some((x) => x === "staticFields")) {
      fieldsInput.setAttribute("readonly", true);
    }

    if (!setup.config.visibility.some((x) => x === "doNotRenderFields")) {
      // render fields
      setupFile.fields.forEach((field) => {
        addField(field, setupFile.config.fieldPlaceholder);
      });
    } else {
      setup.fields = setupFile.fields;
    }

    // show amount of each value in their respective input
    groupsInput.value = setupFile.groups.length;
    fieldsInput.value = setupFile.fields.length;

    // add fields to internal object
    setupFile.groups.forEach((group) => {
      addGroup(group.groupName, group.groupColor);
    });
  }
  // invoke method responsible for field input event listeners
  handleChange();
};

const saveSetup = async () => {
  const inputData = gatherData();
  const filePathData = await ipcRenderer.invoke("saveSetupFile");
  if (filePathData.canceled) return;

  const filePath = filePathData.filePath;
  if (exists(filePath)) {
    remove(filePath);
    write(filePath, inputData);
  } else {
    write(filePath, inputData);
  }
};

// remove keybinding catching when input is focused
const handleFocus = () => {
  const fields = document.querySelectorAll("input");
  fields.forEach((field) => {
    field.addEventListener("focus", () => {
      inputFocused = true;
    });
    field.addEventListener("blur", () => {
      inputFocused = false;
    });
  });
};

const addField = (value = "", placeholder = "Field name") => {
  fieldsList.insertAdjacentHTML(
    "beforeend",
    `
    <div class="main__field">
      <span class="main__fieldNumber">${
        setup.fields.length + 1
      })</span><input class="main__fieldName" type="text" value="${value}" placeholder="${placeholder}" value="">
    </div>
    `
  );

  setup.fields.push(value);

  handleChange();
  handleFocus();
};

const addGroup = (
  groupName = setup.groups ? `Group ${setup.groups.length + 1}` : "Group 1",
  groupColor = "#FFFFFF"
) => {
  setup.groups.push({
    groupName: groupName,
    groupColor: groupColor,
  });
};

const removeField = (amount) => {
  for (let i = 0; i < amount; i++) {
    setup.fields.pop();
    document.querySelector(".main__field:last-child").remove();
  }
};

const removeGroup = (amount) => {
  for (let i = 0; i < amount; i++) {
    setup.groups.pop();
  }
};

const handleMenu = () => {
  if (menuOpened) {
    menu.style.display = "flex";
    const menuOpen = Anime({
      targets: ".main__settingsMenu",
      duration: 100,
      opacity: 1,
      autoplay: false,
      easing: "linear",
    });
    menuOpen.play();
  } else {
    const menuClose = Anime({
      targets: ".main__settingsMenu",
      duration: 100,
      easing: "linear",
      opacity: 0,
      autoplay: false,
      complete: () => {
        menu.style.display = "none";
      },
    });

    menuClose.play();
  }
};

const checkFieldsDifference = () => {
  if (parseInt(fieldsInput.value) !== fieldsAmount) {
    const difference = parseInt(fieldsInput.value) - fieldsAmount;
    fieldsAmount = parseInt(fieldsInput.value);
    if (difference > 0) {
      for (let i = 0; i < difference; i++) {
        addField();
      }
    } else {
      removeField(-difference);
    }
  }
};

const checkGroupsDifference = () => {
  if (parseInt(groupsInput.value) !== groupsAmount) {
    const difference = parseInt(groupsInput.value) - groupsAmount;
    groupsAmount = parseInt(groupsInput.value);
    if (difference > 0) {
      for (let i = 0; i < difference; i++) {
        addGroup();
      }
    } else {
      removeGroup(-difference);
    }
  }
};

// event listener adding

// adding functionality to titlebar close and minimize buttons
window.addEventListener("DOMContentLoaded", () => {
  const minimizeButton = document.querySelector(".navBar__minimizeButton");
  const closeButton = document.querySelector(".navBar__closeButton");

  minimizeButton.innerHTML = minimizeButtonSvg;
  closeButton.innerHTML = closeButtonSvg;
  settingsButton.innerHTML = settingsButtonSvg;

  settingsInputButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
      handleInputChange(e);
    });
    button.classList.forEach((arg) => {
      if (arg === "main__settingsInputButton--less")
        button.innerHTML = lessThanSvg;
      if (arg === "main__settingsInputButton--greater")
        button.innerHTML = greaterThanSvg;
    });
  });

  minimizeButton.addEventListener("click", () => {
    ipcRenderer.send("min");
  });

  closeButton.addEventListener("click", () => {
    remove("assets/temp");
    ipcRenderer.send("close");
  });

  closeResultsButton.addEventListener("click", () => {
    results.style.left = "100%";
  });

  if (!exists("config.json")) {
    userConfig = {
      theme: "default",
      noAnim: false,
      keyBindings: {
        randomize: "r",
      },
    };
    write("config.json", userConfig);
  } else {
    userConfig = read("config.json", "json");
  }
});

// key bindings
window.addEventListener("keyup", (e) => {
  if (inputFocused) return;

  switch (e.key.toLowerCase()) {
    case userConfig.keyBindings.randomize: {
      randomize();
      break;
    }
    default: {
      return;
    }
  }
});

window.addEventListener("click", () => {
  if (menuOpened) menuOpened = false;
  handleMenu();
});

//save randomization setup to JSON file
saveSetupButton.addEventListener("click", () => {
  saveSetup();
});

//load randomization setup from JSON file
loadSetupButton.addEventListener("click", () => {
  loadSetup();
});

//randomization
randomizeButton.addEventListener("click", () => {
  randomize();
});

resultCloseButton.addEventListener("click", () => {
  randomize();
});

settingsButton.addEventListener("click", (e) => {
  e.stopPropagation();
  menuOpened = !menuOpened;
  handleMenu();
});

menu.addEventListener("click", (e) => {
  e.stopPropagation();
});

saveResultsButton.addEventListener("click", () => {
  saveResults();
});

loadResultsButton.addEventListener("click", () => {
  loadResults();
});

resetButton.addEventListener("click", () => {
  window.location.reload();
});

fieldsInput.addEventListener("blur", (e) => {
  checkFieldsDifference();
});

groupsInput.addEventListener("blur", (e) => {
  checkGroupsDifference();
});

fieldsInput.addEventListener("keyup", (e) => {
  if (e.key === "Enter") checkFieldsDifference();
});

groupsInput.addEventListener("keyup", (e) => {
  if (e.key === "Enter") checkGroupsDifference();
});

handleFocus();
