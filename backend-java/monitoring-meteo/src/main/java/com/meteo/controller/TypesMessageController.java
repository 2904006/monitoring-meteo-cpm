package com.meteo.controller;

import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/types-message")
@CrossOrigin(origins = "*")
public class TypesMessageController {

    private static List<Map<String, Object>> types = new ArrayList<>();

    static {
        Map<String, Object> synop = new HashMap<>();
        synop.put("id", 1);
        synop.put("code", "SYNOP");
        synop.put("libelle", "Message synoptique de surface");
        types.add(synop);

        Map<String, Object> metar = new HashMap<>();
        metar.put("id", 2);
        metar.put("code", "METAR");
        metar.put("libelle", "Message aéronautique routine");
        types.add(metar);

        Map<String, Object> taf = new HashMap<>();
        taf.put("id", 3);
        taf.put("code", "TAF");
        taf.put("libelle", "Prévision aérodrome");
        types.add(taf);

        Map<String, Object> speci = new HashMap<>();
        speci.put("id", 4);
        speci.put("code", "SPECI");
        speci.put("libelle", "Message aéronautique spécial");
        types.add(speci);
    }

    @GetMapping
    public List<Map<String, Object>> getAllTypes() {
        return types;
    }
}