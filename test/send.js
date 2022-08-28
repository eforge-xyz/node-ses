require("dotenv").config();
const http = require("http");

const jwt = require("jsonwebtoken");
const token = jwt.sign({ method: "send" }, process.env.CLIENT_SECRET, {
  algorithm: "HS256",
  header: { typ: "JWT", kid: process.env.CLIENT_ID },
});
const postData = JSON.stringify({
  to: "avinash.s.karanth@gmail.com",
  from: "no-reply@eforge.xyz",
  subject: "Test Email",
  message: "your <b>message</b> goes here",
  altText: "plain text message hear",
});
const options = {
  hostname: "localhost",
  port: process.env.PORT,
  path: "/send",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": postData.length,
    Authorization: "Bearer " + token,
  },
};
const req = http.request(options, (res) => {
  console.log("statusCode:", res.statusCode);
  console.log("headers:", res.headers);
  res.on("data", (d) => {
    process.stdout.write(d);
  });
});
req.on("error", (e) => {
  console.error(e);
});
req.write(postData);
req.end();
