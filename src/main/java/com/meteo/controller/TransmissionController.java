 package com.meteo.controller;

import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/transmissions")
@CrossOrigin(origins = "*")
public class TransmissionController {
    
    private static List<Map<String, Object>> transmissions = new ArrayList<>();
    private static long nextId = 1;
    
    @GetMapping
    public List<Map<String, Object>> getAllTransmissions() {
        return transmissions;
    }
    
    @PostMapping
    public Map<String, Object> createTransmission(@RequestBody Map<String, Object> transmission) {
        transmission.put("id", nextId++);
        transmissions.add(transmission);
        return Map.of("id", transmission.get("id"), "message", "Transmission enregistrée");
    }
}