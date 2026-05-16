package com.meteo.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import java.time.LocalDate;
import java.util.List;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class DashboardController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @GetMapping("/dashboard")
    public Map<String, Object> getDashboard() {
        LocalDate today = LocalDate.now();
        LocalDate sevenDaysAgo = today.minusDays(7);

        // Calculer le total des 7 derniers jours
        String sqlTotal = "SELECT COUNT(*) FROM transmissions WHERE date_transmission BETWEEN ? AND ?";
        int total = jdbcTemplate.queryForObject(sqlTotal, Integer.class, sevenDaysAgo, today);

        // Calculer les transmissions à l'heure
        String sqlHeure = "SELECT COUNT(*) FROM transmissions WHERE date_transmission BETWEEN ? AND ? AND etat = 'A_LEURE'";
        int aLeure = jdbcTemplate.queryForObject(sqlHeure, Integer.class, sevenDaysAgo, today);

        // Calculer les retards
        String sqlRetard = "SELECT COUNT(*) FROM transmissions WHERE date_transmission BETWEEN ? AND ? AND etat = 'RETARD'";
        int retard = jdbcTemplate.queryForObject(sqlRetard, Integer.class, sevenDaysAgo, today);

        // Calculer les non transmis
        String sqlNonTransmis = "SELECT COUNT(*) FROM transmissions WHERE date_transmission BETWEEN ? AND ? AND etat = 'NON_TRANSMIS'";
        int nonTransmis = jdbcTemplate.queryForObject(sqlNonTransmis, Integer.class, sevenDaysAgo, today);

        Map<String, Object> total7Jours = new HashMap<>();
        total7Jours.put("total", total);
        total7Jours.put("a_leure", aLeure);
        total7Jours.put("retard", retard);
        total7Jours.put("non_transmis", nonTransmis);

        // Performance par opérateur
        String sqlPerf = """
            SELECT o.nom, o.prenom, 
                   COUNT(t.id) as total,
                   SUM(CASE WHEN t.etat = 'A_LEURE' THEN 1 ELSE 0 END) as a_leure,
                   ROUND(100.0 * SUM(CASE WHEN t.etat = 'A_LEURE' THEN 1 ELSE 0 END) / COUNT(t.id), 2) as taux
            FROM transmissions t
            JOIN operateurs o ON t.operateur_id = o.id
            WHERE t.date_transmission BETWEEN ? AND ?
            GROUP BY o.id
            ORDER BY taux DESC
        """;

        List<Map<String, Object>> performanceOperateurs = jdbcTemplate.queryForList(sqlPerf, sevenDaysAgo, today);

        // Historique quotidien
        String sqlHist = """
            SELECT date_transmission as date,
                   COUNT(*) as total,
                   SUM(CASE WHEN etat = 'A_LEURE' THEN 1 ELSE 0 END) as a_leure,
                   SUM(CASE WHEN etat = 'RETARD' THEN 1 ELSE 0 END) as retard
            FROM transmissions
            WHERE date_transmission BETWEEN ? AND ?
            GROUP BY date_transmission
            ORDER BY date_transmission
        """;

        List<Map<String, Object>> historiqueQuotidien = jdbcTemplate.queryForList(sqlHist, sevenDaysAgo, today);

        return Map.of(
                "total7Jours", total7Jours,
                "performanceOperateurs", performanceOperateurs,
                "historiqueQuotidien", historiqueQuotidien
        );
    }
}