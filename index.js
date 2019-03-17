const express = require("express");
const path = require("path");
const logger = require("morgan");
const bodyParser = require("body-parser");
const redis = require("redis");

const app = express();

const client = redis.createClient();

client.on("connect", () => {
  console.log("Redis Server Connected");
});

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(bodyParser.json({ extended: false }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  let title = "Task list";
  client.LRANGE("tasks", 0, -1, (err, tasks) => {
    client.hgetall("call", (err, call) => {
      res.render("index", {
        title,
        tasks,
        call
      });
    });
  });
});

app.post("/task/add", (req, res) => {
  const task = req.body.task;
  client.RPUSH("tasks", task, (err, data) => {
    if (err) {
      console.log(err);
    } else {
      console.log("Task added");
    }
    res.redirect("/");
  });
});

app.post("/task/delete", (req, res) => {
  const tasks = req.body.tasks;
  client.LRANGE("tasks", 0, -1, (err, data) => {
    for (let task of data) {
      if (tasks.indexOf(task) > -1) {
        client.lrem("tasks", 0, task, (err, data) => {
          if (err) {
            console.log(err);
          }
        });
      }
    }
    res.redirect("/");
  });
});

app.post("/call/add", (req, res) => {
  var newCall = {};

  newCall.name = req.body.name;
  newCall.company = req.body.company;
  newCall.phone = req.body.phone;
  newCall.time = req.body.time;
  client.hmset(
    "call",
    [
      "name",
      newCall.name,
      "company",
      newCall.company,
      "phone",
      newCall.phone,
      "time",
      newCall.time
    ],
    (err, data) => {
      if (err) {
        console.log(err);
      }
      console.log(data);
      res.redirect("/");
    }
  );
});

app.listen(3000);
console.log("Server running on port 3000");

module.exports = app;
