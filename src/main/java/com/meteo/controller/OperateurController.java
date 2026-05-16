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
    }

    @GetMapping
    public List<Map<String, Object>> getAllOperateurs() {
        return operateurs;
    }
}