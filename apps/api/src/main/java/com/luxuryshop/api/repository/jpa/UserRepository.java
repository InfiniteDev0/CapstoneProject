package com.luxuryshop.api.repository.jpa;

import com.luxuryshop.api.model.entity.Role;
import com.luxuryshop.api.model.entity.User;
import java.time.Instant;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * Storeroom keeper for the "users" shelf in MySQL.
 * JpaRepository already gives save, findById, findAll, delete, count...
 * Spring writes the SQL for the extra methods from their names.
 */
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email); // SELECT * FROM users WHERE email = ?

    boolean existsByEmail(String email);

    long countByRole(Role role);

    long countByRoleAndLastLoginAtAfter(Role role, Instant since);

    long countByRoleAndCreatedAtAfter(Role role, Instant since);

    /** Admin customer list: customers only, optional search on name or email (q is "%text%", lowercase). */
    @Query("""
            select u from User u
            where u.role = com.luxuryshop.api.model.entity.Role.CUSTOMER
              and (:q is null or lower(u.name) like :q or lower(u.email) like :q)
            """)
    Page<User> searchCustomers(@Param("q") String q, Pageable pageable);
}
