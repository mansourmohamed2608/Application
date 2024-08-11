const express = require("express");
const fs = require("fs");
const app = express();

app.post("/upload", (req, res) => {
  const fileStream = fs.createWriteStream("./uploads/testfile");

  req.pipe(fileStream);

  req.on("end", () => {
    res.status(200).send("File uploaded");
  });

  req.on("error", (err) => {
    console.error("Stream Error:", err);
    res.status(500).send("Upload failed");
  });
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
