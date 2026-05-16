package com.meteo.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private static final Map<String, Map<String, String>> USERS = new HashMap<>();

    static {
        Map<String, String> admin = new HashMap<>();
        admin.put("password", "admin123");
        admin.put("role", "chef");
        admin.put("name", "BOULAL Redouane");
        USERS.put("admin", admin);

        Map<String, String> kassimi = new HashMap<>();
        kassimi.put("password", "meteo2026");
        kassimi.put("role", "employe");
        kassimi.put("name", "KASSIMI Amine");
        USERS.put("kassimi", kassimi);

        Map<String, String> soubai = new HashMap<>();
        soubai.put("password", "meteo2026");
        soubai.put("role", "employe");
        soubai.put("name", "SOUBAI Mohamed");
        USERS.put("soubai", soubai);

        Map<String, String> khabiri = new HashMap<>();
        khabiri.put("password", "meteo2026");
        khabiri.put("role", "employe");
        khabiri.put("name", "KHABIRI Abdejalile");
        USERS.put("khabiri", khabiri);

        Map<String, String> ayoub = new HashMap<>();
        ayoub.put("password", "meteo2026");
        ayoub.put("role", "employe");
        ayoub.put("name", "AYOUB Sami");
        USERS.put("ayoub", ayoub);
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> request) {
        String username = request.get("username");
        String password = request.get("password");
        String role = request.get("role");

        System.out.println("Login: " + username + " / " + role);

        if (!USERS.containsKey(username)) {
            return ResponseEntity.status(401).body(Map.of("success", false, "error", "Identifiant incorrect"));
        }

        Map<String, String> user = USERS.get(username);

        if (!user.get("password").equals(password)) {
            return ResponseEntity.status(401).body(Map.of("success", false, "error", "Mot de passe incorrect"));
        }

        if (!user.get("role").equals(role)) {
            return ResponseEntity.status(401).body(Map.of("success", false, "error", "Rôle incorrect"));
        }

        return ResponseEntity.ok(Map.of(
                "success", true,
                "role", user.get("role"),
                "name", user.get("name")
        ));
    }
}