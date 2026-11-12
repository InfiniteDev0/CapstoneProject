package com.velanoire.api.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.bson.Document;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/** "Is the kitchen open?" Checks that both storerooms (MySQL and MongoDB) answer. */
@RestController
@RequiredArgsConstructor
@Tag(name = "0. Health")
public class HealthController {

    private final JdbcTemplate jdbc;
    private final MongoTemplate mongo;

    @GetMapping("/api/health")
    @SecurityRequirements
    @Operation(summary = "Is the API up, and can it reach MySQL and MongoDB?")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> body = new LinkedHashMap<>();
        boolean mysqlUp = check(() -> jdbc.queryForObject("SELECT 1", Integer.class));
        boolean mongoUp = check(() -> mongo.getDb().runCommand(new Document("ping", 1)));
        body.put("status", mysqlUp && mongoUp ? "UP" : "DEGRADED");
        body.put("mysql", mysqlUp ? "UP" : "DOWN");
        body.put("mongodb", mongoUp ? "UP" : "DOWN");
        body.put("mongoDatabase", mongo.getDb().getName());
        body.put("time", Instant.now());
        return ResponseEntity.status(mysqlUp && mongoUp ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE).body(body);
    }

    private static boolean check(Runnable probe) {
        try {
            probe.run();
            return true;
        } catch (RuntimeException e) {
            return false;
        }
    }
}
