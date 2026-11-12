package com.velanoire.api.controller.admin;

import com.velanoire.api.dto.admin.AdminProductRow;
import com.velanoire.api.dto.admin.InventoryRow;
import com.velanoire.api.dto.admin.ProductRequest;
import com.velanoire.api.dto.admin.StockUpdateRequest;
import com.velanoire.api.dto.admin.VariantRequest;
import com.velanoire.api.dto.admin.VariantUpdateRequest;
import com.velanoire.api.dto.common.PageResponse;
import com.velanoire.api.model.document.Product;
import com.velanoire.api.service.admin.AdminProductService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** Inventory management (ADMIN only: /api/admin/** in SecurityConfig). */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Tag(name = "8. Admin: products & stock")
public class AdminProductController {

    private final AdminProductService products;

    @GetMapping("/products")
    @Operation(summary = "All products, any status (search name or SKU; filter by category, collection, status)")
    public PageResponse<AdminProductRow> list(@RequestParam(required = false) String q,
            @RequestParam(required = false) String category, @RequestParam(required = false) String collection,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") @Min(0) int page, @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        return products.list(q, category, collection, status, page, size);
    }

    @GetMapping("/products/{id}")
    @Operation(summary = "One product, everything")
    public Product get(@PathVariable String id) {
        return products.get(id);
    }

    @PostMapping("/products")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Add a product (status defaults to IN_PRODUCTION, hidden from the shop)")
    public Product create(@Valid @RequestBody ProductRequest request) {
        return products.create(request);
    }

    @PutMapping("/products/{id}")
    @Operation(summary = "Replace a product's details and colours")
    public Product update(@PathVariable String id, @Valid @RequestBody ProductRequest request) {
        return products.update(id, request);
    }

    @DeleteMapping("/products/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete a product (also its reviews, bag and wishlist rows; old orders keep their snapshot)")
    public void delete(@PathVariable String id) {
        products.delete(id);
    }

    @PostMapping("/products/{id}/variants")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Add a colour")
    public Product addVariant(@PathVariable String id, @Valid @RequestBody VariantRequest request) {
        return products.addVariant(id, request);
    }

    @PatchMapping("/products/{id}/variants/{sku}")
    @Operation(summary = "Change a colour (send only what changes)")
    public Product updateVariant(@PathVariable String id, @PathVariable String sku, @Valid @RequestBody VariantUpdateRequest request) {
        return products.updateVariant(id, sku, request);
    }

    @DeleteMapping("/products/{id}/variants/{sku}")
    @Operation(summary = "Remove a colour (a product keeps at least one)")
    public Product removeVariant(@PathVariable String id, @PathVariable String sku) {
        return products.removeVariant(id, sku);
    }

    @PutMapping("/products/{id}/variants/{sku}/stock")
    @Operation(summary = "Set how many pieces of a colour are on the shelf")
    public Product setStock(@PathVariable String id, @PathVariable String sku, @Valid @RequestBody StockUpdateRequest request) {
        return products.setStock(id, sku, request.stock());
    }

    @GetMapping("/inventory")
    @Operation(summary = "Every colour's stock, lowest first (atOrBelow=5 for the low-stock list)")
    public List<InventoryRow> inventory(@RequestParam(required = false) @Min(0) Integer atOrBelow,
            @RequestParam(required = false) String category) {
        return products.inventory(atOrBelow, category);
    }
}
