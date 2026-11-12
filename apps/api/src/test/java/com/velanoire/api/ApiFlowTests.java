package com.velanoire.api;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import com.velanoire.api.model.document.Product;
import com.velanoire.api.repository.jpa.CartItemRepository;
import com.velanoire.api.repository.jpa.OrderRepository;
import com.velanoire.api.repository.jpa.UserDeviceRepository;
import com.velanoire.api.repository.mongo.ProductRepository;
import com.velanoire.api.service.StockService;
import java.util.List;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

/**
 * End-to-end checks with MockMvc: a pretend browser that sends real requests through the whole kitchen
 * (security, controllers, services, MySQL and MongoDB) without starting a web server.
 *
 * Uses the local vela_noire databases with their seed data, and puts back anything it changes.
 * Run: cd apps/api && ./mvnw test   (MySQL and MongoDB must be running)
 */
@SpringBootTest
@AutoConfigureMockMvc
class ApiFlowTests {

    /** Marks this test's device rows and clicks so cleanup removes exactly those. */
    private static final String TEST_TAG = "test-mockmvc";
    private static final String PERFUME_ID = "6750a1000000000000000102"; // Ruqayyah Eau de Parfum
    private static final String PERFUME_SKU = "VN-PRF-VM-02-50";

    @Autowired MockMvc mvc;
    @Autowired ProductRepository products;
    @Autowired OrderRepository orders;
    @Autowired CartItemRepository cart;
    @Autowired UserDeviceRepository devices;
    @Autowired StockService stock;
    @Autowired MongoTemplate mongo;

    private Long createdOrderId;
    private boolean stockTaken;

    @AfterEach
    void putEverythingBack() {
        if (createdOrderId != null) orders.deleteById(createdOrderId); // its lines and payment go with it
        if (stockTaken) stock.release(List.of(new StockService.StockLine(PERFUME_ID, PERFUME_SKU, 1, "test")));
        cart.findByUserIdOrderByCreatedAtAsc(2L).forEach(cart::delete);
        devices.deleteByDeviceId(TEST_TAG);
        mongo.remove(Query.query(Criteria.where("sessionId").is(TEST_TAG)), "clickstream_events");
    }

    @Test
    @DisplayName("Login works: the seeded admin gets a token and the ADMIN role")
    void loginWorks() throws Exception {
        mvc.perform(login("admin@velanoire.local", "VelaAdmin#2026"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.user.role").value("ADMIN"))
                .andExpect(jsonPath("$.user.passwordHash").doesNotExist());
    }

    @Test
    @DisplayName("A wrong password fails with 401 and the standard error shape")
    void wrongPasswordFails() throws Exception {
        mvc.perform(login("amira@example.com", "not-her-password"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Unauthorized"))
                .andExpect(jsonPath("$.message").value("Invalid email or password"))
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    @DisplayName("A customer is blocked from admin routes (403); the admin gets in (200)")
    void customerBlockedFromAdmin() throws Exception {
        String amira = tokenFor("amira@example.com", "Amira#Noire26");
        String admin = tokenFor("admin@velanoire.local", "VelaAdmin#2026");

        mvc.perform(get("/api/admin/dashboard/stats").header("Authorization", "Bearer " + amira))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
        mvc.perform(get("/api/admin/dashboard/stats"))
                .andExpect(status().isUnauthorized());
        mvc.perform(get("/api/admin/dashboard/stats").header("Authorization", "Bearer " + admin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalSales").exists());
    }

    @Test
    @DisplayName("Checkout lowers stock in MongoDB, saves the order in MySQL and empties the bag")
    void checkoutLowersStock() throws Exception {
        String amira = tokenFor("amira@example.com", "Amira#Noire26");
        int before = perfumeStock();

        mvc.perform(post("/api/cart/items").header("Authorization", "Bearer " + amira).header("X-Session-Id", TEST_TAG)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"productId\":\"" + PERFUME_ID + "\",\"sku\":\"" + PERFUME_SKU + "\",\"quantity\":1}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.itemCount").value(1));

        String receipt = mvc.perform(post("/api/orders/checkout").header("Authorization", "Bearer " + amira)
                        .header("X-Session-Id", TEST_TAG).contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"shippingName":"Amira Hassan","shippingAddress":"12 Corniche Road","shippingCity":"Abu Dhabi",
                                 "shippingCountry":"United Arab Emirates","paymentMethod":"CARD","cardLast4":"4242"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("PAID"))
                .andExpect(jsonPath("$.payment.status").value("SUCCEEDED"))
                .andExpect(jsonPath("$.items[0].sku").value(PERFUME_SKU))
                .andReturn().getResponse().getContentAsString();
        createdOrderId = ((Number) JsonPath.read(receipt, "$.id")).longValue();
        stockTaken = true;

        assertThat(perfumeStock()).as("stock after checkout").isEqualTo(before - 1);
        assertThat(orders.findById(createdOrderId)).isPresent();
        assertThat(cart.findByUserIdOrderByCreatedAtAsc(2L)).as("bag after checkout").isEmpty();
    }

    // --- helpers -------------------------------------------------------------------

    private org.springframework.test.web.servlet.RequestBuilder login(String email, String password) {
        return post("/api/auth/login").header("X-Device-Id", TEST_TAG).contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}");
    }

    private String tokenFor(String email, String password) throws Exception {
        String body = mvc.perform(login(email, password)).andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        return JsonPath.read(body, "$.token");
    }

    private int perfumeStock() {
        Product p = products.findById(PERFUME_ID).orElseThrow();
        return p.variant(PERFUME_SKU).getStock();
    }
}
