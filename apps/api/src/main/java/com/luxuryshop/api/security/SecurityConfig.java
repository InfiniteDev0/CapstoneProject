package com.luxuryshop.api.security;

import com.luxuryshop.api.repository.jpa.UserRepository;
import java.util.List;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.LoginUrlAuthenticationEntryPoint;
import org.springframework.security.web.authentication.SavedRequestAwareAuthenticationSuccessHandler;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.servlet.util.matcher.PathPatternRequestMatcher;
import org.springframework.security.web.util.matcher.AnyRequestMatcher;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.servlet.HandlerExceptionResolver;

/**
 * The house rules for the doors. There are three, checked in this order:
 *
 *  1. /api/**     the REST kitchen hatch: JWT wristbands, no sessions, no CSRF (Python and the tests use it)
 *  2. /admin/**   the manager's office: its own login page, ADMIN only, session + CSRF
 *  3. everything else: the shop pages; browsing is open, the bag/checkout/account need a login, session + CSRF
 */
@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private static final String[] PUBLIC_FILES = {
        "/css/**", "/js/**", "/fonts/**", "/img/**", "/images/**", "/uploads/**", "/favicon.svg", "/error", "/error/**",
    };

    // ---- 1. REST API (JWT) -------------------------------------------------------------

    @Bean
    @Order(1)
    public SecurityFilterChain apiChain(
            HttpSecurity http,
            JwtService jwtService,
            @Qualifier("handlerExceptionResolver") HandlerExceptionResolver errorDesk) throws Exception {
        http
                .securityMatcher("/api/**", "/swagger-ui.html", "/swagger-ui/**", "/v3/api-docs/**")
                // Wristbands (JWT), not browser sessions or cookies, so CSRF and forms are off here.
                .csrf(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .cors(Customizer.withDefaults())
                .authorizeHttpRequests(rooms -> rooms
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/api/health").permitAll()
                        .requestMatchers("/swagger-ui.html", "/swagger-ui/**", "/v3/api-docs/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/auth/register", "/api/auth/login").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/store/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/events").permitAll() // guests' clicks count too
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .anyRequest().authenticated())
                // 401 / 403 go through the same complaints desk, so they have the standard JSON shape
                .exceptionHandling(e -> e
                        .authenticationEntryPoint((req, res, ex) -> errorDesk.resolveException(req, res, null, ex))
                        .accessDeniedHandler((req, res, ex) -> errorDesk.resolveException(req, res, null, ex)))
                .addFilterBefore(new JwtAuthFilter(jwtService), UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    // ---- 2. Admin pages ----------------------------------------------------------------

    @Bean
    @Order(2)
    public SecurityFilterChain adminChain(HttpSecurity http, WebLoginService logins, UserRepository users,
            @Value("${app.jwt.secret}") String secret) throws Exception {
        var remember = RememberMe.admin(secret, users);
        var requestCache = WebSessions.requestCache(WebSessions.ADMIN_KEY);
        var success = new SavedRequestAwareAuthenticationSuccessHandler();
        success.setRequestCache(requestCache);
        success.setDefaultTargetUrl("/admin");
        http
                .securityMatcher("/admin", "/admin/**")
                .securityContext(c -> c.securityContextRepository(WebSessions.repository(WebSessions.ADMIN_KEY)))
                .requestCache(c -> c.requestCache(requestCache))
                .authenticationProvider(new WebLoginProvider(logins, true))
                .authorizeHttpRequests(rooms -> rooms
                        .requestMatchers("/admin/login").permitAll()
                        .anyRequest().hasRole("ADMIN"))
                .formLogin(form -> form
                        .loginPage("/admin/login")
                        .loginProcessingUrl("/admin/login")
                        .usernameParameter("email")
                        .successHandler(success)
                        .failureUrl("/admin/login?error"))
                .rememberMe(r -> r.rememberMeServices(remember).key(remember.getKey()))
                .logout(out -> out
                        .logoutUrl("/admin/logout")
                        .logoutSuccessUrl("/admin/login?logout")
                        .invalidateHttpSession(false) // keep the shop login (a different key) alive
                        .addLogoutHandler((req, res, auth) -> removeKey(req, WebSessions.ADMIN_KEY)))
                .exceptionHandling(e -> e
                        .defaultAuthenticationEntryPointFor(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED),
                                PathPatternRequestMatcher.withDefaults().matcher("/admin/actions/**"))
                        .defaultAuthenticationEntryPointFor(new LoginUrlAuthenticationEntryPoint("/admin/login"), AnyRequestMatcher.INSTANCE));
        return http.build();
    }

    // ---- 3. Shop pages -----------------------------------------------------------------

    @Bean
    @Order(3)
    public SecurityFilterChain shopChain(HttpSecurity http, WebLoginService logins, UserRepository users,
            @Value("${app.jwt.secret}") String secret) throws Exception {
        var remember = RememberMe.shop(secret, users);
        var requestCache = WebSessions.requestCache(WebSessions.SHOP_KEY);
        var success = new SavedRequestAwareAuthenticationSuccessHandler();
        success.setRequestCache(requestCache);
        success.setDefaultTargetUrl("/");
        http
                .securityContext(c -> c.securityContextRepository(WebSessions.repository(WebSessions.SHOP_KEY)))
                .requestCache(c -> c.requestCache(requestCache))
                .authenticationProvider(new WebLoginProvider(logins, false))
                .authorizeHttpRequests(rooms -> rooms
                        .requestMatchers(PUBLIC_FILES).permitAll()
                        .requestMatchers(HttpMethod.GET, "/", "/shop", "/search", "/categories/**", "/product/**").permitAll()
                        .requestMatchers("/login", "/register").permitAll()
                        // the bag, likes, checkout, account and the small /web/** fetch calls
                        .anyRequest().authenticated())
                .formLogin(form -> form
                        .loginPage("/login")
                        .loginProcessingUrl("/login")
                        .usernameParameter("email")
                        .successHandler(success)
                        .failureUrl("/login?error"))
                .rememberMe(r -> r.rememberMeServices(remember).key(remember.getKey()))
                .logout(out -> out
                        .logoutUrl("/logout")
                        .logoutSuccessUrl("/?signedOut")
                        .invalidateHttpSession(false) // keep the admin login (a different key) alive
                        .addLogoutHandler((req, res, auth) -> removeKey(req, WebSessions.SHOP_KEY)))
                .exceptionHandling(e -> e
                        // checked in order: fetch() calls get a plain 401 (the page shows "Please log in"), pages go to the login page
                        .defaultAuthenticationEntryPointFor(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED),
                                PathPatternRequestMatcher.withDefaults().matcher("/web/**"))
                        .defaultAuthenticationEntryPointFor(new LoginUrlAuthenticationEntryPoint("/login"), AnyRequestMatcher.INSTANCE));
        return http.build();
    }

    private static void removeKey(jakarta.servlet.http.HttpServletRequest request, String key) {
        var session = request.getSession(false);
        if (session != null) session.removeAttribute(key);
    }

    /** Turns the login form's email + password into a logged-in AuthUser (or a clear error). */
    static final class WebLoginProvider implements AuthenticationProvider {
        private final WebLoginService logins;
        private final boolean adminOnly;

        WebLoginProvider(WebLoginService logins, boolean adminOnly) {
            this.logins = logins;
            this.adminOnly = adminOnly;
        }

        @Override
        public Authentication authenticate(Authentication login) throws AuthenticationException {
            String password = login.getCredentials() == null ? null : login.getCredentials().toString();
            AuthUser user = logins.login(login.getName(), password, adminOnly);
            return UsernamePasswordAuthenticationToken.authenticated(user, null, user.authorities());
        }

        @Override
        public boolean supports(Class<?> type) {
            return UsernamePasswordAuthenticationToken.class.isAssignableFrom(type);
        }
    }

    /** BCrypt: a one-way blender for passwords. You can check a password against it, never un-blend it. */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /** CORS for /api: only needed if another website calls the API from a browser. */
    @Bean
    public CorsConfigurationSource corsConfigurationSource(@Value("${app.cors.allowed-origins}") List<String> origins) {
        CorsConfiguration cors = new CorsConfiguration();
        cors.setAllowedOrigins(origins);
        cors.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        cors.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-Device-Id", "X-Session-Id"));
        cors.setAllowCredentials(true);
        cors.setMaxAge(3600L);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", cors);
        return source;
    }
}
