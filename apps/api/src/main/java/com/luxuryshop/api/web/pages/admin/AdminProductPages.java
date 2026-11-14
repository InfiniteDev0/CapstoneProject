package com.luxuryshop.api.web.pages.admin;

import com.luxuryshop.api.exception.ApiException;
import com.luxuryshop.api.model.document.Product;
import com.luxuryshop.api.service.CatalogService;
import com.luxuryshop.api.service.admin.AdminProductService;
import com.luxuryshop.api.web.Forms;
import com.luxuryshop.api.web.UploadService;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

/**
 * Products in the manager's office: the list with filters, the add/edit form
 * (category + subcategory, sizes, specs, colours with stock), photos, delete,
 * and the inventory page with quick restock.
 */
@Controller
@RequiredArgsConstructor
public class AdminProductPages {

    static final List<String> STATUSES = List.of("IN_PRODUCTION", "READY_TO_LAUNCH", "LIVE", "SOLD_OUT", "DISCONTINUED");

    private final AdminProductService products;
    private final CatalogService catalog;
    private final UploadService uploads;
    private final Forms forms;

    @GetMapping("/admin/products")
    public String list(@RequestParam(required = false) String q, @RequestParam(required = false) String category,
            @RequestParam(required = false) String sub, @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page, Model model) {
        model.addAttribute("results", products.list(q, empty(category), empty(sub), empty(status), Math.max(page, 0), 20));
        model.addAttribute("q", q);
        model.addAttribute("category", empty(category));
        model.addAttribute("sub", empty(sub));
        model.addAttribute("status", empty(status));
        model.addAttribute("categories", catalog.categories());
        model.addAttribute("statuses", STATUSES);
        return "admin/products";
    }

    @GetMapping("/admin/products/new")
    public String newProduct(Model model) {
        return form(model, ProductForm.blank(), null, null);
    }

    @PostMapping("/admin/products")
    public String create(@ModelAttribute ProductForm form, Model model, RedirectAttributes flash) {
        try {
            Product saved = products.create(forms.check(form.toRequest()));
            flash.addFlashAttribute("toast", "Product created. Add its photos below.");
            return "redirect:/admin/products/" + saved.getId();
        } catch (ApiException e) {
            return form(model, form, null, e.getMessage());
        }
    }

    @GetMapping("/admin/products/{id}")
    public String edit(@PathVariable String id, Model model) {
        Product p = products.get(id);
        return form(model, ProductForm.from(p), p, null);
    }

    @PostMapping("/admin/products/{id}")
    public String update(@PathVariable String id, @ModelAttribute ProductForm form, Model model, RedirectAttributes flash) {
        Product current = products.get(id);
        form.setImages(new ArrayList<>(current.getImages())); // photos are managed by their own buttons
        try {
            products.update(id, forms.check(form.toRequest()));
            flash.addFlashAttribute("toast", "Changes saved");
            return "redirect:/admin/products/" + id;
        } catch (ApiException e) {
            return form(model, form, current, e.getMessage());
        }
    }

    @PostMapping("/admin/products/{id}/delete")
    public String delete(@PathVariable String id, RedirectAttributes flash) {
        Product p = products.get(id);
        products.delete(id);
        p.getImages().forEach(uploads::deleteIfUploaded);
        flash.addFlashAttribute("toast", p.getName() + " deleted");
        return "redirect:/admin/products";
    }

    // ---- photos --------------------------------------------------------------------

    @PostMapping("/admin/products/{id}/images")
    public String addPhotos(@PathVariable String id, @RequestParam("files") List<MultipartFile> files, RedirectAttributes flash) {
        Product p = products.get(id);
        List<String> images = new ArrayList<>(p.getImages());
        int added = 0;
        try {
            for (MultipartFile file : files) {
                if (file.isEmpty()) continue;
                if (images.size() >= 12) throw ApiException.badRequest("A product can have at most 12 photos");
                images.add(uploads.saveProductImage(file));
                added++;
            }
            if (added == 0) throw ApiException.badRequest("Please choose at least one photo");
            products.setImages(id, images);
            flash.addFlashAttribute("toast", added == 1 ? "Photo added" : added + " photos added");
        } catch (ApiException e) {
            if (added > 0) products.setImages(id, images);
            flash.addFlashAttribute("toast", e.getMessage());
            flash.addFlashAttribute("toastType", "error");
        }
        return "redirect:/admin/products/" + id + "#photos";
    }

    @PostMapping("/admin/products/{id}/images/remove")
    public String removePhoto(@PathVariable String id, @RequestParam String url, RedirectAttributes flash) {
        Product p = products.get(id);
        List<String> images = new ArrayList<>(p.getImages());
        if (images.remove(url)) {
            products.setImages(id, images);
            uploads.deleteIfUploaded(url);
            flash.addFlashAttribute("toast", "Photo removed");
        }
        return "redirect:/admin/products/" + id + "#photos";
    }

    @PostMapping("/admin/products/{id}/images/cover")
    public String makeCover(@PathVariable String id, @RequestParam String url, RedirectAttributes flash) {
        Product p = products.get(id);
        List<String> images = new ArrayList<>(p.getImages());
        if (images.remove(url)) {
            images.add(0, url);
            products.setImages(id, images);
            flash.addFlashAttribute("toast", "Cover photo changed");
        }
        return "redirect:/admin/products/" + id + "#photos";
    }

    // ---- inventory -----------------------------------------------------------------

    @GetMapping("/admin/inventory")
    public String inventory(@RequestParam(defaultValue = "low") String show, @RequestParam(required = false) String category,
            Model model) {
        Integer limit = switch (show) {
            case "out" -> 0;
            case "all" -> null;
            default -> AdminModelAdvice.LOW_STOCK;
        };
        model.addAttribute("rows", products.inventory(limit, empty(category)));
        model.addAttribute("show", show);
        model.addAttribute("category", empty(category));
        model.addAttribute("categories", catalog.categories());
        return "admin/inventory";
    }

    @PostMapping("/admin/inventory/stock")
    public String restock(@RequestParam String productId, @RequestParam String sku, @RequestParam int stock,
            @RequestParam(defaultValue = "low") String show, @RequestParam(required = false) String category,
            RedirectAttributes flash) {
        if (stock < 0 || stock > 100000) {
            flash.addFlashAttribute("toast", "Stock must be between 0 and 100000");
            flash.addFlashAttribute("toastType", "error");
        } else {
            products.setStock(productId, sku, stock);
            flash.addFlashAttribute("toast", sku + " now has " + stock + " on the shelf");
        }
        return "redirect:/admin/inventory?show=" + show + (category == null || category.isBlank() ? "" : "&category=" + category);
    }

    private String form(Model model, ProductForm form, Product existing, String error) {
        model.addAttribute("form", form);
        model.addAttribute("product", existing);
        model.addAttribute("error", error);
        model.addAttribute("categories", catalog.categories());
        model.addAttribute("statuses", STATUSES);
        return "admin/product-form";
    }

    private static String empty(String s) {
        return s == null || s.isBlank() ? null : s;
    }
}
