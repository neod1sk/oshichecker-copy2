const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "..", "data", "questions.json");
const data = JSON.parse(fs.readFileSync(file, "utf8"));

data.forEach((q) => {
  (q.options || []).forEach((o) => {
    if (o.scores) {
      Object.keys(o.scores).forEach((k) => {
        o.scores[k] = 1;
      });
    }
    if (o.scoreValue !== undefined) {
      o.scoreValue = 1;
    }
  });
});

fs.writeFileSync(file, JSON.stringify(data, null, 2));
console.log("normalized scores to 1");
