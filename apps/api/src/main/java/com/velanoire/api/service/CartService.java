package com.velanoire.api.service;

import com.velanoire.api.dto.cart.AddToCartRequest;
import com.velanoire.api.dto.cart.CartResponse;
import com.velanoire.api.exception.ApiException;
import com.velanoire.api.model.document.EventType;
import com.velanoire.api.model.document.Product;
import com.velanoire.api.model.entity.CartItem;
import com.velanoire.api.repository.jpa.CartItemRepository;
import com.velanoire.api.repository.mongo.ProductRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * The shopping bag. Rows live in MySQL; names, prices and stock come live from MongoDB.
 * Before writing to MySQL we check in MongoDB that the product and colour exist and are in stock:
 * there's no foreign key across the two databases, so this check IS the foreign key.
 */
@Service
@RequiredArgsConstructor
public class CartService {

    public static final int MAX_PER_LINE = 20;

    private final CartItemRepository cart;
    private final ProductRepository products;
    private final CatalogService catalog;
    private final ClickstreamService clickstream;

    @Transactional(readOnly = true)
    public CartResponse view(Long userId) {
        return price(cart.findByUserIdOrderByCreatedAtAsc(userId));
    }

    @Transactional
    public CartResponse add(Long userId, AddToCartRequest req) {
        Product product = catalog.requireBuyable(req.productId());
        Product.ProductVariant variant = product.variant(req.sku());
        if (variant == null) {
            throw ApiException.badRequest("Colour " + req.sku() + " is not part of " + product.getName());
        }
        String size = checkOptions(product, req);

        CartItem item = cart.findByUserIdAndSkuAndSelectedSize(userId, req.sku(), size).orElseGet(() -> {
            CartItem fresh = new CartItem();
            fresh.setUserId(userId);
            fresh.setProductId(product.getId());
            fresh.setSku(req.sku());
            fresh.setSelectedSize(size);
            fresh.setQuantity(0);
            return fresh;
        });
        int wanted = item.getQuantity() + req.quantity();
        checkQuantity(product, variant, wanted);
        item.setQuantity(wanted);
        item.setSelectedStyle(req.selectedStyle());
        item.setShaylaType(req.shaylaType());
        item.setCustomMeasurementsUrl(req.customMeasurementsUrl());
        item.setComments(req.comments());
        cart.save(item);

        clickstream.logServerEvent(userId, EventType.ADD_TO_CART, product.getId(), product.getCategory(), null);
        return view(userId);
    }

    @Transactional
    public CartResponse updateQuantity(Long userId, Long itemId, int quantity) {
        CartItem item = cart.findByIdAndUserId(itemId, userId).orElseThrow(() -> ApiException.notFound("Item not in your bag"));
        Product product = catalog.requireBuyable(item.getProductId());
        Product.ProductVariant variant = product.variant(item.getSku());
        if (variant == null) {
            throw ApiException.conflict("This colour is no longer sold; please remove it");
        }
        checkQuantity(product, variant, quantity);
        item.setQuantity(quantity);
        cart.save(item);
        return view(userId);
    }

    @Transactional
    public CartResponse remove(Long userId, Long itemId) {
        CartItem item = cart.findByIdAndUserId(itemId, userId).orElseThrow(() -> ApiException.notFound("Item not in your bag"));
        cart.delete(item);
        String category = products.findById(item.getProductId()).map(Product::getCategory).orElse(null);
        clickstream.logServerEvent(userId, EventType.REMOVE_FROM_CART, item.getProductId(), category, null);
        return view(userId);
    }

    @Transactional
    public CartResponse clear(Long userId) {
        cart.deleteByUserId(userId);
        return view(userId);
    }

    /** Abayas need a size from their size list; everything else is ONE_SIZE. Returns the size to store. */
    private static String checkOptions(Product product, AddToCartRequest req) {
        if (product.getAbaya() == null) {
            if (req.selectedStyle() != null || req.shaylaType() != null) {
                throw ApiException.badRequest("Style and shayla options are only for abayas");
            }
            return CartItem.ONE_SIZE;
        }
        var abaya = product.getAbaya();
        if (req.selectedSize() == null || req.selectedSize().isBlank()) {
            throw ApiException.badRequest("Please pick a size: " + String.join(", ", abaya.getSizes()));
        }
        String size = abaya.getSizes().stream().filter(s -> s.equalsIgnoreCase(req.selectedSize().trim())).findFirst()
                .orElseThrow(() -> ApiException.badRequest("Size must be one of: " + String.join(", ", abaya.getSizes())));
        if (req.selectedStyle() != null && !abaya.getStyles().contains(req.selectedStyle().name())) {
            throw ApiException.badRequest("This abaya comes in: " + String.join(", ", abaya.getStyles()));
        }
        return size;
    }

    private static void checkQuantity(Product product, Product.ProductVariant variant, int wanted) {
        if (wanted > MAX_PER_LINE) {
            throw ApiException.badRequest("You can have at most " + MAX_PER_LINE + " of one item");
        }
        int stock = variant.getStock() == null ? 0 : variant.getStock();
        if (wanted > stock) {
            throw ApiException.conflict(stock == 0
                    ? product.getName() + " in " + variant.getColorName() + " is sold out"
                    : "Only " + stock + " left of " + product.getName() + " in " + variant.getColorName());
        }
    }

    /** Turn the rows into a priced bag, using one trip to MongoDB for all products. */
    private CartResponse price(List<CartItem> rows) {
        Map<String, Product> byId = StreamSupport
                .stream(products.findAllById(rows.stream().map(CartItem::getProductId).distinct().toList()).spliterator(), false)
                .collect(Collectors.toMap(Product::getId, Function.identity()));

        BigDecimal subtotal = BigDecimal.ZERO;
        int count = 0;
        List<CartResponse.Line> lines = new java.util.ArrayList<>();
        for (CartItem row : rows) {
            Product p = byId.get(row.getProductId());
            Product.ProductVariant v = p == null ? null : p.variant(row.getSku());
            BigDecimal unit = p == null ? BigDecimal.ZERO : Pricing.unitPrice(p, v);
            BigDecimal lineTotal = Pricing.money(unit.multiply(BigDecimal.valueOf(row.getQuantity())));
            int stock = v == null || v.getStock() == null ? 0 : v.getStock();
            boolean available = p != null && "LIVE".equals(p.getStatus()) && v != null && stock >= row.getQuantity();
            lines.add(new CartResponse.Line(row.getId(), row.getProductId(), p == null ? null : p.getSlug(),
                    p == null ? "No longer available" : p.getName(),
                    v != null && !v.getImages().isEmpty() ? v.getImages().get(0)
                            : p != null && !p.getImages().isEmpty() ? p.getImages().get(0) : null,
                    p == null ? null : p.getCategory(), row.getSku(), v == null ? null : v.getColorName(),
                    row.getSelectedSize(), row.getSelectedStyle(), row.getShaylaType(), unit, row.getQuantity(), lineTotal,
                    stock, available));
            subtotal = subtotal.add(lineTotal);
            count += row.getQuantity();
        }
        subtotal = Pricing.money(subtotal);
        BigDecimal shipping = Pricing.shippingFor(subtotal);
        return new CartResponse(lines, count, subtotal, shipping, Pricing.money(subtotal.add(shipping)),
                Pricing.FREE_SHIPPING_FROM);
    }
}
