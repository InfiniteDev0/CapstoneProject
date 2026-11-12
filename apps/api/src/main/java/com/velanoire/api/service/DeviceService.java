package com.velanoire.api.service;

import com.velanoire.api.model.entity.UserDevice;
import com.velanoire.api.repository.jpa.UserDeviceRepository;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Remembers which devices each customer uses (the churn model counts them). */
@Service
@RequiredArgsConstructor
public class DeviceService {

    private final UserDeviceRepository devices;

    /** Same browser again: update last_seen. New browser: add a row. */
    @Transactional
    public void recordLogin(Long userId, String userAgent, String deviceIdHeader) {
        String deviceId = (deviceIdHeader != null && !deviceIdHeader.isBlank())
                ? deviceIdHeader.trim().substring(0, Math.min(64, deviceIdHeader.trim().length()))
                : UserAgentParser.fingerprint(userAgent);
        UserAgentParser.DeviceInfo info = UserAgentParser.parse(userAgent);
        Instant now = Instant.now();

        UserDevice device = devices.findByUserIdAndDeviceId(userId, deviceId).orElseGet(() -> {
            UserDevice d = new UserDevice();
            d.setUserId(userId);
            d.setDeviceId(deviceId);
            d.setFirstSeen(now);
            return d;
        });
        device.setDeviceType(info.type());
        device.setOs(info.os());
        device.setBrowser(info.browser());
        device.setLastSeen(now);
        devices.save(device);
    }
}
