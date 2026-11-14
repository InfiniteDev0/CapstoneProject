package com.luxuryshop.api.web.pages.shop;

import com.luxuryshop.api.dto.auth.AuthResponse;
import com.luxuryshop.api.dto.auth.RegisterRequest;
import com.luxuryshop.api.exception.ApiException;
import com.luxuryshop.api.security.AuthUser;
import com.luxuryshop.api.security.DeviceCookieFilter;
import com.luxuryshop.api.security.WebSessions;
import com.luxuryshop.api.service.AuthService;
import com.luxuryshop.api.web.Forms;
import com.luxuryshop.api.web.LoginErrors;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

/**
 * Sign in and sign up for shoppers. Spring Security itself checks the password when the
 * login form is posted (POST /login); this controller only shows the pages and creates accounts.
 */
@Controller
@RequiredArgsConstructor
public class AuthPageController {

    private final AuthService auth;
    private final Forms forms;

    @GetMapping("/login")
    public String login(@AuthenticationPrincipal AuthUser me, HttpServletRequest request, Model model) {
        if (me != null) return "redirect:/";
        model.addAttribute("error", LoginErrors.last(request));
        return "shop/login";
    }

    @GetMapping("/register")
    public String register(@AuthenticationPrincipal AuthUser me, Model model) {
        if (me != null) return "redirect:/";
        model.addAttribute("form", new RegisterRequest("", "", "", null, null, null, null, null));
        return "shop/register";
    }

    @PostMapping("/register")
    public String create(RegisterRequest form, HttpServletRequest request, HttpServletResponse response,
            Model model, RedirectAttributes flash) {
        try {
            AuthResponse created = auth.register(forms.check(form), request.getHeader(HttpHeaders.USER_AGENT),
                    DeviceCookieFilter.deviceId(request));
            var user = created.user();
            WebSessions.signInToShop(new AuthUser(user.id(), user.email(), user.role()), request, response);
            flash.addFlashAttribute("toast", "Welcome to LuxuryShop, " + user.name().split(" ")[0]);
            return "redirect:/";
        } catch (ApiException e) {
            model.addAttribute("form", new RegisterRequest(form.name(), form.email(), "", form.phone(), form.country(),
                    form.city(), form.gender(), form.dateOfBirth()));
            model.addAttribute("error", e.getMessage());
            return "shop/register";
        }
    }
}
