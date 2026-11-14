package com.luxuryshop.api.dto.auth;

import com.luxuryshop.api.model.entity.Gender;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

/** The sign-up ticket. The @ rules are checked by @Valid before the chef ever sees it. */
public record RegisterRequest(
        @NotBlank @Size(max = 120) String name,
        @NotBlank @Email @Size(max = 255) String email,
        @NotBlank @Size(min = 8, max = 72, message = "must be 8 to 72 characters") String password,
        @Size(max = 30) String phone,
        @Size(max = 60) String country,
        @Size(max = 80) String city,
        Gender gender,
        @Past LocalDate dateOfBirth) {
}
