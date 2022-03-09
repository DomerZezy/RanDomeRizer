const { remove, write, exists, read, file } = require("fs-jetpack");
const { ipcRenderer } = require("electron"); // needed since remote module got deprecated
const Toastify = require("toastify-js");
const ColorPicker = require("simple-color-picker");
const AdmZip = require("adm-zip");

const colorPicker = new ColorPicker({
  color: "#000000",
  el: document.querySelector(".main__pickerScreen"),
});

// gather all necessary elements
const addFieldButton = document.querySelector(".main__addFieldButton");
const addGroupButton = document.querySelector(".main__addGroupButton");
const groupsList = document.querySelector(".main__groupsList");
const fieldsList = document.querySelector(".main__fieldsList");
const randomizeButton = document.querySelector(".main__randomizeButton");
const results = document.querySelector(".main__results");
const blur = document.querySelector(".main__blur");
const loadSetupButton = document.querySelector(".main__loadSetupButton");
const saveSetupButton = document.querySelector(".main__saveSetupButton");
const loadLastResultsButton = document.querySelector(
  ".main__loadLastResultButton"
);
const loadThemeButton = document.querySelector(".main__loadThemeButton");

// toast template
// Toastify({
//   text: "test toast",
//   duration: 2000,
//   newWindow: true,
//   close: true,
//   gravity: "top",
//   position: "left",
//   stopOnFocus: true,
// }).showToast();

// for displaying "Groups" and "Fields" after adding fields (those titles shouldn't show multiple times)
let firstGroup = false;
let firstField = false;

// rendering results
const renderResults = (resultsList, groups) => {
  results.style.left = "10%";
  blur.style.left = "0";
  groups.forEach((group) => {
    results.innerHTML += `<h2 class="main__resultsTitle" style="color: ${group.groupColor};">${group.groupName}</h2>`;
    resultsList.forEach((result) => {
      if (result.group.groupName === group.groupName)
        results.innerHTML += `<p class="main__resultsResult">${result.field}</p>`;
    });
  });
};

//gathering data from inputs (for randomization and saving setups)
const gatherData = () => {
  const fields = [];
  const groups = [];
  const allFields = document.querySelectorAll(".main__field");
  const allGroups = document.querySelectorAll(".main__group");

  // gather data from inputs
  allFields.forEach((field) => {
    fields.push(field.querySelector(".main__fieldName").value);
  });
  allGroups.forEach((group) => {
    const groupData = {
      groupName: group.querySelector(".main__groupName").value,
      groupColor:
        group.querySelector(".main__groupColor").value === ""
          ? "#000000"
          : group.querySelector(".main__groupColor").value,
    };
    groups.push(groupData);
  });
  return {
    type: "RanDomeRizerSetup",
    fields: fields,
    groups: groups,
  };
};

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
});

// loading last results (might remove or replace with manual loading/saving)
loadLastResultsButton.addEventListener("click", () => {
  if (exists("results/lastRandomize.json")) {
    const data = read("results/lastRandomize.json", "json");
    const groups = [];

    data.forEach((piece) => {
      if (!groups.some((x) => x.groupName === piece.group.groupName)) {
        groups.push({
          groupName: piece.group.groupName,
          groupColor: piece.group.groupColor,
        });
      }
    });
    renderResults(data, groups);
  }
});

// adding group field
addGroupButton.addEventListener("click", () => {
  // check if it's the first group field
  if (!firstGroup) {
    groupsList.innerHTML = `<p class="main__groupsListTitle">Groups</p>`;
    firstGroup = true;
  }
  groupsList.insertAdjacentHTML(
    "beforeend",
    `
    <div class="main__group">
      <input class="main__groupName" type="text" placeholder="Group name" value="">
      <input class="main__groupColor" type="text" placeholder="Group color(hex)" value="">
      <button class="main__removeGroupButton">Remove group</button>
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

  // adding remove group function
  document.querySelectorAll(".main__removeGroupButton").forEach((button) => {
    button.addEventListener("click", (e) => {
      if (document.querySelectorAll(".main__group").length === 1) {
        firstGroup = false;
        document.querySelector(".main__groupsListTitle").remove();
      }
      e.target.parentNode.remove();
    });
  });
});

//TODO change that field name
// adding field field
addFieldButton.addEventListener("click", () => {
  // check if it's the first field
  if (!firstField) {
    fieldsList.innerHTML = `<p class="main__fieldsListTitle">Fields</p>`;
    firstField = true;
  }
  fieldsList.insertAdjacentHTML(
    "beforeend",
    `
  <div class="main__field">
    <input class="main__fieldName" type="text" placeholder="Field name" value="">
    <button class="main__removeFieldButton">Remove field</button>
  </div>
  `
  );
  // adding remove field function
  document.querySelectorAll(".main__removeFieldButton").forEach((button) => {
    button.addEventListener("click", (e) => {
      if (document.querySelectorAll(".main__field").length === 1) {
        firstField = false;
        document.querySelector(".main__fieldsListTitle").remove();
      }
      e.target.parentNode.remove();
    });
  });
});

//save randomization setup to JSON file
saveSetupButton.addEventListener("click", async () => {
  const inputData = gatherData();
  const filePathData = await ipcRenderer.invoke("saveSetupFile");
  if (filePathData.canceled) return;

  const filePath = filePathData.filePath;
  console.log(filePath);
  if (exists(filePath)) {
    remove(filePath);
    write(filePath, inputData);
  } else {
    write(filePath, inputData);
  }
});

//load randomization setup from JSON file
loadSetupButton.addEventListener("click", async () => {
  //TODO add some way to validate JSON file, maybe a field like
  //type: "ranDomeRizerSetup" or smth

  // show file prompt to user and get file data
  const file = await ipcRenderer.invoke("openSetupFile");
  // if user canceled file selection, do nothing
  if (file.canceled) return;
  // else get file path (multiSelection is off, so only index 0 is needed)
  const filePath = file.filePaths[0];
  // console.log(filePath.split("\\").pop().join("\\"));

  // check if file exists, just in case
  if (exists(filePath)) {
    const setup = read(filePath, "json");
    if (!setup.type || !setup.type === "ranDomeRizerSetup") {
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

    // reset main window content
    fieldsList.innerHTML = `<p class="main__fieldsListTitle">Fields</p>`;
    groupsList.innerHTML = `<p class="main__groupsListTitle">Groups</p>`;

    // render fields
    setup.fields.forEach((field) => {
      firstField = true;
      fieldsList.insertAdjacentHTML(
        "beforeend",
        `
        <div class="main__field">
          <input class="main__fieldName" type="text" placeholder="Field name" value="${field}">
          <button class="main__removeFieldButton">Remove field</button>
        </div>
      `
      );
    });

    // render groups
    setup.groups.forEach((group) => {
      firstGroup = true;
      groupsList.insertAdjacentHTML(
        "beforeend",
        `
        <div class="main__group">
          <input class="main__groupName" type="text" placeholder="Group name" value="${group.groupName}">
          <input class="main__groupColor" type="text" style="border: 1px solid ${group.groupColor}" placeholder="Group color(hex)" value="${group.groupColor}">
          <button class="main__removeGroupButton">Remove group</button>
        </div>
        `
      );
    });
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

  // add remove function to every field field(I need to change that)
  document.querySelectorAll(".main__removeFieldButton").forEach((button) => {
    button.addEventListener("click", (e) => {
      if (document.querySelectorAll(".main__field").length === 1) {
        firstField = false;
        document.querySelector(".main__fieldsListTitle").remove();
      }
      e.target.parentNode.remove();
    });
  });

  // add remove function to every group field
  document.querySelectorAll(".main__removeGroupButton").forEach((button) => {
    button.addEventListener("click", (e) => {
      if (document.querySelectorAll(".main__group").length === 1) {
        firstGroup = false;
        document.querySelector(".main__groupsListTitle").remove();
      }
      e.target.parentNode.remove();
    });
  });
});

//randomization
randomizeButton.addEventListener("click", () => {
  const inputData = gatherData();

  const groups = inputData.groups;
  const fields = inputData.fields;

  const data = {
    fields: fields,
    groups: groups,
  };

  //remove lastSetup file to write a new one (and to avoid appending)
  remove("setups/lastSetup.json");
  write("setups/lastSetup.json", data);

  // randomization algorithm
  const usedNumbers = [];
  const resultsList = [];
  for (let i = 0; i < groups.length; i++) {
    for (let j = 0; j < Math.ceil(fields.length / groups.length); j++) {
      let done = false;
      while (!done) {
        const randomNumber = Math.floor(Math.random() * fields.length);
        if (usedNumbers.length === fields.length) {
          done = true;
          continue;
        }
        if (!usedNumbers.some((x) => x === randomNumber)) {
          usedNumbers.push(randomNumber);
          const result = {
            group: groups[i],
            field: fields[randomNumber],
          };
          resultsList.push(result);
          done = true;
        }
      }
    }
  }

  // remove lastRandomization file to write a new one (and to avoid appending)
  remove("results/lastRandomize.json");
  write("results/lastRandomize.json", resultsList);

  renderResults(resultsList, groups);
});

// load theme
loadThemeButton.addEventListener("click", async () => {
  const file = await ipcRenderer.invoke("openThemeFile");
  if (file.canceled) return;

  const filePath = file.filePaths[0];

  if (exists(filePath)) {
    const tempFolderPath = "./assets/temp";
    const themeFolderPath =
      tempFolderPath +
      filePath.substring(filePath.lastIndexOf("\\"), filePath.lastIndexOf("."));
    const zip = new AdmZip(filePath);
    console.log(filePath, tempFolderPath, themeFolderPath);
    await zip.extractAllTo(tempFolderPath);

    const config = read(themeFolderPath + "/config.json", "json");
    console.log(config);

    if (!config.type || config.type !== "randomerizerThemeConfig") {
      Toastify({
        text: "Error loading theme!",
        duration: 3000,
        close: true,
        gravity: "top",
        position: "left",
        stopOnFocus: true,
        style: {
          background: "#FF0000",
          maxWidth: "250px",
        },
      }).showToast();
      return;
    }
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.type = "text/css";
    link.href = themeFolderPath + "/" + config.styleFileName;
    await document.querySelector("head").appendChild(link);
  }
});
