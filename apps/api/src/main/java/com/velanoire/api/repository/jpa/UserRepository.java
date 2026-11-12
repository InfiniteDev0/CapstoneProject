package com.velanoire.api.repository.jpa;

import com.velanoire.api.model.entity.User;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Storeroom keeper for the "users" shelf in MySQL.
 * JpaRepository already gives save, findById, findAll, delete, count...
 * Spring writes the SQL for the extra methods from their names.
 */
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email); // SELECT * FROM users WHERE email = ?

    boolean existsByEmail(String email);
}
