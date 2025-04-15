const express = require("express");
const app = express();
const router = require("./src/router");
const morgan = require("morgan");
const port = process.env.PORT || 6969;
const validJson = require("./src/middleware/errorHandler");
require("dotenv").config();
const cors = require("cors");
const path = require("path");
app.use(express.static(path.join(__dirname, "public")));

app.use(
  //Solo respondo peticiones provenientes de origin
  cors({
    origin: process.env.VITE_APP_HOST,
  })
);
app.use(express.json());
// esto es para ver logs http en la terminal
app.use(morgan("dev"));

app.use("/", router);

app.use((err, req, res, next) => {
  /*Valida si en el body de la peticion existe un json valido*/
  validJson(err, res);
});

app.listen(port, function () {
  console.log(`App Runnin in: http://localhost:${port}`);
});
