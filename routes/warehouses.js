// Récupérer tous les entrepôts (potentiellement filtrés par company_id)
router.get("/", async (req, res) => {
  const { company_id, status } = req.query;

  let query =
    "SELECT w.*, c.name as company_name FROM warehouses w LEFT JOIN companies c ON w.company_id = c.id WHERE 1=1";
  const params = [];

  if (company_id) {
    query += " AND w.company_id = ?";
    params.push(company_id);
  }

  if (status) {
    query += " AND w.status = ?";
    params.push(status);
  }

  query += " ORDER BY w.created_at DESC";

  try {
    const [warehouses] = await db.query(query, params);
    res.json(warehouses);
  } catch (err) {
    console.error("Erreur lors de la récupération des entrepôts:", err);
    res
      .status(500)
      .json({
        error: "Erreur serveur lors de la récupération des entrepôts.",
        details: err.message,
      });
  }
});
