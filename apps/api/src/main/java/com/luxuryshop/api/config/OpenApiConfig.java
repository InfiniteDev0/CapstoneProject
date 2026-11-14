package com.luxuryshop.api.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import org.springframework.context.annotation.Configuration;

/**
 * Swagger UI (http://localhost:8080/swagger-ui.html): a test page for every endpoint.
 * The "Authorize" button lets you paste your wristband (JWT) once for all requests.
 */
@Configuration
@OpenAPIDefinition(
        info = @Info(
                title = "LuxuryShop API",
                version = "v1",
                description = "The kitchen behind the LuxuryShop shop and admin. "
                        + "Log in with POST /api/auth/login, copy the token, click Authorize and paste it."),
        security = @SecurityRequirement(name = "bearerAuth"))
@SecurityScheme(name = "bearerAuth", type = SecuritySchemeType.HTTP, scheme = "bearer", bearerFormat = "JWT")
public class OpenApiConfig {
}
