const { remove, write, exists, read } = require("fs-jetpack");
const { remote } = require("electron");

const addFieldButton = document.querySelector(".main__addFieldButton");
const addGroupButton = document.querySelector(".main__addGroupButton");
const groupsList = document.querySelector(".main__groupsList");
const fieldsList = document.querySelector(".main__fieldsList");
const randomizeButton = document.querySelector(".main__randomizeButton");
const results = document.querySelector(".main__results");
const blur = document.querySelector(".main__blur");
const loadLastSetupButton = document.querySelector(
  ".main__loadLastSetupButton"
);
const loadLastResultsButton = document.querySelector(
  ".main__loadLastResultButton"
);

let firstGroup = false;
let firstField = false;

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

loadLastResultsButton.addEventListener("click", () => {
  if (exists("lastRandomize.json")) {
    const data = read("lastRandomize.json", "json");
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

addGroupButton.addEventListener("click", () => {
  if (!firstGroup) {
    groupsList.innerHTML = `<p class="main__groupsListTitle">Groups</p>`;
    firstGroup = true;
  }
  groupsList.innerHTML += `
  <div class="main__group">
    <input class="main__groupName" type="text" placeholder="Group name">
    <input class="main__groupColor" type="text" placeholder="Group color(hex)">
    <button class="main__removeGroupButton">Remove group</button>
  </div>
  `;
  document.querySelectorAll(".main__groupColor").forEach((color) => {
    color.addEventListener("input", (e) => {
      const data = e.target.value;
      if (data.length === 4 || (data.length === 7 && data.charAt(0) === "#")) {
        e.target.style.border = `1px solid ${data}`;
      }
    });
  });

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

addFieldButton.addEventListener("click", () => {
  if (!firstField) {
    fieldsList.innerHTML = `<p class="main__fieldsListTitle">Fields</p>`;
    firstField = true;
  }
  fieldsList.innerHTML += `
  <div class="main__field">
    <input class="main__fieldName" type="text" placeholder="Field name">
    <button class="main__removeFieldButton">Remove field</button>
  </div>
  `;
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

loadLastSetupButton.addEventListener("click", () => {
  fieldsList.innerHTML = `<p class="main__fieldsListTitle">Fields</p>`;
  groupsList.innerHTML = `<p class="main__groupsListTitle">Groups</p>`;

  if (exists("lastSetup.json")) {
    const lastSetup = read("lastSetup.json", "json");
    lastSetup.fields.forEach((field) => {
      firstField = true;
      fieldsList.innerHTML += `
        <div class="main__field">
          <input class="main__fieldName" type="text" placeholder="Field name" value="${field}">
          <button class="main__removeFieldButton">Remove field</button>
        </div>
      `;
    });
    lastSetup.groups.forEach((group) => {
      firstGroup = true;
      groupsList.innerHTML += `
        <div class="main__group">
          <input class="main__groupName" type="text" placeholder="Group name" value="${group.groupName}">
          <input class="main__groupColor" type="text" style="border: 1px solid ${group.groupColor}" placeholder="Group color(hex)" value="${group.groupColor}">
          <button class="main__removeGroupButton">Remove group</button>
        </div>
        `;
    });
  }
  document.querySelectorAll(".main__groupColor").forEach((color) => {
    color.addEventListener("input", (e) => {
      const data = e.target.value;
      if (data.length === 4 || (data.length === 7 && data.charAt(0) === "#")) {
        e.target.style.border = `1px solid ${data}`;
      }
    });
  });
  document.querySelectorAll(".main__removeFieldButton").forEach((button) => {
    button.addEventListener("click", (e) => {
      if (document.querySelectorAll(".main__field").length === 1) {
        firstField = false;
        document.querySelector(".main__fieldsListTitle").remove();
      }
      e.target.parentNode.remove();
    });
  });
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

randomizeButton.addEventListener("click", () => {
  const fields = [];
  const groups = [];
  const allFields = document.querySelectorAll(".main__field");
  const allGroups = document.querySelectorAll(".main__group");

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

  const data = {
    fields: fields,
    groups: groups,
  };

  remove("lastSetup.json");

  write("lastSetup.json", data);

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

  remove("lastRandomize.json");
  write("lastRandomize.json", resultsList);

  renderResults(resultsList, groups);
});
