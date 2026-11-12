package com.velanoire.api.controller;

import com.velanoire.api.dto.event.EventRequest;
import com.velanoire.api.security.AuthUser;
import com.velanoire.api.service.ClickstreamService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * The clickstream door: the shop sends every view and search here.
 * Open to guests too; with a token the click is tied to the customer.
 */
@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
@Tag(name = "7. Clickstream")
public class EventController {

    private final ClickstreamService clickstream;

    @PostMapping
    @ResponseStatus(HttpStatus.ACCEPTED)
    @Operation(summary = "Log a click (VIEW, SEARCH, ADD_TO_CART, REMOVE_FROM_CART, WISHLIST, PURCHASE)")
    public Map<String, Boolean> record(@AuthenticationPrincipal AuthUser me, @Valid @RequestBody EventRequest request) {
        clickstream.record(me == null ? null : me.id(), request);
        return Map.of("recorded", true);
    }
}
