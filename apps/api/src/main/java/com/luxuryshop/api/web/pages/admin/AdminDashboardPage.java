package com.luxuryshop.api.web.pages.admin;

import com.luxuryshop.api.dto.admin.DashboardStats;
import com.luxuryshop.api.dto.admin.InventoryRow;
import com.luxuryshop.api.dto.common.PageResponse;
import com.luxuryshop.api.dto.admin.CustomerRow;
import com.luxuryshop.api.dto.admin.AdminOrderRow;
import com.luxuryshop.api.dto.admin.AdminProductRow;
import com.luxuryshop.api.security.AuthUser;
import com.luxuryshop.api.service.admin.AdminCustomerService;
import com.luxuryshop.api.service.admin.AdminOrderService;
import com.luxuryshop.api.service.admin.AdminProductService;
import com.luxuryshop.api.service.admin.DashboardService;
import com.luxuryshop.api.web.LoginErrors;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

/**
 * The admin login page, the dashboard (sales, active users, churn, top categories),
 * the search in the top bar, and the two AI pages that switch on in Phase 7.
 */
@Controller
@RequiredArgsConstructor
public class AdminDashboardPage {

    private final DashboardService dashboard;
    private final AdminOrderService orders;
    private final AdminProductService products;
    private final AdminCustomerService customers;

    @GetMapping("/admin/login")
    public String login(@AuthenticationPrincipal AuthUser me, HttpServletRequest request, Model model) {
        if (me != null) return "redirect:/admin";
        model.addAttribute("error", LoginErrors.last(request));
        model.addAttribute("signedOut", request.getParameter("logout") != null);
        return "admin/login";
    }

    @GetMapping("/admin")
    public String dashboard(Model model) {
        DashboardStats stats = dashboard.stats();
        List<InventoryRow> low = products.inventory(AdminModelAdvice.LOW_STOCK, null);
        model.addAttribute("stats", stats);
        model.addAttribute("recentOrders", orders.list(null, null, 0, 6).items());
        model.addAttribute("lowStock", low.stream().limit(6).toList());
        return "admin/dashboard";
    }

    @GetMapping("/admin/search")
    public String search(@RequestParam(defaultValue = "") String q, Model model) {
        String query = q.trim();
        PageResponse<AdminProductRow> productHits = query.isEmpty() ? null : products.list(query, null, null, null, 0, 8);
        PageResponse<CustomerRow> customerHits = query.isEmpty() ? null : customers.list(query, "name", 0, 8);
        PageResponse<AdminOrderRow> orderHits = query.isEmpty() ? null : orders.list(null, query, 0, 8);
        model.addAttribute("q", query);
        model.addAttribute("productHits", productHits);
        model.addAttribute("customerHits", customerHits);
        model.addAttribute("orderHits", orderHits);
        return "admin/search";
    }

    @GetMapping("/admin/churn")
    public String churn(Model model) {
        model.addAttribute("title", "Churn Risk");
        model.addAttribute("description", "Customers the AI thinks may stop buying, as High / Medium / Low, with a one-click retention discount.");
        model.addAttribute("emptyTitle", "No churn predictions yet");
        model.addAttribute("emptyText", "Once the churn model is trained (Phase 6) and connected (Phase 7), every customer gets a risk level here, and you can send at-risk customers a retention discount.");
        return "admin/phase7";
    }

    @GetMapping("/admin/models")
    public String models(Model model) {
        model.addAttribute("title", "Model Health");
        model.addAttribute("description", "Accuracy, precision, recall and ROC-AUC for churn; Precision@K for recommendations.");
        model.addAttribute("emptyTitle", "No model scores yet");
        model.addAttribute("emptyText", "After the churn model and the recommender are trained in Phase 6, their test scores are saved and shown here, so you can see how far to trust the predictions.");
        return "admin/phase7";
    }
}
