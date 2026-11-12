package com.velanoire.api.dto.user;

import com.velanoire.api.model.entity.Gender;
import com.velanoire.api.model.entity.Role;
import com.velanoire.api.model.entity.User;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

/** A user as the outside world sees them. Note: no password hash, ever. */
public record UserResponse(
        Long id,
        String name,
        String email,
        Role role,
        String phone,
        String country,
        String city,
        Gender gender,
        LocalDate dateOfBirth,
        List<String> preferredCategories,
        Instant createdAt,
        Instant lastLoginAt) {

    public static UserResponse from(User u) {
        return new UserResponse(
                u.getId(), u.getName(), u.getEmail(), u.getRole(),
                u.getPhone(), u.getCountry(), u.getCity(), u.getGender(), u.getDateOfBirth(),
                u.getPreferredCategories() == null ? List.of() : u.getPreferredCategories(),
                u.getCreatedAt(), u.getLastLoginAt());
    }
}
