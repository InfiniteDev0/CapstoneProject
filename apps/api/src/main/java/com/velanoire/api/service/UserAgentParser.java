package com.velanoire.api.service;

import com.velanoire.api.model.entity.DeviceType;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

/**
 * Reads the browser's "User-Agent" label (e.g. "Mozilla/5.0 (iPhone; ...) Safari/604.1")
 * and works out the device type, operating system and browser. Simple rules, no library.
 */
public final class UserAgentParser {

    public record DeviceInfo(DeviceType type, String os, String browser) {
    }

    private UserAgentParser() {
    }

    public static DeviceInfo parse(String userAgent) {
        String ua = userAgent == null ? "" : userAgent;
        return new DeviceInfo(type(ua), os(ua), browser(ua));
    }

    /** A stable id for a browser that didn't send X-Device-Id: a short fingerprint of its User-Agent. */
    public static String fingerprint(String userAgent) {
        try {
            byte[] hash = MessageDigest.getInstance("SHA-256")
                    .digest((userAgent == null ? "unknown" : userAgent).getBytes(StandardCharsets.UTF_8));
            return "ua-" + HexFormat.of().formatHex(hash).substring(0, 32);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    private static DeviceType type(String ua) {
        if (ua.contains("iPad") || ua.contains("Tablet")) return DeviceType.TABLET;
        if (ua.contains("Mobi") || ua.contains("iPhone") || ua.contains("Android")) return DeviceType.MOBILE;
        return DeviceType.DESKTOP;
    }

    private static String os(String ua) {
        if (ua.contains("Windows")) return "Windows";
        if (ua.contains("iPhone") || ua.contains("iPad")) return "iOS";
        if (ua.contains("Android")) return "Android";
        if (ua.contains("Mac OS X")) return "macOS";
        if (ua.contains("Linux")) return "Linux";
        return null;
    }

    private static String browser(String ua) {
        if (ua.contains("Edg/")) return "Edge";
        if (ua.contains("OPR/")) return "Opera";
        if (ua.contains("Chrome/")) return "Chrome";
        if (ua.contains("Firefox/")) return "Firefox";
        if (ua.contains("Safari/")) return "Safari";
        if (ua.contains("PostmanRuntime")) return "Postman";
        if (ua.contains("curl/")) return "curl";
        return null;
    }
}
