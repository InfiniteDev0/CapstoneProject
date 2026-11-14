package com.luxuryshop.api.web.pages.admin;

import com.luxuryshop.api.dto.admin.AdminOrderRow;
import com.luxuryshop.api.dto.admin.InventoryRow;
import com.luxuryshop.api.dto.common.PageResponse;
import com.luxuryshop.api.dto.user.UserResponse;
import com.luxuryshop.api.model.entity.OrderStatus;
import com.luxuryshop.api.repository.jpa.UserRepository;
import com.luxuryshop.api.security.AuthUser;
import com.luxuryshop.api.service.admin.AdminOrderService;
import com.luxuryshop.api.service.admin.AdminProductService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ModelAttribute;

/**
 * What every admin page needs for its frame: who is signed in, which menu item is
 * active, and the bell (paid orders waiting to be packed + colours running low).
 */
@ControllerAdvice(basePackages = "com.luxuryshop.api.web.pages.admin")
@RequiredArgsConstructor
public class AdminModelAdvice {

    public static final int LOW_STOCK = 5;

    private final UserRepository users;
    private final AdminOrderService orders;
    private final AdminProductService products;

    @ModelAttribute
    public void frame(Model model, @AuthenticationPrincipal AuthUser me, HttpServletRequest request) {
        model.addAttribute("path", request.getRequestURI());
        if (me == null) return; // the login page
        model.addAttribute("me", users.findById(me.id()).map(UserResponse::from).orElse(null));

        PageResponse<AdminOrderRow> waiting = orders.list(OrderStatus.PAID, null, 0, 5);
        List<InventoryRow> low = products.inventory(LOW_STOCK, null);
        model.addAttribute("bellOrders", waiting.items());
        model.addAttribute("bellOrderCount", waiting.totalItems());
        model.addAttribute("bellLowStock", low.stream().limit(5).toList());
        model.addAttribute("bellLowStockCount", low.size());
        model.addAttribute("bellCount", waiting.totalItems() + low.size());
    }
}
