package com.velanoire.api.dto.user;

import com.velanoire.api.model.entity.Gender;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.List;

/** Profile changes. Leave a field out (null) to keep it as it is. */
public record UpdateProfileRequest(
        @Size(min = 1, max = 120) String name,
        @Size(max = 30) String phone,
        @Size(max = 60) String country,
        @Size(max = 80) String city,
        Gender gender,
        @Past LocalDate dateOfBirth,
        @Size(max = 7) List<String> preferredCategories) {
}
