package com.meteo.controller;

import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/operateurs")
@CrossOrigin(origins = "*")
public class OperateurController {

    private static List<Map<String, Object>> operateurs = new ArrayList<>();

    static {
        Map<String, Object> op1 = new HashMap<>();
        op1.put("id", 1);
        op1.put("nom", "BOULAL");
        op1.put("prenom", "Redouane");
        op1.put("matricule", "CPM001");
        operateurs.add(op1);

        Map<String, Object> op2 = new HashMap<>();
        op2.put("id", 2);
        op2.put("nom", "KASSIMI");
        op2.put("prenom", "Amine");
        op2.put("matricule", "CPM002");
        operateurs.add(op2);

        Map<String, Object> op3 = new HashMap<>();
        op3.put("id", 3);
        op3.put("nom", "SOUBAI");
        op3.put("prenom", "Mohamed");
        op3.put("matricule", "CPM003");
        operateurs.add(op3);

        Map<String, Object> op4 = new HashMap<>();
        op4.put("id", 4);
        op4.put("nom", "KHABIRI");
        op4.put("prenom", "Abdejalile");
        op4.put("matricule", "CPM004");
        operateurs.add(op4);

        Map<String, Object> op5 = new HashMap<>();
        op5.put("id", 5);
        op5.put("nom", "AYOUB");
        op5.put("prenom", "Sami");
        op5.put("matricule", "CPM005");
        operateurs.add(op5);
    }

    @GetMapping
    public List<Map<String, Object>> getAllOperateurs() {
        return operateurs;
    }
}