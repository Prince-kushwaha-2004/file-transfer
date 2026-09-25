import { createServerFn } from '@tanstack/react-start';

export type DeviceRole = 'idle' | 'sender' | 'receiver';

export type DiscoveredDevice = {
  id: string;
  code: string;
  name: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  role: DeviceRole;
  room: string;
  os?: string;
  browser?: string;
  lastSeen: number;
};

// Global in-memory device registry
const activeDevices = new Map<string, DiscoveredDevice>();

function cleanStaleDevices() {
  const now = Date.now();
  for (const [id, device] of activeDevices.entries()) {
    // If no heartbeat for 15 seconds, remove
    if (now - device.lastSeen > 15000) {
      activeDevices.delete(id);
    }
  }
}

export const registerDeviceServerFn = createServerFn({ method: 'POST' })
  .validator((data: {
    id: string;
    code?: string;
    name: string;
    deviceType: 'desktop' | 'mobile' | 'tablet';
    role?: DeviceRole;
    room?: string;
    os?: string;
    browser?: string;
  }) => data)
  .handler(async ({ data }) => {
    cleanStaleDevices();
    if (!data.id) return { success: false, error: 'No ID provided' };

    activeDevices.set(data.id, {
      id: data.id,
      code: data.code || '',
      name: data.name || 'Device',
      deviceType: data.deviceType || 'desktop',
      role: data.role || 'idle',
      room: (data.room || 'default').trim().toLowerCase(),
      os: data.os,
      browser: data.browser,
      lastSeen: Date.now(),
    });

    return { success: true };
  });

export const getNearbyDevicesServerFn = createServerFn({ method: 'POST' })
  .validator((params: { room?: string; excludeId?: string; roleFilter?: DeviceRole }) => params)
  .handler(async ({ data }) => {
    cleanStaleDevices();
    const targetRoom = (data.room || 'default').trim().toLowerCase();
    const result: DiscoveredDevice[] = [];

    for (const [id, device] of activeDevices.entries()) {
      if (id !== data.excludeId && device.room === targetRoom) {
        if (!data.roleFilter || device.role === data.roleFilter) {
          result.push(device);
        }
      }
    }

    return { devices: result };
  });

export const getDeviceByCodeServerFn = createServerFn({ method: 'POST' })
  .validator((params: { code: string }) => params)
  .handler(async ({ data }) => {
    cleanStaleDevices();
    const targetCode = data.code.replace(/\s+/g, '').trim();
    if (!targetCode) return { found: false };

    for (const [_, device] of activeDevices.entries()) {
      if (device.code && device.code.replace(/\s+/g, '') === targetCode) {
        return {
          found: true,
          device: {
            id: device.id,
            name: device.name,
            deviceType: device.deviceType,
            role: device.role,
          },
        };
      }
    }

    return { found: false };
  });

export const unregisterDeviceServerFn = createServerFn({ method: 'POST' })
  .validator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    if (data.id) {
      activeDevices.delete(data.id);
    }
    return { success: true };
  });
