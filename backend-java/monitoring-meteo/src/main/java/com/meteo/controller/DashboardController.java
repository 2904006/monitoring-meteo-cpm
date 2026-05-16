package com.meteo.controller;

import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class DashboardController {

    @GetMapping("/dashboard")
    public Map<String, Object> getDashboard() {
        Map<String, Object> total7Jours = new HashMap<>();
        total7Jours.put("total", 42);
        total7Jours.put("a_leure", 35);
        total7Jours.put("retard", 5);
        total7Jours.put("non_transmis", 2);

        return Map.of("total7Jours", total7Jours);
    }
}