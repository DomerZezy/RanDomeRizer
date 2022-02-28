console.log("renderer loaded");

let addFieldButton;
const addGroupButton = document.querySelector(".main__addGroupButton");
const list = document.querySelector(".main__list");
const randomizeButton = document.querySelector(".main__randomizeButton");

addGroupButton.addEventListener("click", () => {
  fieldsList.innerHTML += `
  <div class="main__group">
    <input class="main__groupName" type="text" placeholder="Group name">
    <input class="main__groupColor" type="text" placeholder="Group color(hex)">
    <button class="main__removeGroupButton">Remove group</button>
    <button class="main__addFieldButton">Add field</button>
  </div>
  `;
  addFieldButtons = document.querySelectorAll(".main__addFieldButton");
});
