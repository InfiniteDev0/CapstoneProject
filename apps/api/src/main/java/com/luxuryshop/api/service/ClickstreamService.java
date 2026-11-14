package com.luxuryshop.api.service;

import com.luxuryshop.api.dto.event.EventRequest;
import com.luxuryshop.api.model.document.ClickstreamEvent;
import com.luxuryshop.api.model.document.EventType;
import com.luxuryshop.api.repository.mongo.ClickstreamRepository;
import jakarta.servlet.http.HttpServletRequest;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * Writes the clickstream log in MongoDB: every view, search, cart action and purchase.
 * This log is what the smart waiter (Python) learns from in Phase 6.
 *
 * Logging must never break shopping: if MongoDB hiccups, we note it and carry on.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ClickstreamService {

    /** The shop sends its visit id in this header, so server-side events join the same session. */
    public static final String SESSION_HEADER = "X-Session-Id";

    private final ClickstreamRepository events;

    /** A click sent by the shop (POST /api/events). userId is null for guests. */
    public void record(Long userId, EventRequest req) {
        String device = req.device() != null ? req.device() : deviceFromRequest();
        save(userId, req.sessionId(), req.type(), req.productId(), req.category(), req.query(), null, req.page(), device);
    }

    /** An event the kitchen logs by itself (add to cart, checkout...), for the logged-in user. */
    public void logServerEvent(Long userId, EventType type, String productId, String category, Long orderId) {
        HttpServletRequest request = currentRequest();
        String page = request != null ? request.getRequestURI() : null;
        save(userId, visitId(request, userId), type, productId, category, null, orderId, page, deviceFromRequest());
    }

    /** A VIEW or SEARCH on a web page (shop product page, search box). userId is null for guests. */
    public void logPageEvent(Long userId, EventType type, String productId, String category, String query) {
        HttpServletRequest request = currentRequest();
        String page = request == null ? null
                : request.getRequestURI() + (request.getQueryString() == null ? "" : "?" + request.getQueryString());
        save(userId, visitId(request, userId), type, productId, category, query, null,
                page != null && page.length() > 300 ? page.substring(0, 300) : page, deviceFromRequest());
    }

    /**
     * Which visit this click belongs to: the API sends X-Session-Id; the web pages use the
     * browser session, so all clicks of one visit (view, add to bag, buy) share one id.
     */
    private static String visitId(HttpServletRequest request, Long userId) {
        if (request == null) return "srv-" + userId;
        if (request.getHeader(SESSION_HEADER) != null) return request.getHeader(SESSION_HEADER);
        return "web-" + request.getSession(true).getId();
    }

    private void save(Long userId, String sessionId, EventType type, String productId, String category, String query,
            Long orderId, String page, String device) {
        try {
            ClickstreamEvent e = new ClickstreamEvent();
            e.setUserId(userId);
            e.setSessionId(sessionId.length() > 64 ? sessionId.substring(0, 64) : sessionId);
            e.setType(type);
            e.setProductId(productId);
            e.setCategory(category);
            e.setQuery(query);
            e.setOrderId(orderId);
            e.setPage(page == null ? "/" : page);
            e.setDevice(device);
            e.setTimestamp(Instant.now());
            events.save(e);
        } catch (RuntimeException ex) {
            log.warn("Could not log {} event: {}", type, ex.getMessage());
        }
    }

    private String deviceFromRequest() {
        HttpServletRequest request = currentRequest();
        String ua = request == null ? null : request.getHeader(HttpHeaders.USER_AGENT);
        return UserAgentParser.parse(ua).type().name();
    }

    private static HttpServletRequest currentRequest() {
        return RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attrs
                ? attrs.getRequest()
                : null;
    }
}
