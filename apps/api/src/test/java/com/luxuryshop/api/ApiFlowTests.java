package com.luxuryshop.api;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import com.luxuryshop.api.model.document.Product;
import com.luxuryshop.api.repository.jpa.CartItemRepository;
import com.luxuryshop.api.repository.jpa.OrderRepository;
import com.luxuryshop.api.repository.jpa.UserDeviceRepository;
import com.luxuryshop.api.repository.mongo.ProductRepository;
import com.luxuryshop.api.service.StockService;
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
 * Uses the local luxuryshop databases with their seed data, and puts back anything it changes.
 * Run: cd apps/api && ./mvnw test   (MySQL and MongoDB must be running)
 */
@SpringBootTest
@AutoConfigureMockMvc
class ApiFlowTests {

    /** Marks this test's device rows and clicks so cleanup removes exactly those. */
    private static final String TEST_TAG = "test-mockmvc";
    private static final String RUNNER_ID = "6750a1000000000000000301"; // Stratus Runner (sizes 6 to 12)
    private static final String RUNNER_SKU = "LS-S-RUN-01-ONY";           // in Onyx

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
        if (stockTaken) stock.release(List.of(new StockService.StockLine(RUNNER_ID, RUNNER_SKU, 1, "test")));
        cart.findByUserIdOrderByCreatedAtAsc(2L).forEach(cart::delete);
        devices.deleteByDeviceId(TEST_TAG);
        mongo.remove(Query.query(Criteria.where("sessionId").is(TEST_TAG)), "clickstream_events");
    }

    @Test
    @DisplayName("Login works: the seeded admin gets a token and the ADMIN role")
    void loginWorks() throws Exception {
        mvc.perform(login("admin@luxuryshop.local", "LuxAdmin#2026"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.user.role").value("ADMIN"))
                .andExpect(jsonPath("$.user.passwordHash").doesNotExist());
    }

    @Test
    @DisplayName("A wrong password fails with 401 and the standard error shape")
    void wrongPasswordFails() throws Exception {
        mvc.perform(login("amira@luxuryshop.local", "not-her-password"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Unauthorized"))
                .andExpect(jsonPath("$.message").value("Invalid email or password"))
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    @DisplayName("A customer is blocked from admin routes (403); the admin gets in (200)")
    void customerBlockedFromAdmin() throws Exception {
        String amira = tokenFor("amira@luxuryshop.local", "Amira#Lux26");
        String admin = tokenFor("admin@luxuryshop.local", "LuxAdmin#2026");

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
        String amira = tokenFor("amira@luxuryshop.local", "Amira#Lux26");
        int before = runnerStock();

        mvc.perform(post("/api/cart/items").header("Authorization", "Bearer " + amira).header("X-Session-Id", TEST_TAG)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"productId\":\"" + RUNNER_ID + "\",\"sku\":\"" + RUNNER_SKU + "\",\"quantity\":1,\"selectedSize\":\"9\"}"))
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
                .andExpect(jsonPath("$.items[0].sku").value(RUNNER_SKU))
                .andReturn().getResponse().getContentAsString();
        createdOrderId = ((Number) JsonPath.read(receipt, "$.id")).longValue();
        stockTaken = true;

        assertThat(runnerStock()).as("stock after checkout").isEqualTo(before - 1);
        assertThat(orders.findById(createdOrderId)).isPresent();
        assertThat(cart.findByUserIdOrderByCreatedAtAsc(2L)).as("bag after checkout").isEmpty();
    }

    @Test
    @DisplayName("A product with sizes can't go in the bag without one (400 lists the sizes)")
    void sizeIsRequired() throws Exception {
        String amira = tokenFor("amira@luxuryshop.local", "Amira#Lux26");
        mvc.perform(post("/api/cart/items").header("Authorization", "Bearer " + amira).header("X-Session-Id", TEST_TAG)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"productId\":\"" + RUNNER_ID + "\",\"sku\":\"" + RUNNER_SKU + "\",\"quantity\":1}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Please pick a size: 6, 7, 8, 9, 10, 11, 12"));
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

    private int runnerStock() {
        Product p = products.findById(RUNNER_ID).orElseThrow();
        return p.variant(RUNNER_SKU).getStock();
    }
}
