package com.luxuryshop.api.service;

import com.luxuryshop.api.model.entity.CartItem;
import com.luxuryshop.api.model.entity.DeviceType;
import com.luxuryshop.api.model.entity.OfferStatus;
import com.luxuryshop.api.model.entity.Order;
import com.luxuryshop.api.model.entity.OrderItem;
import com.luxuryshop.api.model.entity.OrderStatus;
import com.luxuryshop.api.model.entity.Payment;
import com.luxuryshop.api.model.entity.PaymentMethod;
import com.luxuryshop.api.model.entity.PaymentStatus;
import com.luxuryshop.api.model.entity.RetentionOffer;
import com.luxuryshop.api.repository.jpa.CartItemRepository;
import com.luxuryshop.api.repository.jpa.OrderRepository;
import com.luxuryshop.api.repository.jpa.PaymentRepository;
import com.luxuryshop.api.repository.jpa.RetentionOfferRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.HexFormat;
import java.util.List;
import java.security.SecureRandom;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Writes a checkout into the MySQL receipt book.
 *
 * @Transactional = ALL OR NOTHING. The order, its lines, the payment, the redeemed discount and
 * the emptied bag are saved together. If anything fails half-way (say the payment insert breaks),
 * MySQL rolls everything back: you never get an order without its lines, a payment without an
 * order, or a bag that was emptied for an order that doesn't exist.
 *
 * It lives in its own class on purpose: Spring adds the transaction around calls that come in
 * from OUTSIDE the bean (CheckoutService calling this), not around a class calling itself.
 */
@Service
@RequiredArgsConstructor
public class OrderWriter {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final OrderRepository orders;
    private final PaymentRepository payments;
    private final CartItemRepository cart;
    private final RetentionOfferRepository offers;

    /** One priced line, worked out by CheckoutService from the bag and the catalogue. */
    public record Line(CartItem cartItem, String productName, String category, String subCategory, String colorName,
            BigDecimal unitPrice) {
    }

    public record Totals(BigDecimal subtotal, BigDecimal discount, BigDecimal shipping, BigDecimal total) {
    }

    public record Placed(Order order, Payment payment) {
    }

    @Transactional
    public Placed place(Long userId, List<Line> lines, Totals totals, RetentionOffer offer, String shippingName,
            String shippingAddress, String shippingCity, String shippingCountry, PaymentMethod method, String cardLast4,
            DeviceType device) {
        Order order = new Order();
        order.setUserId(userId);
        order.setOrderNumber("TMP-" + randomHex(8)); // real number below, once MySQL has given us the id
        order.setStatus(OrderStatus.PAID);
        order.setSubtotal(totals.subtotal());
        order.setDiscountAmount(totals.discount());
        order.setShippingFee(totals.shipping());
        order.setTotal(totals.total());
        order.setRetentionOfferId(offer == null ? null : offer.getId());
        order.setShippingName(shippingName);
        order.setShippingAddress(shippingAddress);
        order.setShippingCity(shippingCity);
        order.setShippingCountry(shippingCountry);
        order.setDeviceType(device);
        orders.save(order); // INSERT now: AUTO_INCREMENT hands back the id
        order.setOrderNumber(String.format("LS-%d-%06d", LocalDate.now(ZoneOffset.UTC).getYear(), order.getId()));

        for (Line line : lines) {
            CartItem c = line.cartItem();
            OrderItem item = new OrderItem();
            item.setProductId(c.getProductId());
            item.setSku(c.getSku());
            item.setProductName(line.productName()); // the snapshot: copied, not linked
            item.setCategory(line.category());
            item.setSubCategory(line.subCategory());
            item.setColorName(line.colorName());
            item.setUnitPrice(line.unitPrice());
            item.setQuantity(c.getQuantity());
            item.setSelectedSize(c.getSelectedSize());
            item.setComments(c.getComments());
            order.addItem(item);
        }

        Payment payment = new Payment();
        payment.setOrderId(order.getId());
        payment.setAmount(totals.total());
        payment.setMethod(method);
        payment.setStatus(PaymentStatus.SUCCEEDED); // simulated: always approved
        payment.setReference("SIM-TXN-" + LocalDate.now(ZoneOffset.UTC).format(DateTimeFormatter.BASIC_ISO_DATE) + "-"
                + randomHex(4).toUpperCase());
        payment.setCardLast4(method == PaymentMethod.CARD ? cardLast4 : null);
        payment.setPaidAt(Instant.now());
        payments.save(payment);

        if (offer != null) {
            offer.setStatus(OfferStatus.REDEEMED);
            offer.setRedeemedAt(Instant.now());
            offers.save(offer);
        }

        cart.deleteByUserId(userId);
        return new Placed(order, payment);
    }

    private static String randomHex(int bytes) {
        byte[] b = new byte[bytes];
        RANDOM.nextBytes(b);
        return HexFormat.of().formatHex(b);
    }
}
