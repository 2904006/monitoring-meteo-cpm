package com.meteo.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/stats")
@CrossOrigin(origins = "*")
public class StatsController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @GetMapping("/mensuel/{annee}/{mois}")
    public List<Map<String, Object>> getStatsMensuelles(
            @PathVariable int annee,
            @PathVariable int mois) {

        // Format les dates (ex: 2026-05-01)
        String moisStr = String.format("%02d", mois);
        String dateDebut = annee + "-" + moisStr + "-01";

        // Calculer le dernier jour du mois
        String sqlLastDay = "SELECT strftime('%d', date(?, '+1 month', '-1 day'))";
        String dernierJourStr = jdbcTemplate.queryForObject(sqlLastDay, String.class, dateDebut);
        int dernierJour = Integer.parseInt(dernierJourStr);
        String dateFin = annee + "-" + moisStr + "-" + dernierJour;

        // Requête pour les statistiques par opérateur
        String sql = """
            SELECT 
                o.id,
                o.nom, 
                o.prenom,
                COUNT(t.id) as total,
                SUM(CASE WHEN t.etat = 'A_LEURE' THEN 1 ELSE 0 END) as bien_transmis,
                SUM(CASE WHEN t.etat = 'RETARD' THEN 1 ELSE 0 END) as transmis_retard,
                SUM(CASE WHEN t.etat = 'NON_TRANSMIS' THEN 1 ELSE 0 END) as non_transmis
            FROM operateurs o
            LEFT JOIN transmissions t ON t.operateur_id = o.id 
                AND t.date_transmission BETWEEN ? AND ?
            GROUP BY o.id
            ORDER BY o.nom
        """;

        List<Map<String, Object>> results = jdbcTemplate.queryForList(sql, dateDebut, dateFin);

        // Calculer le taux de conformité pour chaque opérateur
        for (Map<String, Object> op : results) {
            int total = op.get("total") != null ? ((Number) op.get("total")).intValue() : 0;
            int bienTransmis = op.get("bien_transmis") != null ? ((Number) op.get("bien_transmis")).intValue() : 0;
            double taux = total > 0 ? (bienTransmis * 100.0 / total) : 0;
            op.put("taux_conformite", Math.round(taux * 100.0) / 100.0);
        }

        return results;
    }
}