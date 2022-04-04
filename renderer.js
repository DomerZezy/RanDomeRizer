const { remove, write, exists, read, cwd } = require("fs-jetpack");
const { ipcRenderer } = require("electron"); // needed since remote module got deprecated
const Toastify = require("toastify-js");
const ColorPicker = require("simple-color-picker");
const Anime = require("animejs");

const colorPicker = new ColorPicker({
  color: "#000000",
  el: document.querySelector(".main__pickerScreen"),
});

// gather all necessary elements
const settingsButton = document.querySelector(".navBar__settingsButton");

const menu = document.querySelector(".main__settingsMenu");
const addFieldButton = document.querySelector(".main__addFieldButton");
const addGroupButton = document.querySelector(".main__addGroupButton");
const saveSetupButton = document.querySelector(".main__saveSetupButton");
const saveResultsButton = document.querySelector(".main__saveResultsButton");
const loadResultsButton = document.querySelector(".main__loadResultsButton");
const resetButton = document.querySelector(".main__resetButton");

const loadSetupButton = document.querySelector(".main__loadSetupButton");
const groupsList = document.querySelector(".main__groupsList");
const fieldsList = document.querySelector(".main__fieldsList");
const randomizeButton = document.querySelector(".main__randomizeButton");

const results = document.querySelector(".main__results");
const blur = document.querySelector(".main__blur");

const setup = {
  groups: [],
  fields: [],
  config: {},
};

const closeResultsButton = document.querySelector(".main__resultsCloseButton");

let config;
let inputFocused = false;
let menuOpened = false;

let resultsObject;

// for displaying "Groups" and "Fields" after adding fields (those titles shouldn't show multiple times)
let firstGroup = false;
let firstField = false;

// rendering results
const renderResults = (resultsList) => {
  results.style.left = "10%";
  blur.style.left = "0";

  results.innerHTML = `<button class="main__resultsCloseButton">Close</button>`;

  setup.groups.forEach((group) => {
    results.innerHTML += `<h2 class="main__resultsTitle" style="color: ${group.groupColor};">${group.groupName}</h2>`;
    resultsList.forEach((result) => {
      if (result.group.groupName === group.groupName)
        results.innerHTML += `<p class="main__resultsResult">${result.field}</p>`;
    });
  });
  document
    .querySelector(".main__resultsCloseButton")
    .addEventListener("click", () => {
      results.style.left = "100%";
      blur.style.left = "100%";
    });
};

const handleChange = () => {
  const fields = document.querySelectorAll(".main__fieldName");
  const groupsName = document.querySelectorAll(".main__groupName");
  const groupsColor = document.querySelectorAll(".main__groupColor");

  fields.forEach((field, index) => {
    field.setAttribute("pos", index);
    if (!field.hasAttribute("event-input")) {
      field.setAttribute("event-input", true);
      field.addEventListener("input", (e) => {
        setup.fields[parseInt(field.getAttribute("pos"))] = e.target.value;
      });
    }
  });
  groupsName.forEach((field, index) => {
    field.setAttribute("pos", index);
    if (!field.hasAttribute("event-input")) {
      field.setAttribute("event-input", true);
      field.addEventListener("input", (e) => {
        setup.groups[parseInt(field.getAttribute("pos"))].groupName =
          e.target.value;
      });
    }
  });
  groupsColor.forEach((field, index) => {
    field.setAttribute("pos", index);
    if (!field.hasAttribute("event-input")) {
      field.setAttribute("event-input", true);
      field.addEventListener("input", (e) => {
        setup.groups[parseInt(field.getAttribute("pos"))].groupColor =
          e.target.value;
      });
    }
  });
};

const addRemoveFuncFields = () => {
  document.querySelectorAll(".main__removeFieldButton").forEach((button) => {
    if (!button.hasAttribute("event-click")) {
      button.setAttribute("event-click", true);
      button.addEventListener("click", (e) => {
        e.target.parentNode.remove();
        setup.fields.splice(
          parseInt(
            e.target.parentNode
              .querySelector(".main__fieldName")
              .getAttribute("pos")
          ),
          1
        );
        handleChange();
        if (document.querySelectorAll(".main__field").length === 0) {
          firstField = false;
          document.querySelector(".main__fieldsListTitle").remove();
        }
      });
    }
  });
};

const addRemoveFuncGroups = () => {
  document.querySelectorAll(".main__removeGroupButton").forEach((button) => {
    button.addEventListener("click", (e) => {
      e.target.parentNode.remove();
      setup.groups.splice(
        parseInt(
          e.target.parentNode
            .querySelector(".main__groupName")
            .getAttribute("pos")
        ),
        1
      );
      handleChange();
      if (document.querySelectorAll(".main__group").length === 0) {
        firstGroup = false;
        try {
          document.querySelector(".main__groupsListTitle").remove();
        } catch (e) {}
      }
    });
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

    //show setup title
    loadSetupButton.querySelector(".main__setupText").textContent =
      setupFile.config.title;

    setup.config = setupFile.config;

    fieldsList.innerHTML = "";
    groupsList.innerHTML = "";

    fieldsList.innerHTML = `<p class="main__fieldsListTitle">Fields</p>`;

    // render fields
    setupFile.fields.forEach((field) => {
      firstField = true;
      addField(field, setupFile.config.fieldPlaceholder);
    });

    // render groups
    if (
      !setup.config.visibility ||
      !setup.config.visibility.some((x) => x === "noVisibleGroups")
    ) {
      groupsList.innerHTML = `<p class="main__groupsListTitle">Groups</p>`;
      setupFile.groups.forEach((group) => {
        firstGroup = true;
        addGroup(group.groupName, group.groupColor);
      });
    } else {
      setup.groups = setupFile.groups;
    }
  }

  // add border color change to every group field
  document.querySelectorAll(".main__groupColor").forEach((color) => {
    color.addEventListener("input", (e) => {
      const data = e.target.value;
      if (data.length === 4 || (data.length === 7 && data.charAt(0) === "#")) {
        e.target.style.border = `1px solid ${data}`;
      }
    });
  });

  handleChange();
  addRemoveFuncFields();
  addRemoveFuncGroups();
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

const handleFocus = () => {
  const fields = document.querySelectorAll("input[type=text]");
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
  // check if it's the first field
  if (!firstField) {
    fieldsList.innerHTML = `<p class="main__fieldsListTitle">Fields</p>`;
    firstField = true;
  }
  fieldsList.insertAdjacentHTML(
    "beforeend",
    `
    <div class="main__field">
      <input class="main__fieldName" type="text" value="${value}" placeholder="${placeholder}" value="">
      <button class="main__removeFieldButton" tabindex="-1">Remove field</button>
    </div>
    `
  );

  setup.fields.push(value);

  handleChange();
  addRemoveFuncFields();
  handleFocus();
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

const addGroup = (groupName = "", groupColor = "") => {
  // check if it's the first group field
  if (!firstGroup) {
    groupsList.innerHTML = `<p class="main__groupsListTitle">Groups</p>`;
    firstGroup = true;
  }
  setup.groups.push({
    groupName: groupName,
    groupColor: groupColor,
  });
  groupsList.insertAdjacentHTML(
    "beforeend",
    `
    <div class="main__group">
      <input class="main__groupName" type="text" placeholder="Group name" value="${groupName}">
      <input class="main__groupColor" type="text" placeholder="Group color(hex)" style="border: 1px solid ${
        groupColor === "" ? "#FFFFFF" : groupColor
      }" value="${groupColor === "" ? "#FFFFFF" : groupColor}">
      <button class="main__removeGroupButton" tabindex="-1">Remove group</button>
    </div>
    `
  );
  // adding dynamic group color border change
  document.querySelectorAll(".main__groupColor").forEach((color) => {
    color.addEventListener("input", (e) => {
      const data = e.target.value;
      if (data.length === 4 || (data.length === 7 && data.charAt(0) === "#")) {
        e.target.style.border = `1px solid ${data}`;
      }
    });
  });

  handleChange();
  addRemoveFuncGroups();
  handleFocus();
};

// event listener adding

// adding functionality to titlebar close and minimize buttons
window.addEventListener("DOMContentLoaded", () => {
  const minimizeButton = document.querySelector(".navBar__minimizeButton");
  const closeButton = document.querySelector(".navBar__closeButton");

  minimizeButton.addEventListener("click", () => {
    ipcRenderer.send("min");
  });

  closeButton.addEventListener("click", () => {
    remove("assets/temp");
    ipcRenderer.send("close");
  });

  closeResultsButton.addEventListener("click", () => {
    results.style.left = "100%";
    blur.style.left = "100%";
  });

  if (!exists("config.json")) {
    config = {
      theme: "default",
      noAnim: false,
      keyBindings: {
        addGroup: "g",
        addField: "f",
      },
    };
    write("config.json", config);
  } else {
    config = read("config.json", "json");
  }
});

// key bindings
window.addEventListener("keyup", (e) => {
  if (inputFocused) return;

  switch (e.key.toLowerCase()) {
    case config.keyBindings.addGroup: {
      addGroup();
      break;
    }
    case config.keyBindings.addField: {
      addField();
      break;
    }
    case config.keyBindings.randomize: {
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

// adding group field
addGroupButton.addEventListener("click", () => {
  addGroup();
});

// adding field field
addFieldButton.addEventListener("click", () => {
  addField();
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

ipcRenderer.on("updateReady", (e, message) => {
  Toastify({
    text: "New update ready, click to restart!",
    duration: -1,
    className: "main__updateToast",
    gravity: "top",
    position: "left",
    stopOnFocus: true,
    close: true,
    offset: {
      y: 10,
    },
    style: {
      background: "#0055FF",
      maxWidth: "400px",
    },
    onClick: () => {
      ipcRenderer.send("quitAndInstall");
    },
  }).showToast();
});
