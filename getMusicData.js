const mm = require("music-metadata");
const sharp = require("sharp");
const fsExtra = require("fs-extra");
const fsPromises = require("node:fs/promises");
const path = require("path");

exports.getMusicData = async function (dirs) {
  const musicFilesList = await getMusicFilesList(dirs);
  const albumArts = [];
  const outputFilePath = `${__dirname}/img/temp/album-arts`;

  const promises = musicFilesList.map(async (file) => {
    albumArts.push(await extractAlbumArt(file, outputFilePath));
  });

  await Promise.all(promises);
  return albumArts;
};

async function getMusicFilesList(dirs) {
  const musicFiles = [];
  const formats = [".mp3", ".wav"];

  const promises = dirs.map(async (dir) => {
    try {
      const files = await fsPromises.readdir(dir);
      files.forEach((file) =>
        formats.includes(path.extname(`${dir}/${file}`.toLowerCase()))
          ? musicFiles.push(`${dir}\\${file}`)
          : ""
      );
    } catch (error) {
      console.log(error);
    }
  });

  await Promise.all(promises);
  return musicFiles;
}

async function extractAlbumArt(musicFilePath, outputDir) {
  try {
    // Read the metadata from the music file
    const metadata = await mm.parseFile(musicFilePath);
    const picture = metadata.common.picture;

    if (picture && picture.length > 0) {
      // Use the first embedded picture
      const albumArt = picture[0];

      const outputFileName =
        path.basename(musicFilePath, path.extname(musicFilePath)) + ".jpeg";
      const outputFilePath = path.join(outputDir, outputFileName);

      // Ensure the output directory exists
      await fsExtra.ensureDir(outputDir);

      // Convert the album art to JPEG and save it
      await sharp(albumArt.data).jpeg().toFile(outputFilePath);

      console.log(`Album art extracted and saved to ${outputFilePath}`);
      return {
        file: musicFilePath,
        img: outputFilePath,
        title: musicFilePath.split("\\")[musicFilePath.split("\\").length - 1],
      };
    } else {
      console.log("No album art found in the music file.");
      return {
        file: musicFilePath,
        img: "D:\\orbit\\img\\thumbnail.jpg",
        title: musicFilePath.split("\\")[musicFilePath.split("\\").length - 1],
      };
    }
  } catch (error) {
    console.error("Error extracting album art:", error.message);
  }
}
