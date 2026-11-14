package com.luxuryshop.api.web.pages.admin;

import com.luxuryshop.api.dto.order.OrderResponse;
import com.luxuryshop.api.exception.ApiException;
import com.luxuryshop.api.model.entity.OrderStatus;
import com.luxuryshop.api.repository.jpa.UserRepository;
import com.luxuryshop.api.service.OrderService;
import com.luxuryshop.api.service.admin.AdminCustomerService;
import com.luxuryshop.api.service.admin.AdminOrderService;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

/** Orders (list, detail, move along) and customers (list, profile) in the manager's office. */
@Controller
@RequiredArgsConstructor
public class AdminOrderCustomerPages {

    /** Button text for each move an order can make. */
    static final Map<OrderStatus, String> ACTIONS = Map.of(
            OrderStatus.PAID, "Mark as paid",
            OrderStatus.PROCESSING, "Mark as processing",
            OrderStatus.SHIPPED, "Mark as shipped",
            OrderStatus.DELIVERED, "Mark as delivered",
            OrderStatus.CANCELLED, "Cancel order",
            OrderStatus.REFUNDED, "Refund order");

    private final AdminOrderService orders;
    private final AdminCustomerService customers;
    private final OrderService customerOrders;
    private final UserRepository users;

    @GetMapping("/admin/orders")
    public String orders(@RequestParam(required = false) OrderStatus status, @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page, Model model) {
        model.addAttribute("results", orders.list(status, q, Math.max(page, 0), 20));
        model.addAttribute("status", status);
        model.addAttribute("q", q);
        model.addAttribute("statuses", OrderStatus.values());
        return "admin/orders";
    }

    @GetMapping("/admin/orders/{id}")
    public String order(@PathVariable Long id, Model model) {
        OrderResponse order = orders.get(id);
        model.addAttribute("order", order);
        model.addAttribute("customer", users.findById(order.userId()).orElse(null));
        model.addAttribute("moves", AdminOrderService.nextStatuses(order.status()).stream().sorted().toList());
        model.addAttribute("actions", ACTIONS);
        return "admin/order";
    }

    @PostMapping("/admin/orders/{id}/status")
    public String move(@PathVariable Long id, @RequestParam OrderStatus next, RedirectAttributes flash) {
        try {
            OrderResponse o = orders.updateStatus(id, next);
            flash.addFlashAttribute("toast", o.orderNumber() + " is now " + next.name().toLowerCase()
                    + (next == OrderStatus.CANCELLED || next == OrderStatus.REFUNDED ? " (stock returned)" : ""));
        } catch (ApiException e) {
            flash.addFlashAttribute("toast", e.getMessage());
            flash.addFlashAttribute("toastType", "error");
        }
        return "redirect:/admin/orders/" + id;
    }

    @GetMapping("/admin/customers")
    public String customers(@RequestParam(required = false) String q, @RequestParam(defaultValue = "newest") String sort,
            @RequestParam(defaultValue = "0") int page, Model model) {
        String safeSort = List.of("newest", "oldest", "name", "last_login").contains(sort) ? sort : "newest";
        model.addAttribute("results", customers.list(q, safeSort, Math.max(page, 0), 20));
        model.addAttribute("q", q);
        model.addAttribute("sort", safeSort);
        return "admin/customers";
    }

    @GetMapping("/admin/customers/{id}")
    public String customer(@PathVariable Long id, Model model) {
        model.addAttribute("profile", customers.get(id));
        model.addAttribute("orders", customerOrders.myOrders(id, 0, 20).items());
        return "admin/customer";
    }
}
