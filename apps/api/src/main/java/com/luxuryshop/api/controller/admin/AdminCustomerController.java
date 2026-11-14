package com.luxuryshop.api.controller.admin;

import com.luxuryshop.api.dto.admin.CustomerRow;
import com.luxuryshop.api.dto.common.PageResponse;
import com.luxuryshop.api.dto.user.ProfileResponse;
import com.luxuryshop.api.service.admin.AdminCustomerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/customers")
@RequiredArgsConstructor
@Tag(name = "9. Admin: customers")
public class AdminCustomerController {

    private final AdminCustomerService customers;

    @GetMapping
    @Operation(summary = "Customers with order totals and devices (search name or email)",
            description = "sort: newest | oldest | name | last_login. churnRisk is filled in Phase 7.")
    public PageResponse<CustomerRow> list(@RequestParam(required = false) String search,
            @RequestParam(required = false) String sort,
            @RequestParam(defaultValue = "0") @Min(0) int page, @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        return customers.list(search, sort, page, size);
    }

    @GetMapping("/{id}")
    @Operation(summary = "One customer's profile")
    public ProfileResponse get(@PathVariable Long id) {
        return customers.get(id);
    }
}
