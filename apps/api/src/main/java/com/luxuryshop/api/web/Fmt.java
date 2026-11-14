package com.luxuryshop.api.web;

import com.luxuryshop.api.model.entity.OrderStatus;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.NumberFormat;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.util.UriComponentsBuilder;

/**
 * Small formatting helpers the templates call as ${@fmt.money(price)}.
 * (Tailwind scans this file too, so the colour classes below are kept in the CSS.)
 */
@Component("fmt")
public class Fmt {

    private static final ZoneId ZONE = ZoneId.of("UTC");
    private static final DateTimeFormatter DAY = DateTimeFormatter.ofPattern("d MMM yyyy", Locale.ENGLISH).withZone(ZONE);
    private static final DateTimeFormatter DAY_TIME = DateTimeFormatter.ofPattern("d MMM yyyy, HH:mm", Locale.ENGLISH).withZone(ZONE);

    public String money(BigDecimal value) {
        if (value == null) return "—";
        NumberFormat f = NumberFormat.getCurrencyInstance(Locale.US);
        return f.format(value.setScale(2, RoundingMode.HALF_UP));
    }

    /** $1,190 instead of $1,190.00 when there are no cents (product cards). */
    public String price(BigDecimal value) {
        if (value == null) return "—";
        if (value.stripTrailingZeros().scale() <= 0) {
            NumberFormat f = NumberFormat.getCurrencyInstance(Locale.US);
            f.setMaximumFractionDigits(0);
            return f.format(value);
        }
        return money(value);
    }

    public String date(Instant when) {
        return when == null ? "—" : DAY.format(when);
    }

    public String dateTime(Instant when) {
        return when == null ? "—" : DAY_TIME.format(when);
    }

    public String ago(Instant when) {
        if (when == null) return "never";
        long minutes = Duration.between(when, Instant.now()).toMinutes();
        if (minutes < 1) return "just now";
        if (minutes < 60) return minutes + " min ago";
        if (minutes < 60 * 24) return (minutes / 60) + " h ago";
        long days = minutes / (60 * 24);
        return days < 30 ? days + " days ago" : date(when);
    }

    /** "outerwear" → "Outerwear", "CASH_ON_DELIVERY" → "Cash on delivery" */
    public String label(Object value) {
        if (value == null) return "—";
        String s = value.toString().replace('_', ' ').replace('-', ' ').toLowerCase(Locale.ROOT).trim();
        return s.isEmpty() ? s : Character.toUpperCase(s.charAt(0)) + s.substring(1);
    }

    public String initials(String name) {
        if (name == null || name.isBlank()) return "?";
        String[] parts = name.trim().split("\\s+");
        return (parts[0].substring(0, 1) + (parts.length > 1 ? parts[parts.length - 1].substring(0, 1) : "")).toUpperCase(Locale.ROOT);
    }

    /** Badge colours for an order status. */
    public String statusClass(OrderStatus status) {
        if (status == null) return "bg-neutral-100 text-neutral-600";
        return switch (status) {
            case PENDING -> "bg-amber-50 text-amber-700";
            case PAID -> "bg-sky-50 text-sky-700";
            case PROCESSING -> "bg-violet-50 text-violet-700";
            case SHIPPED -> "bg-indigo-50 text-indigo-700";
            case DELIVERED -> "bg-emerald-50 text-emerald-700";
            case CANCELLED -> "bg-neutral-100 text-neutral-500";
            case REFUNDED -> "bg-rose-50 text-rose-700";
        };
    }

    /** Badge colours for a product status. */
    public String productStatusClass(String status) {
        if (status == null) return "bg-neutral-100 text-neutral-600";
        return switch (status) {
            case "LIVE" -> "bg-emerald-50 text-emerald-700";
            case "SOLD_OUT" -> "bg-rose-50 text-rose-700";
            case "READY_TO_LAUNCH" -> "bg-sky-50 text-sky-700";
            case "DISCONTINUED" -> "bg-neutral-100 text-neutral-500";
            default -> "bg-amber-50 text-amber-700";
        };
    }

    /** How many of the 5 stars to fill (rounded to the nearest whole star). */
    public int stars(Double average) {
        return average == null ? 0 : (int) Math.round(average);
    }

    /** This page's URL with one query parameter changed (null removes it); page goes back to 0. */
    public String withParam(String name, Object value) {
        var request = ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes()).getRequest();
        UriComponentsBuilder b = UriComponentsBuilder.fromPath(request.getRequestURI()).query(request.getQueryString());
        b.replaceQueryParam("page");
        if (value == null || value.toString().isBlank()) b.replaceQueryParam(name);
        else b.replaceQueryParam(name, value);
        return b.build().toUriString();
    }

    /** This page's URL on another page of results (the pager). */
    public String pageUrl(int page) {
        var request = ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes()).getRequest();
        UriComponentsBuilder b = UriComponentsBuilder.fromPath(request.getRequestURI()).query(request.getQueryString());
        if (page <= 0) b.replaceQueryParam("page");
        else b.replaceQueryParam("page", page);
        return b.build().toUriString();
    }
}
