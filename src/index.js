require("dotenv").config();
const fs = require("fs");
const express = require("express");
const jwt = require("jsonwebtoken");
const app = express();
const bodyParser = require("body-parser");
const { parseString } = require("xml2js");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({ limit: "64mb" }));
const PORT = process.env.PORT || 1465;

let credentials = {};
if (fs.existsSync("./client.json")) {
  credentials = require("./client.json");
} else {
  const CLIENT_ID = process.env.CLIENT_ID || "";
  const CLIENT_SECRET = process.env.CLIENT_SECRET || "";
  if (CLIENT_ID !== "" && CLIENT_SECRET !== "") {
    credentials[CLIENT_ID] = CLIENT_SECRET;
  }
}
const authorizeJWT = function (req, res, next) {
  if (!req.headers.hasOwnProperty("authorization")) {
    res.status(401).send({ message: "Authorization Bearer Token is required" });
  }
  if (!req.headers.authorization.startsWith("Bearer ")) {
    res.status(401).send({ message: "Authorization Bearer Token is required" });
  }
  let token = req.headers.authorization
    .toString()
    .replace("Bearer ", "")
    .trim();
  let kid = "";
  try {
    kid = JSON.parse(Buffer.from(token.toString().split(".")[0], "base64"))[
      "kid"
    ];
  } catch (err) {
    res
      .status(401)
      .send({ message: "kid must be passed in the JsonWebToken header" });
  }
  jwt.verify(token, credentials[kid], function (err, decoded) {
    if (err || decoded === undefined) {
      res.status(401).send({ message: "Unauthorized" });
    } else {
      try {
        if (Math.abs(decoded.iat - new Date().getTime() / 1000) < 300) {
          next();
        } else {
          res.status(401).send({ message: "Token Expired" });
        }
      } catch (_err) {
        res.status(401).send({ message: "Invalid Token" });
      }
    }
  });
};
app.use(authorizeJWT);
const ses = require("node-ses"),
  client = ses.createClient({
    key: process.env.AWS_SES_KEY,
    secret: process.env.AWS_SES_SECRET,
    amazon: process.env.AWS_SES_REGION,
  });
app.post("/send", (req, resp) => {
  client.sendEmail(req.body, function (err, data, _res) {
    if (err) {
      resp.send(err);
    } else {
      parseString(data, function (xmlerr, results) {
        if (xmlerr) {
          resp.send(err);
        }
        resp.send(results);
      });
    }
  });
});
app.listen(PORT, () => {
  console.log(`Node SES listening on https://localhost:${PORT}`);
});
