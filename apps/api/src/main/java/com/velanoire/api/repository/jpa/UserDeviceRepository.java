package com.velanoire.api.repository.jpa;

import com.velanoire.api.model.entity.UserDevice;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserDeviceRepository extends JpaRepository<UserDevice, Long> {

    Optional<UserDevice> findByUserIdAndDeviceId(Long userId, String deviceId);

    long countByUserId(Long userId);

    List<UserDevice> findByUserIdOrderByLastSeenDesc(Long userId);
}
