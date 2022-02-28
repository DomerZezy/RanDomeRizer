const { remove, write } = require("fs-jetpack");

console.log("renderer loaded");

const addFieldButton = document.querySelector(".main__addFieldButton");
const addGroupButton = document.querySelector(".main__addGroupButton");
const groupsList = document.querySelector(".main__groupsList");
const fieldsList = document.querySelector(".main__fieldsList");
const randomizeButton = document.querySelector(".main__randomizeButton");
const results = document.querySelector(".main__results");

addGroupButton.addEventListener("click", () => {
  groupsList.innerHTML += `
  <div class="main__group">
    <input class="main__groupName" type="text" placeholder="Group name">
    <input class="main__groupColor" type="text" placeholder="Group color(hex) ex. #FF0000 for red">
    <button class="main__removeGroupButton">Remove group</button>
  </div>
  `;
  document.querySelectorAll(".main__removeGroupButton").forEach((button) => {
    button.addEventListener("click", (e) => {
      e.target.parentNode.remove();
    });
  });
});

addFieldButton.addEventListener("click", () => {
  fieldsList.innerHTML += `
  <div class="main__field">
    <input class="main__fieldName" type="text" placeholder="Field name">
    <button class="main__removeFieldButton">Remove field</button>
  </div>
  `;
  document.querySelectorAll(".main__removeFieldButton").forEach((button) => {
    button.addEventListener("click", (e) => {
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

  console.log(fields);
  console.log(groups);
  console.log(data);

  remove("lastSetup.json");

  write("lastSetup.json", data);

  const usedNumbers = [];
  const resultsList = [];

  for (let i = 0; i < fields.length; i++) {
    let done = false;
    for (let j = 0; j < groups.length; j++) {
      while (!done) {
        const randomNumber = Math.floor(Math.random() * fields.length);
        if (!usedNumbers.some(randomNumber)) {
          usedNumbers.push(randomNumber);
          const result = "";
        }
      }
    }
  }
});
