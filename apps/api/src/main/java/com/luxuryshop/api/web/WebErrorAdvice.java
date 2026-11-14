package com.luxuryshop.api.web;

import com.luxuryshop.api.exception.ApiException;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.ui.Model;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

/**
 * When a WEB PAGE fails, show a friendly error page (not the JSON the API returns).
 * Only covers the page controllers in web.pages; the REST controllers keep the
 * { error, message, status } JSON from GlobalExceptionHandler.
 */
@ControllerAdvice(basePackages = "com.luxuryshop.api.web.pages")
@Order(Ordered.HIGHEST_PRECEDENCE)
public class WebErrorAdvice {

    @ExceptionHandler(ApiException.class)
    public String apiProblem(ApiException e, Model model, HttpServletResponse response) {
        return page(e.getStatus(), e.getMessage(), model, response);
    }

    @ExceptionHandler({MethodArgumentTypeMismatchException.class, NoResourceFoundException.class})
    public String notFound(Exception e, Model model, HttpServletResponse response) {
        return page(HttpStatus.NOT_FOUND, "We couldn't find that page.", model, response);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public String invalid(MethodArgumentNotValidException e, Model model, HttpServletResponse response) {
        return page(HttpStatus.BAD_REQUEST, "Some details were missing or not valid.", model, response);
    }

    private static String page(HttpStatus status, String message, Model model, HttpServletResponse response) {
        response.setStatus(status.value());
        model.addAttribute("status", status.value());
        model.addAttribute("title", status == HttpStatus.NOT_FOUND ? "Page not found" : status.getReasonPhrase());
        model.addAttribute("message", message);
        return "error";
    }
}
