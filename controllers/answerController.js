const db = require("../config/db");
const { talentResults } = require("../constants/talentResults");

module.exports.submitResponse = (req, res) => {
  const { identity, answerArray } = req.body;
  
  if (!identity || !identity.fullName) {
    return res.status(400).json({ message: "Identity data missing." });
  }

  console.log(">>> Received answerArray:", answerArray);

  // 🔹 Grup berdasarkan kategori
  const grouped = {};
  answerArray.forEach((ans) => {
    const category = ans.category;
    const value = Number(ans.value);
    if (!grouped[category]) grouped[category] = [];
    grouped[category].push(value);
  });

  // 🔹 Hitung rata-rata per kategori × 20 biar jadi 0–100
  const results = Object.keys(grouped).map((category) => {
    const sum = grouped[category].reduce((a, b) => a + b, 0);
    const avg = sum / grouped[category].length;
    const percentage = avg * 20;
    return { category, percentage };
  });

  // 🔹 Urutkan hasil (descending)
  results.sort((a, b) => b.percentage - a.percentage);

  // 🔹 Ambil 3 teratas
  const top3 = results.slice(0, 3);

  // 🔹 Tambahkan deskripsi & rekomendasi dari constants
  const detailed = results.map((r) => {
    const info = talentResults.find((t) => t.category === r.category);
    return {
      category: r.category,
      subtitle: info ? info.subtitle : null,
      percentage: Math.round(r.percentage),
      description: info ? info.description : null,
      recommendation: info ? info.recommendation : [],
    };
  });

  // 🔹 Siapkan data JSON untuk disimpan
  const jsonIdentity = JSON.stringify(identity);
  const jsonAnswers = JSON.stringify(answerArray);
  const jsonResults = JSON.stringify(detailed);

  // 🔹 Simpan responses dulu
  db.query("INSERT INTO responses (response_data, identity) VALUES (?, ?)", [jsonAnswers, jsonIdentity] , (err, respRes) => {
    if (err) {
      console.error("Error saving responses:", err);
      return res.status(500).json({ message: "Error saving responses" });
    }

    const responseId = respRes.insertId;

    // 🔹 Baru simpan hasil analisis ke tabel results
    db.query("INSERT INTO results (response_id, result_data) VALUES (?, ?)", [responseId, jsonResults], (err2, dbResult) => {
      if (err2) {
        console.error("Error saving to DB (results):", err2);
        return res.status(500).json({ message: "Error saving results" });
      }

      console.log("Results saved with ID:", dbResult.insertId);

      // 🔹 Kirim hasil ke frontend
      res.status(200).json({
        message: "Talent Mapping results successfully processed",
        data: detailed,
        top3: top3,
        response_id: responseId,
      });
    });
  });
};

// 🔹 Ambil hasil terakhir
module.exports.getResults = (req, res) => {
  const query = `
    SELECT r.id, r.result_data, re.response_data, re.identity, r.created_at
    FROM results r
    JOIN responses re ON r.response_id = re.id
    ORDER BY r.id DESC
    LIMIT 1
  `;

  db.query(query, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    if (rows.length === 0) {
      return res.status(404).json({ message: "No results found" });
    }

    const resultRow = rows[0];
    // ✅ cek dulu apakah sudah objek atau masih string
    const resultData =
      typeof resultRow.result_data === "string"
        ? JSON.parse(resultRow.result_data)
        : resultRow.result_data;

    const responseData =
      typeof resultRow.response_data === "string"
        ? JSON.parse(resultRow.response_data)
        : resultRow.response_data;
    
    const identityData =
    typeof resultRow.identity === "string"
    ? JSON.parse(resultRow.identity)
    : resultRow.identity;

    res.status(200).json({
      message: "Latest Talent Mapping result fetched successfully",
      identity: identityData,
      result: resultData,
      responses: responseData,
      created_at: resultRow.created_at,
    });
  });
};