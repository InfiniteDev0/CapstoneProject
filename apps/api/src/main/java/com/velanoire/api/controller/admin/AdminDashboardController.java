package com.velanoire.api.controller.admin;

import com.velanoire.api.dto.admin.DashboardStats;
import com.velanoire.api.service.admin.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Tag(name = "9. Admin: dashboard & AI")
public class AdminDashboardController {

    private final DashboardService dashboard;

    @GetMapping("/dashboard/stats")
    @Operation(summary = "Total sales, orders, active users (30 days), top categories, sales by month")
    public DashboardStats stats() {
        return dashboard.stats();
    }

    // --- Placeholders: Phase 7 fills these once the smart waiter (Python) exists ------------

    @GetMapping("/churn")
    @Operation(summary = "Customers with churn risk HIGH / MEDIUM / LOW (empty until Phase 7)")
    public List<Map<String, Object>> churn() {
        return List.of();
    }

    @GetMapping("/retention-offers")
    @Operation(summary = "Win-back discounts sent to at-risk customers (empty until Phase 7)")
    public List<Map<String, Object>> retentionOffers() {
        return List.of();
    }

    @GetMapping("/model-metrics")
    @Operation(summary = "AI model scores: accuracy, precision, recall, ROC-AUC, Precision@K (empty until Phase 7)")
    public List<Map<String, Object>> modelMetrics() {
        return List.of();
    }
}
