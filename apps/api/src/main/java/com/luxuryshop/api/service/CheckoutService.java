package com.luxuryshop.api.service;

import com.luxuryshop.api.dto.order.CheckoutRequest;
import com.luxuryshop.api.dto.order.OrderResponse;
import com.luxuryshop.api.exception.ApiException;
import com.luxuryshop.api.model.document.EventType;
import com.luxuryshop.api.model.document.Product;
import com.luxuryshop.api.model.entity.CartItem;
import com.luxuryshop.api.model.entity.OfferStatus;
import com.luxuryshop.api.model.entity.RetentionOffer;
import com.luxuryshop.api.repository.jpa.CartItemRepository;
import com.luxuryshop.api.repository.jpa.RetentionOfferRepository;
import com.luxuryshop.api.repository.mongo.ProductRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * Simulated checkout: bag → order. It touches BOTH databases, which can't share one transaction:
 *
 *   1. Price the bag from MongoDB and check every line is still buyable.
 *   2. MongoDB: take the stock (atomic, all-or-nothing across lines: StockService).
 *   3. MySQL:   write order + lines + payment + empty the bag in ONE transaction (OrderWriter).
 *   4. If step 3 fails, give the stock back in MongoDB (a "compensating action").
 *
 * So either everything happens, or nothing does, even across two databases.
 */
@Service
@RequiredArgsConstructor
public class CheckoutService {

    private final CartItemRepository cart;
    private final ProductRepository products;
    private final RetentionOfferRepository offers;
    private final StockService stock;
    private final OrderWriter orderWriter;
    private final ClickstreamService clickstream;

    public OrderResponse checkout(Long userId, CheckoutRequest req, String userAgent) {
        List<CartItem> bag = cart.findByUserIdOrderByCreatedAtAsc(userId);
        if (bag.isEmpty()) {
            throw ApiException.badRequest("Your bag is empty");
        }

        // 1. Price every line from the live catalogue (one trip to MongoDB)
        Map<String, Product> byId = StreamSupport
                .stream(products.findAllById(bag.stream().map(CartItem::getProductId).distinct().toList()).spliterator(), false)
                .collect(Collectors.toMap(Product::getId, Function.identity()));
        List<OrderWriter.Line> lines = new ArrayList<>();
        List<StockService.StockLine> stockLines = new ArrayList<>();
        BigDecimal subtotal = BigDecimal.ZERO;
        for (CartItem item : bag) {
            Product p = byId.get(item.getProductId());
            Product.ProductVariant v = p == null ? null : p.variant(item.getSku());
            if (p == null || v == null || !"LIVE".equals(p.getStatus())) {
                throw ApiException.conflict("An item in your bag is no longer available. Please remove it and try again.");
            }
            BigDecimal unit = Pricing.unitPrice(p, v);
            subtotal = subtotal.add(unit.multiply(BigDecimal.valueOf(item.getQuantity())));
            lines.add(new OrderWriter.Line(item, p.getName(), p.getCategory(), p.getSubCategory(), v.getColorName(), unit));
            stockLines.add(new StockService.StockLine(p.getId(), v.getSku(), item.getQuantity(),
                    p.getName() + " in " + v.getColorName()));
        }
        subtotal = Pricing.money(subtotal);

        // A win-back code from the admin (Phase 7 sends them): percent off the subtotal
        RetentionOffer offer = redeemable(req.discountCode(), userId);
        BigDecimal discount = offer == null ? Pricing.money(BigDecimal.ZERO)
                : Pricing.money(subtotal.multiply(BigDecimal.valueOf(offer.getPercentOff())).divide(BigDecimal.valueOf(100)));
        BigDecimal afterDiscount = subtotal.subtract(discount);
        BigDecimal shipping = Pricing.shippingFor(afterDiscount);
        var totals = new OrderWriter.Totals(subtotal, discount, shipping, Pricing.money(afterDiscount.add(shipping)));

        // 2. Take the stock in MongoDB
        List<StockService.StockLine> taken = stock.reserve(stockLines);

        // 3. Write the receipt in MySQL (all or nothing); 4. undo the stock if that fails
        OrderWriter.Placed placed;
        try {
            placed = orderWriter.place(userId, lines, totals, offer, req.shippingName().trim(), req.shippingAddress().trim(),
                    req.shippingCity().trim(), req.shippingCountry().trim(), req.paymentMethod(), req.cardLast4(),
                    UserAgentParser.parse(userAgent).type());
        } catch (RuntimeException e) {
            stock.release(taken);
            throw e;
        }

        clickstream.logServerEvent(userId, EventType.PURCHASE, null, null, placed.order().getId());
        return OrderResponse.from(placed.order(), placed.payment());
    }

    private RetentionOffer redeemable(String code, Long userId) {
        if (code == null || code.isBlank()) return null;
        RetentionOffer offer = offers.findByCode(code.trim().toUpperCase())
                .orElseThrow(() -> ApiException.badRequest("That discount code doesn't exist"));
        boolean expired = offer.getExpiresAt() != null && offer.getExpiresAt().isBefore(Instant.now());
        if (!offer.getUserId().equals(userId) || offer.getStatus() != OfferStatus.SENT || expired) {
            throw ApiException.badRequest("That discount code can't be used");
        }
        return offer;
    }
}
