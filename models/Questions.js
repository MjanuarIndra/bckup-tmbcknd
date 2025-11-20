// models/Questions.js
const db = require("../config/db"); // koneksi MySQL dari db.js

const Questions = {
  insertMany: (data, callback) => {
    const sql = "INSERT INTO questions (no, text, trait, reversed) VALUES ?";
    const values = data.map(q => [q.no, q.text, q.trait, q.reversed]);
    db.query(sql, [values], callback);
  },

  find: (callback) => {
    const sql = "SELECT * FROM questions";
    db.query(sql, callback);
  }
};

module.exports = Questions;
