const { Menu } = require("electron");

module.exports = function CreateMenu(createMusicFolderWindow) {
  return Menu.buildFromTemplate([
    {
      label: "Action",
      submenu: [
        { label: "Music Folders", click: () => createMusicFolderWindow() },
      ],
    },
  ]);
};
