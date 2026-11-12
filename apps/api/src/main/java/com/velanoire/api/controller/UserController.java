package com.velanoire.api.controller;

import com.velanoire.api.dto.user.ProfileResponse;
import com.velanoire.api.dto.user.UpdateProfileRequest;
import com.velanoire.api.security.AuthUser;
import com.velanoire.api.service.ProfileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
@Tag(name = "3. Profile", description = "My VN: demographics, preferences, devices, tenure")
public class UserController {

    private final ProfileService profiles;

    @GetMapping("/me")
    @Operation(summary = "My profile, with tenure, devices and order totals")
    public ProfileResponse me(@AuthenticationPrincipal AuthUser me) {
        return profiles.get(me.id());
    }

    @PatchMapping("/me")
    @Operation(summary = "Change my profile (send only the fields to change)")
    public ProfileResponse update(@AuthenticationPrincipal AuthUser me, @Valid @RequestBody UpdateProfileRequest request) {
        return profiles.update(me.id(), request);
    }
}
