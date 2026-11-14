package com.luxuryshop.api.web;

import com.luxuryshop.api.exception.ApiException;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Product photos the admin uploads. They are saved in the uploads folder (git-ignored)
 * and served at /uploads/products/<random-name>.jpg. Only real image types are accepted,
 * and the file gets a new random name (never the uploader's file name).
 */
@Service
public class UploadService {

    private static final Map<String, String> TYPES = Map.of(
            "image/jpeg", ".jpg", "image/png", ".png", "image/webp", ".webp", "image/avif", ".avif");

    private final Path root;

    public UploadService(@Value("${app.uploads.dir}") String dir) {
        this.root = Path.of(dir).toAbsolutePath().normalize();
    }

    public Path root() {
        return root;
    }

    /** Saves one photo and returns its public URL, e.g. /uploads/products/3f2c....webp */
    public String saveProductImage(MultipartFile file) {
        if (file == null || file.isEmpty()) throw ApiException.badRequest("Please choose a photo");
        String type = file.getContentType() == null ? "" : file.getContentType().toLowerCase(Locale.ROOT);
        String ext = TYPES.get(type);
        if (ext == null) throw ApiException.badRequest("Photos must be JPG, PNG, WebP or AVIF");
        try (InputStream in = file.getInputStream()) {
            byte[] head = in.readNBytes(12);
            if (!looksLikeImage(head)) throw ApiException.badRequest("That file isn't a real image");
            Path folder = root.resolve("products");
            Files.createDirectories(folder);
            String name = UUID.randomUUID() + ext;
            try (InputStream again = file.getInputStream()) {
                Files.copy(again, folder.resolve(name), StandardCopyOption.REPLACE_EXISTING);
            }
            return "/uploads/products/" + name;
        } catch (IOException e) {
            throw ApiException.badRequest("Could not save the photo: " + e.getMessage());
        }
    }

    /** Deletes an uploaded photo file (only files inside our uploads folder). */
    public void deleteIfUploaded(String url) {
        if (url == null || !url.startsWith("/uploads/products/")) return;
        Path file = root.resolve(url.substring("/uploads/".length())).normalize();
        if (!file.startsWith(root)) return;
        try {
            Files.deleteIfExists(file);
        } catch (IOException ignored) {
            // a leftover file is harmless
        }
    }

    /** JPEG, PNG, WebP (RIFF....WEBP) or AVIF (....ftyp) magic bytes. */
    private static boolean looksLikeImage(byte[] h) {
        if (h.length < 12) return false;
        boolean jpeg = (h[0] & 0xFF) == 0xFF && (h[1] & 0xFF) == 0xD8;
        boolean png = (h[0] & 0xFF) == 0x89 && h[1] == 'P' && h[2] == 'N' && h[3] == 'G';
        boolean webp = h[0] == 'R' && h[1] == 'I' && h[2] == 'F' && h[3] == 'F' && h[8] == 'W' && h[9] == 'E' && h[10] == 'B' && h[11] == 'P';
        boolean avif = h[4] == 'f' && h[5] == 't' && h[6] == 'y' && h[7] == 'p';
        return jpeg || png || webp || avif;
    }

    /** Serve the uploads folder at /uploads/** */
    @Configuration
    static class UploadsWebConfig implements WebMvcConfigurer {
        private final UploadService uploads;

        UploadsWebConfig(UploadService uploads) {
            this.uploads = uploads;
        }

        @Override
        public void addResourceHandlers(ResourceHandlerRegistry registry) {
            registry.addResourceHandler("/uploads/**").addResourceLocations(uploads.root().toUri().toString() + "/");
        }
    }
}
