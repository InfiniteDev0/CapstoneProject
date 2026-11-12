package com.velanoire.api.service;

import com.velanoire.api.dto.catalog.ProductSummary;
import com.velanoire.api.dto.wishlist.WishlistItemResponse;
import com.velanoire.api.model.document.EventType;
import com.velanoire.api.model.document.Product;
import com.velanoire.api.model.entity.WishlistItem;
import com.velanoire.api.repository.jpa.WishlistItemRepository;
import com.velanoire.api.repository.mongo.ProductRepository;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Hearted products: the list lives in MySQL, the product details come from MongoDB. */
@Service
@RequiredArgsConstructor
public class WishlistService {

    private final WishlistItemRepository wishlist;
    private final ProductRepository products;
    private final CatalogService catalog;
    private final ClickstreamService clickstream;

    @Transactional(readOnly = true)
    public List<WishlistItemResponse> list(Long userId) {
        List<WishlistItem> items = wishlist.findByUserIdOrderByCreatedAtDesc(userId);
        // One trip to MongoDB for all the products, not one per heart
        Map<String, Product> byId = StreamSupport
                .stream(products.findAllById(items.stream().map(WishlistItem::getProductId).toList()).spliterator(), false)
                .collect(Collectors.toMap(Product::getId, Function.identity()));
        return items.stream()
                .map(i -> new WishlistItemResponse(i.getProductId(), i.getCreatedAt(),
                        byId.containsKey(i.getProductId()) ? ProductSummary.from(byId.get(i.getProductId())) : null))
                .toList();
    }

    /** Adding the same product twice is fine: it's already there. */
    @Transactional
    public List<WishlistItemResponse> add(Long userId, String productId) {
        Product product = catalog.requireVisible(productId); // Java checks the cross-database link
        if (wishlist.findByUserIdAndProductId(userId, productId).isEmpty()) {
            WishlistItem item = new WishlistItem();
            item.setUserId(userId);
            item.setProductId(productId);
            wishlist.save(item);
            clickstream.logServerEvent(userId, EventType.WISHLIST, productId, product.getCategory(), null);
        }
        return list(userId);
    }

    @Transactional
    public void remove(Long userId, String productId) {
        wishlist.findByUserIdAndProductId(userId, productId).ifPresent(wishlist::delete);
    }
}
