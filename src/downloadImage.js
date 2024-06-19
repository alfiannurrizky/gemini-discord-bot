import request from "request";
import fs from "fs";

export const downloadImage = (imageUrl, imagePath) => {
  return new Promise((resolve, reject) => {
    request
      .get(imageUrl)
      .on("error", reject)
      .pipe(fs.createWriteStream(imagePath))
      .on("finish", resolve);
  });
};
