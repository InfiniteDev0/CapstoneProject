package com.luxuryshop.api.service;

import com.luxuryshop.api.dto.user.ProfileResponse;
import com.luxuryshop.api.dto.user.UpdateProfileRequest;
import com.luxuryshop.api.exception.ApiException;
import com.luxuryshop.api.model.entity.User;
import com.luxuryshop.api.repository.jpa.OrderRepository;
import com.luxuryshop.api.repository.jpa.UserDeviceRepository;
import com.luxuryshop.api.repository.jpa.UserRepository;
import com.luxuryshop.api.repository.mongo.CategoryRepository;
import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** The "My VN" profile: demographics, preferred categories, devices and tenure. */
@Service
@RequiredArgsConstructor
public class ProfileService {

    private final UserRepository users;
    private final UserDeviceRepository devices;
    private final OrderRepository orders;
    private final CategoryRepository categories;

    @Transactional(readOnly = true)
    public ProfileResponse get(Long userId) {
        return toResponse(load(userId));
    }

    @Transactional
    public ProfileResponse update(Long userId, UpdateProfileRequest req) {
        User u = load(userId);
        if (req.name() != null) u.setName(req.name().trim());
        if (req.phone() != null) u.setPhone(blankToNull(req.phone()));
        if (req.country() != null) u.setCountry(blankToNull(req.country()));
        if (req.city() != null) u.setCity(blankToNull(req.city()));
        if (req.gender() != null) u.setGender(req.gender());
        if (req.dateOfBirth() != null) u.setDateOfBirth(req.dateOfBirth());
        if (req.preferredCategories() != null) {
            // Only real category slugs (checked in MongoDB), no duplicates
            var slugs = new LinkedHashSet<String>();
            for (String raw : req.preferredCategories()) {
                String slug = raw.trim().toLowerCase(Locale.ROOT);
                if (categories.findBySlug(slug).isEmpty()) {
                    throw ApiException.badRequest("Unknown category '" + raw + "'");
                }
                slugs.add(slug);
            }
            u.setPreferredCategories(List.copyOf(slugs));
        }
        return toResponse(users.save(u));
    }

    private ProfileResponse toResponse(User u) {
        var deviceList = devices.findByUserIdOrderByLastSeenDesc(u.getId()).stream()
                .map(d -> new ProfileResponse.Device(d.getDeviceType().name(), d.getOs(), d.getBrowser(), d.getFirstSeen(),
                        d.getLastSeen()))
                .toList();
        long tenureDays = u.getCreatedAt() == null ? 0 : Duration.between(u.getCreatedAt(), Instant.now()).toDays();
        return new ProfileResponse(
                u.getId(), u.getName(), u.getEmail(), u.getRole(), u.getPhone(), u.getCountry(), u.getCity(),
                u.getGender(), u.getDateOfBirth(),
                u.getPreferredCategories() == null ? List.of() : u.getPreferredCategories(),
                u.getCreatedAt(), u.getLastLoginAt(), tenureDays, deviceList.size(), deviceList,
                orders.countByUserId(u.getId()), Pricing.money(orders.totalSpentBy(u.getId())));
    }

    private User load(Long userId) {
        return users.findById(userId).orElseThrow(() -> ApiException.notFound("User not found"));
    }

    private static String blankToNull(String s) {
        return s.isBlank() ? null : s.trim();
    }
}
