package com.luxuryshop.api;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.redirectedUrl;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.luxuryshop.api.repository.jpa.UserDeviceRepository;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;

/**
 * The Thymeleaf pages, rendered for real (templates, security, services, databases):
 * the shop is open for browsing, private pages ask you to log in, and the admin door
 * only lets managers in. Also checks CSRF: a form posted without its token is refused.
 */
@SpringBootTest
@AutoConfigureMockMvc
class WebPagesTests {

    /** A fixed device id for the test logins, so cleanup can remove exactly that device row. */
    private static final Cookie TEST_DEVICE = new Cookie("ls_device", "00000000-0000-4000-8000-000000007e57");

    @Autowired MockMvc mvc;
    @Autowired UserDeviceRepository devices;
    @Autowired MongoTemplate mongo;

    @AfterEach
    void tidyUp() {
        devices.deleteByDeviceId(TEST_DEVICE.getValue());
        mongo.remove(Query.query(Criteria.where("sessionId").regex("^web-")).addCriteria(Criteria.where("userId").isNull())
                .addCriteria(Criteria.where("page").regex("^/(product|search)")), "clickstream_events");
    }

    @Test
    @DisplayName("Anyone can browse: home, a category, a product page and search render")
    void browsingIsOpen() throws Exception {
        mvc.perform(get("/")).andExpect(status().isOk()).andExpect(content().string(containsString("New Arrivals")));
        mvc.perform(get("/categories/men").param("sub", "outerwear"))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("Men&#39;s Alpine Down Parka")));
        mvc.perform(get("/product/stratus-runner"))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("Add to Bag")))
                .andExpect(content().string(containsString("Related Products")));
        mvc.perform(get("/search").param("q", "cashmere")).andExpect(status().isOk())
                .andExpect(content().string(containsString("Men&#39;s Cashmere Hoodie")));
    }

    @Test
    @DisplayName("Unknown pages show the friendly 404 page")
    void unknownProductIs404() throws Exception {
        mvc.perform(get("/product/no-such-thing")).andExpect(status().isNotFound())
                .andExpect(content().string(containsString("No product called")));
    }

    @Test
    @DisplayName("The bag, account and admin ask guests to log in first")
    void privatePagesNeedLogin() throws Exception {
        mvc.perform(get("/cart")).andExpect(status().is3xxRedirection()).andExpect(redirectedUrl("/login"));
        mvc.perform(get("/account")).andExpect(status().is3xxRedirection()).andExpect(redirectedUrl("/login"));
        mvc.perform(get("/admin")).andExpect(status().is3xxRedirection()).andExpect(redirectedUrl("/admin/login"));
        mvc.perform(post("/web/cart").with(csrf())).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Shop login works with a session; a form without its CSRF token is refused")
    void shopLogin() throws Exception {
        mvc.perform(post("/login").param("email", "amira@luxuryshop.local").param("password", "Amira#Lux26"))
                .andExpect(status().isForbidden()); // no CSRF token
        MockHttpSession session = new MockHttpSession();
        mvc.perform(post("/login").session(session).cookie(TEST_DEVICE).with(csrf())
                        .param("email", "amira@luxuryshop.local").param("password", "Amira#Lux26"))
                .andExpect(status().is3xxRedirection()).andExpect(redirectedUrl("/"));
        mvc.perform(get("/account").session(session)).andExpect(status().isOk())
                .andExpect(content().string(containsString("Amira Hassan")));
        // the shop login is NOT an admin login
        mvc.perform(get("/admin").session(session)).andExpect(status().is3xxRedirection());
    }

    @Test
    @DisplayName("The admin door refuses customers with a clear message and lets the admin in")
    void adminLogin() throws Exception {
        MockHttpSession session = new MockHttpSession();
        mvc.perform(post("/admin/login").session(session).cookie(TEST_DEVICE).with(csrf())
                        .param("email", "amira@luxuryshop.local").param("password", "Amira#Lux26"))
                .andExpect(redirectedUrl("/admin/login?error"));
        mvc.perform(get("/admin/login").param("error", "").session(session))
                .andExpect(content().string(containsString("doesn&#39;t have admin access")));

        mvc.perform(post("/admin/login").session(session).cookie(TEST_DEVICE).with(csrf())
                        .param("email", "admin@luxuryshop.local").param("password", "LuxAdmin#2026"))
                .andExpect(redirectedUrl("/admin"));
        mvc.perform(get("/admin").session(session)).andExpect(status().isOk())
                .andExpect(content().string(containsString("Total sales")));
        mvc.perform(get("/admin/products").session(session)).andExpect(status().isOk())
                .andExpect(content().string(containsString("Stratus Runner")));
        mvc.perform(get("/admin/inventory").param("show", "all").session(session)).andExpect(status().isOk());
        mvc.perform(get("/admin/orders").session(session)).andExpect(status().isOk())
                .andExpect(content().string(containsString("LS-2026-000001")));
        mvc.perform(get("/admin/customers").session(session)).andExpect(status().isOk());
        mvc.perform(get("/admin/products/new").session(session)).andExpect(status().isOk());
    }
}
