// controllers/questionsController.js
const Questions = require("../models/Questions");
const data = require("../data/data"); // pastikan ini array of questions

module.exports.addQuestion = (req, res) => {
  Questions.insertMany(data, (err, result) => {
    if (err) {
      console.error("Error inserting questions:", err);
      return res.status(500).json({ message: "Internal Server Error" });
    }

    res.status(200).json({ message: "Questions were saved to DB" });
  });
};

module.exports.fetchQuestion = (req, res) => {
  Questions.find((err, rows) => {
    if (err) {
      console.error("Error fetching questions:", err);
      return res.status(500).json({ message: "Internal Server Error" });
    }

    res.status(200).json({
      message: "Questions were fetched from DB",
      data: rows,
    });
  });
};
