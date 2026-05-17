package com.meteo.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class DashboardController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @GetMapping("/dashboard")
    public Map<String, Object> getDashboard() {
        Map<String, Object> response = new HashMap<>();

        String today = LocalDate.now().toString();
        String sevenDaysAgo = LocalDate.now().minusDays(7).toString();

        // Total 7 jours
        String sqlTotal = "SELECT COUNT(*) FROM transmissions WHERE date_transmission >= ?";
        int total = jdbcTemplate.queryForObject(sqlTotal, Integer.class, sevenDaysAgo);

        String sqlHeure = "SELECT COUNT(*) FROM transmissions WHERE date_transmission >= ? AND etat = 'A_LEURE'";
        int aLeure = jdbcTemplate.queryForObject(sqlHeure, Integer.class, sevenDaysAgo);

        String sqlRetard = "SELECT COUNT(*) FROM transmissions WHERE date_transmission >= ? AND etat = 'RETARD'";
        int retard = jdbcTemplate.queryForObject(sqlRetard, Integer.class, sevenDaysAgo);

        String sqlNonTransmis = "SELECT COUNT(*) FROM transmissions WHERE date_transmission >= ? AND etat = 'NON_TRANSMIS'";
        int nonTransmis = jdbcTemplate.queryForObject(sqlNonTransmis, Integer.class, sevenDaysAgo);

        Map<String, Object> total7Jours = new HashMap<>();
        total7Jours.put("total", total);
        total7Jours.put("a_leure", aLeure);
        total7Jours.put("retard", retard);
        total7Jours.put("non_transmis", nonTransmis);
        response.put("total7Jours", total7Jours);

        // Performance par opérateur
        String sqlPerf = """
            SELECT o.nom, o.prenom, 
                   COUNT(t.id) as total,
                   SUM(CASE WHEN t.etat = 'A_LEURE' THEN 1 ELSE 0 END) as a_leure,
                   ROUND(100.0 * SUM(CASE WHEN t.etat = 'A_LEURE' THEN 1 ELSE 0 END) / NULLIF(COUNT(t.id), 0), 2) as taux
            FROM operateurs o
            LEFT JOIN transmissions t ON t.operateur_id = o.id AND t.date_transmission >= ?
            GROUP BY o.id
            ORDER BY o.nom
        """;
        response.put("performanceOperateurs", jdbcTemplate.queryForList(sqlPerf, sevenDaysAgo));

        // Historique quotidien
        String sqlHist = """
            SELECT date_transmission as date,
                   COUNT(*) as total,
                   SUM(CASE WHEN etat = 'A_LEURE' THEN 1 ELSE 0 END) as a_leure,
                   SUM(CASE WHEN etat = 'RETARD' THEN 1 ELSE 0 END) as retard
            FROM transmissions
            WHERE date_transmission >= ?
            GROUP BY date_transmission
            ORDER BY date_transmission
        """;
        response.put("historiqueQuotidien", jdbcTemplate.queryForList(sqlHist, sevenDaysAgo));

        return response;
    }

    @GetMapping("/stats/today")
    public Map<String, Object> getTodayStats() {
        String today = LocalDate.now().toString();

        System.out.println("=== STATS TODAY ===");
        System.out.println("Date recherche: " + today);

        // Compter toutes les transmissions pour aujourd'hui
        String sqlAll = "SELECT COUNT(*) FROM transmissions WHERE date_transmission = ?";
        int totalToday = jdbcTemplate.queryForObject(sqlAll, Integer.class, today);
        System.out.println("Total transmissions aujourd'hui: " + totalToday);

        // Compter les SYNOP (type_message_id = 1)
        String sqlSynop = "SELECT COUNT(*) FROM transmissions WHERE date_transmission = ? AND type_message_id = 1";
        int synop = jdbcTemplate.queryForObject(sqlSynop, Integer.class, today);

        // Compter les METAR (type_message_id = 2)
        String sqlMetar = "SELECT COUNT(*) FROM transmissions WHERE date_transmission = ? AND type_message_id = 2";
        int metar = jdbcTemplate.queryForObject(sqlMetar, Integer.class, today);

        // Compter les TAF (type_message_id = 3)
        String sqlTaf = "SELECT COUNT(*) FROM transmissions WHERE date_transmission = ? AND type_message_id = 3";
        int taf = jdbcTemplate.queryForObject(sqlTaf, Integer.class, today);

        System.out.println("SYNOP: " + synop + ", METAR: " + metar + ", TAF: " + taf);

        Map<String, Object> stats = new HashMap<>();
        stats.put("synop", synop);
        stats.put("metar", metar);
        stats.put("taf", taf);
        stats.put("total", totalToday);

        return stats;
    }
}