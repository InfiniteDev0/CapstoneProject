package com.luxuryshop.api.service.admin;

import com.luxuryshop.api.dto.admin.CustomerRow;
import com.luxuryshop.api.dto.common.PageResponse;
import com.luxuryshop.api.dto.user.ProfileResponse;
import com.luxuryshop.api.exception.ApiException;
import com.luxuryshop.api.model.entity.Role;
import com.luxuryshop.api.model.entity.User;
import com.luxuryshop.api.repository.jpa.OrderRepository;
import com.luxuryshop.api.repository.jpa.UserDeviceRepository;
import com.luxuryshop.api.repository.jpa.UserRepository;
import com.luxuryshop.api.service.Pricing;
import com.luxuryshop.api.service.ProfileService;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** The customer list for the manager (MySQL). */
@Service
@RequiredArgsConstructor
public class AdminCustomerService {

    private static final Map<String, Sort> SORTS = Map.of(
            "newest", Sort.by(Sort.Direction.DESC, "createdAt"),
            "oldest", Sort.by(Sort.Direction.ASC, "createdAt"),
            "name", Sort.by(Sort.Direction.ASC, "name"),
            "last_login", Sort.by(Sort.Order.desc("lastLoginAt").nullsLast()));

    private final UserRepository users;
    private final OrderRepository orders;
    private final UserDeviceRepository devices;
    private final ProfileService profiles;

    @Transactional(readOnly = true)
    public PageResponse<CustomerRow> list(String search, String sort, int page, int size) {
        Sort order = SORTS.get(sort == null ? "newest" : sort);
        if (order == null) throw ApiException.badRequest("sort must be one of: " + String.join(", ", SORTS.keySet()));
        String q = search == null || search.isBlank() ? null : "%" + search.trim().toLowerCase(Locale.ROOT) + "%";
        Page<User> result = users.searchCustomers(q, PageRequest.of(page, size, order));

        // Two grouped queries for the whole page, instead of 2 queries per customer
        List<Long> ids = result.getContent().stream().map(User::getId).toList();
        Map<Long, Object[]> orderStats = new HashMap<>();
        Map<Long, Long> deviceCounts = new HashMap<>();
        if (!ids.isEmpty()) {
            orders.statsForUsers(ids).forEach(row -> orderStats.put((Long) row[0], row));
            devices.countsForUsers(ids).forEach(row -> deviceCounts.put((Long) row[0], (Long) row[1]));
        }

        List<CustomerRow> rows = result.getContent().stream().map(u -> {
            Object[] stats = orderStats.get(u.getId());
            return new CustomerRow(u.getId(), u.getName(), u.getEmail(), u.getCountry(), u.getGender(), u.isActive(),
                    u.getCreatedAt(), u.getLastLoginAt(),
                    stats == null ? 0 : (Long) stats[1],
                    Pricing.money(stats == null ? BigDecimal.ZERO : (BigDecimal) stats[2]),
                    deviceCounts.getOrDefault(u.getId(), 0L),
                    null); // churn risk: Phase 7
        }).toList();
        return PageResponse.of(rows, page, size, result.getTotalElements());
    }

    /** One customer's full profile (same view the customer sees, plus it works for any id). */
    public ProfileResponse get(Long id) {
        User u = users.findById(id).orElseThrow(() -> ApiException.notFound("Customer not found"));
        if (u.getRole() != Role.CUSTOMER) throw ApiException.notFound("Customer not found");
        return profiles.get(id);
    }
}
