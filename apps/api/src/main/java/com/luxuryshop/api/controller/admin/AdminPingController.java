package com.luxuryshop.api.controller.admin;

import com.luxuryshop.api.security.AuthUser;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.Map;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/** The manager's office door. Only ADMIN wristbands get in (rule in SecurityConfig). */
@RestController
@Tag(name = "9. Admin")
public class AdminPingController {

    @GetMapping("/api/admin/ping")
    @Operation(summary = "Admin-only test: customers get 403 Forbidden")
    public Map<String, String> ping(@AuthenticationPrincipal AuthUser me) {
        return Map.of("message", "Welcome to the manager's office, " + me.email());
    }
}
