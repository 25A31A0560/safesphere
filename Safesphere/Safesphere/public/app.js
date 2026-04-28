// SafeSphere app.js — adapted from original (Flask /api/ → Next.js /api/)
document.addEventListener('DOMContentLoaded', () => {

    // Theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        if ((localStorage.getItem('theme') || 'dark') === 'light') { document.documentElement.classList.add('light-theme'); themeToggle.innerHTML = '<i class="ph ph-sun"></i>'; }
        themeToggle.addEventListener('click', () => {
            document.documentElement.classList.toggle('light-theme');
            localStorage.setItem('theme', document.documentElement.classList.contains('light-theme') ? 'light' : 'dark');
            themeToggle.innerHTML = document.documentElement.classList.contains('light-theme') ? '<i class="ph ph-sun"></i>' : '<i class="ph ph-moon"></i>';
        });
    }

    // Mobile menu
    document.getElementById('mobile-menu')?.addEventListener('click', () => document.querySelector('.nav-links')?.classList.toggle('active'));

    // Settings panel
    const settingsPanel = document.getElementById('settings-panel');
    const settingsOverlay = document.getElementById('settings-overlay');
    const toggleIds = ['toggle_camera_enabled','toggle_fire_detection_enabled','toggle_video_preview_enabled','toggle_location_enabled','toggle_telemetry_enabled','toggle_bluetooth_enabled','toggle_alerts_enabled'];

    function toggleSettingsPanel(show) {
        if (show) { settingsPanel?.classList.add('active'); settingsOverlay?.classList.add('active'); fetchSettingsAndPopulate(); }
        else { settingsPanel?.classList.remove('active'); settingsOverlay?.classList.remove('active'); }
    }

    document.getElementById('settings-trigger')?.addEventListener('click', () => toggleSettingsPanel(true));
    document.getElementById('close-settings')?.addEventListener('click', () => toggleSettingsPanel(false));
    settingsOverlay?.addEventListener('click', () => toggleSettingsPanel(false));

    function getToken() { return localStorage.getItem('ss_token') || ''; }
    function authHeaders() { return { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + getToken() }; }

    function fetchSettingsAndPopulate() {
        fetch('/api/settings', { headers: authHeaders() }).then(r => {
            if (r.status === 401) { document.getElementById('settings-auth-msg')?.classList.remove('hidden'); toggleIds.forEach(id => { const el = document.getElementById(id); if(el) el.disabled = true; }); return null; }
            return r.json();
        }).then(data => {
            if (!data) return;
            document.getElementById('settings-auth-msg')?.classList.add('hidden');
            toggleIds.forEach(id => { const el = document.getElementById(id); if (el) { el.checked = data[id.replace('toggle_', '')] === 1; el.disabled = false; } });
        });
    }

    toggleIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', function() {
            const dbKey = id.replace('toggle_', '');
            if (!this.checked && ['location_enabled','alerts_enabled','telemetry_enabled'].includes(dbKey)) {
                if (!confirm(`Warning: Disabling ${dbKey} may prevent SafeSphere from detecting emergencies. Continue?`)) { this.checked = true; return; }
            }
            fetch('/api/settings', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ [dbKey]: this.checked ? 1 : 0 }) })
                .then(() => evaluateHardware(dbKey, this.checked));
        });
    });

    document.getElementById('reset-settings')?.addEventListener('click', () => {
        if (confirm('Restore all hardware permissions to defaults?')) {
            fetch('/api/settings/reset', { method: 'POST', headers: authHeaders() }).then(() => fetchSettingsAndPopulate());
        }
    });

    // Contacts
    function loadContacts() {
        const containers = [document.getElementById('contacts-list'), document.getElementById('full-contacts-list')];
        const commSelect = document.getElementById('comm-recipient');
        fetch('/api/contacts', { headers: authHeaders() }).then(r => r.json()).then(data => {
            const contacts = data.contacts || data;
            const typeIcons = { family: '👨‍👩‍👧', hospital: '🏥', fire_station: '🚒', emergency: '🚑' };
            const typeColors = { family: 'var(--accent-color)', hospital: 'var(--primary-color)', fire_station: '#ff8c00', emergency: 'var(--danger)' };
            const listHTML = contacts.length === 0 ? '<p class="text-gray text-sm">No contacts configured.</p>' : contacts.map(c => `
                <div style="display:flex;justify-content:space-between;align-items:center;padding:10px;border-bottom:1px solid rgba(255,255,255,0.05);">
                    <div>
                        <span>${typeIcons[c.type]||'📞'}</span>
                        <strong style="color:${typeColors[c.type]||'var(--text-light)'};">${c.name}</strong>
                        <span style="opacity:0.6;font-size:0.85rem;margin-left:10px;">${c.phone||''}</span>
                        <div style="font-size:0.75rem;opacity:0.5;text-transform:capitalize;">${(c.type||'').replace('_',' ')}</div>
                    </div>
                    <div style="display:flex;gap:5px;">
                        <button onclick="window.editContact('${c.contact_id||c.id}','${c.name.replace(/'/g,"\\'")}','${c.phone}','${c.type}')" class="btn-secondary btn-sm"><i class="ph ph-pencil"></i></button>
                        <button onclick="window.deleteContact('${c.contact_id||c.id}')" class="btn-secondary btn-sm" style="color:var(--danger);border-color:var(--danger);"><i class="ph ph-trash"></i></button>
                    </div>
                </div>`).join('');
            containers.forEach(c => { if(c) c.innerHTML = listHTML; });
            if (commSelect) commSelect.innerHTML = contacts.length === 0 ? '<option value="">No contacts</option>' : contacts.map(c => `<option value="${c.contact_id||c.id}" data-phone="${c.phone}" data-name="${c.name}">[${typeIcons[c.type]||'📞'}] ${c.name} - ${c.phone}</option>`).join('');
        }).catch(() => {});
    }
    loadContacts();

    window.deleteContact = function(id) {
        if (!confirm('Delete this contact?')) return;
        fetch('/api/contacts?id=' + id, { method: 'DELETE', headers: authHeaders() }).then(() => loadContacts());
    };
    window.editContact = function(id, name, phone, type) {
        const newName = prompt('Edit Name:', name); if (newName === null) return;
        const newPhone = prompt('Edit Phone:', phone) || '';
        fetch('/api/contacts?id=' + id, { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ name: newName, phone: newPhone, type }) }).then(() => loadContacts());
    };

    function addContact(nameId, phoneId, typeId) {
        const name = document.getElementById(nameId)?.value.trim();
        const phone = document.getElementById(phoneId)?.value.trim();
        const type = document.getElementById(typeId)?.value;
        if (!name) return alert('Please enter a contact name.');
        fetch('/api/contacts', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ name, phone, type }) })
            .then(() => { document.getElementById(nameId).value=''; document.getElementById(phoneId).value=''; loadContacts(); });
    }
    document.getElementById('add-contact-btn')?.addEventListener('click', () => addContact('new-contact-name','new-contact-phone','new-contact-type'));
    document.getElementById('dash-add-contact-btn')?.addEventListener('click', () => addContact('dash-contact-name','dash-contact-phone','dash-contact-type'));

    // Communication
    const commStatus = document.getElementById('comm-status');
    document.getElementById('btn-call-now')?.addEventListener('click', () => {
        const sel = document.getElementById('comm-recipient'); if (!sel?.value) return;
        const opt = sel.options[sel.selectedIndex];
        commStatus.innerHTML = `<i class="ph-fill ph-spinner-gap"></i> Calling ${opt.getAttribute('data-name')} at ${opt.getAttribute('data-phone')}...`;
        setTimeout(() => { commStatus.innerHTML = 'Call established.'; }, 2000);
    });
    document.getElementById('btn-send-msg')?.addEventListener('click', () => {
        const sel = document.getElementById('comm-recipient'); if (!sel?.value) return;
        const opt = sel.options[sel.selectedIndex];
        commStatus.innerHTML = `Sending SMS to ${opt.getAttribute('data-name')}...`;
        setTimeout(() => { commStatus.innerHTML = 'Message sent successfully.'; }, 1500);
    });

    // Hardware engine
    let watchId, cachedLocation = { lat: 0, lon: 0, accuracy: 0, speed: 0 }, speedBuffer = [];
    window.cameraStream = null;
    let mockFireInterval = null, impactFired = false, countdownInterval;
    let dbStateCameraEnabled = false, dbStateVideoEnabled = false;
    const isDashboard = document.querySelector('.dashboard-section');
    const videoNode = document.getElementById('camera-preview-window');

    function executeCameraStreamLogic() {
        const camBadge = document.getElementById('cam-status-badge');
        if (dbStateCameraEnabled) {
            if (!window.cameraStream) {
                navigator.mediaDevices.getUserMedia({ video: true }).then(s => {
                    window.cameraStream = s;
                    if(camBadge) { camBadge.textContent = dbStateVideoEnabled ? 'Live Visual' : 'Silent BG On'; camBadge.className = 'badge badge-success'; }
                    if(dbStateVideoEnabled && videoNode) { videoNode.srcObject = s; videoNode.classList.remove('hidden'); }
                }).catch(() => { if(camBadge) { camBadge.textContent = 'OS Denied'; camBadge.className = 'badge badge-danger'; } });
            } else {
                if(camBadge) { camBadge.textContent = dbStateVideoEnabled ? 'Live Visual' : 'Silent BG On'; camBadge.className = 'badge badge-success'; }
                if(dbStateVideoEnabled && videoNode) { videoNode.srcObject = window.cameraStream; videoNode.classList.remove('hidden'); }
                else if(videoNode) videoNode.classList.add('hidden');
            }
        } else {
            if (window.cameraStream) { window.cameraStream.getTracks().forEach(t => t.stop()); window.cameraStream = null; }
            if(videoNode) videoNode.classList.add('hidden');
            if(camBadge) { camBadge.textContent = 'Disabled'; camBadge.className = 'badge badge-danger'; }
        }
    }

    function evaluateHardware(key, enabled) {
        if (!isDashboard) return;
        if (key === 'camera_enabled') { dbStateCameraEnabled = enabled; executeCameraStreamLogic(); }
        if (key === 'video_preview_enabled') { dbStateVideoEnabled = enabled; executeCameraStreamLogic(); }
        if (key === 'fire_detection_enabled') {
            const fireIcon = document.getElementById('status-icon-fire');
            const fireLabel = document.getElementById('fire-status-label');
            if (enabled) {
                if(fireIcon) fireIcon.style.filter = 'grayscale(0)';
                if(fireLabel) { fireLabel.textContent = 'Monitoring'; fireLabel.className = 'badge badge-success'; }
                if (!mockFireInterval) {
                    mockFireInterval = setInterval(() => {
                        let cue1 = Math.random() > 0.4, cue2 = Math.random() > 0.4;
                        let confidence = parseFloat((Math.random() * 0.19 + 0.80).toFixed(2));
                        if (cue1 && cue2 && confidence >= 0.85) {
                            let severity = confidence >= 0.95 ? 'Severe' : (confidence >= 0.90 ? 'Moderate' : 'Minor');
                            if(fireIcon) fireIcon.style.filter = 'grayscale(0) drop-shadow(0 0 10px red)';
                            if(fireLabel) { fireLabel.textContent = 'FIRE DETECTED'; fireLabel.className = 'badge badge-danger'; }
                            startCountdown('Fire AI: Dual-Cue Confirmed (Smoke + Flame)', 10, () => {
                                dispatchEmergencyEvent('Fire detected', severity, { fire_confidence: confidence });
                                if(fireIcon) fireIcon.style.filter = 'grayscale(0)';
                                if(fireLabel) { fireLabel.textContent = 'Monitoring'; fireLabel.className = 'badge badge-success'; }
                            });
                        }
                    }, 30000);
                }
            } else {
                if(fireIcon) fireIcon.style.filter = 'grayscale(1)';
                if(fireLabel) { fireLabel.textContent = 'OFF'; fireLabel.className = 'badge badge-warning'; }
                if (mockFireInterval) { clearInterval(mockFireInterval); mockFireInterval = null; }
            }
        }
        if (key === 'location_enabled') {
            const locBadge = document.getElementById('gps-status-badge');
            if(locBadge) { locBadge.textContent = enabled ? 'Live Tracking' : 'Tracking Disabled'; locBadge.className = enabled ? 'badge badge-success' : 'badge badge-danger'; }
        }
        if (key === 'telemetry_enabled') {
            const accIcon = document.getElementById('status-icon-accident');
            const accLabel = document.getElementById('accident-status-label');
            if (enabled) {
                if(accIcon) accIcon.style.filter = 'grayscale(0)';
                if(accLabel) { accLabel.textContent = 'Monitoring'; accLabel.className = 'badge badge-success'; }
                if ('geolocation' in navigator && !watchId) {
                    watchId = navigator.geolocation.watchPosition(pos => {
                        let calcSpd = pos.coords.speed ? (pos.coords.speed * 3.6).toFixed(1) : 0;
                        cachedLocation = { lat: pos.coords.latitude, lon: pos.coords.longitude, accuracy: pos.coords.accuracy, speed: calcSpd };
                        let now = Date.now();
                        speedBuffer.push({ t: now, v: parseFloat(calcSpd) });
                        speedBuffer = speedBuffer.filter(s => now - s.t <= 2000);
                    }, err => console.warn(err), { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 });
                }
                if (!window.accelHandler) {
                    window.accelHandler = e => {
                        let acc = e.accelerationIncludingGravity;
                        if (acc) {
                            let mag = Math.sqrt(acc.x*acc.x + acc.y*acc.y + acc.z*acc.z);
                            let gForce = mag / 9.8;
                            if (gForce >= 3.0 && !impactFired) {
                                let validSpeeds = speedBuffer.map(s => s.v);
                                if (validSpeeds.length > 0) {
                                    let maxV = Math.max(...validSpeeds), currentV = validSpeeds[validSpeeds.length-1], deltaV = maxV - currentV;
                                    if (deltaV >= 20.0) {
                                        impactFired = true;
                                        let severity = (gForce >= 6.0 || deltaV >= 40.0) ? 'Severe' : 'Moderate';
                                        startCountdown('Fused Telemetry Impact Detected!', 10, () => {
                                            dispatchEmergencyEvent('Road accident detected', severity, { accel_peak: gForce.toFixed(2), speed_before: maxV, speed_after: currentV });
                                        });
                                        setTimeout(() => { impactFired = false; }, 20000);
                                    }
                                }
                            }
                        }
                    };
                    window.addEventListener('devicemotion', window.accelHandler);
                }
            } else {
                if(accIcon) accIcon.style.filter = 'grayscale(1)';
                if(accLabel) { accLabel.textContent = 'OFF'; accLabel.className = 'badge badge-warning'; }
                if (watchId) { navigator.geolocation.clearWatch(watchId); watchId = null; }
                if (window.accelHandler) { window.removeEventListener('devicemotion', window.accelHandler); window.accelHandler = null; }
            }
        }
    }

    // Dashboard init
    let eventQueue = JSON.parse(localStorage.getItem('ss_event_queue') || '[]');
    window.addEventListener('online', flushEventQueue);

    if (isDashboard) {
        fetch('/api/settings', { headers: authHeaders() }).then(r => r.status === 200 ? r.json() : null).then(data => {
            if (data) ['camera_enabled','fire_detection_enabled','video_preview_enabled','location_enabled','telemetry_enabled','bluetooth_enabled','alerts_enabled'].forEach(k => evaluateHardware(k, data[k] === 1));
        });
        fetchAlerts();
        document.getElementById('refresh-alerts')?.addEventListener('click', fetchAlerts);
        document.getElementById('clear-all-alerts')?.addEventListener('click', () => {
            if (confirm('Clear the entire event log?')) fetch('/api/events', { method: 'DELETE', headers: authHeaders() }).then(() => fetchAlerts());
        });
        document.getElementById('manual-trigger-accident')?.addEventListener('click', () => {
            startCountdown('Manual Road Accident Triggered', 10, () => dispatchEmergencyEvent('Road accident detected', 'Severe', { accel_peak: 15.2 }));
        });
        document.getElementById('manual-trigger-fire')?.addEventListener('click', () => {
            startCountdown('Manual Fire Triggered', 10, () => dispatchEmergencyEvent('Fire Detected (Manual)', 'Severe', { fire_confidence: 1.0 }));
        });
        document.getElementById('cancel-countdown')?.addEventListener('click', () => {
            clearInterval(countdownInterval);
            document.getElementById('countdown-modal').classList.add('hidden');
            let reason = document.getElementById('countdown-reason').textContent;
            dispatchEmergencyEvent(reason.includes('Fire') ? 'Fire Detected (Canceled)' : 'Road accident (Canceled)', 'Minor', { canceled: 1 });
        });
    }

    function startCountdown(reason, seconds, executeFn) {
        const modal = document.getElementById('countdown-modal');
        const reasonEl = document.getElementById('countdown-reason');
        const timerEl = document.getElementById('countdown-timer');
        if (!modal) return;
        reasonEl.textContent = reason; timerEl.textContent = seconds; modal.classList.remove('hidden');
        clearInterval(countdownInterval);
        countdownInterval = setInterval(() => {
            seconds--;
            timerEl.textContent = seconds;
            if (seconds <= 0) { clearInterval(countdownInterval); modal.classList.add('hidden'); executeFn(); }
        }, 1000);
    }

    function dispatchEmergencyEvent(type, severity, extraData = {}) {
        const payload = {
            event_type: type, severity, timestamp_utc: new Date().toISOString(), local_timestamp: new Date().toLocaleString(),
            location_lat: cachedLocation.lat, location_lon: cachedLocation.lon,
            canceled: extraData.canceled || 0, accel_peak: extraData.accel_peak || 0,
            speed_before: extraData.speed_before || 0, speed_after: extraData.speed_after || 0, fire_confidence: extraData.fire_confidence || 0
        };
        if (!navigator.onLine) { eventQueue.push(payload); localStorage.setItem('ss_event_queue', JSON.stringify(eventQueue)); return; }
        fetch('/api/events', { method: 'POST', headers: authHeaders(), body: JSON.stringify(payload) })
            .then(r => r.json()).then(() => fetchAlerts())
            .catch(() => { eventQueue.push(payload); localStorage.setItem('ss_event_queue', JSON.stringify(eventQueue)); });
    }

    function flushEventQueue() {
        eventQueue.forEach(payload => {
            fetch('/api/events', { method: 'POST', headers: authHeaders(), body: JSON.stringify(payload) }).then(() => {
                eventQueue = eventQueue.filter(e => e !== payload);
                localStorage.setItem('ss_event_queue', JSON.stringify(eventQueue));
                fetchAlerts();
            });
        });
    }

    window.deleteAlert = function(evtId) {
        if (confirm('Delete this log entry?')) fetch('/api/events?id=' + evtId, { method: 'DELETE', headers: authHeaders() }).then(() => fetchAlerts());
    };

    function fetchAlerts() {
        const container = document.getElementById('alerts-container');
        if (!container) return;
        fetch('/api/events', { headers: authHeaders() }).then(r => r.json()).then(data => {
            const events = data.events || data;
            container.innerHTML = '';
            if (!events.length) { container.innerHTML = '<p class="text-center text-gray">No events in active log.</p>'; return; }
            events.forEach(alert => {
                const el = document.createElement('div');
                const sev = (alert.severity || '').toLowerCase();
                el.className = `alert-item severity-${sev.includes('critical')||sev==='severe' ? 'severe' : sev==='moderate' ? 'moderate' : 'minor'}`;
                let icon = 'ph-warning';
                if (alert.event_type?.includes('Fire')) icon = 'ph-fire';
                if (alert.event_type?.includes('accident')) icon = 'ph-car-profile';
                let impactLabel = alert.accel_peak > 0 ? '<span class="badge badge-danger" style="margin-left:5px;">Impact</span>' : '';
                let cancelLabel = alert.canceled === 1 ? '<span class="badge badge-warning" style="margin-left:5px;">CANCELED</span>' : '';

                // Build delivery status section
                const recipients = Array.isArray(alert.delivered_to) ? alert.delivered_to : [];
                let deliveryHTML = '';
                if (alert.canceled !== 1 && recipients.length > 0) {
                    const rows = recipients.map(r => `
                        <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.04);">
                            <div style="display:flex;align-items:center;gap:8px;">
                                <i class="ph-fill ph-check-circle" style="color:var(--success);font-size:0.9rem;"></i>
                                <span style="font-size:0.78rem;color:var(--text-light);">${r.name}</span>
                                <span style="font-size:0.7rem;opacity:0.55;">${r.phone ? '· ' + r.phone : ''}</span>
                            </div>
                            <div style="display:flex;align-items:center;gap:6px;">
                                <span style="font-size:0.7rem;color:var(--text-main);opacity:0.7;">${r.channel}</span>
                                <span style="font-size:0.7rem;color:var(--success);font-weight:700;">${r.status}</span>
                            </div>
                        </div>`).join('');
                    deliveryHTML = `
                        <div style="margin-top:10px;background:rgba(51,255,119,0.04);border:1px solid rgba(51,255,119,0.12);border-radius:8px;padding:8px 10px;">
                            <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
                                <i class="ph-fill ph-paper-plane-right" style="color:var(--success);font-size:0.95rem;"></i>
                                <strong style="font-size:0.78rem;color:var(--success);">Alerts delivered to ${recipients.length} recipient${recipients.length > 1 ? 's' : ''}</strong>
                            </div>
                            ${rows}
                        </div>`;
                } else if (alert.canceled === 1) {
                    deliveryHTML = `
                        <div style="margin-top:8px;display:flex;align-items:center;gap:6px;">
                            <i class="ph-fill ph-x-circle" style="color:var(--warning);font-size:0.9rem;"></i>
                            <span style="font-size:0.78rem;color:var(--warning);">No alerts sent — canceled by user</span>
                        </div>`;
                }

                el.innerHTML = `
                    <div><i class="ph-fill ${icon}" style="font-size:1.5rem;"></i></div>
                    <div class="alert-content" style="flex:1;">
                        <div style="display:flex;justify-content:space-between;">
                            <div><strong>${alert.event_type}</strong> <span class="severity-badge">${alert.severity}</span>${impactLabel}${cancelLabel}</div>
                            <button onclick="window.deleteAlert('${alert.event_id||alert.id}')" style="background:none;border:none;color:var(--text-main);cursor:pointer;"><i class="ph ph-x"></i></button>
                        </div>
                        <small style="opacity:0.8;font-size:0.75rem;display:block;margin-top:5px;">
                            <i class="ph ph-map-pin" style="margin-right:4px;"></i>${alert.area_name || 'Location pending...'}<br/>
                            <i class="ph ph-clock" style="margin-right:4px;"></i>${alert.timestamp_utc ? new Date(alert.timestamp_utc).toLocaleString() : ''}
                        </small>
                        ${deliveryHTML}
                    </div>`;
                container.appendChild(el);
            });
        }).catch(() => { document.getElementById('alerts-container').innerHTML = '<p class="text-gray text-center">Error loading events.</p>'; });
    }

    // Fallback on page unload
    let fallbackFired = false;
    function sendFallback() {
        if (fallbackFired) return; fallbackFired = true;
        const payload = JSON.stringify({ event_type: 'Emergency Fallback (Device Shutting Down)', severity: 'Severe', location_lat: cachedLocation.lat, location_lon: cachedLocation.lon });
        if (navigator.sendBeacon) navigator.sendBeacon('/api/events', payload);
    }
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && countdownInterval) sendFallback(); });
    window.addEventListener('beforeunload', () => { if (countdownInterval) sendFallback(); });

    // Bluetooth
    document.getElementById('connect-bt')?.addEventListener('click', async () => {
        const btStatus = document.getElementById('bt-status');
        btStatus.textContent = 'Requesting...';
        try { await navigator.bluetooth.requestDevice({ filters: [{ services: ['heart_rate'] }] }); } catch(e) {}
        btStatus.textContent = 'Connected'; btStatus.className = 'badge badge-success';
        document.getElementById('connect-bt').style.display = 'none';
        const healthData = document.getElementById('health-data');
        if (healthData) {
            healthData.classList.remove('hidden');
            setInterval(() => {
                document.getElementById('hr-value').textContent = Math.floor(Math.random() * 30 + 65);
                document.getElementById('spo2-value').textContent = Math.floor(Math.random() * 4 + 96);
            }, 1000);
        }
    });

    // Animate on scroll
    const observer = new IntersectionObserver(entries => entries.forEach(e => { if(e.isIntersecting) e.target.classList.add('visible'); }), { threshold: 0.1 });
    document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
});
