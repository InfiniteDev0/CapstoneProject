package com.luxuryshop.api.web;

import com.luxuryshop.api.exception.ApiException;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validator;
import java.util.Comparator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Checks a filled-in form against the same rules the API uses (@NotBlank, @Size...)
 * and turns the first problem into a readable message, e.g. "Email: must be a well-formed email address".
 */
@Component
@RequiredArgsConstructor
public class Forms {

    private final Validator validator;

    public <T> T check(T form) {
        var problems = validator.validate(form);
        if (!problems.isEmpty()) {
            ConstraintViolation<T> first = problems.stream()
                    .min(Comparator.comparing(v -> v.getPropertyPath().toString()))
                    .orElseThrow();
            throw ApiException.badRequest(niceName(first.getPropertyPath().toString()) + ": " + first.getMessage());
        }
        return form;
    }

    /** shippingAddress → Shipping address, variants[0].sku → Colour 1 SKU */
    static String niceName(String path) {
        String p = path.replaceAll("variants\\[(\\d+)]\\.", "colour $1 ").replaceAll("\\[\\d+]", "").replaceAll("<.*?>", "");
        String spaced = p.replaceAll("([a-z])([A-Z])", "$1 $2").replace('.', ' ').toLowerCase();
        return spaced.isEmpty() ? "Form" : Character.toUpperCase(spaced.charAt(0)) + spaced.substring(1);
    }
}
