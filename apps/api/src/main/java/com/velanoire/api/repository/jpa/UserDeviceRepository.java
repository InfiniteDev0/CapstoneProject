package com.velanoire.api.repository.jpa;

import com.velanoire.api.model.entity.UserDevice;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

public interface UserDeviceRepository extends JpaRepository<UserDevice, Long> {

    Optional<UserDevice> findByUserIdAndDeviceId(Long userId, String deviceId);

    long countByUserId(Long userId);

    List<UserDevice> findByUserIdOrderByLastSeenDesc(Long userId);

    /** For the admin customer list: [userId, deviceCount] for a page of customers at once. */
    @Query("select d.userId, count(d) from UserDevice d where d.userId in :ids group by d.userId")
    List<Object[]> countsForUsers(@Param("ids") Collection<Long> ids);

    @Transactional
    void deleteByDeviceId(String deviceId);
}
