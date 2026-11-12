package com.velanoire.api.model.document;

import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * A Vela Noire collection: Seasonal (with its 4 lines), Modern Muse, Traditions Reimagined,
 * Simplicity Speaks. Named ProductCollection so it doesn't clash with java.util.Collection.
 */
@Document("collections")
@Getter
@Setter
@NoArgsConstructor
public class ProductCollection {

    @Id
    private String id;

    private String slug;
    private String name;
    private String tagline;
    private String description;
    private String audience;
    private List<String> palette = new ArrayList<>();
    private String heroImage;
    private String heroVideo;
    private List<Line> lines;

    /** A seasonal line, e.g. Velvet Moon (WINTER). */
    @Getter
    @Setter
    @NoArgsConstructor
    public static class Line {
        private String name;
        private String season;
        private String theme;
        private List<String> palette = new ArrayList<>();
    }
}
