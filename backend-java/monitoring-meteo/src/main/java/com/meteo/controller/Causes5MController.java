package com.meteo.controller;

import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/causes-5m")
@CrossOrigin(origins = "*")
public class Causes5MController {

    private static final List<Map<String, Object>> CAUSES = new ArrayList<>();

    static {
        Map<String, Object> m1 = new HashMap<>();
        m1.put("id", 1);
        m1.put("libelle", "Main d'œuvre");
        m1.put("description", "Absence, erreur humaine, manque de formation");
        CAUSES.add(m1);

        Map<String, Object> m2 = new HashMap<>();
        m2.put("id", 2);
        m2.put("libelle", "Matériel");
        m2.put("description", "Panne capteur, panne serveur, coupure réseau");
        CAUSES.add(m2);

        Map<String, Object> m3 = new HashMap<>();
        m3.put("id", 3);
        m3.put("libelle", "Méthode");
        m3.put("description", "Procédure non adaptée, logiciel mal configuré");
        CAUSES.add(m3);

        Map<String, Object> m4 = new HashMap<>();
        m4.put("id", 4);
        m4.put("libelle", "Milieu");
        m4.put("description", "Conditions météo extrêmes, accès difficile");
        CAUSES.add(m4);

        Map<String, Object> m5 = new HashMap<>();
        m5.put("id", 5);
        m5.put("libelle", "Matière");
        m5.put("description", "Fichiers corrompus, données manquantes");
        CAUSES.add(m5);
    }

    @GetMapping
    public List<Map<String, Object>> getAllCauses() {
        return CAUSES;
    }
}