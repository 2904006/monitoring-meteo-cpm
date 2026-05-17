package com.meteo.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/transmissions")
@CrossOrigin(origins = "*")
public class TransmissionController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @GetMapping
    public List<Map<String, Object>> getAllTransmissions() {
        String sql = """
            SELECT 
                t.id,
                t.date_transmission,
                t.heure_prevue,
                t.heure_reelle,
                t.etat,
                t.commentaire,
                tm.code as type_code,
                tm.libelle as type_libelle,
                o.nom as operateur_nom,
                o.prenom as operateur_prenom,
                c.code as cause_code,
                c.libelle as cause_libelle
            FROM transmissions t
            LEFT JOIN types_message tm ON t.type_message_id = tm.id
            LEFT JOIN operateurs o ON t.operateur_id = o.id
            LEFT JOIN causes_5m c ON t.cause_5m_id = c.id
            ORDER BY t.date_transmission DESC, t.heure_prevue DESC
        """;
        return jdbcTemplate.queryForList(sql);
    }

    @PostMapping
    public Map<String, Object> createTransmission(@RequestBody Map<String, Object> transmission) {
        String sql = """
            INSERT INTO transmissions 
            (date_transmission, heure_prevue, heure_reelle, type_message_id, operateur_id, etat, cause_5m_id, commentaire)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """;

        jdbcTemplate.update(sql,
                transmission.get("date_transmission"),
                transmission.get("heure_prevue"),
                transmission.get("heure_reelle"),
                transmission.get("type_message_id"),
                transmission.get("operateur_id"),
                transmission.get("etat"),
                transmission.get("cause_5m_id"),
                transmission.get("commentaire")
        );

        return Map.of("success", true, "message", "Transmission ajoutée");
    }
}