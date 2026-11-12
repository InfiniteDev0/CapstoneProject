package com.velanoire.api.dto.admin;

/** One colour on the shelf, for the inventory page (lowest stock first). */
public record InventoryRow(String productId, String productName, String category, String status, String sku,
        String colorName, String colorHex, int stock) {
}
